'use client';

/*
 * AdminSidebar — shell admin mengikuti bahasa desain TeacherSidebar:
 * sidebar collapsible (260px / 72px), brand light/dark, grup nav, badge
 * antrean nyata, theme switch, dan drawer mobile. State buka/tutup
 * dikendalikan AdminShell.
 */
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { TeacherThemeSwitch } from '@/components/teacher/teacher-theme-switch';
import {
    LayoutGrid,
    BookOpen,
    CalendarDays,
    Users,
    Layers,
    Mail,
    BarChart3,
    ClipboardList,
    CheckSquare,
    Copy,
    FileText,
    Clock,
    UserCheck,
    GraduationCap,
    History,
    CreditCard,
    ChevronsLeft,
    ChevronsRight,
    X,
    type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    name: string;
    href: string;
    /** Kunci ikon yang dipetakan ke ikon lucide. */
    icon?: string;
}

export interface NavSection {
    label: string;
    items: NavItem[];
}

const ICONS: Record<string, LucideIcon> = {
    grid: LayoutGrid,
    book: BookOpen,
    calendar: CalendarDays,
    clock: Clock,
    users: Users,
    userCheck: UserCheck,
    graduation: GraduationCap,
    layers: Layers,
    mail: Mail,
    chart: BarChart3,
    clipboard: ClipboardList,
    inbox: Mail,
    check: CheckSquare,
    copy: Copy,
    file: FileText,
    history: History,
    creditCard: CreditCard,
};

interface AdminSidebarProps {
    navSections: NavSection[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isDrawerOpen: boolean;
    onCloseDrawer: () => void;
}

export function AdminSidebar({
    navSections,
    isCollapsed,
    onToggleCollapse,
    isDrawerOpen,
    onCloseDrawer,
}: AdminSidebarProps) {
    const t = useTranslations('shared.admin');
    const pathname = usePathname();
    const [pendingHref, setPendingHref] = useState<string | null>(null);

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

    const isRouteActive = (href: string) => {
        const current = pendingHref || pathname;
        if (href === '/admin/dashboard') return current === '/admin/dashboard';
        return current === href || current.startsWith(href + '/');
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseDrawer();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCloseDrawer]);

