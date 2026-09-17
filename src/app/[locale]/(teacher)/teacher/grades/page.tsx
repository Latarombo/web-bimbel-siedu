import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { PageShell, PageHeader, Panel, FilterTabs } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function TeacherGrades({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/grades", locale });
  const { kelas: kelasParam } = await searchParams;
  const guruId = Number(session.user.id);

  const kelas = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );
  const kelasIds = new Set(kelas.map((k) => k.id));
  const mapel = await collect(db.orm.public.MataPelajaran.all());
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  const [semuaPendaftaran, semuaAnak, semuaNilai] = await Promise.all([
    kelas.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in([...kelasIds])).all())
      : Promise.resolve([]),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
  ]);
  const anakById = new Map(semuaAnak.map((a) => [a.id, a]));
  const nilaiByP = new Map<number, typeof semuaNilai>();
  for (const n of semuaNilai) {
    const arr = nilaiByP.get(n.pendaftaranId) ?? [];
    arr.push(n);
    nilaiByP.set(n.pendaftaranId, arr);
  }

  const siswa = semuaPendaftaran.filter((p) => ["terdaftar", "tertunggak"].includes(p.status));
  const rows = siswa.map((p) => {
    const nilai = (nilaiByP.get(p.id) ?? []).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const k = kelas.find((x) => x.id === p.kelasId);
    return {
      p,
      anak: anakById.get(p.anakId),
      kelas: k,
      jumlah: nilai.length,
      rata: (() => {
        const num = nilai.filter((n) => n.nilaiKuantitatif != null).map((n) => Number(n.nilaiKuantitatif));
        return num.length ? Math.round(num.reduce((s, v) => s + v, 0) / num.length) : null;
      })(),
      terakhir: nilai[0]?.tanggal,
    };
  });

  const aktif = rows.filter((r) => r.jumlah > 0).length;
  const belum = rows.length - aktif;
  const shown = kelasParam === "belum" ? rows.filter((r) => r.jumlah === 0) : rows;

  return (
    <PageShell>
      <PageHeader
        title={t("gradesTitle")}
        desc={t("gradesDescription")}
        meta={t("gradedCounts", { graded: aktif, ungraded: belum })}
      />

      <FilterTabs
        label={t("filterStudents")}
        tabs={[
          { label: t("allStudents"), href: "/teacher/grades", count: rows.length, aktif: !kelasParam },
          { label: t("noGrades"), href: "/teacher/grades?kelas=belum", count: belum, aktif: kelasParam === "belum", attention: belum > 0 },
        ]}
      />

      {shown.length === 0 ? (
        <Panel className="mt-4">
          <div className="px-4 py-14 text-center sm:px-6">
            <p className="text-sm font-bold text-slate-900">
              {rows.length === 0 ? t("noActiveStudents") : t("allStudentsGraded")}
            </p>
            <p className="mt-1 text-[13px] text-slate-500">
              {rows.length === 0
                ? t("studentsApprovalHelp")
                : t("newEntriesHelp")}
            </p>
            {kelasParam ? (
              <Link href="/teacher/grades" className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline">
                {t("viewAllStudents")}
              </Link>
            ) : null}
          </div>
        </Panel>
      ) : (
        <Panel className="mt-4">
          {/* Tabel boleh lebih lebar dari layar HP — gulir horizontal, kolom sudah dirampingkan di bawah. */}
          <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-600">
                <th className="px-4 py-3 sm:px-6">{t("student")}</th>
                <th className="hidden px-4 py-3 md:table-cell">{t("class")}</th>
                <th className="px-4 py-3 text-center">{t("entries")}</th>
                <th className="px-4 py-3 text-center">{t("average")}</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">{t("latest")}</th>
                <th className="px-4 py-3 text-right sm:px-6">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map(({ p, anak, kelas: k, jumlah, rata, terakhir }) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${jumlah === 0 ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                        {(anak?.nama ?? "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{anak?.nama ?? t("childFallback", { id: p.anakId })}</p>
                        <p className="text-xs text-slate-500 md:hidden">{k ? `${mapelById.get(k.mataPelajaranId)?.nama} · ${k.jenjang}` : "—"}</p>
                        {/* Kolom Terakhir juga disembunyikan di HP — mirror di baris kecil yang sama. */}
                        <p className="text-xs text-slate-500 sm:hidden">{t("lastGraded", { date: terakhir ? new Date(`${terakhir}T00:00:00+07:00`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { timeZone: "Asia/Jakarta" }) : "—" })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                    {k ? `${mapelById.get(k.mataPelajaranId)?.nama ?? t("class")} · ${k.jenjang}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-slate-700">{jumlah}</td>
                  <td className="px-4 py-3 text-center">
                    {rata != null ? (
                      <Badge tone={rata >= 75 ? "emerald" : "brand"}>{rata}</Badge>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700">{t("ungraded")}</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs tabular-nums text-slate-500 sm:table-cell">
                    {terakhir ? new Date(`${terakhir}T00:00:00+07:00`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { timeZone: "Asia/Jakarta" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right sm:px-6">
                    <Link href={`/teacher/grades/${p.id}`} className="text-sm font-semibold text-blue-700 hover:underline">
                      {jumlah === 0 ? t("enterGrade") : t("manage")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600 sm:px-6">
            {t("shownStudents", { shown: shown.length, total: rows.length })}
          </p>
        </Panel>
      )}
    </PageShell>
  );
}
