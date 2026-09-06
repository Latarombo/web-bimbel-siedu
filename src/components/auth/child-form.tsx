"use client";
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
  const [state, formAction, pending] = useActionState(
    anak ? updateChild : saveChildInfo,
    initial,
  );
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {anak ? <input type="hidden" name="anak_id" value={anak.id} /> : null}
      <Field label="Nama anak" required error={err("nama")}>
        <Input name="nama" placeholder="Nama lengkap anak" defaultValue={anak?.nama ?? ""} required />
      </Field>
      <Field label="Tanggal lahir" required error={err("tanggal_lahir")}>
        <Input name="tanggal_lahir" type="date" defaultValue={anak?.tanggalLahir ?? ""} required />
      </Field>
      <Field label="Jenjang terakhir" required error={err("jenjang_terakhir")} hint="Dipakai filter kelas (BR#13).">
        <Select name="jenjang_terakhir" required defaultValue={anak?.jenjangTerakhir ?? ""}>
          <option value="" disabled>Pilih jenjang</option>
          <option value="TK">TK</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </Select>
      </Field>
      <Field label="Email notifikasi (opsional)" error={err("email_notifikasi")} hint="Hanya untuk notifikasi anak, tidak untuk login (BR#25).">
        <Input type="email" name="email_notifikasi" placeholder="opsional" defaultValue={anak?.emailNotifikasi ?? ""} />
      </Field>
      <Field label="Nomor telepon anak (opsional)">
        <Input name="nomor_telepon" placeholder="opsional" inputMode="tel" defaultValue={anak?.nomorTelepon ?? ""} />
      </Field>
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyimpan…" : anak ? "Simpan perubahan" : "Simpan profil anak"}
      </Button>
    </form>
  );
}
