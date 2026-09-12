import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";

export const dynamic = "force-dynamic";

export default async function AdminClasses({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/classes");
  const { status } = await searchParams;
  const filter = status === "dibatalkan" ? "dibatalkan" : status === "aktif" ? "aktif" : "semua";

  const [kelasSemua, mapel, guru, jadwal, pendaftaran] = await Promise.all([
    filter === "semua"
      ? collect(db.orm.public.Kelas.all())
      : collect(db.orm.public.Kelas.where((k) => k.status.eq(filter)).all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("guru")).all()),
    collect(db.orm.public.JadwalItem.all()),
    collect(db.orm.public.Pendaftaran.all()),
  ]);
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const guruById = new Map(guru.map((g) => [g.id, g]));
  const urut = [...kelasSemua].sort((a, b) => a.id - b.id);

  const columns: TableColumn[] = [
    { key: "mapel", header: "Mapel" },
    { key: "guru", header: "Guru" },
    { key: "jadwal", header: "Jadwal" },
    { key: "kuota", header: "Kuota", className: "text-center" },
    { key: "biaya", header: "Biaya" },
    { key: "status", header: "Status" },
    { key: "aksi", header: "Aksi", className: "text-right", sortable: false },
  ];

  const rows: TableRowData[] = urut.map((k) => {
    const jadwalKelas = jadwal
      .filter((j) => j.kelasId === k.id)
      .sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai));
    const nAktif = pendaftaran.filter((p) => p.kelasId === k.id && ["terdaftar", "tertunggak", "menunggu_pembayaran"].includes(p.status)).length;
    const biaya =
      `Rp${Number(k.biayaPeriode).toLocaleString("id-ID")}` +
      (k.biayaDp ? ` · DP Rp${Number(k.biayaDp).toLocaleString("id-ID")}` : "");
    return {
      id: k.id,
      values: {
        mapel: mapelById.get(k.mataPelajaranId)?.nama ?? "Kelas",
        guru: guruById.get(k.guruId)?.name ?? "—",
        jadwal: jadwalKelas.map((j) => j.hari).join(", ") || "zzz",
        kuota: nAktif / Math.max(k.kuotaMaksimum, 1),
        biaya: Number(k.biayaPeriode),
        status: k.status,
      },
      cells: {
        mapel: (
          <div>
            <p className="font-semibold text-foreground">{mapelById.get(k.mataPelajaranId)?.nama ?? "Kelas"}</p>
            <p className="text-xs text-muted">{k.jenjang}</p>
          </div>
        ),
        guru: <span>{guruById.get(k.guruId)?.name ?? "—"}</span>,
        jadwal: (
          <span className="text-xs text-muted">
            {jadwalKelas.map((j) => `${j.hari} ${j.jamMulai.slice(0, 5)}–${j.jamSelesai.slice(0, 5)}`).join(", ") ||
              "tanpa jadwal"}
          </span>
        ),
        kuota: <span className="tabular-nums">{nAktif}/{k.kuotaMaksimum}</span>,
        biaya: <span className="tabular-nums text-xs">{biaya}</span>,
        status: <Badge tone={k.status === "aktif" ? "emerald" : "slate"}>{k.status}</Badge>,
        aksi: (
          <Link href={`/admin/classes/${k.id}/edit`} className="text-sm font-semibold text-brand hover:underline">
            Edit
          </Link>
        ),
      },
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelas</h1>
          <p className="mt-1 text-sm text-muted">E5 — kelola kelas + jadwal, validasi BR#6 bentrok.</p>
        </div>
        <ButtonLink href="/admin/classes/new">+ Kelas baru</ButtonLink>
      </div>

      {/* Filter tabs — pola pill yang sama dengan halaman parent */}
      <nav aria-label="Filter status kelas" className="mt-4 inline-flex rounded-full bg-slate-100 p-1">
        {["semua", "aktif", "dibatalkan"].map((s) => (
          <Link
            key={s}
            href={s === "semua" ? "/admin/classes" : `/admin/classes?status=${s}`}
            aria-current={filter === s ? "page" : undefined}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              filter === s ? "bg-white text-brand shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {s}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        <DataTable columns={columns} rows={rows} empty="Tidak ada kelas." />
      </div>

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
