import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel, FilterTabs, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

// E6 — pendaftaran bermasalah: tunggakan & pembatalan otomatis.
const STATUS_MASALAH = ["tertunggak", "dibatalkan_timeout", "dibatalkan_tunggakan", "dibatalkan_kelas"];

export default async function AdminFlagged({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const labelPendaftaran = (value: string) => t.has(`labelPendaftaran_${value}`) ? t(`labelPendaftaran_${value}`) : value.replaceAll("_", " ");
  const labelMetode = (value: string) => t.has(`labelMetode_${value}`) ? t(`labelMetode_${value}`) : value.replaceAll("_", " ");
  const fmtTanggal = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/enrollments/flagged", locale }) } }, locale });
  const { status } = await searchParams;
  const filter = status && STATUS_MASALAH.includes(status) ? status : "semua";

  const [pendaftaran, anak, kelas, mapel] = await Promise.all([
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
  ]);
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  const masalah = pendaftaran.filter((p) => STATUS_MASALAH.includes(p.status));
  const daftar = filter === "semua" ? masalah : masalah.filter((p) => p.status === filter);
  const urut = [...daftar].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const columns: TableColumn[] = [
    { key: "anak", header: t("text117") },
    { key: "status", header: t("text32") },
    { key: "metode", header: t("text118") },
    { key: "updatedAt", header: t("text119") },
    { key: "createdAt", header: t("text120") },
  ];

  const rows: TableRowData[] = urut.map((p) => {
    const a = anakById.get(p.anakId);
    const k = kelasById.get(p.kelasId);
    const nama = a?.nama ?? t("childFallback", { id: p.anakId });
    const kelasLabel = mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? t("classFallback", { id: p.kelasId });
    return {
      id: p.id,
      values: {
        anak: `${nama} ${kelasLabel}`,
        status: p.status,
        metode: p.metodeBayar,
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
      },
      cells: {
        anak: (
          <Link href={`/admin/enrollments/flagged?status=${p.status}`} className="group block">
            <p className="font-semibold text-slate-900 group-hover:text-blue-700">{nama}</p>
            <p className="text-xs text-slate-500">
              {t("enrollmentDetail", { className: kelasLabel, level: k?.jenjang ?? "—", id: p.id })}
            </p>
          </Link>
        ),
        status: <StatusBadge status={p.status as never} />,
        metode: <span className="text-xs text-slate-600">{labelMetode(p.metodeBayar)}</span>,
        updatedAt: <span className="tabular-nums text-xs text-slate-500">{fmtTanggal(p.updatedAt)}</span>,
        createdAt: <span className="tabular-nums text-xs text-slate-500">{fmtTanggal(p.createdAt)}</span>,
      },
    };
  });

  return (
    <PageShell wide>
      <PageHeader
        title={t("text121")}
        desc={t("text122")}
        meta={masalah.length > 0 ? t("reviewCount", { count: masalah.length }) : t("text123")}
      />

      <div className="mt-5">
        <FilterTabs
          label={t("text124")}
          tabs={[
            { label: t("text67"), href: "/admin/enrollments/flagged", count: masalah.length, aktif: filter === "semua" },
            ...STATUS_MASALAH.map((s) => ({
              label: labelPendaftaran(s),
              href: `/admin/enrollments/flagged?status=${s}`,
              count: masalah.filter((p) => p.status === s).length,
              aktif: filter === s,
              attention: s === "tertunggak",
            })),
          ]}
        />
      </div>

      <Panel className="mt-4 p-5">
        <DataTable
          columns={columns}
          rows={rows}
          empty={masalah.length === 0 ? t("text125") : t("text126")}
          initialSort={{ key: "updatedAt", dir: "desc" }}
          searchPlaceholder={t("text127")}
        />
      </Panel>

      <div className="mt-4">
        <Notice tone="blue" title={t("text128")}>{t("text129")} </Notice>
      </div>

      <div className="mt-4">
        <ButtonLink href={getPathname({ href: "/admin/dashboard", locale })} variant="ghost" size="sm" className="text-slate-500">{t("text130")} </ButtonLink>
      </div>
    </PageShell>
  );
}
