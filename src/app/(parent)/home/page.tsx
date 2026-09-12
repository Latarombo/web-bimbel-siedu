import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, type StatusPendaftaran } from "@/components/status-badge";
import { ProgressRow, SegmentBar } from "@/components/ui/progress-row";
import { NilaiTrendChart } from "@/components/parent/nilai-trend-chart";
import { dashboardOrangTua } from "@/lib/orang-tua-dashboard";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

function tanggalPendek(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function Judul({ children, aksi }: { children: React.ReactNode; aksi?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{children}</h2>
      {aksi}
    </div>
  );
}

export default async function ParentHome({
  searchParams,
}: {
  searchParams: Promise<{ anak?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/home");
  const ortuId = Number(session.user.id);
  const { anak: anakParam } = await searchParams;

  const anakList = await dashboardOrangTua(ortuId);

  if (anakList.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Halo, {session.user.name ?? "Orang Tua"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Belum ada pendaftaran aktif untuk anakmu.
          </p>
        </header>
        <Card>
          <CardPad className="text-center">
            <p className="text-base font-semibold">Belum ada pendaftaran</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Lengkapi profil anak dulu, lalu pilih kelas sesuai jenjangnya.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <ButtonLink href="/children/new">+ Tambah Anak</ButtonLink>
              <ButtonLink href="/classes" variant="outline">
                Lihat kelas
              </ButtonLink>
            </div>
          </CardPad>
        </Card>
      </div>
    );
  }

  // S1 — anak aktif: ?anak=<id>, default yang paling butuh perhatian (sudah terurut).
  const dipilih = anakList.find((a) => String(a.id) === anakParam) ?? anakList[0];
  const tagihanMenunggu = anakList.filter((a) => (a.tagihan?.belumDibayar ?? 0) > 0).length;
  const t = dipilih.tagihan;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* S0 — Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Halo, {session.user.name ?? "Orang Tua"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {anakList.length} anak aktif ·{" "}
            {tagihanMenunggu > 0 ? (
              <>
                <span className="font-semibold text-rose-600">
                  {tagihanMenunggu} punya tagihan menunggu
                </span>
              </>
            ) : (
              "semua tagihan lunas"
            )}
            .
          </p>
        </div>
        <ButtonLink href="/children/new" variant="outline">
          + Tambah Anak
        </ButtonLink>
      </header>

      {/* S1 — Switcher anak (pill; pola Badge tidak punya className → inline span) */}
      <nav aria-label="Pilih anak" className="flex flex-wrap gap-2">
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
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                on
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:text-brand"
              }`}
            >
              {a.nama}
              <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white/80" : dot}`} />
              {a.jenjang ? (
                <span className={`text-xs font-medium ${on ? "text-white/80" : "text-muted"}`}>
                  {a.jenjang}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Identitas anak terpilih — pusat kartu, semuanya mengelilingi dia */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight">{dipilih.nama}</p>
          <p className="text-sm text-muted">
            {dipilih.kelas
              ? `${dipilih.kelas.mapel} · Guru ${dipilih.kelas.guru}`
              : "Belum ada kelas aktif"}
            {dipilih.jenjang ? ` · Jenjang ${dipilih.jenjang}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dipilih.status ? (
            <StatusBadge status={dipilih.status as StatusPendaftaran} />
          ) : (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              belum pilih kelas
            </span>
          )}
          {dipilih.pendaftaranId ? (
            <Link
              href={`/enrollments/${dipilih.pendaftaranId}`}
              className="text-sm font-semibold text-brand hover:underline"
            >
              Detail pendaftaran →
            </Link>
          ) : (
            <Link href="/classes" className="text-sm font-semibold text-brand hover:underline">
              Pilih kelas →
            </Link>
          )}
        </div>
      </div>

      {dipilih.menungguPembayaran ? (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <CardPad className="py-3">
            <p className="text-sm text-amber-800">
              Pendaftaran menunggu pembayaran — bayar dalam 24 jam sejak pengajuan, atau
              kuota dibuka kembali otomatis.
            </p>
          </CardPad>
        </Card>
      ) : null}
      {dipilih.tertunggak ? (
        <Card className="mt-4 border-rose-200 bg-rose-50">
          <CardPad className="py-3">
            <p className="text-sm text-rose-700">
              Ada tunggakan. Setelah tenggang 7 hari kerja lewat, pendaftaran bisa batal
              otomatis karena tunggakan.
            </p>
          </CardPad>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* S2 — Yang perlu kamu bayar */}
        <Card className="border-t-4 border-t-emerald-500">
          <CardPad>
            <Judul
              aksi={
                <Link href="/payments" className="text-xs font-semibold text-brand hover:underline">
                  Semua tagihan →
                </Link>
              }
            >
              Yang perlu dibayar
            </Judul>
            {t == null || (t.belumDibayar === 0 && t.sudahDibayar === 0) ? (
              <p className="mt-4 text-sm text-muted">Belum ada tagihan untuk anak ini.</p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-bold tracking-tight tabular-nums">
                      {rupiah(t.belumDibayar)}
                    </p>
                    <p className="text-xs text-muted">
                      {t.belumDibayar === 0 ? "Lunas — tidak ada tagihan terbuka" : "masih terbuka"}
                    </p>
                  </div>
                  {t.berikutnya ? (
                    <ButtonLink href={`/enrollments/${dipilih.pendaftaranId}/pay`} size="sm">
                      Bayar Sekarang
                    </ButtonLink>
                  ) : null}
                </div>

                {t.berikutnya ? (
                  <p className="mt-3 text-sm text-muted">
                    {t.berikutnya.label} {rupiah(t.berikutnya.jumlah)} ·{" "}
                    {t.berikutnya.jatuhTempo ? (
                      <>
                        jatuh tempo {tanggalPendek(t.berikutnya.jatuhTempo)}
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
                                ? "hari ini"
                                : `${t.berikutnya.sisaHari} hari lagi`}
                            )
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "tidak ada jatuh tempo"
                    )}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    Tidak ada tagihan terbuka — riwayat lengkap ada di halaman Payments.
                  </p>
                )}

                <div className="mt-5 grid gap-4">
                  {t.tenor ? (
                    <ProgressRow
                      label="Progres cicilan"
                      value={`${t.tenor.lunas} dari ${t.tenor.total}`}
                      pct={(t.tenor.lunas / t.tenor.total) * 100}
                      tone={t.belumDibayar > 0 ? "amber" : "emerald"}
                      hint="Cicilan manual — kamu klik Bayar tiap jatuh tempo, tidak ada auto-debit."
                    />
                  ) : (
                    <ProgressRow
                      label="Progres pembayaran"
                      value={t.belumDibayar === 0 ? "100%" : "menunggu"}
                      pct={
                        t.sudahDibayar + t.belumDibayar > 0
                          ? (t.sudahDibayar / (t.sudahDibayar + t.belumDibayar)) * 100
                          : 0
                      }
                      tone={t.belumDibayar === 0 ? "emerald" : "amber"}
                      hint="Metode lunas: satu tagihan untuk satu periode."
                    />
                  )}
                  <p className="text-xs text-muted">
                    Sudah dibayar: <b className="text-foreground">{rupiah(t.sudahDibayar)}</b>
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
                  Jadwal &amp; presensi →
                </Link>
              }
            >
              Jadwal minggu ini
            </Judul>
            {dipilih.jadwal.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Jadwal kelas belum diisi admin. Muncul setelah jadwal pertemuan dibuat.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {dipilih.jadwal.map((j) => (
                  <li key={`${j.hari}-${j.mulai}`} className="flex items-center gap-4 py-3">
                    <div className="w-16 shrink-0">
                      <p className="text-sm font-bold">{j.hari}</p>
                      <p className="text-xs text-muted">
                        {j.tanggalBerikutnya ? tanggalPendek(j.tanggalBerikutnya) : ""}
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
                Pertemuan terakhir {tanggalPendek(dipilih.pertemuanTerakhir.tanggal)} —{" "}
                <b className="text-foreground capitalize">{dipilih.pertemuanTerakhir.status}</b>
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
                  Riwayat →
                </Link>
              }
            >
              Presensi &amp; progres
            </Judul>
            {dipilih.presensi.total === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Belum ada catatan presensi. Guru menginput kehadiran di tiap pertemuan.
              </p>
            ) : (
              <div className="mt-4">
                <ProgressRow
                  label="Kehadiran"
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
                      { label: "Hadir", n: dipilih.presensi.hadir, className: "bg-emerald-500" },
                      { label: "Izin", n: dipilih.presensi.izin, className: "bg-amber-400" },
                      { label: "Sakit", n: dipilih.presensi.sakit, className: "bg-amber-600" },
                      { label: "Alpa", n: dipilih.presensi.alpa, className: "bg-rose-500" },
                    ]}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase text-muted">Tren nilai</p>
              {dipilih.nilai.length >= 2 ? (
                <div className="mt-2">
                  <NilaiTrendChart data={dipilih.nilai} />
                </div>
              ) : dipilih.nilai.length === 1 ? (
                <p className="mt-2 text-sm">
                  <b className="tabular-nums">{dipilih.nilai[0].nilai}</b>{" "}
                  <span className="text-muted">
                    — satu titik data ({tanggalPendek(dipilih.nilai[0].tanggal)}). Grafik muncul
                    setelah ada nilai kedua.
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  Nilai belum diisi guru. Skala 0–100 per penilaian progres.
                </p>
              )}
            </div>
          </CardPad>
        </Card>

        {/* S5 — Catatan terakhir dari guru */}
        <Card className="border-t-4 border-t-blue-600">
          <CardPad>
            <Judul>Catatan terakhir dari guru</Judul>
            {dipilih.catatanTerakhir ? (
              <blockquote className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;{dipilih.catatanTerakhir.teks}&rdquo;
                </p>
                <footer className="mt-3 text-xs text-muted">
                  {dipilih.catatanTerakhir.guru} · {tanggalPendek(dipilih.catatanTerakhir.tanggal)}
                </footer>
              </blockquote>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Belum ada catatan. Catatan guru muncul dari kolom catatan presensi atau penilaian
                progres.
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {dipilih.pertemuanTerakhir?.catatan ? (
                <Card>
                  <CardPad className="py-3">
                    <p className="text-xs font-semibold uppercase text-muted">
                      Catatan pertemuan lalu
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">
                      {dipilih.pertemuanTerakhir.catatan}
                    </p>
                  </CardPad>
                </Card>
              ) : null}
              {dipilih.pendaftaranId ? (
                <Card>
                  <CardPad className="py-3">
                    <p className="text-xs font-semibold uppercase text-muted">Periode berjalan</p>
                    <p className="mt-1 text-sm">
                      <Link
                        href={`/enrollments/${dipilih.pendaftaranId}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        Lihat tagihan &amp; status
                      </Link>
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
          Jawaban cepat untuk {dipilih.nama}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardPad className="py-4">
              <p className="text-xs text-muted">Sisa yang harus dibayar</p>
              <p className="mt-1 text-base font-bold tabular-nums">
                {t == null ? "belum ada pendaftaran" : rupiah(t.belumDibayar)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t?.tenor
                  ? `Cicilan ${t.tenor.lunas}/${t.tenor.total} lunas`
                  : t == null
                    ? "Pilih kelas untuk mulai belajar"
                    : "Metode lunas"}
              </p>
            </CardPad>
          </Card>
          <Card>
            <CardPad className="py-4">
              <p className="text-xs text-muted">Kehadiran</p>
              <p className="mt-1 text-base font-bold tabular-nums">
                {dipilih.persenHadir == null ? "belum tercatat" : `${dipilih.persenHadir}%`}
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
              <p className="text-xs text-muted">Telat bayar</p>
              <p className="mt-1 text-base font-bold">Tenggang 7 hari kerja</p>
              <p className="mt-1 text-xs text-muted">
                Lewat tenggang → status jadi dibatalkan karena tunggakan.{" "}
                <Link href="/terms" className="text-brand hover:underline">
                  Aturan
                </Link>
              </p>
            </CardPad>
          </Card>
          <Card>
            <CardPad className="py-4">
              <p className="text-xs text-muted">Mau batalkan kelas?</p>
              <p className="mt-1 text-base font-bold">
                {dipilih.pendaftaranId ? (
                  <Link
                    href={`/enrollments/${dipilih.pendaftaranId}/cancel`}
                    className="text-brand hover:underline"
                  >
                    Ajukan pembatalan
                  </Link>
                ) : (
                  "belum ada pendaftaran"
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                DP hangus untuk pembatalan atas permintaan sendiri.
              </p>
            </CardPad>
          </Card>
        </div>
        {anakList.length > 1 ? (
          <p className="mt-4 text-xs text-muted">
            Punya lebih dari satu anak? Pilih namanya di atas — semua kartu di halaman ini ikut
            berganti. Atau lihat gabungan:{" "}
            <Link href="/payments" className="font-semibold text-brand hover:underline">
              tagihan semua anak
            </Link>
            .
          </p>
        ) : (
          <p className="mt-4 text-xs text-muted">
            Angka di halaman ini real-time dari data kelas, presensi, dan tagihan anakmu.
          </p>
        )}
      </section>
    </div>
  );
}
