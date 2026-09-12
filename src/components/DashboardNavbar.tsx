'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { logout } from '@/app/actions/login';
import ProfilePopover from '@/components/ProfilePopover';

interface NavItem {
  name: string;
  href: string;
  /** Kunci ikon feather-style inline — nol dependency. */
  icon?: string;
}

// Path ikon feather-style (stroke, 24x24 viewBox) — konvensi sama dengan admin.
const ICONS: Record<string, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  book: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  credit: 'M2 5h20v14H2zM2 10h20',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
};

function NavIcon({ icon, className }: { icon?: string; className: string }) {
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[icon]} />
    </svg>
  );
}

interface DashboardNavbarProps {
  role: string;
  navItems: NavItem[];
  userName?: string;
  /** Role admin pakai konteks "area" — badge SaaS di samping logo. */
  isAdmin?: boolean;
  /** 'popover' = kartu profil besar (desain user); default: dropdown lama. */
  profileVariant?: 'popover' | 'dropdown';
}

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  role,
  navItems,
  userName = 'Pengguna',
  isAdmin = false,
  profileVariant = 'dropdown',
}) => {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inisial avatar (tanpa gambar eksternal); biaya render kecil, tidak perlu memo.
  const initials = (userName ?? role)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100"
      aria-label="Menu utama"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + konteks area (SaaS: wordmark + badge role) */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center" aria-label="Siedu — beranda">
              <Image src="/images/Logo.png" alt="Siedu" width={120} height={36} className="h-8 w-auto" priority />
            </Link>
            <span className="ml-2.5 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {role}
            </span>
          </div>

          {/* Desktop Navigation — persis pola LandingNavbar: teks polos, hover biru, tanpa pill */}
          <ul className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-1.5 text-sm px-3 py-2 font-medium transition-colors duration-200 ${
                      active ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <NavIcon icon={item.icon} className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* User Dropdown */}
          <div className="hidden md:flex items-center" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="menu"
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

            {/* Dropdown Menu — kartu popover profil (desain user) atau dropdown sederhana */}
            {isDropdownOpen && (
              <div className="absolute right-4 top-14 mt-2 z-50" role="menu">
                {profileVariant === 'popover' ? (
                  <ProfilePopover
                    userName={userName}
                    role={role}
                    onNavigate={() => setIsDropdownOpen(false)}
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
                      Profil
                    </Link>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile: avatar profil + hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsMobileMenuOpen(false);
              }}
              aria-label="Menu profil"
              aria-expanded={isDropdownOpen}
              className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700"
            >
              {initials}
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsDropdownOpen(false);
              }}
              className="text-gray-700 hover:text-blue-600 focus:outline-none p-1"
              aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Popover profil di mobile — sheet dari kanan, overlay menutup */}
        {isDropdownOpen ? (
          <div className="md:hidden fixed inset-0 z-50" role="menu">
            <button
              aria-label="Tutup menu profil"
              onClick={() => setIsDropdownOpen(false)}
              className="absolute inset-0 bg-slate-900/40"
            />
            <div className="absolute right-3 top-3">
              <ProfilePopover userName={userName} role={role} onNavigate={() => setIsDropdownOpen(false)} />
            </div>
          </div>
        ) : null}

        {/* Mobile Menu — daftar nav ber-ikon, pola LandingNavbar (tanpa pill, teks tegas) */}
        {isMobileMenuOpen && (
          <ul className="md:hidden py-3 border-t border-gray-100 flex flex-col">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 text-base font-medium rounded-lg ${
                      active ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <NavIcon icon={item.icon} className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
};

export default DashboardNavbar;
