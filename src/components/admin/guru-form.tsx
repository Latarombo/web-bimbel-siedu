"use client";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("adminForms");
  const [state, formAction, pending] = useActionState(saveGuru, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {guruId ? <input type="hidden" name="guru_id" value={guruId} /> : null}
      <Field label={t("guru.name")} required error={err("nama")}>
        <Input name="nama" required defaultValue={defaults?.nama ?? ""} />
      </Field>
      <Field label={t("guru.email")} required error={err("email")}>
        <Input type="email" name="email" required defaultValue={defaults?.email ?? ""} />
      </Field>
      <Field label={guruId ? t("guru.passwordNew") : t("guru.password")} required={!guruId} error={err("password")}>
        <Input type="password" name="password" minLength={8} required={!guruId} placeholder={t("guru.passwordHint")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("guru.address")} error={err("alamat")}>
          <Input name="alamat" defaultValue={defaults?.alamat ?? ""} />
        </Field>
        <Field label={t("guru.phone")} required error={err("nomor_telepon")}>
          <Input name="nomor_telepon" required defaultValue={defaults?.nomorTelepon ?? ""} />
        </Field>
      </div>
      {state.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{state.error}</p> : null}
      {state.ok && !state.error ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{t("common.saved")}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? t("common.saving") : t("common.save")}</Button>
    </form>
  );
}
