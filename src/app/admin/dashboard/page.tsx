import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

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
  const nLunas = pembayaran.filter((b) => b.status === "berhasil").length;
  const nPending = pembayaran.filter((b) => b.status === "pending").length;
  const perluTindakan = nTunggakan + pengajuan.length + pendaftaran.filter((p) => p.status === "menunggu_pembayaran").length;

  const stats = [
    { label: "Siswa (akun orang tua)", value: nSiswa, href: null },
    { label: "Guru", value: nGuru, href: "/admin/teachers" },
    { label: "Kelas", value: kelas.length, href: "/admin/classes" },
    { label: "Pendaftaran aktif", value: nAktif, href: "/admin/enrollments/flagged" },
    { label: "Tunggakan", value: nTunggakan, href: "/admin/enrollments/flagged" },
    { label: "Pembayaran berhasil / pending", value: `${nLunas} / ${nPending}`, href: null },
    { label: "Periode dibuka", value: periode.length, href: "/admin/periods" },
    { label: "Pengajuan pembatalan menunggu", value: pengajuan.length, href: "/admin/refunds" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
      <p className="mt-1 text-sm text-muted">Ringkasan operasional lembaga.</p>

      {perluTindakan > 0 ? (
        <Card className="mt-6 border-amber-300">
          <CardPad>
            <p className="text-sm font-semibold text-amber-800">{perluTindakan} item perlu perhatian</p>
            <p className="mt-1 text-sm text-muted">
              {nTunggakan} tunggakan, {pengajuan.length} pengajuan pembatalan, pendaftaran menunggu pembayaran yang bisa kedaluwarsa.
            </p>
          </CardPad>
        </Card>
      ) : null}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Card>
              <CardPad className="p-5">
                <p className="text-2xl font-bold">{s.value}</p>
                {s.href ? (
                  <Link href={s.href} className="mt-1 block text-sm text-muted underline hover:text-foreground">{s.label}</Link>
                ) : (
                  <p className="mt-1 text-sm text-muted">{s.label}</p>
                )}
              </CardPad>
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/admin/subjects" variant="secondary">Mata Pelajaran</ButtonLink>
        <ButtonLink href="/admin/classes" variant="secondary">Kelola Kelas</ButtonLink>
        <ButtonLink href="/admin/refunds" variant="secondary">Verifikasi Refund</ButtonLink>
        <ButtonLink href="/admin/corrections" variant="secondary">Pengajuan Koreksi</ButtonLink>
      </div>
    </div>
  );
}
