import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rupiah } from "@/lib/format/format";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusPendaftaran } from "@/components/common/status-badge";
import { PageShell, PageHeader, Panel, PanelHead } from "@/components/admin/ui";
import { ManualPaymentDialog } from "@/components/admin/manual-payment-dialog";

export const dynamic = "force-dynamic";

export default async function AdminEnrollmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pendaftaranId = Number(id);
  if (!pendaftaranId || Number.isNaN(pendaftaranId)) notFound();

  const locale = await getLocale();
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user) {
    return redirect({
      href: { pathname: "/login", query: { next: getPathname({ href: `/admin/enrollments/${pendaftaranId}`, locale }) } },
      locale,
    });
  }
  if (session.user.role !== "admin") {
    return redirect({ href: session.user.role === "guru" ? "/teacher/dashboard" : "/home", locale });
  }

  const [pendaftaran] = await collect(
    db.orm.public.Pendaftaran.where({ id: pendaftaranId }).all()
  );
  if (!pendaftaran) notFound();

  const [anak, kelas, periode, pembayaran] = await Promise.all([
    collect(db.orm.public.Anak.where({ id: pendaftaran.anakId }).all()).then((res) => res[0]),
    collect(db.orm.public.Kelas.where({ id: pendaftaran.kelasId }).all()).then((res) => res[0]),
    collect(db.orm.public.PeriodePendaftaran.where({ id: pendaftaran.periodeId }).all()).then((res) => res[0]),
    collect(db.orm.public.Pembayaran.where({ pendaftaranId }).all()),
  ]);

  if (!anak || !kelas) notFound();

  const [wali, guru, jadwal] = await Promise.all([
    collect(db.orm.public.User.where({ id: anak.orangTuaId }).all()).then((res) => res[0]),
    collect(db.orm.public.User.where({ id: kelas.guruId }).all()).then((res) => res[0]),
    collect(db.orm.public.JadwalItem.where({ kelasId: kelas.id }).all()),
  ]);

  const fmtTanggal = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  };

  const fmtWaktu = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  const totalBiaya = Number(kelas.biayaPeriode);
  const pembayaranBerhasil = pembayaran.filter((b) => b.status === "berhasil");
  const totalDibayar = pembayaranBerhasil.reduce((acc, b) => acc + Number(b.jumlah), 0);
  const sisaTagihan = Math.max(0, totalBiaya - totalDibayar);

  const urutPembayaran = pembayaran.toSorted((a, b) => {
    const aOrder = a.cicilanKe ?? (a.tipe === "dp" ? 0 : 99);
    const bOrder = b.cicilanKe ?? (b.tipe === "dp" ? 0 : 99);
    return aOrder - bOrder;
  });

  return (
    <PageShell wide>
      <PageHeader
        title={`Rincian Pendaftaran #${pendaftaran.id}`}
        desc={`Siswa: ${anak.nama} · Kelas: ${kelas.nama || kelas.mapel} (${kelas.jenjang})`}
        backHref="/admin/enrollments"
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={pendaftaran.status as StatusPendaftaran} />
        </div>
      </PageHeader>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom Kiri: Profil Siswa & Orang Tua */}
        <div className="space-y-6">
          <Panel className="p-5">
            <PanelHead title="Profil Siswa" sub="Data anak yang didaftarkan" />
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Nama Lengkap</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">{anak.nama}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Tanggal Lahir</dt>
                <dd className="tabular-nums text-slate-800 dark:text-slate-200">{fmtTanggal(anak.tanggalLahir)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Jenjang Saat Mendaftar</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 uppercase">{pendaftaran.jenjangSaatDaftar}</dd>
              </div>
              {anak.tingkat ? (
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Tingkat Kelas Sekolah</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{anak.tingkat}</dd>
                </div>
              ) : null}
            </dl>
          </Panel>

          <Panel className="p-5">
            <PanelHead title="Wali Murid" sub="Akun penanggung jawab pendaftaran" />
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Nama Orang Tua / Wali</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">{wali?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Email Akun</dt>
                <dd className="text-slate-800 dark:text-slate-200">{wali?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Nomor Telepon / WhatsApp</dt>
                <dd className="tabular-nums text-slate-800 dark:text-slate-200">{wali?.nomorTelepon ?? "—"}</dd>
              </div>
              {wali?.alamat ? (
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Alamat Rumah</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{wali.alamat}</dd>
                </div>
              ) : null}
            </dl>
          </Panel>
        </div>

        {/* Kolom Tengah & Kanan: Rincian Kelas & Tagihan Pembayaran */}
        <div className="space-y-6 lg:col-span-2">
          <Panel className="p-5">
            <PanelHead title="Kelas & Jadwal Belajar" sub="Informasi kelas yang diambil" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Mata Pelajaran</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  <Link href={`/admin/classes/${kelas.id}`} className="text-blue-700 dark:text-blue-400 hover:underline">
                    {kelas.nama || kelas.mapel}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Guru Pengampu</dt>
                <dd className="text-slate-800 dark:text-slate-200">{guru?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Periode Akademik</dt>
                <dd className="text-slate-800 dark:text-slate-200">{periode?.nama ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Ruangan</dt>
                <dd className="text-slate-800 dark:text-slate-200">{kelas.ruangan ?? "Online / Utama"}</dd>
              </div>
            </div>

            {jadwal.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Jadwal Sesi Belajar</dt>
                <div className="flex flex-wrap gap-2">
                  {jadwal.map((j) => (
                    <span
                      key={j.id}
                      className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      {j.hari}, {j.jamMulai} - {j.jamSelesai}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Panel>

          {/* Rincian Tagihan & Termin Pembayaran */}
          <Panel className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <PanelHead title="Rincian Pembayaran" sub="Status termin tagihan dan pelunasan" />
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total Biaya Kelas</span>
                <p className="font-display text-lg font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                  {rupiah(totalBiaya)}
                </p>
              </div>
            </div>

            {/* Metrik Ringkas Tagihan */}
            <div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-100 dark:border-slate-800 py-3 text-center">
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Metode Bayar</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm capitalize">
                  {pendaftaran.metodeBayar.replace("_", " ")}
                  {pendaftaran.tenorBulan ? ` (${pendaftaran.tenorBulan}x)` : ""}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Telah Dibayar</span>
                <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 text-sm">
                  {rupiah(totalDibayar)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Sisa Tagihan</span>
                <span className={`font-semibold tabular-nums text-sm ${sisaTagihan > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"}`}>
                  {rupiah(sisaTagihan)}
                </span>
              </div>
            </div>

            {/* Tabel Termin */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="pb-2.5">Termin</th>
                    <th className="pb-2.5 text-right">Nominal</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5">Jatuh Tempo</th>
                    <th className="pb-2.5">Dibayar Pada</th>
                    <th className="pb-2.5">Referensi</th>
                    <th className="pb-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {urutPembayaran.map((p) => {
                    const labelTermin = p.tipe === "dp" ? "DP (Uang Muka)" : p.tipe === "cicilan" ? `Cicilan #${p.cicilanKe}` : "Pelunasan";
                    const isSuccess = p.status === "berhasil";
                    const isPending = p.status === "pending";

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-100">{labelTermin}</td>
                        <td className="py-3 text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                          {rupiah(Number(p.jumlah))}
                        </td>
                        <td className="py-3 text-center">
                          <Badge tone={isSuccess ? "emerald" : isPending ? "amber" : "red"}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-3 tabular-nums text-slate-600 dark:text-slate-400">
                          {fmtTanggal(p.jatuhTempo)}
                        </td>
                        <td className="py-3 tabular-nums text-slate-600 dark:text-slate-400">
                          {p.dibayarPada ? fmtWaktu(p.dibayarPada) : "—"}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {p.referensiGateway || "—"}
                        </td>
                        <td className="py-3 text-right">
                          {isPending ? (
                            <ManualPaymentDialog
                              pembayaranId={p.id}
                              nominal={Number(p.jumlah)}
                              cicilanKe={p.cicilanKe}
                              tipe={p.tipe}
                            />
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
