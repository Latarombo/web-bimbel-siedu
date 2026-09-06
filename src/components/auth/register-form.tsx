"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { registerParent, type RegisterState } from "@/app/actions/register";

const initial: RegisterState = {};

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerParent, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field label="Nama lengkap" required error={err("name")}>
        <Input name="name" placeholder="Nama sesuai KTP" required />
      </Field>
      <Field label="Email" required hint="Untuk login. Email anak beda field (email_notifikasi, BR#25)." error={err("email")}>
        <Input type="email" name="email" placeholder="nama@email.com" required />
      </Field>
      <Field label="Password" required hint="Min 8 karakter, 1 huruf besar, 1 angka (PRD F1)." error={err("password")}>
        <Input type="password" name="password" placeholder="••••••••" required />
      </Field>
      <div className="space-y-2 rounded-xl border border-border bg-slate-50 p-3">
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="privasi" required /> <span>Saya setuju <Link href="/privacy-policy" className="text-brand underline">Kebijakan Privasi</Link> *</span>
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="wali" required /> <span>Saya adalah wali sah anak yang didaftarkan *</span>
        </label>
        <p className="text-xs text-muted">Kedua consent wajib (BR#25, F1).</p>
      </div>
      {state.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Mendaftarkan…" : "Daftar — lanjut isi alamat"}</Button>
    </form>
  );
}
