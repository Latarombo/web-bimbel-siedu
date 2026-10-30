"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { Search, BookOpen, User, X, ArrowRight } from "lucide-react";

export interface QuickSearchClassItem {
  id: number;
  name: string;
  jenjang: string;
  tingkat?: string | null;
}

export interface QuickSearchStudentItem {
  id: number; // pendaftaranId
  nama: string;
  kelasNama: string;
}

interface TeacherQuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
  classes: QuickSearchClassItem[];
  students: QuickSearchStudentItem[];
}

export function TeacherQuickSearch({
  isOpen,
  onClose,
  classes,
  students,
}: TeacherQuickSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query when modal closes
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) setQuery("");
  }

  const filteredClasses = useMemo(() => {
    if (!query.trim()) return classes.slice(0, 4);
    const q = query.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.jenjang.toLowerCase().includes(q) ||
        (c.tingkat && c.tingkat.toLowerCase().includes(q))
    );
  }, [classes, query]);

  const filteredStudents = useMemo(() => {
    if (!query.trim()) return students.slice(0, 5);
    const q = query.toLowerCase();
    return students.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.kelasNama.toLowerCase().includes(q)
    );
  }, [students, query]);

  if (!isOpen) return null;

  const handleSelectClass = (id: number) => {
    onClose();
    router.push(`/teacher/classes/${id}`);
  };

  const handleSelectStudent = (id: number) => {
    onClose();
    router.push(`/teacher/grades/${id}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-search-title"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-900">
          <Search className="size-5 text-slate-400 shrink-0 mr-3" />
          <input
            id="quick-search-title"
            type="text"
            autoFocus
            placeholder="Cari siswa atau kelas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              ESC
            </kbd>
          )}
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Section: Kelas */}
          {filteredClasses.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Kelas Diampu
              </p>
              <div className="mt-1 space-y-0.5">
                {filteredClasses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClass(c.id)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-7 place-items-center rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <BookOpen className="size-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {c.name}
                        </span>
                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                          {c.jenjang} {c.tingkat ? `· ${c.tingkat}` : ""}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Siswa */}
          {filteredStudents.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Murid
              </p>
              <div className="mt-1 space-y-0.5">
                {filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s.id)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-7 place-items-center rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <User className="size-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {s.nama}
                        </span>
                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                          {s.kelasNama}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredClasses.length === 0 && filteredStudents.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Tidak ada hasil yang sesuai dengan kata kunci &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Tekan ESC untuk menutup</span>
          <span>Pilih hasil untuk membuka detail</span>
        </div>
      </div>
    </div>
  );
}
