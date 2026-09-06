import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { rupiah } from "@/lib/placeholder";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/children");
  const ortuId = Number(session.user.id);

  const collect = async <T,>(src: AsyncIterable<T>) => {
    const out: T[] = [];
    for await (const r of src) out.push(r);
    return out;
  };

  // Anak + jumlah pendaftaran aktif per anak (untuk keterangan lock read-only).
  const anak = await collect(
    db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all(),
  );

  const aktifPerAnak = await Promise.all(
    anak.map(async (a) => {
      const rows = await collect(
        db.orm.public.Pendaftaran.where((p) => p.anakId.eq(a.id)).all(),
      );
      const aktif = rows.filter((p) =>
        ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status),
      );
      return [a.id, aktif.length] as const;
    }),
  );
  const aktifMap = new Map(aktifPerAnak);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profil Anak</h1>
          <p className="mt-1 text-sm text-muted">Kelola data anak sebelum mendaftar kelas.</p>
        </div>
        <ButtonLink href="/children/new">+ Tambah Anak</ButtonLink>
      </header>

      {anak.length === 0 ? (
        <Card>
          <CardPad className="text-center">
            <p className="text-sm text-muted">Belum ada profil anak.</p>
            <ButtonLink href="/children/new" className="mt-4">
              Tambah anak pertama
            </ButtonLink>
          </CardPad>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {anak.map((a) => {
            const nAktif = aktifMap.get(a.id) ?? 0;
            return (
              <li key={a.id}>
                <Card>
                  <CardPad>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{a.nama}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {a.jenjangTerakhir ?? "Jenjang belum diisi"} · lahir {a.tanggalLahir}
                        </p>
                      </div>
                      {nAktif > 0 ? <Badge tone="brand">{nAktif} pendaftaran aktif</Badge> : null}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <ButtonLink href={`/children/${a.id}/edit`} variant="secondary">
                        Edit
                      </ButtonLink>
                      <ButtonLink href={`/classes?jenjang=${a.jenjangTerakhir ?? ""}`}>
                        Lihat kelas
                      </ButtonLink>
                    </div>
                  </CardPad>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
