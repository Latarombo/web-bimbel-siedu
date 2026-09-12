import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
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

  const columns: TableColumn[] = [
    { key: "nama", header: "Nama" },
    { key: "status", header: "Status" },
    { key: "tanggalMulai", header: "Berlangsung" },
    { key: "nKelas", header: "Kelas", className: "text-center" },
    { key: "aksi", header: "Aksi", className: "text-right", sortable: false },
  ];

  const rows: TableRowData[] = [...periode]
    .sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai))
    .map((p) => ({
      id: p.id,
      values: { nama: p.nama, status: p.status, tanggalMulai: p.tanggalMulai, nKelas: nKelas.get(p.id) ?? 0 },
      cells: {
        nama: <span className="font-semibold text-foreground">{p.nama}</span>,
        status: <Badge tone={p.status === "dibuka" ? "emerald" : p.status === "ditutup" ? "amber" : "slate"}>{p.status}</Badge>,
        tanggalMulai: (
          <span className="tabular-nums text-muted">
            {p.tanggalMulai} s/d {p.tanggalSelesai}
            <span className="block text-xs">tutup daftar {p.tanggalTutupPendaftaran}</span>
          </span>
        ),
        nKelas: <span className="tabular-nums">{nKelas.get(p.id) ?? 0}</span>,
        aksi: (
          <Link href={`/admin/periods?edit=${p.id}`} className="text-sm font-semibold text-brand hover:underline">
            Edit
          </Link>
        ),
      },
    }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Periode Pendaftaran</h1>
      <p className="mt-1 text-sm text-muted">E3 — buka/tutup periode pendaftaran.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <DataTable columns={columns} rows={rows} empty="Belum ada periode." initialSort={{ key: "tanggalMulai", dir: "desc" }} />

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
