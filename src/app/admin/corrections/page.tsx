import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";

export const dynamic = "force-dynamic";

// E9 — BR#18 sisi admin. Kontrak BELUM punya tabel pengajuan_koreksi
// (siapa minta, siapa approve, kapan, alasan, nilai sebelum) — butuh revisi
// kontrak + migrasi sebelum flow penuh. Sementara: daftar entri presensi/nilai
// yang sudah terkunci (lewat 7 hari) = kandidat koreksi manual.
function lewat7Hari(createdAt: string, sekarang: Date): boolean {
  return (sekarang.getTime() - new Date(createdAt).getTime()) > 7 * 86_400_000;
}

type Kandidat = {
  id: string;
  jenis: "presensi" | "nilai";
  anak: string;
  mapel: string;
  tanggal: string;
  ringkas: string;
  createdAt: string;
};

export default async function AdminCorrections() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/corrections");

  const now = new Date();
  const [presensi, nilai, pendaftaran, anak, kelas, mapel] = await Promise.all([
    collect(db.orm.public.Presensi.all()),
    collect(db.orm.public.NilaiProgres.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
  ]);
  const pById = new Map(pendaftaran.map((p) => [p.id, p]));
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  const label = (pendaftaranId: number) => {
    const p = pById.get(pendaftaranId);
    if (!p) return { anak: `pendaftaran #${pendaftaranId}`, mapel: "—" };
    const a = anakById.get(p.anakId);
    const k = kelasById.get(p.kelasId);
    return {
      anak: a?.nama ?? `anak#${p.anakId}`,
      mapel: mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? "—",
    };
  };

  const kandidat: Kandidat[] = [
    ...presensi
      .filter((x) => lewat7Hari(x.createdAt, now))
      .map((x) => ({
        id: `p${x.id}`,
        jenis: "presensi" as const,
        ...label(x.pendaftaranId),
        tanggal: x.tanggalPertemuan,
        ringkas: `status: ${x.status}`,
        createdAt: x.createdAt,
      })),
    ...nilai
      .filter((x) => lewat7Hari(x.createdAt, now))
      .map((x) => ({
        id: `n${x.id}`,
        jenis: "nilai" as const,
        ...label(x.pendaftaranId),
        tanggal: x.tanggal,
        ringkas: `nilai: ${x.nilaiKuantitatif ?? "—"}`,
        createdAt: x.createdAt,
      })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const presensiTerkunci = kandidat.filter((k) => k.jenis === "presensi").length;
  const nilaiTerkunci = kandidat.filter((k) => k.jenis === "nilai").length;

  const columns: TableColumn[] = [
    { key: "jenis", header: "Jenis" },
    { key: "anak", header: "Anak · Mapel" },
    { key: "tanggal", header: "Tanggal" },
    { key: "ringkas", header: "Nilai/Status" },
    { key: "createdAt", header: "Diinput" },
  ];

  const rows: TableRowData[] = kandidat.map((k) => ({
    id: k.id,
    values: {
      jenis: k.jenis,
      anak: `${k.anak} ${k.mapel}`,
      tanggal: k.tanggal,
      ringkas: k.ringkas,
      createdAt: k.createdAt,
    },
    cells: {
      jenis: (
        <span className={`text-xs font-semibold ${k.jenis === "presensi" ? "text-slate-500" : "text-brand"}`}>
          {k.jenis}
        </span>
      ),
      anak: (
        <div>
          <p className="font-semibold text-foreground">{k.anak}</p>
          <p className="text-xs text-muted">{k.mapel}</p>
        </div>
      ),
      tanggal: <span className="tabular-nums">{k.tanggal}</span>,
      ringkas: <span className="text-xs">{k.ringkas}</span>,
      createdAt: <span className="tabular-nums text-muted">{k.createdAt.slice(0, 10)}</span>,
    },
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Pengajuan Koreksi</h1>
      <p className="mt-1 text-sm text-muted">
        E9 — BR#18: entri presensi/nilai lewat 7 hari terkunci; koreksi harus lewat admin dengan jejak audit.
      </p>

      <Card className="mt-6 border-amber-300">
        <CardPad>
          <p className="text-sm font-semibold text-amber-800">Flow pengajuan koreksi belum aktif</p>
          <p className="mt-1 text-sm text-muted">
            Kontrak belum punya tabel <code>pengajuan_koreksi</code>. Sebelum tabel itu ada, koreksi di bawah dicatat manual (chat/formulir luar) dan diedit langsung di DB.
          </p>
        </CardPad>
      </Card>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          empty="Tidak ada entri terkunci."
          caption={`Presensi terkunci: ${presensiTerkunci} · Nilai terkunci: ${nilaiTerkunci}`}
        />
      </div>

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
