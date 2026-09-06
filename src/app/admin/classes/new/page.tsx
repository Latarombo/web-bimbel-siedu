import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import KelasForm from "@/components/admin/kelas-form";

export const dynamic = "force-dynamic";

export default async function AdminClassesNew() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/classes/new");

  const [mapel, guru, periode] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("guru")).all()),
    collect(db.orm.public.PeriodePendaftaran.all()),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Kelas Baru</h1>
      <p className="mt-1 text-sm text-muted">E5 — tambah kelas + 1–3 sesi jadwal per minggu.</p>

      <Card className="mt-6">
        <CardPad>
          <KelasForm
            mapelOptions={mapel.map((m) => ({ id: m.id, nama: m.nama }))}
            guruOptions={guru.map((g) => ({ id: g.id, nama: g.name })).sort((a, b) => a.nama.localeCompare(b.nama))}
            periodeOptions={periode.map((p) => ({ id: p.id, nama: p.nama, status: p.status }))}
          />
        </CardPad>
      </Card>

      <div className="mt-4"><ButtonLink href="/admin/classes" variant="ghost">← Daftar kelas</ButtonLink></div>
      <p className="mt-2 text-xs text-muted">Master data mapel & guru dikelola di <Link href="/admin/subjects" className="underline">Mata Pelajaran</Link> dan <Link href="/admin/teachers" className="underline">Guru</Link>.</p>
    </div>
  );
}
