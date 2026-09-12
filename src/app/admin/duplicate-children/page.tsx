import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";

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

  // Satu baris per entri anak (bukan per grup) — sort kolom tetap berguna.
  const columns: TableColumn[] = [
    { key: "nama", header: "Nama (dinormalisasi)" },
    { key: "lahir", header: "Tgl lahir" },
    { key: "orangTua", header: "Orang tua" },
    { key: "email", header: "Kontak" },
    { key: "jenjang", header: "Jenjang terakhir" },
  ];

  const rows: TableRowData[] = duplikat.flatMap((g) =>
    g.map((a) => {
      const u = userById.get(a.orangTuaId);
      return {
        id: a.id,
        values: {
          nama: normNama(a.nama),
          lahir: a.tanggalLahir,
          orangTua: u?.name ?? `user#${a.orangTuaId}`,
          email: u?.email ?? "",
          jenjang: a.jenjangTerakhir ?? "",
        },
        cells: {
          nama: (
            <p className="font-semibold text-foreground">
              {a.nama} <span className="text-xs font-normal text-muted">· anak #{a.id}</span>
            </p>
          ),
          lahir: <span className="tabular-nums">{a.tanggalLahir}</span>,
          orangTua: (
            <div>
              <p>{u?.name ?? `user#${a.orangTuaId}`}</p>
              <p className="text-xs text-muted">{u?.email ?? "—"}</p>
            </div>
          ),
          email: (
            <span className="text-xs text-muted">
              {a.emailNotifikasi ?? "—"}
              {a.nomorTelepon ? ` · ${a.nomorTelepon}` : ""}
            </span>
          ),
          jenjang: <span>{a.jenjangTerakhir ?? "—"}</span>,
        },
      };
    }),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Review Anak Duplikat</h1>
      <p className="mt-1 text-sm text-muted">
        E8 — kandidat duplikat (nama sama setelah dinormalisasi + tanggal lahir sama) lintas akun orang tua. Ditinjau manual, tidak diblokir otomatis (BR#16).
      </p>

      {duplikat.length > 0 ? (
        <div className="mt-6">
          <Card className="border-amber-300">
            <DataTable
              columns={columns}
              rows={rows}
              empty="Tidak ada kandidat duplikat."
              caption={`${duplikat.length} grup duplikat · ${rows.length} entri — bandingkan akun orang tua sebelum menggabungkan manual di DB.`}
            />
          </Card>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Tidak ada kandidat duplikat. Data bersih.</p>
      )}

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
