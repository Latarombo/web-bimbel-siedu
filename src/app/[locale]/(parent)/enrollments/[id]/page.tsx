import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusBadge, type StatusPendaftaran } from "@/components/status-badge";
import {
  Clock,
  Share2,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  ArrowLeft,
  BookOpen,
  User,
  Calendar,
  Lock,
  MessageCircle,
  HelpCircle,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { rupiah, fmtTanggal } from "@/lib/format";
import { getLabelMaps, labelHari } from "@/lib/label";
import { sisaWaktu24Jam } from "@/lib/hari";
import { ClassTicket } from "@/components/parent/class-ticket";
import { createBillingReminderWaLink } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";
import { midtransConfigured } from "@/lib/midtrans";
import MidtransPayButton from "@/components/parent/midtrans-pay-button";
import { konfirmasiManual } from "@/app/actions/pembayaran";

export const dynamic = "force-dynamic";

const COLLECT = async <T,>(src: AsyncIterable<T>) => {
  const out: T[] = [];
  for await (const r of src) out.push(r);
  return out;
};

export default async function EnrollmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({ href: "/login?next=/home", locale });
  }
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const ortuId = Number(session.user.id);

  // Pendaftaran harus milik anak milik orang tua ini.
  const [p] = await COLLECT(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();

  const [anak, kelas, tagihan, pengajuan, jadwal, ortuUsers] = await Promise.all([
    COLLECT(db.orm.public.Anak.where((a) => a.id.eq(p.anakId)).all()),
    COLLECT(db.orm.public.Kelas.where((k) => k.id.eq(p.kelasId)).all()),
    COLLECT(
      db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(pid))
        .orderBy((b) => b.cicilanKe.asc())
        .all(),
    ),
    COLLECT(
      db.orm.public.PengajuanPembatalan.where((q) => q.pendaftaranId.eq(pid))
        .all(),
    ),
    COLLECT(
      db.orm.public.JadwalItem.where((j) => j.kelasId.eq(p.kelasId)).all(),
    ),
    COLLECT(db.orm.public.User.where((u) => u.id.eq(ortuId)).all()),
  ]);
  const a = anak[0];
  const k = kelas[0];
  const ortuUser = ortuUsers[0];
  const pengajuanMenunggu = pengajuan.find((q) => q.status === "menunggu");

  // Pastikan pendaftaran benar milik orang tua yang login.
  if (!a || a.orangTuaId !== ortuId) notFound();

  const [mapel, guru, periode] = k
    ? await Promise.all([
        COLLECT(db.orm.public.MataPelajaran.where((m) => m.id.eq(k.mataPelajaranId)).all()),
        COLLECT(db.orm.public.User.where((u) => u.id.eq(k.guruId)).all()),
        COLLECT(db.orm.public.PeriodePendaftaran.where((per) => per.id.eq(k.periodeId)).all()),
      ])
    : [[], [], []];
  const mapelNama = mapel[0]?.nama ?? `Kelas #${p.kelasId}`;
  const guruNama = guru[0]?.name ?? "Pengajar Siedu";
  const periodeNama = periode[0]?.nama ?? "";

  const sp = searchParams ? await searchParams : undefined;
  const isPaymentFailed = sp?.error === "payment_failed";

  const status = p.status as StatusPendaftaran;
  const aktif = ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(status);
  const nextBill = tagihan.find((b) => b.status === "pending" || b.status === "gagal");
  const riwayat = tagihan.filter((b) => b.status !== "pending" && b.status !== "gagal");
  const gateway = midtransConfigured();

  // Perhitungan sisa waktu batas bayar 24 jam (server-side)
  const { isExpired, sisaJam, sisaMenit } = sisaWaktu24Jam(p.createdAt);

  const sisaWaktuTeks = isExpired
    ? tr("timeExpired")
    : sisaJam > 0
      ? tr("timeRemaining", { hours: sisaJam, minutes: sisaMenit })
      : tr("timeRemainingMinutesOnly", { minutes: sisaMenit });

  const metodeBayarTeks =
    p.metodeBayar === "dp_cicilan"
      ? p.tenorBulan
        ? tr("paymentMethodInstallment", { tenor: p.tenorBulan })
        : tr("paymentMethodInstallmentNoTenor")
      : tr("paymentMethodFull");

  const tagihanAwalNominal = nextBill ? Number(nextBill.jumlah) : 0;
  const tagihanAwalLabel =
    nextBill?.tipe === "dp"
      ? tr("text045")
      : nextBill?.tipe === "lunas"
        ? tr("text046")
        : tr("paymentSummaryAmount");

  const tanggal = (v: string | Date | null | undefined) =>
    v ? fmtTanggal(typeof v === "string" ? v : v.toISOString(), locale) : "-";

  const labelTagihan = (b: { tipe: string; cicilanKe: number | null }) =>
    b.tipe === "cicilan"
      ? tr("enrollInstallment", { number: b.cicilanKe ?? 0 })
      : b.tipe === "dp"
        ? tr("text045")
        : tr("text046");

  const alasanBatal =
    status === "dibatalkan_timeout"
      ? tr("text034")
      : status === "dibatalkan_tunggakan"
        ? tr("text035")
        : status === "dibatalkan_orang_tua"
          ? tr("text036")
          : status === "dibatalkan_kelas"
            ? tr("enrollCancelledClass")
            : `${tr("text028")} ${status.replaceAll("_", " ")}.`;

  const kategoriPengajuan =
    getLabelMaps(locale).LABEL_KATEGORI_BATAL[pengajuanMenunggu?.kategori ?? ""] ??
    (pengajuanMenunggu?.kategori ?? "").replaceAll("_", " ");

  const targetTingkat = k?.tingkat ?? null;
  const namaTingkat = targetTingkat
    ? (targetTingkat.toLowerCase().startsWith("kelas") ? targetTingkat : `Kelas ${targetTingkat}`)
    : "";
  const judulLengkap = `${mapelNama} ${namaTingkat ? `(${namaTingkat})` : ""} - ${k?.jenjang ?? ""}`;

  const waBillingLink = nextBill
    ? createBillingReminderWaLink({
        phone: ortuUser?.nomorTelepon,
        parentName: ortuUser?.name ?? undefined,
        studentName: a.nama,
        className: judulLengkap,
        amount: tagihanAwalNominal,
        dueDate: nextBill.jatuhTempo,
        paymentUrl: `https://siedu.id/${locale}/enrollments/${p.id}`,
      })
    : "";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-6 sm:pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Bar / Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>100% Pembayaran Resmi & Terenkripsi</span>
            </span>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* ============================================================== */}
        {/* KONDISI 1: STATUS MENUNGGU PEMBAYARAN (CHECKOUT ALA RUANGGURU)   */}
        {/* ============================================================== */}
        {status === "menunggu_pembayaran" && nextBill ? (
          <div className="mt-6 space-y-6">
            {isPaymentFailed && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-xs text-blue-900 flex items-center gap-3">
                <AlertTriangle className="size-5 text-blue-600 shrink-0" />
                <p>
                  Sesi pembayaran sebelumnya telah dibatalkan atau ditutup. Tagihan Anda masih aktif dan Anda dapat mencoba membayar kembali kapan saja sebelum batas waktu.
                </p>
              </div>
            )}
            {/* Banner Countdown Urgensi (Amber Bar) */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/60 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                    <Clock className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-amber-950">
                      Batas Waktu Pembayaran
                    </h2>
                    <p className="text-xs text-amber-900/80 mt-0.5">
                      Selesaikan pembayaran sebelum batas waktu agar reservasi kursi siswa tidak dibatalkan otomatis.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-white/90 border border-amber-300/80 px-3.5 py-2 shadow-xs">
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="font-mono text-sm sm:text-base font-black text-rose-700 tabular-nums">
                    {sisaWaktuTeks}
                  </span>
                </div>
              </div>
            </div>

            {/* Layout 2 Kolom Kasir */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
              {/* Kolom Kiri: Detail Paket & Saluran Pembayaran (7 Kolom) */}
              <div className="space-y-6 lg:col-span-7">
                {/* 1. Detail Paket Belajar Siswa */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <BookOpen className="size-4" />
                    </span>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Program Belajar
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {mapelNama}
                      </h3>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <dt className="text-slate-500 font-medium flex items-center gap-1.5">
                        <User className="size-3.5 text-slate-400" />
                        <span>Nama Siswa</span>
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-slate-900">
                        {a.nama}
                      </dd>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <dt className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-amber-500" />
                        <span>Jenjang & Kelas</span>
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-slate-900">
                        {k?.jenjang} {namaTingkat ? `• ${namaTingkat}` : ""}
                      </dd>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <dt className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-400" />
                        <span>Tutor / Pengajar</span>
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {guruNama}
                      </dd>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <dt className="text-slate-500 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>Periode Semester</span>
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {periodeNama || "Semester Aktif"}
                      </dd>
                    </div>
                  </dl>

                  {/* Sesi Belajar Mingguan */}
                  {jadwal.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 block mb-2">
                        Jadwal Pertemuan Mingguan ({jadwal.length} Sesi):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {jadwal.map((j, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/70 px-2.5 py-1 text-xs font-semibold text-blue-900"
                          >
                            <span className="size-1.5 rounded-full bg-blue-600" />
                            {labelHari(j.hari, locale)} {String(j.jamMulai).slice(0, 5)} - {String(j.jamSelesai).slice(0, 5)} WIB
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Metode Pembayaran Resmi Tersedia (Midtrans Showcase) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CreditCard className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Metode Pembayaran Resmi
                      </h3>
                      <p className="text-xs text-slate-500">
                        Didukung oleh Midtrans Payment Gateway resmi Bank Indonesia
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                      <span className="text-xs font-bold text-slate-700 block mb-2">
                        Virtual Account Bank (Verifikasi Instan 24 Jam):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {["BCA", "Mandiri", "BRI", "BNI", "Permata", "CIMB Niaga"].map((bank) => (
                          <span
                            key={bank}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs"
                          >
                            {bank}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                      <span className="text-xs font-bold text-slate-700 block mb-2">
                        E-Wallet & QRIS (Scan Semua Aplikasi M-Banking):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {["QRIS", "GoPay", "ShopeePay"].map((ew) => (
                          <span
                            key={ew}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-2xs"
                          >
                            {ew}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      💡 <strong>Catatan:</strong> Anda dapat langsung memilih bank atau e-wallet favorit Anda pada jendela aman Midtrans yang muncul setelah mengklik tombol <em>Bayar Sekarang</em>.
                    </p>
                  </div>
                </div>

                {/* 3. Kartu Bantuan Customer Service */}
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <MessageCircle className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Butuh Bantuan Pembayaran?
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Tim admin Siedu siap membantu konfirmasi atau kendala tagihan Anda.
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    Chat WhatsApp
                  </a>
                </div>
              </div>

              {/* Kolom Kanan: Ringkasan Tagihan & Tombol Bayar (5 Kolom Sticky) */}
              <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
                <div className="rounded-2xl border-2 border-blue-200/80 bg-white p-5 sm:p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                    Ringkasan Pembayaran
                  </h3>

                  <dl className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Biaya Paket Belajar</span>
                      <span className="font-semibold text-slate-900">
                        {k ? rupiah(Number(k.biayaPeriode)) : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Skema Pembayaran</span>
                      <span className="font-semibold text-slate-900">
                        {p.metodeBayar === "dp_cicilan" ? "DP + Cicilan Bertahap" : "Lunas Penuh"}
                      </span>
                    </div>

                    {p.metodeBayar === "dp_cicilan" && p.tenorBulan && (
                      <div className="flex justify-between text-slate-600">
                        <span>Jangka Waktu Tenor</span>
                        <span className="font-semibold text-slate-900">
                          {p.tenorBulan} Bulan (DP + {p.tenorBulan - 1}x Cicilan)
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Tagihan Pembayaran Ini</span>
                      <span className="font-semibold text-blue-700">
                        {tagihanAwalLabel}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-sm font-bold text-slate-900">Total Tagihan</span>
                      <span className="text-2xl font-black text-blue-600 tabular-nums">
                        {rupiah(tagihanAwalNominal)}
                      </span>
                    </div>
                  </dl>

                  {/* Tombol Utama Bayar Sekarang */}
                  <div className="mt-6 space-y-2.5">
                    {gateway ? (
                      <MidtransPayButton
                        pembayaranId={nextBill.id}
                        label={`Bayar Sekarang • ${rupiah(tagihanAwalNominal)}`}
                        className="w-full min-h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-md rounded-xl transition-all active:scale-[0.99] cursor-pointer"
                      />
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs space-y-3">
                        <p className="font-bold text-amber-900">Mode Transfer Manual Lembaga</p>
                        <p className="text-amber-800 leading-relaxed">
                          Silakan transfer sejumlah <strong>{rupiah(tagihanAwalNominal)}</strong> ke rekening lembaga Siedu, lalu klik tombol konfirmasi di bawah:
                        </p>
                        <form action={konfirmasiManual}>
                          <input type="hidden" name="pembayaran_id" value={nextBill.id} />
                          <input type="hidden" name="pendaftaran_id" value={pid} />
                          <Button type="submit" className="w-full min-h-11 font-bold">
                            Konfirmasi Pembayaran Manual
                          </Button>
                        </form>
                      </div>
                    )}

                    {/* Tombol Kirim Tagihan ke WhatsApp */}
                    {waBillingLink ? (
                      <a
                        href={waBillingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 text-amber-900 px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Share2 className="size-4" />
                        <span>Kirim Rincian Tagihan ke WhatsApp</span>
                      </a>
                    ) : null}
                  </div>

                  {/* Trust Footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <Lock className="size-3.5 text-slate-400" />
                    <span>Transaksi aman & terenkripsi 256-bit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* KONDISI 2: STATUS SUDAH TERDAFTAR (DIGITAL ADMISSION PASS)      */}
        {/* ============================================================== */}
        {status === "terdaftar" && k && (
          <div className="mt-6 space-y-6">
            {/* Banner Sukses Pendaftaran */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-50/80 to-teal-50 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="size-6" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-emerald-950">
                      Pendaftaran Berhasil & Siswa Resmi Terdaftar! 🎉
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-900/85 mt-0.5">
                      Kursi belajar {a.nama} telah aman. Simpan atau cetak Tiket Masuk Kelas di bawah ini untuk persiapan hari pertama.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/enrollments/${p.id}/report`}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-white border border-emerald-300 px-4 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100/50 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Lihat E-Rapor</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Tiket Masuk Kelas Digital Resmi */}
            <ClassTicket
              enrollmentId={p.id}
              childName={a.nama}
              subjectName={mapelNama}
              grade={k.jenjang}
              teacherName={guruNama}
              ruangan={k.ruangan}
              jadwal={jadwal.map((j) => ({
                hari: j.hari,
                mulai: j.jamMulai,
                selesai: j.jamSelesai,
              }))}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* KONDISI 3: STATUS TERTUNGGAK (ALERT DENGAN TOMBOL BAYAR INSTAN) */}
        {/* ============================================================== */}
        {status === "tertunggak" && (
          <div className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50/90 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                  <AlertTriangle className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-rose-950">
                    Terdapat Tagihan Tertunggak
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-900/85 mt-0.5 max-w-xl">
                    Segera lakukan pembayaran untuk tagihan yang telah melewati jatuh tempo agar pendaftaran dan kuota kelas tidak dibatalkan otomatis.
                  </p>
                </div>
              </div>

              {nextBill && gateway && (
                <div className="shrink-0 w-full sm:w-auto">
                  <MidtransPayButton
                    pembayaranId={nextBill.id}
                    label={`Bayar Tunggakan (${rupiah(Number(nextBill.jumlah))})`}
                    className="min-h-11 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* KONDISI 4: STATUS DIBATALKAN                                   */}
        {/* ============================================================== */}
        {status.startsWith("dibatalkan") && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-center max-w-lg mx-auto">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
              <Clock className="size-6" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Pendaftaran Tidak Aktif
            </h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              {alasanBatal}
            </p>
            <div className="mt-5">
              <ButtonLink href="/classes" variant="default" className="min-h-10 px-5 text-xs font-bold">
                Jelajahi Kelas Lain
              </ButtonLink>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAGIHAN BERIKUTNYA (CICILAN LANJUTAN SAAT TERDAFTAR)           */}
        {/* ============================================================== */}
        {nextBill && aktif && status !== "menunggu_pembayaran" && (
          <section className="mt-8">
            <div className="flex items-center justify-between gap-2 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Tagihan Pembayaran Mendatang
              </h3>
              <Badge tone="brand">Cicilan Aktif</Badge>
            </div>

            <div className="rounded-2xl border border-blue-200/80 bg-white p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    {labelTagihan(nextBill)}
                  </span>
                  <p className="text-xl font-black text-slate-900 tabular-nums mt-0.5">
                    {rupiah(Number(nextBill.jumlah))}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Jatuh Tempo: <strong>{nextBill.jatuhTempo ? tanggal(nextBill.jatuhTempo) : "Sesuai Jadwal"}</strong>
                  </p>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {gateway ? (
                    <MidtransPayButton
                      pembayaranId={nextBill.id}
                      label={`Bayar Cicilan (${rupiah(Number(nextBill.jumlah))})`}
                      className="min-h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    />
                  ) : (
                    <ButtonLink href={`/enrollments/${p.id}/pay`} size="lg" className="min-h-11 px-5">
                      Bayar Sekarang
                    </ButtonLink>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* RIWAYAT TRANSAKSI & KUITANSI RESMI                             */}
        {/* ============================================================== */}
        {riwayat.length > 0 && (
          <section className="mt-8">
            <h3 className="text-base font-bold text-slate-900 pb-2">
              Riwayat Pembayaran & Kuitansi
            </h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <ul className="divide-y divide-slate-100">
                {riwayat.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 sm:px-6 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {labelTagihan(b)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {b.dibayarPada
                          ? `Dibayar pada: ${tanggal(b.dibayarPada)}`
                          : b.jatuhTempo
                            ? `Jatuh tempo: ${tanggal(b.jatuhTempo)}`
                            : "Pembayaran terdaftar"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {rupiah(Number(b.jumlah))}
                      </span>
                      <Badge tone={b.status === "berhasil" ? "emerald" : "red"}>
                        {b.status === "berhasil" ? "Lunas" : "Gagal"}
                      </Badge>
                      {b.status === "berhasil" && (
                        <Link
                          href={`/enrollments/${p.id}/receipt/${b.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 shadow-2xs transition-colors"
                        >
                          <span>Kuitansi</span>
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* PENGAJUAN PEMBATALAN / REFUND                                  */}
        {/* ============================================================== */}
        {aktif && status === "terdaftar" && !pengajuanMenunggu && (
          <div className="mt-8 border-t border-slate-200/80 pt-6">
            <Link
              href={`/enrollments/${p.id}/cancel`}
              className="text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-rose-600 transition-colors"
            >
              Ajukan Pembatalan / Pengembalian Dana
            </Link>
            <p className="mt-1 text-[11px] text-slate-400">
              Pengembalian dana diproses sesuai syarat dan ketentuan lembaga.
            </p>
          </div>
        )}

        {pengajuanMenunggu && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            {tr("enrollCancelPending", {
              kategori: kategoriPengajuan,
              date: tanggal(pengajuanMenunggu.createdAt),
            })}
          </div>
        )}
      </div>
    </div>
  );
}
