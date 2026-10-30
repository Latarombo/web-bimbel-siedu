'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import LogoutDialog from '@/components/LogoutDialog';
import { TeacherThemeSwitch } from './teacher-theme-switch';
import {
  LayoutGrid,
  BookOpen,
  Calendar,
  Ruler,
  FileText,
  ClipboardCheck,
  LogOut,
  X,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from 'lucide-react';

export interface NavItemDef {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface TeacherSidebarProps {
  role: string;
  userName?: string;
  userEmail?: string | null;
  accountRole?: string;
  badgeCounts: {
    kelasAktif: number;
    siswaBelumNilai: number;
    presensiTerkunci: number;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDrawerOpen?: boolean;
  onCloseDrawer?: () => void;
  onOpenLogout?: () => void;
}

export function TeacherSidebar({
  role,
  userName = 'Guru',
  userEmail = 'teacher@siedu.id',
  accountRole,
  badgeCounts,
  isCollapsed,
  onToggleCollapse,
  isDrawerOpen: isDrawerOpenProp,
  onCloseDrawer: onCloseDrawerProp,
  onOpenLogout: onOpenLogoutProp,
}: TeacherSidebarProps) {
  const t = useTranslations('teacher');
  const tAdmin = useTranslations('shared.admin');
  const pathname = usePathname();

  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const [internalLogoutOpen, setInternalLogoutOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const effectiveDrawerOpen = isDrawerOpenProp !== undefined ? isDrawerOpenProp : internalDrawerOpen;
  const handleCloseDrawer = useCallback(() => {
    if (onCloseDrawerProp) {
      onCloseDrawerProp();
    } else {
      setInternalDrawerOpen(false);
    }
  }, [onCloseDrawerProp]);
  const handleOpenLogout = onOpenLogoutProp ?? (() => setInternalLogoutOpen(true));

  // Clear pendingHref on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setPendingHref(null);
  }

  const navRef = useRef<HTMLDivElement>(null);
  const handleHeaderOrFooterWheel = (e: React.WheelEvent) => {
    if (navRef.current) {
      navRef.current.scrollTop += e.deltaY;
    }
  };

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'GU';

  // Grouped Navigation for Siedu Teacher Portal
  interface NavSectionDef {
    id: string;
    title: string;
    items: NavItemDef[];
  }

  const NAV_SECTIONS: NavSectionDef[] = [
    {
      id: 'teaching',
      title: 'Pembelajaran',
      items: [
        {
          id: 'dashboard',
          name: t('navDashboard') || 'Dashboard',
          href: '/teacher/dashboard',
          icon: LayoutGrid,
        },
        {
          id: 'classes',
          name: t('navClasses') || 'Kelas',
          href: '/teacher/classes',
          icon: BookOpen,
          badge: badgeCounts.kelasAktif > 0 ? badgeCounts.kelasAktif : undefined,
        },
        {
          id: 'schedule',
          name: t('navSchedule') || 'Jadwal',
          href: '/teacher/calendar',
          icon: Calendar,
        },
      ],
    },
    {
      id: 'administration',
      title: 'Administrasi',
      items: [
        {
          id: 'grades',
          name: t('navGrades') || 'Nilai',
          href: '/teacher/grades',
          icon: Ruler,
          badge: badgeCounts.siswaBelumNilai > 0 ? badgeCounts.siswaBelumNilai : undefined,
        },
        {
          id: 'journal',
          name: t('navJournal') || 'Jurnal',
          href: '/teacher/status',
          icon: FileText,
        },
        {
          id: 'corrections',
          name: t('navCorrections') || 'Koreksi',
          href: '/teacher/corrections',
          icon: ClipboardCheck,
          badge: badgeCounts.presensiTerkunci > 0 ? badgeCounts.presensiTerkunci : undefined,
        },
      ],
    },
  ];

  const isRouteActive = (href: string) => {
    const current = pendingHref || pathname;
    if (href === '/teacher/dashboard') return current === '/teacher/dashboard';
    return current === href || current.startsWith(href + '/');
  };

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseDrawer]);

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR (MEDTBANK FLOATING ISLAND STYLE)          */}
      {/* ========================================================= */}
      <aside
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className={`fixed top-3 bottom-3 left-3 z-40 hidden flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-xl shadow-slate-900/5 dark:shadow-black/40 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:flex ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {/* Medtbank-style Circular Toggle Button straddling the right border */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Buka sidebar" : t("sidebarClose")}
          title={isCollapsed ? "Buka sidebar" : t("sidebarClose")}
          className="absolute -right-3 top-6 z-50 grid size-6.5 place-items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md transition-all duration-200 hover:scale-110 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {isCollapsed ? (
            <ChevronsRight className="size-3.5 stroke-[2.2]" />
          ) : (
            <ChevronsLeft className="size-3.5 stroke-[2.2]" />
          )}
        </button>

        {/* Top Header / Brand Logo */}
        <div
          onWheel={handleHeaderOrFooterWheel}
          className="relative flex h-14 sm:h-16 shrink-0 items-center border-b border-slate-200/80 dark:border-slate-800 px-3 rounded-t-2xl"
        >
          {/* Collapsed Mode: Centered Official Symbol */}
          <div
            className={`flex items-center justify-center w-full transition-opacity duration-200 ${
              isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
            }`}
          >
            <Link
              href="/teacher/dashboard"
              className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Siedu Portal Guru"
            >
              <Image
                src="/svg/symbol_siedu.svg"
                alt="Siedu"
                width={32}
                height={32}
                className="size-7.5 object-contain"
                priority
              />
            </Link>
          </div>

          {/* Expanded Mode: Full Logo */}
          <div
            className={`flex items-center w-full pl-2 transition-opacity duration-250 ${
              !isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
            }`}
          >
            <Link
              href="/teacher/dashboard"
              className="flex items-center transition-opacity hover:opacity-90 shrink-0"
              title="Siedu Portal Guru"
            >
              <Image
                src="/images/Logo.png"
                alt="Siedu"
                width={116}
                height={32}
                className="h-7 w-auto object-contain dark:hidden"
                priority
              />
              <Image
                src="/images/Logo-white.png"
                alt="Siedu"
                width={116}
                height={32}
                className="h-7 w-auto object-contain hidden dark:block"
                priority
              />
            </Link>
          </div>
        </div>

        {/* Navigation Item List (Clean: zero horizontal overflow, visible smooth scrollbar) */}
        <div
          ref={navRef}
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
        >
          <nav className="space-y-4 pb-4">
            {NAV_SECTIONS.map((section, sectionIdx) => (
              <div key={section.id} className="space-y-1">
                {/* Category Header */}
                {!isCollapsed ? (
                  <div
                    className={`px-3 text-sm font-medium text-slate-800 dark:text-slate-300 ${
                      sectionIdx > 0 ? 'pt-3 pb-1' : 'pb-1'
                    }`}
                  >
                    {section.title}
                  </div>
                ) : (
                  sectionIdx > 0 && <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
                )}

                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isRouteActive(item.href);

                    return (
                      <li key={item.id} className="relative">
                        <Link
                          href={item.href}
                          prefetch={true}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => {
                            if (pathname !== item.href) setPendingHref(item.href);
                          }}
                          className={`group relative flex h-10 items-center rounded-md px-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                            active
                              ? 'bg-slate-100 text-slate-950 font-semibold dark:bg-slate-800 dark:text-white'
                              : 'text-slate-800 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                          }`}
                        >
                          {/* Icon at rock-solid fixed anchor */}
                          <div className="flex size-5 shrink-0 items-center justify-center">
                            <Icon
                              className={`size-4.5 ${
                                active
                                  ? 'text-slate-950 dark:text-white stroke-[2.2]'
                                  : 'text-slate-800 group-hover:text-slate-950 dark:text-slate-300 dark:group-hover:text-slate-100 stroke-[1.8]'
                              }`}
                            />
                          </div>

                          {/* Text label: zero width when collapsed to eliminate horizontal overflow */}
                          <div
                            className={`flex-1 min-w-0 flex items-center justify-between transition-all duration-200 ${
                              isCollapsed
                                ? 'opacity-0 pointer-events-none max-w-0 w-0 overflow-hidden ml-0'
                                : 'opacity-100 max-w-full ml-3'
                            }`}
                          >
                            <span className="truncate text-sm whitespace-nowrap">
                              {item.name}
                            </span>

                            {item.badge !== undefined && item.badge > 0 && (
                              <span
                                className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold ml-2 shrink-0 ${
                                  active
                                    ? 'bg-slate-200/80 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {/* Collapsed floating tooltip */}
                          {isCollapsed && (
                            <div className="pointer-events-none absolute left-full top-1/2 ml-3.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100 z-50">
                              {item.name}
                              {item.badge !== undefined && item.badge > 0 && (
                                <span className="ml-2 rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Theme Switch + User Profile & Direct Logout (Medtbank style) */}
        <div
          onWheel={handleHeaderOrFooterWheel}
          className="relative border-t border-slate-200 dark:border-slate-800 p-3 shrink-0 rounded-b-2xl space-y-2.5"
        >
          {/* Theme Switcher */}
          <TeacherThemeSwitch isCollapsed={isCollapsed} />

          {!isCollapsed ? (
            /* Expanded State: Clean Profile Card with Direct Logout Button */
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800/90 p-2 transition-colors">
              <Link
                href="/teacher/profile"
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
                title="Lihat Profil Guru"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-md bg-amber-400 text-xs font-black text-amber-950 shadow-2xs">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {userName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {role || "Guru"}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleOpenLogout}
                className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                title={tAdmin('logout')}
                aria-label={tAdmin('logout')}
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            /* Collapsed State: Centered Avatar + Logout Icon */
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/teacher/profile"
                className="group relative flex size-10 shrink-0 items-center justify-center rounded-md bg-amber-400 text-xs font-black text-amber-950 shadow-2xs hover:opacity-90 transition-opacity"
                aria-label="Profil Guru"
              >
                {initials}
                <div className="pointer-events-none absolute left-full top-1/2 ml-3.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100 z-50">
                  {userName} · Profil
                </div>
              </Link>
              <button
                type="button"
                onClick={handleOpenLogout}
                className="group relative flex size-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                title={tAdmin('logout')}
                aria-label={tAdmin('logout')}
              >
                <LogOut className="size-4" />
                <div className="pointer-events-none absolute left-full top-1/2 ml-3.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-rose-500 dark:text-rose-400 opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100 z-50">
                  {tAdmin('logout')}
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE DRAWER (Controlled by TeacherShell & TeacherHeader)*/}
      {/* ========================================================= */}
      {effectiveDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={handleCloseDrawer}
          />
          <div className="fixed inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4">
              <Link href="/teacher/dashboard" onClick={handleCloseDrawer} className="flex items-center">
                <Image
                  src="/images/Logo.png"
                  alt="Siedu"
                  width={110}
                  height={30}
                  className="h-6 w-auto object-contain dark:hidden"
                />
                <Image
                  src="/images/Logo-white.png"
                  alt="Siedu"
                  width={110}
                  height={30}
                  className="h-6 w-auto object-contain hidden dark:block"
                />
              </Link>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="grid size-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                aria-label="Tutup navigasi"
              >
                <X className="size-5" />
              </button>
            </div>

            <div
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
            >
              <nav className="space-y-4 pb-6">
                {NAV_SECTIONS.map((section, sectionIdx) => (
                  <div key={section.id} className="space-y-1">
                    <div
                      className={`px-3 text-sm font-medium text-slate-800 dark:text-slate-300 ${
                        sectionIdx > 0 ? 'pt-2 pb-1' : 'pb-1'
                      }`}
                    >
                      {section.title}
                    </div>
                    <ul className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isRouteActive(item.href);

                        return (
                          <li key={item.id} className="relative">
                            <Link
                              href={item.href}
                              prefetch={true}
                              aria-current={active ? 'page' : undefined}
                              onClick={() => {
                                if (pathname !== item.href) setPendingHref(item.href);
                                handleCloseDrawer();
                              }}
                              className={`group relative flex items-center justify-between rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors ${
                                active
                                  ? 'bg-slate-100 font-semibold text-slate-950 dark:bg-slate-800 dark:text-white'
                                  : 'font-medium text-slate-800 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon
                                  className={`size-4.5 ${
                                    active
                                      ? 'text-slate-950 dark:text-white stroke-[2.2]'
                                      : 'text-slate-800 group-hover:text-slate-950 dark:text-slate-300 dark:group-hover:text-slate-100 stroke-[1.8]'
                                  }`}
                                />
                                <span>{item.name}</span>
                              </div>
                              {item.badge !== undefined && item.badge > 0 && (
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    active
                                      ? 'bg-slate-200/80 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            {/* Mobile Drawer Bottom Section */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2.5">
              <TeacherThemeSwitch isCollapsed={false} />

              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-2">
                <Link
                  href="/teacher/profile"
                  onClick={handleCloseDrawer}
                  className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-md bg-amber-400 text-xs font-black text-amber-950 shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {userName}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {role || "Guru"}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseDrawer();
                    handleOpenLogout();
                  }}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                  title={tAdmin('logout')}
                  aria-label={tAdmin('logout')}
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Logout Confirmation Dialog if not controlled by parent */}
      {onOpenLogoutProp === undefined && (
        <LogoutDialog
          open={internalLogoutOpen}
          onOpenChange={setInternalLogoutOpen}
          userName={userName}
          userEmail={userEmail}
          role={role}
          accountRole={accountRole}
        />
      )}
    </>
  );
}

export default TeacherSidebar;
