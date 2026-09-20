import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel, FilterTabs } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminClasses({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const labelKelas = (value: string) => t.has(`labelKelas_${value}`) ? t(`labelKelas_${value}`) : value.replaceAll("_", " ");
  const dayLabel = (day: string) => locale === "en" && t.has(`day_${day.toLowerCase()}`) ? t(`day_${day.toLowerCase()}`) : day;
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/classes", locale }) } }, locale });
  const { status } = await searchParams;
  const filter = status === "dibatalkan" ? "dibatalkan" : status === "aktif" ? "aktif" : "semua";

  const [kelasSemua, mapel, guru, jadwal, pendaftaran] = await Promise.all([
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("guru")).all()),
    collect(db.orm.public.JadwalItem.all()),
    collect(db.orm.public.Pendaftaran.all()),
  ]);
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const guruById = new Map(guru.map((g) => [g.id, g]));
  const daftar = kelasSemua.filter((k) => (filter === "semua" ? true : k.status === filter));
  const urut = [...daftar].sort((a, b) => a.id - b.id);
  const nAktif = kelasSemua.filter((k) => k.status === "aktif").length;
  const nBatal = kelasSemua.filter((k) => k.status === "dibatalkan").length;

  const columns: TableColumn[] = [
    { key: "mapel", header: t("text11") },
    { key: "guru", header: t("text10") },
    { key: "jadwal", header: t("text58") },
    { key: "kuota", header: t("text59") },
    { key: "biaya", header: t("text60") },
    { key: "status", header: t("text32") },
    { key: "aksi", header: t("text61"), className: "text-right", sortable: false },
  ];

  const rows: TableRowData[] = urut.map((k) => {
    const jadwalKelas = jadwal
      .filter((j) => j.kelasId === k.id)
      .sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai));
    const terisi = pendaftaran.filter(
      (p) => p.kelasId === k.id && ["terdaftar", "tertunggak", "menunggu_pembayaran"].includes(p.status),
    ).length;
    const pct = Math.min(100, Math.round((terisi / Math.max(k.kuotaMaksimum, 1)) * 100));
    const nearFull = pct >= 90;
    return {
      id: k.id,
      values: {
        mapel: mapelById.get(k.mataPelajaranId)?.nama ?? t("text11"),
        guru: guruById.get(k.guruId)?.name ?? "—",
        jadwal: jadwalKelas.map((j) => j.hari).join(", ") || "zzz",
        kuota: terisi / Math.max(k.kuotaMaksimum, 1),
        biaya: Number(k.biayaPeriode),
        status: k.status,
      },
      cells: {
        mapel: (
          <div>
            <p className="font-semibold text-slate-900">{mapelById.get(k.mataPelajaranId)?.nama ?? t("text11")}</p>
            <p className="text-xs text-slate-500">
              {t("classLevel", { level: k.jenjang, id: k.id })}
              {((k as unknown as { tingkat?: string | null }).tingkat) ? ` · ${(k as unknown as { tingkat?: string | null }).tingkat}` : ""}
            </p>
          </div>
        ),
        guru: <span className="text-slate-700">{guruById.get(k.guruId)?.name ?? "—"}</span>,
        jadwal: (
          <span className="text-xs text-slate-500">
            {jadwalKelas.map((j) => `${dayLabel(j.hari)} ${j.jamMulai.slice(0, 5)}–${j.jamSelesai.slice(0, 5)}`).join(", ") ||
              t("text62")}
          </span>
        ),
        kuota: (
          <div className="min-w-[7.5rem]">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold tabular-nums text-slate-900">
                {terisi}/{k.kuotaMaksimum}
              </span>
              <span className={`text-xs font-bold tabular-nums ${nearFull ? "text-amber-700" : "text-slate-500"}`}>{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200/80" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("text42")}>
              <div className={`h-full rounded-full ${nearFull ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ),
        biaya: (
          <div>
            <p className="tabular-nums font-semibold text-slate-900">{rupiah(Number(k.biayaPeriode))}</p>
            {k.biayaDp ? <p className="text-xs text-slate-500">{t("depositAmount", { amount: rupiah(Number(k.biayaDp)) })}</p> : null}
          </div>
        ),
        status: <Badge tone={k.status === "aktif" ? "emerald" : "slate"}>{labelKelas(k.status)}</Badge>,
        aksi: (
          <Link href={`/admin/classes/${k.id}/edit`} className="text-sm font-semibold text-blue-700 hover:underline">{t("text63")} </Link>
        ),
      },
    };
  });

  return (
    <PageShell wide>
      <PageHeader title={t("text11")} desc={t("text64")} meta={t("activeCount", { count: nAktif })}>
        <ButtonLink href={getPathname({ href: "/admin/classes/new", locale })}>{t("text65")}</ButtonLink>
      </PageHeader>

      <div className="mt-5">
        <FilterTabs
          label={t("text66")}
          tabs={[
            { label: t("text67"), href: "/admin/classes", count: kelasSemua.length, aktif: filter === "semua" },
            { label: t("text68"), href: "/admin/classes?status=aktif", count: nAktif, aktif: filter === "aktif" },
            { label: t("text69"), href: "/admin/classes?status=dibatalkan", count: nBatal, aktif: filter === "dibatalkan" },
          ]}
        />
      </div>

      <Panel className="mt-4 p-5">
        <DataTable
          columns={columns}
          rows={rows}
          empty={filter === "semua" ? t("text70") : t("text71")}
          initialSort={{ key: "mapel", dir: "asc" }}
          searchPlaceholder={t("text72")}
        />
      </Panel>
    </PageShell>
  );
}
