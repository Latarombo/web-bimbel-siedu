import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import GuruForm from "@/components/admin/guru-form";

export const dynamic = "force-dynamic";

export default async function AdminTeachers({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/teachers");
  const { edit } = await searchParams;
  const editId = Number(edit ?? 0);

  const guru = await collect(
    db.orm.public.User.where((u) => u.role.eq("guru")).all(),
  );
  const kelas = await collect(db.orm.public.Kelas.all());
  const nKelas = new Map<number, number>();
  for (const k of kelas) nKelas.set(k.guruId, (nKelas.get(k.guruId) ?? 0) + 1);
  const editing = editId > 0 ? guru.find((g) => g.id === editId) : undefined;

  const columns: TableColumn[] = [
    { key: "nama", header: "Nama" },
    { key: "email", header: "Email" },
    { key: "telepon", header: "Telepon" },
    { key: "nKelas", header: "Kelas diampu", className: "text-center" },
    { key: "aksi", header: "Aksi", className: "text-right", sortable: false },
  ];

  const rows: TableRowData[] = guru.map((g) => ({
    id: g.id,
    values: { nama: g.name, email: g.email, telepon: g.nomorTelepon ?? "", nKelas: nKelas.get(g.id) ?? 0 },
    cells: {
      nama: (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
            {g.name.trim().charAt(0).toUpperCase()}
          </span>
          <span className="font-semibold text-foreground">{g.name}</span>
        </div>
      ),
      email: <span className="text-muted">{g.email}</span>,
      telepon: <span className="text-muted tabular-nums">{g.nomorTelepon || "—"}</span>,
      nKelas: (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
            (nKelas.get(g.id) ?? 0) > 0 ? "bg-brand-soft text-brand" : "bg-slate-100 text-slate-500"
          }`}
        >
          {nKelas.get(g.id) ?? 0}
        </span>
      ),
      aksi: (
        <Link href={`/admin/teachers?edit=${g.id}`} className="text-sm font-semibold text-brand hover:underline">
          Edit
        </Link>
      ),
    },
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Guru</h1>
      <p className="mt-1 text-sm text-muted">E4 — kelola akun guru.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <DataTable columns={columns} rows={rows} empty="Belum ada guru." initialSort={{ key: "nama", dir: "asc" }} />

        <Card className="self-start">
          <CardPad>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? "Edit Guru" : "Tambah Guru"}</h2>
              {editing ? <Link href="/admin/teachers" className="text-sm text-muted underline">batal</Link> : null}
            </div>
            <div className="mt-4">
              <GuruForm
                key={editing?.id ?? "baru"}
                guruId={editing?.id}
                defaults={editing ? { nama: editing.name, email: editing.email, alamat: editing.alamat ?? "", nomorTelepon: editing.nomorTelepon ?? "" } : undefined}
              />
            </div>
          </CardPad>
        </Card>
      </div>

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
