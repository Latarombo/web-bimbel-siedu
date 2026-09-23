import AuthTopBar from '@/components/auth/top-bar';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import WaveAnimation from '@/components/WaveAnimation';
import { SITE } from '@/lib/site';

/*
 * Cangkang halaman wizard registrasi (3 langkah) — dulu kerangka header/hero/
 * wave/footer/dekor diduplikasi verbatim di tiap page; sekarang satu sumber
 * supaya perubahan desain tidak perlu diulang tiga kali (dan footer link
 * memakai <Link>, bukan <a> penuh-reload seperti salinan lama).
 */
export default async function RegisterShell({
    heading,
    children,
}: {
    heading: string;
    children: React.ReactNode;
}) {
    const t = await getTranslations('auth');
    return (
        <div className="relative flex min-h-dvh flex-col overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400">
            {/* Top Bar */}
            <AuthTopBar />

            {/* Main Content — container terbatas + center, sama pola login */}
            <main className="grow flex flex-col lg:flex-row items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-0 z-10 w-full max-w-7xl mx-auto">
                {/* Left Side - Hero */}
                <div className="lg:w-1/2 mb-10 lg:mb-0 text-center lg:text-left">
                    <h1 className="text-2xl sm:text-3xl xl:text-[40px] font-bold text-white leading-tight mb-8">
                        {heading}
                    </h1>
                    <div className="flex justify-center lg:justify-start">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/hero-illustration.png"
                            alt={t('studyIllustration')}
                            className="max-w-full h-auto max-h-112.5 object-contain drop-shadow-2xl"
                        />
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="lg:w-1/2 flex justify-center lg:justify-end">{children}</div>
            </main>

            {/* Wave Animation */}
            <WaveAnimation />

            {/* Footer */}
            <footer className="px-4 py-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-white text-xs sm:text-sm z-10 gap-3">
                <p className="text-center sm:text-left">
                    {t('copyright', {year: new Date().getFullYear(), name: SITE.nama})}
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

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100 rounded-full mix-blend-overlay filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-overlay filter blur-3xl opacity-80 translate-y-1/2 -translate-x-1/2"></div>
        </div>
    );
}
