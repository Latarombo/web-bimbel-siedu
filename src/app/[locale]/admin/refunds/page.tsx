import { getLocale, getTranslations } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import { PageShell, PageHeader, Panel, FilterTabs } from "@/components/admin/ui";
import { prosesPengajuan } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

// E7 — verifikasi pengajuan pembatalan. Baris ringkas + panel keputusan (pola
// ticket queue: keputusan pindah ke panel, tidak menumpuk form di tabel).
export default async function AdminRefunds({
  searchParams,
}: {
  searchParams: Promise<{ riwayat?: string; tinjau?: string; cari?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const labelPembatalan = (value: string) => t.has(`labelPembatalan_${value}`) ? t(`labelPembatalan_${value}`) : value.replaceAll("_", " ");
  const labelKategoriBatal = (value: string) => t.has(`labelKategoriBatal_${value}`) ? t(`labelKategoriBatal_${value}`) : value.replaceAll("_", " ");
  const fmtTanggal = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/refunds", locale }) } }, locale });
  const { riwayat, tinjau, cari } = await searchParams;
  const tampilkanRiwayat = riwayat === "1";
  const term = (cari ?? "").trim().toLowerCase();

  const [pengajuan, pendaftaran, anak, kelas, mapel, admin, pembayaran] = await Promise.all([
    collect(db.orm.public.PengajuanPembatalan.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("admin")).all()),
    collect(db.orm.public.Pembayaran.all()),
  ]);
  const pById = new Map(pendaftaran.map((p) => [p.id, p]));
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const adminById = new Map(admin.map((a) => [a.id, a]));
  const bayarByPend = new Map<number, { jumlah: number; status: string }[]>();
  for (const b of pembayaran) {
    const arr = bayarByPend.get(b.pendaftaranId) ?? [];
    arr.push({ jumlah: Number(b.jumlah), status: b.status });
    bayarByPend.set(b.pendaftaranId, arr);
  }

  const menunggu = pengajuan.filter((p) => p.status === "menunggu");
  const daftar = [...pengajuan]
    .filter((p) => (tampilkanRiwayat ? true : p.status === "menunggu"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Info lengkap per pengajuan — dipakai baris list, panel, dan pencarian.
  const info = (q: (typeof pengajuan)[number]) => {
    const p = pById.get(q.pendaftaranId);
    const a = p ? anakById.get(p.anakId) : undefined;
    const k = p ? kelasById.get(p.kelasId) : undefined;
    const tagihan = p ? bayarByPend.get(p.id) ?? [] : [];
    const total = tagihan.reduce((acc, t) => acc + t.jumlah, 0);
    return {
      anakNama: a?.nama ?? t("childFallback", { id: p?.anakId ?? "?" }),
      kelasLabel: `${mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? "—"} · ${k?.jenjang ?? "—"}`,
      nominal: total,
      alasan: q.alasan,
      kategori: q.kategori,
      pendaftaranId: q.pendaftaranId,
      pencarian: `${a?.nama ?? ""} ${mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? ""} ${q.alasan}`.toLowerCase(),
    };
  };
  const tampil = term ? daftar.filter((q) => info(q).pencarian.includes(term)) : daftar;
  const selected = pengajuan.find((q) => q.id === Number(tinjau ?? 0)) ?? (!tampilkanRiwayat ? menunggu[0] : undefined);

  const tabs = [
    { label: t("text160"), href: "/admin/refunds", count: menunggu.length, aktif: !tampilkanRiwayat, attention: menunggu.length > 0 },
    { label: t("text161"), href: "/admin/refunds?riwayat=1", count: pengajuan.length - menunggu.length, aktif: tampilkanRiwayat },
  ];

  return (
    <PageShell wide>
      <PageHeader
        title={t("text162")}
        desc={t("text163")}
        meta={menunggu.length > 0 ? t("waitingCount", { count: menunggu.length }) : undefined}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs label={t("text164")} tabs={tabs} />
        {pengajuan.length > 0 || term ? (
          <form className="flex w-full items-center gap-2 sm:w-auto" action={getPathname({ href: "/admin/refunds", locale })}>
            {tampilkanRiwayat ? <input type="hidden" name="riwayat" value="1" /> : null}
            <input
              type="search"
              name="cari"
              defaultValue={cari ?? ""}
              placeholder={t("text165")}
              className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 sm:w-64"
            />
            <Button type="submit" variant="outline" size="sm">{t("text166")} </Button>
          </form>
        ) : null}
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
        {/* LIST RINGKAS */}
        <Panel className="min-w-0">
          {tampil.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-16">
              <span className={`grid size-12 place-items-center rounded-full ${tampilkanRiwayat ? "bg-slate-100" : "bg-emerald-50"}`}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-6 ${tampilkanRiwayat ? "text-slate-400" : "text-emerald-600"}`}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
                </svg>
              </span>
              <p className="mt-4 text-sm font-bold text-slate-900">
                {term ? t("text167") : tampilkanRiwayat ? t("text168") : t("text169")}
              </p>
              <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-slate-500">
                {term
                  ? t("text170")
                  : tampilkanRiwayat
                    ? t("text171")
                    : t("text172")}
              </p>
              {term ? (
                <Link href={`/admin/refunds${tampilkanRiwayat ? "?riwayat=1" : ""}`} className="mt-3 text-sm font-semibold text-blue-700 hover:underline">{t("text173")} </Link>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tampil.map((q) => {
                const i = info(q);
                const isSel = selected?.id === q.id;
                return (
                  <li key={q.id}>
                    <Link
                      href={`/admin/refunds${tampilkanRiwayat ? "?riwayat=1" : ""}${tampilkanRiwayat ? "&" : "?"}tinjau=${q.id}${term ? `&cari=${encodeURIComponent(term)}` : ""}`}
                      className={`flex items-start gap-3 px-4 py-4 transition-colors sm:px-5 ${isSel ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                    >
                      <span className={`mt-0.5 size-2 shrink-0 rounded-full ${q.status === "menunggu" ? "bg-amber-500" : q.status === "disetujui" ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">{i.anakNama}</span>
                          <span className="flex-shrink-0 text-xs tabular-nums text-slate-400">{fmtTanggal(q.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {i.kelasLabel} · {labelKategoriBatal(i.kategori)}
                          {i.nominal > 0 ? t("invoiceAmount", { amount: rupiah(i.nominal) }) : ""}
                        </span>
                        <span className="mt-1 block line-clamp-1 text-xs text-slate-400">{i.alasan}</span>
                      </span>
                      {q.status !== "menunggu" ? (
                        <Badge tone={q.status === "disetujui" ? "emerald" : "red"}>{labelPembatalan(q.status)}</Badge>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* PANEL KEPUTUSAN */}
        <div className="lg:sticky lg:top-6">
          {selected ? (
            (() => {
              const i = info(selected);
              return (
                <Panel className="min-w-0">
                  <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="truncate font-display text-[15px] font-bold tracking-tight text-slate-900">{i.anakNama}</h2>
                      <Badge tone={selected.status === "disetujui" ? "emerald" : selected.status === "ditolak" ? "red" : "amber"}>
                        {labelPembatalan(selected.status)}
                      </Badge>
                    </div>
                    {/* Satu baris panjang di HP membuat teks sesak; uraikan per bagian. */}
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {t("requestSubmitted", { className: i.kelasLabel, date: fmtTanggal(selected.createdAt) })}
                      <span className="mt-0.5 block text-slate-400">
                        {t("requestIds", { requestId: selected.id, enrollmentId: selected.pendaftaranId })}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-4 p-4 sm:p-6">
                    <div>
                      <p className="text-xs font-bold text-slate-500">{t("text174")}</p>
                      <p className="mt-1.5 whitespace-pre-line rounded-lg bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-800">{i.alasan}</p>
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">{t("text175")}</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">{labelKategoriBatal(i.kategori)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">{t("text176")}</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{i.nominal > 0 ? rupiah(i.nominal) : t("text177")}</dd>
                      </div>
                    </dl>
                    {selected.status === "menunggu" ? (
                      <form action={prosesPengajuan} className="space-y-3">
                        <input type="hidden" name="pengajuan_id" value={selected.id} />
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-900">{t("text178")} <span className="text-danger" aria-hidden="true">*</span>
                          </span>
                          <textarea
                            name="catatan_admin"
                            rows={3}
                            required
                            maxLength={500}
                            placeholder={t("text179")}
                            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                          />
                        </label>
                        <div className="flex gap-2">
                          <Button type="submit" name="keputusan" value="disetujui" className="flex-1 bg-emerald-600 hover:bg-emerald-700">{t("text180")} </Button>
                          <Button type="submit" name="keputusan" value="ditolak" variant="outline" className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50">{t("text181")} </Button>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-400">{t("text182")} </p>
                      </form>
                    ) : (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm">
                        <p className="font-semibold text-slate-900">
                          {t("decision", { status: selected.status === "disetujui" ? t("approvedLower") : t("rejectedLower") })}
                          {selected.diprosesPada ? ` · ${fmtTanggal(selected.diprosesPada)}` : ""}
                          {selected.diprosesOleh ? t("processedBy", { name: adminById.get(selected.diprosesOleh)?.name ?? "admin" }) : ""}
                        </p>
                        {selected.catatanAdmin ? (
                          <p className="mt-1 whitespace-pre-line text-slate-600">{selected.catatanAdmin}</p>
                        ) : (
                          <p className="mt-1 text-slate-400">{t("text183")}</p>
                        )}
                      </div>
                    )}
                  </div>
                </Panel>
              );
            })()
          ) : tampilkanRiwayat ? (
            <Panel>
              <div className="p-4 text-sm text-slate-500 sm:p-6">{t("text184")} </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
