import AuthTopBar from '@/components/auth/top-bar';
import { Link, redirect } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import LoginForm from '@/components/LoginForm';
import WaveAnimation from '@/components/WaveAnimation';
import { SITE } from '@/lib/site';
import { auth } from '@/lib/auth';
import { googleOAuthEnabled } from '@/lib/oauth';
import { homeUntukUser } from '@/lib/orang-tua-lengkap';

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
            <AuthTopBar />

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
