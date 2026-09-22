"use client";
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Field, Input } from "@/components/ui/field";
import { Link } from '@/i18n/navigation';

/**
 * Forgot-password form — desain mengikuti referensi Midtrans.
 *
 * Heading + subtitle centered, email field, tombol "Reset Password" full-width,
 * link "Kembali ke masuk" di bawah. Setelah submit (dummy), tampilkan
 * success state inline: ikon check + pesan konfirmasi.
 */
export default function ForgotForm() {
  const t = useTranslations('auth');
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  if (submitted) {
    return (
      <div className="text-center py-4">
        {/* Success icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-7 w-7 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {t('resetSentTitle')}
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {t('resetSentDesc', { email })}
        </p>

        <Link
          href="/login"
          className="inline-block text-sm font-semibold text-brand hover:text-brand-strong hover:underline transition-colors"
        >
          {t('backLogin')}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Heading & Subtitle — centered (referensi Midtrans) */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-[22px] sm:leading-[1.3] font-bold text-slate-900 mb-2">
          {t('forgotTitle')}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          {t('forgotSubtitle')}
        </p>
      </div>

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          /* Dummy submit — akan diganti server action saat backend siap */
          setSubmitted(true);
        }}
      >
        <Field label={t('email')} required>
          <Input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('forgotEmailPlaceholder')}
          />
        </Field>

        {/* Submit — full-width brand button (konsisten dgn login) */}
        <button
          type="submit"
          className="w-full bg-brand hover:bg-brand-strong text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-xs"
        >
          {t('resetPassword')}
        </button>
      </form>

      {/* Back to login — centered, underlined (referensi Midtrans) */}
      <p className="mt-5 text-center">
        <Link
          href="/login"
          className="text-sm font-semibold text-brand hover:text-brand-strong hover:underline transition-colors"
        >
          {t('backLogin')}
        </Link>
      </p>
    </>
  );
}
