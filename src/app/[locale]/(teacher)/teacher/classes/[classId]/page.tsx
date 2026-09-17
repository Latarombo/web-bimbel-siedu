import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TeacherClassDetail({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/teacher/classes");
  const { classId } = await params;
  const kid = Number(classId);
  if (!Number.isInteger(kid)) notFound();
  const guruId = Number(session.user.id);

  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(kid))
      .where((k) => k.guruId.eq(guruId))
      .all(),
  );
  if (!kelas) notFound();

  const [mapel, jadwal, pendaftaran] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kid)).all()),
    collect(
      db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kid))
        .where((p) => p.status.in(["terdaftar", "tertunggak"]))
        .all(),
    ),
  ]);
  const m = mapel.find((x) => x.id === kelas.mataPelajaranId);

  const siswa = await Promise.all(
    pendaftaran.map(async (p) => {
      const [a] = await collect(db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all());
      return { pendaftaran: p, anak: a };
    }),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href="/teacher/classes" className="underline">← Kelas</Link>
      </p>
      <header className="mt-3">
        <h1 className="text-2xl font-bold tracking-tight">{m?.nama ?? "Kelas"} — {kelas.jenjang}</h1>
        <p className="mt-1 text-sm text-muted">
          {kelas.status} · {siswa.length}/{kelas.kuotaMaksimum} siswa
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Jadwal sesi</h2>
        <ul className="mt-3 grid gap-2">
          {jadwal.map((j) => (
            <li key={j.id}>
              <Card>
                <CardPad className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="text-sm font-medium">
                    {j.hari} · {j.jamMulai}–{j.jamSelesai}
                  </span>
                  <Link
                    href={`/teacher/classes/${kid}/sessions/${new Date().toISOString().slice(0, 10)}/attendance`}
                    className="text-sm font-semibold text-brand underline"
                  >
                    Presensi sesi ini
                  </Link>
                </CardPad>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Siswa aktif</h2>
        {siswa.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Belum ada siswa terdaftar.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {siswa.map(({ pendaftaran: p, anak: a }) => (
              <li key={p.id}>
                <Card>
                  <CardPad className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="text-sm font-semibold">{a?.nama ?? `Anak #${p.anakId}`}</p>
                      <p className="text-xs text-muted">status {p.status}</p>
                    </div>
                    <Link href={`/teacher/grades/${p.id}`} className="text-sm font-semibold text-brand underline">
                      Nilai & progres
                    </Link>
                  </CardPad>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
