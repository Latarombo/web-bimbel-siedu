'use client';
import { useTranslations } from 'next-intl';

import { useActionState, useEffect } from 'react';
import { updateProfile, type ProfileState } from '@/app/actions/profile';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { useFormDraft } from '@/lib/use-form-draft';

const initial: ProfileState = {};

export default function ProfileForm({
  name,
  email,
  alamat,
  nomorTelepon,
}: {
  name: string;
  email: string;
  alamat: string;
  nomorTelepon: string;
}) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(updateProfile, initial);
  const errors = state.fieldErrors ?? {};

  const { draft, setDraftField, clearDraft } = useFormDraft('siedu_draft_profile', {
    name,
    nomor_telepon: nomorTelepon,
    alamat,
  });

  useEffect(() => {
    if (state.ok) {
      clearDraft();
    }
  }, [state.ok, clearDraft]);

  useEffect(() => {
    if (name && !draft.name) setDraftField('name', name);
  }, [name, draft.name, setDraftField]);

  useEffect(() => {
    if (nomorTelepon && !draft.nomor_telepon) setDraftField('nomor_telepon', nomorTelepon);
  }, [nomorTelepon, draft.nomor_telepon, setDraftField]);

  useEffect(() => {
    if (alamat && !draft.alamat) setDraftField('alamat', alamat);
  }, [alamat, draft.alamat, setDraftField]);

  return (
    <form action={formAction} className="space-y-5">
      {state.ok ? (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {t('profileSaved')}
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <Field label={t('email')} hint={t('emailReadOnly')}>
        <Input value={email} readOnly disabled aria-describedby="email-lock" />
      </Field>

      <Field label={t('fullName')} required error={errors.name}>
        <Input
          name="name"
          value={draft.name}
          onChange={(e) => setDraftField('name', e.target.value)}
          required
          autoComplete="name"
          placeholder={t('identityName')}
        />
      </Field>

      <Field label={t('phone')} required error={errors.nomor_telepon}>
        <Input
          name="nomor_telepon"
          type="tel"
          required
          value={draft.nomor_telepon}
          onChange={(e) => setDraftField('nomor_telepon', e.target.value)}
          autoComplete="tel"
          placeholder="08xx xxxx xxxx"
        />
      </Field>

      <Field label={t('address')} required error={errors.alamat}>
        <Textarea
          name="alamat"
          rows={3}
          required
          value={draft.alamat}
          onChange={(e) => setDraftField('alamat', e.target.value)}
          placeholder={t('residentialAddress')}
        />
      </Field>

      <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
        {pending ? t('saving') : t('saveChanges')}
      </Button>
    </form>
  );
}
