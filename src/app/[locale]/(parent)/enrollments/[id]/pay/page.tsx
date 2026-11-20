import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rupiah } from "@/lib/format/format";
import { tagihanBerikutinya } from "@/lib/services/pembayaran";
import {
  midtransConfigured,
  midtransClientKey,
  snapScriptUrl,
} from "@/lib/midtrans";
import { SnapCashier } from "@/components/parent/snap-cashier";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function getFallbackIso() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export default async function PayPage({ params }: Props) {
  const locale = await getLocale();
  const session = await auth();

  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  if (!session?.user || session.user.role !== "orang_tua") {
    return redirect({
      href: { pathname: "/login", query: { next: `/enrollments/${pid}/pay` } },
      locale,
    });
  }

  const [pendaftaranRows] = await Promise.all([
    collect(db.orm.public.Pendaftaran.where((p) => p.id.eq(pid)).all()),
  ]);
  const pendaftaran = pendaftaranRows[0];
  if (!pendaftaran || pendaftaran.status.startsWith("dibatalkan")) {
    return redirect({ href: `/enrollments/${pid}`, locale });
  }

  const [anakRows, kelasRows, semuaTagihan] = await Promise.all([
    collect(db.orm.public.Anak.where((a) => a.id.eq(pendaftaran.anakId)).all()),
    collect(db.orm.public.Kelas.where((k) => k.id.eq(pendaftaran.kelasId)).all()),
    collect(
      db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(pid))
        .orderBy((b) => b.cicilanKe.asc())
        .all(),
    ),
  ]);

  const anak = anakRows[0];
  const kelas = kelasRows[0];

  // Guard kepemilikan orang tua
  if (!anak || anak.orangTuaId !== Number(session.user.id) || !kelas) {
    notFound();
  }

  const [mapelRows] = await Promise.all([
    collect(
      db.orm.public.MataPelajaran.where((m) => m.id.eq(kelas.mataPelajaranId)).all(),
    ),
  ]);
  const mapel = mapelRows[0];

  // Cari tagihan terbuka yang harus dibayar saat ini
  const tagihanAktif = await tagihanBerikutinya(pid);
  if (!tagihanAktif) {
    // Seluruh tagihan sudah lunas
    return redirect({ href: `/enrollments/${pid}`, locale });
  }

  // Hitung batas waktu timeout (BR#2: 24 jam untuk pembayaran awal)
  const isAwal = tagihanAktif.tipe === "dp" || tagihanAktif.tipe === "lunas";
  const batasWaktuIso = isAwal
    ? new Date(new Date(pendaftaran.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
    : tagihanAktif.jatuhTempo
      ? `${tagihanAktif.jatuhTempo}T23:59:59+07:00`
      : getFallbackIso();

  // Kalkulasi sisa tagihan di luar yang sedang dibayar
  const totalBiayaKelas = Number(kelas.biayaPeriode);
  const totalDibayar = semuaTagihan
    .filter((b) => b.status === "berhasil")
    .reduce((sum, b) => sum + Number(b.jumlah), 0);
  const nominalSaatIni = Number(tagihanAktif.jumlah);
  const sisaSetelahBayar = Math.max(
    0,
    totalBiayaKelas - (totalDibayar + nominalSaatIni),
  );

  const mapelNama = mapel?.nama ?? "Bimbingan Belajar";
  const namaTingkat = kelas.tingkat
    ? (kelas.tingkat.toLowerCase().startsWith("kelas") ? kelas.tingkat : `Kelas ${kelas.tingkat}`)
    : "";
  const labelKelas = `${namaTingkat ? `${namaTingkat} · ` : ""}${kelas.jenjang}`;

  // Buat URL kembali jika sukses
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") || "http";
  const origin = process.env.AUTH_URL || (host ? `${proto}://${host}` : "http://localhost:3000");
  const finishUrl = `${origin}${getPathname({ locale, href: `/enrollments/${pid}/payment-result` })}?pembayaran=${tagihanAktif.id}`;

  const labelTahap =
    tagihanAktif.tipe === "dp"
      ? "Pembayaran Awal (Uang Muka)"
      : tagihanAktif.tipe === "cicilan"
        ? `Cicilan Ke-${tagihanAktif.cicilanKe ?? 1}`
        : "Pelunasan Penuh Biaya Kelas";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6 sm:pt-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Navigasi Kembali & Header Bersih (Anti-Header Pill Clutter) */}
        <div className="mb-6">
          <Link
            href={`/enrollments/${pid}`}
            aria-label="Kembali ke Rincian Pendaftaran"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="mt-4">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Kasir Pembayaran Tagihan
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Selesaikan transaksi tagihan untuk mengonfirmasi kelangsungan belajar anak.
            </p>
          </div>
        </div>

        {/* Layout 2 Kolom (Desktop) / 1 Kolom (Mobile) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Kolom Kiri: Rincian Faktur & Siswa */}
          <div className="space-y-6 lg:col-span-7">
            {/* Kartu Profil Siswa & Kelas */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Rincian Pendaftaran
              </h2>

              <dl className="mt-4 divide-y divide-slate-100 text-sm">
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">Nama Siswa</dt>
                  <dd className="font-medium text-slate-900">{anak.nama}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">Mata Pelajaran</dt>
                  <dd className="font-medium text-slate-900">{mapelNama}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">Kelas & Jenjang</dt>
                  <dd className="font-medium text-slate-900">
                    {labelKelas}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">Skema Pembayaran</dt>
                  <dd className="font-medium text-slate-900">
                    {pendaftaran.metodeBayar === "dp_cicilan"
                      ? "Uang Muka & Cicilan Bulanan"
                      : "Pelunasan Penuh"}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">Tahap Pembayaran</dt>
                  <dd className="font-semibold text-blue-600">{labelTahap}</dd>
                </div>
              </dl>
            </div>

            {/* Kartu Rincian Biaya (Faktur Transparan) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Faktur Pembayaran
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total Biaya Paket Kelas</span>
                  <span className="font-medium tabular-nums text-slate-900">
                    {rupiah(totalBiayaKelas)}
                  </span>
                </div>

                {totalDibayar > 0 ? (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Telah Dibayarkan Sebelumnya</span>
                    <span className="font-medium tabular-nums">
                      - {rupiah(totalDibayar)}
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-slate-900">
                  <span className="font-semibold">Jumlah Tagihan Saat Ini</span>
                  <span className="font-bold tabular-nums text-blue-600">
                    {rupiah(nominalSaatIni)}
                  </span>
                </div>

                {sisaSetelahBayar > 0 ? (
                  <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500">
                    <span>Sisa Tagihan Berikutnya</span>
                    <span className="tabular-nums font-medium text-slate-700">
                      {rupiah(sisaSetelahBayar)}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Jaminan Keamanan */}
              <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                <ShieldCheck className="size-4 flex-shrink-0 text-slate-400 mt-0.5" />
                <p className="leading-relaxed">
                  Transaksi diproses aman melalui Midtrans Payment Gateway terenkripsi. Pembayaran diverifikasi otomatis seketika Anda menyelesaikan transaksi.
                </p>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Aksi Kasir & Pop-up Snap */}
          <div className="lg:col-span-5">
            <SnapCashier
              pendaftaranId={pid}
              pembayaranId={tagihanAktif.id}
              nominal={nominalSaatIni}
              tipe={tagihanAktif.tipe}
              cicilanKe={tagihanAktif.cicilanKe}
              jatuhTempo={tagihanAktif.jatuhTempo}
              batasWaktuTimeoutIso={batasWaktuIso}
              clientKey={midtransClientKey()}
              snapScriptUrl={snapScriptUrl()}
              midtransReady={midtransConfigured()}
              finishUrl={finishUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
