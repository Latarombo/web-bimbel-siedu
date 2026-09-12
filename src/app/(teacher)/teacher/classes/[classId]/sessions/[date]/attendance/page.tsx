import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { hariDariTanggal, dalamJendela7Hari } from "@/lib/hari";
import { Card, CardPad } from "@/components/ui/card";
import PresensiForm from "@/components/teacher/presensi-form";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ classId: string; date: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/teacher/classes");
  const { classId, date } = await params;
  const kid = Number(classId);
  if (!Number.isInteger(kid) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const guruId = Number(session.user.id);

  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(kid))
      .where((k) => k.guruId.eq(guruId))
      .all(),
  );
  if (!kelas) notFound();

  const jadwal = await collect(
    db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kid)).all(),
  );
  const hari = hariDariTanggal(date);
  const item = jadwal.find((j) => j.hari === hari);
  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardPad>
            <p className="text-sm text-muted">
              Tanggal {date} bukan hari mengajar kelas ini (jadwal: {jadwal.map((j) => j.hari).join(", ") || "-"}).
            </p>
            <Link href={`/teacher/classes/${kid}`} className="mt-3 inline-block text-sm font-semibold text-brand underline">
              ← Kembali ke kelas
            </Link>
          </CardPad>
        </Card>
      </div>
    );
  }

  const [siswa, existing] = await Promise.all([
    collect(
      db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kid))
        .where((p) => p.status.in(["terdaftar", "tertunggak"]))
        .all(),
    ),
    collect(
      db.orm.public.Presensi.where((x) => x.jadwalItemId.eq(item.id))
        .where((x) => x.tanggalPertemuan.eq(date))
        .all(),
    ),
  ]);

  const existingMap = new Map(existing.map((e) => [e.pendaftaranId, e]));
  const anakList = await Promise.all(
    siswa.map(async (s) => {
      const [a] = await collect(db.orm.public.Anak.where((x) => x.id.eq(s.anakId)).all());
      const lama = existingMap.get(s.id);
      return {
        pendaftaranId: s.id,
        nama: a?.nama ?? `Anak #${s.anakId}`,
        status: lama?.status,
        catatan: lama?.catatan ?? "",
        terkunci: lama ? !dalamJendela7Hari(lama.createdAt) : false,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href={`/teacher/classes/${kid}`} className="underline">← Kelas</Link>
      </p>
      <header className="mt-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Presensi {hari}, {date}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {item.jamMulai}–{item.jamSelesai} · {siswa.length} siswa
        </p>
      </header>

      <div className="mt-6">
        <PresensiForm kelasId={kid} jadwalItemId={item.id} tanggal={date} siswa={anakList} />
      </div>
    </div>
  );
}
