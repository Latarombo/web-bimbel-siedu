'use client';

import React, { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { saveLaporanPerkembangan, tarikLaporanPerkembangan } from '@/app/actions/teacher';

interface LaporanPerkembanganFormProps {
  pendaftaranId: number;
  laporanId?: number | null;
  initialTanggal?: string;
  initialJudul?: string;
  initialCatatanInternal?: string | null;
  initialLaporanOrtu?: string | null;
  initialDraf?: boolean;
  diterbitkanPada?: string | null;
  onSuccess?: () => void;
}

export default function LaporanPerkembanganForm({
  pendaftaranId,
  laporanId = null,
  initialTanggal,
  initialJudul = 'Laporan Perkembangan',
  initialCatatanInternal = '',
  initialLaporanOrtu = '',
  initialDraf = true,
  diterbitkanPada = null,
  onSuccess,
}: LaporanPerkembanganFormProps) {
  const t = useTranslations('teacher');

  const todayStr = new Date().toISOString().slice(0, 10);
  const [tanggal, setTanggal] = useState(initialTanggal || todayStr);
  const [judul, setJudul] = useState(initialJudul);
  const [catatanInternal, setCatatanInternal] = useState(initialCatatanInternal || '');
  const [laporanOrtu, setLaporanOrtu] = useState(initialLaporanOrtu || '');
  const [actionType, setActionType] = useState<'draf' | 'terbitkan' | 'tarik'>('draf');
  const [showPreview, setShowPreview] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prev: any, formData: FormData) => {
      let result;
      if (actionType === 'tarik' && laporanId) {
        result = await tarikLaporanPerkembangan({ laporanId });
      } else {
        formData.set('aksi', actionType);
        result = await saveLaporanPerkembangan(prev, formData);
      }
      if (result.ok && onSuccess) {
        onSuccess();
      }
      return result;
    },
    { ok: false }
  );

  const isPublished = !initialDraf && diterbitkanPada !== null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="pendaftaran_id" value={pendaftaranId} />
      {laporanId ? <input type="hidden" name="laporan_id" value={laporanId} /> : null}
      <input type="hidden" name="aksi" value={actionType} />

      {/* Header status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">{t('status')}:</span>
          {isPublished ? (
            <Badge tone="emerald">{t('publishedStatus')}</Badge>
          ) : (
            <Badge tone="slate">{t('draftStatus')}</Badge>
          )}
        </div>
        {isPublished && diterbitkanPada ? (
          <span className="text-slate-500 tabular-nums">
            {new Date(diterbitkanPada).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Jakarta',
            })}
          </span>
        ) : null}
      </div>

      {state.error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {state.error}
        </div>
      ) : null}

      {state.ok && !state.error ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          {actionType === 'terbitkan'
            ? t('reportPublished')
            : actionType === 'tarik'
              ? t('reportWithdrawn')
              : t('reportSaved')}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('reportTitle')}>
          <Input
            type="text"
            name="judul"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder={t('reportTitlePlaceholder')}
            className="mt-1 w-full text-xs"
            required
          />
        </Field>

        <Field label={t('reportDate')}>
          <Input
            type="date"
            name="tanggal"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="mt-1 w-full text-xs"
            required
          />
        </Field>
      </div>

      {/* Catatan Internal Guru (Privat) */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="catatan_internal" className="text-xs font-bold text-amber-900">
            {t('internalNoteLabel')}
          </label>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            Privat
          </span>
        </div>
        <p className="mt-1 text-[11px] text-amber-700/90">
          {t('internalNoteHelp')}
        </p>
        <Textarea
          id="catatan_internal"
          name="catatan_internal"
          value={catatanInternal}
          onChange={(e) => setCatatanInternal(e.target.value)}
          placeholder={t('internalNotePlaceholder')}
          rows={3}
          className="mt-2 w-full border-amber-200 bg-white text-xs leading-relaxed"
        />
      </div>

      {/* Laporan untuk Orang Tua (Publik) */}
      <div className="rounded-xl border border-blue-200/80 bg-blue-50/30 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="laporan_ortu" className="text-xs font-bold text-blue-950">
            {t('parentReportLabel')}
          </label>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
            Untuk Orang Tua
          </span>
        </div>
        <p className="mt-1 text-[11px] text-blue-800/80">
          {t('parentReportHelp')}
        </p>
        <Textarea
          id="laporan_ortu"
          name="laporan_ortu"
          value={laporanOrtu}
          onChange={(e) => setLaporanOrtu(e.target.value)}
          placeholder={t('parentReportPlaceholder')}
          rows={4}
          className="mt-2 w-full border-blue-200 bg-white text-xs leading-relaxed"
        />

        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            {showPreview ? 'Sembunyikan Pratinjau' : t('parentPreview')}
          </button>
        </div>

        {showPreview ? (
          <div className="mt-3 rounded-lg border border-blue-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900">{judul || 'Laporan Perkembangan'}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {t('parentPreviewBadge')}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 tabular-nums">
              Tanggal: {tanggal}
            </p>
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-800">
              {laporanOrtu ? laporanOrtu : '(Belum ada teks laporan orang tua)'}
            </p>
          </div>
        ) : null}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        {isPublished ? (
          <>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                if (confirm(t('withdrawReportConfirm'))) {
                  setActionType('tarik');
                }
              }}
              className="text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            >
              {t('withdrawToDraft')}
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isPending}
              onClick={() => setActionType('terbitkan')}
              className="text-xs"
            >
              {isPending ? '...' : t('saveDraft')}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              onClick={() => setActionType('draf')}
              className="text-xs"
            >
              {t('saveDraft')}
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isPending}
              onClick={() => setActionType('terbitkan')}
              className="text-xs"
            >
              {isPending ? '...' : t('publishToParents')}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
