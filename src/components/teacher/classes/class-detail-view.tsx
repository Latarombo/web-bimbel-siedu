"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { hapusPenilaian } from "@/app/actions/teacher";
import { useSetTeacherHeaderAction } from "@/components/teacher/teacher-header-action-context";
import {
  Search,
  Eye,
  Pencil,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Camera,
  Plus,
  UserCheck,
  FileSpreadsheet,
  Download,
  ClipboardCheck,
  BarChart3,
  X,
} from "lucide-react";
import { ExportClassModal, type ExportType } from "./export-class-modal";
import { QuickAssessmentModal } from "./quick-assessment-modal";
import { QuickGradeDrawer } from "./quick-grade-drawer";
import { StudentProfileDrawer } from "./student-profile-drawer";
import { WhatsappStoryCreatorModal } from "@/components/teacher/whatsapp-story-creator-modal";
import { compressImageFile } from "@/lib/image-compress";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  TeacherCalendarView,
  type TeacherCalendarSessionItem,
} from "@/components/teacher/calendar/teacher-calendar-view";

export interface StudentRosterItem {
  id: number; // pendaftaranId
  anakId: number;
  nama: string;
  status: "terdaftar" | "tertunggak" | string;
  nNilai: number;
  rata: number | null;
  hadir: number;
  tercatat: number;
  tingkat?: string | null;
  tanggalLahir?: string | null;
  nomorTelepon?: string | null;
  emailNotifikasi?: string | null;
  namaWali?: string | null;
  teleponWali?: string | null;
  alamatWali?: string | null;
}

export interface ScheduleSlotItem {
  id: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  nextSessionDate?: string;
  nextSessionTime?: string;
}

export interface ClassAssessmentItem {
  id: number;
  nama: string;
  tanggal: string;
  nilaiMaksimum: number;
  draf: boolean;
  diterbitkanPada?: string | null;
  countDinilai: number;
  countTidakIkut: number;
  countBelum: number;
  totalSiswa: number;
  sesiPertemuanId?: number | null;
  sesiLabel?: string | null;
  tanggalPertemuan?: string | null;
  catatan?: string | null;
}

export interface ClassDetailViewProps {
  classId: number;
  className: string;
  jenjang: string;
  tingkat?: string | null;
  classStatus: string;
  kuotaMaksimum: number;
  kuotaMinimum: number;
  periodeNama?: string;
  students: StudentRosterItem[];
  schedules: ScheduleSlotItem[];
  assessments: ClassAssessmentItem[];
  sessions?: { id: number; label: string; tanggalPertemuan?: string }[];
  firstTodaySession?: {
    jadwalItemId: number;
    jamMulai: string;
    jamSelesai: string;
  } | null;
  activeAttendanceSession?: {
    jadwalItemId: number;
    tanggalPertemuan: string;
    jamMulai: string;
    jamSelesai: string;
    isToday: boolean;
  } | null;
  calendarSessions?: TeacherCalendarSessionItem[];
  todayStr: string;
  locale: string;
  stats: {
    activeStudents: number;
    totalGradeEntries: number;
    totalRecordedAttendance: number;
  };
}

const ITEMS_PER_PAGE = 10;

