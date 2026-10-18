"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  Check,
  AlertCircle,
} from "lucide-react";
import { daftarKelas, type DaftarState } from "@/app/actions/pendaftaran";
import { rupiah } from "@/lib/format";
import PersetujuanModal from "./persetujuan-modal";
import { FASILITAS_KELAS } from "@/lib/kelas-konten";

const initial: DaftarState = {};

export type PilihanAnak = {
  id: number;
  nama: string;
  jenjangTerakhir: string;
  tingkat?: string | null;
};

export type JadwalItemDetail = {
  hari: string;
  jam: string;
  menit?: number;
};

export type DaftarFormProps = {
  kelasId: number;
  mapelNama: string;
  guruNama?: string;
  jadwal: string;
  jadwalItems?: JadwalItemDetail[];
  jenjang: string;
  tingkat?: string | null;
  periodeNama?: string;
  tanggalSelesai?: string | null;
  biayaPeriode: number;
  biayaDp: number | null;
  tenorMaksimum: number | null;
  anak: PilihanAnak[];
  anakIdAwal?: string;
  metodeAwal?: "lunas" | "dp_cicilan";
  tenorAwal?: number;
};

export default function DaftarForm({
  kelasId,
  mapelNama,
  guruNama,
  jadwal,
  jadwalItems,
  jenjang,
  tingkat,
  periodeNama,
  tanggalSelesai,
  biayaPeriode,
  biayaDp,
  tenorMaksimum,
  anak,
  anakIdAwal,
  metodeAwal = "lunas",
  tenorAwal = 2,
}: DaftarFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const diberitahu = useRef(false);

  const [state, formAction, pending] = useActionState(daftarKelas, initial);
  const [isPendingTransition, startTransition] = useTransition();

  // Child selection is locked (read-only) based on URL param or fallback
  const selectedChild =
    anak.find((a) => String(a.id) === anakIdAwal) ||
    anak.find((a) => a.jenjangTerakhir?.toUpperCase() === jenjang.toUpperCase()) ||
    anak[0];

  const selectedAnakId = selectedChild ? String(selectedChild.id) : "";

  // Payment scheme is locked (read-only) based on URL param
  const cicilanTersedia = biayaDp != null && tenorMaksimum != null;
  const isDp = cicilanTersedia && metodeAwal === "dp_cicilan";
  const metode = isDp ? "dp_cicilan" : "lunas";
  const tenor = Math.min(Math.max(tenorAwal, 2), tenorMaksimum ?? 2);
  const nCicilan = Math.max(tenor - 1, 1);
  const estimasiCicilan = isDp && biayaDp != null
    ? Math.floor((biayaPeriode - biayaDp) / nCicilan)
    : 0;

  const [isPersetujuanOpen, setIsPersetujuanOpen] = useState(false);

  // Price calculations
  const totalAkhirBayarSekarang = isDp ? (biayaDp ?? 0) : biayaPeriode;

  // Jadwal parsing & formatting
  const itemsJadwal: JadwalItemDetail[] =
    jadwalItems && jadwalItems.length > 0
      ? jadwalItems
      : jadwal
        ? jadwal.split(",").map((s) => {
            const trimmed = s.trim();
            const parts = trimmed.split(" ");
            const hari = parts[0] || trimmed;
            const jam = parts.slice(1).join(" ") || "";
            return { hari, jam: jam.includes("WIB") ? jam : `${jam} WIB` };
          })
        : [];

  // Redirect upon successful enrollment creation
  useEffect(() => {
    if (state.ok && state.pendaftaranId && !diberitahu.current) {
      diberitahu.current = true;
      setIsPersetujuanOpen(false);
      router.push(`/enrollments/${state.pendaftaranId}`);
    }
  }, [state, router]);

  // Handler when user confirms on the Persetujuan Modal
  const handleConfirmPersetujuan = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      await formAction(formData);
    });
  };

  // Format date for validity (e.g., "01 Juli 2027")
  const formatMasaAktif = (dateStr?: string | null) => {
    if (!dateStr) return "Satu Semester Penuh";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const isSubmitting = pending || isPendingTransition;

  return (
    <div>
      {/* Hidden native form that binds to server action daftarKelas */}
      <form ref={formRef} action={formAction} className="hidden" aria-hidden="true">
        <input type="hidden" name="anak_id" value={selectedAnakId} />
        <input type="hidden" name="kelas_id" value={kelasId} />
        <input type="hidden" name="metode_bayar" value={metode} />
        {isDp ? <input type="hidden" name="tenor_bulan" value={tenor} /> : null}
      </form>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-12">
        {/* ================= KOLOM KIRI: DETAIL PEMESANAN KELAS (LEBAR 7) ================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {/* Header Card */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 bg-white">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Detail Pemesanan Kelas
              </h2>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-brand">
                {jenjang}{tingkat ? ` • ${tingkat}` : ""}
              </span>
            </div>

            {/* Body Card */}
            <div className="p-5 sm:p-7 space-y-6">
              {/* 1. Paket & Periode Belajar */}
              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Paket Belajar
                  </h3>
                  {periodeNama ? (
                    <span className="text-xs font-semibold text-brand">
                      {periodeNama}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  {mapelNama} {tingkat ? `(${tingkat}) ` : ""}{jenjang}
                </p>
                <p className="text-xs text-slate-500">
                  Masa aktif hingga <strong className="font-semibold text-slate-700">{formatMasaAktif(tanggalSelesai)}</strong>
                </p>
              </div>

              {/* 2. Jadwal Sesi Belajar */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Jadwal Sesi Belajar
                  </h3>
                  <span className="text-xs text-slate-500">
                    {itemsJadwal.length > 0 ? `${itemsJadwal.length} sesi per minggu` : "2 sesi per minggu"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                  {itemsJadwal.length > 0 ? (
                    itemsJadwal.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3.5 py-3 sm:px-4 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-3 sm:gap-6">
                          <span className="w-16 sm:w-20 font-bold text-slate-900">
                            {item.hari}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {item.jam}
                          </span>
                        </div>
                        {item.menit ? (
                          <span className="text-xs text-slate-500 shrink-0">
                            {item.menit} menit
                          </span>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Jadwal sesi belajar akan diinfokan lebih lanjut.
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Fasilitas & Pendampingan Belajar */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Fasilitas & Pendampingan Belajar
                </h3>
                <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
                    {FASILITAS_KELAS.map((item) => (
                      <li key={item.id} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-emerald-500" aria-hidden="true">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </span>
                        <div>
                          <strong className="text-xs sm:text-sm font-semibold text-slate-900 block">{item.judul}</strong>
                          <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                            {item.deskripsi}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= KOLOM KANAN: TUJUAN PEMBELIAN & DETAIL PEMBAYARAN (LEBAR 5) ================= */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition-all space-y-5">
            {/* Header Card */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Pendaftaran Kelas</h3>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-brand">
                {isDp ? "DP & Cicilan" : "Bayar Penuh"}
              </span>
            </div>

            {/* 1. Profil Siswa Terpilih */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Tujuan Pembelian</label>
                <span className="text-[11px] text-slate-500">Profil siswa terdaftar</span>
              </div>

              {selectedChild ? (
                <div className="flex items-center justify-between p-3 rounded-2xl border-2 border-blue-500 bg-blue-50/40 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 shrink-0 rounded-full bg-blue-100 text-blue-800 font-bold text-xs grid place-items-center uppercase">
                      {selectedChild.nama.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate leading-tight">
                        {selectedChild.nama}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-600">
                          Jenjang: {selectedChild.jenjangTerakhir || jenjang}
                          {selectedChild.tingkat ? ` (${selectedChild.tingkat})` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md shrink-0 ml-2">
                    Terpilih
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
                  Belum ada profil siswa terpilih.
                </div>
              )}
            </div>

            {/* 2. Rincian Pembayaran */}
            <div className="space-y-2.5 text-xs sm:text-sm border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Skema Pembayaran</span>
                <span className="font-semibold text-slate-900">
                  {isDp ? `DP + ${nCicilan}x Cicilan` : "Pelunasan Penuh (1x)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Biaya Paket Semester</span>
                <span className="font-semibold text-slate-900">
                  {rupiah(biayaPeriode)}
                </span>
              </div>

              {isDp ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Uang Muka (DP) Dibayar Sekarang</span>
                    <span className="font-bold text-slate-900">{rupiah(biayaDp ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-brand">
                    <span>Estimasi Cicilan</span>
                    <span className="font-bold">± {rupiah(estimasiCicilan)} / bln</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900">
                    Sisa tagihan {rupiah(biayaPeriode - (biayaDp ?? 0))} dicicil {nCicilan}x angsuran bulanan.
                  </div>
                </>
              ) : null}

              <div className="my-3 border-t border-dashed border-slate-200" />

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {isDp ? "Total Bayar Saat Ini" : "Total Harga"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isDp ? "(Uang muka DP pendaftaran)" : "(Lunas satu semester)"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#e11d48]">
                    {rupiah(totalAkhirBayarSekarang)}
                  </p>
                  <span className="text-xs font-semibold text-slate-500">
                    {isDp ? "/ uang muka (DP)" : "/ semester"}
                  </span>
                </div>
              </div>
            </div>

            {/* Alert Error jika ada kegagalan server */}
            {state.error ? (
              <div
                className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{state.error}</span>
              </div>
            ) : null}

            {/* Tombol Aksi Utama */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsPersetujuanOpen(true)}
                disabled={isSubmitting || anak.length === 0 || !selectedAnakId}
                className="flex min-h-12 w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-white shadow-xs transition-all active:scale-[0.99] hover:brightness-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#c2410c" }}
              >
                {isSubmitting ? "Memproses..." : "Pilih Metode Bayar"}
              </button>

              <p className="mt-3 text-center text-xs text-slate-500 leading-snug">
                Dengan melanjutkan, Anda menyetujui{" "}
                <Link href="/terms" target="_blank" className="text-brand font-semibold hover:underline">
                  Kebijakan & Ketentuan
                </Link>{" "}
                Siedu.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog Persetujuan Pembelian */}
      <PersetujuanModal
        isOpen={isPersetujuanOpen}
        onClose={() => setIsPersetujuanOpen(false)}
        onConfirm={handleConfirmPersetujuan}
        isSubmitting={isSubmitting}
        namaAnak={selectedChild?.nama}
      />
    </div>
  );
}
