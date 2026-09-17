import { getLocale, getTranslations } from "next-intl/server";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel, FilterTabs, Notice } from "@/components/admin/ui";

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

export default async function AdminCorrections({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const labelPresensi = (value: string) => t.has(`labelPresensi_${value}`) ? t(`labelPresensi_${value}`) : value.replaceAll("_", " ");
  const fmtTanggal = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/corrections", locale }) } }, locale });
  const { jenis } = await searchParams;
  const filter = jenis === "presensi" || jenis === "nilai" ? jenis : "semua";

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
    if (!p) return { anak: t("enrollmentId", { id: pendaftaranId }), mapel: "—" };
    const a = anakById.get(p.anakId);
    const k = kelasById.get(p.kelasId);
    return {
      anak: a?.nama ?? t("childFallback", { id: p.anakId }),
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
        ringkas: t("attendanceSummary", { status: labelPresensi(x.status) }),
        createdAt: x.createdAt,
      })),
    ...nilai
      .filter((x) => lewat7Hari(x.createdAt, now))
      .map((x) => ({
        id: `n${x.id}`,
        jenis: "nilai" as const,
        ...label(x.pendaftaranId),
        tanggal: x.tanggal,
        ringkas: t("gradeSummary", { grade: x.nilaiKuantitatif ?? "—" }),
        createdAt: x.createdAt,
      })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const presensiTerkunci = kandidat.filter((k) => k.jenis === "presensi").length;
  const nilaiTerkunci = kandidat.filter((k) => k.jenis === "nilai").length;
  const daftar = filter === "semua" ? kandidat : kandidat.filter((k) => k.jenis === filter);

  const columns: TableColumn[] = [
    { key: "jenis", header: t("text145") },
    { key: "anak", header: t("text30") },
    { key: "tanggal", header: t("text146") },
    { key: "ringkas", header: t("text147") },
    { key: "createdAt", header: t("text148") },
  ];

  const rows: TableRowData[] = daftar.map((k) => ({
    id: k.id,
    values: { jenis: k.jenis, anak: `${k.anak} ${k.mapel}`, tanggal: k.tanggal, ringkas: k.ringkas, createdAt: k.createdAt },
    cells: {
      jenis: (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            k.jenis === "presensi" ? "bg-slate-100 text-slate-700" : "bg-blue-100 text-blue-800"
          }`}
        >
          {k.jenis === "presensi" ? t("attendanceLower") : t("gradesLower")}
        </span>
      ),
      anak: (
        <div>
          <p className="font-semibold text-slate-900">{k.anak}</p>
          <p className="text-xs text-slate-500">{k.mapel}</p>
        </div>
      ),
      tanggal: <span className="tabular-nums text-sm text-slate-700">{fmtTanggal(k.tanggal)}</span>,
      ringkas: <span className="text-sm text-slate-700">{k.ringkas}</span>,
      createdAt: <span className="tabular-nums text-xs text-slate-500">{fmtTanggal(k.createdAt)}</span>,
    },
  }));

  return (
    <PageShell wide>
      <PageHeader
        title={t("text149")}
        desc={t("text150")}
        meta={kandidat.length > 0 ? t("lockedCount", { count: kandidat.length }) : t("text151")}
      />

      <div className="mt-5">
        <Notice tone="amber" title={t("text152")}>{t("text153")} </Notice>
      </div>

      <div className="mt-5">
        <FilterTabs
          label={t("text154")}
          tabs={[
            { label: t("text67"), href: "/admin/corrections", count: kandidat.length, aktif: filter === "semua" },
            { label: t("text155"), href: "/admin/corrections?jenis=presensi", count: presensiTerkunci, aktif: filter === "presensi" },
            { label: t("text156"), href: "/admin/corrections?jenis=nilai", count: nilaiTerkunci, aktif: filter === "nilai" },
          ]}
        />
      </div>

      <Panel className="mt-4 p-5">
        <DataTable
          columns={columns}
          rows={rows}
          empty={kandidat.length === 0 ? t("text157") : t("text158")}
          initialSort={{ key: "createdAt", dir: "desc" }}
          searchPlaceholder={t("text159")}
          caption={t("lockedSummary", { attendance: presensiTerkunci, grades: nilaiTerkunci })}
        />
      </Panel>
    </PageShell>
  );
}
