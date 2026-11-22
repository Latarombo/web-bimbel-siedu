'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AttendanceTable, type SiswaPresensi } from './attendance-table';
import { SessionJournalForm } from './session-journal-form';
import { UnderlineTabs } from '@/components/ui/underline-tabs';

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
}

export function TeacherAttendanceManager({
  kelasId,
  jadwalItemId,
  tanggal,
  siswa,
  catatanPertemuan,
  classNameTitle,
}: TeacherAttendanceManagerProps) {
  const t = useTranslations('teacher');
  const [activeTab, setActiveTab] = useState<'attendance' | 'journal'>('attendance');

  return (
    <div className="space-y-6">
      {/* Propify Underline Tab Navigation with sliding indicator */}
      <UnderlineTabs
        tabs={[
          { id: 'attendance', label: t('attendanceList') },
          { id: 'journal', label: t('sessionNotesTitle') },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Tabs Presensi & Jurnal"
        layoutId="teacher-attendance-tabs"
      />

      {/* Tab Panels */}
      {activeTab === 'attendance' ? (
        <section aria-label="Presensi Siswa">
          <AttendanceTable
            kelasId={kelasId}
            jadwalItemId={jadwalItemId}
            tanggal={tanggal}
            siswa={siswa}
          />
        </section>
      ) : (
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
    </div>
  );
}

export * from './session-stat-strip';
export * from './attendance-sticky-bar';
export * from './attendance-table';
export * from './session-journal-form';
