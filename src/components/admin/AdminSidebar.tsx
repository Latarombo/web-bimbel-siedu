'use client';

/*
 * AdminSidebar — shell SaaS: sidebar kiri fixed di desktop (lg), drawer di mobile.
 * Dipakai khusus area admin; parent/teacher tetap pakai DashboardNavbar.
 * ponytail: drawer state lokal tanpa lib; kalau butuh nested submenu/collapse,
 * baru pertimbangkan komponen sidebar shadcn.
 */
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/app/actions/login';

interface NavItem {
  name: string;
  href: string;
  /** Kunci ikon feather-style inline — nol dependency. */
  icon?: string;
}

// Path ikon feather-style (stroke, 24x24 viewBox) — sama dengan DashboardNavbar.
const ICONS: Record<string, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  book: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  users:
    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  inbox:
    'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  copy: 'M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
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

interface AdminSidebarProps {
  role: string;
  navItems: NavItem[];
  userName?: string;
}

export default function AdminSidebar({ role, navItems, userName = 'Admin' }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navList = (
    <nav aria-label="Menu admin" className="flex-1 overflow-y-auto px-3 py-4">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
      <ul className="space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => setIsDrawerOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <NavIcon icon={item.icon} className={`h-[18px] w-[18px] ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const userBlock = (
    <div className="border-t border-slate-100 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
        <button
          onClick={() => logout()}
          aria-label="Keluar"
          title="Keluar"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </div>
  );

  const brand = (
    <div className="flex h-16 flex-shrink-0 items-center gap-2 border-b border-slate-100 px-5">
      <Link href="/" className="flex items-center" aria-label="Siedu — beranda">
        <Image src="/images/Logo.png" alt="Siedu" width={120} height={36} className="h-8 w-auto" />
      </Link>
      <span className="ml-auto rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
        {role}
      </span>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop — fixed kiri */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {brand}
        {navList}
        {userBlock}
      </aside>

      {/* Top bar mobile */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center" aria-label="Siedu — beranda">
            <Image src="/images/Logo.png" alt="Siedu" width={120} height={36} className="h-8 w-auto" />
          </Link>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            {role}
          </span>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Buka menu"
          aria-expanded={isDrawerOpen}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 hover:text-blue-600"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Drawer mobile + overlay */}
      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            {brand}
            {navList}
            {userBlock}
          </div>
        </div>
      ) : null}
    </>
  );
}
