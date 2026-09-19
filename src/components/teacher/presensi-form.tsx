"use client";
import { useTranslations } from "next-intl";
import { useActionState, useState, useMemo } from "react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { savePresensi, type GuruState } from "@/app/actions/teacher";

const initial: GuruState = {};
const STATUS = ["hadir", "izin", "sakit", "alpa"] as const;

export type SiswaPresensi = {
  pendaftaranId: number;
  nama: string;
  status?: string;
  catatan?: string;
  terkunci: boolean;
};

export default function PresensiForm({
  kelasId,
  jadwalItemId,
  tanggal,
  siswa,
}: {
  kelasId: number;
  jadwalItemId: number;
  tanggal: string;
  siswa: SiswaPresensi[];
}) {
  const t = useTranslations("teacher");
  const [state, formAction, pending] = useActionState(savePresensi, initial);

  // Status per siswa: awal belum diisi bila s.status undefined
  const [statuses, setStatuses] = useState<Record<number, string | undefined>>(() => {
    const map: Record<number, string | undefined> = {};
    for (const s of siswa) {
      map[s.pendaftaranId] = s.status;
    }
    return map;
  });

  const counts = useMemo(() => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;
    let belumDiisi = 0;
    for (const s of siswa) {
      const st = statuses[s.pendaftaranId];
      if (st === "hadir") hadir++;
      else if (st === "izin") izin++;
      else if (st === "sakit") sakit++;
      else if (st === "alpa") alpa++;
      else belumDiisi++;
    }
    return { hadir, izin, sakit, alpa, belumDiisi };
  }, [siswa, statuses]);

  const handleMarkAllPresent = () => {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const s of siswa) {
        if (!s.terkunci) {
          next[s.pendaftaranId] = "hadir";
        }
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const s of siswa) {
        if (!s.terkunci) {
          next[s.pendaftaranId] = undefined;
        }
      }
      return next;
    });
  };

  const handleStatusChange = (pendaftaranId: number, status: string) => {
    setStatuses((prev) => ({
      ...prev,
      [pendaftaranId]: status,
    }));
  };

  if (siswa.length === 0)
    return <p className="text-sm text-muted">{t("noSessionStudents")}</p>;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="kelas_id" value={kelasId} />
      <input type="hidden" name="jadwal_item_id" value={jadwalItemId} />
      <input type="hidden" name="tanggal" value={tanggal} />

      {/* Control Bar: Tombol Aksi Massal & Ringkasan */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllPresent}
            className="text-xs font-semibold text-blue-700 hover:bg-blue-50 border-blue-200"
          >
            {t("markAllPresent")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            {t("clearAll")}
          </Button>
        </div>

        {/* Ringkasan status */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {t("summaryPresent")}: {counts.hadir}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-amber-200">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            {t("summaryExcused")}: {counts.izin}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-blue-200">
            <span className="size-1.5 rounded-full bg-blue-500" aria-hidden="true" />
            {t("summarySick")}: {counts.sakit}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700 ring-1 ring-rose-200">
            <span className="size-1.5 rounded-full bg-rose-500" aria-hidden="true" />
            {t("summaryAbsent")}: {counts.alpa}
          </span>
          {counts.belumDiisi > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">
              {t("summaryUnfilled")}: {counts.belumDiisi}
            </span>
          ) : null}
        </div>
      </div>

      <ul className="grid gap-3">
        {siswa.map((s) => {
          const currentStatus = statuses[s.pendaftaranId];
          return (
            <li key={s.pendaftaranId}>
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{s.nama}</p>
                  {s.terkunci ? (
                    <span className="text-xs font-medium text-amber-700">
                      {t("lockedAdminRule")}
                    </span>
                  ) : null}
                </div>
                <fieldset className="mt-3" disabled={s.terkunci}>
                  <legend className="sr-only">{t("attendanceStudentLabel", { name: s.nama })}</legend>
                  <div className="flex flex-wrap gap-4">
                    {STATUS.map((st) => (
                      <label key={t(`status_${st}`)} className="inline-flex min-h-11 items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`presensi_${s.pendaftaranId}`}
                          value={st}
                          checked={currentStatus === st}
                          onChange={() => handleStatusChange(s.pendaftaranId, st)}
                        />{t(`status_${st}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Field label={t("notesOptional")}>
                  <Input name={`catatan_${s.pendaftaranId}`} defaultValue={s.catatan ?? ""} disabled={s.terkunci} />
                </Field>
              </div>
            </li>
          );
        })}
      </ul>

      {counts.belumDiisi > 0 ? (
        <p className="text-xs text-amber-700 font-medium">
          {t("unfilledWarning", { count: counts.belumDiisi })}
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}
      {state.ok && !state.error ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{t("attendanceSaved")}</p>
      ) : null}

      <div className="pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("saveAttendance")}
        </Button>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        {t("attendanceFormHelp")}
      </p>
    </form>
  );
}
