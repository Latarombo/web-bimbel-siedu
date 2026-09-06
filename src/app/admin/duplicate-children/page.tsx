import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// E8 — BR#16: deteksi anak duplikat lintas akun.
// Match: nama dinormalisasi (lowercase + spasi rapi) DAN tanggal lahir sama persis.
// Ditandai kandidat untuk ditinjau manual — TIDAK diblokir otomatis.
function normNama(nama: string): string {
  return nama.trim().toLowerCase().replaceAll(/\s+/g, " ");
}

export default async function AdminDuplicateChildren() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/duplicate-children");

  const [anak, users] = await Promise.all([
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.User.all()),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));

  const grup = new Map<string, typeof anak>();
  for (const a of anak) {
    const key = `${normNama(a.nama)}|${a.tanggalLahir}`;
    const arr = grup.get(key) ?? [];
    arr.push(a);
    grup.set(key, arr);
  }
  const duplikat = [...grup.values()].filter((g) => g.length > 1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Review Anak Duplikat</h1>
      <p className="mt-1 text-sm text-muted">
        E8 — kandidat duplikat (nama sama setelah dinormalisasi + tanggal lahir sama) lintas akun orang tua. Ditinjau manual, tidak diblokir otomatis (BR#16).
      </p>

      <ul className="mt-6 grid gap-4">
        {duplikat.map((g, i) => (
          <li key={i}>
            <Card className="border-amber-300">
              <CardPad>
                <p className="font-semibold">
                  {g[0].nama} · lahir {g[0].tanggalLahir}{" "}
                  <span className="text-sm font-normal text-muted">({g.length} entri)</span>
                </p>
                <ul className="mt-3 grid gap-2 text-sm">
                  {g.map((a) => (
                    <li key={a.id} className="rounded-xl border border-border p-3">
                      <p className="font-medium">anak #{a.id}</p>
                      <p className="text-muted">
                        Orang tua: {userById.get(a.orangTuaId)?.name ?? `user#${a.orangTuaId}`} ({userById.get(a.orangTuaId)?.email ?? "—"})
                      </p>
                      <p className="text-muted">
                        Jenjang terakhir: {a.jenjangTerakhir ?? "—"} · kontak: {a.emailNotifikasi ?? "—"} / {a.nomorTelepon ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardPad>
            </Card>
          </li>
        ))}
      </ul>
      {duplikat.length === 0 ? <p className="mt-6 text-sm text-muted">Tidak ada kandidat duplikat. Data bersih.</p> : null}

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
