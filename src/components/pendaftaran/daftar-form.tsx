"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  Check,
  AlertCircle,
  User,
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
        {/* ================= KOLOM KIRI: DETAIL PEMESANAN (LEBAR 7) ================= */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-5">
              Detail Pemesanan
            </h2>

            {/* 1. Nama Paket */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Nama Paket</span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {mapelNama} {tingkat ? `(${tingkat}) ` : ""}{jenjang} {periodeNama ? `• ${periodeNama}` : ""}
              </h3>
            </div>

            {/* 2. Jadwal Belajar (Desain Khusus) */}
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Jadwal Sesi Belajar
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {itemsJadwal.length > 0 ? `${itemsJadwal.length} sesi per minggu` : "2 sesi per minggu"}
                </span>
              </div>

              {itemsJadwal.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {itemsJadwal.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {item.hari}
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium block mt-1">
                        {item.jam}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  Jadwal sesi belajar akan diinfokan lebih lanjut.
                </div>
              )}
            </div>

            {/* 3. Masa Berlaku */}
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-500">Masa berlaku</span>
              <p className="text-xs sm:text-sm font-medium text-slate-800">
                Paket aktif hingga {formatMasaAktif(tanggalSelesai)}
              </p>
            </div>

            {/* 4. Detail Paket: Fasilitas Belajar */}
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-3.5">
              <div>
                <span className="text-xs font-semibold text-slate-500">Detail Paket</span>
                <p className="text-xs sm:text-sm font-medium text-slate-800 mt-1">
                  Paket sudah termasuk:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-[13px] text-slate-700">
                {FASILITAS_KELAS.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-emerald-500" aria-hidden="true">
                      <Check className="size-3 text-white" strokeWidth={3} />
                    </span>
                    <div>
                      <strong className="text-xs sm:text-sm font-semibold text-slate-900 block">{item.judul}</strong>
                      <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                        {item.deskripsi}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Bagian Bawah: Garis Putus-Putus & Biaya Paket */}
            <div className="mt-8 pt-5 border-t border-dashed border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Biaya Paket Semester
              </span>
              <span className="text-base sm:text-lg font-extrabold text-[#e11d48]">
                {rupiah(biayaPeriode)}
              </span>
            </div>
          </div>
        </div>

        {/* ================= KOLOM KANAN: TUJUAN PEMBELIAN & DETAIL PEMBAYARAN (LEBAR 5) ================= */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-5">
            {/* Card 1: Tujuan Pembelian (Profil Siswa) */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Tujuan Pembelian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih profil tujuan untuk pembelian paket di bawah ini
              </p>
            </div>

            {selectedChild ? (
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                <div className="size-11 rounded-full border border-blue-200 bg-blue-50 grid place-items-center text-blue-600 shrink-0 shadow-2xs">
                  <User className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {selectedChild.nama}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-slate-700">{selectedChild.jenjangTerakhir || jenjang}</span>
                    {selectedChild.tingkat ? (
                      <>
                        <span className="text-slate-400 mx-1">-</span>
                        <span className="text-slate-600">{selectedChild.tingkat}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
                Belum ada profil siswa terpilih.
              </div>
            )}
          </div>

          {/* Card 2: Detail Pembayaran & Tombol Bayar */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Detail Pembayaran
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <div className="flex items-start justify-between gap-3">
                <span className="leading-snug">
                  {mapelNama} {tingkat ? `(${tingkat})` : ""} {jenjang}
                </span>
                <span className="font-semibold text-slate-900 shrink-0">
                  {rupiah(biayaPeriode)}
                </span>
              </div>

              {isDp ? (
                <>
                  <div className="flex items-center justify-between gap-3 text-slate-600">
                    <span>Uang Muka (DP) Dibayar Sekarang</span>
                    <span className="font-bold text-slate-900">{rupiah(biayaDp ?? 0)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Sisa Tagihan Cicilan</span>
                      <span>{rupiah(biayaPeriode - (biayaDp ?? 0))}</span>
                    </div>
                    <p className="text-[11px] text-blue-700">
                      Dicicil {nCicilan}x angsuran (± {rupiah(estimasiCicilan)} / bulan)
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3 text-slate-600">
                  <span>Skema Pembayaran</span>
                  <span className="font-medium text-slate-800">Pelunasan Penuh (1x)</span>
                </div>
              )}

              <div className="my-3 border-t border-slate-200" />

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {isDp ? "Total Bayar Saat Ini" : "Total Harga"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isDp ? "(Uang muka DP pendaftaran)" : "(Lunas satu semester)"}
                  </span>
                </div>
                <p className="text-2xl font-black text-[#e11d48] tracking-tight">
                  {rupiah(totalAkhirBayarSekarang)}
                </p>
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
                className="w-full flex min-h-12 items-center justify-center rounded-2xl py-3.5 text-base font-bold text-white shadow-md transition-all active:scale-[0.99] hover:brightness-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#f26d0f" }}
              >
                {isSubmitting ? "Memproses..." : "Pilih Metode Bayar"}
              </button>

              <p className="mt-3 text-[11px] text-center text-slate-400 leading-relaxed">
                Dengan menekan tombol di atas, Anda menyatakan telah membaca, memahami, dan menyetujui{" "}
                <Link href="/terms" target="_blank" className="text-slate-600 font-semibold underline underline-offset-2 hover:text-slate-900">
                  Kebijakan Penukaran & Ketentuan
                </Link>{" "}
                Siedu.
              </p>
            </div>
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
