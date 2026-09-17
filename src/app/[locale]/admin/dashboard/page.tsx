import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rupiah } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { EnrollmentTrendChart } from "@/components/admin/enrollment-trend-chart";
import { PaymentStatusChart, type StatusSlice } from "@/components/admin/payment-status-chart";

export const dynamic = "force-dynamic";

/*
 * Dashboard admin — gaya dashboard eksplisit, TIDAK terpaku token globals.css:
 * kanvas slate-50 (layout), kartu putih border slate-200 + shadow nyata,
 * sub-wadah lapis slate-50 supaya ada kedalaman di atas kartu putih.
 * Kelas Tailwind literal, bukan border-border/bg-surface yang di putih murni
 * jadi tak terlihat (audit computed-style 13 Sep).
 */

// Konvensi DESIGN.md: top border 4px per kategori kartu dashboard.
type Kategori = "akademik" | "keuangan" | "perhatian";
const BORDER: Record<Kategori, string> = {
  akademik: "border-t-blue-600",
  keuangan: "border-t-emerald-500",
  perhatian: "border-t-amber-500",
};
const TILE: Record<Kategori, string> = {
  akademik: "bg-blue-50 text-blue-600",
  keuangan: "bg-emerald-50 text-emerald-600",
  perhatian: "bg-amber-50 text-amber-600",
};

