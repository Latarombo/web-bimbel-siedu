'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { bagikanStatusPembelajaran, hapusStatusPembelajaran } from '@/app/actions/teacher';

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
      setErrorMsg('Maksimal 5 foto per unggahan.');
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
    <div className="space-y-10">
      {/* Form Buat Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('newStatusButton')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('statusSubtitle')}</p>

        {errorMsg && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Pilih Kelas */}
          <div>
            <label htmlFor="class-select" className="block text-sm font-medium text-slate-700">
              {t('classSelect')}
            </label>
            <select
              id="class-select"
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">{t('selectClassPlaceholder')}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nama} ({cls.jenjang}) · {cls.students.length} murid
                </option>
              ))}
            </select>
          </div>

          {/* Pemilih Penerima Murid */}
          {currentClass && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">{t('recipients')}</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {selectedRecipients.length === currentClass.students.length
                    ? 'Batalkan Semua'
                    : t('selectAllRecipients')}
                </button>
              </div>

              {currentClass.students.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">{t('noRecipientsAvailable')}</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {currentClass.students.map((student) => {
                    const isChecked = selectedRecipients.includes(student.pendaftaranId);
                    return (
                      <label
                        key={student.pendaftaranId}
                        className={`flex items-center justify-between rounded-md border p-2.5 text-sm transition-colors ${
                          isChecked
                            ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRecipient(student.pendaftaranId)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-medium">{student.namaAnak}</span>
                        </div>
                        {student.persetujuanFoto ? (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                            {t('consentBadge')}
                          </span>
                        ) : (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                            {t('noConsentBadge')}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {hasRecipientWithoutPhotoConsent && (
                <div className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                  {t('noConsentWarning')}
                </div>
              )}
            </div>
          )}

          {/* Konten Teks */}
          <div>
            <label htmlFor="content-text" className="block text-sm font-medium text-slate-700">
              {t('statusContent')}
            </label>
            <textarea
              id="content-text"
              rows={4}
              value={kontenTeks}
              onChange={(e) => setKontenTeks(e.target.value)}
              placeholder={t('statusContentPlaceholder')}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Foto Kegiatan (Maks 5) */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {t('statusPhotos')} ({photos.length}/5)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder={t('photoUrlPlaceholder')}
                disabled={photos.length >= 5}
                className="block flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                disabled={!photoInput.trim() || photos.length >= 5}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {t('addPhoto')}
              </button>
            </div>

            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
                  >
                    <span className="max-w-[200px] truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="text-red-500 hover:text-red-700"
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
            <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/30 p-4">
              <span className="text-xs font-medium text-indigo-700">{t('parentPreview')}</span>
              <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-xs text-slate-400">
                  {currentClass?.nama} · Baru saja · Aktif 24 jam
                </div>
                {kontenTeks && (
                  <p className="mt-2 text-sm whitespace-pre-line text-slate-800">{kontenTeks}</p>
                )}
                {photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {photos.map((url, i) => (
                      <div
                        key={i}
                        className="flex h-20 items-center justify-center rounded bg-slate-100 text-xs text-slate-500 overflow-hidden"
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
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? t('sharing') : t('shareNow')}
            </button>
          </div>
        </form>
      </div>

      {/* Riwayat Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('pastStatuses')}</h2>
        {pastStatuses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t('noStatusesYet')}</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {pastStatuses.map((item) => {
              const isExpired = item.status === 'diarsipkan';
              const isDeleted = item.status === 'dihapus_guru' || item.status === 'ditarik_admin';

              return (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-indigo-600">
                        {item.kelasNama}
                      </span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.diterbitkanPada).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="text-xs text-slate-500">
                        {item.penerimaCount} murid penerima
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDeleted ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {item.status}
                        </span>
                      ) : isExpired ? (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {t('statusExpired')}
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
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
                          className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          {t('deleteStatus')}
                        </button>
                      )}
                    </div>
                  </div>

                  {item.kontenTeks && (
                    <p className="mt-2 text-sm text-slate-800 whitespace-pre-line">
                      {item.kontenTeks}
                    </p>
                  )}

                  {item.mediaUrls.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.mediaUrls.map((url, i) => (
                        <div
                          key={i}
                          className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
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
