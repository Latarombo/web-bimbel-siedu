import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

// C7 — Schedule & Attendance (tab gabungan via ?tab=, pola shadcn Tabs server-side).
// Jadwal: JadwalItem kelas yang diikuti anak (pendaftaran aktif), dikelompokkan per hari.
// Presensi: rows Presensi pendaftaran milik anak.

function PresensiBadge({ status }: { status: string }) {
  const tone =
    status === "hadir" ? "emerald" : status === "izin" || status === "sakit" ? "amber" : status === "alpa" ? "red" : "slate";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge tone={tone}>{label}</Badge>;
}

const URUTAN_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;

function jamPendek(t: string) {
  return t.slice(0, 5);
}

export default async function ScheduleAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/schedule-attendance");
  const ortuId = Number(session.user.id);
  const { tab } = await searchParams;
  const tabAktif = tab === "presensi" ? "presensi" : "jadwal";

  const anak = await collect(db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all());
  const anakIds = new Set(anak.map((a) => a.id));
  const namaAnak = new Map(anak.map((a) => [a.id, a.nama]));

  const pendaftaran = await collect(
    db.orm.public.Pendaftaran
      .include("kelas", (b) => b.select("id", "mataPelajaranId", "guruId"))
      .all(),
  );
  const milikSaya = pendaftaran.filter(
    (p) => anakIds.has(p.anakId) && ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status),
  );

  // Nama mapel + guru per kelas.
  const mapelIds = [...new Set(milikSaya.map((p) => p.kelas.mataPelajaranId))];
  const guruIds = [...new Set(milikSaya.map((p) => p.kelas.guruId))];
  const [mapelRows, guruRows] = await Promise.all([
    Promise.all(
      mapelIds.map(async (mid) =>
        collect(db.orm.public.MataPelajaran.where((m) => m.id.eq(mid)).all()),
      ),
    ),
    Promise.all(
      guruIds.map(async (gid) =>
        collect(db.orm.public.User.where((u) => u.id.eq(gid)).all()),
      ),
    ),
  ]);
  const mapel = new Map(mapelRows.flat().map((m) => [m.id, m.nama]));
  const guru = new Map(guruRows.flat().map((g) => [g.id, g.name]));

  // Jadwal per kelas yang diikuti.
  const jadwalRows = (
    await Promise.all(
      milikSaya.map((p) =>
        collect(
          db.orm.public.JadwalItem.where((j) => j.kelasId.eq(p.kelasId)).all(),
        ).then((items) => items.map((j) => ({ j, p }))),
      ),
    )
  ).flat();
  jadwalRows.sort(
    (x, y) =>
      URUTAN_HARI.indexOf(x.j.hari as (typeof URUTAN_HARI)[number]) -
        URUTAN_HARI.indexOf(y.j.hari as (typeof URUTAN_HARI)[number]) ||
      x.j.jamMulai.localeCompare(y.j.jamMulai),
  );

  // Presensi pendaftaran milik saya.
  const presensi = (
    await Promise.all(
      milikSaya.map((p) =>
        collect(
          db.orm.public.Presensi.where((s) => s.pendaftaranId.eq(p.id))
            .orderBy((s) => s.tanggalPertemuan.desc())
            .all(),
        ).then((rows) => rows.map((s) => ({ s, p }))),
      ),
    )
  ).flat();
  const rekap = presensi.reduce<Record<string, number>>((acc, { s }) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Schedule &amp; Attendance</h1>
        <p className="mt-1 text-sm text-muted">
          Jadwal kelas yang diikuti anak dan riwayat kehadiran.
        </p>
      </header>

      {/* Filter tabs */}
      <nav aria-label="Tab jadwal" className="inline-flex rounded-full bg-slate-100 p-1">
        {[
          ["jadwal", `Jadwal (${jadwalRows.length})`],
          ["presensi", `Presensi (${presensi.length})`],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`/schedule-attendance?tab=${key}`}
            aria-current={tabAktif === key ? "page" : undefined}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tabAktif === key ? "bg-white text-brand shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tabAktif === "jadwal" ? (
        jadwalRows.length === 0 ? (
          <Card className="mt-4">
            <CardPad className="py-12 text-center">
              <p className="text-base font-semibold">Belum ada jadwal</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Jadwal muncul setelah anak terdaftar di kelas aktif. Ajukan pendaftaran dulu.
              </p>
            </CardPad>
          </Card>
        ) : (
          <ul className="mt-4 grid gap-3">
            {jadwalRows.map(({ j, p }) => (
              <li key={`${j.id}-${p.id}`}>
                <Card className="border-l-4 border-l-amber-500">
                  <CardPad className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {mapel.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}`} —{" "}
                        {namaAnak.get(p.anakId) ?? "Anak"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {j.hari}, {jamPendek(j.jamMulai)}–{jamPendek(j.jamSelesai)} · Guru{" "}
                        {guru.get(p.kelas.guruId) ?? "-"}
                      </p>
                    </div>
                    <Badge tone="slate">{p.jenjangSaatDaftar}</Badge>
                  </CardPad>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : presensi.length === 0 ? (
        <Card className="mt-4">
          <CardPad className="py-12 text-center">
            <p className="text-base font-semibold">Belum ada catatan presensi</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Presensi diinput guru di setiap pertemuan. Catatan akan tampil di sini.
            </p>
          </CardPad>
        </Card>
      ) : (
        <>
          {/* Rekap — pola Dashboard Card, top border biru (akademik). */}
          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["hadir", "izin", "sakit", "alpa"] as const).map((s) => (
              <Card
                key={s}
                className={`border-t-4 ${
                  s === "hadir"
                    ? "border-t-emerald-500"
                    : s === "alpa"
                      ? "border-t-rose-500"
                      : "border-t-amber-500"
                }`}
              >
                <CardPad className="py-4">
                  <p className="text-xs font-semibold uppercase text-muted">{s}</p>
                  <p className="mt-0.5 text-2xl font-bold">{rekap[s] ?? 0}</p>
                </CardPad>
              </Card>
            ))}
          </section>
          <ul className="mt-4 grid gap-3">
            {presensi.map(({ s, p }) => (
              <li key={s.id}>
                <Card>
                  <CardPad className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {new Date(s.tanggalPertemuan).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="text-xs text-muted">
                        {mapel.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}`} —{" "}
                        {namaAnak.get(p.anakId) ?? "Anak"}
                      </p>
                    </div>
                    <PresensiBadge status={s.status} />
                  </CardPad>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
