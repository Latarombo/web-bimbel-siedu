import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TeacherClasses() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/teacher/classes");
  const guruId = Number(session.user.id);

  const kelas = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );

  const [mapel, jadwal, pendaftaran] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.JadwalItem.all()),
    collect(db.orm.public.Pendaftaran.all()),
  ]);
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Kelas Yang Diampu</h1>
      <p className="mt-1 text-sm text-muted">Jadwal lengkap + entry presensi per sesi.</p>

      <ul className="mt-6 grid gap-4">
        {kelas.map((k) => {
          const jadwalKelas = jadwal
            .filter((j) => j.kelasId === k.id)
            .sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai));
          const nAktif = pendaftaran.filter(
            (p) => p.kelasId === k.id && ["terdaftar", "tertunggak"].includes(p.status),
          ).length;
          return (
            <li key={k.id}>
              <Card>
                <CardPad>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{mapelById.get(k.mataPelajaranId)?.nama ?? "Kelas"}</p>
                      <p className="text-sm text-muted">
                        {k.jenjang} · {nAktif}/{k.kuotaMaksimum} siswa aktif
                      </p>
                    </div>
                    <Badge tone={k.status === "aktif" ? "emerald" : "slate"}>{k.status}</Badge>
                  </div>
                  <ul className="mt-3 grid gap-1.5 text-sm">
                    {jadwalKelas.map((j) => (
                      <li key={j.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {j.hari} · {j.jamMulai}–{j.jamSelesai}
                        </span>
                        <Link
                          href={`/teacher/classes/${k.id}/sessions/${new Date().toISOString().slice(0, 10)}/attendance`}
                          className="text-sm font-semibold text-brand underline"
                        >
                          Presensi
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardPad>
              </Card>
            </li>
          );
        })}
      </ul>
      {kelas.length === 0 ? <p className="mt-6 text-sm text-muted">Belum ada kelas yang diampu.</p> : null}
    </div>
  );
}
