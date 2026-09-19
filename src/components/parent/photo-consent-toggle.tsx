'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updatePersetujuanFoto } from '@/app/actions/teacher';

interface Props {
  anakId: number;
  initialConsent: boolean;
}

export function PhotoConsentToggle({ anakId, initialConsent }: Props) {
  const t = useTranslations('parent');
  const [consent, setConsent] = useState(initialConsent);
  const [alasan, setAlasan] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [feedback, setFeedback] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (newVal: boolean) => {
    setConsent(newVal);
    setShowReasonInput(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      setFeedback(null);
      const res = await updatePersetujuanFoto({
        anakId,
        persetujuan: consent,
        alasan: alasan.trim() || undefined,
      });

      if (res.error) {
        setFeedback({ error: res.error });
      } else {
        setFeedback({ ok: true });
        setShowReasonInput(false);
        setAlasan('');
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{t('consentPhotoTitle')}</h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {t('consentPhotoDesc')}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            consent
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {consent ? t('consentActive') : t('consentRevoked')}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleToggle(!consent)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            consent ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              consent ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-xs text-slate-700">
          {consent ? 'Izin publikasi foto diberikan' : 'Izin publikasi foto dicabut'}
        </span>
      </div>

      {showReasonInput && (
        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 space-y-3">
          <label className="block text-xs font-medium text-slate-700">
            Alasan perubahan izin foto (opsional):
          </label>
          <input
            type="text"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="cth: Permintaan privasi keluarga..."
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setConsent(initialConsent);
                setShowReasonInput(false);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Perubahan Izin'}
            </button>
          </div>
        </div>
      )}

      {feedback?.error && (
        <p className="mt-3 text-xs text-red-600">{feedback.error}</p>
      )}
      {feedback?.ok && (
        <p className="mt-3 text-xs text-emerald-600">Persetujuan foto berhasil diperbarui.</p>
      )}
    </div>
  );
}
