"use client";

import { useEffect, useRef, useActionState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ajukanPembatalan, type BatalState } from "@/app/actions/pembayaran";

const initial: BatalState = {};

export default function CancelForm({
  pendaftaranId,
}: {
  pendaftaranId: number;
}) {
  const tr = useTranslations("parent");
  // Kategori enum KategoriRefund — 'lainnya' = pembatalan biasa, DP hangus (BR#19).
  const KATEGORI: [string, string][] = [
    ["salah_pilih_kelas", tr("text178")],
    ["kesalahan_sistem", tr("text179")],
    ["salah_nominal_transfer", tr("text180")],
    ["salah_rekening", tr("text181")],
    ["lainnya", tr("text182")],
  ];

  const [state, formAction, pending] = useActionState(
    ajukanPembatalan,
    initial,
  );
  const router = useRouter();
  const disegarkan = useRef(false);

  // Submit sukses → refresh server component; halaman detail menampilkan
  // banner "pengajuan menunggu" dari data baru (pola sama daftar-form).
  useEffect(() => {
    if (state.ok && !disegarkan.current) {
      disegarkan.current = true;
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="pendaftaran_id" value={pendaftaranId} />

      <Field label={tr("text183")} required>
        <Select name="kategori" required defaultValue="lainnya">
          {KATEGORI.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={tr("text184")}
        required
        hint={tr("text185")}
      >
        <Textarea
          name="alasan"
          rows={4}
          required
          minLength={10}
          maxLength={1000}
          placeholder={tr("text186")}
        />
      </Field>

      {state.error ? (
        <div
          className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          <svg
            className="h-5 w-5 shrink-0 text-rose-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.75} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4m0 4h.01" />
          </svg>
          <div className="flex-1 leading-relaxed">{state.error}</div>
        </div>
      ) : null}

      <Button
        type="submit"
        variant="destructive"
        className="w-full"
        disabled={pending}
      >
        {pending ? tr("text187") : tr("text188")}
      </Button>
      <p className="text-xs text-muted">
         {tr("text189")} </p>
    </form>
  );
}
