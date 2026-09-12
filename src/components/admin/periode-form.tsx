"use client";
import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { savePeriode, type AdminState } from "@/app/actions/admin";

const initial: AdminState = {};

export default function PeriodeForm({
  periodeId,
  defaults,
}: {
  periodeId?: number;
  defaults?: { nama: string; tanggalMulai: string; tanggalSelesai: string; tanggalTutupPendaftaran: string; status: string };
}) {
  const [state, formAction, pending] = useActionState(savePeriode, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {periodeId ? <input type="hidden" name="periode_id" value={periodeId} /> : null}
      <Field label="Nama periode" required error={err("nama")}>
        <Input name="nama" required defaultValue={defaults?.nama ?? ""} placeholder="cth. Periode Ganjil 2026/2027" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tanggal mulai" required error={err("tanggal_mulai")}>
          <Input type="date" name="tanggal_mulai" required defaultValue={defaults?.tanggalMulai ?? ""} />
        </Field>
        <Field label="Tanggal selesai" required error={err("tanggal_selesai")}>
          <Input type="date" name="tanggal_selesai" required defaultValue={defaults?.tanggalSelesai ?? ""} />
        </Field>
        <Field label="Tutup pendaftaran" required error={err("tanggal_tutup_pendaftaran")}>
          <Input type="date" name="tanggal_tutup_pendaftaran" required defaultValue={defaults?.tanggalTutupPendaftaran ?? ""} />
        </Field>
  </div>
      <Field label="Status" required error={err("status")}>
        <Select name="status" defaultValue={defaults?.status ?? "dibuka"}>
          <option value="dibuka">dibuka</option>
          <option value="ditutup">ditutup</option>
          <option value="selesai">selesai</option>
        </Select>
      </Field>
      {state.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{state.error}</p> : null}
      {state.ok && !state.error ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">Tersimpan.</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
    </form>
  );
}
