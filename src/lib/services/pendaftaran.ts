// Service Pendaftaran — item roadmap 10-14 (BR#1,2,9,11,12,13,14,28,29)
// Import relatif (bukan '@/') supaya bisa dijalankan langsung oleh node untuk self-check.
import { db } from '../../prisma/db';

export type Jenjang = 'TK' | 'SD' | 'SMP' | 'SMA';
export type MetodeBayar = 'lunas' | 'dp_cicilan';
export type Hasil<T> = { ok: true; value: T } | { ok: false; error: string };

function datePlusDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

async function collect<T>(src: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const r of src) out.push(r);
  return out;
}

/**
 * BR#1/9/12/13/14/28/29 — buat Pendaftaran + tagihan pertama, atomik.
 * Row-lock kelas pakai SELECT FOR UPDATE (pengganti lockForUpdate Eloquent).
 */
export async function createPendaftaran(input: {
  orangTuaId: number;
  anakId: number;
  kelasId: number;
  metodeBayar: MetodeBayar;
  tenorBulan?: number;
}): Promise<Hasil<{ pendaftaranId: number }>> {
  try {
    return await db.transaction(async (tx) => {
      // --- anak milik orang tua ini + jenjang terisi (BR#13) ---
      const [anak] = await collect(
        tx.query(
          db.raw.sql`select id, jenjang_terakhir from anak where id = ${input.anakId} and orang_tua_id = ${input.orangTuaId}`
            .returnsRow({ id: 'pg/int4@1', jenjang_terakhir: 'pg/text@1' })
            .build(),
        ),
      );
      if (!anak) return { ok: false, error: 'Anak tidak ditemukan untuk akun ini.' };
      if (!anak.jenjang_terakhir)
        return { ok: false, error: 'Lengkapi jenjang anak di profil dulu (BR#13).' };

      // --- lock kelas (BR#1) + ambil field yang dibutuhkan ---
      const [kelas] = await collect(
        tx.query(
          db.raw.sql`select id, status, jenjang, periode_id, kuota_terisi, kuota_maksimum,
                            biaya_periode::text as biaya_periode,
                            biaya_dp::text as biaya_dp,
                            tenor_maksimum
                     from kelas where id = ${input.kelasId} for update`
            .returnsRow({
              id: 'pg/int4@1',
              status: 'pg/text@1',
              jenjang: 'pg/text@1',
              periode_id: 'pg/int4@1',
              kuota_terisi: 'pg/int4@1',
              kuota_maksimum: 'pg/int4@1',
              biaya_periode: 'pg/text@1',
              biaya_dp: 'pg/text@1',
              tenor_maksimum: 'pg/int4@1',
            })
            .build(),
        ),
      );
      if (!kelas) return { ok: false, error: 'Kelas tidak ditemukan.' };
      if (kelas.status !== 'aktif') return { ok: false, error: 'Kelas tidak aktif.' };
      if (kelas.jenjang !== anak.jenjang_terakhir)
        return { ok: false, error: 'Jenjang kelas tidak sesuai jenjang anak (BR#13).' };
      if (kelas.kuota_terisi >= kelas.kuota_maksimum)
        return { ok: false, error: 'Kuota kelas sudah penuh (BR#1).' };

      // --- periode masih dibuka ---
      const [periode] = await collect(
        tx.query(
          db.raw.sql`select status from periode_pendaftaran where id = ${kelas.periode_id}`
            .returnsRow({ status: 'pg/text@1' })
            .build(),
        ),
      );
      if (!periode || periode.status !== 'dibuka')
        return { ok: false, error: 'Pendaftaran periode ini tidak dibuka.' };

      // --- BR#12 + BR#28 ---
      if (input.metodeBayar === 'dp_cicilan') {
        if (!kelas.biaya_dp)
          return { ok: false, error: 'Metode cicilan tidak tersedia untuk kelas ini (BR#12).' };
        const tenor = input.tenorBulan ?? 0;
        if (tenor < 2) return { ok: false, error: 'Tenor minimal 2 (DP + ≥1 cicilan, BR#28).' };
        if (kelas.tenor_maksimum != null && tenor > kelas.tenor_maksimum)
          return {
            ok: false,
            error: `Tenor melebihi batas kelas (${kelas.tenor_maksimum} bulan, BR#28).`,
          };
      } else if (input.tenorBulan != null) {
        return { ok: false, error: 'Tenor hanya untuk metode DP+Cicilan (BR#28).' };
      }

      // --- BR#9: bentrok jadwal lintas pasangan JadwalItem (hari sama + jam beririsan) ---
      const [bentrok] = await collect(
        tx.query(
          db.raw.sql`select exists (
              select 1
              from pendaftaran p2
              join jadwal_item j2 on j2.kelas_id = p2.kelas_id
              join jadwal_item j1 on j1.kelas_id = ${input.kelasId}
              where p2.anak_id = ${input.anakId}
                and p2.kelas_id <> ${input.kelasId}
                and p2.periode_id = ${kelas.periode_id}
                and p2.status = any(array['menunggu_pembayaran','terdaftar','tertunggak'])
                and j1.hari = j2.hari
                and j1.jam_mulai < j2.jam_selesai
                and j2.jam_mulai < j1.jam_selesai
            ) as bentrok`
            .returnsRow({ bentrok: 'pg/bool@1' })
            .build(),
        ),
      );
      if (bentrok?.bentrok)
        return { ok: false, error: 'Jadwal bentrok dengan kelas aktif lain (BR#9).' };

      // --- insert Pendaftaran (BR#29 dijaga partial unique DB) ---
      // ponytail: dua cabang — raw lane menolak interpolasi `null` tanpa codec.
      const insertPendaftaran =
        input.metodeBayar === 'dp_cicilan'
          ? db.raw.sql`insert into pendaftaran (anak_id, kelas_id, periode_id, jenjang_saat_daftar, metode_bayar, tenor_bulan, status, created_at, updated_at)
              values (${input.anakId}, ${input.kelasId}, ${kelas.periode_id},
                      ${anak.jenjang_terakhir}, ${input.metodeBayar}, ${input.tenorBulan ?? 0},
                      'menunggu_pembayaran', now(), now())
              returning id`
          : db.raw.sql`insert into pendaftaran (anak_id, kelas_id, periode_id, jenjang_saat_daftar, metode_bayar, tenor_bulan, status, created_at, updated_at)
              values (${input.anakId}, ${input.kelasId}, ${kelas.periode_id},
                      ${anak.jenjang_terakhir}, ${input.metodeBayar}, null,
                      'menunggu_pembayaran', now(), now())
              returning id`;
      const [pendaftaran] = await collect(
        tx.query(insertPendaftaran.returnsRow({ id: 'pg/int4@1' }).build()),
      );
      if (!pendaftaran) return { ok: false, error: 'Gagal membuat pendaftaran.' };

      // --- BR#14: terbitkan tagihan pertama ---
      const jatuhTempo = datePlusDays(7);
      const tipe = input.metodeBayar === 'lunas' ? 'lunas' : 'dp';
      const jumlah = input.metodeBayar === 'lunas' ? kelas.biaya_periode : kelas.biaya_dp;
      await tx.execute(
        db.raw.sql`insert into pembayaran (pendaftaran_id, tipe, jumlah, jatuh_tempo, status, created_at, updated_at)
            values (${pendaftaran.id}, ${tipe}, ${jumlah}::numeric, ${jatuhTempo}::date, 'pending', now(), now())`
          .affectedCount()
          .build(),
      );

      // --- BR#1: kunci kuota ---
      await tx.execute(
        db.raw.sql`update kelas set kuota_terisi = kuota_terisi + 1, updated_at = now() where id = ${input.kelasId}`
          .affectedCount()
          .build(),
      );

      return { ok: true, value: { pendaftaranId: pendaftaran.id } };
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('pendaftaran_aktif_unique'))
      return { ok: false, error: 'Anak sudah punya pendaftaran aktif di kelas ini (BR#29).' };
    throw e;
  }
}

/**
 * BR#2 + BR#11 — batalkan Pendaftaran yang lewat 24 jam tanpa pembayaran berhasil,
 * lepas kuota dalam transaction yang sama. Dipanggil route /api/cron/check-timeout (BR#21).
 */
export async function processTimeouts(): Promise<{ dibatalkan: number }> {
  return db.transaction(async (tx) => {
    const expired = await collect(
      tx.query(
        db.raw.sql`select p.id, p.kelas_id from pendaftaran p
            where p.status = 'menunggu_pembayaran'
              and p.created_at < now() - interval '24 hours'
              and not exists (
                select 1 from pembayaran b
                where b.pendaftaran_id = p.id and b.status = 'berhasil')
            for update of p`
          .returnsRow({ id: 'pg/int4@1', kelas_id: 'pg/int4@1' })
          .build(),
      ),
    );
    for (const p of expired) {
      await tx.execute(
        db.raw.sql`update pendaftaran set status = 'dibatalkan_timeout', updated_at = now() where id = ${p.id}`
          .affectedCount()
          .build(),
      );
      await tx.execute(
        db.raw.sql`update kelas set kuota_terisi = greatest(kuota_terisi - 1, 0), updated_at = now() where id = ${p.kelas_id}`
          .affectedCount()
          .build(),
      );
    }
    return { dibatalkan: expired.length };
  });
}

/**
 * Item 10 — syarat Pendaftaran naik ke 'terdaftar': semua tagihan berhasil.
 * Dipakai webhook Midtrans (item 16) setelah set pembayaran 'berhasil'.
 */
export async function memenuhiSyaratTerdaftar(pendaftaranId: number): Promise<boolean> {
  const [r] = await collect(
    db.runtime().query(
      db.raw.sql`select not exists (
          select 1 from pembayaran where pendaftaran_id = ${pendaftaranId} and status <> 'berhasil'
        ) as lunas_semuanya`
        .returnsRow({ lunas_semuanya: 'pg/bool@1' })
        .build(),
    ),
  );
  return r?.lunas_semuanya ?? false;
}

/**
 * BR#13 — kelas tersedia untuk jenjang anak (halaman pilih kelas).
 */
export async function kelasTersediaUntukJenjang(jenjang: Jenjang) {
  const kelas = await db.orm.public.Kelas
    .where((k) => k.jenjang.eq(jenjang))
    .where((k) => k.status.eq('aktif'))
    .include('mataPelajaran', (b) => b.select('id', 'nama', 'deskripsi'))
    .include('guru', (b) => b.select('id', 'name'))
    .include('periode', (b) => b.select('id', 'nama', 'status'))
    .include('jadwalItem', (b) => b.select('id', 'hari', 'jamMulai', 'jamSelesai').orderBy((j) => j.hari.asc()))
    .all();
  // ponytail: .lt antar-dua-kolom bug di orm rc.8 (param ter-serialisasi mentah);
  // filter kuota di JS aman untuk skala lembaga. Upgrade: pindah ke .lt(field) setelah fixed.
  return kelas.filter((k) => k.kuotaTerisi < k.kuotaMaksimum);
}
