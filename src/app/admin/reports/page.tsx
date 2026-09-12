import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";

export const dynamic = "force-dynamic";

// E10 — laporan pendaftaran & keuangan. Agregat per periode.
const AKTIF = ["menunggu_pembayaran", "terdaftar", "tertunggak"];

export default async function AdminReports() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/reports");

  const [periode, pendaftaran, pembayaran] = await Promise.all([
    collect(db.orm.public.PeriodePendaftaran.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Pembayaran.all()),
  ]);
  const urut = [...periode].sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai));

  const columns: TableColumn[] = [
    { key: "nama", header: "Periode" },
    { key: "status", header: "Status" },
    { key: "aktif", header: "Aktif", className: "text-center" },
    { key: "tertunggak", header: "Tertunggak", className: "text-center" },
    { key: "batal", header: "Batal", className: "text-center" },
    { key: "terkumpul", header: "Terkumpul" },
    { key: "pending", header: "Pending" },
  ];

  const rows: TableRowData[] = urut.map((pr) => {
    const pP = pendaftaran.filter((p) => p.periodeId === pr.id);
    const byStatus = (s: string) => pP.filter((p) => p.status === s).length;
    const tagihanIds = new Set(pP.map((p) => p.id));
    const bP = pembayaran.filter((b) => tagihanIds.has(b.pendaftaranId));
    const rupiah = (list: typeof bP) =>
      `Rp${list.reduce((acc, b) => acc + Number(b.jumlah), 0).toLocaleString("id-ID")}`;
    const berhasil = bP.filter((b) => b.status === "berhasil");
    const pending = bP.filter((b) => b.status === "pending");
    const aktif = AKTIF.reduce((a, s) => a + byStatus(s), 0);

    return {
      id: pr.id,
      values: {
        nama: pr.nama,
        status: pr.status,
        aktif,
        tertunggak: byStatus("tertunggak"),
        batal: pP.length - aktif,
        terkumpul: berhasil.reduce((acc, b) => acc + Number(b.jumlah), 0),
        pending: pending.reduce((acc, b) => acc + Number(b.jumlah), 0),
      },
      cells: {
        nama: (
          <div>
            <p className="font-semibold text-foreground">{pr.nama}</p>
            <p className="text-xs text-muted">
              {pr.tanggalMulai} s/d {pr.tanggalSelesai} · {pP.length} pendaftaran
            </p>
          </div>
        ),
        status: <span className="text-xs">{pr.status}</span>,
        aktif: <span className="tabular-nums">{aktif}</span>,
        tertunggak: (
          <span className={`tabular-nums ${byStatus("tertunggak") > 0 ? "font-semibold text-red-600" : "text-muted"}`}>
            {byStatus("tertunggak")}
          </span>
        ),
        batal: <span className="tabular-nums text-muted">{pP.length - aktif}</span>,
        terkumpul: (
          <div>
            <p className="tabular-nums font-semibold">{rupiah(berhasil)}</p>
            <p className="text-xs text-muted">{berhasil.length} tagihan berhasil</p>
          </div>
        ),
        pending: (
          <div>
            <p className="tabular-nums">{rupiah(pending)}</p>
            <p className="text-xs text-muted">
              {pending.length} pending · total tagihan {rupiah(bP)}
            </p>
          </div>
        ),
      },
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
      <p className="mt-1 text-sm text-muted">
        E10 — ringkasan pendaftaran &amp; keuangan per periode. Klik header kolom untuk sort.
      </p>

      <div className="mt-6">
        <DataTable columns={columns} rows={rows} empty="Belum ada periode." />
      </div>

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
