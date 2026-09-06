"use client";
import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateGuruProfile, type GuruState } from "@/app/actions/teacher";

const initial: GuruState = {};

export default function GuruProfilForm({
  defaults,
}: {
  defaults: { nama: string; alamat: string; nomorTelepon: string };
}) {
  const [state, formAction, pending] = useActionState(updateGuruProfile, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field label="Nama" required error={err("nama")}>
        <Input name="nama" required defaultValue={defaults.nama} />
      </Field>
      <Field label="Alamat (opsional)" error={err("alamat")}>
        <Textarea name="alamat" rows={2} defaultValue={defaults.alamat} />
      </Field>
      <Field label="Nomor telepon (opsional)" error={err("nomor_telepon")}>
        <Input name="nomor_telepon" inputMode="tel" defaultValue={defaults.nomorTelepon} />
      </Field>
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}
      {state.ok && !state.error ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">Profil tersimpan.</p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan profil"}</Button>
    </form>
  );
}
