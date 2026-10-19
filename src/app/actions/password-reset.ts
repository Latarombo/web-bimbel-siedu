'use server';

import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';
import { redirect, getPathname } from '@/i18n/navigation';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { generateSecureToken, hashToken } from '@/lib/token';
import { sendPasswordResetEmail } from '@/lib/mail';
import { checkRateLimit, checkCooldown, getClientIp } from '@/lib/rate-limit';

export type ForgotPasswordState = {
  success?: boolean;
  error?: string;
  email?: string;
  cooldownRemaining?: number;
};

export type ResetPasswordState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

/**
 * Meminta link reset password.
 * Menerapkan prinsip keamanan anti-enumerasi dan rate limiting (OWASP standard):
 * - Rate limit per IP: Max 5 request / 15 menit
 * - Cooldown per email: 60 detik jeda antar pengiriman
 * - Quota per email: Max 5 request / 1 jam
 * - Cooldown persisten via tabel password_reset_tokens di database
 */
export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: 'auth' });
  const rawEmail = String(formData.get('email') ?? '');

  const parsed = emailSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return {
      error: t('invalidEmail'),
      email: rawEmail,
    };
  }

  const normalizedEmail = parsed.data.email;

  // 1. Proteksi per IP: cegah bot membanjiri request
  const headerList = await headers();
  const clientIp = getClientIp(headerList);
  const ipRate = checkRateLimit(`pwd_reset_ip:${clientIp}`, 5, 15 * 60 * 1000);
  if (!ipRate.allowed) {
    return {
      error: t('rateLimitIpExceeded'),
      email: rawEmail,
      cooldownRemaining: ipRate.retryAfterSeconds,
    };
  }

  // 2. Cooldown per email (in-memory): cegah spam klik berulang kali (60 detik)
  const emailCooldown = checkCooldown(`pwd_reset_email_cd:${normalizedEmail}`, 60 * 1000);
  if (!emailCooldown.allowed) {
    return {
      error: t('rateLimitCooldown', { seconds: emailCooldown.retryAfterSeconds }),
      email: normalizedEmail,
      cooldownRemaining: emailCooldown.retryAfterSeconds,
    };
  }

  // 3. Batas kuota per email: Max 5 request dalam 1 jam
  const emailHourly = checkRateLimit(`pwd_reset_email_hr:${normalizedEmail}`, 5, 60 * 60 * 1000);
  if (!emailHourly.allowed) {
    return {
      error: t('rateLimitEmailExceeded'),
      email: normalizedEmail,
      cooldownRemaining: emailHourly.retryAfterSeconds,
    };
  }

  try {
    const user = await db.orm.public.User.where((u) => u.email.eq(normalizedEmail)).first();

    if (user) {
      // 4. Cooldown persisten via database (bila server restart / multiple cluster)
      const existingToken = await db.orm.public.PasswordResetToken.where((t) => t.email.eq(normalizedEmail)).first();
      if (existingToken) {
        const elapsed = Date.now() - new Date(existingToken.createdAt).getTime();
        const cooldownMs = 60 * 1000;
        if (elapsed < cooldownMs) {
          const remainingSeconds = Math.max(1, Math.ceil((cooldownMs - elapsed) / 1000));
          return {
            error: t('rateLimitCooldown', { seconds: remainingSeconds }),
            email: normalizedEmail,
            cooldownRemaining: remainingSeconds,
          };
        }
      }

      const rawToken = generateSecureToken();
      const tokenHash = hashToken(rawToken);

      // Bersihkan token lama untuk email yang sama sebelum membuat yang baru
      await db.orm.public.PasswordResetToken.where((t) => t.email.eq(normalizedEmail)).delete();

      // Masa berlaku token: 1 jam dari sekarang
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await db.orm.public.PasswordResetToken.create({
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      });

      // Tentukan base origin secara dinamis
      const host = headerList.get('host');
      const proto = headerList.get('x-forwarded-proto') ?? 'http';
      const origin = process.env.AUTH_URL || (host ? `${proto}://${host}` : 'http://localhost:3000');

      const localizedPath = getPathname({ href: `/reset-password/${rawToken}`, locale });
      const resetUrl = `${origin}${localizedPath}`;

      await sendPasswordResetEmail({
        to: normalizedEmail,
        resetUrl,
        locale,
      });
    }

    return {
      success: true,
      email: normalizedEmail,
      cooldownRemaining: 60,
    };
  } catch (err) {
    console.error('[PASSWORD RESET ERROR]', err);
    return {
      error: t('checkForm'),
      email: rawEmail,
    };
  }
}

/**
 * Verifikasi validitas token reset di sisi server (Server Component).
 */
export async function verifyResetToken(
  rawToken: string,
): Promise<{ valid: boolean; email?: string; reason?: 'not_found' | 'expired' }> {
  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, reason: 'not_found' };
  }

  const tokenHash = hashToken(rawToken);
  const record = await db.orm.public.PasswordResetToken.where({ tokenHash }).first();

  if (!record) {
    return { valid: false, reason: 'not_found' };
  }

  const expiresTime = new Date(record.expiresAt).getTime();
  if (expiresTime < Date.now()) {
    // Hapus token yang sudah hangus
    await db.orm.public.PasswordResetToken.where({ tokenHash }).delete();
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, email: record.email };
}

/**
 * Mengeksekusi perubahan kata sandi baru.
 */
export async function executePasswordReset(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: 'auth' });

  const rawToken = String(formData.get('token') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const passwordConfirm = String(formData.get('password_confirm') ?? '');

  const fieldErrors: Record<string, string> = {};

  if (!password || password.length < 8) {
    fieldErrors['password'] = t('passwordMin');
  }

  if (password !== passwordConfirm) {
    fieldErrors['password_confirm'] = t('passwordMismatch');
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (!rawToken) {
    return { error: t('invalidOrExpiredToken') };
  }

  const tokenHash = hashToken(rawToken);
  const record = await db.orm.public.PasswordResetToken.where({ tokenHash }).first();

  if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
    if (record) {
      await db.orm.public.PasswordResetToken.where({ tokenHash }).delete();
    }
    return { error: t('invalidOrExpiredToken') };
  }

  const user = await db.orm.public.User.where((u) => u.email.eq(record.email)).first();
  if (!user) {
    return { error: t('invalidOrExpiredToken') };
  }

  // Hash password baru dengan bcrypt salt 10
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update password user
  await db.orm.public.User.where({ id: user.id }).update({
    password: hashedPassword,
  });

  // Hapus seluruh token reset untuk email ini (single-use)
  await db.orm.public.PasswordResetToken.where((t) => t.email.eq(record.email)).delete();

  // Kembalikan state sukses agar antarmuka bertransisi langsung ke Kartu Sukses Mandiri (Opsi A)
  return { success: true };
}
