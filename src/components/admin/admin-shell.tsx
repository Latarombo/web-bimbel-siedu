'use client';

import { useState } from 'react';
import { AdminSidebar, type NavSection } from './admin-sidebar';
import { AdminHeader, type AdminNotificationItem } from './admin-header';
import LogoutDialog from '@/components/common/logout-dialog';

interface AdminShellProps {
    role: string;
    userName: string;
    userEmail: string | null;
    accountRole: string;
    navSections: NavSection[];
    notifications?: AdminNotificationItem[];
    children: React.ReactNode;
}

export function AdminShell({
    role,
    userName,
    userEmail,
    accountRole,
    navSections,
    notifications = [],
    children,
}: AdminShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);

    return (
        <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <AdminSidebar
                navSections={navSections}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed((v) => !v)}
                isDrawerOpen={isDrawerOpen}
                onCloseDrawer={() => setIsDrawerOpen(false)}
            />

            <div
                className={`flex min-h-dvh flex-col transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
                }`}
            >
                <AdminHeader
                    userName={userName}
                    userEmail={userEmail}
                    initialNotifications={notifications}
                    onOpenMobileDrawer={() => setIsDrawerOpen(true)}
                    onOpenLogout={() => setIsLogoutOpen(true)}
                />

                <main id="main" className="flex-1">
                    {children}
                </main>
            </div>

            <LogoutDialog
                open={isLogoutOpen}
                onOpenChange={setIsLogoutOpen}
                userName={userName}
                userEmail={userEmail}
                role={role}
                accountRole={accountRole}
            />
        </div>
    );
}

export default AdminShell;
