import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hariIni } from "@/lib/hari";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/teacher/dashboard");
  const guruId = Number(session.user.id);

  const kelas = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );
  const kelasIds = kelas.map((k) => k.id);

  const [mapel, jadwalHariIni, pendaftaran] = await Promise.all([
    kelas.length
      ? collect(db.orm.public.MataPelajaran.all())
      : Promise.resolve([]),
    collect(db.orm.public.JadwalItem.all()),
    kelas.length
      ? collect(db.orm.public.Pendaftaran.all())
      : Promise.resolve([]),
  ]);
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  const hari = hariIni();
  const sesiHariIni = jadwalHariIni
    .filter((j) => kelasIds.includes(j.kelasId) && j.hari === hari)
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

  const siswaPerKelas = new Map<number, number>();
  for (const p of pendaftaran) {
    if (p.kelasId !== undefined && kelasIds.includes(p.kelasId) && ["terdaftar", "tertunggak"].includes(p.status)) {
      siswaPerKelas.set(p.kelasId, (siswaPerKelas.get(p.kelasId) ?? 0) + 1);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Guru</h1>
        <p className="mt-1 text-sm text-muted">
          Halo, {session.user.name}. Hari {hari} {sesiHariIni.length > 0 ? `ada ${sesiHariIni.length} sesi mengajar.` : "tidak ada sesi mengajar."}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">Kelas diampu</p>
            <p className="mt-1 text-3xl font-bold">{kelas.length}</p>
          </CardPad>
        </Card>
        <Card>
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">Sesi hari ini</p>
            <p className="mt-1 text-3xl font-bold">{sesiHariIni.length}</p>
          </CardPad>
        </Card>
        <Card>
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">Total siswa aktif</p>
            <p className="mt-1 text-3xl font-bold">
              {[...siswaPerKelas.values()].reduce((a, b) => a + b, 0)}
            </p>
          </CardPad>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Jadwal mengajar hari ini</h2>
        {sesiHariIni.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Tidak ada sesi. Nikmati harinya.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {sesiHariIni.map((j) => {
              const k = kelas.find((x) => x.id === j.kelasId);
              const m = k ? mapelById.get(k.mataPelajaranId) : undefined;
              return (
                <li key={j.id}>
                  <Card>
                    <CardPad className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {m?.nama ?? "Kelas"} — {k?.jenjang}
                        </p>
                        <p className="text-sm text-muted">
                          {j.jamMulai}–{j.jamSelesai} · {siswaPerKelas.get(j.kelasId) ?? 0} siswa
                        </p>
                      </div>
                      <Link
                        href={`/teacher/classes/${j.kelasId}/sessions/${new Date().toISOString().slice(0, 10)}/attendance`}
                        className="text-sm font-semibold text-brand underline"
                      >
                        Isi presensi
                      </Link>
                    </CardPad>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Semua kelas</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {kelas.map((k) => (
            <li key={k.id}>
              <Card>
                <CardPad>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{mapelById.get(k.mataPelajaranId)?.nama ?? "Kelas"}</p>
                      <p className="text-sm text-muted">
                        {k.jenjang} · {siswaPerKelas.get(k.id) ?? 0}/{k.kuotaMaksimum} siswa
                      </p>
                    </div>
                    <Badge tone={k.status === "aktif" ? "emerald" : "slate"}>{k.status}</Badge>
                  </div>
                  <Link href={`/teacher/classes/${k.id}`} className="mt-3 inline-block text-sm font-semibold text-brand underline">
                    Kelola kelas
                  </Link>
                </CardPad>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
