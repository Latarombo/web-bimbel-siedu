"use client";
import { useTranslations } from 'next-intl';
import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  saveChildInfo,
  updateChild,
  type ChildInfoState,
} from "@/app/actions/child-info";

const initial: ChildInfoState = {};

export type AnakDefaults = {
  id: number;
  nama: string;
  tanggalLahir: string;
  jenjangTerakhir: string;
  emailNotifikasi: string;
  nomorTelepon: string;
};

export default function ChildForm({ anak }: { anak?: AnakDefaults }) {
    const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(
    anak ? updateChild : saveChildInfo,
    initial,
  );
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {anak ? <input type="hidden" name="anak_id" value={anak.id} /> : null}
      <Field label={t('childName')} required error={err("nama")}>
        <Input name="nama" placeholder={t('childNamePlaceholder')} defaultValue={anak?.nama ?? ""} required />
      </Field>
      <Field label={t('birth')} required error={err("tanggal_lahir")}>
        <Input name="tanggal_lahir" type="date" defaultValue={anak?.tanggalLahir ?? ""} required />
      </Field>
      <Field label={t('level')} required error={err("jenjang_terakhir")} hint={t('levelHint')}>
        <Select name="jenjang_terakhir" required defaultValue={anak?.jenjangTerakhir ?? ""}>
          <option value="" disabled>{t('selectLevel')}</option>
          <option value="TK">{t('TK')}</option>
          <option value="SD">{t('SD')}</option>
          <option value="SMP">{t('SMP')}</option>
          <option value="SMA">{t('SMA')}</option>
        </Select>
      </Field>
      <Field label={t('notificationEmail')} error={err("email_notifikasi")} hint={t('notificationHint')}>
        <Input type="email" name="email_notifikasi" placeholder={t('optional')} defaultValue={anak?.emailNotifikasi ?? ""} />
      </Field>
      <Field label={t('childPhone')}>
        <Input name="nomor_telepon" placeholder={t('optional')} inputMode="tel" defaultValue={anak?.nomorTelepon ?? ""} />
      </Field>
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}
      <Button type="submit" className="min-h-11 w-full" disabled={pending}>
        {pending ? t('savingEllipsis') : anak ? t('saveChangesLower') : t('saveChild')}
      </Button>
    </form>
  );
}
