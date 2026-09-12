"use client";

import { useEffect, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ajukanPembatalan, type BatalState } from "@/app/actions/pembayaran";

const initial: BatalState = {};

// Kategori enum KategoriRefund — 'lainnya' = pembatalan biasa, DP hangus (BR#19).
const KATEGORI: [string, string][] = [
  ["salah_pilih_kelas", "Salah pilih kelas (bukti bisa diminta admin)"],
  ["kesalahan_sistem", "Kesalahan sistem (double-charge dsb.)"],
  ["salah_nominal_transfer", "Salah nominal transfer"],
  ["salah_rekening", "Salah rekening tujuan"],
  ["lainnya", "Lainnya — DP hangus, tanpa refund (BR#19)"],
];

export default function CancelForm({
  pendaftaranId,
}: {
  pendaftaranId: number;
}) {
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

      <Field label="Alasan pembatalan" required>
        <Select name="kategori" required defaultValue="lainnya">
          {KATEGORI.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Penjelasan"
        required
        hint="Minimal 10 karakter. Admin memakai teks ini untuk memutuskan; keputusan ada di tangan admin."
      >
        <Textarea
          name="alasan"
          rows={4}
          required
          minLength={10}
          maxLength={1000}
          placeholder="Contoh: anak pindah kota mulai bulan depan, kelas Kamis jadi tidak bisa diikuti."
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
        {pending ? "Mengajukan…" : "Ajukan pembatalan ke admin"}
      </Button>
      <p className="text-xs text-muted">
        Kuota tetap terisi sampai admin menyetujui. Setelah disetujui,
        pendaftaran jadi dibatalkan dan kuota dibuka untuk anak lain.
      </p>
    </form>
  );
}
