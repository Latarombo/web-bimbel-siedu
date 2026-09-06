import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, STATUS_AKTIF, type StatusPendaftaran } from "@/components/status-badge";
import { rupiah } from "@/lib/placeholder";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParentHome() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/home");

  const ortuId = Number(session.user.id);

  const collect = async <T,>(src: AsyncIterable<T>) => {
    const out: T[] = [];
    for await (const r of src) out.push(r);
    return out;
  };

  const [anak, pendaftaran] = await Promise.all([
    collect(db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all()),
    collect(db.orm.public.Pendaftaran.all()),
  ]);
  const anakIds = new Set(anak.map((a) => a.id));
  const milikSaya = pendaftaran.filter((p) => anakIds.has(p.anakId));

  const anakById = new Map(anak.map((a) => [a.id, a]));

  // Tagihan pending per pendaftaran (untuk CTA "Bayar Sekarang")
  const tagihan = await Promise.all(
    pendaftaran.map(async (p) => {
      const rows = await collect(
        db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(p.id))
          .where((b) => b.status.eq("pending"))
          .all(),
      );
      return [p.id, rows] as const;
    }),
  );
  const tagihanByPendaftaran = new Map(tagihan);

  const aktif = pendaftaran.filter((p) => STATUS_AKTIF.includes(p.status as StatusPendaftaran));
  const jumlahAnak = anak.length;
  const totalTagihan = [...tagihanByPendaftaran.values()]
    .flat()
    .reduce((acc, t) => acc + Number(t.jumlah), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Orang Tua</h1>
          <p className="mt-1 text-sm text-muted">
            Halo, {session.user.name ?? "Orang Tua"} — {jumlahAnak} anak terdaftar.
          </p>
        </div>
        <ButtonLink href="/children/new" variant="secondary">
          + Tambah Anak
        </ButtonLink>
      </header>

      {/* Ringkasan */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">Anak</p>
            <p className="mt-1 text-3xl font-bold">{jumlahAnak}</p>
          </CardPad>
        </Card>
        <Card>
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">Pendaftaran aktif</p>
            <p className="mt-1 text-3xl font-bold">{aktif.length}</p>
          </CardPad>
        </Card>
        <Card>
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">Tagihan pending</p>
            <p className="mt-1 text-3xl font-bold">{rupiah(totalTagihan)}</p>
          </CardPad>
        </Card>
      </section>

      {/* Daftar pendaftaran per anak */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Status pendaftaran</h2>
        {milikSaya.length === 0 ? (
          <Card className="mt-4">
            <CardPad className="text-center">
              <p className="text-sm text-muted">Belum ada pendaftaran. Pilih kelas dulu.</p>
              <ButtonLink href="/classes" className="mt-4">
                Lihat kelas
              </ButtonLink>
            </CardPad>
          </Card>
        ) : (
          <ul className="mt-4 grid gap-4">
            {milikSaya.map((p) => {
              const a = anakById.get(p.anakId);
              const bills = tagihanByPendaftaran.get(p.id) ?? [];
              const nextBill = bills[0];
              return (
                <li key={p.id}>
                  <Card>
                    <CardPad className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {a?.nama ?? "Anak"} — Kelas #{p.kelasId}
                        </p>
                        <p className="text-sm text-muted">
                          {nextBill
                            ? `Tagihan ${nextBill.tipe} ${rupiah(Number(nextBill.jumlah))}`
                            : "Tidak ada tagihan pending"}
                        </p>
                        <StatusBadge status={p.status as StatusPendaftaran} />
                      </div>
                      <div className="flex gap-2">
                        {nextBill ? (
                          <ButtonLink href={`/enrollments/${p.id}/pay`}>Bayar Sekarang</ButtonLink>
                        ) : null}
                        <ButtonLink href={`/enrollments/${p.id}`} variant="secondary">
                          Detail
                        </ButtonLink>
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
