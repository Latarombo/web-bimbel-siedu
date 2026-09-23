'use client';

import { useState } from 'react';
import { TeacherSidebar } from './teacher-sidebar';

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
  children: React.ReactNode;
}

export function TeacherShell({
  role,
  userName,
  userEmail,
  accountRole,
  badgeCounts,
  initialCollapsed = false,
  children,
}: TeacherShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  // Sync state if initialCollapsed changes from SSR
  const [prevInitialCollapsed, setPrevInitialCollapsed] = useState(initialCollapsed);
  if (initialCollapsed !== prevInitialCollapsed) {
    setPrevInitialCollapsed(initialCollapsed);
    setIsCollapsed(initialCollapsed);
  }

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
    <div className="min-h-dvh bg-[#F7F8FA]">
      <TeacherSidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        accountRole={accountRole}
        badgeCounts={badgeCounts}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <main
        id="main"
        className={`transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[268px]'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
