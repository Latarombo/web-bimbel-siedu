"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { ChevronRight, Plus, UserPlus, CheckCircle2, AlertTriangle } from "lucide-react";
import { rupiah } from "@/lib/format";

export type PilihanAnak = {
  id: number;
  nama: string;
  jenjangTerakhir: string;
  tingkat?: string | null;
  statusPendaftaran?: {
    sudahDaftarKelasIni: boolean;
    pendaftaranId?: number;
    status?: "menunggu_pembayaran" | "terdaftar" | "tertunggak";
    bentrokKelasLain?: {
      namaKelas: string;
      hari: string;
      jamMulai: string;
      jamSelesai: string;
    };
  };
};

type Skema = "lunas" | "dp";

type Props = {
  kelasId: number;
  periode: string;
  biayaPeriode: number;
  biayaDp: number | null;
  tenorMaksimum: number | null;
  sisaKuota: number;
  kuotaTerisi: number;
  kuotaMaksimum: number;
  manfaat: string[];
  jenjang: string;
  isLoggedIn: boolean;
  isOrangTua: boolean;
  anak: PilihanAnak[];
};

const globalSkemaState: { skema: Skema; tenor: number } = {
  skema: "lunas",
  tenor: 2,
};

function persistSkema(skema: Skema, tenor: number) {
  globalSkemaState.skema = skema;
  globalSkemaState.tenor = tenor;
}

