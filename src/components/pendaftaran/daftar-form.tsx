"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Field, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { daftarKelas, type DaftarState } from "@/app/actions/pendaftaran";
import { rupiah } from "@/lib/placeholder";

const initial: DaftarState = {};

export type PilihanAnak = { id: number; nama: string; jenjangTerakhir: string };

export default function DaftarForm({
  kelasId,
  biayaPeriode,
  biayaDp,
  tenorMaksimum,
  anak,
}: {
  kelasId: number;
  biayaPeriode: number;
  biayaDp: number | null;
  tenorMaksimum: number | null;
  anak: PilihanAnak[];
}) {
  const [state, formAction, pending] = useActionState(daftarKelas, initial);
  const router = useRouter();
  const diberitahu = useRef(false);

  useEffect(() => {
    if (state.ok && state.pendaftaranId && !diberitahu.current) {
      diberitahu.current = true;
      router.push(`/enrollments/${state.pendaftaranId}`);
    }
  }, [state, router]);

  // BR#12 — kelas tanpa biaya_dp: cuma lunas. BR#13 — anak lain jenjang tak ikut.
  const cicilanTersedia = biayaDp != null && tenorMaksimum != null && anak.length > 0;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="kelas_id" value={kelasId} />

      <Field label="Anak yang mendaftar" required>
        <Select name="anak_id" required defaultValue="">
          <option value="" disabled>Pilih anak</option>
          {anak.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nama} ({a.jenjangTerakhir})
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Metode bayar" required hint={biayaDp == null ? "Kelas ini hanya menerima pembayaran lunas (BR#12)." : `Tenor maksimum ${tenorMaksimum} bulan (BR#28).`}>
        <Select name="metode_bayar" required defaultValue="lunas">
          <option value="lunas">Bayar lunas — {rupiah(biayaPeriode)}</option>
          {cicilanTersedia ? (
            <option value="dp_cicilan">
              DP {rupiah(biayaDp)} + cicilan
            </option>
          ) : null}
        </Select>
      </Field>

      {cicilanTersedia ? (
        <Field label="Tenor (jumlah tagihan termasuk DP)" required hint="Tenor 3 = DP + 2 cicilan bulanan (BR#28).">
          <Select name="tenor_bulan" required defaultValue="2">
            {Array.from({ length: (tenorMaksimum ?? 2) - 1 }, (_, i) => i + 2).map((t) => (
              <option key={t} value={t}>
                {t} bulan
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Ajukan pendaftaran"}
      </Button>
      <p className="text-xs text-muted">
        Kuota terkunci saat pengajuan; batal otomatis kalau tidak dibayar dalam 24 jam (BR#2).
      </p>
    </form>
  );
}
