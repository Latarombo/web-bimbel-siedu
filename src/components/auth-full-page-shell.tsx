import AuthTopBar from "@/components/auth/top-bar";
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
      <AuthTopBar />

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
