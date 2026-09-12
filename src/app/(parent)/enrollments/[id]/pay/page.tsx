import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import { SITE } from "@/lib/site";
import { midtransConfigured } from "@/lib/midtrans";
import { tagihanBerikutinya } from "@/lib/services/pembayaran";
import MidtransPayButton from "@/components/parent/midtrans-pay-button";
import { konfirmasiManual } from "@/app/actions/pembayaran";

export const dynamic = "force-dynamic";

// C4 — Pilih metode bayar: tagihan terbuka berikutnya ditampilkan, bayar via
// Midtrans SNAP (kalau gateway dikonfigurasi). Tanpa gateway: instruksi
// transfer ke rekening lembaga + tombol konfirmasi manual (hanya muncul saat
// MIDTRANS_SERVER_KEY kosong — lihat actions/pembayaran.ts).

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/home");
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();
  const ortuId = Number(session.user.id);

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();
  const [a, k] = await Promise.all([
    collect(db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all()),
    collect(db.orm.public.Kelas.where((x) => x.id.eq(p.kelasId)).all()),
  ]);
  if (!a[0] || a[0].orangTuaId !== ortuId) notFound();
  if (
    [
      "dibatalkan_timeout",
      "dibatalkan_tunggakan",
      "dibatalkan_orang_tua",
      "dibatalkan_kelas",
    ].includes(p.status)
  )
    notFound();

  const bill = await tagihanBerikutinya(pid);
  if (!bill) redirect(`/enrollments/${pid}?semua=lunas`);

  const mapel = k[0]
    ? await collect(
        db.orm.public.MataPelajaran.where((m) =>
          m.id.eq(k[0].mataPelajaranId),
        ).all(),
      )
    : [];
  const gateway = midtransConfigured();
  const label =
    bill.tipe === "cicilan"
      ? `Cicilan ke-${bill.cicilanKe}`
      : bill.tipe === "dp"
        ? "Uang muka (DP)"
        : "Pembayaran lunas";
  const jumlah = Number(bill.jumlah);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href={`/enrollments/${pid}`} className="underline">
          ← Kembali ke detail
        </Link>
      </p>
      <header className="mt-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Bayar {label.toLowerCase()}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {a[0].nama} · {mapel[0]?.nama ?? `Kelas #${p.kelasId}`}
        </p>
      </header>

      <Card className="mt-6">
        <CardPad>
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm text-muted">Total ditagihkan</p>
            <p className="text-2xl font-bold tabular-nums">{rupiah(jumlah)}</p>
          </div>
          <p className="mt-2 text-xs text-muted">
            {bill.jatuhTempo
              ? `Jatuh tempo ${new Date(bill.jatuhTempo).toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  },
                )} — lewat tenggang 7 hari, pendaftaran bisa dibatalkan karena tunggakan.`
              : "Tagihan tanpa jatuh tempo."}
            {p.metodeBayar === "dp_cicilan" && p.tenorBulan
              ? ` Metode DP + cicilan manual ${p.tenorBulan} tagihan — tidak ada auto-debit.`
              : ""}
          </p>
        </CardPad>
      </Card>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          Metode pembayaran
        </h2>
        {gateway ? (
          <Card className="mt-3">
            <CardPad>
              <p className="text-sm font-semibold">
                Midtrans — VA bank, e-wallet, QRIS
              </p>
              <p className="mt-1 text-xs text-muted">
                Kamu diarahkan ke halaman pembayaran Midtrans. Status di sini
                mengikuti notifikasi gateway — tidak perlu konfirmasi manual.
              </p>
              <div className="mt-4">
                <MidtransPayButton
                  pembayaranId={bill.id}
                  label={`Bayar ${rupiah(jumlah)}`}
                />
              </div>
            </CardPad>
          </Card>
        ) : (
          <Card className="mt-3">
            <CardPad>
              <p className="text-sm font-semibold">
                Transfer manual ke rekening lembaga
              </p>
              <p className="mt-1 text-xs text-muted">
                Pintu pembayaran online belum diaktifkan pada instans ini.
                Transfer jumlah persis ke rekening lembaga, lalu konfirmasi di
                bawah — admin memverifikasi mutasi.
              </p>
              <ul className="mt-3 grid gap-1 text-sm">
                <li className="flex justify-between gap-4 border-t border-slate-100 pt-2">
                  <span className="text-muted">Penerima</span>
                  <b>{SITE.nama}</b>
                </li>
                <li className="flex justify-between gap-4 border-t border-slate-100 pt-2">
                  <span className="text-muted">Kontak verifikasi</span>
                  <span>
                    {SITE.email} · {SITE.telepon}
                  </span>
                </li>
                <li className="flex justify-between gap-4 border-t border-slate-100 pt-2">
                  <span className="text-muted">Berita transfer</span>
                  <span className="text-right font-medium">
                    {label} — {a[0].nama} (#{bill.id})
                  </span>
                </li>
                <li className="flex justify-between gap-4 border-t border-slate-100 pt-2">
                  <span className="text-muted">Nominal</span>
                  <b className="tabular-nums">{rupiah(jumlah)}</b>
                </li>
              </ul>
              <form action={konfirmasiManual} className="mt-4">
                <input type="hidden" name="pembayaran_id" value={bill.id} />
                <input type="hidden" name="pendaftaran_id" value={pid} />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
                >
                  Saya sudah transfer — konfirmasi
                </button>
              </form>
              <p className="mt-2 text-xs text-muted">
                Konfirmasi memicu penandaan lunas di sistem ini. Untuk produksi,
                aktifkan MIDTRANS_SERVER_KEY supaya status hanya berubah lewat
                webhook terverifikasi.
              </p>
            </CardPad>
          </Card>
        )}
      </section>

      <p className="mt-6 text-xs text-muted">
        Pertanyaan pembayaran? Hubungi {SITE.email} / {SITE.telepon}.
      </p>
    </div>
  );
}
