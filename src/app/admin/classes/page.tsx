import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminClasses({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/classes");
  const { status } = await searchParams;
  const filter = status === "dibatalkan" ? "dibatalkan" : status === "aktif" ? "aktif" : "semua";

  const [kelasSemua, mapel, guru, jadwal, pendaftaran] = await Promise.all([
    filter === "semua"
      ? collect(db.orm.public.Kelas.all())
      : collect(db.orm.public.Kelas.where((k) => k.status.eq(filter)).all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("guru")).all()),
    collect(db.orm.public.JadwalItem.all()),
    collect(db.orm.public.Pendaftaran.all()),
  ]);
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const guruById = new Map(guru.map((g) => [g.id, g]));
  const urut = [...kelasSemua].sort((a, b) => a.id - b.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelas</h1>
          <p className="mt-1 text-sm text-muted">E5 — kelola kelas + jadwal, validasi BR#6 bentrok.</p>
        </div>
        <ButtonLink href="/admin/classes/new">+ Kelas baru</ButtonLink>
      </div>

      <div className="mt-4 flex gap-2 text-sm">
        {["semua", "aktif", "dibatalkan"].map((s) => (
          <Link
            key={s}
            href={s === "semua" ? "/admin/classes" : `/admin/classes?status=${s}`}
            className={`rounded-full border px-3 py-1 ${filter === s ? "border-brand bg-blue-50 font-semibold text-brand" : "border-border text-muted"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <ul className="mt-6 grid gap-4">
        {urut.map((k) => {
          const jadwalKelas = jadwal
            .filter((j) => j.kelasId === k.id)
            .sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai));
          const nAktif = pendaftaran.filter((p) => p.kelasId === k.id && ["terdaftar", "tertunggak", "menunggu_pembayaran"].includes(p.status)).length;
          return (
            <li key={k.id}>
              <Card>
                <CardPad>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{mapelById.get(k.mataPelajaranId)?.nama ?? "Kelas"}</p>
                      <p className="text-sm text-muted">
                        {k.jenjang} · {guruById.get(k.guruId)?.name ?? "—"} · {nAktif}/{k.kuotaMaksimum} siswa (min {k.kuotaMinimum})
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {jadwalKelas.map((j) => `${j.hari} ${j.jamMulai.slice(0, 5)}–${j.jamSelesai.slice(0, 5)}`).join(" · ") || "tanpa jadwal"}
                      </p>
                      <p className="mt-1 text-sm">
                        Rp{Number(k.biayaPeriode).toLocaleString("id-ID")}
                        {k.biayaDp ? ` · DP Rp${Number(k.biayaDp).toLocaleString("id-ID")} (tenor ≤ ${k.tenorMaksimum})` : " · tanpa cicilan"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={k.status === "aktif" ? "emerald" : "slate"}>{k.status}</Badge>
                      <Link href={`/admin/classes/${k.id}/edit`} className="text-sm font-semibold text-brand underline">Edit</Link>
                    </div>
                  </div>
                </CardPad>
              </Card>
            </li>
          );
        })}
      </ul>
      {urut.length === 0 ? <p className="mt-6 text-sm text-muted">Tidak ada kelas.</p> : null}

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
