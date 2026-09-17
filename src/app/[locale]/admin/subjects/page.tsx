import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import MapelForm from "@/components/admin/mapel-form";
import { hapusMapel } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubjects({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/subjects", locale }) } }, locale });
  const { edit } = await searchParams;
  const editId = Number(edit ?? 0);

  const mapel = await collect(db.orm.public.MataPelajaran.all());
  const kelas = await collect(db.orm.public.Kelas.all());
  const dipakai = new Map<number, number>();
  for (const k of kelas) dipakai.set(k.mataPelajaranId, (dipakai.get(k.mataPelajaranId) ?? 0) + 1);
  const editing = editId > 0 ? mapel.find((m) => m.id === editId) : undefined;

  const columns: TableColumn[] = [
    { key: "nama", header: t("text78") },
    { key: "nKelas", header: t("text92"), className: "text-center" },
    { key: "aksi", header: t("text61"), className: "text-right", sortable: false },
  ];

  const rows: TableRowData[] = mapel.map((m) => ({
    id: m.id,
    values: { nama: m.nama, nKelas: dipakai.get(m.id) ?? 0 },
    cells: {
      nama: (
        <div>
          <p className="font-semibold text-slate-900">{m.nama}</p>
          {m.deskripsi ? <p className="text-xs text-slate-500">{m.deskripsi}</p> : null}
        </div>
      ),
      nKelas: (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
            (dipakai.get(m.id) ?? 0) > 0 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
          }`}
        >
          {dipakai.get(m.id) ?? 0}
        </span>
      ),
      aksi: (
        <div className="flex items-center justify-end gap-3">
          <Link href={`/admin/subjects?edit=${m.id}`} className="text-sm font-semibold text-blue-700 hover:underline">{t("text83")} </Link>
          {(dipakai.get(m.id) ?? 0) === 0 ? (
            <ConfirmAction action={hapusMapel} label={t("text93")} confirmLabel={t("text94")}>
              <input type="hidden" name="mapel_id" value={m.id} />
            </ConfirmAction>
          ) : (
            <span className="text-xs text-slate-400" title={t("text95")}>{t("text96")} </span>
          )}
        </div>
      ),
    },
  }));

  return (
    <PageShell>
      <PageHeader title={t("text8")} desc={t("text97")} meta={t("subjectCount", { count: mapel.length })} />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="p-5">
          <DataTable
            columns={columns}
            rows={rows}
            empty={t("text98")}
            initialSort={{ key: "nama", dir: "asc" }}
            searchPlaceholder={t("text99")}
          />
        </Panel>

        <Panel className="lg:sticky lg:top-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                {editing ? t("editName", { name: editing.nama }) : t("text100")}
              </h2>
              {editing ? (
                <Link href="/admin/subjects" className="text-sm font-semibold text-slate-500 underline hover:text-slate-900">{t("text197")} </Link>
              ) : null}
            </div>
            <div className="mt-4">
              <MapelForm
                key={editing?.id ?? "baru"}
                mapelId={editing?.id}
                defaults={editing ? { nama: editing.nama, deskripsi: editing.deskripsi ?? "" } : undefined}
              />
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
