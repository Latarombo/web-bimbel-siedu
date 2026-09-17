import type { db as database } from '../prisma/db';
import { collect } from './collect';
import { rencanakanSesi } from './rencana-sesi';

/**
 * Internal service: caller supplies the authenticated teacher ID, never a form
 * field. All reads/writes use one transaction; errors propagate for rollback.
 * Retries preserve occurrence/time snapshots. A class row lock serializes
 * concurrent syncs under PostgreSQL's default READ COMMITTED isolation.
 * Does not infer historical rosters or apply schedule exceptions.
 */
export async function sinkronkanSesiKelas(
  db: typeof database,
  kelasId: number,
  guruId: number,
): Promise<{ dibuat: number }> {
  return db.transaction(async (tx) => {
    // Serialize syncs for the same class before reading existing occurrences.
    // The lock also prevents cancellation/reassignment during this transaction.
    const [kelas] = await collect(tx.query(
      db.raw.sql`select id, periode_id as "periodeId", status from public.kelas
        where id = ${kelasId} and guru_id = ${guruId} for update`
        .returnsRow({ id: 'pg/int4@1', periodeId: 'pg/int4@1', status: 'pg/text@1' })
        .build(),
    ));
    if (!kelas || kelas.status !== 'aktif') throw new RangeError('Kelas tidak tersedia');
    const [periode] = await collect(
      tx.orm.public.PeriodePendaftaran.where((p) => p.id.eq(kelas.periodeId)).all(),
    );
    if (!periode) throw new RangeError('Periode tidak ditemukan');
    const jadwal = await collect(
      tx.orm.public.JadwalItem.where((j) => j.kelasId.eq(kelasId)).all(),
    );
    if (jadwal.length === 0) return { dibuat: 0 };
    const ids = jadwal.map((j) => j.id);
    const tersimpan = await collect(
      tx.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in(ids)).all(),
    );
    const rencana = rencanakanSesi(periode.tanggalMulai, periode.tanggalSelesai, jadwal, tersimpan);
    for (const sesi of rencana) {
      await tx.orm.public.SesiPertemuan.create(sesi);
    }
    return { dibuat: rencana.length };
  });
}
