import { LanguageSwitcher } from '@/components/language-switcher';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import LoginForm from '@/components/LoginForm';
import WaveAnimation from '@/components/WaveAnimation';
import { SITE } from '@/lib/site';
import { auth } from '@/lib/auth';
import { googleOAuthEnabled } from '@/lib/oauth';
import { homeUntukUser } from '@/lib/orang-tua-lengkap';
import { redirect } from '@/i18n/navigation';

export async function generateMetadata() {
    const t = await getTranslations('auth');
    return { title: t('login') };
}
export const dynamic = 'force-dynamic';

// Pesan error OAuth yang aman ditampilkan — OAuthAccountNotLinked terjadi saat
// email Google cocok dengan akun password existing (core menolak auto-link).


// Dashboard sesuai role — lihat homeUntukUser() di lib/orang-tua-lengkap.ts
// (satu sumber kebenaran dengan actions/login.ts & tembok layout parent).

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string; error?: string }>;
}) {
    const t = await getTranslations('auth');
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
    OAuthAccountNotLinked:
        t('oauthNotLinked'),
    OAuthCallbackError:
        t('oauthCallback'),
    AccessDenied: t('oauthDenied'),
};
    const locale = await getLocale();
    const { next, error: oauthError } = await searchParams;

    // Skenario "sudah login klik Login lagi": session aktif → langsung dashboard
    // sesuai role (kecuali ada ?next= spesifik yang belum dituju).
    // Orang tua yang belum menuntaskan step 2 dikirim ke step 2 — gerbang layout
    // parent akan menendangnya dari /home juga, jadi diarahkan langsung lebih bersih.
    // UX (ui-ux-pro-max Navigation): jangan paksa isi ulang form untuk state yang sudah ada.
    const session = await auth();
    if (session?.user) {
    const target =
    next && next.startsWith('/') && !next.startsWith('//')
    ? next.replace(/^\/(?:en|id)(?=\/(?!\/)|[?#]|$)/, '') || '/'
    : await homeUntukUser({
    id: Number(session.user.id),
    role: session.user.role,
    });
    return redirect({href: target, locale});
    }

    return (
        <div className="relative flex min-h-dvh flex-col overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400">
            {/* Top Bar */}
            <header className="flex justify-between items-center px-4 py-5 sm:px-6 lg:px-8 z-10">
                {/* Logo */}
                <Link href="/" className="flex items-center" aria-label={t('homeAria')}>
                <Image src="/images/Logo-white.png" alt="Siedu" width={110} height={33} className="h-7 w-auto" priority />
                </Link>

                {/* Bantuan Button */}
                <Link
                    href="/#faq"
                    className="flex items-center space-x-2 bg-white text-gray-800 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-md"
                >
                    <svg
                        className="w-5 h-5 text-gray-600"
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
            </header>

            {/* Main Content — container terbatas + center, tetap center saat zoom out */}
            <main className="grow flex flex-col lg:flex-row items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-0 z-10 w-full max-w-7xl mx-auto">
                {/* Left Side - Hero */}
                <div className="lg:w-1/2 mb-10 lg:mb-0 text-center lg:text-left">
                    <h1 className="text-2xl sm:text-3xl xl:text-[40px] font-bold text-white leading-tight mb-8">
                        {t('authHero')}
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

                {/* Right Side - Login Form */}
                <div className="lg:w-1/2 flex justify-center lg:justify-end">
                    <LoginForm
                        next={next}
                        googleEnabled={googleOAuthEnabled}
                        oauthError={
                            oauthError ? OAUTH_ERROR_MESSAGES[oauthError] : undefined
                        }
                    />
                </div>
            </main>

            {/* Wave Animation */}
            <WaveAnimation />

            {/* Footer */}
            <footer className="px-4 py-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-white text-xs sm:text-sm z-10 gap-3">
                <p className="text-center sm:text-left">
                    {t('copyright', {year: new Date().getFullYear(), name: SITE.nama})}
                </p>
                <div className="flex items-center space-x-4 text-white/90">
                    <div className="rounded-lg bg-white px-3 py-2"><LanguageSwitcher /></div>
                    <Link href="/privacy-policy" className="hover:text-white">
                        {t('privacy')}
                    </Link>
                    <span className="hidden sm:inline">•</span>
                    <Link href="/terms" className="hover:text-white">
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
