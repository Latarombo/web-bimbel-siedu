import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import MapelForm from "@/components/admin/mapel-form";
import { hapusMapel } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubjects({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/subjects");
  const { edit } = await searchParams;
  const editId = Number(edit ?? 0);

  const mapel = await collect(db.orm.public.MataPelajaran.all());
  const kelas = await collect(db.orm.public.Kelas.all());
  const dipakai = new Map<number, number>();
  for (const k of kelas) dipakai.set(k.mataPelajaranId, (dipakai.get(k.mataPelajaranId) ?? 0) + 1);
  const editing = editId > 0 ? mapel.find((m) => m.id === editId) : undefined;

  const columns: TableColumn[] = [
    { key: "nama", header: "Nama" },
    { key: "nKelas", header: "Kelas memakai", className: "text-center" },
    { key: "aksi", header: "Aksi", className: "text-right", sortable: false },
  ];

  const rows: TableRowData[] = mapel.map((m) => ({
    id: m.id,
    values: { nama: m.nama, nKelas: dipakai.get(m.id) ?? 0 },
    cells: {
      nama: (
        <div>
          <p className="font-semibold text-foreground">{m.nama}</p>
          {m.deskripsi ? <p className="text-xs text-muted">{m.deskripsi}</p> : null}
        </div>
      ),
      nKelas: <span className="tabular-nums">{dipakai.get(m.id) ?? 0}</span>,
      aksi: (
        <div className="flex items-center justify-end gap-3">
          <Link href={`/admin/subjects?edit=${m.id}`} className="text-sm font-semibold text-brand hover:underline">
            Edit
          </Link>
          {(dipakai.get(m.id) ?? 0) === 0 ? (
            <form action={hapusMapel}>
              <input type="hidden" name="mapel_id" value={m.id} />
              <Button variant="destructive" size="sm" type="submit">
                Hapus
              </Button>
            </form>
          ) : (
            <span className="text-xs text-muted" title="Mapel yang masih dipakai kelas tidak bisa dihapus (dijaga DB)">
              terpakai
            </span>
          )}
        </div>
      ),
    },
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Mata Pelajaran</h1>
      <p className="mt-1 text-sm text-muted">E2 — master data mapel.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <DataTable columns={columns} rows={rows} empty="Belum ada mata pelajaran." initialSort={{ key: "nama", dir: "asc" }} />

        <Card className="self-start">
          <CardPad>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? "Edit Mapel" : "Tambah Mapel"}</h2>
              {editing ? <Link href="/admin/subjects" className="text-sm text-muted underline">batal</Link> : null}
            </div>
            <div className="mt-4">
              <MapelForm key={editing?.id ?? "baru"} mapelId={editing?.id} defaults={editing ? { nama: editing.nama, deskripsi: editing.deskripsi ?? "" } : undefined} />
            </div>
          </CardPad>
        </Card>
      </div>

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
