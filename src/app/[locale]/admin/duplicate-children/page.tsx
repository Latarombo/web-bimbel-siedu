import { getLocale, getTranslations } from "next-intl/server";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

// E8 — BR#16: deteksi anak duplikat lintas akun.
// Match: nama dinormalisasi (lowercase + spasi rapi) DAN tanggal lahir sama persis.
// Ditandai kandidat untuk ditinjau manual — TIDAK diblokir otomatis.
function normNama(nama: string): string {
  return nama.trim().toLowerCase().replaceAll(/\s+/g, " ");
}

export default async function AdminDuplicateChildren() {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const fmtTanggal = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/duplicate-children", locale }) } }, locale });

  const [anak, users] = await Promise.all([
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.User.all()),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));

  const grup = new Map<string, typeof anak>();
  for (const a of anak) {
    const key = `${normNama(a.nama)}|${a.tanggalLahir}`;
    const arr = grup.get(key) ?? [];
    arr.push(a);
    grup.set(key, arr);
  }
  const duplikat = [...grup.values()].filter((g) => g.length > 1);
  const totalEntri = duplikat.reduce((acc, g) => acc + g.length, 0);

  // Satu baris per entri anak (bukan per grup) — sort kolom tetap berguna.
  const columns: TableColumn[] = [
    { key: "nama", header: t("text30") },
    { key: "grup", header: t("text131"), className: "text-center" },
    { key: "lahir", header: t("text132") },
    { key: "orangTua", header: t("text133") },
    { key: "email", header: t("text134") },
    { key: "jenjang", header: t("text135") },
  ];

  const rows: TableRowData[] = duplikat.flatMap((g, gi) =>
    g.map((a) => {
      const u = userById.get(a.orangTuaId);
      return {
        id: a.id,
        values: {
          nama: normNama(a.nama),
          grup: gi + 1,
          lahir: a.tanggalLahir,
          orangTua: u?.name ?? `user#${a.orangTuaId}`,
          email: u?.email ?? "",
          jenjang: a.jenjangTerakhir ?? "",
        },
        cells: {
          nama: (
            <p className="font-semibold text-slate-900">
              {a.nama} <span className="text-xs font-normal text-slate-400">{t("childIdDot", { id: a.id })}</span>
            </p>
          ),
          grup: (
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-slate-600">
              #{gi + 1}
            </span>
          ),
          lahir: <span className="tabular-nums text-sm text-slate-700">{fmtTanggal(a.tanggalLahir)}</span>,
          orangTua: (
            <div>
              <p className="text-sm font-semibold text-slate-900">{u?.name ?? `user#${a.orangTuaId}`}</p>
              <p className="text-xs text-slate-500">{u?.email ?? "—"}</p>
            </div>
          ),
          email: (
            <span className="text-xs text-slate-500">
              {a.emailNotifikasi ?? "—"}
              {a.nomorTelepon ? ` · ${a.nomorTelepon}` : ""}
            </span>
          ),
          jenjang: <span className="text-sm text-slate-700">{a.jenjangTerakhir ?? "—"}</span>,
        },
      };
    }),
  );

  return (
    <PageShell wide>
      <PageHeader
        title={t("text136")}
        desc={t("text137")}
        meta={duplikat.length > 0 ? t("groupCount", { count: duplikat.length }) : t("text138")}
      />

      <div className="mt-5">
        <Notice tone={duplikat.length > 0 ? "amber" : "blue"} title={duplikat.length > 0 ? t("compareCount", { count: totalEntri }) : t("text139")}>
          {duplikat.length > 0
            ? t("text140")
            : t("text141")}
        </Notice>
      </div>

      {duplikat.length > 0 ? (
        <Panel className="mt-5 p-5">
          <DataTable
            columns={columns}
            rows={rows}
            empty={t("text142")}
            initialSort={{ key: "nama", dir: "asc" }}
            searchPlaceholder={t("text143")}
            caption={t("text144")}
          />
        </Panel>
      ) : null}
    </PageShell>
  );
}
