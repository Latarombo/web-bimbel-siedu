'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link, usePathname } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { NavbarProps } from './types';
import { NavLinks } from './nav-links';
import { NavActions } from './nav-actions';
import { MobileDrawer } from './mobile-drawer';
import { LanguageSwitcher } from '@/components/language-switcher';

// Simpan state scroll & drawer di module level client agar saat ganti bahasa (remount client),
// Navbar tidak pernah kembali ke posisi false atau memantul dari fullwidth, dan drawer tidak tertutup mendadak.
let globalIsScrolled = false;
let globalIsDrawerOpen = false;
if (typeof window !== 'undefined') {
  globalIsScrolled = window.scrollY > 20;
}

export function Navbar({ dashboardHref = null }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(() => globalIsDrawerOpen);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.scrollY > 20;
    }
    return globalIsScrolled;
  });
  const [enableTransition, setEnableTransition] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('chrome.nav');

  const handleOpenDrawer = () => {
    globalIsDrawerOpen = true;
    setIsMobileMenuOpen(true);
  };

  const handleCloseDrawer = () => {
    globalIsDrawerOpen = false;
    setIsMobileMenuOpen(false);
  };

  // Deteksi scroll halaman (threshold 20px)
  useEffect(() => {
    // Sinkronkan posisi aktual saat mount
    const currentScrolled = window.scrollY > 20;
    globalIsScrolled = currentScrolled;
    setIsScrolled(currentScrolled);

    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      globalIsScrolled = scrolled;
      setIsScrolled(scrolled);
      setEnableTransition(true);
    };

    // Aktifkan transisi pantulan HANYA setelah mount stabil (menghindari pantulan saat ganti bahasa)
    const timer = setTimeout(() => {
      setEnableTransition(true);
    }, 150);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Tutup menu mobile setiap kali halaman berpindah
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const transitionClass = enableTransition
    ? 'transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
    : 'transition-none';

  return (
    <>
      {/* 1. Accessible Skip to Content Link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
      >
        {locale === 'en' ? 'Skip to main content' : 'Lompat ke konten utama'}
      </a>

      {/* 2. Main Navbar Container (Dynamic: Full-width saat di atas, Floating Glassmorphism membal saat discroll) */}
      <header
        suppressHydrationWarning
        className={`sticky top-0 z-40 w-full ${transitionClass} ${
          isScrolled
            ? 'px-3 pt-2.5 pb-1 sm:px-6 sm:pt-3 sm:pb-1'
            : 'px-0 py-0'
        }`}
        aria-label={locale === 'en' ? 'Main' : 'Utama'}
      >
        <div
          suppressHydrationWarning
          className={`mx-auto ${transitionClass} ${isScrolled ? 'max-w-7xl' : 'w-full'}`}
        >
          <nav
            suppressHydrationWarning
            className={`flex items-center justify-between ${transitionClass} ${
              isScrolled
                ? 'h-14 sm:h-15 px-4 sm:px-5 lg:px-6 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.08),0_2px_6px_-2px_rgba(0,0,0,0.04)] scale-[1] will-change-transform'
                : 'h-16 px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
            }`}
          >
            {/* Logo Brand */}
            <div className="shrink-0 flex items-center">
              <Link
                href="/"
                className="flex items-center focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-lg"
                aria-label={t('brandAria')}
              >
                <Image
                  src="/images/Logo.png"
                  alt="Siedu"
                  width={120}
                  height={36}
                  className="h-7 sm:h-7.5 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <NavLinks pathname={pathname} locale={locale} />

            {/* Desktop Action Buttons (Language Switcher + Auth) */}
            <NavActions dashboardHref={dashboardHref} />

            {/* Mobile / Tablet Header Right: Language Toggle + Auth CTAs + Hamburger Trigger */}
            <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
              {/* Language Switcher Pill */}
              <div className="flex items-center">
                <LanguageSwitcher variant="toggle" />
              </div>

              {/* Tablet-only Register Button (768px - 1023px) */}
              {!dashboardHref && (
                <Link
                  href="/register"
                  className="hidden md:inline-flex h-8.5 items-center justify-center px-3.5 text-xs font-bold text-white rounded-lg shadow-xs hover:brightness-95 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                  style={{ backgroundColor: '#f26d0f' }}
                >
                  {t('signup')}
                </Link>
              )}

              {/* Quick Action: Login / Dashboard (Disembunyikan pada layar sangat kecil <400px agar tidak sesak) */}
              {dashboardHref ? (
                <Link
                  href={dashboardHref}
                  className="hidden min-[400px]:inline-flex h-8.5 items-center px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                >
                  {t('dashboard')}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden min-[400px]:inline-flex h-8.5 items-center px-3 text-xs font-semibold text-slate-700 border border-slate-200 bg-white/80 hover:bg-slate-50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                >
                  {t('login')}
                </Link>
              )}

              {/* Hamburger Button (Touch Target WCAG AAA min 44x44px = size-11) */}
              <button
                type="button"
                onClick={handleOpenDrawer}
                className="grid size-11 place-items-center text-slate-700 hover:text-blue-700 hover:bg-slate-100/80 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer"
                aria-label={t('menuOpen')}
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="size-5.5" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* 3. Mobile Slide-down Sheet Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={handleCloseDrawer}
        pathname={pathname}
        locale={locale}
        dashboardHref={dashboardHref}
      />
    </>
  );
}

export default Navbar;
