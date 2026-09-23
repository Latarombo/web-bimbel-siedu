'use client';

import Image from 'next/image';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import LogoutDialog from '@/components/LogoutDialog';
import ProfilePopover from '@/components/ProfilePopover';

interface NavItem {
  name: string;
  href: string;
}

// State scroll di module level — saat ganti bahasa (remount client) posisi
// tidak kembali ke false / navbar tidak memantul (pola LandingNavbar).
let globalIsScrolled = false;
if (typeof window !== 'undefined') {
  globalIsScrolled = window.scrollY > 20;
}

interface DashboardNavbarProps {
  role: string;
  navItems: NavItem[];
  userName?: string;
  userEmail?: string | null;
  accountRole?: string;
  profileVariant?: 'popover' | 'dropdown';
}

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  role,
  navItems,
  userName: suppliedUserName,
  userEmail,
  accountRole,
  profileVariant = 'dropdown',
}) => {
  const t = useTranslations('shared');
  const userName = suppliedUserName ?? t('user');
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== 'undefined') return window.scrollY > 20;
    return globalIsScrolled;
  });
  const [enableTransition, setEnableTransition] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isLogoutOpen) return;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !mobileDropdownRef.current?.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLogoutOpen]);

  // Scroll morph ala LandingNavbar: flat → floating glass
  // (sinkron mount tidak perlu — useState initializer sudah baca scrollY)
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      globalIsScrolled = scrolled;
      setIsScrolled(scrolled);
      setEnableTransition(true);
    };

    const timer = setTimeout(() => setEnableTransition(true), 150);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Tutup drawer mobile saat route berpindah (adjust state saat props berubah,
  // pola React "you might need an effect" — bukan setState di dalam effect)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }

  // Body scroll lock saat drawer terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isMobileMenuOpen]);

  // Escape menutup drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const initials = (userName ?? role)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const transitionClass = enableTransition
    ? 'transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
    : 'transition-none';

  // Rute wizard & edit terisolasi memakai header auth tersendiri
  if (pathname.startsWith('/children/new') || /\/children\/\d+\/edit/.test(pathname)) {
    return null;
  }

  const pillCls = (active: boolean) =>
    `inline-flex h-8 items-center px-3.5 text-xs font-semibold rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
      active
        ? 'bg-blue-600/10 text-blue-700 font-bold'
        : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100/70'
    }`;

  return (
    <>
      {/* Skip to content (ala LandingNavbar) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
      >
        Lewat ke konten utama
      </a>

      <header
        suppressHydrationWarning
        className={`sticky top-0 z-50 w-full ${transitionClass} ${
          isScrolled
            ? 'px-3 pt-2.5 pb-1 sm:px-6 sm:pt-3 sm:pb-1'
            : 'px-0 py-0'
        }`}
        aria-label={t('mainMenuAria')}
      >
        <div
          suppressHydrationWarning
          className={`mx-auto ${transitionClass} ${isScrolled ? 'max-w-7xl' : 'w-full'}`}
        >
          <nav
            suppressHydrationWarning
            className={`flex items-center justify-between ${transitionClass} ${
              isScrolled
                ? 'h-14 sm:h-15 px-4 sm:px-5 lg:px-6 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.08),0_2px_6px_-2px_rgba(0,0,0,0.04)] will-change-transform'
                : 'h-16 px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
            }`}
          >
            {/* Logo Brand — tinggi sama LandingNavbar */}
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

            {/* Desktop Navigation — pill identik LandingNavbar, tanpa ikon */}
            <ul className="hidden lg:flex items-center gap-1" role="navigation">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={pillCls(active)}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Desktop Actions — Language Switcher + Profile */}
            <div className="hidden lg:flex items-center gap-2.5">
              <div className="border-r border-slate-200/80 pr-2.5 mr-0.5">
                <LanguageSwitcher variant="toggle" />
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="menu"
                  aria-label={t('profileMenuAria')}
                  className="flex items-center gap-2.5 rounded-full p-1 pr-2.5 hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {initials}
                  </span>
                  <span className="text-sm font-medium text-gray-700 hidden lg:block max-w-[10rem] truncate">
                    {userName}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50" role="menu">
                    {profileVariant === 'popover' ? (
                      <ProfilePopover
                        userName={userName}
                        role={role}
                        onNavigate={() => setIsDropdownOpen(false)}
                        onLogout={() => setIsLogoutOpen(true)}
                      />
                    ) : (
                      <div className="w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{userName}</p>
                          <p className="text-xs text-gray-500">{role}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          {t('nav.profile')}
                        </Link>
                        <div className="px-4 py-2">
                          <LanguageSwitcher placement="bottom" />
                        </div>
                        <button
                          onClick={() => setIsLogoutOpen(true)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          {t('nav.logout')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile / Tablet Right: Language + Avatar + Hamburger */}
            <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
              <LanguageSwitcher variant="toggle" />

              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsMobileMenuOpen(false);
                }}
                aria-label={t('profileMenuAria')}
                aria-expanded={isDropdownOpen}
                className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700"
              >
                {initials}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  setIsDropdownOpen(false);
                }}
                className="grid size-11 place-items-center text-slate-700 hover:text-blue-700 hover:bg-slate-100/80 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer"
                aria-label={isMobileMenuOpen ? t('menuClose') : t('menuOpen')}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="size-5.5" aria-hidden="true" />
                ) : (
                  <Menu className="size-5.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Slide Drawer ala LandingNavbar (nav parent saja, tanpa link landing) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              aria-hidden="true"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu Navigasi"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 flex flex-col w-[86vw] max-w-sm bg-white shadow-2xl border-l border-slate-200/90 overflow-hidden"
            >
              {/* Drawer header */}
              <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white/95">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg outline-none"
                  aria-label={t('brandAria')}
                >
                  <Image
                    src="/images/Logo.png"
                    alt="Siedu"
                    width={112}
                    height={34}
                    className="h-7 w-auto"
                    priority
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label={t('menuClose')}
                  className="grid size-11 place-items-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer"
                >
                  <X className="size-5.5" aria-hidden="true" />
                </button>
              </div>

              {/* Nav items */}
              <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-1 overscroll-contain">
                <span className="block px-3 py-1 text-[11px] font-medium text-slate-400">
                  Menu Utama
                </span>
                <ul className="flex flex-col space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex min-h-11 items-center px-3.5 rounded-xl text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                            active
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                          }`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Footer drawer: bahasa + akun */}
              <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/80 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500">Bahasa:</span>
                  <LanguageSwitcher variant="toggle" />
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex min-h-11 items-center gap-3 px-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors"
                >
                  <User className="size-4.5 text-slate-500" aria-hidden="true" />
                  Profil
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLogoutOpen(true);
                  }}
                  className="flex w-full min-h-11 items-center gap-3 px-3.5 rounded-xl text-sm font-semibold text-rose-600 bg-white border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="size-4.5" aria-hidden="true" />
                  {t('nav.logout')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Popover profil di mobile — sheet dari kanan */}
      {isDropdownOpen ? (
        <div className="lg:hidden fixed inset-0 z-50" role="menu">
          <button
            aria-label={t('profileMenuCloseAria')}
            onClick={() => setIsDropdownOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute right-3 top-3" ref={mobileDropdownRef}>
            <ProfilePopover
              userName={userName}
              role={role}
              onNavigate={() => setIsDropdownOpen(false)}
              onLogout={() => setIsLogoutOpen(true)}
            />
          </div>
        </div>
      ) : null}

      <LogoutDialog
        open={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
        userName={userName}
        userEmail={userEmail}
        role={role}
        accountRole={accountRole}
      />
    </>
  );
};

export default DashboardNavbar;
