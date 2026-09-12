// Service Pembayaran — sisi server alur bayar (menuntaskan stub C4-C6).
//
// Aturan yang dipakai (sumber: Terms, FAQ landing, komentar kontrak):
// - createPendaftaran (BR#14) hanya menerbitkan tagihan PERTAMA (DP atau lunas).
//   Cicilan ke-1..n-1 diterbitkan di sini, SATU per satu, tiap pembayaran
//   sebelumnya menjadi berhasil — cocok dengan "cicilan manual: orang tua klik
//   Bayar tiap jatuh tempo".
// - Terms: "Tunggakan lewat 7 hari kerja → pendaftaran dibatalkan". Di sini
//   dipakai jendela 7 HARI KALENDER (helper lib/hari.ts dalamJendela7Hari):
//   belum ada kalender hari libur nasional di kontrak, jadi pendekatan paling
//   dekat tanpa tabel baru. Kalau lembaga butuh hari kerja presisi, tambah
//   tabel hari_libur lalu ganti helper-nya.
// - Semua fungsi idempoten: webhook Midtrans mengirim status berulang.
//
// Impor relatif supaya bisa dijalankan node langsung (konvensi pendaftaran.ts).
import { db } from "../../prisma/db";
import type { Hasil } from "./pendaftaran";
import { dalamJendela7Hari } from "../hari";

