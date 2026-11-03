'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { bagikanStatusPembelajaran, hapusStatusPembelajaran } from '@/app/actions/teacher';
import { CardSelect } from '@/components/ui/card-select';

export interface StudentRecipient {
  pendaftaranId: number;
  anakId: number;
  namaAnak: string;
  persetujuanFoto: boolean;
}

export interface ClassOption {
  id: number;
  nama: string;
  jenjang: string;
  students: StudentRecipient[];
}

export interface ExistingStatus {
  id: number;
  kelasId: number;
  kelasNama: string;
  kontenTeks: string;
  mediaUrls: string[];
  status: string;
  diterbitkanPada: string;
  kadaluarsaPada: string;
  penerimaCount: number;
}

interface StatusFormProps {
  classes: ClassOption[];
  pastStatuses: ExistingStatus[];
}

export default function StatusForm({ classes, pastStatuses }: StatusFormProps) {
  const t = useTranslations('teacher');
  const [selectedClassId, setSelectedClassId] = useState<number | ''>(
    classes.length > 0 ? classes[0].id : '',
  );
  const [kontenTeks, setKontenTeks] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentClass = classes.find((c) => c.id === selectedClassId);

  // When class changes, select all active students by default
  const handleClassChange = (classId: number | '') => {
    setSelectedClassId(classId);
    if (classId !== '') {
      const cls = classes.find((c) => c.id === classId);
      if (cls) {
        setSelectedRecipients(cls.students.map((s) => s.pendaftaranId));
      }
    } else {
      setSelectedRecipients([]);
    }
  };

  const toggleRecipient = (pendaftaranId: number) => {
    setSelectedRecipients((prev) =>
      prev.includes(pendaftaranId)
        ? prev.filter((id) => id !== pendaftaranId)
        : [...prev, pendaftaranId],
    );
  };

  const handleSelectAll = () => {
    if (!currentClass) return;
    if (selectedRecipients.length === currentClass.students.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(currentClass.students.map((s) => s.pendaftaranId));
    }
  };

  const handleAddPhoto = () => {
    const trimmed = photoInput.trim();
    if (!trimmed) return;
    if (photos.length >= 5) {
      setErrorMsg(t('statusMaxPhotos'));
      return;
    }
    setPhotos([...photos, trimmed]);
    setPhotoInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const hasRecipientWithoutPhotoConsent =
    photos.length > 0 &&
    currentClass?.students.some(
      (s) => selectedRecipients.includes(s.pendaftaranId) && !s.persetujuanFoto,
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedClassId) {
      setErrorMsg(t('classSelect'));
      return;
    }
    if (photos.length === 0 && !kontenTeks.trim()) {
      setErrorMsg(t('statusContentPlaceholder'));
      return;
    }
    if (selectedRecipients.length === 0) {
      setErrorMsg(t('noRecipientsAvailable'));
      return;
    }

    startTransition(async () => {
      const res = await bagikanStatusPembelajaran({
        kelasId: Number(selectedClassId),
        kontenTeks: kontenTeks.trim(),
        mediaUrls: photos,
        penerimaPendaftaranIds: selectedRecipients,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(t('statusSharedSuccess'));
        setKontenTeks('');
        setPhotos([]);
        setPhotoInput('');
      }
    });
  };

  const handleDelete = (statusId: number) => {
    if (!window.confirm(t('deleteStatusConfirm'))) return;
    startTransition(async () => {
      const res = await hapusStatusPembelajaran({ statusId });
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(t('statusDeletedSuccess'));
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Form Buat Status */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
        <h2 className="font-display text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100">{t('newStatusButton')}</h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{t('statusSubtitle')}</p>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Pilih Kelas */}
          <div>
            <label htmlFor="class-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('classSelect')}
            </label>
            <CardSelect
              id="class-select"
              value={selectedClassId ? String(selectedClassId) : ''}
              onChange={(val) => handleClassChange(val ? Number(val) : '')}
              options={classes.map((cls) => ({
                value: String(cls.id),
                label: `${cls.nama} (${cls.jenjang}) · ${cls.students.length} murid`,
              }))}
              placeholder={t('selectClassPlaceholder')}
              modalTitle={t('classSelect')}
            />
          </div>

          {/* Pemilih Penerima Murid */}
          {currentClass && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('recipients')}</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                >
                  {selectedRecipients.length === currentClass.students.length
                    ? t('statusCancelAll')
                    : t('selectAllRecipients')}
                </button>
              </div>

              {currentClass.students.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('noRecipientsAvailable')}</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {currentClass.students.map((student) => {
                    const isChecked = selectedRecipients.includes(student.pendaftaranId);
                    return (
                      <label
                        key={student.pendaftaranId}
                        className={`flex items-center justify-between rounded-lg border p-2.5 text-sm transition-colors cursor-pointer ${
                          isChecked
                            ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRecipient(student.pendaftaranId)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium">{student.namaAnak}</span>
                        </div>
                        {student.persetujuanFoto ? (
                          <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            {t('consentBadge')}
                          </span>
                        ) : (
                          <span className="rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                            {t('noConsentBadge')}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {hasRecipientWithoutPhotoConsent && (
                <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300">
                  {t('noConsentWarning')}
                </div>
              )}
            </div>
          )}

          {/* Konten Teks */}
          <div>
            <label htmlFor="content-text" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('statusContent')}
            </label>
            <textarea
              id="content-text"
              rows={4}
              value={kontenTeks}
              onChange={(e) => setKontenTeks(e.target.value)}
              placeholder={t('statusContentPlaceholder')}
              className="w-full px-3.5 py-2.5 text-base sm:text-sm text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-y bg-white dark:bg-slate-800"
            />
          </div>

          {/* Foto Kegiatan (Maks 5) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('statusPhotos')} ({photos.length}/5)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder={t('photoUrlPlaceholder')}
                disabled={photos.length >= 5}
                className="block flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20 disabled:bg-slate-100 dark:disabled:bg-slate-850"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                disabled={!photoInput.trim() || photos.length >= 5}
                className="rounded-lg bg-slate-800 dark:bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer"
              >
                {t('addPhoto')}
              </button>
            </div>

            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <span className="max-w-[200px] truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                    >
                      {t('removePhoto')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pratinjau Tampilan */}
          {(kontenTeks.trim() || photos.length > 0) && (
            <div className="rounded-xl border border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 p-4">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{t('parentPreview')}</span>
              <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 p-4 shadow-xs">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {currentClass?.nama} · Baru saja · Aktif 24 jam
                </div>
                {kontenTeks && (
                  <p className="mt-2 text-sm whitespace-pre-line text-slate-800 dark:text-slate-200">{kontenTeks}</p>
                )}
                {photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {photos.map((url, i) => (
                      <div
                        key={i}
                        className="flex h-20 items-center justify-center rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 overflow-hidden"
                      >
                        [Foto {i + 1}: {url}]
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || (!kontenTeks.trim() && photos.length === 0)}
              className="rounded-lg bg-blue-600 dark:bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? t('sharing') : t('shareNow')}
            </button>
          </div>
        </form>
      </div>

      {/* Riwayat Status */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
        <h2 className="font-display text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100">{t('pastStatuses')}</h2>
        {pastStatuses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('noStatusesYet')}</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {pastStatuses.map((item) => {
              const isExpired = item.status === 'diarsipkan';
              const isDeleted = item.status === 'dihapus_guru' || item.status === 'ditarik_admin';

              return (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {item.kelasNama}
                      </span>
                      <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(item.diterbitkanPada).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {item.penerimaCount} murid
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDeleted ? (
                        <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {item.status}
                        </span>
                      ) : isExpired ? (
                        <span className="rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          {t('statusExpired')}
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          {t('statusExpiresIn', {
                            date: new Date(item.kadaluarsaPada).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }),
                          })}
                        </span>
                      )}

                      {!isDeleted && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending}
                          className="rounded border border-red-200 dark:border-red-900/60 px-2 py-0.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          {t('deleteStatus')}
                        </button>
                      )}
                    </div>
                  </div>

                  {item.kontenTeks && (
                    <p className="mt-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line">
                      {item.kontenTeks}
                    </p>
                  )}

                  {item.mediaUrls.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.mediaUrls.map((url, i) => (
                        <div
                          key={i}
                          className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs text-slate-600 dark:text-slate-400"
                        >
                          📷 [Foto {i + 1}]
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
