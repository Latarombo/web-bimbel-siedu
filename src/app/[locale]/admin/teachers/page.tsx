import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { hapusGuru } from "@/app/actions/admin";
import GuruForm from "@/components/admin/guru-form";

export const dynamic = "force-dynamic";

export default async function AdminTeachers({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/teachers", locale }) } }, locale });
  const { edit } = await searchParams;
  const editId = Number(edit ?? 0);

  const guru = await collect(db.orm.public.User.where((u) => u.role.eq("guru")).all());
  const [kelas, presensi, nilai] = await Promise.all([
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.Presensi.all()),
    collect(db.orm.public.NilaiProgres.all()),
  ]);
  const nKelas = new Map<number, number>();
  for (const k of kelas) nKelas.set(k.guruId, (nKelas.get(k.guruId) ?? 0) + 1);
  const catat = new Map<number, number>();
  for (const x of presensi) catat.set(x.dicatatOleh, (catat.get(x.dicatatOleh) ?? 0) + 1);
  for (const n of nilai) catat.set(n.dicatatOleh, (catat.get(n.dicatatOleh) ?? 0) + 1);

  const editing = editId > 0 ? guru.find((g) => g.id === editId) : undefined;
  const mengampu = guru.filter((g) => (nKelas.get(g.id) ?? 0) > 0).length;

  const columns: TableColumn[] = [
    { key: "nama", header: t("text78") },
    { key: "email", header: t("text79") },
    { key: "telepon", header: t("text80") },
    { key: "nKelas", header: t("text81"), className: "text-center" },
    { key: "catatan", header: t("text82"), className: "text-center" },
    { key: "aksi", header: t("text61"), className: "text-right", sortable: false },
  ];

  const rows: TableRowData[] = guru.map((g) => {
    const bisaHapus = (nKelas.get(g.id) ?? 0) === 0 && (catat.get(g.id) ?? 0) === 0;
    return {
      id: g.id,
      values: { nama: g.name, email: g.email, telepon: g.nomorTelepon ?? "", nKelas: nKelas.get(g.id) ?? 0 },
      cells: {
        nama: (
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
              {g.name.trim().charAt(0).toUpperCase()}
            </span>
            <span className="font-semibold text-slate-900">{g.name}</span>
          </div>
        ),
        email: <span className="text-slate-500">{g.email}</span>,
        telepon: <span className="tabular-nums text-slate-500">{g.nomorTelepon || "—"}</span>,
        nKelas: (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
              (nKelas.get(g.id) ?? 0) > 0 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
            }`}
          >
            {nKelas.get(g.id) ?? 0}
          </span>
        ),
        catatan: (
          <span className="text-sm tabular-nums text-slate-500">
            {(catat.get(g.id) ?? 0) > 0 ? t("entryCount", { count: catat.get(g.id) ?? 0 }) : "—"}
          </span>
        ),
        aksi: (
          <div className="flex items-center justify-end gap-3">
            <Link href={`/admin/teachers?edit=${g.id}`} className="text-sm font-semibold text-blue-700 hover:underline">{t("text83")} </Link>
            {bisaHapus ? (
              <ConfirmAction action={hapusGuru} confirmLabel={t("text84")}>
                <input type="hidden" name="guru_id" value={g.id} />
              </ConfirmAction>
            ) : (
              <span
                className="cursor-help text-sm font-semibold text-slate-400"
                title={t("text85")}
              >{t("text86")} </span>
            )}
          </div>
        ),
      },
    };
  });

  return (
    <PageShell>
      <PageHeader
        title={t("text10")}
        desc={t("text87")}
        meta={t("teachersAssigned", { count: mengampu, total: guru.length })}
      />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="p-5">
          <DataTable
            columns={columns}
            rows={rows}
            empty={t("text88")}
            initialSort={{ key: "nama", dir: "asc" }}
            searchPlaceholder={t("text89")}
          />
        </Panel>

        <Panel className="lg:sticky lg:top-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                {editing ? t("editName", { name: editing.name }) : t("text90")}
              </h2>
              {editing ? (
                <Link href="/admin/teachers" className="text-sm font-semibold text-slate-500 underline hover:text-slate-900">{t("text197")} </Link>
              ) : null}
            </div>
            <div className="mt-4">
              <GuruForm
                key={editing?.id ?? "baru"}
                guruId={editing?.id}
                defaults={
                  editing
                    ? {
                        nama: editing.name,
                        email: editing.email,
                        alamat: editing.alamat ?? "",
                        nomorTelepon: editing.nomorTelepon ?? "",
                      }
                    : undefined
                }
              />
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">{t("text91")} </p>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
