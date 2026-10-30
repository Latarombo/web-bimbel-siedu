'use client';

import { useState, useEffect } from 'react';
import { TeacherSidebar } from './teacher-sidebar';
import { TeacherHeader } from './teacher-header';
import {
  TeacherQuickSearch,
  type QuickSearchClassItem,
  type QuickSearchStudentItem,
} from './teacher-quick-search';
import LogoutDialog from '@/components/LogoutDialog';

interface TeacherShellProps {
  role: string;
  userName: string;
  userEmail: string | null;
  accountRole: string;
  badgeCounts: {
    kelasAktif: number;
    siswaBelumNilai: number;
    presensiTerkunci: number;
  };
  initialCollapsed?: boolean;
  searchClasses?: QuickSearchClassItem[];
  searchStudents?: QuickSearchStudentItem[];
  children: React.ReactNode;
}

export function TeacherShell({
  role,
  userName,
  userEmail,
  accountRole,
  badgeCounts,
  initialCollapsed = false,
  searchClasses = [],
  searchStudents = [],
  children,
}: TeacherShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Sync state if initialCollapsed changes from SSR
  const [prevInitialCollapsed, setPrevInitialCollapsed] = useState(initialCollapsed);
  if (initialCollapsed !== prevInitialCollapsed) {
    setPrevInitialCollapsed(initialCollapsed);
    setIsCollapsed(initialCollapsed);
  }

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        // Save cookie for SSR lock-in
        document.cookie = `siedu_teacher_sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem('siedu_teacher_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="min-h-dvh bg-white dark:bg-[#090d16] flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <TeacherSidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        accountRole={accountRole}
        badgeCounts={badgeCounts}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isDrawerOpen={isDrawerOpen}
        onCloseDrawer={() => setIsDrawerOpen(false)}
        onOpenLogout={() => setIsLogoutOpen(true)}
      />

      <div
        className={`flex min-h-dvh flex-col transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCollapsed ? 'lg:pl-[100px]' : 'lg:pl-[288px]'
        }`}
      >
        <TeacherHeader
          badgeCounts={badgeCounts}
          onOpenMobileDrawer={() => setIsDrawerOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        <main id="main" className="flex-1">
          {children}
        </main>
      </div>

      <TeacherQuickSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        classes={searchClasses}
        students={searchStudents}
      />

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
