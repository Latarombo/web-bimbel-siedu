"use client";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
export default function ForgotForm() {
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <Field label="Email" required hint="Link reset berlaku 1 jam (PRD F1)."><Input type="email" name="email" required placeholder="nama@email.com" /></Field>
      <Button type="submit" className="w-full">Kirim link reset</Button>
    </form>
  );
}