// Kartu dasar dashboard — div biasa (Card ui/ memo rankainya template literal,
// override shadow/radius dari luar tidak andal), radius & shadow mengikuti
// skala DESIGN.md (16px, shadow-1/2) tapi dengan border slate-200 yang nyata.
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.10),0_4px_12px_-6px_rgba(15,23,42,0.08)] ${className}`}>
      {children}
    </div>
  );
}

// Ikon feather-style inline — nol dependency.
function Icon({ d, className }: { d: string; className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const P = {
  users:
    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  book: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  clipboard:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01",
  wallet: "M2 5h20v14H2zM2 10h20",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2-2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  inbox:
    "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
  trendUp: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  check: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
  chevron: "M9 18l6-6-6-6",
};

const STATUS_AKTIF = ["menunggu_pembayaran", "terdaftar", "tertunggak"];

// "YYYY-MM-DD" (DateString) → Date WIB tengah malam; aman untuk selisih hari.
function tanggalWIB(s: string): Date {
  return new Date(`${s}T00:00:00+07:00`);
}

export default async function AdminDashboard() {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/dashboard", locale }) } }, locale });

  const [users, kelas, pendaftaran, pembayaran, periode, pengajuan, pesanBaru, anak, mapel] =
    await Promise.all([
      collect(db.orm.public.User.all()),
      collect(db.orm.public.Kelas.all()),
      collect(db.orm.public.Pendaftaran.all()),
      collect(db.orm.public.Pembayaran.all()),
      collect(db.orm.public.PeriodePendaftaran.where((p) => p.status.eq("dibuka")).all()),
      collect(db.orm.public.PengajuanPembatalan.where((p) => p.status.eq("menunggu")).all()),
      collect(db.orm.public.PesanKontak.where((p) => p.status.eq("baru")).all()),
      collect(db.orm.public.Anak.all()),
      collect(db.orm.public.MataPelajaran.all()),
    ]);

  const now = new Date();
  const thisMonth = now.getFullYear() * 12 + now.getMonth();
  const monthOf = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() * 12 + d.getMonth();
  };
  const thisMonthCount = (items: { createdAt: string }[]) =>
    items.filter((x) => monthOf(x.createdAt) === thisMonth).length;
  const lastMonthCount = (items: { createdAt: string }[]) =>
    items.filter((x) => monthOf(x.createdAt) === thisMonth - 1).length;

  const daftarAktif = pendaftaran.filter((p) => STATUS_AKTIF.includes(p.status));
  const nSiswaAktif = new Set(daftarAktif.map((p) => p.anakId)).size;
  const nGuru = users.filter((u) => u.role === "guru").length;
  const kelasAktif = kelas.filter((k) => k.status === "aktif");
  const kuotaTerisi = kelasAktif.reduce((s, k) => s + k.kuotaTerisi, 0);
  const kuotaTotal = kelasAktif.reduce((s, k) => s + k.kuotaMaksimum, 0);
  const pctKuota = kuotaTotal > 0 ? Math.round((kuotaTerisi / kuotaTotal) * 100) : 0;
  const nTunggakan = pendaftaran.filter((p) => p.status === "tertunggak").length;
  const nMenungguBayar = pendaftaran.filter((p) => p.status === "menunggu_pembayaran").length;
  const bayarBerhasil = pembayaran.filter((b) => b.status === "berhasil");
  const nBayarPending = pembayaran.filter((b) => b.status === "pending").length;
  const nBayarGagal = pembayaran.filter((b) => b.status === "gagal").length;
  const perluTindakan = nTunggakan + pengajuan.length + nMenungguBayar + pesanBaru.length;

  const bulanIni = thisMonthCount(pendaftaran);
  const bulanLalu = lastMonthCount(pendaftaran);

  const stats: {
    label: string;
    value: string;
    sub: React.ReactNode;
    href: string | null;
    kategori: Kategori;
    icon: string;
    bar?: number;
  }[] = [
    {
      label: t("text15"),
      value: String(nSiswaAktif),
      sub: t("childrenTotal", { count: anak.length }),
      href: null,
      kategori: "akademik",
      icon: P.users,
    },
    {
      label: t("text10"),
      value: String(nGuru),
      sub: t("teachingActive", { count: kelasAktif.length }),
      href: "/admin/teachers",
      kategori: "akademik",
      icon: P.book,
    },
    {
      label: t("text16"),
      value: String(kelasAktif.length),
      sub: t("capacitySummary", { percent: pctKuota, filled: kuotaTerisi, total: kuotaTotal }),
      href: "/admin/classes",
      kategori: "akademik",
      icon: P.layers,
      bar: pctKuota,
    },
    {
      label: t("text17"),
      value: String(bulanIni),
      sub: t("lastMonth", { count: bulanLalu }),
      href: "/admin/enrollments/flagged",
      kategori: "akademik",
      icon: P.clipboard,
    },
    {
      label: t("text18"),
      value: rupiah(bayarBerhasil.reduce((s, b) => s + Number(b.jumlah), 0)),
      sub: t("successfulPayments", { count: bayarBerhasil.length }),
      href: "/admin/reports",
      kategori: "keuangan",
      icon: P.wallet,
    },
  ];

  // Tren pendaftaran 6 bulan terakhir (dari createdAt).
  const bulan: { label: string; n: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const n = pendaftaran.filter((p) => {
      const t = new Date(p.createdAt);
      return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth();
    }).length;
    bulan.push({ label: d.toLocaleString(locale === "en" ? "en-GB" : "id-ID", { month: "short" }), n });
  }
  const rata2Bulan = (bulan.reduce((s, b) => s + b.n, 0) / 6).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // Status pembayaran (donut) — warna literal palet dashboard, bukan var token.
  const slices: StatusSlice[] = [
    { key: "berhasil", label: t("text19"), n: bayarBerhasil.length, color: "#10b981" },
    { key: "pending", label: t("text20"), n: nBayarPending, color: "#f59e0b" },
    { key: "gagal", label: t("text21"), n: nBayarGagal, color: "#e11d48" },
  ].filter((s) => s.n > 0);

  const antrean: { label: string; hint: string; n: number; href: string }[] = [
    { label: t("text22"), hint: t("text23"), n: nTunggakan, href: "/admin/enrollments/flagged?status=tertunggak" },
    { label: t("text24"), hint: t("text25"), n: nMenungguBayar, href: "/admin/enrollments/flagged" },
    { label: t("text26"), hint: t("text27"), n: pengajuan.length, href: "/admin/refunds" },
    { label: t("text28"), hint: t("text29"), n: pesanBaru.length, href: "/admin/messages?status=baru" },
  ];

  // Periode dibuka terdekat — hitung hari nyata ke tanggal tutup pendaftaran.
  const periodeTerkini = periode
    .map((p) => ({ p, sisa: Math.ceil((tanggalWIB(p.tanggalTutupPendaftaran).getTime() - now.getTime()) / 86_400_000) }))
    .sort((a, b) => a.sisa - b.sisa)[0];

  // Tabel pendaftaran terbaru — 6 baris terakhir (ReactNode sel dirender server).
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const terbaru = [...pendaftaran]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const columns: TableColumn[] = [
    { key: "anak", header: t("text30") },
    { key: "kelas", header: t("text11") },
    { key: "createdAt", header: t("text31") },
    { key: "status", header: t("text32") },
  ];
  const rows: TableRowData[] = terbaru.map((p) => {
    const a = anakById.get(p.anakId);
    const k = kelasById.get(p.kelasId);
    const mapelNama = mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? "—";
    return {
      id: p.id,
      values: {
        anak: a?.nama ?? t("childFallback", { id: p.anakId }),
        kelas: mapelNama,
        createdAt: p.createdAt,
        status: p.status,
      },
      cells: {
        anak: (
          <span className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-bold leading-none text-blue-700">
              {(a?.nama ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <span className="font-semibold text-slate-900">{a?.nama ?? t("childFallback", { id: p.anakId })}</span>
          </span>
        ),
        kelas: (
          <span className="text-slate-600">
            {mapelNama}
            {k ? <span className="text-slate-400"> · {k.jenjang}</span> : null}
          </span>
        ),
        createdAt: (
          <span className="text-slate-500 tabular-nums">
            {new Date(p.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            })}
          </span>
        ),
        status: <StatusBadge status={p.status as never} />,
      },
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* HEADER + konteks periode + aksi cepat */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-[26px]">{t("text33")} </h1>
          <p className="mt-1 text-sm text-slate-500">{t("text34")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={getPathname({ href: "/admin/classes/new", locale })} variant="outline" size="sm">{t("text35")} </ButtonLink>
          <ButtonLink href={getPathname({ href: "/admin/reports", locale })} size="sm">{t("text36")} </ButtonLink>
        </div>
      </div>

      {/* STRIP STATUS PERIODE — bar gelap tipis sebagai jangkar visual halaman */}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-slate-300">
        <Icon d={P.calendar} className="h-4 w-4 flex-shrink-0 text-blue-400" />
        {periodeTerkini ? (
          <>
            <span className="font-semibold text-white">{periodeTerkini.p.nama}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            {periodeTerkini.sisa > 30 ? (
              <span>{t("closesIn", { days: periodeTerkini.sisa })}</span>
            ) : periodeTerkini.sisa > 0 ? (
              <span className="font-semibold text-amber-300">{t("closesSoon", { days: periodeTerkini.sisa })}</span>
            ) : periodeTerkini.sisa === 0 ? (
              <span className="font-semibold text-amber-300">{t("text37")}</span>
            ) : (
              <span className="text-slate-400">{t("closedAgo", { days: Math.abs(periodeTerkini.sisa) })}</span>
            )}
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{t("activeEnrollmentsCount", { count: daftarAktif.length })}</span>
          </>
        ) : (
          <>
            <span>{t("text38")}</span>
            <Link
              href="/admin/periods"
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >{t("text39")} </Link>
          </>
        )}
      </div>

      {/* BANNER perlu perhatian — actionable, angka nyata */}
      {perluTindakan > 0 ? (
        <Panel className="mt-4 border-amber-300 bg-amber-50 shadow-none">
          <div className="flex flex-col items-start justify-between gap-3 p-4 sm:p-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Icon d={P.alert} className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  {t("actionCount", { count: perluTindakan })}
                </p>
                <p className="mt-0.5 text-sm text-amber-800">
                  {[
                    nTunggakan > 0 ? t("overdueCount", { count: nTunggakan }) : null,
                    nMenungguBayar > 0 ? t("awaitingPaymentCount", { count: nMenungguBayar }) : null,
                    pengajuan.length > 0 ? t("cancellationCount", { count: pengajuan.length }) : null,
                    pesanBaru.length > 0 ? t("newMessageCount", { count: pesanBaru.length }) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-2">
              <Link
                href="/admin/enrollments/flagged"
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
              >{t("text40")} </Link>
              <Link
                href="/admin/refunds"
                className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
              >{t("text41")} </Link>
            </div>
          </div>
        </Panel>
      ) : null}

      {/* KPI CARDS */}
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <li key={s.label}>
            <Panel className={`h-full border-t-4 ${BORDER[s.kategori]} transition-shadow hover:shadow-[0_4px_12px_-2px_rgba(15,23,42,0.1)]`}>
              <div className="flex h-full flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${TILE[s.kategori]}`}>
                    <Icon d={s.icon} className="h-[18px] w-[18px]" />
                  </span>
                  {s.href ? (
                    <Link
                      href={s.href}
                      aria-label={t("openLabel", { label: s.label })}
                      className="grid h-7 w-7 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-slate-50 hover:text-blue-600"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                        <path d="M7 17L17 7M9 7h8v8" />
                      </svg>
                    </Link>
                  ) : null}
                </div>
                <p className="mt-3 font-display text-2xl font-extrabold leading-none tracking-tight tabular-nums text-slate-900 sm:text-[26px]">
                  {s.value}
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-slate-700">{s.label}</p>
                {s.bar !== undefined ? (
                  <div className="mt-2" role="progressbar" aria-valuenow={s.bar} aria-valuemin={0} aria-valuemax={100} aria-label={t("text42")}>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, s.bar))}%` }} />
                    </div>
                  </div>
                ) : null}
                <p className={`text-xs text-slate-500 ${s.bar !== undefined ? "mt-1.5" : "mt-auto pt-1.5"}`}>{s.sub}</p>
              </div>
            </Panel>
          </li>
        ))}
      </ul>

      {/* Grid dua kolom: kiri = TREN + TABEL (tumpuk), kanan = DONUT + ANTREAN */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel>
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("text43")}</h2>
                <p className="text-xs text-slate-500">{t("text44")}</p>
              </div>
              {bulanIni > bulanLalu ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <Icon d={P.trendUp} className="h-3.5 w-3.5" />
                  {t("monthIncrease", { count: bulanIni - bulanLalu })}
                </span>
              ) : null}
            </div>
            <div className="mt-4">
              <EnrollmentTrendChart data={bulan.map((b) => ({ label: b.label, n: b.n }))} />
            </div>
            {/* Sub-metri di bawah sumbu — lapis slate-50 supaya terbaca di kartu putih */}
            <dl className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50">
              <div className="px-4 py-3">
                <dt className="text-xs text-slate-500">{t("text45")}</dt>
                <dd className="mt-1 font-display text-lg font-extrabold tabular-nums text-slate-900">{bulanIni}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-xs text-slate-500">{t("text46")}</dt>
                <dd className="mt-1 font-display text-lg font-extrabold tabular-nums text-slate-900">{rata2Bulan}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-xs text-slate-500">{t("text47")}</dt>
                <dd className="mt-1 font-display text-lg font-extrabold tabular-nums text-slate-900">{daftarAktif.length}</dd>
              </div>
            </dl>
          </div>
        </Panel>

        {/* PENDAFTARAN TERBARU — DataTable yang sama dengan halaman list lain */}
        <Panel>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("text48")}</h2>
                <p className="text-xs text-slate-500">{t("text49")}</p>
              </div>
              <ButtonLink href={getPathname({ href: "/admin/enrollments/flagged", locale })} variant="outline" size="sm">{t("text50")} </ButtonLink>
            </div>
            <div className="mt-4">
              <DataTable
                columns={columns}
                rows={rows}
                initialSort={{ key: "createdAt", dir: "desc" }}
                empty={t("text51")}
              />
            </div>
          </div>
        </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel>
            <div className="p-4 sm:p-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("text52")}</h2>
              <p className="text-xs text-slate-500">{t("midtransCount", { count: pembayaran.length })}</p>
              {slices.length > 0 ? (
                <div className="mt-3">
                  <PaymentStatusChart slices={slices} total={pembayaran.length} />
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">{t("text53")}</p>
                  <ButtonLink href={getPathname({ href: "/admin/reports", locale })} variant="outline" size="sm">{t("text54")} </ButtonLink>
                </div>
              )}
            </div>
          </Panel>

          <Panel className="flex-1">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("text55")}</h2>
                {perluTindakan > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-amber-800">
                    {perluTindakan}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">{t("text56")}</p>
              {antrean.every((a) => a.n === 0) ? (
                <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <Icon d={P.check} className="h-6 w-6 text-emerald-500" />
                  <p className="text-sm text-slate-500">{t("text57")}</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {antrean.map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className={`group flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                        a.n > 0
                          ? "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/60"
                          : "border-slate-100 bg-white opacity-70"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-snug text-slate-800">
                          {a.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{a.hint}</span>
                      </span>
                      <span className="flex flex-shrink-0 items-center gap-1.5 pt-0.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-sm font-bold tabular-nums ${
                            a.n > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {a.n}
                        </span>
                        <Icon d={P.chevron} className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
