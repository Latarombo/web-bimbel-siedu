"use client";

import { useTranslations, useLocale } from 'next-intl';
import { useActionState, useState, useEffect } from "react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  saveChildInfo,
  updateChild,
  type ChildInfoState,
} from "@/app/actions/child-info";
import {
  inferJenjangDanKelasFromBirthDate,
  KELAS_OPTIONS,
} from "@/components/ChildInfoForm";
import { useFormDraft } from "@/lib/use-form-draft";

const initial: ChildInfoState = {};

export type AnakDefaults = {
  id: number;
  nama: string;
  tanggalLahir: string;
  jenjangTerakhir: string;
  tingkat?: string;
  emailNotifikasi: string;
  nomorTelepon: string;
};

// Tanggal hari ini di zona WIB
function hariIniWIB(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${g('year')}-${g('month')}-${g('day')}`;
}

const JENJANG_LIST = [
  { value: 'TK', label: 'TK' },
  { value: 'SD', label: 'SD' },
  { value: 'SMP', label: 'SMP' },
  { value: 'SMA', label: 'SMA' },
] as const;

export default function ChildForm({
  anak,
  parentPhone = "",
}: {
  anak?: AnakDefaults;
  parentPhone?: string;
}) {
  const t = useTranslations('auth');
  const locale = useLocale();

  const [state, formAction, pending] = useActionState(
    anak ? updateChild : saveChildInfo,
    initial,
  );

  const ortuPunyaHp = parentPhone.trim() !== '';
  const hpSamaDefault = anak ? (ortuPunyaHp && anak.nomorTelepon === parentPhone) : ortuPunyaHp;

  const { draft, setDraftField } = useFormDraft(`siedu_draft_child_edit_${anak?.id ?? 'new'}`, {
    nama: anak?.nama ?? '',
    tanggal_lahir: anak?.tanggalLahir ?? '',
    jenjang_terakhir: ((anak?.jenjangTerakhir) as 'TK' | 'SD' | 'SMP' | 'SMA' | '') ?? '',
    tingkat: anak?.tingkat ?? '',
    nomor_telepon: anak?.nomorTelepon ?? '',
    hpSama: hpSamaDefault,
    email_notifikasi: anak?.emailNotifikasi ?? '',
  });

  const hpTerkunci = draft.hpSama && ortuPunyaHp;

  useEffect(() => {
    if (state.nama && !draft.nama) setDraftField('nama', state.nama);
    if (state.tanggal_lahir && !draft.tanggal_lahir) setDraftField('tanggal_lahir', state.tanggal_lahir);
    if (state.jenjang_terakhir && !draft.jenjang_terakhir) setDraftField('jenjang_terakhir', state.jenjang_terakhir);
    if (state.tingkat && !draft.tingkat) setDraftField('tingkat', state.tingkat);
    if (state.nomor_telepon && !draft.nomor_telepon) setDraftField('nomor_telepon', state.nomor_telepon);
    if (state.email_notifikasi && !draft.email_notifikasi) setDraftField('email_notifikasi', state.email_notifikasi);
  }, [state, draft, setDraftField]);

  const handleDateChange = (date: string) => {
    setDraftField('tanggal_lahir', date);
    const suggested = inferJenjangDanKelasFromBirthDate(date);
    if (suggested) {
      setDraftField('jenjang_terakhir', suggested.jenjang);
      setDraftField('tingkat', suggested.tingkat);
    }
  };

  const handleJenjangChange = (newJenjang: 'TK' | 'SD' | 'SMP' | 'SMA') => {
    setDraftField('jenjang_terakhir', newJenjang);
    const opts = KELAS_OPTIONS[newJenjang];
    if (opts && opts.length > 0) {
      setDraftField('tingkat', opts[0].value);
    } else {
      setDraftField('tingkat', '');
    }
  };

  const err = (k: string) => state.fieldErrors?.[k];
  const currentKelasOptions = draft.jenjang_terakhir ? KELAS_OPTIONS[draft.jenjang_terakhir as 'TK' | 'SD' | 'SMP' | 'SMA'] ?? [] : [];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {anak ? <input type="hidden" name="anak_id" value={anak.id} /> : null}

      <Field label={t('childName')} required error={err("nama")}>
        <Input
          name="nama"
          placeholder={t('childNamePlaceholder')}
          value={draft.nama}
          onChange={(e) => setDraftField('nama', e.target.value)}
          required
        />
      </Field>

      <Field label={t('birth')} required error={err("tanggal_lahir")}>
        <DatePicker
          id="tanggal_lahir"
          name="tanggal_lahir"
          value={draft.tanggal_lahir}
          onChange={handleDateChange}
          max={hariIniWIB()}
          placeholder={t('pickBirthDate')}
          locale={locale}
          required
          ariaInvalid={!!err("tanggal_lahir")}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('educationLevel')} required error={err("jenjang_terakhir")}>
          <Select
            name="jenjang_terakhir"
            required
            value={draft.jenjang_terakhir}
            onChange={(e) => handleJenjangChange(e.target.value as 'TK' | 'SD' | 'SMP' | 'SMA')}
          >
            <option value="" disabled>{t('selectEducationLevel')}</option>
            {JENJANG_LIST.map((j) => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </Select>
        </Field>

        <Field label={t('classLevel')} required error={err("tingkat")}>
          <Select
            name="tingkat"
            required
            value={draft.tingkat}
            onChange={(e) => setDraftField('tingkat', e.target.value)}
            disabled={!draft.jenjang_terakhir}
          >
            <option value="" disabled>{t('selectClassPrompt')}</option>
            {currentKelasOptions.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <Field label={t('childPhoneLabel')} required error={err("nomor_telepon")}>
          <Input
            name="nomor_telepon"
            placeholder={t('childPhonePlaceholder')}
            inputMode="tel"
            type="tel"
            required
            value={hpTerkunci ? parentPhone : draft.nomor_telepon}
            onChange={(e) => setDraftField('nomor_telepon', e.target.value)}
            readOnly={hpTerkunci}
            className={hpTerkunci ? "bg-muted text-muted-foreground" : ""}
          />
        </Field>
        {ortuPunyaHp && (
          <div className="mt-2 flex justify-end">
            <label
              htmlFor="hp_sama_edit"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer select-none text-xs font-medium text-slate-600"
            >
              <span>{t('samePhone')}</span>
              <input
                id="hp_sama_edit"
                type="checkbox"
                role="switch"
                checked={draft.hpSama}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDraftField('hpSama', checked);
                  if (!checked) setDraftField('nomor_telepon', '');
                  else if (ortuPunyaHp) setDraftField('nomor_telepon', parentPhone);
                }}
                className="sr-only peer"
              />
              <span
                aria-hidden="true"
                className="w-7 h-4 rounded-full bg-slate-200 peer-checked:bg-brand relative transition-colors cursor-pointer shrink-0 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-3"
              />
            </label>
          </div>
        )}
      </div>

      <Field label={t('notificationEmail')} error={err("email_notifikasi")} hint={t('notificationHint')}>
        <Input
          type="email"
          name="email_notifikasi"
          placeholder={t('optional')}
          value={draft.email_notifikasi}
          onChange={(e) => setDraftField('email_notifikasi', e.target.value)}
        />
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
