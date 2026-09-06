"use client";
import { useActionState } from "react";
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
  const [state, formAction, pending] = useActionState(savePresensi, initial);

  if (siswa.length === 0)
    return <p className="text-sm text-muted">Belum ada siswa terdaftar di sesi ini.</p>;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="kelas_id" value={kelasId} />
      <input type="hidden" name="jadwal_item_id" value={jadwalItemId} />
      <input type="hidden" name="tanggal" value={tanggal} />

      <ul className="grid gap-3">
        {siswa.map((s) => (
          <li key={s.pendaftaranId}>
            <div className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{s.nama}</p>
                {s.terkunci ? (
                  <span className="text-xs font-medium text-amber-700">
                    Terkunci — koreksi via admin (BR#18)
                  </span>
                ) : null}
              </div>
              <fieldset className="mt-3" disabled={s.terkunci}>
                <legend className="sr-only">Status presensi {s.nama}</legend>
                <div className="flex flex-wrap gap-4">
                  {STATUS.map((st) => (
                    <label key={st} className="inline-flex items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        name={`presensi_${s.pendaftaranId}`}
                        value={st}
                        defaultChecked={(s.status ?? "hadir") === st}
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Catatan (opsional)">
                <Input name={`catatan_${s.pendaftaranId}`} defaultValue={s.catatan ?? ""} disabled={s.terkunci} />
              </Field>
            </div>
          </li>
        ))}
      </ul>

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}
      {state.ok && !state.error ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">Presensi tersimpan.</p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan presensi"}</Button>
      <p className="text-xs text-muted">
        Catatan panjang siswa diinput lewat halaman nilai. Entri &gt;7 hari tidak bisa diedit di sini (BR#18).
      </p>
    </form>
  );
}
