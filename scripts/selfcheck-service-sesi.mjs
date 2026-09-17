// Windows: node --import ./scripts/ts-resolve.mjs --test scripts/selfcheck-service-sesi.mjs
// Real service; in-memory ORM boundary, NOT a PostgreSQL integration test.
import assert from 'node:assert/strict';
import test from 'node:test';
import { sinkronkanSesiKelas } from '../src/lib/service-sesi.ts';

function dbSeed({ status = 'aktif', guruId = 7, sesi = [], gagalPadaInsert = 0 } = {}) {
  const rows = {
    Kelas: [{ id: 1, guruId, periodeId: 2, status }],
    PeriodePendaftaran: [{ id: 2, tanggalMulai: '2026-09-01', tanggalSelesai: '2026-09-30' }],
    JadwalItem: [{ id: 11, kelasId: 1, hari: 'Kamis', jamMulai: '08:00:00', jamSelesai: '09:00:00' }],
    SesiPertemuan: sesi,
  };
  const writes = [];
  let jumlahInsert = 0;
  function table(name, predicates = []) {
    assert.ok(Object.hasOwn(rows, name), `Unexpected table ${name}`);
    return {
      where(condition) {
        const predicate = typeof condition === 'function'
          ? condition(new Proxy({}, { get: (_, key) => ({
            eq: value => row => row[key] === value,
            in: values => row => values.includes(row[key]),
          }) }))
          : row => Object.entries(condition).every(([key, value]) => row[key] === value);
        return table(name, [...predicates, predicate]);
      },
      async *all() { yield* rows[name].filter(row => predicates.every(p => p(row))); },
      async create(data) {
        jumlahInsert += 1;
        if (jumlahInsert === gagalPadaInsert) throw new Error("SIMULATED_INSERT_FAILURE");
        const row = { id: rows[name].length + 100, ...data };
        rows[name].push(row); writes.push({ name, data }); return row;
      },
    };
  }
  const orm = { public: new Proxy({}, { get: (_, key) => table(key) }) };
  const db = {
    orm,
    raw: { sql(strings, ...values) {
      assert.match(strings.join('?'), /for update/i);
      return { returnsRow() { return { build() { return values; } }; } };
    } },
    async transaction(callback) {
      const before = structuredClone(rows);
      const writeCount = writes.length;
      try { return await callback({ orm, async *query([kelasId, guruId]) {
        yield* rows.Kelas.filter(k => k.id === kelasId && k.guruId === guruId);
      } }); }
      catch (error) {
        for (const name of Object.keys(rows)) rows[name].splice(0, rows[name].length, ...before[name]);
        writes.splice(writeCount);
        throw error;
      }
    },
  };
  return { db, rows, writes };
}

test('sesi periode dibuat sekali dan snapshot lama tidak ditulis ulang', async () => {
  const env = dbSeed();
  assert.equal((await sinkronkanSesiKelas(env.db, 1, 7)).dibuat, 4);
  assert.deepEqual(env.rows.SesiPertemuan.map(s => s.tanggalPertemuan), ['2026-09-03', '2026-09-10', '2026-09-17', '2026-09-24']);
  env.rows.SesiPertemuan[0].jamMulai = '07:30:00';
  assert.equal((await sinkronkanSesiKelas(env.db, 1, 7)).dibuat, 0);
  assert.equal(env.rows.SesiPertemuan[0].jamMulai, '07:30:00');
  assert.equal(env.writes.length, 4);
});

test('insert kedua gagal: tidak ada sesi parsial, retry membuat seluruh sesi', async () => {
  const env = dbSeed({ gagalPadaInsert: 2 });
  await assert.rejects(sinkronkanSesiKelas(env.db, 1, 7), /SIMULATED_INSERT_FAILURE/);
  assert.equal(env.rows.SesiPertemuan.length, 0);
  assert.equal(env.writes.length, 0);
  assert.equal((await sinkronkanSesiKelas(env.db, 1, 7)).dibuat, 4);
  assert.equal(env.rows.SesiPertemuan.length, 4);
});

test('kelas batal dan kelas guru lain tidak menghasilkan sesi', async () => {
  for (const options of [{ status: 'dibatalkan' }, { guruId: 99 }]) {
    const env = dbSeed(options);
    await assert.rejects(sinkronkanSesiKelas(env.db, 1, 7));
    assert.equal(env.writes.length, 0);
  }
});
