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
}

export function TeacherAttendanceManager({
  kelasId,
  jadwalItemId,
  tanggal,
  siswa,
  catatanPertemuan,
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
      {/* Segmented Dual-Tab Navigation */}
      <div className="flex rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1.5 sm:inline-flex">
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="size-4" />
          <span>{t('attendanceList')}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
              isComplete
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200/80 text-slate-700'
            }`}
          >
            {terisiCount}/{siswa.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'journal'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="size-4" />
          <span>{t('sessionNotesTitle')}</span>
          {isJournalPublished ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 className="size-3" />
              {t('published')}
            </span>
          ) : (
            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {t('draftStatus')}
            </span>
          )}
        </button>
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
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
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
