'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { saveCatatanPertemuan, GuruState } from '@/app/actions/teacher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Textarea } from '@/components/ui/field';

interface CatatanPertemuanFormProps {
  kelasId: number;
  jadwalItemId: number;
  tanggal: string;
  initialMateri?: string;
  initialPr?: string;
  isDraf?: boolean;
  diterbitkanPada?: string | null;
}

export default function CatatanPertemuanForm({
  kelasId,
  jadwalItemId,
  tanggal,
  initialMateri = '',
  initialPr = '',
  isDraf = true,
  diterbitkanPada = null,
}: CatatanPertemuanFormProps) {
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
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="kelas_id" value={kelasId} />
      <input type="hidden" name="jadwal_item_id" value={jadwalItemId} />
      <input type="hidden" name="tanggal" value={tanggal} />
      <input type="hidden" name="aksi" value={actionType} />

      {/* Header status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">{t('status')}:</span>
          {isPublished ? (
            <Badge tone="emerald">{t('published')}</Badge>
          ) : (
            <Badge tone="slate">{t('draftStatus')}</Badge>
          )}
        </div>
        {isPublished && diterbitkanPada ? (
          <span className="text-slate-500 tabular-nums">
            {new Date(diterbitkanPada).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Jakarta',
            })}{' '}
            {t('timeZone')}
          </span>
        ) : null}
      </div>

      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700"
        >
          {state.error}
        </div>
      ) : null}

      {state.ok && !state.error ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700"
        >
          {actionType === 'terbitkan'
            ? t('sessionNotesPublished')
            : actionType === 'tarik'
              ? t('sessionNotesWithdrawn')
              : t('sessionNotesSaved')}
        </div>
      ) : null}

      <Field label={t('materials')}>
        <Textarea
          id="catatan-materi"
          name="materi"
          value={materi}
          onChange={(e) => setMateri(e.target.value)}
          placeholder={t('materialsPlaceholder')}
          rows={3}
          className="mt-1 w-full text-xs leading-relaxed"
        />
      </Field>

      <Field label={t('homework')}>
        <Textarea
          id="catatan-pr"
          name="pr"
          value={pr}
          onChange={(e) => setPr(e.target.value)}
          placeholder={t('homeworkPlaceholder')}
          rows={2}
          className="mt-1 w-full text-xs leading-relaxed"
        />
      </Field>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        {isPublished ? (
          <>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              onClick={() => setActionType('tarik')}
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
