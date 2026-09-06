import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
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
  const urut = [...guru].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Guru</h1>
      <p className="mt-1 text-sm text-muted">E4 — kelola akun guru.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="grid gap-3">
          {urut.map((g) => (
            <li key={g.id}>
              <Card>
                <CardPad className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{g.name}</p>
                      <p className="text-sm text-muted">{g.email}</p>
                      <p className="mt-1 text-xs text-muted">{nKelas.get(g.id) ?? 0} kelas diampu</p>
                    </div>
                    <Link href={`/admin/teachers?edit=${g.id}`} className="text-sm font-semibold text-brand underline">Edit</Link>
                  </div>
                </CardPad>
              </Card>
            </li>
          ))}
          {guru.length === 0 ? <p className="text-sm text-muted">Belum ada guru.</p> : null}
        </ul>

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
