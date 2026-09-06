import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Mata Pelajaran</h1>
      <p className="mt-1 text-sm text-muted">E2 — master data mapel.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="grid gap-3">
          {mapel.map((m) => (
            <li key={m.id}>
              <Card>
                <CardPad className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{m.nama}</p>
                      {m.deskripsi ? <p className="text-sm text-muted">{m.deskripsi}</p> : null}
                      <p className="mt-1 text-xs text-muted">{dipakai.get(m.id) ?? 0} kelas memakai mapel ini</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/subjects?edit=${m.id}`} className="text-sm font-semibold text-brand underline">Edit</Link>
                      {(dipakai.get(m.id) ?? 0) === 0 ? (
                        <form action={hapusMapel}>
                          <input type="hidden" name="mapel_id" value={m.id} />
                          <Button variant="ghost" className="text-sm text-red-600" type="submit">Hapus</Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </CardPad>
              </Card>
            </li>
          ))}
          {mapel.length === 0 ? <p className="text-sm text-muted">Belum ada mata pelajaran.</p> : null}
        </ul>

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

      <p className="mt-6 text-xs text-muted">Mapel yang masih dipakai kelas tidak bisa dihapus (dijaga DB).</p>
      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
