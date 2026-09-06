"use client";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
export default function ResetForm({ token }: { token: string }) {
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <p className="text-xs text-muted">Token: <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-border">{token}</code></p>
      <Field label="Password baru" required hint="Min 8 char, 1 uppercase, 1 angka"><Input type="password" name="password" required /></Field>
      <Field label="Konfirmasi password" required><Input type="password" name="password_confirm" required /></Field>
      <Button type="submit" className="w-full">Reset password</Button>
    </form>
  );
}
