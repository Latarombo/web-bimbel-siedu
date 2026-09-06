import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import KelasForm from "@/components/admin/kelas-form";

export const dynamic = "force-dynamic";

export default async function AdminClassesEdit({ params }: { params: Promise<{ classId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/classes");
  const { classId } = await params;
  const kelasId = Number(classId);
  if (!Number.isInteger(kelasId)) notFound();

  const [kelasSemua, mapel, guru, periode, jadwal] = await Promise.all([
    collect(db.orm.public.Kelas.where((k) => k.id.eq(kelasId)).all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("guru")).all()),
    collect(db.orm.public.PeriodePendaftaran.all()),
    collect(db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kelasId)).all()),
  ]);
  const kelas = kelasSemua[0];
  if (!kelas) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Edit Kelas</h1>
      <p className="mt-1 text-sm text-muted">Simpan ulang semua sesi jadwal; baris kosong dihapus.</p>

      <Card className="mt-6">
        <CardPad>
          <KelasForm
            kelasId={kelas.id}
            mapelOptions={mapel.map((m) => ({ id: m.id, nama: m.nama }))}
            guruOptions={guru.map((g) => ({ id: g.id, nama: g.name })).sort((a, b) => a.nama.localeCompare(b.nama))}
            periodeOptions={periode.map((p) => ({ id: p.id, nama: p.nama, status: p.status }))}
            defaults={{
              mataPelajaranId: kelas.mataPelajaranId,
              guruId: kelas.guruId,
              periodeId: kelas.periodeId,
              jenjang: kelas.jenjang,
              kuotaMaksimum: kelas.kuotaMaksimum,
              kuotaMinimum: kelas.kuotaMinimum,
              biayaPeriode: String(kelas.biayaPeriode),
              biayaDp: kelas.biayaDp ? String(kelas.biayaDp) : "",
              tenorMaksimum: kelas.tenorMaksimum ? String(kelas.tenorMaksimum) : "",
              status: kelas.status,
            }}
            defaultJadwal={jadwal
              .sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai))
              .map((j) => ({ hari: j.hari, jamMulai: j.jamMulai.slice(0, 5), jamSelesai: j.jamSelesai.slice(0, 5) }))}
          />
        </CardPad>
      </Card>

      <div className="mt-4"><ButtonLink href="/admin/classes" variant="ghost">← Daftar kelas</ButtonLink></div>
    </div>
  );
}
