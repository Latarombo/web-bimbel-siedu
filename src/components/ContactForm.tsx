'use client';
import { useTranslations } from "next-intl";


import { useActionState, useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { kirimPesanKontak, type KontakState } from '@/app/actions/kontak';
import { SUBJEK } from '@/lib/kontak';
import { Select } from '@/components/ui/field';

const initial: KontakState = {};

const JENJANG = ['TK', 'SD', 'SMP', 'SMA'] as const;

const fieldBase =
  'h-11 w-full px-3.5 text-base sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400';

const textareaBase =
  'w-full px-3.5 py-2.5 text-base sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400 resize-y';

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
 return (
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1.5">
   {children} {required ? <span className="text-danger">*</span> : null}
  </label>
 );
}

function FieldError({ error }: { error?: string }) {
 if (!error) return null;
 return (
  <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
   {error}
  </p>
 );
}

import { useFormDraft } from "@/lib/use-form-draft";

interface ContactDraft {
  nama: string;
  telepon: string;
  email: string;
  jenjang: string;
  sekolah: string;
  subjek: string;
  pesan: string;
}

export default function ContactForm() {
 // "Kirim pesan lain" = remount form dengan state awal (tanpa reload halaman).
 const [kunci, setKunci] = useState(0);
 return <ContactFormInner key={kunci} onReset={() => setKunci((k) => k + 1)} />;
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
 const tr = useTranslations("public");
 const [state, formAction, pending] = useActionState(kirimPesanKontak, initial);
 const errors = state.fieldErrors ?? {};

 const [draft, setDraftField, , clearDraft] = useFormDraft<ContactDraft>(
   "siedu_draft_contact",
   {
     nama: state.nama ?? "",
     telepon: state.telepon ?? "",
     email: state.email ?? "",
     jenjang: state.jenjang ?? "",
     sekolah: state.sekolah ?? "",
     subjek: state.subjek ?? "",
     pesan: state.pesan ?? "",
   }
 );

 useEffect(() => {
   if (state.ok) {
     clearDraft();
   }
 }, [state.ok, clearDraft]);

 if (state.ok) {
  return (
   <div
    className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 text-center sm:p-12"
    role="status"
   >
    <CheckCircle2 className="size-12 text-emerald-600" strokeWidth={1.8} aria-hidden="true" />
    <div>
     <h3 className="text-lg font-bold text-slate-900">{tr("text162")}</h3>
     <p className="mt-2 text-sm text-slate-600 leading-relaxed">
      {tr("text163")}</p>
    </div>
    <button
     type="button"
     onClick={() => {
      clearDraft();
      onReset();
     }}
     className="h-11 inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
    >
     {tr("text164")}</button>
   </div>
  );
 }

  return (
   <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 md:p-7 shadow-2xs">
    <div className="pb-3.5 border-b border-slate-100">
    <h3 className="text-lg font-bold text-slate-900">{tr("text165")}</h3>
    <p className="mt-1 text-sm text-slate-500">{tr("text166")}</p>
   </div>

   {state.error ? (
    <p
     className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
     role="alert"
    >
     {state.error}
    </p>
   ) : null}

   <form action={formAction} className="mt-5 grid gap-4.5 sm:gap-5">
    <div className="grid gap-4.5 sm:grid-cols-2">
     <div>
      <Label htmlFor="nama" required>
       {tr("text167")}</Label>
      <input
       id="nama"
       name="nama"
       type="text"
       required
       maxLength={100}
       placeholder={tr("text168")}
       autoComplete="name"
       aria-invalid={errors.nama ? true : undefined}
       value={draft.nama}
       onChange={(e) => setDraftField("nama", e.target.value)}
       className={fieldBase}
      />
      <FieldError error={errors.nama} />
     </div>

     <div>
      <Label htmlFor="telepon" required>
       {tr("text169")}</Label>
      <input
       id="telepon"
       name="telepon"
       type="tel"
       required
       maxLength={30}
       placeholder="08XXXXXXXX"
       autoComplete="tel"
       aria-invalid={errors.telepon ? true : undefined}
       value={draft.telepon}
       onChange={(e) => setDraftField("telepon", e.target.value)}
       className={fieldBase}
      />
      <FieldError error={errors.telepon} />
     </div>
    </div>

    <div>
     <Label htmlFor="email" required>
      {tr("text171")}</Label>
     <input
      id="email"
      name="email"
      type="email"
      required
      maxLength={255}
      placeholder="contact@gmail.com"
      autoComplete="email"
      aria-invalid={errors.email ? true : undefined}
      value={draft.email}
      onChange={(e) => setDraftField("email", e.target.value)}
      className={fieldBase}
     />
     <FieldError error={errors.email} />
    </div>

     <div className="grid gap-4.5 sm:grid-cols-2">
      <div>
       <Label htmlFor="jenjang">{tr("text173")}</Label>
       <Select
        id="jenjang"
        name="jenjang"
        value={draft.jenjang}
        onChange={(e) => setDraftField("jenjang", e.target.value)}
        aria-invalid={errors.jenjang ? true : undefined}
        className={`h-11 rounded-xl text-sm ${!draft.jenjang ? "text-slate-400" : "text-slate-800"}`}
       >
        <option value="" className="text-slate-400">
         {tr("text174")}
        </option>
        {JENJANG.map((j) => (
         <option key={j} value={j} className="text-slate-800">
          {tr(`level${j}`)}
         </option>
        ))}
       </Select>
       <FieldError error={errors.jenjang} />
      </div>

      <div>
       <Label htmlFor="sekolah">{tr("text175")}</Label>
       <input
        id="sekolah"
        name="sekolah"
        type="text"
        maxLength={150}
        placeholder={tr("contactSchoolPlaceholder")}
        aria-invalid={errors.sekolah ? true : undefined}
        value={draft.sekolah}
        onChange={(e) => setDraftField("sekolah", e.target.value)}
        className={fieldBase}
       />
       <FieldError error={errors.sekolah} />
      </div>
     </div>

     <div>
      <Label htmlFor="subjek" required>
       {tr("text177")}</Label>
      <Select
       id="subjek"
       name="subjek"
       required
       value={draft.subjek}
       onChange={(e) => setDraftField("subjek", e.target.value)}
       aria-invalid={errors.subjek ? true : undefined}
       className={`h-11 rounded-xl text-sm ${!draft.subjek ? "text-slate-400" : "text-slate-800"}`}
      >
       <option value="" className="text-slate-400">
        {tr("text178")}
       </option>
       {SUBJEK.map((s, idx) => (
        <option key={s} value={s} className="text-slate-800">
         {tr(`contactSubject${idx}`)}
        </option>
       ))}
      </Select>
      <FieldError error={errors.subjek} />
     </div>

    <div>
     <Label htmlFor="pesan" required>
      {tr("text179")}</Label>
     <textarea
      id="pesan"
      name="pesan"
      required
      rows={4}
      maxLength={2000}
      placeholder={tr("text180")}
      aria-invalid={errors.pesan ? true : undefined}
      value={draft.pesan}
      onChange={(e) => setDraftField("pesan", e.target.value)}
      className={textareaBase}
     />
     <FieldError error={errors.pesan} />
    </div>

    <button
     type="submit"
     disabled={pending}
     className="h-11 w-full bg-brand hover:bg-brand-strong disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer shadow-xs active:scale-[0.99]"
    >
     <span>{pending ? tr("sending") : tr("text181")}</span>
    </button>
   </form>
  </div>
 );
}
