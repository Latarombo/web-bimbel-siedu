"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Search,
  Plus,
  Bell,
  Settings,
  Menu,
  GraduationCap,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface TeacherHeaderProps {
  badgeCounts: {
    kelasAktif: number;
    siswaBelumNilai: number;
    presensiTerkunci: number;
  };
  onOpenMobileDrawer: () => void;
  onOpenSearch: () => void;
}

export function TeacherHeader({
  badgeCounts,
  onOpenMobileDrawer,
  onOpenSearch,
}: TeacherHeaderProps) {
  const locale = useLocale();
  const pathname = usePathname();

  const totalNotifications = badgeCounts.siswaBelumNilai + badgeCounts.presensiTerkunci;

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 transition-colors duration-200">
      {/* Left Area: Mobile Hamburger only (Clean & Minimalist, no redundant portal text) */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="grid size-9 place-items-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
          aria-label="Buka menu navigasi"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Center Area: Global Search Trigger Bar (Stripe style) */}
      <div className="flex-1 max-w-lg mx-2 sm:mx-4">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="size-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Cari siswa atau kelas...</span>
          </div>
          <kbd className="hidden sm:inline-block rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Area: Utility Icons (Stripe style) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 1. Quick Add Action Button (+) */}
        <DropdownMenu>
          <DropdownMenuTrigger className="grid size-8 place-items-center rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer">
            <Plus className="size-4 stroke-[2.5]" />
            <span className="sr-only">Aksi Cepat</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-md p-1">
            <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Aksi Cepat Guru
            </p>
            <DropdownMenuItem asChild>
              <Link
                href="/teacher/classes"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded cursor-pointer"
              >
                <ClipboardCheck className="size-4 text-blue-600" />
                <span>Catat Presensi Kelas</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/teacher/grades/new"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded cursor-pointer"
              >
                <GraduationCap className="size-4 text-emerald-600" />
                <span>Buat Penilaian Baru</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/teacher/status"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded cursor-pointer"
              >
                <FileText className="size-4 text-purple-600" />
                <span>Unggah Jurnal Pembelajaran</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. Notification Bell (Pending tasks) */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative grid size-8 place-items-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <Bell className="size-4" />
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
            )}
            <span className="sr-only">Notifikasi</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-md p-1">
            <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pemberitahuan Tugas
            </p>
            {totalNotifications === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Tidak ada tugas tertunda saat ini.
              </div>
            ) : (
              <div className="space-y-1">
                {badgeCounts.siswaBelumNilai > 0 && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/teacher/grades"
                      className="flex items-start gap-2.5 px-3 py-2 text-xs rounded hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer"
                    >
                      <span className="size-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {badgeCounts.siswaBelumNilai} Siswa Belum Dinilai
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Periksa antrean penilaian</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )}
                {badgeCounts.presensiTerkunci > 0 && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/teacher/corrections"
                      className="flex items-start gap-2.5 px-3 py-2 text-xs rounded hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer"
                    >
                      <span className="size-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {badgeCounts.presensiTerkunci} Presensi Terkunci
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Pengajuan koreksi data</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. Settings Shortcut */}
        <Link
          href="/teacher/profile"
          className="grid size-8 place-items-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Pengaturan Profil"
        >
          <Settings className="size-4" />
        </Link>

        {/* 4. Language Switcher (ID / EN) */}
        <div className="flex items-center rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-0.5 text-xs font-semibold">
          <Link
            href={pathname}
            locale="id"
            className={`px-1.5 py-0.5 rounded transition-colors ${
              locale === "id"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            ID
          </Link>
          <Link
            href={pathname}
            locale="en"
            className={`px-1.5 py-0.5 rounded transition-colors ${
              locale === "en"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            EN
          </Link>
        </div>
      </div>
    </header>
  );
}
