"use client";
import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveNilai, type GuruState } from "@/app/actions/teacher";

const initial: GuruState = {};

export default function NilaiForm({
  pendaftaranId,
  nilaiId,
  defaults,
}: {
  pendaftaranId: number;
  nilaiId?: number;
  defaults?: { tanggal: string; nilai: string; catatan: string };
}) {
  const [state, formAction, pending] = useActionState(saveNilai, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="pendaftaran_id" value={pendaftaranId} />
      {nilaiId ? <input type="hidden" name="nilai_id" value={nilaiId} /> : null}
      <Field label="Tanggal" required error={err("tanggal")}>
        <Input type="date" name="tanggal" required defaultValue={defaults?.tanggal ?? ""} />
      </Field>
      <Field label="Nilai kuantitatif (0-100, opsional)" error={err("nilai")}>
        <Input type="number" name="nilai" min={0} max={100} step="0.1" defaultValue={defaults?.nilai ?? ""} />
      </Field>
      <Field label="Catatan kualitatif (opsional)" error={err("catatan")}>
        <Textarea name="catatan" rows={4} defaultValue={defaults?.catatan ?? ""} placeholder="Progres belajar, kekuatan, hal yang perlu ditingkatkan…" />
      </Field>
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}
      {state.ok && !state.error ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">Nilai tersimpan.</p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan nilai"}</Button>
      <p className="text-xs text-muted">Setelah 7 hari sejak input pertama, entri terkunci — koreksi lewat admin (BR#18).</p>
    </form>
  );
}
