"use client";
/* Aksi destruktif dua langkah inline (Hapus -> "Yakin?" -> Ya/Batal).
   Tanpa window.confirm; form server action yang sama, submit di gate manual. */
import { useTranslations } from "next-intl";
import * as React from "react";

export function ConfirmAction({
  action,
  label,
  confirmLabel,
  children,
}: {
  action: (formData: FormData) => Promise<void> | void;
  label?: string;
  confirmLabel?: string;
  /** input hidden payloads (id dsb.) */
  children: React.ReactNode;
}) {
  const t = useTranslations("adminForms");
  const buttonLabel = label ?? t("common.delete");
  const confirmation = confirmLabel ?? t("common.confirmDelete");
  const [armed, setArmed] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, setPending] = React.useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 px-2.5 text-[0.8rem] font-semibold text-rose-700 dark:text-rose-300 transition-colors hover:bg-rose-100 dark:hover:bg-rose-950/60"
      >
        {buttonLabel}
      </button>
    );
  }
  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setPending(true);
        try {
          await action(fd);
        } finally {
          setPending(false);
        }
      }}
      className="flex items-center gap-1.5"
    >
      {children}
      <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">{confirmation}</span>
      <button
        type="submit"
        disabled={pending}
        className="h-7 rounded-lg bg-rose-600 px-2.5 text-[0.8rem] font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
      >
        {pending ? "…" : buttonLabel}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="h-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-[0.8rem] font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        {t("common.cancel")}
      </button>
    </form>
  );
}
