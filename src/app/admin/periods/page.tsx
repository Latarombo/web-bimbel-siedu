import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import PeriodeForm from "@/components/admin/periode-form";

export const dynamic = "force-dynamic";

export default async function AdminPeriods({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/periods");
  const { edit } = await searchParams;
  const editId = Number(edit ?? 0);

  const periode = await collect(db.orm.public.PeriodePendaftaran.all());
  const kelas = await collect(db.orm.public.Kelas.all());
  const nKelas = new Map<number, number>();
  for (const k of kelas) nKelas.set(k.periodeId, (nKelas.get(k.periodeId) ?? 0) + 1);
  const editing = editId > 0 ? periode.find((p) => p.id === editId) : undefined;

  const urut = [...periode].sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Periode Pendaftaran</h1>
      <p className="mt-1 text-sm text-muted">E3 — buka/tutup periode pendaftaran.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="grid gap-3">
          {urut.map((p) => (
            <li key={p.id}>
              <Card>
                <CardPad className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{p.nama}</p>
                      <p className="text-sm text-muted">
                        {p.tanggalMulai} s/d {p.tanggalSelesai} · tutup daftar {p.tanggalTutupPendaftaran}
                      </p>
                      <p className="mt-1 text-xs text-muted">{nKelas.get(p.id) ?? 0} kelas</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={p.status === "dibuka" ? "emerald" : p.status === "ditutup" ? "amber" : "slate"}>{p.status}</Badge>
                      <Link href={`/admin/periods?edit=${p.id}`} className="text-sm font-semibold text-brand underline">Edit</Link>
                    </div>
                  </div>
                </CardPad>
              </Card>
            </li>
          ))}
          {periode.length === 0 ? <p className="text-sm text-muted">Belum ada periode.</p> : null}
        </ul>

        <Card className="self-start">
          <CardPad>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? "Edit Periode" : "Tambah Periode"}</h2>
              {editing ? <Link href="/admin/periods" className="text-sm text-muted underline">batal</Link> : null}
            </div>
            <div className="mt-4">
              <PeriodeForm
                key={editing?.id ?? "baru"}
                periodeId={editing?.id}
                defaults={editing ? { nama: editing.nama, tanggalMulai: editing.tanggalMulai, tanggalSelesai: editing.tanggalSelesai, tanggalTutupPendaftaran: editing.tanggalTutupPendaftaran, status: editing.status } : undefined}
              />
            </div>
          </CardPad>
        </Card>
      </div>

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
