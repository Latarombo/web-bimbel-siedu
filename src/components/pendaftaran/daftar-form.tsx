"use client";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState, useMemo } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  CheckCircle2,
  Plus,
  Tag,
  Ticket,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
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

  // Cari kelas target awal
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

  // Biaya & tenor
  const currentBiayaPeriode = currentKelas.biayaPeriode;
  const currentBiayaDp = currentKelas.biayaDp;
  const currentTenorMaks = currentKelas.tenorMaksimum;

  const cicilanTersedia = currentBiayaDp != null && currentTenorMaks != null;
  const metodeBawaan = cicilanTersedia && metodeAwal === "dp_cicilan" ? "dp_cicilan" : "lunas";
  const [metode, setMetode] = useState<string>(metodeBawaan);

  const [tenor, setTenor] = useState<number>(
    Math.min(Math.max(tenorAwal, 2), currentTenorMaks ?? 2)
  );

  const opsiTenor = Array.from({ length: (currentTenorMaks ?? 2) - 1 }, (_, i) => i + 2);
  const nCicilan = Math.max(tenor - 1, 1);
  const estimasiCicilan = cicilanTersedia
    ? Math.floor((currentBiayaPeriode - (currentBiayaDp ?? 0)) / (tenor - 1))
    : 0;

  const pakaiDp = metode === "dp_cicilan" && cicilanTersedia;
  const bayarSekarang = pakaiDp ? (currentBiayaDp ?? 0) : currentBiayaPeriode;

  // Handler saat klik kartu anak
  const handleSelectAnak = (aId: string) => {
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

  useEffect(() => {
    if (state.ok && state.pendaftaranId && !diberitahu.current) {
      diberitahu.current = true;
      router.push(`/enrollments/${state.pendaftaranId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} noValidate>
      {/* Hidden inputs untuk server action */}
      <input type="hidden" name="anak_id" value={selectedAnakId} />
      <input type="hidden" name="kelas_id" value={currentKelas.id} />
      <input type="hidden" name="metode_bayar" value={metode} />
      {pakaiDp ? <input type="hidden" name="tenor_bulan" value={tenor} /> : null}

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* ================= KOLOM KIRI: PILIH PAKET LANGGANAN (LEBAR 7) ================= */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pilih Skema Pembayaran</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih cara pembayaran: lunas atau uang muka (DP) dengan cicilan bulanan
            </p>
          </div>

          <div className="space-y-4">
            {/* Opsi 1: Paket Lunas */}
            <div
              onClick={() => setMetode("lunas")}
              className={`rounded-2xl border-2 transition-all p-5 bg-white cursor-pointer ${
                metode === "lunas"
                  ? "border-brand bg-brand-soft/20 shadow-xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Pembayaran Lunas
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentKelas.mapelNama} {currentKelas.tingkat ? `(${currentKelas.tingkat})` : ""} {currentKelas.jenjang} • {currentKelas.jadwal}
                  </p>
                </div>
                {/* Radio check icon */}
                <div
                  className={`size-5 rounded-full border-2 grid place-items-center shrink-0 mt-0.5 transition-colors ${
                    metode === "lunas" ? "border-brand bg-brand text-white" : "border-slate-300"
                  }`}
                >
                  {metode === "lunas" && <div className="size-2 rounded-full bg-white" />}
                </div>
              </div>

              {/* Deskripsi Fasilitas */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Tatap muka sesuai jadwal mingguan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Latihan soal dan koreksi tugas per sesi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Laporan presensi dan progres di portal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Materi kurikulum lengkap</span>
                  </li>
                </ul>
              </div>

              {/* Footer Harga */}
              <div className="mt-4 border-t border-dashed border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Sekali bayar untuk seluruh semester
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {rupiah(currentBiayaPeriode)}
                </span>
              </div>
            </div>

            {/* Opsi 2: Paket DP + Cicilan (jika tersedia) */}
            {cicilanTersedia ? (
              <div
                onClick={() => setMetode("dp_cicilan")}
                className={`rounded-2xl border-2 transition-all p-5 bg-white cursor-pointer ${
                  metode === "dp_cicilan"
                    ? "border-brand bg-brand-soft/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      Uang Muka (DP) + Cicilan
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Bayar DP saat mendaftar, sisa tagihan dicicil bulanan
                    </p>
                  </div>
                  {/* Radio check icon */}
                  <div
                    className={`size-5 rounded-full border-2 grid place-items-center shrink-0 mt-0.5 transition-colors ${
                      metode === "dp_cicilan" ? "border-brand bg-brand text-white" : "border-slate-300"
                    }`}
                  >
                    {metode === "dp_cicilan" && <div className="size-2 rounded-full bg-white" />}
                  </div>
                </div>

                {/* Deskripsi Fasilitas */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Semua sesi tatap muka dan bahan belajar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Pelunasan cicilan manual via web</span>
                    </li>
                  </ul>
                </div>

                {/* Footer Harga DP */}
                <div className="mt-4 border-t border-dashed border-slate-200 pt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    DP saat ini + {nCicilan}x cicilan (± {rupiah(estimasiCicilan)}/bln)
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {rupiah(currentBiayaDp!)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ================= KOLOM KANAN: TUJUAN PEMBELIAN & CHECKOUT (LEBAR 5) ================= */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl lg:sticky lg:top-24 space-y-6">
            {/* Bagian 1: Tujuan Pembelian (Pilih Anak) */}
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Tujuan Pembelian</h3>
              <p className="text-xs text-slate-500 mt-0.5 mb-3.5">
                Pilih profil anak yang akan mengikuti bimbingan belajar:
              </p>

              {anak.length === 0 ? (
                <div className="p-4 text-center rounded-2xl bg-amber-50/80 border border-amber-200">
                  <p className="text-xs text-amber-800">Belum ada profil anak terdaftar di akun Anda.</p>
                  <Link
                    href="/children/new"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                  >
                    <Plus className="size-3.5" /> Tambah Profil Anak Baru
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {anak.map((a) => {
                    const isSelected = selectedAnakId === String(a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => handleSelectAnak(String(a.id))}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-teal-500 bg-teal-50/30"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs grid place-items-center uppercase">
                            {a.nama.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-tight">{a.nama}</p>
                            <span className="text-[11px] font-medium text-slate-400">
                              Jenjang: {a.jenjangTerakhir || "Belum diatur"}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`size-5 rounded-full border-2 grid place-items-center transition-colors ${
                            isSelected ? "border-teal-600 bg-teal-600" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="size-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}

                  <div className="relative py-2 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100" />
                    </div>
                    <span className="relative bg-white px-2 text-[11px] text-slate-400 uppercase tracking-wider">
                      atau
                    </span>
                  </div>

                  <Link
                    href="/children/new"
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-7 place-items-center rounded-full bg-white border border-slate-200 text-slate-600">
                        <Plus className="size-3.5" />
                      </span>
                      <span>Buat Profil Anak Baru</span>
                    </div>
                    <ChevronRight className="size-4 text-slate-400" />
                  </Link>
                </div>
              )}
            </div>

            {/* Bagian 2: Pilih Metode Pelunasan */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2.5">Pilih Metode Pelunasan</h3>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer"
              >
                <option value="lunas">Pembayaran Lunas ({rupiah(currentBiayaPeriode)})</option>
                {cicilanTersedia ? (
                  <option value="dp_cicilan">
                    Pembayaran Uang Muka DP ({rupiah(currentBiayaDp!)}) + Cicilan
                  </option>
                ) : null}
              </select>

              {/* Pilihan Tenor jika DP */}
              {pakaiDp ? (
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Pilih Tenor Cicilan:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {opsiTenor.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTenor(t)}
                        className={`rounded-lg py-1.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                          tenor === t
                            ? "bg-brand text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {t} Bulan ({t - 1}x cicilan)
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Estimasi angsuran: <strong>± {rupiah(estimasiCicilan)} / bulan</strong>
                  </p>
                </div>
              ) : null}
            </div>

            {/* Bagian 3: Gunakan Kode Diskon & Kupon */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <h3 className="text-sm font-extrabold text-slate-900">Gunakan Kode Diskon</h3>
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-emerald-600" />
                  <span>Belum ada promo diskon aktif</span>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 text-xs text-teal-800">
                <div className="flex items-center gap-2">
                  <Ticket className="size-4 text-teal-600" />
                  <span className="font-medium">Lihat kupon yang kamu miliki</span>
                </div>
                <ChevronRight className="size-4 text-teal-600" />
              </div>
            </div>

            {/* Bagian 4: Total Harga & Tombol Beli */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Total Harga</span>
                  <span className="text-xs text-slate-400 font-normal">
                    {pakaiDp ? "(Uang muka yang dibayar saat ini)" : "(Biaya penuh semester ini)"}
                  </span>
                </div>
                <p className="text-2xl font-black text-[#e11d48] tracking-tight">
                  {rupiah(bayarSekarang)}
                </p>
              </div>

              {state.error ? (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700" role="alert">
                  {state.error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={pending || anak.length === 0 || !selectedAnakId}
                className="w-full flex min-h-12 items-center justify-center rounded-xl py-3.5 text-base font-black text-white shadow-md transition-all active:scale-[0.99] hover:brightness-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#f26d0f" }}
              >
                {pending ? tr("processing") : "Beli"}
              </button>

              <p className="mt-3 text-[11px] text-center text-slate-400 leading-relaxed">
                Jika memilih metode pelunasan cicilan, pastikan kamu sudah membaca dan menyetujui{" "}
                <Link href="/terms" className="text-brand font-semibold hover:underline">
                  Syarat dan Ketentuan
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