    const navList = (collapsed: boolean) => (
        <nav className="space-y-4 pb-4">
            {navSections.map((section, sectionIdx) => (
                <div key={section.label} className="space-y-1">
                    {!collapsed ? (
                        <div
                            className={`px-3 text-sm font-medium text-slate-800 dark:text-slate-300 ${
                                sectionIdx > 0 ? 'pt-3 pb-1' : 'pb-1'
                            }`}
                        >
                            {section.label}
                        </div>
                    ) : (
                        sectionIdx > 0 && (
                            <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
                        )
                    )}

                    <ul className="space-y-1">
                        {section.items.map((item) => {
                            const Icon = ICONS[item.icon ?? 'grid'] ?? LayoutGrid;
                            const active = isRouteActive(item.href);

                            return (
                                <li key={item.name} className="relative">
                                    <Link
                                        href={item.href}
                                        prefetch={true}
                                        aria-current={
                                            active ? 'page' : undefined
                                        }
                                        onClick={() => {
                                            if (pathname !== item.href)
                                                setPendingHref(item.href);
                                        }}
                                        className={`group relative flex h-10 items-center rounded-md px-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                            active
                                                ? 'bg-slate-100 text-slate-950 font-semibold dark:bg-slate-800 dark:text-white'
                                                : 'text-slate-800 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                                        }`}
                                    >
                                        <div className="flex size-5 shrink-0 items-center justify-center">
                                            <Icon
                                                className={`size-4.5 ${
                                                    active
                                                        ? 'text-slate-950 dark:text-white stroke-[2.2]'
                                                        : 'text-slate-800 group-hover:text-slate-950 dark:text-slate-300 dark:group-hover:text-slate-100 stroke-[1.8]'
                                                }`}
                                            />
                                        </div>

                                        <div
                                            className={`flex-1 min-w-0 flex items-center transition-all duration-200 ${
                                                collapsed
                                                    ? 'opacity-0 pointer-events-none max-w-0 w-0 overflow-hidden ml-0'
                                                    : 'opacity-100 max-w-full ml-3'
                                            }`}
                                        >
                                            <span className="truncate text-sm whitespace-nowrap">
                                                {item.name}
                                            </span>
                                        </div>

                                        {collapsed && (
                                            <div className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-white opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100 z-50">
                                                {item.name}
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
    );

    const brand = (collapsed: boolean) => (
        <div
            onWheel={handleHeaderOrFooterWheel}
            className="relative flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800 px-3"
        >
            <div
                className={`flex items-center justify-center w-full transition-opacity duration-200 ${
                    collapsed
                        ? 'opacity-100'
                        : 'opacity-0 pointer-events-none absolute'
                }`}
            >
                <Link
                    href="/admin/dashboard"
                    className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={t('brandAria')}
                >
                    <Image
                        src="/svg/symbol_siedu.svg"
                        alt="Siedu"
                        width={32}
                        height={32}
                        className="size-7 object-contain"
                        priority
                    />
                </Link>
            </div>

            <div
                className={`flex items-center w-full pl-2 transition-opacity duration-250 ${
                    !collapsed
                        ? 'opacity-100'
                        : 'opacity-0 pointer-events-none absolute'
                }`}
            >
                <Link
                    href="/admin/dashboard"
                    className="flex items-center transition-opacity hover:opacity-90 shrink-0"
                    title={t('brandAria')}
                >
                    <Image
                        src="/images/Logo.png"
                        alt="Siedu"
                        width={120}
                        height={36}
                        className="h-7 sm:h-7.5 w-auto object-contain dark:hidden"
                        priority
                    />
                    <Image
                        src="/images/Logo-white.png"
                        alt="Siedu"
                        width={120}
                        height={36}
                        className="h-7 sm:h-7.5 w-auto object-contain hidden dark:block"
                        priority
                    />
                </Link>
            </div>
        </div>
    );

    const scrollArea = (collapsed: boolean) => (
        <div
            ref={navRef}
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
        >
            {navList(collapsed)}
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-xs dark:shadow-none transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:flex ${
                    isCollapsed ? 'w-[72px]' : 'w-[260px]'
                }`}
            >
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    aria-label={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
                    title={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
                    className="absolute -right-3 top-5 z-50 grid size-7 place-items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md transition-all duration-200 hover:scale-110 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                    {isCollapsed ? (
                        <ChevronsRight className="size-4 stroke-[2.2]" />
                    ) : (
                        <ChevronsLeft className="size-4 stroke-[2.2]" />
                    )}
                </button>

                {brand(isCollapsed)}
                {scrollArea(isCollapsed)}

                <div
                    onWheel={handleHeaderOrFooterWheel}
                    className="relative border-t border-slate-200 dark:border-slate-800 p-3 shrink-0"
                >
                    <TeacherThemeSwitch isCollapsed={isCollapsed} />
                </div>
            </aside>

            {/* Mobile drawer */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 z-50 lg:hidden"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
                        onClick={onCloseDrawer}
                    />
                    <div className="fixed inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xl animate-in slide-in-from-left duration-250">
                        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4">
                            <Link
                                href="/admin/dashboard"
                                onClick={onCloseDrawer}
                                className="flex items-center"
                            >
                                <Image
                                    src="/images/Logo.png"
                                    alt="Siedu"
                                    width={120}
                                    height={36}
                                    className="h-7 sm:h-7.5 w-auto object-contain dark:hidden"
                                    priority
                                />
                                <Image
                                    src="/images/Logo-white.png"
                                    alt="Siedu"
                                    width={120}
                                    height={36}
                                    className="h-7 sm:h-7.5 w-auto object-contain hidden dark:block"
                                    priority
                                />
                            </Link>
                            <button
                                type="button"
                                onClick={onCloseDrawer}
                                className="grid size-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                aria-label={t('menuClose')}
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div
                            data-lenis-prevent
                            onWheel={(e) => e.stopPropagation()}
                            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
                        >
                            {navList(false)}
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-800 p-3">
                            <TeacherThemeSwitch isCollapsed={false} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminSidebar;
