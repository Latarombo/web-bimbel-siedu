import { getLocale, getTranslations } from "next-intl/server";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

// E10 — laporan pendaftaran & keuangan, agregat per periode.
const AKTIF = ["menunggu_pembayaran", "terdaftar", "tertunggak"];

export default async function AdminReports() {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const labelPeriode = (value: string) => t.has(`labelPeriode_${value}`) ? t(`labelPeriode_${value}`) : value.replaceAll("_", " ");
  const fmtTanggal = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/reports", locale }) } }, locale });

  const [periode, pendaftaran, pembayaran] = await Promise.all([
    collect(db.orm.public.PeriodePendaftaran.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Pembayaran.all()),
  ]);
  const urut = [...periode].sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai));

  // Ringkasan atas (angka nyata, dihitung dari data yang sama dengan tabel).
  const berhasil = pembayaran.filter((b) => b.status === "berhasil");
  const pending = pembayaran.filter((b) => b.status === "pending");
  const totalBerhasil = berhasil.reduce((acc, b) => acc + Number(b.jumlah), 0);
  const totalPending = pending.reduce((acc, b) => acc + Number(b.jumlah), 0);
  const nAktif = pendaftaran.filter((p) => AKTIF.includes(p.status)).length;
  const nTertunggak = pendaftaran.filter((p) => p.status === "tertunggak").length;

  const kpi = [
    { label: t("text18"), value: rupiah(totalBerhasil), sub: t("successfulPayments", { count: berhasil.length }), accent: "border-emerald-500" },
    { label: t("text108"), value: rupiah(totalPending), sub: t("pendingTransactions", { count: pending.length }), accent: "border-amber-500" },
    { label: t("text109"), value: String(nAktif), sub: t("enrollmentTotal", { count: pendaftaran.length }), accent: "border-blue-600" },
    { label: t("text110"), value: String(nTertunggak), sub: nTertunggak > 0 ? t("text111") : t("text112"), accent: nTertunggak > 0 ? "border-rose-500" : "border-slate-300" },
  ];

  const columns: TableColumn[] = [
    { key: "nama", header: t("text9") },
    { key: "status", header: t("text32") },
    { key: "aktif", header: t("text68"), className: "text-center" },
    { key: "tertunggak", header: t("text110"), className: "text-center" },
    { key: "batal", header: t("text113"), className: "text-center" },
    { key: "terkumpul", header: t("text114"), className: "text-right" },
    { key: "pending", header: t("text20"), className: "text-right" },
  ];

  const rows: TableRowData[] = urut.map((pr) => {
    const pP = pendaftaran.filter((p) => p.periodeId === pr.id);
    const byStatus = (s: string) => pP.filter((p) => p.status === s).length;
    const tagihanIds = new Set(pP.map((p) => p.id));
    const bP = pembayaran.filter((b) => tagihanIds.has(b.pendaftaranId));
    const rupiahList = (list: typeof bP) => rupiah(list.reduce((acc, b) => acc + Number(b.jumlah), 0));
    const ok = bP.filter((b) => b.status === "berhasil");
    const pen = bP.filter((b) => b.status === "pending");
    const aktif = AKTIF.reduce((a, s) => a + byStatus(s), 0);

    return {
      id: pr.id,
      values: {
        nama: pr.nama,
        status: pr.status,
        aktif,
        tertunggak: byStatus("tertunggak"),
        batal: pP.length - aktif,
        terkumpul: ok.reduce((acc, b) => acc + Number(b.jumlah), 0),
        pending: pen.reduce((acc, b) => acc + Number(b.jumlah), 0),
      },
      cells: {
        nama: (
          <div>
            <p className="font-semibold text-slate-900">{pr.nama}</p>
            <p className="text-xs tabular-nums text-slate-500">
              {t("periodEnrollmentSummary", { start: fmtTanggal(pr.tanggalMulai), end: fmtTanggal(pr.tanggalSelesai), count: pP.length })}
            </p>
          </div>
        ),
        status: <Badge tone={pr.status === "dibuka" ? "emerald" : pr.status === "ditutup" ? "amber" : "slate"}>{labelPeriode(pr.status)}</Badge>,
        aktif: <span className="font-bold tabular-nums text-slate-900">{aktif}</span>,
        tertunggak: (
          <span className={`font-bold tabular-nums ${byStatus("tertunggak") > 0 ? "text-rose-700" : "text-slate-500"}`}>
            {byStatus("tertunggak")}
          </span>
        ),
        batal: <span className="tabular-nums text-slate-600">{pP.length - aktif}</span>,
        terkumpul: (
          <div>
            <p className="tabular-nums font-semibold text-slate-900">{rupiahList(ok)}</p>
            <p className="text-xs text-slate-500">{t("successfulInvoices", { count: ok.length })}</p>
          </div>
        ),
        pending: (
          <div>
            <p className="tabular-nums text-slate-700">{rupiahList(pen)}</p>
            <p className="text-xs text-slate-500">
              {t("invoiceSummary", { count: pen.length, amount: rupiahList(bP) })}
            </p>
          </div>
        ),
      },
    };
  });

  return (
    <PageShell wide>
      <PageHeader
        title={t("text14")}
        desc={t("text115")}
        meta={t("periodCount", { count: urut.length })}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((s) => (
          <div key={s.label} className={`min-w-0 rounded-2xl border border-slate-200 border-t-4 bg-white p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.10),0_4px_12px_-6px_rgba(15,23,42,0.08)] ${s.accent}`}>
            <p className="truncate font-display text-[20px] font-extrabold leading-none tracking-tight tabular-nums text-slate-900 sm:text-[22px]">{s.value}</p>
            <p className="mt-2.5 text-sm font-bold text-slate-900">{s.label}</p>
            <p className="mt-0.5 text-[13px] text-slate-600">{s.sub}</p>
          </div>
        ))}
      </div>

      <Panel className="mt-5 p-4 sm:p-5">
        <DataTable
          columns={columns}
          rows={rows}
          empty={t("text116")}
          searchPlaceholder={t("text106")}
        />
      </Panel>
    </PageShell>
  );
}
