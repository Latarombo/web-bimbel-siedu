"use client";
import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveAccountInfo, type AccountInfoState } from "@/app/actions/account-info";

const initial: AccountInfoState = {};

export default function AccountInfoForm() {
  const [state, formAction, pending] = useActionState(saveAccountInfo, initial);
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Alamat" hint="BR#25 — disimpan di users.alamat"><Textarea name="alamat" rows={3} placeholder="Jl. ... RT/RW, kelurahan, kota" /></Field>
      <Field label="Nomor telepon" hint="BR#25 — users.nomor_telepon"><Input name="nomor_telepon" placeholder="+62 8xx xxxx xxxx" inputMode="tel" /></Field>
      {state.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Menyimpan…" : "Simpan & lanjut profil anak"}</Button>
    </form>
  );
}