export function ClassDetailView({
  classId,
  className,
  jenjang,
  tingkat,
  classStatus,
  kuotaMaksimum,
  kuotaMinimum,
  periodeNama,
  students: initialStudents,
  schedules,
  assessments,
  sessions = [],
  firstTodaySession,
  activeAttendanceSession,
  calendarSessions = [],
  todayStr,
  locale = "id",
  stats,
}: ClassDetailViewProps) {
  const router = useRouter();
  const [isDeletingAssessmentId, setIsDeletingAssessmentId] = useState<number | null>(null);
  const [isPendingDelete, startDeleteTransition] = useTransition();

  const formatTingkat = tingkat
    ? (tingkat.toLowerCase().startsWith("kelas") ? tingkat : `Kelas ${tingkat}`)
    : null;
  const classDisplayName = `${className} · ${jenjang}${formatTingkat ? ` (${formatTingkat})` : ""}`;

  const handleDeleteAssessment = (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus tugas '${nama}'? Seluruh data nilai siswa pada tugas ini akan ikut dihapus secara permanen.`)) return;
    setIsDeletingAssessmentId(id);
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.append("penilaian_id", String(id));
      const res = await hapusPenilaian({ ok: false }, formData);
      setIsDeletingAssessmentId(null);
      if (res?.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const attendanceTarget =
    activeAttendanceSession ??
    (firstTodaySession
      ? {
          jadwalItemId: firstTodaySession.jadwalItemId,
          tanggalPertemuan: todayStr,
          jamMulai: firstTodaySession.jamMulai,
          jamSelesai: firstTodaySession.jamSelesai,
          isToday: true,
        }
      : null);

  const targetAttendanceUrl = attendanceTarget
    ? `/teacher/classes/${classId}/sessions/${attendanceTarget.tanggalPertemuan}/attendance?sesi=${attendanceTarget.jadwalItemId}`
    : null;

  // Tabs: "roster" | "schedule" | "attendance" | "assessments" | "summary"
  const [activeTab, setActiveTab] = useState<
    "roster" | "schedule" | "attendance" | "assessments" | "summary"
  >("roster");

  // Local student state synced with incoming server props on router.refresh()
  const [students, setStudents] = useState<StudentRosterItem[]>(initialStudents);
  const [prevInitialStudents, setPrevInitialStudents] = useState(initialStudents);

  if (initialStudents !== prevInitialStudents) {
    setPrevInitialStudents(initialStudents);
    setStudents(initialStudents);
  }

  // Modals & Drawers state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportInitialType, setExportInitialType] = useState<ExportType>("summary");
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<ClassAssessmentItem | null>(null);
  const [gradingStudentId, setGradingStudentId] = useState<number | null>(null);
  const [profileStudentId, setProfileStudentId] = useState<number | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusCreatorMode, setStatusCreatorMode] = useState<'photo' | 'text'>('photo');
  const [statusCreatorPhotos, setStatusCreatorPhotos] = useState<string[]>([]);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenPhotoCreator = () => {
    photoFileInputRef.current?.click();
  };

  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      const compressedList: string[] = [];
      for (const f of files.slice(0, 5)) {
        const compressed = await compressImageFile(f);
        compressedList.push(compressed);
      }
      setStatusCreatorPhotos(compressedList);
      setStatusCreatorMode('photo');
      setIsStatusModalOpen(true);
    } catch (err) {
      console.error('Gagal memproses foto:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleOpenTextCreator = () => {
    setStatusCreatorPhotos([]);
    setStatusCreatorMode('text');
    setIsStatusModalOpen(true);
  };

  // Search, sort & pagination state for roster
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<{
    key: "nama" | "kehadiran" | "tugas" | "nilai";
    dir: "asc" | "desc";
  } | null>(null);

  // Search & filter state for assessments tab
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<"all" | "terbit" | "draf">("all");
  const [assessmentSessionFilter, setAssessmentSessionFilter] = useState<string>("all");
  const [assessmentCompletionFilter, setAssessmentCompletionFilter] = useState<"all" | "lengkap" | "belum">("all");
  const [assessmentPage, setAssessmentPage] = useState(1);
  const [assessmentSortState, setAssessmentSortState] = useState<{
    key: "nama" | "pertemuan" | "tanggalPertemuan" | "tanggal" | "dinilai" | "status";
    dir: "asc" | "desc";
  } | null>(null);

  const toggleAssessmentSort = (
    key: "nama" | "pertemuan" | "tanggalPertemuan" | "tanggal" | "dinilai" | "status",
  ) => {
    setAssessmentSortState((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
  };

  // Search, filter & sort state for attendance tab
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<
    "all" | "unrecorded" | "completed" | "dibatalkan"
  >("all");
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceSortState, setAttendanceSortState] = useState<{
    key: "tanggal" | "waktu" | "status" | "presensi";
    dir: "asc" | "desc";
  } | null>(null);

  const toggleAttendanceSort = (
    key: "tanggal" | "waktu" | "status" | "presensi",
  ) => {
    setAttendanceSortState((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
  };

  // Filter state for schedule/calendar tab
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<
    "all" | "terjadwal" | "selesai" | "belum_presensi" | "dibatalkan"
  >("all");

  const toggleSort = (key: "nama" | "kehadiran" | "tugas" | "nilai") => {
    setSortState((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
  };

  // Filtered & sorted students
  const filteredStudents = useMemo(() => {
    let res = [...students];

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      res = res.filter((s) => s.nama.toLowerCase().includes(q));
    }

    if (sortState) {
      const { key, dir } = sortState;
      res.sort((a, b) => {
        let cmp = 0;
        if (key === "nama") {
          cmp = a.nama.localeCompare(b.nama, "id");
        } else if (key === "kehadiran") {
          const pctA = a.tercatat > 0 ? a.hadir / a.tercatat : 0;
          const pctB = b.tercatat > 0 ? b.hadir / b.tercatat : 0;
          cmp = pctA - pctB || a.hadir - b.hadir;
        } else if (key === "tugas") {
          cmp = a.nNilai - b.nNilai;
        } else if (key === "nilai") {
          const valA = a.rata ?? -1;
          const valB = b.rata ?? -1;
          cmp = valA - valB;
        }
        return dir === "asc" ? cmp : -cmp;
      });
    }

    return res;
  }, [students, searchQuery, sortState]);

  // Options for session filter dropdown
  const sessionFilterOptions = useMemo(() => {
    const opts = [{ value: "all", label: "Semua Pertemuan" }];
    if (sessions && sessions.length > 0) {
      sessions.forEach((s) => {
        const shortMatch = s.label.match(/^(Pertemuan\s*#\d+)/i);
        const label = shortMatch ? shortMatch[1] : s.label;
        opts.push({ value: String(s.id), label });
      });
    }
    opts.push({ value: "none", label: "Tanpa Sesi" });
    return opts;
  }, [sessions]);

  // Filtered assessments
  const filteredAssessments = useMemo(() => {
    let list = assessments.filter((a) => {
      // 1. Status Filter (Terbit / Draf)
      if (assessmentStatusFilter === "terbit" && a.draf) return false;
      if (assessmentStatusFilter === "draf" && !a.draf) return false;

      // 2. Search Query (Nama Tugas)
      if (assessmentSearch.trim()) {
        const q = assessmentSearch.toLowerCase().trim();
        if (!a.nama.toLowerCase().includes(q)) return false;
      }

      // 3. Session Filter
      if (assessmentSessionFilter === "none") {
        if (a.sesiPertemuanId != null) return false;
      } else if (assessmentSessionFilter !== "all") {
        if (String(a.sesiPertemuanId) !== assessmentSessionFilter) return false;
      }

      // 4. Completion Filter (Lengkap / Belum)
      if (assessmentCompletionFilter === "lengkap") {
        if (a.countBelum > 0 || a.countDinilai === 0) return false;
      } else if (assessmentCompletionFilter === "belum") {
        if (a.countBelum === 0 && a.countDinilai > 0) return false;
      }

      return true;
    });

    if (assessmentSortState) {
      const { key, dir } = assessmentSortState;
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (key === "nama") {
          cmp = a.nama.localeCompare(b.nama, "id");
        } else if (key === "pertemuan") {
          const sesA = a.sesiLabel ?? "";
          const sesB = b.sesiLabel ?? "";
          cmp = sesA.localeCompare(sesB, "id", { numeric: true });
        } else if (key === "tanggalPertemuan") {
          const tA = a.tanggalPertemuan ?? "";
          const tB = b.tanggalPertemuan ?? "";
          cmp = tA.localeCompare(tB);
        } else if (key === "tanggal") {
          cmp = a.tanggal.localeCompare(b.tanggal);
        } else if (key === "dinilai") {
          const pctA = a.totalSiswa > 0 ? a.countDinilai / a.totalSiswa : 0;
          const pctB = b.totalSiswa > 0 ? b.countDinilai / b.totalSiswa : 0;
          cmp = pctA - pctB || a.countDinilai - b.countDinilai;
        } else if (key === "status") {
          const statA = a.draf ? 0 : 1;
          const statB = b.draf ? 0 : 1;
          cmp = statA - statB;
        }
        return dir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [
    assessments,
    assessmentSearch,
    assessmentStatusFilter,
    assessmentSessionFilter,
    assessmentCompletionFilter,
    assessmentSortState,
  ]);

  // Filtered calendar sessions
  const filteredCalendarSessions = useMemo(() => {
    return calendarSessions.filter((s) => {
      const isCompleted =
        s.statusSesi === "selesai" ||
        (s.presensiCount > 0 && s.statusSesi !== "dibatalkan");
      const isCancelled = s.statusSesi === "dibatalkan";

      if (scheduleStatusFilter === "all") return true;
      if (scheduleStatusFilter === "terjadwal") {
        return s.statusSesi === "terjadwal" && !isCompleted && !isCancelled;
      }
      if (scheduleStatusFilter === "selesai") {
        return isCompleted;
      }
      if (scheduleStatusFilter === "belum_presensi") {
        return s.presensiCount === 0 && !isCancelled;
      }
      if (scheduleStatusFilter === "dibatalkan") return isCancelled;
      return true;
    });
  }, [calendarSessions, scheduleStatusFilter]);

  // Pagination calculations for roster
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  // Pagination calculations for assessments
  const totalAssessmentPages =
    Math.ceil(filteredAssessments.length / ITEMS_PER_PAGE) || 1;
  const currentAssessmentPage = Math.min(
    Math.max(1, assessmentPage),
    totalAssessmentPages,
  );
  const paginatedAssessments = useMemo(() => {
    const start = (currentAssessmentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssessments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssessments, currentAssessmentPage]);

  // Filtered & sorted attendance sessions
  const filteredAttendanceSessions = useMemo(() => {
    let list = calendarSessions ?? [];

    if (attendanceFilter === "unrecorded") {
      list = list.filter(
        (s) =>
          (s.isPast || s.isToday) &&
          s.presensiCount === 0 &&
          s.statusSesi !== "dibatalkan",
      );
    } else if (attendanceFilter === "completed") {
      list = list.filter((s) => s.presensiCount > 0);
    } else if (attendanceFilter === "dibatalkan") {
      list = list.filter((s) => s.statusSesi === "dibatalkan");
    }

    const q = attendanceSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          s.tanggalPertemuan.toLowerCase().includes(q) ||
          `${s.jamMulai}-${s.jamSelesai}`.includes(q) ||
          s.statusSesi.toLowerCase().includes(q),
      );
    }

    if (attendanceSortState) {
      const { key, dir } = attendanceSortState;
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (key === "tanggal") {
          cmp =
            a.tanggalPertemuan.localeCompare(b.tanggalPertemuan) ||
            a.jamMulai.localeCompare(b.jamMulai);
        } else if (key === "waktu") {
          cmp =
            a.jamMulai.localeCompare(b.jamMulai) ||
            a.tanggalPertemuan.localeCompare(b.tanggalPertemuan);
        } else if (key === "status") {
          const statA =
            a.statusSesi === "dibatalkan"
              ? 0
              : a.presensiCount > 0
              ? 3
              : a.isPast || a.isToday
              ? 1
              : 2;
          const statB =
            b.statusSesi === "dibatalkan"
              ? 0
              : b.presensiCount > 0
              ? 3
              : b.isPast || b.isToday
              ? 1
              : 2;
          cmp = statA - statB;
        } else if (key === "presensi") {
          const pctA = a.pesertaCount > 0 ? a.presensiCount / a.pesertaCount : 0;
          const pctB = b.pesertaCount > 0 ? b.presensiCount / b.pesertaCount : 0;
          cmp = pctA - pctB || a.presensiCount - b.presensiCount;
        }
        return dir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [calendarSessions, attendanceFilter, attendanceSearch, attendanceSortState]);

  // Session label mapping for meeting names
  const sessionLabelMap = useMemo(() => {
    const map = new Map<number, string>();
    if (sessions && sessions.length > 0) {
      sessions.forEach((s) => {
        map.set(s.id, s.label);
      });
    }
    return map;
  }, [sessions]);

  // Pagination calculations for attendance
  const totalAttendancePages =
    Math.ceil(filteredAttendanceSessions.length / ITEMS_PER_PAGE) || 1;
  const currentAttendancePage = Math.min(
    Math.max(1, attendancePage),
    totalAttendancePages,
  );
  const paginatedAttendanceSessions = useMemo(() => {
    const start = (currentAttendancePage - 1) * ITEMS_PER_PAGE;
    return filteredAttendanceSessions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAttendanceSessions, currentAttendancePage]);

  const capacityPct =
    kuotaMaksimum > 0
      ? Math.min(100, Math.round((students.length / kuotaMaksimum) * 100))
      : 0;

  // Active student for QuickGradeDrawer
  const gradingStudentIndex = useMemo(() => {
    if (gradingStudentId == null) return -1;
    return filteredStudents.findIndex((s) => s.id === gradingStudentId);
  }, [gradingStudentId, filteredStudents]);

  const currentGradingStudent =
    gradingStudentIndex >= 0 ? filteredStudents[gradingStudentIndex] : null;

  const handleNextStudent = () => {
    if (gradingStudentIndex < filteredStudents.length - 1) {
      setGradingStudentId(filteredStudents[gradingStudentIndex + 1].id);
    }
  };

  const handlePrevStudent = () => {
    if (gradingStudentIndex > 0) {
      setGradingStudentId(filteredStudents[gradingStudentIndex - 1].id);
    }
  };

  const handleGradeSavedSuccess = (pendaftaranId: number) => {
    router.refresh();
  };

  useSetTeacherHeaderAction(
    useMemo(
      () => ({
        type: 'create',
        label: 'Buat Tugas Baru',
        onClick: () => setIsAssessmentModalOpen(true),
      }),
      []
    )
  );

  useEffect(() => {
    const handleCreateTask = () => setIsAssessmentModalOpen(true);
    window.addEventListener('teacher:create-task', handleCreateTask);
    return () => window.removeEventListener('teacher:create-task', handleCreateTask);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header Row */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {className} · {jenjang}{tingkat ? ` (${tingkat})` : ""}
        </h1>
      </div>

      {/* 3. Sleek Horizontal Underline Tabs Bar with sliding indicator */}
      <UnderlineTabs
        tabs={[
          { id: "roster", label: "Daftar Siswa" },
          { id: "schedule", label: "Jadwal & Sesi" },
          { id: "attendance", label: "Presensi" },
          { id: "assessments", label: "Tugas & Asesmen" },
          { id: "summary", label: "Ringkasan & Aksi" },
        ]}
        activeTab={activeTab}
        onChange={(val) => setActiveTab(val as typeof activeTab)}
        ariaLabel="Tabs Detail Kelas"
        layoutId="teacher-class-detail-tabs"
      />

      {/* 4. Tab Panels */}

      {/* TAB 1: DAFTAR SISWA */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          {/* Section Toolbar: Search & Filter left, Actions right */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <label htmlFor="search-student-roster" className="sr-only">
                  Cari nama siswa
                </label>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="search-student-roster"
                  type="search"
                  autoComplete="off"
                  placeholder="Cari nama siswa…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    aria-label="Hapus kata kunci pencarian"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              <Link
                href={`/teacher/classes/${classId}/reports`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-950 dark:hover:text-white active:scale-[0.98] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-all duration-150"
              >
                <FileSpreadsheet className="size-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
                <span>Rapor Semester</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setExportInitialType("summary");
                  setIsExportModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.98] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 shadow-2xs transition-all duration-150 cursor-pointer"
                title="Ekspor data siswa (CSV)"
              >
                <Download className="size-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
                <span>Ekspor</span>
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Belum ada siswa di kelas ini
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Siswa yang terdaftar dalam rombel ini akan tampil di sini.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tidak ada siswa yang cocok
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Tidak ditemukan siswa dengan kata kunci pencarian yang dimasukkan.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Reset Pencarian
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              {/* Responsive Scrollable Table (Desktop & Mobile) */}
              <div
                tabIndex={0}
                role="region"
                aria-label="Tabel daftar siswa"
                className="w-full overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-blue-600/30 touch-pan-x"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <table className="w-full min-w-[760px] text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">No</th>
                      <th
                        scope="col"
                        aria-sort={sortState?.key === "nama" ? (sortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="sticky left-12 z-20 min-w-[170px] max-w-[240px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("nama")}
                          className="flex w-full items-center justify-between gap-1.5 py-3 px-4 sm:px-6 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Siswa</span>
                          {sortState?.key === "nama" ? (
                            sortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sortState?.key === "kehadiran" ? (sortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("kehadiran")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Kehadiran</span>
                          {sortState?.key === "kehadiran" ? (
                            sortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sortState?.key === "tugas" ? (sortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("tugas")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Tugas Dinilai</span>
                          {sortState?.key === "tugas" ? (
                            sortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sortState?.key === "nilai" ? (sortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("nilai")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Nilai Rata-rata</span>
                          {sortState?.key === "nilai" ? (
                            sortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th scope="col" className="md:sticky md:right-0 md:z-20 py-3 px-4 sm:px-6 text-right bg-slate-50 dark:bg-slate-800 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedStudents.map((s, idx) => {
                      const initial = (s.nama?.[0] || "S").toUpperCase();
                      const attendancePct =
                        s.tercatat > 0
                          ? Math.round((s.hadir / s.tercatat) * 100)
                          : 0;

                      return (
                        <tr
                          key={s.id}
                          className="group/row relative border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* 1. Nomor Urut (Sticky Left 0) */}
                          <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs transition-colors">
                            {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>

                          {/* 2. Siswa (Sticky Left 12, Initial Avatar, Truncate, Title) */}
                          <td className="sticky left-12 z-10 min-w-[170px] max-w-[240px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 sm:px-6 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                {initial}
                              </div>
                              <button
                                type="button"
                                onClick={() => setProfileStudentId(s.id)}
                                className="font-semibold text-slate-950 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 truncate block text-sm text-left cursor-pointer transition-colors"
                                title={`Buka profil ${s.nama}`}
                              >
                                {s.nama}
                              </button>
                            </div>
                          </td>

                          {/* 3. Kehadiran */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums text-xs sm:text-sm">
                              {s.tercatat > 0 ? `${s.hadir}/${s.tercatat}` : "—"}
                            </span>
                            {s.tercatat > 0 ? (
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 tabular-nums">
                                ({attendancePct}%)
                              </span>
                            ) : null}
                          </td>

                          {/* 4. Tugas Dinilai */}
                          <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-slate-100 tabular-nums text-xs sm:text-sm whitespace-nowrap">
                            {s.nNilai > 0 ? `${s.nNilai} tugas` : "0 tugas"}
                          </td>

                          {/* 5. Nilai Rata-rata */}
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-xs sm:text-sm whitespace-nowrap">
                            {s.rata != null ? s.rata : "—"}
                          </td>

                          {/* 6. Aksi (Sticky Right on Desktop, Scrolls on Mobile) */}
                          <td className="md:sticky md:right-0 md:z-10 py-3 px-4 sm:px-6 text-right bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2 opacity-90 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                              <button
                                type="button"
                                onClick={() => setProfileStudentId(s.id)}
                                aria-label={`Rincian profil ${s.nama}`}
                                title="Profil Lengkap Siswa"
                                className="size-8 sm:size-7.5 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white p-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
                              >
                                <Eye className="size-3.5" aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setGradingStudentId(s.id)}
                                aria-label={`Input nilai cepat untuk ${s.nama}`}
                                title="Input Nilai Cepat"
                                className="size-8 sm:size-7.5 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
                              >
                                <Pencil className="size-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredStudents.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemLabel="siswa"
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JADWAL & SESI PERTEMUAN */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <FilterDropdown
                value={scheduleStatusFilter}
                onChange={(val) => setScheduleStatusFilter(val as typeof scheduleStatusFilter)}
                options={[
                  { value: "all", label: "Semua Sesi Pertemuan" },
                  { value: "terjadwal", label: "Sesi Terjadwal" },
                  { value: "selesai", label: "Selesai / Terisi" },
                  { value: "belum_presensi", label: "Belum Presensi" },
                  { value: "dibatalkan", label: "Sesi Dibatalkan" },
                ]}
                placeholder="Filter Sesi"
                size="sm"
                className="w-full sm:w-auto"
              />
            </div>
          </div>

          <TeacherCalendarView
            sessions={filteredCalendarSessions}
            classes={[
              {
                id: classId,
                name: className,
                displayName: classDisplayName,
                jenjang,
                tingkat,
              },
            ]}
            todayStr={todayStr}
            locale={locale}
            hideClassFilter={true}
            allowedViews={["daily", "weekly", "monthly"]}
            defaultView="weekly"
          />
        </div>
      )}

      {/* TAB 3: PRESENSI & KEHADIRAN KELAS */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <label htmlFor="search-attendance" className="sr-only">
                  Cari tanggal atau waktu sesi
                </label>
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="search-attendance"
                  type="search"
                  autoComplete="off"
                  placeholder="Cari tanggal atau waktu..."
                  value={attendanceSearch}
                  onChange={(e) => {
                    setAttendanceSearch(e.target.value);
                    setAttendancePage(1);
                  }}
                  className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors shadow-2xs"
                />
                {attendanceSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceSearch("");
                      setAttendancePage(1);
                    }}
                    aria-label="Hapus filter pencarian presensi"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <FilterDropdown
                value={attendanceFilter}
                onChange={(val) => {
                  setAttendanceFilter(val as typeof attendanceFilter);
                  setAttendancePage(1);
                }}
                options={[
                  { value: "all", label: "Semua Sesi" },
                  { value: "unrecorded", label: "Belum Presensi" },
                  { value: "completed", label: "Selesai Terisi" },
                  { value: "dibatalkan", label: "Dibatalkan" },
                ]}
                placeholder="Filter Presensi"
                size="sm"
                className="w-full sm:w-auto"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {targetAttendanceUrl && (
                <Link
                  href={targetAttendanceUrl}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-all duration-150 cursor-pointer"
                >
                  <UserCheck className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Isi Presensi Sesi Terdekat</span>
                </Link>
              )}
              <Link
                href={`/teacher/attendance?classId=${classId}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-950 dark:hover:text-white active:scale-[0.98] px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-all duration-150 cursor-pointer"
              >
                <BarChart3 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Lihat Rekap Presensi Lengkap</span>
              </Link>
            </div>
          </div>

          {calendarSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Belum ada sesi pertemuan untuk kelas ini
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Jadwal dan sesi pertemuan yang diagendakan akan tampil di sini untuk pencatatan presensi.
              </p>
            </div>
          ) : filteredAttendanceSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tidak ada sesi yang cocok
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Tidak ditemukan sesi pertemuan dengan filter atau kata kunci pencarian yang dipilih.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAttendanceSearch("");
                    setAttendanceFilter("all");
                    setAttendancePage(1);
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              {/* Responsive Scrollable Table (Desktop & Mobile) */}
              <div
                tabIndex={0}
                role="region"
                aria-label="Tabel daftar presensi dan sesi pertemuan"
                className="w-full overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-blue-600/30 touch-pan-x"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <table className="w-full min-w-[760px] text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">No</th>
                      <th
                        scope="col"
                        aria-sort={attendanceSortState?.key === "tanggal" ? (attendanceSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="sticky left-12 z-20 min-w-[170px] max-w-[240px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAttendanceSort("tanggal")}
                          className="flex w-full items-center justify-between gap-1.5 py-3 px-4 sm:px-6 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Tanggal Pertemuan</span>
                          {attendanceSortState?.key === "tanggal" ? (
                            attendanceSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={attendanceSortState?.key === "waktu" ? (attendanceSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-left whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAttendanceSort("waktu")}
                          className="inline-flex w-full items-center justify-between gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Waktu Sesi</span>
                          {attendanceSortState?.key === "waktu" ? (
                            attendanceSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={attendanceSortState?.key === "status" ? (attendanceSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-center whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAttendanceSort("status")}
                          className="inline-flex w-full items-center justify-center gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Status Sesi</span>
                          {attendanceSortState?.key === "status" ? (
                            attendanceSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={attendanceSortState?.key === "presensi" ? (attendanceSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAttendanceSort("presensi")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Kehadiran Siswa</span>
                          {attendanceSortState?.key === "presensi" ? (
                            attendanceSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th scope="col" className="md:sticky md:right-0 md:z-20 py-3 px-4 sm:px-6 text-right bg-slate-50 dark:bg-slate-800 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedAttendanceSessions.map((session, idx) => {
                      const sessionUrl = `/teacher/classes/${classId}/sessions/${session.tanggalPertemuan}/attendance?sesi=${session.jadwalItemId}`;
                      const isUnrecorded =
                        (session.isPast || session.isToday) && session.presensiCount === 0;
                      const isCompleted = session.presensiCount > 0;
                      const sesiLabel = session.sesiPertemuanId
                        ? sessionLabelMap.get(session.sesiPertemuanId)
                        : null;
                      const shortMeetingName = sesiLabel
                        ? sesiLabel.match(/^(Pertemuan\s*#\d+)/i)?.[1]
                        : null;

                      return (
                        <tr
                          key={`${session.jadwalItemId}:${session.tanggalPertemuan}`}
                          className="group/row relative border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* 1. Nomor Urut (Sticky Left 0) */}
                          <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs transition-colors">
                            {(currentAttendancePage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>

                          {/* 2. Tanggal Pertemuan (Sticky Left 12) */}
                          <td className="sticky left-12 z-10 min-w-[170px] max-w-[240px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 sm:px-6 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                            <div className="min-w-0">
                              <span
                                className="font-medium text-slate-950 dark:text-slate-50 text-sm truncate block"
                                title={session.tanggalPertemuan}
                              >
                                {session.tanggalPertemuan}
                              </span>
                              {shortMeetingName ? (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                  {shortMeetingName}
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* 3. Waktu Pelaksanaan */}
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                            {session.jamMulai} - {session.jamSelesai} WIB
                          </td>

                          {/* 4. Status Sesi */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-2 text-xs font-medium">
                              <span
                                className={`size-1.5 rounded-full ${
                                  session.statusSesi === "dibatalkan"
                                    ? "bg-rose-500"
                                    : isCompleted
                                    ? "bg-emerald-500"
                                    : isUnrecorded
                                    ? "bg-amber-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span className="text-slate-700 dark:text-slate-300">
                                {session.statusSesi === "dibatalkan"
                                  ? "Dibatalkan"
                                  : isCompleted
                                  ? "Terisi"
                                  : isUnrecorded
                                  ? "Belum Presensi"
                                  : "Terjadwal"}
                              </span>
                            </span>
                          </td>

                          {/* 5. Pencatatan Kehadiran */}
                          <td className="py-3 px-4 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                            {isCompleted ? (
                              <span>
                                {session.presensiCount}/{session.pesertaCount}{" "}
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                                  ({session.pesertaCount > 0 ? Math.round((session.presensiCount / session.pesertaCount) * 100) : 0}%)
                                </span>
                              </span>
                            ) : isUnrecorded ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                0/{session.pesertaCount}{" "}
                                <span className="text-xs text-amber-600/70 dark:text-amber-400/70 font-normal">(0%)</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">
                                Belum berlangsung
                              </span>
                            )}
                          </td>

                          {/* 6. Aksi (Sticky Right on Desktop, Scrolls on Mobile) */}
                          <td className="md:sticky md:right-0 md:z-10 py-3 px-4 sm:px-6 text-right bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2 opacity-90 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                              {session.statusSesi !== "dibatalkan" ? (
                                <Link
                                  href={sessionUrl}
                                  className="size-8 sm:size-7.5 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
                                  title={isCompleted ? "Ubah Presensi Siswa" : "Isi Presensi Siswa"}
                                  aria-label={`${isCompleted ? "Ubah" : "Isi"} presensi sesi ${session.tanggalPertemuan}`}
                                >
                                  {isCompleted ? (
                                    <Pencil className="size-3.5" aria-hidden="true" />
                                  ) : (
                                    <ClipboardCheck className="size-3.5" aria-hidden="true" />
                                  )}
                                </Link>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-600 px-2">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <TablePagination
                currentPage={currentAttendancePage}
                totalPages={totalAttendancePages}
                totalItems={filteredAttendanceSessions.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemLabel="sesi pertemuan"
                onPageChange={setAttendancePage}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TUGAS & ASESMEN */}
      {activeTab === "assessments" && (
        <div className="space-y-4">
          {/* Section Toolbar: Search & Filter left, Create Action right */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <label htmlFor="search-assessment" className="sr-only">
                  Cari nama tugas
                </label>
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="search-assessment"
                  type="search"
                  autoComplete="off"
                  placeholder="Cari nama tugas..."
                  value={assessmentSearch}
                  onChange={(e) => {
                    setAssessmentSearch(e.target.value);
                    setAssessmentPage(1);
                  }}
                  className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors shadow-2xs"
                />
                {assessmentSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAssessmentSearch("");
                      setAssessmentPage(1);
                    }}
                    aria-label="Hapus pencarian tugas"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              <FilterDropdown
                value={assessmentStatusFilter}
                onChange={(val) => {
                  setAssessmentStatusFilter(val as "all" | "terbit" | "draf");
                  setAssessmentPage(1);
                }}
                options={[
                  { value: "all", label: "Semua Status" },
                  { value: "terbit", label: "Terbit" },
                  { value: "draf", label: "Draf" },
                ]}
                placeholder="Status Tugas"
                size="sm"
                className="w-full sm:w-auto"
              />

              <FilterDropdown
                value={assessmentSessionFilter}
                onChange={(val) => {
                  setAssessmentSessionFilter(val);
                  setAssessmentPage(1);
                }}
                options={sessionFilterOptions}
                placeholder="Pilih Pertemuan"
                size="sm"
                className="w-full sm:w-auto"
              />

              <FilterDropdown
                value={assessmentCompletionFilter}
                onChange={(val) => {
                  setAssessmentCompletionFilter(val as "all" | "lengkap" | "belum");
                  setAssessmentPage(1);
                }}
                options={[
                  { value: "all", label: "Semua Nilai" },
                  { value: "lengkap", label: "Sudah Lengkap" },
                  { value: "belum", label: "Belum Lengkap" },
                ]}
                placeholder="Kelengkapan Nilai"
                size="sm"
                className="w-full sm:w-auto"
              />
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingAssessment(null);
                  setIsAssessmentModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all duration-150 cursor-pointer"
              >
                <Plus className="size-4 shrink-0" aria-hidden="true" />
                <span>Buat Tugas</span>
              </button>
            </div>
          </div>

          {assessments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Belum ada tugas untuk kelas ini
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Buat tugas pertama untuk mulai mencatat penilaian siswa di rombongan belajar ini.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsAssessmentModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all duration-150 cursor-pointer"
                >
                  <Plus className="size-4 shrink-0" aria-hidden="true" />
                  <span>Buat Tugas Pertama</span>
                </button>
              </div>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tidak ada tugas yang cocok
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Tidak ditemukan tugas dengan filter atau kata kunci pencarian yang dipilih.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAssessmentSearch("");
                    setAssessmentStatusFilter("all");
                    setAssessmentSessionFilter("all");
                    setAssessmentCompletionFilter("all");
                    setAssessmentPage(1);
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              {/* Responsive Scrollable Table (Desktop & Mobile) */}
              <div
                tabIndex={0}
                role="region"
                aria-label="Tabel daftar tugas dan asesmen"
                className="w-full overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-blue-600/30 touch-pan-x"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <table className="w-full min-w-[760px] text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">No</th>
                      <th
                        scope="col"
                        aria-sort={assessmentSortState?.key === "nama" ? (assessmentSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="sticky left-12 z-20 min-w-[160px] max-w-[240px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAssessmentSort("nama")}
                          className="flex w-full items-center justify-between gap-1.5 py-3 px-4 sm:px-6 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Nama Tugas</span>
                          {assessmentSortState?.key === "nama" ? (
                            assessmentSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={assessmentSortState?.key === "dinilai" ? (assessmentSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAssessmentSort("dinilai")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Dinilai</span>
                          {assessmentSortState?.key === "dinilai" ? (
                            assessmentSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={assessmentSortState?.key === "status" ? (assessmentSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-center whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAssessmentSort("status")}
                          className="inline-flex w-full items-center justify-center gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Status</span>
                          {assessmentSortState?.key === "status" ? (
                            assessmentSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={assessmentSortState?.key === "pertemuan" ? (assessmentSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 whitespace-nowrap text-left"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAssessmentSort("pertemuan")}
                          className="inline-flex w-full items-center justify-between gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Pertemuan</span>
                          {assessmentSortState?.key === "pertemuan" ? (
                            assessmentSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={assessmentSortState?.key === "tanggalPertemuan" ? (assessmentSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 whitespace-nowrap text-left"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAssessmentSort("tanggalPertemuan")}
                          className="inline-flex w-full items-center justify-between gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Tanggal Pertemuan</span>
                          {assessmentSortState?.key === "tanggalPertemuan" ? (
                            assessmentSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={assessmentSortState?.key === "tanggal" ? (assessmentSortState.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 whitespace-nowrap text-left"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAssessmentSort("tanggal")}
                          className="inline-flex w-full items-center justify-between gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Tanggal Penilaian</span>
                          {assessmentSortState?.key === "tanggal" ? (
                            assessmentSortState.dir === "asc" ? (
                              <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th scope="col" className="md:sticky md:right-0 md:z-20 py-3 px-4 sm:px-6 text-right bg-slate-50 dark:bg-slate-800 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedAssessments.map((a, idx) => (
                      <tr
                        key={a.id}
                        className="group/row relative border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* 1. Nomor Urut (Sticky Left 0) */}
                        <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs transition-colors">
                          {(currentAssessmentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>

                        {/* 2. Nama Tugas (Sticky Left 12, Truncate, Plain Text) */}
                        <td className="sticky left-12 z-10 min-w-[160px] max-w-[240px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 sm:px-6 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                          <span
                            className="font-medium text-slate-950 dark:text-slate-50 text-sm truncate block"
                            title={a.nama}
                          >
                            {a.nama}
                          </span>
                        </td>

                        {/* 3. Dinilai */}
                        <td className="py-3 px-4 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                          {a.countDinilai}/{a.totalSiswa}
                        </td>

                        {/* 4. Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-2 text-xs font-medium">
                            <span
                              className={`size-1.5 rounded-full ${
                                a.draf ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                              {a.draf ? "Draf" : "Terbit"}
                            </span>
                          </span>
                        </td>

                        {/* 5. Pertemuan */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                          {a.sesiLabel ? (
                            <span
                              className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-slate-700 dark:text-slate-300 cursor-default"
                              title={a.sesiLabel}
                            >
                              {a.sesiLabel.match(/^(Pertemuan\s*#\d+)/i)?.[1] ?? a.sesiLabel}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                          )}
                        </td>

                        {/* 6. Tanggal Pertemuan */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                          {a.tanggalPertemuan ? (
                            <span>{a.tanggalPertemuan}</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                          )}
                        </td>

                        {/* 7. Tanggal Penilaian */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                          {a.tanggal}
                        </td>

                        {/* 7. Aksi (Sticky Right on Desktop, Scrolls on Mobile) */}
                        <td className="md:sticky md:right-0 md:z-10 py-3 px-4 sm:px-6 text-right bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                          <div className="flex items-center justify-end gap-1.5 sm:gap-2 opacity-90 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                            <button
                              type="button"
                              onClick={() => setEditingAssessment(a)}
                              className="size-8 sm:size-7.5 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 p-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                              title="Ubah Rincian Tugas"
                              aria-label={`Ubah rincian tugas ${a.nama}`}
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <Link
                              href={`/teacher/grades/assessment/${a.id}?from=class`}
                              className="size-8 sm:size-7.5 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-400 dark:hover:border-slate-600 p-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                              title="Nilai Siswa"
                              aria-label={`Nilai siswa untuk tugas ${a.nama}`}
                            >
                              <ClipboardCheck className="size-3.5" />
                            </Link>
                            <button
                              type="button"
                              disabled={isDeletingAssessmentId === a.id || isPendingDelete}
                              onClick={() => handleDeleteAssessment(a.id, a.nama)}
                              className="size-8 sm:size-7.5 inline-flex items-center justify-center rounded-lg border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-400 p-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                              title="Hapus Tugas"
                              aria-label={`Hapus tugas ${a.nama}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <TablePagination
                currentPage={currentAssessmentPage}
                totalPages={totalAssessmentPages}
                totalItems={filteredAssessments.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemLabel="tugas"
                onPageChange={setAssessmentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RINGKASAN & AKSI KELAS */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Card 1: Statistik Mengajar (KPIs are type, not tiles) */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Statistik Kelas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ringkasan kuota dan aktivitas data kelas.
              </p>
            </div>

            <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Status Kelas</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                  {classStatus === "aktif" ? "Aktif" : classStatus}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Siswa Aktif</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.activeStudents} siswa
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Entri Penilaian Guru</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.totalGradeEntries} entri
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Presensi Tercatat</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.totalRecordedAttendance} data
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Kapasitas Kuota</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {students.length}/{kuotaMaksimum} ({capacityPct}%)
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Kuota Minimum</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                  {kuotaMinimum} siswa
                </dd>
              </div>
            </dl>

            <div className="pt-1">
              <div className="h-1.5 w-full overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded ${
                    capacityPct >= 90 ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Unduhan & Rekapitulasi */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Aksi & Rekap Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ekspor data kelas dan kelola dokumentasi belajar siswa.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href={`/teacher/classes/${classId}/reports`}
                className="flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs active:scale-[0.99] transition-all"
              >
                <div className="flex items-start gap-2.5">
                  <FileSpreadsheet className="size-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Rapor Semester
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pengisian capaian akhir dan rapor semester murid
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Buka
                </span>
              </Link>

              <Link
                href="/teacher/status"
                className="flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs active:scale-[0.99] transition-all"
              >
                <div className="flex items-start gap-2.5">
                  <Camera className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Dokumentasi Belajar
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bagikan foto kegiatan pembelajaran ke orang tua
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Buka
                </span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setExportInitialType("attendance");
                  setIsExportModalOpen(true);
                }}
                className="w-full flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <Download className="size-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Rekap Presensi (CSV)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unduh riwayat kehadiran seluruh sesi rombel
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Unduh
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportInitialType("grades");
                  setIsExportModalOpen(true);
                }}
                className="w-full flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <Download className="size-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Rekap Nilai (CSV)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unduh data nilai tugas dan asesmen siswa
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Unduh
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAYS: MODALS & SLIDE-OVER DRAWERS */}
      {/* 1. ExportClassModal (Stripe style) */}
      <ExportClassModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        classId={classId}
        initialType={exportInitialType}
      />

      {/* 2. QuickAssessmentModal (Linear style) */}
      <QuickAssessmentModal
        isOpen={isAssessmentModalOpen || editingAssessment !== null}
        onClose={() => {
          setIsAssessmentModalOpen(false);
          setEditingAssessment(null);
        }}
        classId={classId}
        sessions={sessions}
        initialData={editingAssessment}
        onSuccess={() => {
          setActiveTab("assessments");
          setEditingAssessment(null);
          router.refresh();
        }}
      />

      {/* 3. QuickGradeDrawer (Google Classroom SpeedGrader style) */}
      <QuickGradeDrawer
        isOpen={gradingStudentId != null}
        onClose={() => setGradingStudentId(null)}
        student={currentGradingStudent}
        studentIndex={gradingStudentIndex}
        totalStudents={filteredStudents.length}
        onNextStudent={handleNextStudent}
        onPrevStudent={handlePrevStudent}
        classId={classId}
        assessments={assessments}
        onSavedSuccess={handleGradeSavedSuccess}
      />

      {/* 4. StudentProfileDrawer (Slide-over drawer) */}
      <StudentProfileDrawer
        isOpen={profileStudentId != null}
        onClose={() => setProfileStudentId(null)}
        student={students.find((s) => s.id === profileStudentId) ?? null}
        classId={classId}
        onOpenGrading={(pid) => setGradingStudentId(pid)}
      />

      {/* Hidden File Input untuk pilih foto status langsung dari dialog file picker native */}
      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoFileSelected}
        className="hidden"
      />

      {/* 5. WhatsappStoryCreatorModal (WhatsApp Story Creator) */}
      <WhatsappStoryCreatorModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusCreatorPhotos([]);
        }}
        defaultClassId={classId}
        initialMode={statusCreatorMode}
        initialPhotos={statusCreatorPhotos}
        classes={[
          {
            id: classId,
            nama: `${className} · ${jenjang} ${tingkat ? `(${tingkat})` : ""}`,
            jenjang,
            students: students.map((s) => ({
              pendaftaranId: s.id,
              anakId: s.anakId,
              namaAnak: s.nama,
            })),
          },
        ]}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