export function SkemaPembayaran({
  kelasId,
  periode,
  biayaPeriode,
  biayaDp,
  tenorMaksimum,
  sisaKuota,
  kuotaTerisi,
  kuotaMaksimum,
  manfaat,
  jenjang,
  isLoggedIn,
  isOrangTua,
  anak,
}: Props) {
  const tr = useTranslations("public");
  const router = useRouter();

  // Cari anak yang jenjangnya cocok dengan jenjang kelas
  const matchingChild = anak.find(
    (a) => a.jenjangTerakhir && a.jenjangTerakhir.toUpperCase() === jenjang.toUpperCase()
  );
  const [selectedAnakId, setSelectedAnakId] = useState<string>(
    matchingChild ? String(matchingChild.id) : anak[0] ? String(anak[0].id) : ""
  );

  const fallbackAnakId =
    anak.length > 0 ? String((matchingChild ?? anak[0]).id) : "";
  const resolvedAnakId = selectedAnakId || fallbackAnakId;

  const cicilanAda = biayaDp != null && tenorMaksimum != null;
  const [skema, setSkema] = useState<Skema>(() => globalSkemaState.skema);
  const [tenor, setTenor] = useState(() => globalSkemaState.tenor);

  const handleSelectSkema = (s: Skema) => {
    setSkema(s);
    persistSkema(s, tenor);
  };

  const handleSelectTenor = (t: number) => {
    setTenor(t);
    persistSkema(skema, t);
  };

  const opsiTenor = Array.from({ length: (tenorMaksimum ?? 2) - 1 }, (_, i) => i + 2);
  const nCicilan = Math.max(tenor - 1, 1);
  const estimasiCicilan = cicilanAda
    ? Math.floor((biayaPeriode - (biayaDp ?? 0)) / (tenor - 1))
    : 0;

  const pakaiDp = skema === "dp" && cicilanAda;
  const bayarSekarang = pakaiDp ? (biayaDp ?? 0) : biayaPeriode;

  const selectedAnak = anak.find((a) => String(a.id) === resolvedAnakId);
  const isSelectedMismatch = Boolean(
    selectedAnak?.jenjangTerakhir &&
      selectedAnak.jenjangTerakhir.toUpperCase() !== jenjang.toUpperCase()
  );
  const isSelectedAlreadyEnrolled = Boolean(
    selectedAnak?.statusPendaftaran?.sudahDaftarKelasIni
  );
  const isSelectedScheduleConflict = Boolean(
    selectedAnak?.statusPendaftaran?.bentrokKelasLain
  );

  const handleLanjutCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedAnakId || isSelectedAlreadyEnrolled || isSelectedScheduleConflict) return;
    const search = new URLSearchParams();
    search.set("anakId", resolvedAnakId);
    search.set("metode", pakaiDp ? "dp_cicilan" : "lunas");
    if (pakaiDp) search.set("tenor", String(tenor));
    router.push(`/classes/${kelasId}/daftar?${search.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Sticky Card Checkout */}
      <div className="lg:sticky lg:top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition-all">
        <form id="form-pendaftaran" onSubmit={handleLanjutCheckout} noValidate>
          {/* Header Card */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base">Pendaftaran Kelas</h3>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-brand">
              {pakaiDp ? "DP & Cicilan" : "Bayar Penuh"}
            </span>
          </div>

          {/* 1. Bagian: Tujuan Pembelian (Profil Anak) */}
          <div id="tujuan-pembelian" className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700">Tujuan Pembelian</label>
              {isOrangTua && anak.length > 0 && (
                <span className="text-xs text-slate-500">Pilih profil siswa</span>
              )}
            </div>

            {!isLoggedIn ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-center">
                <p className="text-xs text-amber-800 leading-relaxed">
                  Masuk ke akun orang tua untuk memilih profil anak yang akan didaftarkan.
                </p>
              </div>
            ) : !isOrangTua ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800 leading-relaxed">
                Akun Anda terdaftar bukan sebagai Orang Tua. Pendaftaran kelas bimbel ditujukan untuk akun Orang Tua.
              </div>
            ) : anak.length === 0 ? (
              <div className="rounded-2xl border border-blue-100/80 bg-slate-50 p-5 text-center">
                <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-xs border border-blue-100/80">
                  <UserPlus className="size-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Belum Ada Profil Anak
                </h4>
                <p className="mt-1 mb-4 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Daftarkan profil putra-putri Anda terlebih dahulu untuk memilih kelas bimbel ini.
                </p>
                <Link
                  href={`/children/new?next=/classes/${kelasId}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-sm transition-all duration-150 active:scale-[0.98]"
                >
                  <Plus className="size-3.5" /> Tambah Profil Anak Baru
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {anak.map((a) => {
                  const isSelected = resolvedAnakId === String(a.id);
                  const isSudahDaftar = a.statusPendaftaran?.sudahDaftarKelasIni;
                  const isBentrok = Boolean(a.statusPendaftaran?.bentrokKelasLain);

                  return (
                    <div
                      key={a.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAnakId(String(a.id))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedAnakId(String(a.id));
                        }
                      }}
                      className={`flex flex-col gap-1.5 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? isSudahDaftar
                            ? "border-blue-400 bg-blue-50/40 shadow-2xs"
                            : isBentrok
                              ? "border-rose-400 bg-rose-50/30 shadow-2xs"
                              : "border-blue-500 bg-blue-50/40 shadow-2xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`size-8 shrink-0 rounded-full font-bold text-xs grid place-items-center uppercase ${
                              isSudahDaftar
                                ? "bg-blue-100 text-blue-800"
                                : isBentrok
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {a.nama.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate leading-tight">
                              {a.nama}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[11px] font-medium text-slate-600">
                                Jenjang: {a.jenjangTerakhir || "Belum diatur"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSudahDaftar ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                              {a.statusPendaftaran?.status === "terdaftar"
                                ? "Terdaftar"
                                : a.statusPendaftaran?.status === "menunggu_pembayaran"
                                  ? "Menunggu Bayar"
                                  : "Terdaftar"}
                            </span>
                          ) : isBentrok ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full shrink-0">
                              Bentrok
                            </span>
                          ) : null}

                          <div
                            className={`size-5 shrink-0 rounded-full border-2 grid place-items-center transition-colors ml-1 ${
                              isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                            }`}
                          >
                            {isSelected && <div className="size-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>

                      {/* Info mini status jika bentrok atau sudah terdaftar */}
                      {isSudahDaftar ? (
                        <div className="text-[11px] text-blue-700 bg-blue-50/70 rounded-lg px-2.5 py-1">
                          Sudah memiliki pendaftaran aktif di kelas ini
                        </div>
                      ) : isBentrok && a.statusPendaftaran?.bentrokKelasLain ? (
                        <div className="text-[11px] text-rose-700 bg-rose-50 rounded-lg px-2.5 py-1">
                          Bentrok: {a.statusPendaftaran.bentrokKelasLain.namaKelas} ({a.statusPendaftaran.bentrokKelasLain.hari} {a.statusPendaftaran.bentrokKelasLain.jamMulai}–{a.statusPendaftaran.bentrokKelasLain.jamSelesai})
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {/* Card Peringatan Pendaftaran Aktif untuk Anak Terpilih */}
                {isSelectedAlreadyEnrolled && selectedAnak && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                      <span>{selectedAnak.nama} Sudah Terdaftar di Kelas Ini</span>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Profil {selectedAnak.nama} sudah memiliki pendaftaran di kelas ini (status:{" "}
                      <strong>
                        {selectedAnak.statusPendaftaran?.status === "terdaftar"
                          ? "Aktif / Terdaftar"
                          : selectedAnak.statusPendaftaran?.status === "menunggu_pembayaran"
                            ? "Menunggu Pembayaran"
                            : selectedAnak.statusPendaftaran?.status}
                      </strong>
                      ). Anda tidak perlu mendaftarkan kembali anak ini.
                    </p>
                    {selectedAnak.statusPendaftaran?.pendaftaranId ? (
                      <Link
                        href={`/enrollments/${selectedAnak.statusPendaftaran.pendaftaranId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline pt-0.5"
                      >
                        Buka Detail Pendaftaran & Tiket Kelas →
                      </Link>
                    ) : null}
                  </div>
                )}

                {/* Card Peringatan Jadwal Bentrok dengan Kelas Lain untuk Anak Terpilih */}
                {isSelectedScheduleConflict && selectedAnak?.statusPendaftaran?.bentrokKelasLain && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs sm:text-sm">
                      <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                      <span>Jadwal Bentrok dengan Kelas Lain</span>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      {selectedAnak.nama} sudah terdaftar pada kelas{" "}
                      <strong>{selectedAnak.statusPendaftaran.bentrokKelasLain.namaKelas}</strong> dengan jadwal hari{" "}
                      <strong>{selectedAnak.statusPendaftaran.bentrokKelasLain.hari}</strong> jam{" "}
                      <strong>{selectedAnak.statusPendaftaran.bentrokKelasLain.jamMulai} - {selectedAnak.statusPendaftaran.bentrokKelasLain.jamSelesai} WIB</strong>. Satu siswa tidak dapat mengikuti 2 kelas dengan jadwal yang beririsan.
                    </p>
                  </div>
                )}

                {isSelectedMismatch && selectedAnak && !isSelectedAlreadyEnrolled && !isSelectedScheduleConflict && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 text-[11px] text-amber-800 leading-relaxed">
                    Peringatan: Jenjang profil {selectedAnak.nama} ({selectedAnak.jenjangTerakhir}) berbeda dengan jenjang kelas ini ({jenjang}). Pendaftaran mungkin ditolak oleh sistem bila jenjang tidak sesuai.
                  </div>
                )}

                <div className="relative py-1 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <span className="relative bg-white px-2 text-[11px] text-slate-600">
                    atau
                  </span>
                </div>

                <Link
                  href={`/children/new?next=/classes/${kelasId}`}
                  className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-6 place-items-center rounded-full bg-white border border-slate-200 text-slate-600">
                      <Plus className="size-3.5" />
                    </span>
                    <span>Buat Profil Anak Baru</span>
                  </div>
                  <ChevronRight className="size-4 text-slate-600" />
                </Link>
              </div>
            )}
          </div>

          {/* 2. Bagian: Pilihan Metode Bayar (Lunas vs DP) */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">{tr("text196")}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectSkema("lunas")}
                className={`rounded-xl py-2.5 px-3 text-xs font-bold text-center border transition-all cursor-pointer ${
                  skema === "lunas"
                    ? "border-2 border-brand bg-brand-soft text-brand shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tr("text197")}
              </button>
              {cicilanAda ? (
                <button
                  type="button"
                  onClick={() => handleSelectSkema("dp")}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold text-center border transition-all cursor-pointer ${
                    skema === "dp"
                      ? "border-2 border-brand bg-brand-soft text-brand shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tr("text199")}
                </button>
              ) : null}
            </div>
          </div>

          {/* Pilihan Tenor Cicilan jika memilih DP */}
          {pakaiDp && opsiTenor.length > 0 ? (
            <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">{tr("text222")}</span>
                <span className="text-xs text-brand font-bold">
                  {tenor} bulan ({nCicilan}x cicilan)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {opsiTenor.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSelectTenor(t)}
                    className={`rounded-lg py-1.5 px-3 text-xs font-bold transition-colors cursor-pointer ${
                      tenor === t
                        ? "bg-brand text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t}x
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* 3. Bagian: Rincian Biaya */}
          <div className="mt-4 space-y-2 text-sm border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted">{tr("text202")}</span>
              <span className="font-semibold text-foreground">
                {pakaiDp ? tr("downCount", { count: nCicilan }) : tr("text203")}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted">{tr("text204")}</span>
              <span className="font-semibold text-foreground">{rupiah(biayaPeriode)}</span>
            </div>
            {pakaiDp ? (
              <div className="flex justify-between items-center text-xs sm:text-sm text-brand">
                <span>{tr("text205")}</span>
                <span className="font-bold">± {rupiah(estimasiCicilan)} / bln</span>
              </div>
            ) : null}
          </div>

          {pakaiDp ? (
            <div className="mt-3 rounded-xl bg-amber-50/90 border border-amber-200/60 p-2.5 text-[11px] leading-relaxed text-amber-900">
              {tr("classDownPaymentNote")}
            </div>
          ) : null}

          <div className="my-4 border-t border-dashed border-slate-200" />

          {/* 4. Total Bayar Sekarang */}
          <div>
            <span className="text-xs font-medium text-muted">{tr("text207")}</span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#e11d48]">
                {rupiah(bayarSekarang)}
              </p>
              <span className="text-xs font-semibold text-muted">
                {pakaiDp ? "/ uang muka (DP)" : tr("text191")}
              </span>
            </div>
          </div>

          {/* 5. Tombol Aksi Utama */}
          {!isLoggedIn ? (
            <Link
              id="cta-utama"
              href={`/login?next=/classes/${kelasId}`}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-white shadow-xs transition-all active:scale-[0.99] hover:brightness-95"
              style={{ backgroundColor: "#c2410c" }}
            >
              Masuk untuk Mendaftar
            </Link>
          ) : !isOrangTua ? (
            <button
              id="cta-utama"
              type="button"
              disabled
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-slate-600 bg-slate-100 cursor-not-allowed"
            >
              Khusus Akun Orang Tua
            </button>
          ) : sisaKuota <= 0 ? (
            <button
              id="cta-utama"
              type="button"
              disabled
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-slate-600 bg-slate-100 cursor-not-allowed"
            >
              Kuota Kelas Penuh
            </button>
          ) : anak.length === 0 ? (
            <Link
              id="cta-utama"
              href={`/children/new?next=/classes/${kelasId}`}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-white shadow-xs transition-all active:scale-[0.99] hover:brightness-95"
              style={{ backgroundColor: "#c2410c" }}
            >
              <Plus className="mr-1.5 size-4" /> Tambah Profil Anak Dulu
            </Link>
          ) : isSelectedAlreadyEnrolled && selectedAnak?.statusPendaftaran?.pendaftaranId ? (
            <Link
              id="cta-utama"
              href={`/enrollments/${selectedAnak.statusPendaftaran.pendaftaranId}`}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-white shadow-xs transition-all active:scale-[0.99] hover:brightness-95 bg-blue-600"
            >
              Lihat Detail Pendaftaran {selectedAnak.nama}
            </Link>
          ) : isSelectedAlreadyEnrolled ? (
            <button
              id="cta-utama"
              type="button"
              disabled
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-slate-600 bg-slate-100 cursor-not-allowed"
            >
              Sudah Terdaftar di Kelas Ini
            </button>
          ) : isSelectedScheduleConflict ? (
            <button
              id="cta-utama"
              type="button"
              disabled
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 cursor-not-allowed"
            >
              Jadwal Bentrok dengan Kelas Lain
            </button>
          ) : (
            <button
              id="cta-utama"
              type="submit"
              disabled={!resolvedAnakId}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-white shadow-xs transition-all active:scale-[0.99] hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: "#c2410c" }}
            >
              Lanjut ke Pembayaran
            </button>
          )}

          <p className="mt-3 text-center text-xs text-slate-500 leading-snug">
            {tr("text215")}{" "}
            <Link href="/#faq" className="text-brand font-semibold hover:underline">
              {tr("text217")}
            </Link>
          </p>
        </form>
      </div>

      {/* Bar harga lengket khusus layar kecil */}
      <BarHargaLengket
        anchorId="cta-utama"
        label={pakaiDp ? tr("text218") : tr("text219")}
        harga={rupiah(bayarSekarang)}
        formId="form-pendaftaran"
        isLoggedIn={isLoggedIn}
        isOrangTua={isOrangTua}
        hasAnak={anak.length > 0}
        hasSelectedAnak={Boolean(resolvedAnakId)}
        isSelectedAlreadyEnrolled={isSelectedAlreadyEnrolled}
        isSelectedScheduleConflict={isSelectedScheduleConflict}
        enrolledPendaftaranId={selectedAnak?.statusPendaftaran?.pendaftaranId}
        kelasId={kelasId}
        sisaKuota={sisaKuota}
      />
    </div>
  );
}

/* ---------- Bar harga bawah (mobile sticky bottom) ---------- */

function BarHargaLengket({
  anchorId,
  label,
  harga,
  formId,
  isLoggedIn,
  isOrangTua,
  hasAnak,
  hasSelectedAnak,
  isSelectedAlreadyEnrolled,
  isSelectedScheduleConflict,
  enrolledPendaftaranId,
  kelasId,
  sisaKuota,
}: {
  anchorId: string;
  label: string;
  harga: string;
  formId: string;
  isLoggedIn: boolean;
  isOrangTua: boolean;
  hasAnak: boolean;
  hasSelectedAnak: boolean;
  isSelectedAlreadyEnrolled?: boolean;
  isSelectedScheduleConflict?: boolean;
  enrolledPendaftaranId?: number;
  kelasId: number;
  sisaKuota: number;
}) {
  const tr = useTranslations("public");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const anchor = document.getElementById(anchorId);
    if (!anchor || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), {
      rootMargin: "0px 0px 80px 0px",
    });
    io.observe(anchor);
    return () => io.disconnect();
  }, [anchorId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md transition-transform duration-200 motion-reduce:transition-none lg:hidden shadow-lg ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500">{label}</p>
          <p className="truncate text-base font-bold text-slate-900">{harga}</p>
        </div>

        {!isLoggedIn ? (
          <Link
            href={`/login?next=/classes/${kelasId}`}
            aria-hidden={!show}
            tabIndex={show ? 0 : -1}
            className="shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
            style={{ backgroundColor: "#c2410c" }}
          >
            Masuk
          </Link>
        ) : !isOrangTua ? (
          <span className="shrink-0 text-xs font-semibold text-slate-600">Khusus Ortu</span>
        ) : sisaKuota <= 0 ? (
          <span className="shrink-0 text-xs font-bold text-rose-600">Penuh</span>
        ) : !hasAnak ? (
          <Link
            href={`/children/new?next=/classes/${kelasId}`}
            aria-hidden={!show}
            tabIndex={show ? 0 : -1}
            className="shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
            style={{ backgroundColor: "#c2410c" }}
          >
            + Profil Anak
          </Link>
        ) : isSelectedAlreadyEnrolled && enrolledPendaftaranId ? (
          <Link
            href={`/enrollments/${enrolledPendaftaranId}`}
            aria-hidden={!show}
            tabIndex={show ? 0 : -1}
            className="shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold text-white bg-blue-600 shadow-xs transition-colors"
          >
            Lihat Tiket
          </Link>
        ) : isSelectedAlreadyEnrolled ? (
          <span className="shrink-0 text-xs font-semibold text-slate-500">Terdaftar</span>
        ) : isSelectedScheduleConflict ? (
          <span className="shrink-0 text-xs font-semibold text-rose-600">Bentrok</span>
        ) : (
          <button
            form={formId}
            type="submit"
            disabled={!hasSelectedAnak}
            aria-hidden={!show}
            tabIndex={show ? 0 : -1}
            className="shrink-0 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: "#c2410c" }}
          >
            Lanjut
          </button>
        )}
      </div>
    </div>
  );
}
