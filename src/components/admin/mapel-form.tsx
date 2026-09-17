"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveMapel, type AdminState } from "@/app/actions/admin";

const initial: AdminState = {};

export default function MapelForm({ mapelId, defaults }: { mapelId?: number; defaults?: { nama: string; deskripsi: string } }) {
  const t = useTranslations("adminForms");
  const [state, formAction, pending] = useActionState(saveMapel, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {mapelId ? <input type="hidden" name="mapel_id" value={mapelId} /> : null}
      <Field label={t("mapel.name")} required error={err("nama")}>
        <Input name="nama" required defaultValue={defaults?.nama ?? ""} placeholder={t("mapel.example")} />
      </Field>
      <Field label={t("mapel.description")} error={err("deskripsi")}>
        <Textarea name="deskripsi" rows={3} defaultValue={defaults?.deskripsi ?? ""} />
      </Field>
      {state.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{state.error}</p> : null}
      {state.ok && !state.error ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{t("common.saved")}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? t("common.saving") : t("common.save")}</Button>
    </form>
  );
}
