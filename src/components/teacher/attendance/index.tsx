'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AttendanceTable, type SiswaPresensi } from './attendance-table';
import { SessionJournalForm } from './session-journal-form';
import { Users, FileText, CheckCircle2 } from 'lucide-react';

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

  const terisiCount = siswa.filter((s) => s.status).length;
  const isComplete = siswa.length > 0 && terisiCount === siswa.length;
  const isJournalPublished =
    Boolean(catatanPertemuan) &&
    !catatanPertemuan?.draf &&
    Boolean(catatanPertemuan?.diterbitkanPada);

  return (
    <div className="space-y-6">
      {/* Propify Underline Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6" aria-label="Tabs Presensi & Jurnal">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="size-4" />
            <span>{t('attendanceList')}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                isComplete
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {terisiCount}/{siswa.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'journal'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="size-4" />
            <span>{t('sessionNotesTitle')}</span>
            {isJournalPublished ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3" />
                {t('published')}
              </span>
            ) : (
              <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                {t('draftStatus')}
              </span>
            )}
          </button>
        </nav>
      </div>

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
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                {t('sessionNotesTitle')}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
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
