'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ProgramDropdown } from './program-dropdown';

interface NavLinksProps {
  pathname: string;
  locale: string;
}

export function NavLinks({ pathname, locale }: NavLinksProps) {
  const t = useTranslations('chrome.nav');

  const isHomeActive = pathname === '/';
  const isClassesActive = pathname === '/classes' || pathname.startsWith('/classes/');
  const isAboutActive = pathname === '/about' || pathname.startsWith('/about/');
  const isContactActive = pathname === '/contact' || pathname.startsWith('/contact/');

  return (
    <div className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Main Navigation">
      {/* 1. Beranda */}
      <Link
        href="/"
        aria-current={isHomeActive ? 'page' : undefined}
        className={`inline-flex h-8 items-center px-3.5 text-xs font-semibold rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
          isHomeActive
            ? 'bg-blue-600/10 text-blue-700 font-bold'
            : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100/70'
        }`}
      >
        {t('home')}
      </Link>

      {/* 2. Program / Kelas dengan Dropdown */}
      <ProgramDropdown isActive={isClassesActive} locale={locale} />

      {/* 3. Tentang Kami */}
      <Link
        href="/about"
        aria-current={isAboutActive ? 'page' : undefined}
        className={`inline-flex h-8 items-center px-3.5 text-xs font-semibold rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
          isAboutActive
            ? 'bg-blue-600/10 text-blue-700 font-bold'
            : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100/70'
        }`}
      >
        {t('about')}
      </Link>

      {/* 4. Kontak */}
      <Link
        href="/contact"
        aria-current={isContactActive ? 'page' : undefined}
        className={`inline-flex h-8 items-center px-3.5 text-xs font-semibold rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
          isContactActive
            ? 'bg-blue-600/10 text-blue-700 font-bold'
            : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100/70'
        }`}
      >
        {t('contact')}
      </Link>
    </div>
  );
}
