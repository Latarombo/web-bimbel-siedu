'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { saveCatatanPertemuan, type GuruState } from '@/app/actions/teacher';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { createSessionNotesWaLink } from '@/lib/whatsapp';

interface SessionJournalFormProps {
  kelasId: number;
  jadwalItemId: number;
  tanggal: string;
  initialMateri?: string;
  initialPr?: string;
  isDraf?: boolean;
  diterbitkanPada?: string | null;
  classNameTitle?: string;
}

export function SessionJournalForm({
  kelasId,
  jadwalItemId,
  tanggal,
  initialMateri = '',
  initialPr = '',
  isDraf = true,
  diterbitkanPada = null,
  classNameTitle,
}: SessionJournalFormProps) {
  const t = useTranslations('teacher');
  const [state, formAction, isPending] = useActionState<GuruState, FormData>(
    saveCatatanPertemuan,
    {},
  );

  const [materi, setMateri] = useState(initialMateri);
  const [pr, setPr] = useState(initialPr);
  const [actionType, setActionType] = useState<'draf' | 'terbitkan' | 'tarik'>('draf');

  const waLink = createSessionNotesWaLink({
    className: classNameTitle || `Kelas #${kelasId}`,
    sessionDate: tanggal,
    materi: materi,
    pr: pr,
    portalUrl: typeof window !== 'undefined' ? window.location.origin : 'https://siedu.id',
  });

  const isPublished = !isDraf && Boolean(diterbitkanPada);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="kelas_id" value={kelasId} />
      <input type="hidden" name="jadwal_item_id" value={jadwalItemId} />
      <input type="hidden" name="tanggal" value={tanggal} />
      <input type="hidden" name="aksi" value={actionType} />

      {/* Header Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Status Jurnal:
            </span>
            {isPublished ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {t('published')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                <span className="size-1.5 rounded-full bg-slate-400" />
                {t('draftStatus')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {isPublished
              ? 'Catatan dapat dibaca langsung oleh wali murid di portal orang tua.'
              : 'Masih berupa draf pribadi. Belum dipublikasikan ke orang tua.'}
          </p>
        </div>

        {isPublished && diterbitkanPada ? (
          <div className="text-right text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Diterbitkan pada: </span>
            <span className="tabular-nums font-semibold">
              {new Date(diterbitkanPada).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Jakarta',
              })}{' '}
              {t('timeZone')}
            </span>
          </div>
        ) : null}
      </div>

      {/* Info Notice */}
      <div className="flex items-start gap-3 rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/20 p-3 text-xs text-blue-800 dark:text-blue-300">
        <Info className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <p className="leading-relaxed">
          {t('sessionNotesHelp')}
        </p>
      </div>

      {/* Status Alerts */}
      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-800 dark:text-rose-300"
        >
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.ok && !state.error ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-md border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-300"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            {actionType === 'terbitkan'
              ? t('sessionNotesPublished')
              : actionType === 'tarik'
                ? t('sessionNotesWithdrawn')
                : t('sessionNotesSaved')}
          </span>
        </div>
      ) : null}

      {/* Materi Pembelajaran Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="catatan-materi"
            className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-slate-100"
          >
            <span>{t('materials')}</span>
            <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
              (Wajib jika diterbitkan)
            </span>
          </label>
          <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {materi.length} karakter
          </span>
        </div>
        <textarea
          id="catatan-materi"
          name="materi"
          value={materi}
          onChange={(e) => setMateri(e.target.value)}
          placeholder={t('materialsPlaceholder')}
          rows={4}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-slate-100 leading-relaxed transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Pekerjaan Rumah (PR) Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="catatan-pr"
            className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-slate-100"
          >
            <span>{t('homework')}</span>
            <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
              (Opsional)
            </span>
          </label>
          <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {pr.length} karakter
          </span>
        </div>
        <textarea
          id="catatan-pr"
          name="pr"
          value={pr}
          onChange={(e) => setPr(e.target.value)}
          placeholder={t('homeworkPlaceholder')}
          rows={3}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-slate-100 leading-relaxed transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />

        {pr.trim().length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('homeworkAssessmentHint')}
            </p>
            <Link
              href={`/teacher/grades/new?kelasId=${kelasId}&nama=${encodeURIComponent(
                pr.trim().length > 60 ? pr.trim().slice(0, 57) + '...' : pr.trim()
              )}&tanggal=${tanggal}`}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-colors shrink-0 cursor-pointer"
            >
              <span>{t('createAssessmentFromHomework')}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
        <div>
          {materi.trim().length > 0 ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-colors cursor-pointer"
            >
              <span>Bagikan ke WhatsApp</span>
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isPublished ? (
            <>
              <button
                type="submit"
                disabled={isPending}
                onClick={() => setActionType('tarik')}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <span>{t('withdrawToDraft')}</span>
              </button>
              <button
                type="submit"
                disabled={isPending}
                onClick={() => setActionType('terbitkan')}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                <span>{isPending ? t('saving') : t('sessionJournalSaveChanges')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={isPending}
                onClick={() => setActionType('draf')}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <span>{t('saveDraft')}</span>
              </button>
              <button
                type="submit"
                disabled={isPending}
                onClick={() => setActionType('terbitkan')}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                <span>{isPending ? t('saving') : t('publishToParents')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
