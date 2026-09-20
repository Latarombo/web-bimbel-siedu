"use client";
import { useTranslations } from "next-intl";

import { useActionState, useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { Field, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { daftarKelas, type DaftarState } from "@/app/actions/pendaftaran";
import { rupiah } from "@/lib/format";

const initial: DaftarState = {};

export type PilihanAnak = { id: number; nama: string; jenjangTerakhir: string };

export type KelasPilihan = {
  id: number;
  jenjang: string;
  tingkat?: string | null;
  mapelNama: string;
  guruNama: string;
  jadwal: string;
  biayaPeriode: number;
  biayaDp: number | null;
  tenorMaksimum: number | null;
  kuotaMaksimum: number;
  kuotaTerisi: number;
};

export default function DaftarForm({
  kelasId: initialKelasId,
  biayaPeriode: initialBiayaPeriode,
  biayaDp: initialBiayaDp,
  tenorMaksimum: initialTenorMaksimum,
  anak,
  kelasOptions = [],
  metodeAwal = "lunas",
  tenorAwal = 2,
}: {
  kelasId: number;
  biayaPeriode: number;
  biayaDp: number | null;
  tenorMaksimum: number | null;
  anak: PilihanAnak[];
  kelasOptions?: KelasPilihan[];
  /** Sambungan dari kartu skema bayar di halaman detail kelas. */
  metodeAwal?: "lunas" | "dp_cicilan";
  tenorAwal?: number;
}) {
  const tr = useTranslations("public");
  const [state, formAction, pending] = useActionState(daftarKelas, initial);
  const router = useRouter();
  const diberitahu = useRef(false);

  // Cari kelas target awal di opsi kelas
  const initialKelas = kelasOptions.find((k) => k.id === initialKelasId);

  // State 1: Anak yang dipilih
  const [selectedAnakId, setSelectedAnakId] = useState<string>(
    anak[0] ? String(anak[0].id) : ""
  );

  // State 2: Jenjang yang dipilih
  const initialJenjang =
    initialKelas?.jenjang ||
    anak[0]?.jenjangTerakhir ||
    "SD";
  const [selectedJenjang, setSelectedJenjang] = useState<string>(initialJenjang);

  // State 3: Kelas yang dipilih
  const [selectedKelasId, setSelectedKelasId] = useState<number>(initialKelasId);

  // Kelas-kelas yang cocok dengan jenjang saat ini
  const kelasForJenjang = useMemo(() => {
    return kelasOptions.filter((k) => k.jenjang === selectedJenjang);
  }, [kelasOptions, selectedJenjang]);

  // Kelas aktif saat ini
  const currentKelas = useMemo(() => {
    return (
      kelasOptions.find((k) => k.id === selectedKelasId) ??
      kelasForJenjang[0] ??
      initialKelas ?? {
        id: initialKelasId,
        jenjang: selectedJenjang,
        mapelNama: "",
        guruNama: "",
        jadwal: "",
        biayaPeriode: initialBiayaPeriode,
        biayaDp: initialBiayaDp,
        tenorMaksimum: initialTenorMaksimum,
        kuotaMaksimum: 0,
        kuotaTerisi: 0,
      }
    );
  }, [kelasOptions, selectedKelasId, kelasForJenjang, initialKelas, initialKelasId, selectedJenjang, initialBiayaPeriode, initialBiayaDp, initialTenorMaksimum]);

  // Biaya & tenor kelas aktif
  const currentBiayaPeriode = currentKelas.biayaPeriode;
  const currentBiayaDp = currentKelas.biayaDp;
  const currentTenorMaks = currentKelas.tenorMaksimum;

  const cicilanTersedia = currentBiayaDp != null && currentTenorMaks != null && anak.length > 0;
  const metodeBawaan = cicilanTersedia && metodeAwal === "dp_cicilan" ? "dp_cicilan" : "lunas";
  const [metode, setMetode] = useState<string>(metodeBawaan);

  const tenorBawaan = Math.min(Math.max(tenorAwal, 2), currentTenorMaks ?? 2);
  const tenorTampil = cicilanTersedia && metode === "dp_cicilan";

  // Saat anak berubah: sinkronkan jenjang ke jenjang anak
  const handleAnakChange = (aId: string) => {
    setSelectedAnakId(aId);
    const chosenAnak = anak.find((a) => String(a.id) === aId);
    if (chosenAnak?.jenjangTerakhir) {
      setSelectedJenjang(chosenAnak.jenjangTerakhir);
      const matchingClasses = kelasOptions.filter((k) => k.jenjang === chosenAnak.jenjangTerakhir);
      if (matchingClasses.length > 0 && !matchingClasses.some((k) => k.id === selectedKelasId)) {
        setSelectedKelasId(matchingClasses[0].id);
      }
    }
  };

  // Saat jenjang berubah secara manual
  const handleJenjangChange = (j: string) => {
    setSelectedJenjang(j);
    const matchingClasses = kelasOptions.filter((k) => k.jenjang === j);
    if (matchingClasses.length > 0 && !matchingClasses.some((k) => k.id === selectedKelasId)) {
      setSelectedKelasId(matchingClasses[0].id);
    }
  };

  // Saat kelas berubah
  const handleKelasChange = (kIdStr: string) => {
    const kId = Number(kIdStr);
    setSelectedKelasId(kId);
    const k = kelasOptions.find((x) => x.id === kId);
    if (k && k.biayaDp == null && metode === "dp_cicilan") {
      setMetode("lunas");
    }
  };

  useEffect(() => {
    if (state.ok && state.pendaftaranId && !diberitahu.current) {
      diberitahu.current = true;
      router.push(`/enrollments/${state.pendaftaranId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="kelas_id" value={currentKelas.id} />

      {/* 1. Pilih Anak */}
      <Field label={tr("selectChild")} required>
        <Select
          name="anak_id"
          required
          value={selectedAnakId}
          onChange={(e) => handleAnakChange(e.target.value)}
        >
          <option value="" disabled>{tr("selectChildPlaceholder")}</option>
          {anak.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nama} ({a.jenjangTerakhir || "-"})
            </option>
          ))}
        </Select>
      </Field>

      {/* 2. Pilih Jenjang */}
      <Field label={tr("selectLevelForm")} required>
        <Select
          value={selectedJenjang}
          onChange={(e) => handleJenjangChange(e.target.value)}
          required
        >
          <option value="TK">TK</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </Select>
      </Field>

      {/* 3. Pilihan Kelas */}
      <Field
        label={tr("selectClassForm")}
        required
        hint={kelasForJenjang.length === 0 ? tr("noClassesForLevel") : undefined}
      >
        <Select
          value={String(currentKelas.id)}
          onChange={(e) => handleKelasChange(e.target.value)}
          required
        >
          {kelasForJenjang.length === 0 ? (
            <option value="" disabled>{tr("noClassesForLevel")}</option>
          ) : (
            kelasForJenjang.map((k) => (
              <option key={k.id} value={k.id}>
                {k.mapelNama} {k.tingkat ? `(${k.tingkat})` : ""} — {k.guruNama} (Sisa {Math.max(0, k.kuotaMaksimum - k.kuotaTerisi)} kursi) · {k.jadwal}
              </option>
            ))
          )}
        </Select>
      </Field>

      {/* Live Card: Ringkasan Kelas yang Dipilih */}
      {currentKelas.mapelNama ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 text-xs text-slate-700 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
            <span>
              {currentKelas.mapelNama}
              {currentKelas.tingkat ? ` · ${currentKelas.tingkat}` : ""} ({currentKelas.jenjang})
            </span>
            <span className="text-brand font-extrabold">{rupiah(currentBiayaPeriode)}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
            <span><strong>Guru:</strong> {currentKelas.guruNama}</span>
            <span><strong>Jadwal:</strong> {currentKelas.jadwal}</span>
            <span><strong>Sisa Kuota:</strong> {Math.max(0, currentKelas.kuotaMaksimum - currentKelas.kuotaTerisi)} kursi</span>
          </div>
        </div>
      ) : null}

      {/* 4. Skema Pembayaran */}
      <Field
        label={tr("text231")}
        required
        hint={
          currentBiayaDp == null
            ? tr("text232")
            : tr("maxTerm", {count: currentTenorMaks ?? 0})
        }
      >
        <Select
          name="metode_bayar"
          required
          value={metode}
          onChange={(e) => setMetode(e.target.value)}
        >
          <option value="lunas">{tr("text233")}{rupiah(currentBiayaPeriode)}</option>
          {cicilanTersedia ? (
            <option value="dp_cicilan">
              {tr("text234")}{rupiah(currentBiayaDp!)} {tr("text235")}</option>
          ) : null}
        </Select>
      </Field>

      {/* 5. Tenor Cicilan */}
      {tenorTampil ? (
        <Field label={tr("text236")} required hint={tr("text237")}>
          <Select name="tenor_bulan" required defaultValue={String(tenorBawaan)}>
            {Array.from({ length: (currentTenorMaks ?? 2) - 1 }, (_, i) => i + 2).map((t) => (
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

      <Button type="submit" className="w-full" disabled={pending || kelasForJenjang.length === 0}>
        {pending ? tr("processing") : tr("text239")}
      </Button>
      <p className="text-xs text-muted">
        {tr("text240")}</p>
    </form>
  );
}
