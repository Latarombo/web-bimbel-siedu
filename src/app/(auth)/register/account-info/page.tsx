import Image from 'next/image';
import AccountInfoForm from '@/components/AccountInfoForm';
import WaveAnimation from '@/components/WaveAnimation';
import { SITE } from '@/lib/site';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Lengkapi Akun' };
export const dynamic = 'force-dynamic';

export default async function AccountInfoPage() {
    // Tembok dalam: step 2 hanya untuk orang tua yang baru register.
    const session = await auth();
    if (!session?.user) redirect('/login?next=/register/account-info');
    if (session.user.role !== 'orang_tua') redirect('/login');

    const parent = await db.orm.public.User
        .where({ id: Number(session.user.id) })
        .first();
    if (!parent) redirect('/login?next=/register/account-info');

    // Consent PRD F1 ditagih di step 2 bila belum ada — terjadi pada akun yang
    // dibuat via Google (melewati step 1) atau akun lama pra-kolom consent.
    const needsConsent = !parent.privasiDisetujuiAt || !parent.waliDisetujuiAt;
    const isGoogle = Boolean(parent.googleSub);

    return (
        <div className="min-h-screen flex flex-col bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400 relative overflow-hidden">
            {/* Top Bar */}
            <header className="flex justify-between items-center px-6 sm:px-10 py-5 z-10">
                <a href="/" className="flex items-center rounded-full bg-white px-4 py-1.5 shadow-md" aria-label="Siedu — beranda">
                    <Image src="/images/Logo.png" alt="Siedu" width={110} height={33} className="h-7 w-auto" priority />
                </a>
                <span className="text-white/90 text-sm">
                    Registrasi — Langkah 2 dari 3
                </span>
            </header>

            {/* Main Content — sama pola login/register */}
            <main className="grow flex flex-col lg:flex-row items-center justify-center px-6 sm:px-10 py-8 lg:py-0 z-10 w-full max-w-7xl mx-auto">
                {/* Left Side - Hero */}
                <div className="lg:w-1/2 mb-10 lg:mb-0 text-center lg:text-left">
                    <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-white leading-tight mb-8">
                        Satu Langkah Lagi Menuju Akun Lengkap
                    </h1>
                    <div className="flex justify-center lg:justify-start">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/hero-illustration.png"
                            alt="Ilustrasi siswa belajar"
                            className="max-w-full h-auto max-h-112.5 object-contain drop-shadow-2xl"
                        />
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="lg:w-1/2 flex justify-center lg:justify-end">
                    <AccountInfoForm
                        needsConsent={needsConsent}
                        isGoogle={isGoogle}
                        currentName={parent.name}
                    />
                </div>
            </main>

            {/* Wave Animation */}
            <WaveAnimation />

            {/* Footer */}
            <footer className="px-6 sm:px-10 py-5 flex flex-col sm:flex-row justify-between items-center text-white text-xs sm:text-sm z-10 gap-3">
                <p className="text-center sm:text-left">
                    © {new Date().getFullYear()} {SITE.nama} - Sistem Edukasi
                    Sekolah Terpadu. Seluruh Hak Cipta Dilindungi Undang-Undang.
                </p>
                <div className="flex items-center space-x-4 text-white/90">
                    <a href="/privacy-policy" className="hover:text-white">
                        Kebijakan Privasi
                    </a>
                    <span className="hidden sm:inline">•</span>
                    <a href="/terms" className="hover:text-white">
                        Syarat &amp; Ketentuan
                    </a>
                </div>
            </footer>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100 rounded-full mix-blend-overlay filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-overlay filter blur-3xl opacity-80 translate-y-1/2 -translate-x-1/2"></div>
        </div>
    );
}
