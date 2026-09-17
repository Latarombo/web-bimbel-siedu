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
        <p
          className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
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
