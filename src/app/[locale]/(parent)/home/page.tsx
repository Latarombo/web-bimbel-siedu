import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, type StatusPendaftaran } from "@/components/status-badge";
import { ProgressRow, SegmentBar } from "@/components/ui/progress-row";
import { NilaiTrendChart } from "@/components/parent/nilai-trend-chart";
import { RingProgres, GridKehadiran } from "@/components/parent/visual-ring";
import { dashboardOrangTua } from "@/lib/orang-tua-dashboard";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

function tanggalPendek(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function Judul({
  children,
  aksi,
}: {
  children: React.ReactNode;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <h2 className="min-w-0 text-sm font-bold uppercase tracking-wide text-muted">
        {children}
      </h2>
      {aksi}
    </div>
  );
}

export default async function ParentHome({
  searchParams,
}: {
  searchParams: Promise<{ anak?: string }>;
}) {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({href: "/login?next=/home", locale});
  }
  const ortuId = Number(session.user.id);
  const { anak: anakParam } = await searchParams;

  const anakList = await dashboardOrangTua(ortuId);

  if (anakList.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
             {tr("text078")} {session.user.name ?? tr("text079")}
          </h1>
          <p className="mt-1 text-sm text-muted">
             {tr("text080")} </p>
        </header>
        <Card>
          <CardPad className="text-center">
            <p className="text-base font-semibold">{tr("text081")}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
               {tr("text082")} </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <ButtonLink href="/children/new">{tr("text008")}</ButtonLink>
              <ButtonLink href="/classes" variant="outline">
                 {tr("text015")} </ButtonLink>
            </div>
          </CardPad>
        </Card>
      </div>
    );
  }

  // S1 — anak aktif: ?anak=<id>, default yang paling butuh perhatian (sudah terurut).
  const dipilih =
    anakList.find((a) => String(a.id) === anakParam) ?? anakList[0];
  const tagihanMenunggu = anakList.filter(
    (a) => (a.tagihan?.belumDibayar ?? 0) > 0,
  ).length;
  const t = dipilih.tagihan;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* S0 — Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
             {tr("text078")} {session.user.name ?? tr("text079")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {anakList.length}  {tr("text083")}{" "}
            {tagihanMenunggu > 0 ? (
              <>
                <span className="font-semibold text-rose-600">
                  {tagihanMenunggu}  {tr("text084")} </span>
              </>
            ) : (
              tr("text085")
            )}
            .
          </p>
        </div>
        <ButtonLink href="/children/new" variant="outline">
           {tr("text008")} </ButtonLink>
      </header>

      {/* S1 — Switcher anak (pill; pola Badge tidak punya className → inline span) */}
      <nav aria-label={tr("text086")} className="flex flex-wrap gap-2">
        {anakList.map((a) => {
          const on = a.id === dipilih.id;
          // Warna dot harus literal di source — Tailwind v4 scan statis, string
          // hasil replace() runtime tidak ikut dibuatkan utility-nya.
          const dot = a.tertunggak
            ? "bg-rose-500"
            : (a.tagihan?.belumDibayar ?? 0) > 0
              ? "bg-amber-500"
              : "bg-emerald-500";
          return (
            <Link
              key={a.id}
              href={`/home?anak=${a.id}`}
              aria-current={on ? "page" : undefined}
              className={`inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                on
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:text-brand"
              }`}
            >
              {a.nama}
              <span
                className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white/80" : dot}`}
              />
              {a.jenjang ? (
                <span
                  className={`text-xs font-medium ${on ? "text-white/80" : "text-muted"}`}
                >
                  {a.jenjang}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Identitas anak terpilih — pusat kartu, semuanya mengelilingi dia.
          Banner biru + ring amber: bahasa visual referensi #1 (progress report). */}
      <Card className="mt-6 overflow-hidden border-blue-200 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 p-4 sm:p-6">
          <RingProgres
            pct={dipilih.persenHadir ?? 0}
            label="kehadiran"
            tone={
              (dipilih.persenHadir ?? 0) >= 80
                ? "emerald"
                : (dipilih.persenHadir ?? 0) >= 60
                  ? "amber"
                  : "blue"
            }
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold tracking-tight">{dipilih.nama}</p>
            <p className="text-sm text-white/75">
              {dipilih.kelas
                ? `${dipilih.kelas.mapel} · Guru ${dipilih.kelas.guru}`
                : tr("text087")}
              {dipilih.jenjang ? ` · Jenjang ${dipilih.jenjang}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {dipilih.status ? (
                <StatusBadge status={dipilih.status as StatusPendaftaran} />
              ) : (
                <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                   {tr("text088")} </span>
              )}
              {t && t.belumDibayar > 0 ? (
                <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                   {tr("text089")} {rupiah(t.belumDibayar)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="w-full sm:w-auto">
            {dipilih.pendaftaranId ? (
              <Link
                href={`/enrollments/${dipilih.pendaftaranId}`}
                className="text-sm font-semibold text-white underline-offset-4 hover:underline"
              >
                 {tr("text090")} </Link>
            ) : (
              <Link
                href="/classes"
                className="text-sm font-semibold text-white underline-offset-4 hover:underline"
              >
                 {tr("text091")} </Link>
            )}
          </div>
        </div>
      </Card>

      {dipilih.menungguPembayaran ? (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <CardPad className="py-3">
            <p className="text-sm text-amber-800">
               {tr("text092")} </p>
          </CardPad>
        </Card>
      ) : null}
      {dipilih.tertunggak ? (
        <Card className="mt-4 border-rose-200 bg-rose-50">
          <CardPad className="py-3">
            <p className="text-sm text-rose-700">
               {tr("text093")} </p>
          </CardPad>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* S2 — Yang perlu kamu bayar */}
        <Card className="border-t-4 border-t-emerald-500">
          <CardPad>
            <Judul
              aksi={
                <Link
                  href="/payments"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                   {tr("text094")} </Link>
              }
            >
               {tr("text095")} </Judul>
            {t == null || (t.belumDibayar === 0 && t.sudahDibayar === 0) ? (
              <p className="mt-4 text-sm text-muted">
                 {tr("text096")} </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-bold tracking-tight tabular-nums">
                      {rupiah(t.belumDibayar)}
                    </p>
                    <p className="text-xs text-muted">
                      {t.belumDibayar === 0
                        ? tr("text097")
                        : tr("text098")}
                    </p>
                  </div>
                  {t.berikutnya ? (
                    <ButtonLink
                      href={`/enrollments/${dipilih.pendaftaranId}/pay`}
                      size="sm"
                    >
                       {tr("text040")} </ButtonLink>
                  ) : null}
                </div>

                {t.berikutnya ? (
                  <p className="mt-3 text-sm text-muted">
                    {t.berikutnya.label} {rupiah(t.berikutnya.jumlah)} ·{" "}
                    {t.berikutnya.jatuhTempo ? (
                      <>
                         {tr("text099")} {tanggalPendek(t.berikutnya.jatuhTempo)}
                        {t.berikutnya.sisaHari != null ? (
                          <span
                            className={
                              t.berikutnya.sisaHari < 0
                                ? " font-semibold text-rose-600"
                                : t.berikutnya.sisaHari <= 7
                                  ? " font-semibold text-amber-600"
                                  : ""
                            }
                          >
                            {" "}
                            (
                            {t.berikutnya.sisaHari < 0
                              ? `lewat ${Math.abs(t.berikutnya.sisaHari)} hari`
                              : t.berikutnya.sisaHari === 0
                                ? tr("text100")
                                : `${t.berikutnya.sisaHari} hari lagi`}
                            )
                          </span>
                        ) : null}
                      </>
                    ) : (
                      tr("text101")
                    )}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                     {tr("text102")} </p>
                )}

                <div className="mt-5 grid gap-4">
                  {t.tenor ? (
                    <ProgressRow
                      label={tr("text103")}
                      value={`${t.tenor.lunas} dari ${t.tenor.total}`}
                      pct={(t.tenor.lunas / t.tenor.total) * 100}
                      tone={t.belumDibayar > 0 ? "amber" : "emerald"}
                      hint={tr("text104")}
                    />
                  ) : (
                    <ProgressRow
                      label={tr("text105")}
                      value={t.belumDibayar === 0 ? "100%" : "menunggu"}
                      pct={
                        t.sudahDibayar + t.belumDibayar > 0
                          ? (t.sudahDibayar /
                              (t.sudahDibayar + t.belumDibayar)) *
                            100
                          : 0
                      }
                      tone={t.belumDibayar === 0 ? "emerald" : "amber"}
                      hint={tr("text106")}
                    />
                  )}
                  <p className="text-xs text-muted">
                     {tr("text107")}{" "}
                    <b className="text-foreground">{rupiah(t.sudahDibayar)}</b>
                  </p>
                </div>
              </>
            )}
          </CardPad>
        </Card>

        {/* S3 — Jadwal berikutnya */}
        <Card className="border-t-4 border-t-amber-500">
          <CardPad>
            <Judul
              aksi={
                <Link
                  href="/schedule-attendance"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                   {tr("text108")} </Link>
              }
            >
               {tr("text109")} </Judul>
            {dipilih.jadwal.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                 {tr("text110")} </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {dipilih.jadwal.map((j) => (
                  <li
                    key={`${j.hari}-${j.mulai}`}
                    className="flex items-center gap-4 py-3"
                  >
                    <div className="w-16 shrink-0">
                      <p className="text-sm font-bold">{j.hari}</p>
                      <p className="text-xs text-muted">
                        {j.tanggalBerikutnya
                          ? tanggalPendek(j.tanggalBerikutnya)
                          : ""}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {j.mulai}–{j.selesai}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {j.mapel} · {j.guru}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {dipilih.pertemuanTerakhir ? (
              <p className="mt-2 text-xs text-muted">
                 {tr("text111")}{" "}
                {tanggalPendek(dipilih.pertemuanTerakhir.tanggal)} —{" "}
                <b className="text-foreground capitalize">
                  {dipilih.pertemuanTerakhir.status}
                </b>
              </p>
            ) : null}
          </CardPad>
        </Card>

        {/* S4 — Presensi & progres */}
        <Card className="border-t-4 border-t-blue-600">
          <CardPad>
            <Judul
              aksi={
                <Link
                  href="/schedule-attendance?tab=presensi"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                   {tr("text112")} </Link>
              }
            >
               {tr("text113")} </Judul>
            {dipilih.presensi.total === 0 ? (
              <p className="mt-4 text-sm text-muted">
                 {tr("text114")} </p>
            ) : (
              <div className="mt-4">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                  <div className="min-w-[140px] flex-1">
                    <ProgressRow
                      label={tr("text115")}
                      value={`${dipilih.persenHadir}%`}
                      pct={dipilih.persenHadir ?? 0}
                      tone={
                        (dipilih.persenHadir ?? 0) >= 80
                          ? "emerald"
                          : (dipilih.persenHadir ?? 0) >= 60
                            ? "amber"
                            : "red"
                      }
                      hint={`${dipilih.presensi.total} pertemuan tercatat`}
                    />
                    <div className="mt-4">
                      <SegmentBar
                        parts={[
                          {
                            label: tr("text116"),
                            n: dipilih.presensi.hadir,
                            className: "bg-emerald-500",
                          },
                          {
                            label: tr("text117"),
                            n: dipilih.presensi.izin,
                            className: "bg-amber-400",
                          },
                          {
                            label: tr("text118"),
                            n: dipilih.presensi.sakit,
                            className: "bg-amber-600",
                          },
                          {
                            label: tr("text119"),
                            n: dipilih.presensi.alpa,
                            className: "bg-rose-500",
                          },
                        ]}
                      />
                    </div>
                  </div>
                  {/* Kalender grid kehadiran bulan ini — pola referensi #2 */}
                  <div className="w-full sm:w-[210px] shrink-0">
                    <GridKehadiran riwayat={dipilih.presensiRiwayat} />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase text-muted">
                 {tr("text120")} </p>
              {dipilih.nilai.length >= 2 ? (
                <div className="mt-2">
                  <NilaiTrendChart data={dipilih.nilai} />
                </div>
              ) : dipilih.nilai.length === 1 ? (
                <p className="mt-2 text-sm">
                  <b className="tabular-nums">{dipilih.nilai[0].nilai}</b>{" "}
                  <span className="text-muted">
                     {tr("text121")}{tanggalPendek(dipilih.nilai[0].tanggal)}
                     {tr("text122")} </span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">
                   {tr("text123")} </p>
              )}
            </div>
          </CardPad>
        </Card>

        {/* S5 — Catatan terakhir dari guru */}
        <Card className="border-t-4 border-t-blue-600">
          <CardPad>
            <Judul>{tr("text124")}</Judul>
            {dipilih.catatanTerakhir ? (
              <blockquote className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;{dipilih.catatanTerakhir.teks}&rdquo;
                </p>
                <footer className="mt-3 text-xs text-muted">
                  {dipilih.catatanTerakhir.guru} ·{" "}
                  {tanggalPendek(dipilih.catatanTerakhir.tanggal)}
                </footer>
              </blockquote>
            ) : (
              <p className="mt-4 text-sm text-muted">
                 {tr("text125")} </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {dipilih.pertemuanTerakhir?.catatan ? (
                <Card>
                  <CardPad className="py-3">
                    <p className="text-xs font-semibold uppercase text-muted">
                       {tr("text126")} </p>
                    <p className="mt-1 text-sm leading-relaxed">
                      {dipilih.pertemuanTerakhir.catatan}
                    </p>
                  </CardPad>
                </Card>
              ) : null}
              {dipilih.pendaftaranId ? (
                <Card>
                  <CardPad className="py-3">
                    <p className="text-xs font-semibold uppercase text-muted">
                       {tr("text127")} </p>
                    <p className="mt-1 text-sm">
                      <Link
                        href={`/enrollments/${dipilih.pendaftaranId}`}
                        className="font-semibold text-brand hover:underline"
                      >
                         {tr("text128")} </Link>
                    </p>
                  </CardPad>
                </Card>
              ) : null}
            </div>
          </CardPad>
        </Card>
      </div>

      {/* S6 — Pertanyaan yang biasanya ditanyakan, dijawab layar ini juga */}
      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
           {tr("text129")} {dipilih.nama}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardPad className="py-4">
              <p className="text-xs text-muted">{tr("text130")}</p>
              <p className="mt-1 text-base font-bold tabular-nums">
                {t == null ? tr("text131") : rupiah(t.belumDibayar)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t?.tenor
                  ? `Cicilan ${t.tenor.lunas}/${t.tenor.total} lunas`
                  : t == null
                    ? tr("text132")
                    : tr("text133")}
              </p>
            </CardPad>
          </Card>
          <Card>
            <CardPad className="py-4">
              <p className="text-xs text-muted">{tr("text115")}</p>
              <p className="mt-1 text-base font-bold tabular-nums">
                {dipilih.persenHadir == null
                  ? tr("text134")
                  : `${dipilih.persenHadir}%`}
              </p>
              <p className="mt-1 text-xs text-muted">
                {dipilih.presensi.alpa > 0
                  ? `${dipilih.presensi.alpa} alpa — cek dengan guru`
                  : `${dipilih.presensi.total} pertemuan tercatat`}
              </p>
            </CardPad>
          </Card>
          <Card>
            <CardPad className="py-4">
              <p className="text-xs text-muted">{tr("text135")}</p>
              <p className="mt-1 text-base font-bold">{tr("text136")}</p>
              <p className="mt-1 text-xs text-muted">
                 {tr("text137")}{" "}
                <Link href="/terms" className="text-brand hover:underline">
                   {tr("text138")} </Link>
              </p>
            </CardPad>
          </Card>
          <Card>
            <CardPad className="py-4">
              <p className="text-xs text-muted">{tr("text139")}</p>
              <p className="mt-1 text-base font-bold">
                {dipilih.pendaftaranId ? (
                  <Link
                    href={`/enrollments/${dipilih.pendaftaranId}/cancel`}
                    className="text-brand hover:underline"
                  >
                     {tr("text017")} </Link>
                ) : (
                  tr("text131")
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                 {tr("text140")} </p>
            </CardPad>
          </Card>
        </div>
        {anakList.length > 1 ? (
          <p className="mt-4 text-xs text-muted">
             {tr("text141")}{" "}
            <Link
              href="/payments"
              className="font-semibold text-brand hover:underline"
            >
               {tr("text142")} </Link>
            .
          </p>
        ) : (
          <p className="mt-4 text-xs text-muted">
             {tr("text143")} </p>
        )}
      </section>
    </div>
  );
}
