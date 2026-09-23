'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { saveCatatanPertemuan, type GuruState } from '@/app/actions/teacher';
import {
  BookOpen,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Save,
  RotateCcw,
  Info,
  Loader2,
} from 'lucide-react';

interface SessionJournalFormProps {
  kelasId: number;
  jadwalItemId: number;
  tanggal: string;
  initialMateri?: string;
  initialPr?: string;
  isDraf?: boolean;
  diterbitkanPada?: string | null;
}

export function SessionJournalForm({
  kelasId,
  jadwalItemId,
  tanggal,
  initialMateri = '',
  initialPr = '',
  isDraf = true,
  diterbitkanPada = null,
}: SessionJournalFormProps) {
  const t = useTranslations('teacher');
  const [state, formAction, isPending] = useActionState<GuruState, FormData>(
    saveCatatanPertemuan,
    {},
  );

  const [materi, setMateri] = useState(initialMateri);
  const [pr, setPr] = useState(initialPr);
  const [actionType, setActionType] = useState<'draf' | 'terbitkan' | 'tarik'>('draf');

  const isPublished = !isDraf && Boolean(diterbitkanPada);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="kelas_id" value={kelasId} />
      <input type="hidden" name="jadwal_item_id" value={jadwalItemId} />
      <input type="hidden" name="tanggal" value={tanggal} />
      <input type="hidden" name="aksi" value={actionType} />

      {/* Header Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`grid size-9 place-items-center rounded-xl ${
              isPublished
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200/70 text-slate-700'
            }`}
          >
            {isPublished ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <Clock className="size-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Status Jurnal:
              </span>
              {isPublished ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {t('published')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                  <span className="size-1.5 rounded-full bg-slate-400" />
                  {t('draftStatus')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isPublished
                ? 'Catatan dapat dibaca langsung oleh wali murid di portal orang tua.'
                : 'Masih berupa draf pribadi. Belum dipublikasikan ke orang tua.'}
            </p>
          </div>
        </div>

        {isPublished && diterbitkanPada ? (
          <div className="text-right text-xs text-slate-500">
            <span className="font-medium text-slate-700">Diterbitkan pada: </span>
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
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-800">
        <Info className="size-4 shrink-0 mt-0.5 text-blue-600" />
        <p className="leading-relaxed">
          {t('sessionNotesHelp')}
        </p>
      </div>

      {/* Status Alerts */}
      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800"
        >
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.ok && !state.error ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
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
        <div className="flex items-center justify-between">
          <label
            htmlFor="catatan-materi"
            className="flex items-center gap-2 text-xs font-bold text-slate-800"
          >
            <BookOpen className="size-4 text-blue-600" />
            <span>{t('materials')}</span>
            <span className="text-[11px] font-normal text-slate-400">
              (Wajib jika diterbitkan)
            </span>
          </label>
          <span className="text-[11px] text-slate-400 tabular-nums">
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
          className="w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 text-xs text-slate-900 leading-relaxed transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        />
      </div>

      {/* Pekerjaan Rumah (PR) Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="catatan-pr"
            className="flex items-center gap-2 text-xs font-bold text-slate-800"
          >
            <ClipboardList className="size-4 text-amber-500" />
            <span>{t('homework')}</span>
            <span className="text-[11px] font-normal text-slate-400">
              (Opsional)
            </span>
          </label>
          <span className="text-[11px] text-slate-400 tabular-nums">
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
          className="w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 text-xs text-slate-900 leading-relaxed transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
        {isPublished ? (
          <>
            <button
              type="submit"
              disabled={isPending}
              onClick={() => setActionType('tarik')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>{t('withdrawToDraft')}</span>
            </button>
            <button
              type="submit"
              disabled={isPending}
              onClick={() => setActionType('terbitkan')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>{isPending ? t('saving') : t('sessionJournalSaveChanges')}</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              disabled={isPending}
              onClick={() => setActionType('draf')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Save className="size-3.5" />
              <span>{t('saveDraft')}</span>
            </button>
            <button
              type="submit"
              disabled={isPending}
              onClick={() => setActionType('terbitkan')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>{isPending ? t('saving') : t('publishToParents')}</span>
            </button>
          </>
        )}
      </div>
    </form>
  );
}
