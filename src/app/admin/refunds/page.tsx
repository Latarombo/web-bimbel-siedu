import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { prosesPengajuan } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

// E7 — verifikasi pengajuan refund/pembatalan. Keputusan admin: setujui/tolak
// dengan catatan. Eksekusi pembatalan pendaftaran + refund uang ada di alur
// pembatalan (C7) dan payment (C4-C6) — tidak dijalankan ulang di sini (BR#19).
export default async function AdminRefunds({ searchParams }: { searchParams: Promise<{ riwayat?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/refunds");
  const { riwayat } = await searchParams;
  const tampilkanRiwayat = riwayat === "1";

  const [pengajuan, pendaftaran, anak, kelas, mapel, admin] = await Promise.all([
    collect(db.orm.public.PengajuanPembatalan.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("admin")).all()),
  ]);
  const pById = new Map(pendaftaran.map((p) => [p.id, p]));
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const adminById = new Map(admin.map((a) => [a.id, a]));

  const daftar = [...pengajuan]
    .filter((p) => (tampilkanRiwayat ? true : p.status === "menunggu"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const columns: TableColumn[] = [
    { key: "nama", header: "Anak · Kelas" },
    { key: "kategori", header: "Kategori" },
    { key: "createdAt", header: "Diajukan" },
    { key: "status", header: "Status" },
    { key: "aksi", header: "Keputusan", className: "w-[22rem]", sortable: false },
  ];

  const rows: TableRowData[] = daftar.map((q) => {
    const p = pById.get(q.pendaftaranId);
    const a = p ? anakById.get(p.anakId) : undefined;
    const k = p ? kelasById.get(p.kelasId) : undefined;
    const kategoriLabel = q.kategori === "lainnya" ? "Lainnya (DP hangus, BR#19)" : q.kategori.replaceAll("_", " ");
    return {
      id: q.id,
      values: {
        nama: `${a?.nama ?? `anak#${p?.anakId ?? q.pendaftaranId}`} ${mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? ""}`,
        kategori: kategoriLabel,
        createdAt: q.createdAt,
        status: q.status,
      },
      cells: {
        nama: (
          <div className="max-w-[16rem]">
            <p className="font-semibold text-foreground">
              {a?.nama ?? `anak#${p?.anakId ?? q.pendaftaranId}`}
            </p>
            <p className="text-xs text-muted">
              {mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? "—"} · pengajuan #{q.id} · pendaftaran #{q.pendaftaranId}
            </p>
            <p className="mt-1 line-clamp-2 max-w-[16rem] whitespace-pre-line text-xs text-muted" title={q.alasan}>
              {q.alasan}
            </p>
          </div>
        ),
        kategori: <span className="text-xs">{kategoriLabel}</span>,
        createdAt: <span className="tabular-nums text-muted">{q.createdAt.slice(0, 10)}</span>,
        status: (
          <Badge tone={q.status === "disetujui" ? "emerald" : q.status === "ditolak" ? "red" : "amber"}>{q.status}</Badge>
        ),
        aksi:
          q.status === "menunggu" ? (
            <form action={prosesPengajuan} className="flex flex-col gap-2">
              <input type="hidden" name="pengajuan_id" value={q.id} />
              <textarea
                name="catatan_admin"
                rows={2}
                maxLength={500}
                placeholder="Catatan admin (cth: bukti transfer diverifikasi)"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors placeholder:text-slate-400"
              />
              <div className="flex gap-2">
                <Button type="submit" name="keputusan" value="disetujui" size="sm">Setujui</Button>
                <Button type="submit" name="keputusan" value="ditolak" variant="destructive" size="sm">Tolak</Button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-muted">
              Diproses {q.diprosesPada?.slice(0, 10) ?? "—"}
              {q.diprosesOleh ? ` oleh ${adminById.get(q.diprosesOleh)?.name ?? `admin#${q.diprosesOleh}`}` : ""}
              {q.catatanAdmin ? ` · ${q.catatanAdmin}` : ""}
            </p>
          ),
      },
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Verifikasi Refund</h1>
      <p className="mt-1 text-sm text-muted">
        E7 — keputusan atas pengajuan pembatalan orang tua.
      </p>

      {/* Filter tabs — pola pill yang sama dengan halaman parent */}
      <nav aria-label="Filter pengajuan" className="mt-4 inline-flex rounded-full bg-slate-100 p-1">
        <Link
          href="/admin/refunds"
          aria-current={!tampilkanRiwayat ? "page" : undefined}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            !tampilkanRiwayat ? "bg-white text-brand shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Menunggu
        </Link>
        <Link
          href="/admin/refunds?riwayat=1"
          aria-current={tampilkanRiwayat ? "page" : undefined}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            tampilkanRiwayat ? "bg-white text-brand shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Riwayat
        </Link>
      </nav>

      <div className="mt-6">
        <DataTable columns={columns} rows={rows} empty="Tidak ada pengajuan." />
      </div>

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
