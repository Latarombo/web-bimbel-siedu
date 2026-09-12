"use client";
import { useActionState } from "react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveGuru, type AdminState } from "@/app/actions/admin";

const initial: AdminState = {};

export default function GuruForm({
  guruId,
  defaults,
}: {
  guruId?: number;
  defaults?: { nama: string; email: string; alamat: string; nomorTelepon: string };
}) {
  const [state, formAction, pending] = useActionState(saveGuru, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {guruId ? <input type="hidden" name="guru_id" value={guruId} /> : null}
      <Field label="Nama" required error={err("nama")}>
        <Input name="nama" required defaultValue={defaults?.nama ?? ""} />
      </Field>
      <Field label="Email" required error={err("email")}>
        <Input type="email" name="email" required defaultValue={defaults?.email ?? ""} />
      </Field>
      <Field label={guruId ? "Password baru (kosongkan bila tidak ganti)" : "Password"} required={!guruId} error={err("password")}>
        <Input type="password" name="password" minLength={8} required={!guruId} placeholder="Minimal 8 karakter" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Alamat (opsional)" error={err("alamat")}>
          <Input name="alamat" defaultValue={defaults?.alamat ?? ""} />
        </Field>
        <Field label="Nomor telepon (opsional)" error={err("nomor_telepon")}>
          <Input name="nomor_telepon" defaultValue={defaults?.nomorTelepon ?? ""} />
        </Field>
      </div>
      {state.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{state.error}</p> : null}
      {state.ok && !state.error ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">Tersimpan.</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
    </form>
  );
}
