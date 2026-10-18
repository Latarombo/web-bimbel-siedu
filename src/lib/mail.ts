import nodemailer from 'nodemailer';
import path from 'node:path';
import fs from 'node:fs';

export type SendResetEmailParams = {
  to: string;
  resetUrl: string;
  locale?: string;
};

export type SendEmailResult = {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Mengirimkan email reset kata sandi kepada pengguna.
 * Jika kredensial SMTP belum diisi (mode development/simulasi), tautan akan dicetak ke terminal
 * agar alur pengembangan dan pengujian tidak terhambat.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  locale = 'id',
}: SendResetEmailParams): Promise<SendEmailResult> {
  const host = process.env['SMTP_HOST'] || 'smtp.gmail.com';
  const port = Number(process.env['SMTP_PORT'] || 465);
  const secure = process.env['SMTP_SECURE'] === 'true' || port === 465;
  const user = process.env['SMTP_USER']?.trim();
  const pass = process.env['SMTP_PASS']?.replace(/\s+/g, '').trim();
  const from = process.env['SMTP_FROM']?.trim() || 'Siedu Bimbel <noreply@siedu.id>';

  // Mode Simulasi / Dev-first jika kredensial belum ada di .env
  if (!user || !pass) {
    console.log('\n============================================================');
    console.log(' [SIEDU EMAIL SIMULATION / DEV MODE]');
    console.log(` To       : ${to}`);
    console.log(` Subject  : Atur Ulang Kata Sandi Akun Siedu`);
    console.log(` Reset URL: ${resetUrl}`);
    console.log(' Masa aktif link: 1 jam');
    console.log(' (Isi SMTP_USER & SMTP_PASS di .env untuk kirim via Gmail riil)');
    console.log('============================================================\n');
    return { success: true, simulated: true };
  }

  const isEn = locale === 'en';
  const subject = isEn
    ? 'Reset Your Siedu Account Password'
    : 'Atur Ulang Kata Sandi Akun Siedu';

  // Periksa keberadaan file logo resmi Siedu
  const logoPath = path.join(process.cwd(), 'public', 'images', 'Logo.png');
  const hasLogo = fs.existsSync(logoPath);

  const htmlContent = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (Stripe & Linear Minimalist Style) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
          
          <!-- Header Area with Logo -->
          <tr>
            <td style="padding: 36px 36px 24px 36px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              ${
                hasLogo
                  ? `<img src="cid:siedu-logo" alt="Siedu" width="145" style="display: block; margin: 0 auto; max-width: 145px; height: auto; border: 0;" />`
                  : `<h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px;">SIEDU</h1>`
              }
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500; letter-spacing: -0.1px;">
                Bimbingan Belajar &amp; Sistem Edukasi Terpadu
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                ${isEn ? 'Reset Your Password' : 'Atur Ulang Kata Sandi'}
              </h2>
              
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                ${
                  isEn
                    ? `Hello, we received a request to reset the password for your Siedu account associated with <strong>${to}</strong>.`
                    : `Halo, kami menerima permintaan untuk mengatur ulang kata sandi akun Siedu yang terdaftar dengan alamat email <strong>${to}</strong>.`
                }
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                ${
                  isEn
                    ? 'Click the button below to choose a new password:'
                    : 'Silakan klik tombol di bawah ini untuk membuat kata sandi baru:'
                }
              </p>

              <!-- Primary Action CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); transition: background-color 0.2s ease;">
                      ${isEn ? 'Reset Password' : 'Atur Ulang Kata Sandi'}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Information Box (High Trust Badge) -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 10px; padding: 14px 18px; margin-bottom: 28px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #1e40af;">
                  ${isEn ? 'Security Notice:' : 'Catatan Keamanan:'}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #1e3a8a; line-height: 1.5;">
                  &bull; ${
                    isEn
                      ? 'This link will expire in <strong>60 minutes (1 hour)</strong>.'
                      : 'Tautan ini hanya berlaku selama <strong>60 menit (1 jam)</strong>.'
                  }
                </p>
                <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.5;">
                  &bull; ${
                    isEn
                      ? 'If you did not request this, you can safely ignore this email. Your password will remain unchanged.'
                      : 'Jika Anda tidak merasa meminta ini, abaikan email ini dengan aman. Kata sandi akun Anda tidak akan berubah.'
                  }
                </p>
              </div>

              <!-- Fallback Plaintext Link Box -->
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                ${
                  isEn
                    ? 'Having trouble with the button? Copy and paste this URL into your web browser:'
                    : 'Tombol di atas tidak berfungsi? Salin dan tempel tautan berikut ke browser Anda:'
                }
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; word-break: break-all;">
                <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline; font-size: 12px; line-height: 1.5;">${resetUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                ${
                  isEn
                    ? 'This is an automated email from Siedu. Please do not reply directly to this message.'
                    : 'Email otomatis ini dikirim oleh sistem Siedu. Mohon tidak membalas email ini secara langsung.'
                }
              </p>
              <p style="margin: 0; font-size: 12px; font-weight: 500; color: #64748b;">
                &copy; ${new Date().getFullYear()} Siedu &bull; Sistem Edukasi Sekolah Terpadu.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = isEn
    ? `Hello,\n\nWe received a request to reset your Siedu account password (${to}).\n\nPlease visit the following link to choose a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\nSiedu - Sistem Edukasi Sekolah Terpadu`
    : `Halo,\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun Siedu Anda (${to}).\n\nSilakan kunjungi tautan berikut untuk membuat kata sandi baru (berlaku 1 jam):\n${resetUrl}\n\nJika Anda tidak meminta ini, abaikan email ini dengan aman.\n\nSiedu - Sistem Edukasi Sekolah Terpadu`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent,
      attachments: hasLogo
        ? [
            {
              filename: 'logo.png',
              path: logoPath,
              cid: 'siedu-logo',
            },
          ]
        : [],
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        Importance: 'High',
      },
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[SIEDU EMAIL ERROR] Gagal mengirim email via SMTP:', errorMsg);
    // Fallback log ke konsol agar pengujian lokal tidak mandek karena masalah jaringan/kredensial
    console.log('\n[FALLBACK DEV LOG] Reset Password Link:');
    console.log(`To: ${to}`);
    console.log(`URL: ${resetUrl}\n`);
    return { success: false, error: errorMsg, simulated: true };
  }
}
