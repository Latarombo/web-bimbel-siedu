'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { chrome, type Lang } from '@/lib/i18n';

// Hanya route yang ada di src/app — tidak ada link mati.
const navLinks = (t: (typeof chrome)['id']['nav']) => [
  { name: t.classes, href: '/classes' },
  { name: t.about, href: '/about' },
  { name: t.privacy, href: '/privacy-policy' },
  { name: t.terms, href: '/terms' },
];

interface NavbarProps {
  /** Dashboard sesuai role kalau user sudah login — null saat guest. */
  dashboardHref?: string | null;
  /** Bahasa aktif (cookie `lang`, dibaca di layout server). */
  lang?: Lang;
}

const Navbar = ({ dashboardHref = null, lang = 'id' }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = chrome[lang].nav;
  const links = navLinks(t);

  // Auth buttons — guest: Login + Sign Up; sudah login: Dashboard saja.
  const authButtons = dashboardHref ? (
    <Link
      href={dashboardHref}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-brand-strong transition-colors duration-200"
    >
      {t.dashboard}
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        className="px-4 py-2 text-sm font-medium text-blue-600 border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-colors duration-200"
      >
        {t.login}
      </Link>
      <Link
        href="/register"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-brand-strong transition-colors duration-200"
      >
        {t.signup}
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="flex items-center" aria-label="Siedu — beranda">
              <Image src="/images/Logo.png" alt="Siedu" width={120} height={36} className="h-8 w-auto" priority />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-gray-700 hover:text-blue-600 px-3 py-2 font-medium transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">{authButtons}</div>

          {/* Mobile: CTA compact terlihat + hamburger — CTA jangan sembunyi di balik menu */}
          <div className="md:hidden flex items-center gap-2">
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                className="flex h-10 items-center px-3.5 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-brand-strong transition-colors duration-200"
              >
                {t.dashboard}
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex h-10 items-center px-3.5 text-sm font-semibold text-blue-600 border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-colors duration-200"
              >
                {t.login}
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="grid h-11 w-11 place-items-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full focus-visible:outline-2 focus-visible:outline-blue-600 transition-colors duration-200"
              aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu — CTA ter-pin di bawah gaya A11.studio */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100">
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center min-h-11 px-3 text-base font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-gray-100">
              {dashboardHref ? (
                <Link
                  href={dashboardHref}
                  className="flex min-h-11 items-center justify-center px-6 py-2.5 text-base font-semibold text-white bg-blue-600 rounded-full hover:bg-brand-strong"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t.dashboard}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex min-h-11 items-center justify-center px-6 py-2.5 text-base font-semibold text-blue-600 border-2 border-blue-600 rounded-full hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t.login}
                  </Link>
                  <Link
                    href="/register"
                    className="flex min-h-11 items-center justify-center px-6 py-2.5 text-base font-semibold text-white bg-blue-600 rounded-full hover:bg-brand-strong"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t.signup}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