async function collect<T>(src: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const r of src) out.push(r);
  return out;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function plusHari(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

const hariIni = () => new Date().toISOString().slice(0, 10);

/** Tagihan terbuka (pending/gagal) berikutnya untuk satu pendaftaran, atau null. */
export async function tagihanBerikutinya(pendaftaranId: number) {
  const semua = await collect(
    db.orm.public.Pembayaran.where((b) =>
      b.pendaftaranId.eq(pendaftaranId),
    ).all(),
  );
  const terbuka = semua
    .filter((b) => b.status === "pending" || b.status === "gagal")
    .sort(
      (a, b) =>
        (a.jatuhTempo ?? "9999-12-31").localeCompare(
          b.jatuhTempo ?? "9999-12-31",
        ) || (a.cicilanKe ?? 0) - (b.cicilanKe ?? 0),
    );
  return terbuka[0] ?? null;
}

/**
 * Terbitkan SATU baris cicilan berikutnya untuk pendaftaran dp_cicilan, kalau
 * DP-nya sudah berhasil dan masih ada slot tenor tersisa. Nominal = sisa
 * tagihan dibagi rata ke slot yang belum terbit (cicilan terakhir otomatis
 * menutup selisih pembulatan karena slot berikutnya dihitung ulang).
 * Return cicilan_ke yang dibuat, atau null.
 */
async function terbitkanCicilanBerikutnya(
  tx: Tx,
  pendaftaranId: number,
): Promise<number | null> {
  const [p] = await collect(
    tx.query(
      db.raw
        .sql`select p.metode_bayar, p.tenor_bulan, k.biaya_periode::text as total
                 from pendaftaran p join kelas k on k.id = p.kelas_id
                 where p.id = ${pendaftaranId}`
        .returnsRow({
          metode_bayar: "pg/text@1",
          tenor_bulan: "pg/int4@1",
          total: "pg/text@1",
        })
        .build(),
    ),
  );
  if (!p || p.metode_bayar !== "dp_cicilan" || !p.tenor_bulan) return null;
  const nCicilan = p.tenor_bulan - 1; // tenor = DP + (tenor-1) cicilan

  const bills = await collect(
    tx.query(
      db.raw.sql`select tipe, status, cicilan_ke, jumlah::text as jumlah
                 from pembayaran where pendaftaran_id = ${pendaftaranId}`
        .returnsRow({
          tipe: "pg/text@1",
          status: "pg/text@1",
          cicilan_ke: "pg/int4@1",
          jumlah: "pg/text@1",
        })
        .build(),
    ),
  );
  if (!bills.some((b) => b.tipe === "dp" && b.status === "berhasil"))
    return null;

  // Jangan menumpuk: kalau masih ada tagihan terbuka, itu yang harus dibayar.
  if (bills.some((b) => b.status === "pending" || b.status === "gagal"))
    return null;

  const cicilanTerbit = bills.filter((b) => b.tipe === "cicilan");
  if (cicilanTerbit.length >= nCicilan) return null;
  const ke = cicilanTerbit.length + 1;

  const dibayar = bills
    .filter((b) => b.status === "berhasil")
    .reduce((s, b) => s + Number(b.jumlah), 0);
  const sisa = Number(p.total) - dibayar;
  const slotTersisa = nCicilan - cicilanTerbit.length; // termasuk yang mau dibuat
  const jumlah =
    slotTersisa === 1 ? sisa : Math.min(sisa, Math.floor(sisa / slotTersisa));
  if (jumlah <= 0) return null;

  await tx.execute(
    db.raw
      .sql`insert into pembayaran (pendaftaran_id, tipe, cicilan_ke, jumlah, jatuh_tempo, status, created_at, updated_at)
               values (${pendaftaranId}, 'cicilan', ${ke}, ${jumlah}::numeric,
                       ${plusHari(7)}::date, 'pending', now(), now())`
      .affectedCount()
      .build(),
  );
  return ke;
}

/**
 * Efek samping setelah satu Pembayaran menjadi 'berhasil' (dipanggil dari
 * jalur transaksi tandaiBerhasil):
 * - Semua pendaftaran: tagihan terbuka baru terbit → tidak boleh tertunggak.
 * - dp_cicilan, DP baru lunas → 'terdaftar': kursi aman oleh DP; cicilan yang
 *   terbit berikutnya berstatus tertunggak sendiri kalau telat (prosesTunggakan
 *   juga memindai 'terdaftar'). 'menunggu_pembayaran' HANYA berarti belum ada
 *   pembayaran sama sekali — itu syarat cron pembatalan-24-jam.
 */
async function setelahBerhasil(tx: Tx, pendaftaranId: number) {
  await terbitkanCicilanBerikutnya(tx, pendaftaranId);

  const [belumLunas] = await collect(
    tx.query(
      db.raw.sql`select count(*)::int as n from pembayaran
 where pendaftaran_id = ${pendaftaranId} and status <> 'berhasil'`
        .returnsRow({ n: "pg/int4@1" })
        .build(),
    ),
  );
  const [pendaftaran] = await collect(
    tx.query(
      db.raw.sql`select status from pendaftaran where id = ${pendaftaranId}`
        .returnsRow({ status: "pg/text@1" })
        .build(),
    ),
  );
  if (!pendaftaran) return;
  // Lunas semua → aktif.
  if (belumLunas?.n === 0) {
    if (
      pendaftaran.status === "menunggu_pembayaran" ||
      pendaftaran.status === "tertunggak"
    ) {
      await tx.execute(
        db.raw
          .sql`update pendaftaran set status = 'terdaftar', updated_at = now()
 where id = ${pendaftaranId}`
          .affectedCount()
          .build(),
      );
    }
    return;
  }
  // Masih ada tagihan terbuka: DP cicilan yang lunas = terdaftar.
  if (pendaftaran.status === "menunggu_pembayaran") {
    const [dpLunas] = await collect(
      tx.query(
        db.raw.sql`select exists (
 select 1 from pembayaran
 where pendaftaran_id = ${pendaftaranId} and tipe = 'dp' and status = 'berhasil'
 ) as ada`
          .returnsRow({ ada: "pg/bool@1" })
          .build(),
      ),
    );
    if (dpLunas?.ada) {
      await tx.execute(
        db.raw
          .sql`update pendaftaran set status = 'terdaftar', updated_at = now()
 where id = ${pendaftaranId}`
          .affectedCount()
          .build(),
      );
    }
  }
}
export async function tandaiBerhasil(
  pembayaranId: number,
): Promise<Hasil<null>> {
  return db.transaction(async (tx) => {
    const [b] = await collect(
      tx.query(
        db.raw.sql`select id, pendaftaran_id, status from pembayaran
                   where id = ${pembayaranId} for update`
          .returnsRow({
            id: "pg/int4@1",
            pendaftaran_id: "pg/int4@1",
            status: "pg/text@1",
          })
          .build(),
      ),
    );
    if (!b) return { ok: false, error: "Tagihan tidak ditemukan." };
    if (b.status === "berhasil") return { ok: true, value: null };

    await tx.execute(
      db.raw.sql`update pembayaran
                 set status = 'berhasil', dibayar_pada = now(), updated_at = now()
                 where id = ${pembayaranId}`
        .affectedCount()
        .build(),
    );

    await setelahBerhasil(tx, b.pendaftaran_id);
    return { ok: true, value: null };
  });
}

/** Tandai Pembayaran 'gagal' (deny/cancel/expire dari gateway). Idempoten. */
export async function tandaiGagal(pembayaranId: number): Promise<Hasil<null>> {
  return db.transaction(async (tx) => {
    const [b] = await collect(
      tx.query(
        db.raw
          .sql`select id, status from pembayaran where id = ${pembayaranId} for update`
          .returnsRow({ id: "pg/int4@1", status: "pg/text@1" })
          .build(),
      ),
    );
    if (!b) return { ok: false, error: "Tagihan tidak ditemukan." };
    if (b.status === "berhasil")
      return { ok: false, error: "Sudah dibayar — status gagal diabaikan." };
    if (b.status === "gagal") return { ok: true, value: null };

    await tx.execute(
      db.raw.sql`update pembayaran set status = 'gagal', updated_at = now()
                 where id = ${pembayaranId}`
        .affectedCount()
        .build(),
    );
    return { ok: true, value: null };
  });
}

/** Prefix order_id Midtrans Siedu — dipakai halaman pay & webhook. */
export const ORDER_ID = (pembayaranId: number) => `siedu-pemb-${pembayaranId}`;

/**
 * Konsumsi hasil transaksi Midtrans (webhook / lookup). Mapping
 * transaction_status v2.x: settlement|capture → berhasil;
 * cancel|expire|deny → gagal; selain itu tidak ada aksi.
 */
export async function terapkanStatusMidtrans(
  orderId: string,
  transactionStatus: string,
): Promise<{ ok: boolean; note: string }> {
  const m = /^siedu-pemb-(\d+)$/.exec(orderId);
  if (!m) return { ok: true, note: "order_id bukan milik Siedu — diabaikan" };
  const id = Number(m[1]);
  const st = transactionStatus.toLowerCase();
  if (st === "settlement" || st === "capture") {
    const r = await tandaiBerhasil(id);
    return r.ok
      ? { ok: true, note: `pembayaran ${id} → berhasil` }
      : { ok: false, note: r.error };
  }
  if (st === "cancel" || st === "expire" || st === "deny") {
    const r = await tandaiGagal(id);
    return r.ok
      ? { ok: true, note: `pembayaran ${id} → gagal (${st})` }
      : { ok: false, note: r.error };
  }
  return { ok: true, note: `status ${st} — tidak ada aksi` };
}

/**
 * Cron BR#7 (dipanggil /api/cron/check-timeout):
 * 1) tagihan pending lewat jatuh tempo, pendaftaran masih 'terdaftar'
 *    → 'tertunggak'.
 * 2) 'tertunggak' yang tagihan terlambatnya sudah lewat tenggang 7 hari
 *    → 'dibatalkan_tunggakan' + kuota dilepas (pola processTimeouts).
 * Per pendaftaran: satu kegagalan tidak membatalkan seluruh batch.
 */
export async function processTunggakan(): Promise<{
  menjadiTertunggak: number;
  dibatalkanTunggakan: number;
}> {
  const semua = await collect(db.orm.public.Pendaftaran.all());
  const kandidat = semua.filter(
    (p) => p.status === "terdaftar" || p.status === "tertunggak",
  );

  let menjadiTertunggak = 0;
  let dibatalkanTunggakan = 0;
  for (const p of kandidat) {
    const bills = await collect(
      db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(p.id)).all(),
    );
    const terlambat = bills.filter(
      (b) => b.status === "pending" && b.jatuhTempo && b.jatuhTempo < hariIni(),
    );
    if (terlambat.length === 0) continue;

    if (p.status === "terdaftar") {
      await db.orm.public.Pendaftaran.where({ id: p.id }).update({
        status: "tertunggak",
      });
      menjadiTertunggak++;
      continue;
    }

    // Masih tertunggak: baru dibatalkan kalau SEMUA tagihan terlambat sudah
    // lewat tenggang 7 hari.
    if (!terlambat.every((b) => !dalamJendela7Hari(b.jatuhTempo!))) continue;

    try {
      await db.transaction(async (tx) => {
        await tx.execute(
          db.raw
            .sql`update pendaftaran set status = 'dibatalkan_tunggakan', updated_at = now()
                     where id = ${p.id}`
            .affectedCount()
            .build(),
        );
        await tx.execute(
          db.raw
            .sql`update kelas set kuota_terisi = greatest(kuota_terisi - 1, 0), updated_at = now()
                     where id = ${p.kelasId}`
            .affectedCount()
            .build(),
        );
      });
      dibatalkanTunggakan++;
    } catch (e) {
      console.error(`processTunggakan: pendaftaran ${p.id} gagal diproses`, e);
    }
  }
  return { menjadiTertunggak, dibatalkanTunggakan };
}
