"use client";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("teacher");
  const [state, formAction, pending] = useActionState(saveNilai, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="pendaftaran_id" value={pendaftaranId} />
      {nilaiId ? <input type="hidden" name="nilai_id" value={nilaiId} /> : null}
      <Field label={t("date")} required error={err("tanggal")}>
        <Input type="date" name="tanggal" required defaultValue={defaults?.tanggal ?? ""} />
      </Field>
      <Field label={t("quantitativeOptional")} error={err("nilai")}>
        <Input type="number" name="nilai" min={0} max={100} step="0.1" defaultValue={defaults?.nilai ?? ""} />
      </Field>
      <Field label={t("qualitativeOptional")} error={err("catatan")}>
        <Textarea name="catatan" rows={4} defaultValue={defaults?.catatan ?? ""} placeholder={t("progressPlaceholder")} />
      </Field>
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}
      {state.ok && !state.error ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{t("gradeSaved")}</p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? t("saving") : t("saveGrade")}</Button>
      <p className="text-xs text-muted">{t("gradeLockHelp")}</p>
    </form>
  );
}
