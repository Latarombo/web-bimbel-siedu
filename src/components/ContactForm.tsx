'use client';
import { useTranslations } from "next-intl";


import { useActionState, useState } from 'react';
import { kirimPesanKontak, type KontakState } from '@/app/actions/kontak';
import { SUBJEK } from '@/lib/kontak';
import { SITE } from '@/lib/site';

const initial: KontakState = {};

// Ikon feather-style inline — bahasa ikon sama dengan wizard (outline, nol dependency).
function FieldIcon({ d }: { d: string }) {
 return (
  <svg
   className="w-5 h-5 text-slate-400 shrink-0"
   fill="none"
   stroke="currentColor"
   strokeWidth={2}
   strokeLinecap="round"
   strokeLinejoin="round"
   viewBox="0 0 24 24"
   aria-hidden="true"
  >
   <path d={d} />
  </svg>
 );
}

const ICON_USER = 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
const ICON_PHONE =
 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
const ICON_MAIL = 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
const ICON_SCHOOL = 'M12 3L2 8l10 5 10-5-10-5zM4 10.5V16c0 2 3.6 4 8 4s8-2 8-4v-5.5';

const JENJANG = ['TK', 'SD', 'SMP', 'SMA'] as const;

const inputBase =
 'w-full pl-11 pr-4 py-3 text-base sm:text-sm text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400';
const inputPlain =
 'w-full px-4 py-3 text-base sm:text-sm text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400';

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
 return (
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-2">
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

export default function ContactForm() {
 // "Kirim pesan lain" = remount form dengan state awal (tanpa reload halaman).
 const [kunci, setKunci] = useState(0);
 return <ContactFormInner key={kunci} onReset={() => setKunci((k) => k + 1)} />;
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
 const tr = useTranslations("public");
 const [state, formAction, pending] = useActionState(kirimPesanKontak, initial);
 const errors = state.fieldErrors ?? {};

 if (state.ok) {
  return (
   <div
    className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 text-center sm:p-12"
    role="status"
   >
    <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
     </svg>
    </span>
    <div>
     <h3 className="text-lg font-bold text-slate-900">{tr("text162")}</h3>
     <p className="mt-2 text-sm text-body leading-relaxed">
      {tr("text163")}</p>
    </div>
    <button
     type="button"
     onClick={onReset}
     className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
    >
     {tr("text164")}</button>
   </div>
  );
 }

 return (
  <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
   <h3 className="text-xl font-bold text-slate-900">{tr("text165")}</h3>
   <p className="mt-1 text-sm text-body">{tr("text166")}</p>

   {state.error ? (
    <p
     className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
     role="alert"
    >
     {state.error}
    </p>
   ) : null}

   <form action={formAction} className="mt-6 grid gap-5">
    <div className="grid gap-5 sm:grid-cols-2">
     <div>
      <Label htmlFor="nama" required>
       {tr("text167")}</Label>
      <div className="relative">
       <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
        <FieldIcon d={ICON_USER} />
       </span>
       <input
        id="nama"
        name="nama"
        type="text"
        required
        maxLength={100}
        placeholder={tr("text168")}
        autoComplete="name"
        aria-invalid={errors.nama ? true : undefined}
        defaultValue={state.nama ?? ''}
        className={inputBase}
       />
      </div>
      <FieldError error={errors.nama} />
     </div>

     <div>
      <Label htmlFor="telepon" required>
       {tr("text169")}</Label>
      <div className="relative">
       <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
        <FieldIcon d={ICON_PHONE} />
       </span>
       <input
        id="telepon"
        name="telepon"
        type="tel"
        required
        maxLength={30}
        placeholder="08XXXXXXXX"
        autoComplete="tel"
        aria-invalid={errors.telepon ? true : undefined}
        defaultValue={state.telepon ?? ''}
        className={inputBase}
       />
      </div>
      <FieldError error={errors.telepon} />
     </div>
    </div>

    <div>
     <Label htmlFor="email" required>
      {tr("text171")}</Label>
     <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
       <FieldIcon d={ICON_MAIL} />
      </span>
      <input
       id="email"
       name="email"
       type="email"
       required
       maxLength={255}
       placeholder="contact@gmail.com"
       autoComplete="email"
       aria-invalid={errors.email ? true : undefined}
       defaultValue={state.email ?? ''}
       className={inputBase}
      />
     </div>
     <FieldError error={errors.email} />
    </div>

    <div className="grid gap-5 sm:grid-cols-2">
     <div>
      <Label htmlFor="jenjang">{tr("text173")}</Label>
      <div className="relative">
       <select
        id="jenjang"
        name="jenjang"
        defaultValue={state.jenjang ?? ''}
        aria-invalid={errors.jenjang ? true : undefined}
        className={`${inputPlain} appearance-none pr-10 bg-white`}
       >
        <option value="">{tr("text174")}</option>
        {JENJANG.map((j) => (
         <option key={j} value={j}>
          {j}
         </option>
        ))}
       </select>
       <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
         <path d="M6 9l6 6 6-6" />
        </svg>
       </span>
      </div>
      <FieldError error={errors.jenjang} />
     </div>

     <div>
      <Label htmlFor="sekolah">{tr("text175")}</Label>
      <div className="relative">
       <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
        <FieldIcon d={ICON_SCHOOL} />
       </span>
       <input
        id="sekolah"
        name="sekolah"
        type="text"
        maxLength={150}
        placeholder="SMAN 1 Jakarta"
        aria-invalid={errors.sekolah ? true : undefined}
        defaultValue={state.sekolah ?? ''}
        className={inputBase}
       />
      </div>
      <FieldError error={errors.sekolah} />
     </div>
    </div>

    <div>
     <Label htmlFor="subjek" required>
      {tr("text177")}</Label>
     <select
      id="subjek"
      name="subjek"
      required
      defaultValue={state.subjek ?? ''}
      aria-invalid={errors.subjek ? true : undefined}
      className={`${inputPlain} appearance-none pr-10 bg-white`}
     >
      <option value="">{tr("text178")}</option>
      {SUBJEK.map((s) => (
       <option key={s} value={s}>
        {tr(`contactSubject${SUBJEK.indexOf(s)}`)}
       </option>
      ))}
     </select>
     <FieldError error={errors.subjek} />
    </div>

    <div>
     <Label htmlFor="pesan" required>
      {tr("text179")}</Label>
     <textarea
      id="pesan"
      name="pesan"
      required
      rows={5}
      maxLength={2000}
      placeholder={tr("text180")}
      aria-invalid={errors.pesan ? true : undefined}
      defaultValue={state.pesan ?? ''}
      className={`${inputPlain} resize-y`}
     />
     <FieldError error={errors.pesan} />
    </div>

    <button
     type="submit"
     disabled={pending}
     className="w-full bg-brand hover:bg-brand-strong disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
    >
     <span>{pending ? tr("sending") : tr("text181")}</span>
     {!pending && (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M5 12h14" />
      </svg>
     )}
    </button>
   </form>
  </div>
 );
}
