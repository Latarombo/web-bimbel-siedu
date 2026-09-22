'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { motion } from 'motion/react';
import LogoutDialog from '@/components/LogoutDialog';
import {
  LayoutGrid,
  BookOpen,
  Calendar,
  Ruler,
  FileText,
  ClipboardCheck,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  PanelLeft,
  Languages,
  LogOut,
  User,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';

export interface NavSubItem {
  name: string;
  href: string;
}

export interface NavItemDef {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  subItems?: NavSubItem[];
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
}

export function TeacherSidebar({
  role,
  userName = 'Guru',
  userEmail = 'teacher@siedu.id',
  accountRole,
  badgeCounts,
  isCollapsed,
  onToggleCollapse,
}: TeacherSidebarProps) {
  const t = useTranslations('teacher');
  const tAdmin = useTranslations('shared.admin');
  const locale = useLocale();
  const pathname = usePathname();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [currentSearch, setCurrentSearch] = useState('');

  // Clear pendingHref and track query search params
  useEffect(() => {
    setPendingHref(null);
    if (typeof window !== 'undefined') {
      setCurrentSearch(window.location.search);
    }
  }, [pathname]);

  const isSubItemActive = (subHref: string) => {
    const current =
      pendingHref ||
      (typeof window !== 'undefined'
        ? `${pathname}${currentSearch || window.location.search}`
        : pathname);
    if (current === subHref) return true;
    if (
      subHref === '/teacher/classes' &&
      pathname === '/teacher/classes' &&
      !current.includes('status=')
    ) {
      return true;
    }
    return false;
  };

  // Accordion open states
  const [classesOpen, setClassesOpen] = useState(true);
  const [gradesOpen, setGradesOpen] = useState(false);

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

  // Master Navigation tailored to Siedu Teacher Portal
  const NAV_ITEMS: NavItemDef[] = [
    {
      id: 'dashboard',
      name: t('dashboard') || 'Dashboard',
      href: '/teacher/dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'classes',
      name: t('assignedClassesTitle') || 'Kelas Diampu',
      href: '/teacher/classes',
      icon: BookOpen,
      badge: badgeCounts.kelasAktif > 0 ? badgeCounts.kelasAktif : undefined,
      subItems: [
        { name: 'Semua Kelas', href: '/teacher/classes' },
        { name: 'Kelas Aktif', href: '/teacher/classes?status=aktif' },
        { name: 'Jadwal & Presensi', href: '/teacher/calendar' },
      ],
    },
    {
      id: 'schedule',
      name: t('calendarTitle') || 'Kalender Jadwal',
      href: '/teacher/calendar',
      icon: Calendar,
    },
    {
      id: 'grades',
      name: t('gradesTitle') || 'Penilaian & Nilai',
      href: '/teacher/grades',
      icon: Ruler,
      badge: badgeCounts.siswaBelumNilai > 0 ? badgeCounts.siswaBelumNilai : undefined,
      subItems: [
        { name: 'Daftar Nilai & Progres', href: '/teacher/grades' },
        { name: 'Buat Penilaian Baru', href: '/teacher/grades/new' },
        { name: 'Laporan Siswa', href: '/teacher/grades' },
      ],
    },
    {
      id: 'journal',
      name: t('sessionNotesTitle') || 'Jurnal Pembelajaran',
      href: '/teacher/status',
      icon: FileText,
    },
    {
      id: 'corrections',
      name: t('corrections') || 'Pengajuan Koreksi',
      href: '/teacher/corrections',
      icon: ClipboardCheck,
      badge: badgeCounts.presensiTerkunci > 0 ? badgeCounts.presensiTerkunci : undefined,
    },
    {
      id: 'profile',
      name: t('profile') || 'Pengaturan & Profil',
      href: '/teacher/profile',
      icon: Settings,
    },
  ];

  const isRouteActive = (href: string) => {
    const current = pendingHref || pathname;
    if (href === '/teacher/dashboard') return current === '/teacher/dashboard';
    return current === href || current.startsWith(href + '/');
  };

  // Close menus on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR (FIXED ANCHOR GRID - ZERO SCROLLBAR BUG)  */}
      {/* ========================================================= */}
      <aside
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-100 bg-white shadow-[1px_0_16px_rgba(0,0,0,0.03)] transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:flex ${
          isCollapsed ? 'w-[72px]' : 'w-[268px]'
        }`}
      >
        {/* Top Header / Brand Logo */}
        <div
          onWheel={handleHeaderOrFooterWheel}
          className="relative flex h-18 shrink-0 items-center border-b border-slate-100/80 px-3"
        >
          {/* Collapsed Mode: Logo button with hover PanelLeft icon */}
          <div
            className={`flex items-center justify-center transition-opacity duration-200 ${
              isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
            }`}
          >
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Buka sidebar"
              className="group relative flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-blue-50 cursor-pointer"
            >
              {/* Official Symbol */}
              <div className="flex size-8 items-center justify-center transition-all duration-200 group-hover:scale-0 group-hover:opacity-0">
                <Image
                  src="/svg/symbol_siedu.svg"
                  alt="Siedu"
                  width={34}
                  height={34}
                  className="size-8 object-contain"
                  priority
                />
              </div>

              {/* PanelLeft icon on hover */}
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center text-blue-600 opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100"
              >
                <PanelLeft className="size-5 stroke-[2]" />
              </div>

              {/* Tooltip */}
              <div className="pointer-events-none absolute left-full top-1/2 ml-3.5 -translate-y-1/2 whitespace-nowrap rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 z-50">
                Buka sidebar
              </div>
            </button>
          </div>

          {/* Expanded Mode: Full Logo + Collapse Toggle */}
          <div
            className={`flex items-center justify-between w-full pl-2 pr-1 transition-opacity duration-250 ${
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
                className="h-7 w-auto object-contain"
                priority
              />
            </Link>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Tutup sidebar"
              title="Tutup sidebar"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <PanelLeft className="size-5" />
            </button>
          </div>
        </div>

        {/* Navigation Item List (Clean: zero horizontal overflow, visible smooth scrollbar) */}
        <div
          ref={navRef}
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
        >
          <ul className="space-y-1 pb-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(item.href);
              const isAccordion = Boolean(item.subItems && item.subItems.length > 0);
              const isAccordionOpen =
                item.id === 'classes' ? classesOpen : item.id === 'grades' ? gradesOpen : false;

              const toggleAccordion = () => {
                if (item.id === 'classes') setClassesOpen(!classesOpen);
                if (item.id === 'grades') setGradesOpen(!gradesOpen);
              };

              return (
                <li key={item.id} className="relative space-y-1">
                  {isAccordion ? (
                    <div>
                      {/* Accordion Parent Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isCollapsed) {
                            onToggleCollapse();
                          } else {
                            toggleAccordion();
                          }
                        }}
                        className={`group relative flex h-11 w-full items-center rounded-xl px-3 transition-colors duration-150 cursor-pointer ${
                          active
                            ? 'bg-blue-50/90 text-blue-600 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {/* Icon at rock-solid fixed anchor */}
                        <div className="flex size-6 shrink-0 items-center justify-center">
                          <Icon
                            className={`size-5 stroke-[1.8] ${
                              active
                                ? 'text-blue-600'
                                : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                        </div>

                        {/* Text and badges: zero width when collapsed to eliminate horizontal overflow */}
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

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                                {item.badge}
                              </span>
                            )}
                            {isAccordionOpen ? (
                              <ChevronUp className="size-4 text-blue-600 transition-transform" />
                            ) : (
                              <ChevronDown className="size-4 text-slate-400 transition-transform" />
                            )}
                          </div>
                        </div>

                        {/* Collapsed floating tooltip */}
                        {isCollapsed && (
                          <div className="pointer-events-none absolute left-full top-1/2 ml-3.5 -translate-y-1/2 whitespace-nowrap rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 z-50">
                            {item.name}
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="ml-2 rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>

                      {/* Submenu: only rendered when sidebar is expanded */}
                      {!isCollapsed && isAccordionOpen && (
                        <div className="relative ml-6 mt-1 border-l-2 border-slate-100 pl-3 space-y-1 animate-in fade-in duration-200">
                          {item.subItems?.map((sub) => {
                            const isSubActive = isSubItemActive(sub.href);
                            return (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                prefetch={true}
                                onClick={() => {
                                  if (pathname !== sub.href) setPendingHref(sub.href);
                                }}
                                className={`relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-150 ${
                                  isSubActive
                                    ? 'text-blue-600 font-bold'
                                    : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-900'
                                }`}
                              >
                                {/* Smooth sliding vertical blue indicator on the left border */}
                                {isSubActive && (
                                  <motion.span
                                    layoutId={`active-subitem-bar-${item.id}`}
                                    className="absolute -left-[14px] top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.4)]"
                                    transition={{
                                      type: 'spring',
                                      stiffness: 400,
                                      damping: 32,
                                    }}
                                  />
                                )}

                                {/* Smooth sliding background pill */}
                                {isSubActive && (
                                  <motion.span
                                    layoutId={`active-subitem-bg-${item.id}`}
                                    className="absolute inset-0 rounded-xl bg-blue-50/90 -z-10"
                                    transition={{
                                      type: 'spring',
                                      stiffness: 400,
                                      damping: 32,
                                    }}
                                  />
                                )}

                                <span className="truncate whitespace-nowrap">{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Standard Flat Item */
                    <Link
                      href={item.href}
                      prefetch={true}
                      onClick={() => {
                        if (pathname !== item.href) setPendingHref(item.href);
                      }}
                      className={`group relative flex h-11 items-center rounded-xl px-3 transition-colors duration-150 ${
                        active
                          ? 'bg-blue-50/90 text-blue-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {/* Icon at rock-solid fixed anchor */}
                      <div className="flex size-6 shrink-0 items-center justify-center">
                        <Icon
                          className={`size-5 stroke-[1.8] ${
                            active
                              ? 'text-blue-600'
                              : 'text-slate-400 group-hover:text-slate-600'
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
                          <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs ml-2 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Collapsed floating tooltip */}
                      {isCollapsed && (
                        <div className="pointer-events-none absolute left-full top-1/2 ml-3.5 -translate-y-1/2 whitespace-nowrap rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 z-50">
                          {item.name}
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="ml-2 rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Section: Language Capsule Switcher & User Profile (overflow-visible for popups) */}
        <div
          onWheel={handleHeaderOrFooterWheel}
          className="relative border-t border-slate-100 p-3 space-y-3 shrink-0"
        >
          {/* Language Switcher Capsule [ID | EN] */}
          <div className="relative flex items-center justify-center min-h-9">
            {/* Expanded Capsule */}
            <div
              className={`w-full transition-opacity duration-200 ${
                !isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none absolute w-0 max-w-0 overflow-hidden'
              }`}
            >
              <div className="flex items-center rounded-2xl bg-slate-100 p-1">
                <Link
                  href={pathname}
                  locale="id"
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all ${
                    locale === 'id'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Languages className="size-3.5 shrink-0" />
                  <span>ID</span>
                </Link>
                <Link
                  href={pathname}
                  locale="en"
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all ${
                    locale === 'en'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Languages className="size-3.5 shrink-0" />
                  <span>EN</span>
                </Link>
              </div>
            </div>

            {/* Collapsed Compact Lang Button */}
            <div
              className={`flex items-center justify-center transition-opacity duration-200 ${
                isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
              }`}
            >
              <Link
                href={pathname}
                locale={locale === 'id' ? 'en' : 'id'}
                title={`Ganti bahasa ke ${locale === 'id' ? 'English' : 'Indonesia'}`}
                aria-label={`Ganti bahasa ke ${locale === 'id' ? 'English' : 'Indonesia'}`}
                className="group relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Languages className="size-5 stroke-[1.8]" />
                {/* Tooltip */}
                <div className="pointer-events-none absolute left-full top-1/2 ml-3.5 -translate-y-1/2 whitespace-nowrap rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 z-50">
                  {locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
                </div>
              </Link>
            </div>
          </div>

          {/* User Profile Card (Avatar anchored left, text fades) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              aria-haspopup="true"
              aria-expanded={isProfileMenuOpen}
              className="group relative flex h-12 w-full items-center rounded-2xl p-1.5 text-left transition-colors hover:bg-slate-50 cursor-pointer"
            >
              {/* Warm Amber Avatar: Fixed left anchor, never jumps */}
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400 text-xs font-black text-amber-950 shadow-2xs">
                {initials}
              </div>

              {/* User info: zero width when collapsed to eliminate horizontal overflow */}
              <div
                className={`flex-1 min-w-0 flex items-center justify-between transition-all duration-200 ${
                  isCollapsed
                    ? 'opacity-0 pointer-events-none max-w-0 w-0 overflow-hidden ml-0'
                    : 'opacity-100 max-w-full ml-3'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {userName}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {userEmail}
                  </p>
                </div>
                <ChevronRight className={`size-4 text-slate-400 shrink-0 ml-1 transition-transform ${isProfileMenuOpen ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {/* Profile Dropdown Menu with Backdrop for Reliable Closing */}
            {isProfileMenuOpen && (
              <>
                {/* Transparent backdrop to close dropdown on outside click */}
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsProfileMenuOpen(false)}
                />

                {/* Dropdown Card */}
                <div
                  className={`absolute bottom-full mb-2 w-60 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
                    !isCollapsed ? 'left-0' : 'left-full ml-3'
                  }`}
                >
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{role}</p>
                    {userEmail && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{userEmail}</p>
                    )}
                  </div>
                  <div className="py-1">
                    <Link
                      href="/teacher/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="size-4 text-slate-400" />
                      <span>Profil Guru</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsLogoutOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="size-4" />
                      <span>{tAdmin('logout')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE TOPBAR & DRAWER                                    */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-md px-4 lg:hidden">
        <Link href="/teacher/dashboard" className="flex items-center">
          <Image
            src="/images/Logo.png"
            alt="Siedu"
            width={110}
            height={30}
            className="h-6 w-auto object-contain"
            priority
          />
        </Link>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Buka navigasi"
          className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <PanelLeft className="size-5" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <Image
                src="/images/Logo.png"
                alt="Siedu"
                width={110}
                height={30}
                className="h-6 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
            >
              <ul className="space-y-1 pb-6">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isRouteActive(item.href);
                  const isAccordion = Boolean(item.subItems && item.subItems.length > 0);
                  const isAccordionOpen =
                    item.id === 'classes' ? classesOpen : item.id === 'grades' ? gradesOpen : false;

                  const toggleAccordion = () => {
                    if (item.id === 'classes') setClassesOpen(!classesOpen);
                    if (item.id === 'grades') setGradesOpen(!gradesOpen);
                  };

                  return (
                    <li key={item.id} className="space-y-1">
                      {isAccordion ? (
                        <div>
                          <button
                            type="button"
                            onClick={toggleAccordion}
                            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                              active
                                ? 'text-blue-600'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon
                                className={`size-5 ${
                                  active ? 'text-blue-600' : 'text-slate-400'
                                }`}
                              />
                              <span>{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.badge !== undefined && item.badge > 0 && (
                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                  {item.badge}
                                </span>
                              )}
                              {isAccordionOpen ? (
                                <ChevronUp className="size-4 text-blue-600" />
                              ) : (
                                <ChevronDown className="size-4 text-slate-400" />
                              )}
                            </div>
                          </button>
                          {isAccordionOpen && (
                            <div className="relative ml-5 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                              {item.subItems?.map((sub) => {
                                const isSubActive = isSubItemActive(sub.href);
                                return (
                                  <Link
                                    key={sub.name}
                                    href={sub.href}
                                    prefetch={true}
                                    onClick={() => {
                                      if (pathname !== sub.href) setPendingHref(sub.href);
                                      setIsDrawerOpen(false);
                                    }}
                                    className={`relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                                      isSubActive
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                  >
                                    {isSubActive && (
                                      <motion.span
                                        layoutId={`active-mobile-subitem-bar-${item.id}`}
                                        className="absolute -left-[14px] top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.4)]"
                                        transition={{
                                          type: 'spring',
                                          stiffness: 400,
                                          damping: 32,
                                        }}
                                      />
                                    )}
                                    {isSubActive && (
                                      <motion.span
                                        layoutId={`active-mobile-subitem-bg-${item.id}`}
                                        className="absolute inset-0 rounded-xl bg-blue-50/90 -z-10"
                                        transition={{
                                          type: 'spring',
                                          stiffness: 400,
                                          damping: 32,
                                        }}
                                      />
                                    )}
                                    <span className="truncate whitespace-nowrap">{sub.name}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          prefetch={true}
                          onClick={() => {
                            if (pathname !== item.href) setPendingHref(item.href);
                            setIsDrawerOpen(false);
                          }}
                          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm ${
                            active
                              ? 'bg-blue-50/80 font-semibold text-blue-600'
                              : 'font-medium text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`size-5 ${
                                active ? 'text-blue-600' : 'text-slate-400'
                              }`}
                            />
                            <span>{item.name}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-slate-100 p-4 space-y-3">
              {/* Language Switcher Capsule in Mobile */}
              <div className="flex items-center rounded-2xl bg-slate-100 p-1">
                <Link
                  href={pathname}
                  locale="id"
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold ${
                    locale === 'id'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  <Languages className="size-3.5 shrink-0" />
                  <span>ID</span>
                </Link>
                <Link
                  href={pathname}
                  locale="en"
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold ${
                    locale === 'en'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  <Languages className="size-3.5 shrink-0" />
                  <span>EN</span>
                </Link>
              </div>

              {/* Mobile Teacher Profile Row with Direct Profile Link */}
              <div className="flex items-center gap-3">
                <Link
                  href="/teacher/profile"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  <div className="grid size-9 place-items-center rounded-xl bg-amber-400 text-xs font-black text-amber-950">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {userName}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {userEmail}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsLogoutOpen(true)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                  title={tAdmin('logout')}
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
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
}

export default TeacherSidebar;
