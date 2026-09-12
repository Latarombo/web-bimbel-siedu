import Link from 'next/link';
import Image from 'next/image';
import RegisterForm from '@/components/RegisterForm';
import WaveAnimation from '@/components/WaveAnimation';
import { SITE } from '@/lib/site';
import { googleOAuthEnabled } from '@/lib/oauth';

export const metadata = { title: 'Daftar' };

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex flex-col bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400 relative overflow-hidden">
            {/* Top Bar */}
            <header className="flex justify-between items-center px-6 sm:px-10 py-5 z-10">
                {/* Logo */}
                <Link href="/" className="flex items-center rounded-full bg-white px-4 py-1.5 shadow-md" aria-label="Siedu — beranda">
                    <Image src="/images/Logo.png" alt="Siedu" width={110} height={33} className="h-7 w-auto" priority />
                </Link>

                {/* Bantuan Button */}
                <Link
                    href="/about#faq"
                    className="flex items-center space-x-2 bg-white text-gray-800 px-5 py-2.5 rounded-full font-medium hover:bg-gray-100 transition-colors shadow-md"
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
                    <span>Bantuan</span>
                </Link>
            </header>

            {/* Main Content — container terbatas + center, sama pola login */}
            <main className="grow flex flex-col lg:flex-row items-center justify-center px-6 sm:px-10 py-8 lg:py-0 z-10 w-full max-w-7xl mx-auto">
                {/* Left Side - Hero */}
                <div className="lg:w-1/2 mb-10 lg:mb-0 text-center lg:text-left">
                    <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-white leading-tight mb-8">
                        Satu Akun untuk Pantau Perjalanan Belajar Anak Anda
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

                {/* Right Side - Register Form */}
                <div className="lg:w-1/2 flex justify-center lg:justify-end">
                    <RegisterForm googleEnabled={googleOAuthEnabled} />
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
                    <Link href="/privacy-policy" className="hover:text-white">
                        Kebijakan Privasi
                    </Link>
                    <span className="hidden sm:inline">•</span>
                    <Link href="/terms" className="hover:text-white">
                        Syarat &amp; Ketentuan
                    </Link>
                </div>
            </footer>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100 rounded-full mix-blend-overlay filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-overlay filter blur-3xl opacity-80 translate-y-1/2 -translate-x-1/2"></div>
        </div>
    );
}
