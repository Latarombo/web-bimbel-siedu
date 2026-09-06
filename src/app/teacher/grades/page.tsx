import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TeacherGrades() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/teacher/grades");
  const guruId = Number(session.user.id);

  const kelas = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );
  const kelasIds = new Set(kelas.map((k) => k.id));
  const mapel = await collect(db.orm.public.MataPelajaran.all());
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  const semuaPendaftaran = await collect(db.orm.public.Pendaftaran.all());
  const siswa = semuaPendaftaran.filter(
    (p) => kelasIds.has(p.kelasId) && ["terdaftar", "tertunggak"].includes(p.status),
  );

  const rows = await Promise.all(
    siswa.map(async (p) => {
      const [anak] = await collect(db.orm.public.Anak.where((a) => a.id.eq(p.anakId)).all());
      const nilai = await collect(
        db.orm.public.NilaiProgres.where((n) => n.pendaftaranId.eq(p.id)).all(),
      );
      const terakhir = nilai.sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
      return { p, anak, kelas: [...kelasIds].length ? [...kelas].find((k) => k.id === p.kelasId) : undefined, terakhir, jumlah: nilai.length };
    }),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Nilai & Progres</h1>
      <p className="mt-1 text-sm text-muted">Semua siswa aktif di kelas Anda. Klik untuk input/lihat detail.</p>

      <ul className="mt-6 grid gap-3">
        {rows.map(({ p, anak, kelas: k, terakhir, jumlah }) => (
          <li key={p.id}>
            <Card>
              <CardPad className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{anak?.nama ?? `Anak #${p.anakId}`}</p>
                  <p className="text-sm text-muted">
                    {k ? mapelById.get(k.mataPelajaranId)?.nama : "Kelas"} · {jumlah} entri nilai
                    {terakhir ? ` · terakhir ${terakhir.tanggal}` : " · belum ada"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {terakhir?.nilaiKuantitatif != null ? (
                    <Badge tone="brand">{Number(terakhir.nilaiKuantitatif)}</Badge>
                  ) : null}
                  <Link href={`/teacher/grades/${p.id}`} className="text-sm font-semibold text-brand underline">
                    Buka
                  </Link>
                </div>
              </CardPad>
            </Card>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className="mt-6 text-sm text-muted">Belum ada siswa aktif.</p> : null}
    </div>
  );
}
