'use client';
import { useTranslations } from "next-intl";


import { useActionState, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Mail,
  Phone,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { kirimPesanKontak, type KontakState } from '@/app/actions/kontak';
import { SUBJEK } from '@/lib/kontak';

const initial: KontakState = {};

function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
 return <Icon className="size-5 shrink-0 text-slate-400" strokeWidth={1.8} aria-hidden="true" />;
}

const JENJANG = ['TK', 'SD', 'SMP', 'SMA'] as const;

const inputBase =
  'w-full pl-11 pr-4 py-2.5 sm:py-3 text-base sm:text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400';
const inputPlain =
  'w-full px-4 py-2.5 sm:py-3 text-base sm:text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400';

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
     <CheckCircle2 className="size-7" strokeWidth={1.8} aria-hidden="true" />
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
   <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 md:p-8 shadow-2xs">
    <div className="pb-4 border-b border-slate-100">
    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">{tr("text165")}</h3>
    <p className="mt-1 text-xs sm:text-sm text-slate-500">{tr("text166")}</p>
   </div>

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
        <FieldIcon icon={UserRound} />
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
        <FieldIcon icon={Phone} />
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
       <FieldIcon icon={Mail} />
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
        <ChevronDown className="size-4" strokeWidth={1.8} aria-hidden="true" />
       </span>
      </div>
      <FieldError error={errors.jenjang} />
     </div>

     <div>
      <Label htmlFor="sekolah">{tr("text175")}</Label>
      <div className="relative">
       <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
       <FieldIcon icon={GraduationCap} />
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
     className="w-full bg-brand hover:bg-brand-strong disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm sm:text-base font-bold py-3.5 sm:py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 active:scale-[0.99] cursor-pointer shadow-xs"
    >
     <span>{pending ? tr("sending") : tr("text181")}</span>
     {!pending && (
      <ArrowRight className="size-5" strokeWidth={1.8} aria-hidden="true" />
     )}
    </button>
   </form>
  </div>
 );
}
