'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { laporkanFotoStatus } from '@/app/actions/teacher';

export interface LearningStatusItem {
  id: number;
  kelasId: number;
  kelasNama: string;
  guruNama?: string;
  kontenTeks: string;
  mediaUrls: string[];
  diterbitkanPada: string;
}

interface Props {
  statuses: LearningStatusItem[];
}

export function LearningStatusFeed({ statuses }: Props) {
  const t = useTranslations('parent');
  const [reportingStatusId, setReportingStatusId] = useState<number | null>(null);
  const [alasan, setAlasan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (statuses.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
        <p className="text-sm text-slate-500">{t('noStatusFeed')}</p>
      </div>
    );
  }

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingStatusId || !alasan.trim()) return;

    startTransition(async () => {
      setReportError(null);
      const res = await laporkanFotoStatus({
        statusId: reportingStatusId,
        alasan: alasan.trim(),
        catatan: catatan.trim(),
      });

      if (res.error) {
        setReportError(res.error);
      } else {
        setReportSuccess(t('reportSuccess'));
        setTimeout(() => {
          setReportingStatusId(null);
          setAlasan('');
          setCatatan('');
          setReportSuccess(null);
        }, 2000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {statuses.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-600">
                {item.kelasNama}
              </span>
              {item.guruNama && (
                <>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span className="text-xs text-slate-500">{item.guruNama}</span>
                </>
              )}
              <span className="mx-1.5 text-slate-300">·</span>
              <span className="text-xs text-slate-400">
                {new Date(item.diterbitkanPada).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {item.mediaUrls.length > 0 && (
              <button
                type="button"
                onClick={() => setReportingStatusId(item.id)}
                className="text-xs text-slate-400 hover:text-red-600"
              >
                {t('reportPhoto')}
              </button>
            )}
          </div>

          {item.kontenTeks && (
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-slate-800">
              {item.kontenTeks}
            </p>
          )}

          {item.mediaUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {item.mediaUrls.map((url, i) => (
                <div
                  key={i}
                  className="flex h-24 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-500"
                >
                  <span className="line-clamp-2 text-center">[Foto {i + 1}: {url}]</span>
                </div>
              ))}
            </div>
          )}

          {/* Modal / Dialog Lapor Foto */}
          {reportingStatusId === item.id && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <h4 className="text-sm font-semibold text-amber-900">{t('reportPhotoTitle')}</h4>
              {reportError && (
                <p className="mt-2 text-xs text-red-600">{reportError}</p>
              )}
              {reportSuccess && (
                <p className="mt-2 text-xs text-emerald-600">{reportSuccess}</p>
              )}
              <form onSubmit={handleReportSubmit} className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    {t('reportReason')}
                  </label>
                  <input
                    type="text"
                    required
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    placeholder={t('reportReasonPlaceholder')}
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    {t('reportNotes')}
                  </label>
                  <textarea
                    rows={2}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportingStatusId(null)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !alasan.trim()}
                    className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPending ? t('submittingReport') : t('reportPhoto')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
