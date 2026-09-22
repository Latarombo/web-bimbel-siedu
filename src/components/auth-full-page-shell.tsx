import Image from "next/image";
import { LanguageSwitcher } from '@/components/language-switcher';
import { Link } from '@/i18n/navigation';
import WaveAnimation from '@/components/WaveAnimation';
import { SITE } from '@/lib/site';
import { getTranslations } from 'next-intl/server';

/**
 * Shell full-page untuk halaman auth yang berdiri sendiri (forgot-password,
 * reset-password). Mirip layout halaman login — blue gradient, header
 * (logo + bantuan + bahasa), footer, wave animation — tapi tanpa hero/ilustrasi.
 * Card form dirender centered di tengah.
 *
 * AuthShell lama tetap dipakai untuk halaman yang embed di dalam layout lain
 * (register step, edit anak).
 */
export async function AuthFullPageShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('auth');

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400">
      {/* Header — logo kiri, bantuan + bahasa kanan (konsisten dgn login) */}
      <header className="flex justify-between items-center px-4 py-5 sm:px-6 lg:px-8 z-10">
        <Link href="/" className="flex items-center" aria-label={t('homeAria')}>
          <Image src="/images/Logo-white.png" alt="Siedu" width={110} height={33} className="h-7 w-auto" priority />
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/#faq"
            className="flex items-center space-x-2 bg-white text-gray-800 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-md text-xs sm:text-sm"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{t('help')}</span>
          </Link>
          <LanguageSwitcher variant="auth" placement="bottom" align="right" />
        </div>
      </header>

      {/* Main — card centered */}
      <main className="grow flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Wave Animation */}
      <WaveAnimation />

      {/* Footer */}
      <footer className="px-4 py-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-white text-xs sm:text-sm z-10 gap-3">
        <p className="text-center sm:text-left">
          {t('copyright', { year: new Date().getFullYear(), name: SITE.nama })}
        </p>
        <div className="flex items-center space-x-4 text-white/90">
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            {t('privacy')}
          </Link>
          <span className="hidden sm:inline opacity-60">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">
            {t('terms')}
          </Link>
        </div>
      </footer>

      {/* Decorative Background Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100 rounded-full mix-blend-overlay filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-overlay filter blur-3xl opacity-80 translate-y-1/2 -translate-x-1/2"></div>
    </div>
  );
}
