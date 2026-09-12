import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { dalamJendela7Hari } from "@/lib/hari";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NilaiForm from "@/components/teacher/nilai-form";

export const dynamic = "force-dynamic";

export default async function GradeInputPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/teacher/grades");
  const { enrollmentId } = await params;
  const pid = Number(enrollmentId);
  if (!Number.isInteger(pid)) notFound();
  const guruId = Number(session.user.id);

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();

  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(p.kelasId))
      .where((k) => k.guruId.eq(guruId))
      .all(),
  );
  if (!kelas) notFound();

  const [anak] = await collect(db.orm.public.Anak.where((a) => a.id.eq(p.anakId)).all());
  const nilai = await collect(
    db.orm.public.NilaiProgres.where((n) => n.pendaftaranId.eq(pid))
      .orderBy((n) => n.tanggal.desc())
      .all(),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href="/teacher/grades" className="underline">← Nilai & Progres</Link>
      </p>
      <header className="mt-3">
        <h1 className="text-2xl font-bold tracking-tight">{anak?.nama ?? `Anak #${p.anakId}`}</h1>
        <p className="mt-1 text-sm text-muted">Status {p.status}</p>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Input nilai baru</h2>
        <div className="mt-3">
          <NilaiForm pendaftaranId={pid} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Riwayat ({nilai.length})</h2>
        {nilai.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Belum ada entri.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {nilai.map((n) => {
              const terkunci = !dalamJendela7Hari(n.createdAt);
              return (
                <li key={n.id}>
                  <Card>
                    <CardPad>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            {n.tanggal}
                            {n.nilaiKuantitatif != null ? ` — nilai ${Number(n.nilaiKuantitatif)}` : ""}
                          </p>
                          {n.catatanKualitatif ? (
                            <p className="mt-1 whitespace-pre-line text-sm text-muted">{n.catatanKualitatif}</p>
                          ) : null}
                        </div>
                        {terkunci ? (
                          <Badge>Kunci — koreksi via admin</Badge>
                        ) : (
                          <NilaiForm
                            pendaftaranId={pid}
                            nilaiId={n.id}
                            defaults={{
                              tanggal: n.tanggal,
                              nilai: n.nilaiKuantitatif == null ? "" : String(Number(n.nilaiKuantitatif)),
                              catatan: n.catatanKualitatif ?? "",
                            }}
                          />
                        )}
                      </div>
                    </CardPad>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
