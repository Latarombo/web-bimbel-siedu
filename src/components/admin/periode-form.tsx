"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { savePeriode, type AdminState } from "@/app/actions/admin";

const initial: AdminState = {};

export default function PeriodeForm({
  periodeId,
  defaults,
}: {
  periodeId?: number;
  defaults?: { nama: string; tanggalMulai: string; tanggalSelesai: string; tanggalTutupPendaftaran: string; status: string };
}) {
  const t = useTranslations("adminForms");
  const [state, formAction, pending] = useActionState(savePeriode, initial);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {periodeId ? <input type="hidden" name="periode_id" value={periodeId} /> : null}
      <Field label={t("periode.name")} required error={err("nama")}>
        <Input name="nama" required defaultValue={defaults?.nama ?? ""} placeholder={t("periode.example")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("periode.start")} required error={err("tanggal_mulai")}>
          <Input type="date" name="tanggal_mulai" required defaultValue={defaults?.tanggalMulai ?? ""} />
        </Field>
        <Field label={t("periode.end")} required error={err("tanggal_selesai")}>
          <Input type="date" name="tanggal_selesai" required defaultValue={defaults?.tanggalSelesai ?? ""} />
        </Field>
        <Field label={t("periode.close")} required error={err("tanggal_tutup_pendaftaran")}>
          <Input type="date" name="tanggal_tutup_pendaftaran" required defaultValue={defaults?.tanggalTutupPendaftaran ?? ""} />
        </Field>
  </div>
      <Field label={t("common.status")} required error={err("status")}>
        <Select name="status" defaultValue={defaults?.status ?? "dibuka"}>
          <option value="dibuka">{t("periodStatus.dibuka")}</option>
          <option value="ditutup">{t("periodStatus.ditutup")}</option>
          <option value="selesai">{t("periodStatus.selesai")}</option>
        </Select>
      </Field>
      {state.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{state.error}</p> : null}
      {state.ok && !state.error ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{t("common.saved")}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? t("common.saving") : t("common.save")}</Button>
    </form>
  );
}
