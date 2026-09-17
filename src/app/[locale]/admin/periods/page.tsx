import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";
import PeriodeForm from "@/components/admin/periode-form";

export const dynamic = "force-dynamic";

export default async function AdminPeriods({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const labelPeriode = (value: string) => t.has(`labelPeriode_${value}`) ? t(`labelPeriode_${value}`) : value.replaceAll("_", " ");
  const fmtTanggal = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/periods", locale }) } }, locale });
  const { edit } = await searchParams;
  const editId = Number(edit ?? 0);

  const periode = await collect(db.orm.public.PeriodePendaftaran.all());
  const kelas = await collect(db.orm.public.Kelas.all());
  const nKelas = new Map<number, number>();
  for (const k of kelas) nKelas.set(k.periodeId, (nKelas.get(k.periodeId) ?? 0) + 1);
  const editing = editId > 0 ? periode.find((p) => p.id === editId) : undefined;
  const dibuka = periode.filter((p) => p.status === "dibuka").length;

  const columns: TableColumn[] = [
    { key: "nama", header: t("text9") },
    { key: "status", header: t("text32") },
    { key: "rentang", header: t("text101") },
    { key: "nKelas", header: t("text11"), className: "text-center" },
    { key: "aksi", header: t("text61"), className: "text-right", sortable: false },
  ];

  const rows: TableRowData[] = [...periode]
    .sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai))
    .map((p) => ({
      id: p.id,
      values: { nama: p.nama, status: p.status, rentang: p.tanggalMulai, nKelas: nKelas.get(p.id) ?? 0 },
      cells: {
        nama: <span className="font-semibold text-slate-900">{p.nama}</span>,
        status: <Badge tone={p.status === "dibuka" ? "emerald" : p.status === "ditutup" ? "amber" : "slate"}>{labelPeriode(p.status)}</Badge>,
        rentang: (
          <span className="text-xs tabular-nums text-slate-500">
            {t("dateRange", { start: fmtTanggal(p.tanggalMulai), end: fmtTanggal(p.tanggalSelesai) })}
            <span className="mt-0.5 block text-slate-400">{t("registrationDeadline", { date: fmtTanggal(p.tanggalTutupPendaftaran) })}</span>
          </span>
        ),
        nKelas: <span className="tabular-nums text-slate-700">{nKelas.get(p.id) ?? 0}</span>,
        aksi: (
          <Link href={`/admin/periods?edit=${p.id}`} className="text-sm font-semibold text-blue-700 hover:underline">{t("text83")} </Link>
        ),
      },
    }));

  return (
    <PageShell>
      <PageHeader
        title={t("text102")}
        desc={t("text103")}
        meta={dibuka > 0 ? t("openCount", { count: dibuka }) : t("text104")}
      />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="p-5">
          <DataTable
            columns={columns}
            rows={rows}
            empty={t("text105")}
            initialSort={{ key: "rentang", dir: "desc" }}
            searchPlaceholder={t("text106")}
          />
        </Panel>

        <Panel className="lg:sticky lg:top-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                {editing ? t("editName", { name: editing.nama }) : t("text107")}
              </h2>
              {editing ? (
                <Link href="/admin/periods" className="text-sm font-semibold text-slate-500 underline hover:text-slate-900">{t("text197")} </Link>
              ) : null}
            </div>
            <div className="mt-4">
              <PeriodeForm
                key={editing?.id ?? "baru"}
                periodeId={editing?.id}
                defaults={
                  editing
                    ? {
                        nama: editing.nama,
                        tanggalMulai: editing.tanggalMulai,
                        tanggalSelesai: editing.tanggalSelesai,
                        tanggalTutupPendaftaran: editing.tanggalTutupPendaftaran,
                        status: editing.status,
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
