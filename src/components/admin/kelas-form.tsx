"use client";
import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveKelas, type AdminState } from "@/app/actions/admin";

const initial: AdminState = {};
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

type Jadwal = { hari: string; jamMulai: string; jamSelesai: string };

export default function KelasForm({
  kelasId,
  mapelOptions,
  guruOptions,
  periodeOptions,
  defaults,
  defaultJadwal = [],
}: {
  kelasId?: number;
  mapelOptions: { id: number; nama: string }[];
  guruOptions: { id: number; nama: string }[];
  periodeOptions: { id: number; nama: string; status: string }[];
  defaults?: {
    mataPelajaranId: number;
    guruId: number;
    periodeId: number;
    jenjang: string;
    kuotaMaksimum: number;
    kuotaMinimum: number;
    biayaPeriode: string;
    biayaDp: string;
    tenorMaksimum: string;
    status: string;
  };
  defaultJadwal?: Jadwal[];
}) {
  const [state, formAction, pending] = useActionState(saveKelas, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  const rows: (Jadwal | null)[] = [defaultJadwal[0] ?? null, defaultJadwal[1] ?? null, defaultJadwal[2] ?? null];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {kelasId ? <input type="hidden" name="kelas_id" value={kelasId} /> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Mata pelajaran" required error={err("mata_pelajaran_id")}>
          <Select name="mata_pelajaran_id" required defaultValue={defaults?.mataPelajaranId ?? ""}>
            <option value="">— pilih —</option>
            {mapelOptions.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </Select>
        </Field>
        <Field label="Guru pengampu" required error={err("guru_id")}>
          <Select name="guru_id" required defaultValue={defaults?.guruId ?? ""}>
            <option value="">— pilih —</option>
            {guruOptions.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
          </Select>
        </Field>
        <Field label="Periode" required error={err("periode_id")}>
          <Select name="periode_id" required defaultValue={defaults?.periodeId ?? ""}>
            <option value="">— pilih —</option>
            {periodeOptions.map((p) => <option key={p.id} value={p.id}>{p.nama}{p.status === "dibuka" ? "" : ` (${p.status})`}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Jenjang" required error={err("jenjang")}>
          <Select name="jenjang" required defaultValue={defaults?.jenjang ?? ""}>
            {["TK", "SD", "SMP", "SMA"].map((j) => <option key={j} value={j}>{j}</option>)}
          </Select>
        </Field>
        <Field label="Kuota maksimum" required error={err("kuota_maksimum")}>
          <Input type="number" name="kuota_maksimum" min={1} required defaultValue={defaults?.kuotaMaksimum ?? ""} />
        </Field>
        <Field label="Kuota minimum" required error={err("kuota_minimum")}>
          <Input type="number" name="kuota_minimum" min={1} required defaultValue={defaults?.kuotaMinimum ?? ""} />
        </Field>
        <Field label="Status" required error={err("status")}>
          <Select name="status" required defaultValue={defaults?.status ?? "aktif"}>
            <option value="aktif">aktif</option>
            <option value="dibatalkan">dibatalkan</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Biaya per periode (Rp)" required error={err("biaya_periode")}>
          <Input type="number" name="biaya_periode" min={1} step="1000" required defaultValue={defaults?.biayaPeriode ?? ""} />
        </Field>
        <Field label="Biaya DP (kosong = non-DP)" error={err("biaya_dp")}>
          <Input type="number" name="biaya_dp" min={1} step="1000" defaultValue={defaults?.biayaDp ?? ""} />
        </Field>
        <Field label="Tenor maksimum (kosong = non-DP)" error={err("tenor_maksimum")}>
          <Input type="number" name="tenor_maksimum" min={2} defaultValue={defaults?.tenorMaksimum ?? ""} />
        </Field>
      </div>
      <fieldset className="rounded-2xl border border-border p-4">
        <legend className="px-2 text-sm font-semibold">Jadwal sesi per minggu (1–3 baris)</legend>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[10rem_1fr_1fr]">
              <Field label={`Hari ${i + 1}`}>
                <Select name={`jadwal_hari_${i}`} defaultValue={row?.hari ?? ""}>
                  <option value="">— kosong —</option>
                  {HARI.map((h) => <option key={h} value={h}>{h}</option>)}
                </Select>
              </Field>
              <Field label="Jam mulai">
                <Input type="time" name={`jadwal_mulai_${i}`} defaultValue={row?.jamMulai ?? ""} />
              </Field>
              <Field label="Jam selesai">
                <Input type="time" name={`jadwal_selesai_${i}`} defaultValue={row?.jamSelesai ?? ""} />
              </Field>
            </div>
          ))}
        </div>
      </fieldset>
      {state.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{state.error}</p> : null}
      {state.ok && !state.error ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">Tersimpan.</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan kelas"}</Button>
      <p className="text-xs text-muted">Sistem menolak jadwal yang bentrok dengan kelas aktif lain guru yang sama (BR#6). Kelas DP wajib isi DP + tenor (BR#12).</p>
    </form>
  );
}
