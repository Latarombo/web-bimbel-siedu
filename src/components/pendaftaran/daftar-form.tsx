"use client";
import { useTranslations } from "next-intl";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Field, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { daftarKelas, type DaftarState } from "@/app/actions/pendaftaran";
import { rupiah } from "@/lib/format";

const initial: DaftarState = {};

export type PilihanAnak = { id: number; nama: string; jenjangTerakhir: string };

export default function DaftarForm({
  kelasId,
  biayaPeriode,
  biayaDp,
  tenorMaksimum,
  anak,
  metodeAwal = "lunas",
  tenorAwal = 2,
}: {
  kelasId: number;
  biayaPeriode: number;
  biayaDp: number | null;
  tenorMaksimum: number | null;
  anak: PilihanAnak[];
  /** Sambungan dari kartu skema bayar di halaman detail kelas. */
  metodeAwal?: "lunas" | "dp_cicilan";
  tenorAwal?: number;
}) {
 const tr = useTranslations("public");
  const [state, formAction, pending] = useActionState(daftarKelas, initial);
  const router = useRouter();
  const diberitahu = useRef(false);

  // BR#12 — kelas tanpa biaya_dp: cuma lunas. BR#13 — anak lain jenjang tak ikut.
  const cicilanTersedia = biayaDp != null && tenorMaksimum != null && anak.length > 0;
  // Nilai bawaan dari query string; di-clamp ke aturan BR#28 (2..tenorMaksimum).
  const metodeBawaan = cicilanTersedia && metodeAwal === "dp_cicilan" ? "dp_cicilan" : "lunas";
  const tenorBawaan = Math.min(Math.max(tenorAwal, 2), tenorMaksimum ?? 2);
  // Tenor cuma relevan (dan cuma boleh terkirim) saat DP+Cicilan dipilih.
  const [metode, setMetode] = useState<string>(metodeBawaan);
  const tenorTampil = cicilanTersedia && metode === "dp_cicilan";

  useEffect(() => {
    if (state.ok && state.pendaftaranId && !diberitahu.current) {
      diberitahu.current = true;
      router.push(`/enrollments/${state.pendaftaranId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="kelas_id" value={kelasId} />

      <Field label={tr("text227")} required>
        <Select name="anak_id" required defaultValue="">
          <option value="" disabled>{tr("text228")}</option>
          {anak.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nama} ({a.jenjangTerakhir})
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={tr("text231")}
        required
        hint={
          biayaDp == null
            ? tr("text232")
            : tr("maxTerm", {count: tenorMaksimum ?? 0})
        }
      >
        <Select
          name="metode_bayar"
          required
          defaultValue={metodeBawaan}
          onChange={(e) => setMetode(e.target.value)}
        >
          <option value="lunas">{tr("text233")}{rupiah(biayaPeriode)}</option>
          {cicilanTersedia ? (
            <option value="dp_cicilan">
              {tr("text234")}{rupiah(biayaDp)} {tr("text235")}</option>
          ) : null}
        </Select>
      </Field>

      {tenorTampil ? (
        <Field label={tr("text236")} required hint={tr("text237")}>
          <Select name="tenor_bulan" required defaultValue={String(tenorBawaan)}>
            {Array.from({ length: (tenorMaksimum ?? 2) - 1 }, (_, i) => i + 2).map((t) => (
              <option key={t} value={t}>
                {tr("months", {count: t})}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? tr("processing") : tr("text239")}
      </Button>
      <p className="text-xs text-muted">
        {tr("text240")}</p>
    </form>
  );
}
