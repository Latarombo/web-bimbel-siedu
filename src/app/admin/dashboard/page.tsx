import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EnrollmentTrendChart } from "@/components/admin/enrollment-trend-chart";

export const dynamic = "force-dynamic";

// Konvensi DESIGN.md: top border 4px per kategori kartu dashboard
// (blue-600 akademik, emerald-500 keuangan, amber-500 perhatian/jadwal).
type Kategori = "akademik" | "keuangan" | "perhatian";
const BORDER: Record<Kategori, string> = {
  akademik: "border-t-blue-600",
  keuangan: "border-t-emerald-500",
  perhatian: "border-t-amber-500",
};
const TILE: Record<Kategori, string> = {
  akademik: "bg-blue-50 text-blue-600",
  keuangan: "bg-emerald-50 text-emerald-600",
  perhatian: "bg-amber-50 text-amber-600",
};

// Ikon feather-style inline — nol dependency.
function Icon({ d, className }: { d: string; className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const P = {
  users:
    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  book: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  clipboard:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01",
  wallet: "M2 5h20v14H2zM2 10h20",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  inbox:
    "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
};

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/dashboard");

  const [users, kelas, pendaftaran, pembayaran, periode, pengajuan] = await Promise.all([
    collect(db.orm.public.User.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Pembayaran.all()),
    collect(db.orm.public.PeriodePendaftaran.where((p) => p.status.eq("dibuka")).all()),
    collect(db.orm.public.PengajuanPembatalan.where((p) => p.status.eq("menunggu")).all()),
  ]);

  const aktif = ["menunggu_pembayaran", "terdaftar", "tertunggak"];
  const nSiswa = users.filter((u) => u.role === "orang_tua").length;
  const nGuru = users.filter((u) => u.role === "guru").length;
  const nAktif = pendaftaran.filter((p) => aktif.includes(p.status)).length;
  const nTunggakan = pendaftaran.filter((p) => p.status === "tertunggak").length;
  const nMenungguBayar = pendaftaran.filter((p) => p.status === "menunggu_pembayaran").length;
  const nLunas = pembayaran.filter((b) => b.status === "berhasil").length;
  const nPending = pembayaran.filter((b) => b.status === "pending").length;
  const perluTindakan = nTunggakan + pengajuan.length + nMenungguBayar;

  const stats: { label: string; value: number | string; href: string | null; kategori: Kategori; icon: string }[] = [
    { label: "Siswa (akun orang tua)", value: nSiswa, href: null, kategori: "akademik", icon: P.users },
    { label: "Guru", value: nGuru, href: "/admin/teachers", kategori: "akademik", icon: P.book },
    { label: "Kelas", value: kelas.length, href: "/admin/classes", kategori: "akademik", icon: P.layers },
    { label: "Pendaftaran aktif", value: nAktif, href: "/admin/enrollments/flagged", kategori: "akademik", icon: P.clipboard },
    { label: "Tunggakan", value: nTunggakan, href: "/admin/enrollments/flagged", kategori: "perhatian", icon: P.alert },
    { label: "Pembayaran berhasil / pending", value: `${nLunas} / ${nPending}`, href: null, kategori: "keuangan", icon: P.wallet },
    { label: "Periode dibuka", value: periode.length, href: "/admin/periods", kategori: "akademik", icon: P.calendar },
    { label: "Pengajuan pembatalan menunggu", value: pengajuan.length, href: "/admin/refunds", kategori: "perhatian", icon: P.inbox },
  ];

  // Tren pendaftaran 6 bulan terakhir (dari createdAt, tanpa dependency chart).
  const now = new Date();
  const bulan: { label: string; n: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const n = pendaftaran.filter((p) => {
      const t = new Date(p.createdAt);
      return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth();
    }).length;
    bulan.push({ label: d.toLocaleString("id-ID", { month: "short" }), n });
  }
  // (max tidak lagi dipakai — skala ditangani recharts)

  const antrean: { label: string; hint: string; n: number; href: string }[] = [
    { label: "Tunggakan", hint: "Lewat tenggang 7 hari kerja", n: nTunggakan, href: "/admin/enrollments/flagged" },
    { label: "Menunggu pembayaran", hint: "Timeout 24 jam — kuota masih dikunci", n: nMenungguBayar, href: "/admin/enrollments/flagged" },
    { label: "Pengajuan pembatalan", hint: "Menunggu verifikasi admin", n: pengajuan.length, href: "/admin/refunds" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* HEADER + aksi cepat */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-muted">Ringkasan operasional lembaga.</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/admin/classes" variant="outline">Kelola Kelas</ButtonLink>
          <ButtonLink href="/admin/subjects" variant="outline">Mata Pelajaran</ButtonLink>
        </div>
      </div>

      {/* BANNER perlu perhatian — actionable, bukan sekadar teks */}
      {perluTindakan > 0 ? (
        <Card className="mt-6 border-amber-300 bg-amber-50">
          <CardPad className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Icon d={P.alert} className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">{perluTindakan} item perlu perhatian</p>
                <p className="mt-0.5 text-sm text-amber-800/80">
                  {nTunggakan} tunggakan · {nMenungguBayar} menunggu pembayaran (bisa kedaluwarsa 24 jam) · {pengajuan.length} pengajuan pembatalan
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <Link href="/admin/enrollments/flagged" className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600">Review pendaftaran</Link>
              <Link href="/admin/refunds" className="rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100">Verifikasi refund</Link>
            </div>
          </CardPad>
        </Card>
      ) : null}

      {/* STAT CARDS — angka besar + ikon tile per kategori */}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Card className={`${BORDER[s.kategori]} border-t-4 transition-shadow hover:shadow-md`}>
              <CardPad className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${TILE[s.kategori]}`}>
                    <Icon d={s.icon} className="w-4.5 h-4.5" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{s.value}</p>
                {s.href ? (
                  <Link href={s.href} className="mt-1 block text-sm text-muted hover:text-foreground hover:underline">{s.label}</Link>
                ) : (
                  <p className="mt-1 text-sm text-muted">{s.label}</p>
                )}
              </CardPad>
            </Card>
          </li>
        ))}
      </ul>

      {/* TREN + ANTREAN */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardPad className="p-6">
            <h2 className="font-semibold text-foreground">Tren pendaftaran</h2>
            <p className="text-xs text-muted">6 bulan terakhir, semua status.</p>
            <div className="mt-4">
              <EnrollmentTrendChart data={bulan.map((b) => ({ label: b.label, n: b.n }))} />
            </div>
          </CardPad>
        </Card>

        <Card className="lg:col-span-2">
          <CardPad className="p-6">
            <h2 className="font-semibold text-foreground">Antrean kerja</h2>
            <p className="text-xs text-muted">Item yang menunggu tindakan admin.</p>
            {antrean.every((a) => a.n === 0) ? (
              <p className="mt-6 rounded-2xl border border-border bg-background px-4 py-6 text-center text-sm text-muted">
                Semua aman — tidak ada item menunggu.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {antrean.map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${a.n > 0 ? "border-border bg-background hover:border-foreground/30 hover:shadow-sm" : "border-border/60 opacity-50"}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{a.label}</p>
                      <p className="text-xs text-muted">{a.hint}</p>
                    </div>
                    <span className={`text-sm font-bold rounded-full px-2.5 py-1 tabular-nums ${a.n > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>{a.n}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardPad>
        </Card>
      </div>
    </div>
  );
}
