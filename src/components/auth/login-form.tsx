"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { login, type LoginState } from "@/app/actions/login";

const initial: LoginState = {};

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, initial);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Email" required>
        <Input type="email" name="email" placeholder="nama@email.com" autoComplete="email" required />
      </Field>
      <Field label="Password" required>
        <Input type="password" name="password" placeholder="••••••••" autoComplete="current-password" required />
      </Field>
      {state.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Memeriksa…" : "Masuk"}</Button>
      <div className="flex justify-between text-xs">
        <Link href="/forgot-password" className="font-semibold text-brand hover:underline">Lupa password?</Link>
        <Link href="/register" className="font-semibold text-brand hover:underline">Daftar</Link>
      </div>
    </form>
  );
}
