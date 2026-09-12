'use client';

import { useActionState } from 'react';
import { updateProfile, type ProfileState } from '@/app/actions/profile';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

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
  const [state, formAction, pending] = useActionState(updateProfile, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.ok ? (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          Profil tersimpan.
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <Field label="Email" hint="Email tidak bisa diubah untuk saat ini.">
        <Input value={email} readOnly disabled aria-describedby="email-lock" />
      </Field>

      <Field label="Nama Lengkap" required error={errors.name}>
        <Input
          name="name"
          defaultValue={state.name ?? name}
          required
          autoComplete="name"
          placeholder="Nama sesuai identitas"
        />
      </Field>

      <Field label="Nomor HP" error={errors.nomor_telepon}>
        <Input
          name="nomor_telepon"
          type="tel"
          defaultValue={state.nomor_telepon ?? nomorTelepon}
          autoComplete="tel"
          placeholder="08xx xxxx xxxx"
        />
      </Field>

      <Field label="Alamat" error={errors.alamat}>
        <Textarea
          name="alamat"
          rows={3}
          defaultValue={state.alamat ?? alamat}
          placeholder="Alamat domisili"
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
      </Button>
    </form>
  );
}
