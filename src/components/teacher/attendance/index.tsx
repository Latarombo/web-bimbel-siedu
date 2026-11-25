'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { AttendanceTable, type SiswaPresensi } from './attendance-table';
import { SessionJournalForm } from './session-journal-form';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { QuickAssessmentModal } from '@/components/teacher/classes/quick-assessment-modal';

interface TeacherAttendanceManagerProps {
  kelasId: number;
  jadwalItemId: number;
  tanggal: string;
  siswa: SiswaPresensi[];
  catatanPertemuan?: {
    materi?: string | null;
    pr?: string | null;
    draf?: boolean;
    diterbitkanPada?: string | null;
  } | null;
  classNameTitle?: string;
  sesiId?: number;
  tugasSesi?: {
    id: number;
    nama: string;
    nilaiMaksimum: string | number;
    draf: boolean;
    tanggal: string;
  }[];
}

export function TeacherAttendanceManager({
  kelasId,
  jadwalItemId,
  tanggal,
  siswa,
  catatanPertemuan,
  classNameTitle,
  sesiId,
  tugasSesi = [],
}: TeacherAttendanceManagerProps) {
  const t = useTranslations('teacher');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'attendance' | 'journal' | 'tasks'>('attendance');
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Propify Underline Tab Navigation with sliding indicator */}
      <UnderlineTabs
        tabs={[
          { id: 'attendance', label: t('attendanceList') },
          { id: 'journal', label: t('sessionNotesTitle') },
          { id: 'tasks', label: `${t('sessionTasks')}${tugasSesi.length > 0 ? ` (${tugasSesi.length})` : ''}` },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as 'attendance' | 'journal' | 'tasks')}
        ariaLabel="Tabs Presensi, Jurnal & Tugas"
        layoutId="teacher-attendance-tabs"
      />

      {/* Tab Panels */}
      {activeTab === 'attendance' && (
        <section aria-label="Presensi Siswa">
          <AttendanceTable
            kelasId={kelasId}
            jadwalItemId={jadwalItemId}
            tanggal={tanggal}
            siswa={siswa}
          />
        </section>
      )}

      {activeTab === 'journal' && (
        <section aria-label="Jurnal Pembelajaran">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
            <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">
                {t('sessionNotesTitle')}
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {t('sessionNotesHelp')}
              </p>
            </div>
            <SessionJournalForm
              kelasId={kelasId}
              jadwalItemId={jadwalItemId}
              tanggal={tanggal}
              initialMateri={catatanPertemuan?.materi ?? ''}
              initialPr={catatanPertemuan?.pr ?? ''}
              isDraf={catatanPertemuan?.draf ?? true}
              diterbitkanPada={catatanPertemuan?.diterbitkanPada ?? null}
              classNameTitle={classNameTitle}
            />
          </div>
        </section>
      )}

      {activeTab === 'tasks' && (
        <section aria-label="Tugas Sesi Pertemuan">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">
                  {t('sessionTasks')}
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Tugas atau asesmen yang terhubung khusus dengan pertemuan sesi ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(true)}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>{t('createTaskForSession')}</span>
              </button>
            </div>

            {tugasSesi.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('noTasksForSession')}
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsAssessmentModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>{t('createTaskForSession')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tugasSesi.map((task) => (
                  <div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <Link
                        href={`/teacher/grades/assessment/${task.id}?from=class`}
                        className="text-sm font-semibold text-slate-950 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {task.nama}
                      </Link>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>Batas/Tanggal: {task.tanggal}</span>
                        <span>·</span>
                        <span>Maks Nilai: {String(task.nilaiMaksimum)}</span>
                        <span>·</span>
                        <span className={task.draf ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {task.draf ? 'Draf' : 'Terbit'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/teacher/grades/assessment/${task.id}?from=class`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors"
                      >
                        <span>Kelola & Nilai</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* QuickAssessmentModal prefilled with this session */}
      {sesiId ? (
        <QuickAssessmentModal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          classId={kelasId}
          defaultSesiId={sesiId}
          sessions={[{ id: sesiId, label: `Sesi ${tanggal}` }]}
          onSuccess={() => {
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

export * from './session-stat-strip';
export * from './attendance-sticky-bar';
export * from './attendance-table';
export * from './session-journal-form';
