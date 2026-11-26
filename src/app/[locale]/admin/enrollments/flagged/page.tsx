import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
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

  const [pendaftaran, anak, kelas] = await Promise.all([
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
  ]);
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));

  const masalah = pendaftaran.filter((p) => STATUS_MASALAH.includes(p.status));
  const daftar = filter === "semua" ? masalah : masalah.filter((p) => p.status === filter);
  const urut = daftar.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const columns: TableColumn[] = [
    { key: "anak", header: t("text117") },
    { key: "status", header: t("text32"), align: "center" },
    { key: "metode", header: t("text118"), align: "center" },
    { key: "updatedAt", header: t("text119"), align: "right" },
    { key: "createdAt", header: t("text120"), align: "right" },
    { key: "aksi", header: "Aksi", align: "right", sortable: false },
  ];

  const rows: TableRowData[] = urut.map((p) => {
    const a = anakById.get(p.anakId);
    const k = kelasById.get(p.kelasId);
    const nama = a?.nama ?? t("childFallback", { id: p.anakId });
    const kelasLabel = k?.nama || k?.mapel || t("classFallback", { id: p.kelasId });
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
          <div>
            <Link
              href={`/admin/enrollments/${p.id}`}
              className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
            >
              {nama}
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("enrollmentDetail", { className: kelasLabel, level: k?.jenjang ?? "—", id: p.id })}
            </p>
          </div>
        ),
        status: <StatusBadge status={p.status as never} />,
        metode: <span className="text-xs text-slate-600 dark:text-slate-300">{labelMetode(p.metodeBayar)}</span>,
        updatedAt: <span className="tabular-nums text-xs text-slate-500 dark:text-slate-400">{fmtTanggal(p.updatedAt)}</span>,
        createdAt: <span className="tabular-nums text-xs text-slate-500 dark:text-slate-400">{fmtTanggal(p.createdAt)}</span>,
        aksi: (
          <Link
            href={`/admin/enrollments/${p.id}`}
            className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
          >
            Rincian
          </Link>
        ),
      },
    };
  });

  return (
    <PageShell wide>
      <PageHeader
        backHref="/admin/enrollments"
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
        <ButtonLink href={getPathname({ href: "/admin/dashboard", locale })} variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400">{t("text130")} </ButtonLink>
      </div>
    </PageShell>
  );
}
