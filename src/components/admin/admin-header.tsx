'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import {
    Bell,
    Menu,
    LogOut,
    CheckCheck,
    ChevronRight,
    AlertCircle,
    ClipboardList,
    FileCheck,
} from 'lucide-react';

export interface AdminNotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    unread: boolean;
    category?: 'payment' | 'message' | 'system';
    href?: string;
}

export interface AdminHeaderProps {
    userName: string;
    userEmail?: string | null;
    initialNotifications?: AdminNotificationItem[];
    onOpenMobileDrawer: () => void;
    onOpenLogout: () => void;
}

export function AdminHeader({
    userName,
    userEmail,
    initialNotifications = [],
    onOpenMobileDrawer,
    onOpenLogout,
}: AdminHeaderProps) {
    const t = useTranslations('admin');
    const ts = useTranslations('shared.admin');

    const [notifications, setNotifications] =
        useState<AdminNotificationItem[]>(initialNotifications);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [prevInitNotifs, setPrevInitNotifs] = useState(initialNotifications);
    if (initialNotifications !== prevInitNotifs) {
        setPrevInitNotifs(initialNotifications);
        setNotifications(initialNotifications);
    }

    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => n.unread).length;

    const initials =
        userName
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'AD';

    const handleClickOutside = useCallback((event: MouseEvent) => {
        const target = event.target as Node;
        if (notifRef.current && !notifRef.current.contains(target)) {
            setIsNotifOpen(false);
        }
        if (profileRef.current && !profileRef.current.contains(target)) {
            setIsProfileOpen(false);
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsNotifOpen(false);
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClickOutside]);

    const handleMarkAllRead = () =>
        setNotifications((prev) =>
            prev.map((item) => ({ ...item, unread: false })),
        );

    const handleNotificationClick = (id: string) => {
        setNotifications((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, unread: false } : item,
            ),
        );
        setIsNotifOpen(false);
    };

    const getCategoryIcon = (category?: AdminNotificationItem['category']) => {
        switch (category) {
            case 'payment':
                return (
                    <ClipboardList className="size-4 text-amber-600 dark:text-amber-400" />
                );
            case 'message':
                return (
                    <FileCheck className="size-4 text-blue-600 dark:text-blue-400" />
                );
            case 'system':
            default:
                return (
                    <AlertCircle className="size-4 text-slate-600 dark:text-slate-400" />
                );
        }
    };

    return (
        <header
            className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/95 sm:px-6"
            aria-label={t('headerAria')}
        >
            {/* Sisi kiri: hamburger mobile + logo */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onOpenMobileDrawer}
                    aria-label={ts('menuOpen')}
                    className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden cursor-pointer"
                >
                    <Menu className="size-5" />
                </button>

                <div className="flex items-center lg:hidden">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center"
                        aria-label={ts('brandAria')}
                    >
                        <Image
                            src="/images/Logo.png"
                            alt="Siedu"
                            width={110}
                            height={30}
                            className="h-6 w-auto object-contain dark:hidden"
                            priority
                        />
                        <Image
                            src="/images/Logo-white.png"
                            alt="Siedu"
                            width={110}
                            height={30}
                            className="h-6 w-auto object-contain hidden dark:block"
                            priority
                        />
                    </Link>
                </div>
            </div>

            {/* Sisi kanan: bahasa + notifikasi + profil */}
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center">
                    <LanguageSwitcher variant="icon" placement="bottom" align="right" />
                </div>

                {/* Notifikasi */}
                <div ref={notifRef} className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setIsNotifOpen((v) => !v);
                            setIsProfileOpen(false);
                        }}
                        aria-label={
                            unreadCount > 0
                                ? t('notifAria', { count: unreadCount })
                                : t('notifAriaEmpty')
                        }
                        aria-expanded={isNotifOpen}
                        aria-haspopup="dialog"
                        className="relative grid size-9.5 place-items-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                    >
                        <Bell className="size-4.5" />
                        {unreadCount > 0 && (
                            <span className="absolute right-2 top-2 size-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
                        )}
                    </button>

                    {isNotifOpen && (
                        <div
                            role="dialog"
                            aria-label={t('notifTitle')}
                            className="absolute right-0 top-full mt-2 w-80 sm:w-92 rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 animate-in fade-in-0 zoom-in-95 duration-150 z-50"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">
                                        {t('notifTitle')}
                                    </span>
                                    {unreadCount > 0 && (
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                            {t('notifNew', {
                                                count: unreadCount,
                                            })}
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleMarkAllRead}
                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                                    >
                                        <CheckCheck className="size-3.5" />
                                        <span>{t('notifMarkRead')}</span>
                                    </button>
                                )}
                            </div>

                            <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                                {notifications.length > 0 ? (
                                    notifications.map((item) => {
                                        const content = (
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                    {getCategoryIcon(
                                                        item.category,
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                            {item.title}
                                                        </p>
                                                        <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                                                            {item.time}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                {item.href && (
                                                    <ChevronRight className="size-4 shrink-0 self-center text-slate-400" />
                                                )}
                                            </div>
                                        );

                                        return item.href ? (
                                            <Link
                                                key={item.id}
                                                href={item.href}
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        item.id,
                                                    )
                                                }
                                                className={`block p-3.5 transition-colors ${
                                                    item.unread
                                                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                                }`}
                                            >
                                                {content}
                                            </Link>
                                        ) : (
                                            <div
                                                key={item.id}
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        item.id,
                                                    )
                                                }
                                                className={`p-3.5 transition-colors cursor-pointer ${
                                                    item.unread
                                                        ? 'bg-blue-50/40 dark:bg-blue-950/20'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                                }`}
                                            >
                                                {content}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                                        {t('notifEmpty')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profil */}
                <div ref={profileRef} className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setIsProfileOpen((v) => !v);
                            setIsNotifOpen(false);
                        }}
                        aria-label={t('profileAria', { name: userName })}
                        aria-expanded={isProfileOpen}
                        aria-haspopup="menu"
                        className="group relative flex size-9.5 shrink-0 items-center justify-center rounded-full ring-2 ring-slate-200/80 hover:ring-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:ring-slate-700 dark:hover:ring-slate-500 transition-all cursor-pointer"
                    >
                        <div className="grid size-9 place-items-center rounded-full bg-amber-400 text-xs font-black text-amber-950 shadow-2xs transition-transform group-hover:scale-105">
                            {initials}
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div
                            role="menu"
                            aria-label={t('profileMenu')}
                            className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 animate-in fade-in-0 zoom-in-95 duration-150 z-50"
                        >
                            <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {userName}
                                </p>
                                {userEmail && (
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                        {userEmail}
                                    </p>
                                )}
                            </div>

                            <div className="py-1">
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        onOpenLogout();
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300 transition-colors cursor-pointer"
                                >
                                    <LogOut className="size-4" />
                                    <span>{ts('logout')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default AdminHeader;
