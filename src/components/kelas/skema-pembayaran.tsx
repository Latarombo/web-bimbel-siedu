"use client";
import { useTranslations } from "next-intl";


import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Card, CardPad } from "@/components/ui/card";
import { rupiah } from "@/lib/format";

type Skema = "lunas" | "dp";

type Props = {
  kelasId: number;
  periode: string;
  biayaPeriode: number;
  biayaDp: number | null;
  tenorMaksimum: number | null;
  sisaKuota: number;
  kuotaTerisi: number;
  kuotaMaksimum: number;
  manfaat: string[];
};

/**
 * Layout meniru bayar.ruangguru.com (daftar 'paket' di kiri + ringkasan biaya
 * sticky di kanan), disesuaikan ke model Siedu: yang dipilih bukan paket
 * konten, tapi SKEMA BAYAR. Lunas vs DP+cicilan dua-duanya nyata di DB
 * (BR#12) — tanpa badge diskon palsu.
 */
export function SkemaPembayaran({
  kelasId,
  periode,
  biayaPeriode,
  biayaDp,
  tenorMaksimum,
  sisaKuota,
  kuotaTerisi,
  kuotaMaksimum,
  manfaat,
}: Props) {
 const tr = useTranslations("public");
  const cicilanAda = biayaDp != null && tenorMaksimum != null;
  const [skema, setSkema] = useState<Skema>("lunas");
  const [tenor, setTenor] = useState(2);

  const opsiTenor = Array.from({ length: (tenorMaksimum ?? 2) - 1 }, (_, i) => i + 2);
  const nCicilan = Math.max(tenor - 1, 1);
  // Estimasi konservatif: sisa tagihan dibagi rata ke slot tenor, dibulatkan
  // ke bawah — cicilan terakhir menutup selisihnya (services/pembayaran.ts).
  const estimasiCicilan = cicilanAda
    ? Math.floor((biayaPeriode - (biayaDp ?? 0)) / (tenor - 1))
    : 0;
  const pct = Math.round((kuotaTerisi / kuotaMaksimum) * 100);
  const hrefDaftar = `/classes/${kelasId}/daftar`;
  const pakaiDp = skema === "dp" && cicilanAda;
  const bayarSekarang = pakaiDp ? (biayaDp ?? 0) : biayaPeriode;
  const hrefCta = pakaiDp
    ? `${hrefDaftar}?metode=dp_cicilan&tenor=${tenor}`
    : hrefDaftar;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Kiri: daftar skema, seperti daftar paket Ruangguru */}
      <div className="lg:col-span-7">
        <h2 className="text-sm font-bold text-foreground">{tr("text196")}</h2>
        <div className="mt-3 space-y-4">
          <KartuSkema
            id="lunas"
            dipilih={skema === "lunas"}
            onSelect={() => setSkema("lunas")}
            judul={tr("text197")}
            sub={tr("fullFor", {term: periode})}
            catatan={tr("onceFor", {term: periode})}
            manfaat={manfaat}
            hargaBesar={rupiah(biayaPeriode)}
            hargaKecil={tr("text198")}
          />
          {cicilanAda ? (
            <KartuSkema
              id="dp"
              dipilih={skema === "dp"}
              onSelect={() => setSkema("dp")}
              judul={tr("text199")}
              sub={tr("downFor", {amount: rupiah(biayaDp!)})}
              catatan={tr("downBalance", {count: nCicilan})}
              manfaat={manfaat}
              hargaBesar={rupiah(biayaDp!)}
              hargaKecil={`+ ± ${rupiah(estimasiCicilan)} × ${nCicilan}`}
              opsiTenor={opsiTenor}
              tenor={tenor}
              onTenor={(t) => {
                setTenor(t);
                setSkema("dp");
              }}
            />
          ) : (
            <p className="rounded-2xl border border-border bg-slate-50 px-5 py-4 text-sm text-muted">
              {tr("text200")}</p>
          )}
        </div>
      </div>

      {/* Kanan: ringkasan biaya sticky */}
      <div className="lg:col-span-5">
        <Card className="lg:sticky lg:top-[76px]">
          <CardPad>
            <p className="text-sm font-bold text-foreground">{tr("text201")}</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{tr("text202")}</span>
                <span className="font-semibold">
                  {pakaiDp ? tr("downCount", {count: nCicilan}) : tr("text203")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{tr("text204")}</span>
                <span className="font-semibold">{rupiah(biayaPeriode)}</span>
              </div>
              {pakaiDp ? (
                <div className="flex justify-between">
                  <span className="text-muted">{tr("text205")}</span>
                  <span className="font-semibold">± {rupiah(estimasiCicilan)}</span>
                </div>
              ) : null}
            </div>

            {pakaiDp ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">{tr("classDownPaymentNote")}</p>
            ) : null}

            <hr className="my-4 border-dashed border-border" />

            <div className="flex items-end justify-between gap-4">
              <p className="text-sm text-muted">{tr("text207")}</p>
              <p className="text-2xl font-black tracking-tight text-foreground">
                {rupiah(bayarSekarang)}
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{tr("text208")}</span>
                <span>
                  {kuotaTerisi}/{kuotaMaksimum}
                </span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={tr("text210")}
              >
                <div
                  className={`h-full rounded-full ${pct >= 85 ? "bg-accent" : "bg-brand"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {pct >= 85 ? (
                <p className="mt-1.5 text-xs font-semibold text-danger">
                  {tr("seatsPeriod", {count: sisaKuota})}
                </p>
              ) : null}
            </div>

            <Link
              id="cta-utama"
              href={hrefCta}
              className="mt-5 block text-center rounded-lg bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              {tr("text213")}</Link>
            <Link
              href="/login"
              className="mt-2 block text-center rounded-lg border border-border py-3 text-sm font-semibold hover:border-foreground"
            >
              {tr("text214")}</Link>
            <p className="mt-3 text-center text-xs text-muted">
              {tr("text215")}{" "}
              <Link href="/#faq" className="text-brand hover:underline">
                {tr("text217")}</Link>
            </p>
          </CardPad>
        </Card>
      </div>

      {/* Bar harga lengket khusus layar kecil, seperti footer 'Total Harga' di HP */}
      <BarHargaLengket
        anchorId="cta-utama"
        label={pakaiDp ? tr("text218") : tr("text219")}
        harga={rupiah(bayarSekarang)}
        href={hrefCta}
      />
    </div>
  );
}

/* ---------- kartu satu skema (komponen tingkat modul, bukan inside render) ---------- */

function KartuSkema({
  id,
  dipilih,
  onSelect,
  judul,
  sub,
  catatan,
  manfaat,
  hargaBesar,
  hargaKecil,
  opsiTenor,
  tenor,
  onTenor,
}: {
  id: Skema;
  dipilih: boolean;
  onSelect: () => void;
  judul: string;
  sub: string;
  catatan: string;
  manfaat: string[];
  hargaBesar: string;
  hargaKecil?: string;
  opsiTenor?: number[];
  tenor?: number;
  onTenor?: (t: number) => void;
}) {
 const tr = useTranslations("public");
  return (
    <div className="relative">
      <input
        type="radio"
        name="skema-bayar"
        id={`skema-${id}`}
        className="peer sr-only"
        checked={dipilih}
        onChange={onSelect}
      />
      <label
        htmlFor={`skema-${id}`}
        className={`block cursor-pointer rounded-2xl border bg-surface p-5 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand ${
          dipilih ? "border-brand shadow-sm" : "border-border hover:border-brand/50"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-base font-bold text-foreground">{judul}</span>
            <p className="mt-0.5 text-sm text-muted">{sub}</p>
          </div>
          <span
            aria-hidden
            className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 ${
              dipilih ? "border-brand bg-brand" : "border-slate-300 bg-surface"
            }`}
          >
            {dipilih ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
          </span>
        </div>

        <p className="mt-4 text-xs font-semibold text-foreground">{tr("text221")}</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {manfaat.map((m) => (
            <li key={m} className="flex items-start gap-2 text-sm text-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>{m}</span>
            </li>
          ))}
        </ul>

        {opsiTenor && onTenor ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">{tr("text222")}</span>
            {opsiTenor.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTenor(t)}
                aria-pressed={tenor === t}
                className={`min-h-9 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                  tenor === t
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-surface text-muted hover:border-foreground"
                }`}
              >
                {t}×
              </button>
            ))}
          </div>
        ) : null}

        <hr className="my-4 border-dashed border-border" />

        <div className="flex items-end justify-between gap-4">
          <p className="text-xs text-muted">{catatan}</p>
          <div className="text-right">
            <p className="text-xl font-black tracking-tight text-foreground">{hargaBesar}</p>
            {hargaKecil ? <p className="text-xs text-muted">{hargaKecil}</p> : null}
          </div>
        </div>
      </label>
    </div>
  );
}

/* ---------- bar harga bawah (mobile) ---------- */

function BarHargaLengket({
  anchorId,
  label,
  harga,
  href,
}: {
  anchorId: string;
  label: string;
  harga: string;
  href: string;
}) {
 const tr = useTranslations("public");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const anchor = document.getElementById(anchorId);
    if (!anchor || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), {
      rootMargin: "0px 0px 80px 0px",
    });
    io.observe(anchor);
    return () => io.disconnect();
  }, [anchorId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur transition-transform duration-200 motion-reduce:transition-none lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{label}</p>
          <p className="truncate text-base font-bold text-foreground">{harga}</p>
        </div>
        <Link
          href={href}
          aria-hidden={!show}
          tabIndex={show ? 0 : -1}
          className="shrink-0 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          {tr("text225")}</Link>
      </div>
    </div>
  );
}
