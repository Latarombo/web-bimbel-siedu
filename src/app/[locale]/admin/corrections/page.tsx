import { getLocale, getTranslations } from "next-intl/server";
import { redirect, getPathname, Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { DataTable } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel, FilterTabs, Notice } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prosesKoreksiAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

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

export default async function AdminCorrections({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; tinjau?: string; jenis?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const labelPresensi = (value: string) => (t.has && t.has(`labelPresensi_${value}`) ? t(`labelPresensi_${value}`) : value.replaceAll("_", " "));
  const fmtTanggal = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });

  const session = await auth();
  if (!session?.user) {
    return redirect({
      href: { pathname: "/login", query: { next: getPathname({ href: "/admin/corrections", locale }) } },
      locale,
    });
  }

  const { tab = "pengajuan", tinjau, jenis } = await searchParams;

  const now = new Date();
  const [presensi, nilai, pendaftaran, anak, kelas, mapel, users, pengajuan, audit] = await Promise.all([
    collect(db.orm.public.Presensi.all()),
    collect(db.orm.public.NilaiProgres.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.all()),
    collect(db.orm.public.PengajuanKoreksi.all()),
    collect(db.orm.public.AuditPerubahan.all()),
  ]);

  const pById = new Map(pendaftaran.map((p) => [p.id, p]));
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const userById = new Map(users.map((u) => [u.id, u]));

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

  const getEntitasTargetInfo = (entitas: string, entitasId: number) => {
    if (entitas === "presensi") {
      const p = presensi.find((x) => x.id === entitasId);
      if (!p) return { target: `Presensi #${entitasId}`, tanggal: "—" };
      const l = label(p.pendaftaranId);
      return { target: `${l.anak} (${l.mapel})`, tanggal: p.tanggalPertemuan };
    }
    const n = nilai.find((x) => x.id === entitasId);
    if (!n) return { target: `Nilai #${entitasId}`, tanggal: "—" };
    const l = label(n.pendaftaranId);
    return { target: `${l.anak} (${l.mapel})`, tanggal: n.tanggal };
  };

  const pendingPengajuan = pengajuan.filter((p) => p.status === "menunggu");
  const processedPengajuan = pengajuan.filter((p) => p.status !== "menunggu").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sortedAudit = [...audit].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Entri kandidat terkunci (> 7 hari)
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

  const filterKandidat = jenis === "presensi" || jenis === "nilai" ? jenis : "semua";
  const kandidatFiltered = filterKandidat === "semua" ? kandidat : kandidat.filter((k) => k.jenis === filterKandidat);

  const selectedPengajuanId = tinjau ? Number(tinjau) : pendingPengajuan[0]?.id;
  const selectedPengajuan = pendingPengajuan.find((p) => p.id === selectedPengajuanId);

  return (
    <PageShell wide>
      <PageHeader
        title={t("text149")}
        desc={t("text150")}
        meta={pendingPengajuan.length > 0 ? t("lockedCount", { count: pendingPengajuan.length }) : t("text151")}
      />

      <div className="mt-5">
        <Notice tone="blue" title={t("text152")}>
          {t("text153")}
        </Notice>
      </div>

      <div className="mt-5">
        <FilterTabs
          label="Tab Navigasi"
          tabs={[
            { label: t("correctionRequestsTab"), href: "/admin/corrections?tab=pengajuan", count: pendingPengajuan.length, aktif: tab === "pengajuan" },
            { label: t("correctionHistoryTab"), href: "/admin/corrections?tab=riwayat", count: processedPengajuan.length, aktif: tab === "riwayat" },
            { label: t("correctionAuditTab"), href: "/admin/corrections?tab=audit", count: sortedAudit.length, aktif: tab === "audit" },
            { label: t("correctionCandidatesTab"), href: "/admin/corrections?tab=kandidat", count: kandidat.length, aktif: tab === "kandidat" },
          ]}
        />
      </div>

      {tab === "pengajuan" && (
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Panel>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("correctionRequestsTab")}</h2>
            </div>
            {pendingPengajuan.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">{t("noPendingCorrections")}</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingPengajuan.map((item) => {
                  const guru = userById.get(item.guruId);
                  const targetInfo = getEntitasTargetInfo(item.entitas, item.entitasId);
                  const isSelected = item.id === selectedPengajuan?.id;
                  return (
                    <Link
                      key={item.id}
                      href={`/admin/corrections?tab=pengajuan&tinjau=${item.id}`}
                      className={`block p-4 transition-colors hover:bg-slate-50 sm:px-6 ${
                        isSelected ? "bg-blue-50/60 ring-1 ring-inset ring-blue-600/20" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {item.entitas === "presensi" ? t("attendance") : t("grades")} #{item.entitasId}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">{fmtTanggal(item.createdAt)}</span>
                        </div>
                        <Badge tone="amber">{t("statusPending")}</Badge>
                      </div>
                      <p className="mt-1 font-semibold text-slate-900">{targetInfo.target}</p>
                      <p className="text-xs text-slate-500">
                        {t("teacher")}: {guru?.name ?? `User #${item.guruId}`} · Sesi: {targetInfo.tanggal}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
                        <span className="font-medium text-slate-700">{t("correctionReason")}: </span>
                        {item.alasan}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>

          {selectedPengajuan ? (
            <Panel className="sticky top-6">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-[15px] font-bold text-slate-900">
                    {t("reviewCorrection", { defaultMessage: "Tinjau Pengajuan" })}
                  </h3>
                  <Badge tone="amber">{t("statusPending")}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  ID Pengajuan: #{selectedPengajuan.id} · {fmtTanggal(selectedPengajuan.createdAt)}
                </p>
              </div>

              <div className="space-y-4 p-4 sm:p-6">
                <div>
                  <p className="text-xs font-bold text-slate-500">{t("correctionReason")}</p>
                  <p className="mt-1 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-800">
                    {selectedPengajuan.alasan}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    <span className="font-bold text-slate-500">{t("currentData")}:</span>
                    <pre className="mt-1 font-mono text-[11px] whitespace-pre-wrap text-slate-700">
                      {selectedPengajuan.dataSebelum || "—"}
                    </pre>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5">
                    <span className="font-bold text-blue-700">{t("proposedData")}:</span>
                    <pre className="mt-1 font-mono text-[11px] whitespace-pre-wrap text-blue-900">
                      {selectedPengajuan.dataUsulan}
                    </pre>
                  </div>
                </div>

                <form action={prosesKoreksiAction} className="space-y-3">
                  <input type="hidden" name="koreksi_id" value={selectedPengajuan.id} />
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700">
                      {t("adminNote")} <span className="text-red-500">*</span>
                    </span>
                    <textarea
                      name="catatan_admin"
                      rows={3}
                      required
                      placeholder={t("adminDecisionNotePlaceholder")}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                    />
                  </label>

                  <div className="flex gap-2">
                    <Button type="submit" name="keputusan" value="setujui" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      {t("approveCorrection")}
                    </Button>
                    <Button type="submit" name="keputusan" value="tolak" variant="outline" className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50">
                      {t("rejectCorrection")}
                    </Button>
                  </div>
                </form>
              </div>
            </Panel>
          ) : null}
        </div>
      )}

      {tab === "riwayat" && (
        <Panel className="mt-5 p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold text-slate-900">{t("correctionHistoryTab")}</h2>
          {processedPengajuan.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noHistory", { defaultMessage: "Belum ada riwayat keputusan." })}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {processedPengajuan.map((item) => {
                const adminUser = item.diprosesOleh ? userById.get(item.diprosesOleh) : null;
                const guru = userById.get(item.guruId);
                const targetInfo = getEntitasTargetInfo(item.entitas, item.entitasId);
                return (
                  <div key={item.id} className="py-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{targetInfo.target}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {item.entitas} #{item.entitasId}
                        </span>
                      </div>
                      <Badge tone={item.status === "disetujui" ? "emerald" : "red"}>
                        {item.status === "disetujui" ? t("statusApproved") : t("statusRejected")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("teacher")}: {guru?.name ?? `User #${item.guruId}`} · {t("requestDate")}: {fmtTanggal(item.createdAt)}
                      {adminUser && item.updatedAt ? ` · Diproses oleh ${adminUser.name} (${fmtTanggal(item.updatedAt)})` : ""}
                    </p>
                    <p className="mt-2 text-xs text-slate-700">
                      <span className="font-medium text-slate-600">{t("correctionReason")}: </span>
                      {item.alasan}
                    </p>
                    {item.catatanAdmin ? (
                      <p className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-700">
                        <span className="font-semibold text-slate-800">{t("adminNote")}: </span>
                        {item.catatanAdmin}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === "audit" && (
        <Panel className="mt-5 p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold text-slate-900">{t("correctionAuditTab")}</h2>
          {sortedAudit.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noAuditLog", { defaultMessage: "Belum ada catatan audit." })}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedAudit.map((a) => {
                const actor = userById.get(a.aktorId);
                return (
                  <div key={a.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        [{a.aksi}] {a.entitas} #{a.entitasId}
                      </span>
                      <span className="tabular-nums text-slate-400">{fmtTanggal(a.createdAt)}</span>
                    </div>
                    <p className="text-slate-500">
                      Aktor: {actor?.name ?? `User #${a.aktorId}`} ({actor?.role ?? "system"})
                    </p>
                    {a.alasan ? <p className="mt-1 text-slate-700">Alasan: {a.alasan}</p> : null}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === "kandidat" && (
        <div className="mt-5 space-y-4">
          <FilterTabs
            label={t("text154")}
            tabs={[
              { label: t("text67"), href: "/admin/corrections?tab=kandidat", count: kandidat.length, aktif: filterKandidat === "semua" },
              { label: t("text155"), href: "/admin/corrections?tab=kandidat&jenis=presensi", count: kandidat.filter((k) => k.jenis === "presensi").length, aktif: filterKandidat === "presensi" },
              { label: t("text156"), href: "/admin/corrections?tab=kandidat&jenis=nilai", count: kandidat.filter((k) => k.jenis === "nilai").length, aktif: filterKandidat === "nilai" },
            ]}
          />
          <Panel className="p-5">
            <DataTable
              columns={[
                { key: "jenis", header: t("text145") },
                { key: "anak", header: t("text30") },
                { key: "tanggal", header: t("text146") },
                { key: "ringkas", header: t("text147") },
                { key: "createdAt", header: t("text148") },
              ]}
              rows={kandidatFiltered.map((k) => ({
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
              }))}
              empty={t("text157")}
            />
          </Panel>
        </div>
      )}
    </PageShell>
  );
}
