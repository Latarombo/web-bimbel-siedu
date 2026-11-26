"use client";
import { useTranslations } from "next-intl";
import { useActionState, useRef, useState } from "react";
import { X } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveKelas, type AdminState } from "@/app/actions/admin";

const initial: AdminState = {};
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;
const MAX_JADWAL_SESI = 7;

type Jadwal = { hari: string; jamMulai: string; jamSelesai: string; tempat?: string };
type JadwalRow = {
  uid: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  tempat: string;
};

function makeInitialRows(defaultJadwal: Jadwal[]): JadwalRow[] {
  if (defaultJadwal.length === 0) {
    return [{ uid: 0, hari: "", jamMulai: "", jamSelesai: "", tempat: "" }];
  }
  return defaultJadwal.slice(0, MAX_JADWAL_SESI).map((j, idx) => ({
    uid: idx,
    hari: j.hari,
    jamMulai: j.jamMulai,
    jamSelesai: j.jamSelesai,
    tempat: j.tempat ?? "",
  }));
}

export default function KelasForm({
  kelasId,
  guruOptions,
  periodeOptions,
  defaults,
  defaultJadwal = [],
  onSuccess,
}: {
  kelasId?: number;
  guruOptions: { id: number; nama: string }[];
  periodeOptions: { id: number; nama: string; status: string }[];
  defaults?: {
    nama: string;
    mapel: string;
    guruId: number;
    periodeId: number;
    jenjang: string;
    tingkat?: string;
    ruangan?: string;
    kuotaMaksimum: number;
    kuotaMinimum: number;
    biayaPeriode: string;
    biayaDp: string;
    tenorMaksimum: string;
    status: string;
  };
  defaultJadwal?: Jadwal[];
  onSuccess?: () => void;
}) {
  const t = useTranslations("adminForms");
  const nextUid = useRef(Math.max(1, defaultJadwal.length));
  const [rows, setRows] = useState<JadwalRow[]>(() => makeInitialRows(defaultJadwal));

  const [state, formAction, pending] = useActionState(
    async (prev: AdminState, formData: FormData) => {
      const res = await saveKelas(prev, formData);
      if (res.ok && !res.error && onSuccess) onSuccess();
      return res;
    },
    initial,
  );
  const err = (k: string) => state.fieldErrors?.[k];

  function updateRow(uid: number, patch: Partial<Omit<JadwalRow, "uid">>) {
    setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => {
      if (prev.length >= MAX_JADWAL_SESI) return prev;
      const uid = nextUid.current;
      nextUid.current += 1;
      const usedDays = new Set(prev.map((r) => r.hari).filter(Boolean));
      const nextHari = HARI.find((h) => !usedDays.has(h)) ?? "";
      const template = prev[0];
      return [
        ...prev,
        {
          uid,
          hari: nextHari,
          jamMulai: template?.jamMulai ?? "",
          jamSelesai: template?.jamSelesai ?? "",
          tempat: template?.tempat ?? "",
        },
      ];
    });
  }

  function fillFullWeek() {
    setRows((prev) => {
      const byDay = new Map<string, JadwalRow>();
      for (const r of prev) {
        if (r.hari && !byDay.has(r.hari)) byDay.set(r.hari, r);
      }
      const template = prev[0];
      return HARI.map((hari) => {
        const existing = byDay.get(hari);
        if (existing) return existing;
        const uid = nextUid.current;
        nextUid.current += 1;
        return {
          uid,
          hari,
          jamMulai: template?.jamMulai ?? "",
          jamSelesai: template?.jamSelesai ?? "",
          tempat: template?.tempat ?? "",
        };
      });
    });
  }

  function removeRow(uid: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.uid !== uid) : prev));
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {kelasId ? <input type="hidden" name="kelas_id" value={kelasId} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Kelas" required error={err("nama")}>
          <Input name="nama" required maxLength={120} placeholder="cth. Matematika SD Kelas 6A" defaultValue={defaults?.nama ?? ""} />
        </Field>
        <Field label="Mata Pelajaran" required error={err("mapel")}>
          <Input name="mapel" required maxLength={100} placeholder="cth. Matematika" defaultValue={defaults?.mapel ?? ""} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("kelas.teacher")} required error={err("guru_id")}>
          <Select name="guru_id" required defaultValue={defaults?.guruId ?? ""}>
            <option value="">{t("common.choose")}</option>
            {guruOptions.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
          </Select>
        </Field>
        <Field label={t("kelas.period")} required error={err("periode_id")}>
          <Select name="periode_id" required defaultValue={defaults?.periodeId ?? ""}>
            <option value="">{t("common.choose")}</option>
            {periodeOptions.map((p) => <option key={p.id} value={p.id}>{p.nama}{p.status === "dibuka" ? "" : ` (${t.has(`periodStatus.${p.status}`) ? t(`periodStatus.${p.status}`) : p.status})`}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("kelas.level")} required error={err("jenjang")}>
          <Select name="jenjang" required defaultValue={defaults?.jenjang ?? ""}>
            {["TK", "SD", "SMP", "SMA"].map((j) => <option key={j} value={j}>{t(`levels.${j}`)}</option>)}
          </Select>
        </Field>
        <Field label={t("kelas.grade")} error={err("tingkat")}>
          <Input name="tingkat" maxLength={30} placeholder="cth. Kelas 6" defaultValue={defaults?.tingkat ?? ""} />
        </Field>
        <Field label={t("kelas.room")} error={err("ruangan")}>
          <Input name="ruangan" maxLength={50} placeholder="cth. Ruang Galileo (Lt. 2)" defaultValue={defaults?.ruangan ?? ""} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("kelas.maxQuota")} required error={err("kuota_maksimum")}>
          <Input type="number" name="kuota_maksimum" min={1} required defaultValue={defaults?.kuotaMaksimum ?? ""} />
        </Field>
        <Field label={t("kelas.minQuota")} required error={err("kuota_minimum")}>
          <Input type="number" name="kuota_minimum" min={1} required defaultValue={defaults?.kuotaMinimum ?? ""} />
        </Field>
        <Field label={t("common.status")} required error={err("status")}>
          <Select name="status" required defaultValue={defaults?.status ?? "aktif"}>
            <option value="aktif">{t("classStatus.aktif")}</option>
            <option value="dibatalkan">{t("classStatus.dibatalkan")}</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("kelas.fee")} required error={err("biaya_periode")}>
          <Input type="number" name="biaya_periode" min={1} step="1000" required defaultValue={defaults?.biayaPeriode ?? ""} />
        </Field>
        <Field label={t("kelas.deposit")} error={err("biaya_dp")}>
          <Input type="number" name="biaya_dp" min={1} step="1000" defaultValue={defaults?.biayaDp ?? ""} />
        </Field>
        <Field label={t("kelas.tenor")} error={err("tenor_maksimum")}>
          <Input type="number" name="tenor_maksimum" min={2} defaultValue={defaults?.tenorMaksimum ?? ""} />
        </Field>
      </div>
      <fieldset className="rounded-2xl border border-border p-4">
        <legend className="px-2 text-sm font-semibold">{t("kelas.schedule")}</legend>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Atur sesi per hari sesuai kebutuhan hingga 7 hari dalam seminggu.
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {rows.length < MAX_JADWAL_SESI ? (
              <>
                <button
                  type="button"
                  onClick={fillFullWeek}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Isi 7 Hari
                </button>
                <button
                  type="button"
                  onClick={addRow}
                  className="rounded-lg bg-slate-900 dark:bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  + Tambah Sesi
                </button>
              </>
            ) : null}
          </div>
        </div>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div
              key={row.uid}
              className="grid gap-3 items-end sm:grid-cols-[8.5rem_1fr_1fr_1fr_auto]"
            >
              <Field label={t("kelas.day", { number: i + 1 })}>
                <Select
                  name={`jadwal_hari_${i}`}
                  value={row.hari}
                  onChange={(e) => updateRow(row.uid, { hari: e.target.value })}
                >
                  <option value="">{t("common.empty")}</option>
                  {HARI.map((h) => <option key={h} value={h}>{t(`days.${h}`)}</option>)}
                </Select>
              </Field>
              <Field label={t("kelas.start")}>
                <Input
                  type="time"
                  name={`jadwal_mulai_${i}`}
                  value={row.jamMulai}
                  onChange={(e) => updateRow(row.uid, { jamMulai: e.target.value })}
                />
              </Field>
              <Field label={t("kelas.end")}>
                <Input
                  type="time"
                  name={`jadwal_selesai_${i}`}
                  value={row.jamSelesai}
                  onChange={(e) => updateRow(row.uid, { jamSelesai: e.target.value })}
                />
              </Field>
              <Field label="Tempat / Alamat">
                <Input
                  name={`jadwal_tempat_${i}`}
                  maxLength={150}
                  placeholder="cth. Ruang 2A"
                  value={row.tempat}
                  onChange={(e) => updateRow(row.uid, { tempat: e.target.value })}
                />
              </Field>
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(row.uid)}
                  aria-label={`Hapus sesi jadwal ${i + 1}`}
                  title={`Hapus sesi jadwal ${i + 1}`}
                  className="mb-0.5 grid size-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : (
                <span className="hidden sm:block w-9" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </fieldset>
      {state.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{state.error}</p> : null}
      {state.ok && !state.error ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{t("common.saved")}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? t("common.saving") : t("kelas.save")}</Button>
      <p className="text-xs text-muted">{t("kelas.rules")}</p>
    </form>
  );
}
