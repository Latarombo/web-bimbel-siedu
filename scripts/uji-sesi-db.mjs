// PowerShell: node --import ./scripts/ts-resolve.mjs scripts/uji-sesi-db.mjs
// Explicit opt-in required. Uses only newly created fixture IDs; finally cleans them.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { sinkronkanSesiKelas } from '../src/lib/service-sesi.ts';

if (!process.argv.includes('--allow-fixtures')) throw new Error('Pass --allow-fixtures only for an approved database');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; no fallback');
const { db } = await import('../src/prisma/db.ts');
const tag = `uji-sesi-${randomUUID()}`;
const report = { tag, tests: [], cleanup: false, fixture: {} };
const reportPath = new URL(`../docs/test-results/${tag}.json`, import.meta.url);
mkdirSync(new URL('../docs/test-results/', import.meta.url), { recursive: true });
const saveReport = () => writeFileSync(reportPath, JSON.stringify(report, null, 2));
const ids = report.fixture;
async function sesiRows() {
  return await db.orm.public.SesiPertemuan.where(s => s.jadwalItemId.eq(ids.slot)).all();
}
async function check(name, fn) {
  try { await fn(); report.tests.push({ name, ok: true }); }
  catch (error) {
    report.tests.push({ name, ok: false, code: error.code ?? error.name });
    // No SQL parameters/connection strings/user data in logs.
    if (error.code === 'ERR_ASSERTION') report.tests.at(-1).assertion = error.message;
    process.exitCode = 1;
  }
  saveReport();
}
try {
  Object.assign(ids, await db.transaction(async tx => {
    const guru = await tx.orm.public.User.create({ role: 'guru', name: tag, email: `${tag}@example.invalid`, nomorTelepon: '0000000000', password: '!disabled-test-account' });
    const periode = await tx.orm.public.PeriodePendaftaran.create({ nama: tag, tanggalMulai: '2026-09-01', tanggalSelesai: '2026-09-30', tanggalTutupPendaftaran: '2026-09-01', status: 'ditutup' });
    const mapel = await tx.orm.public.MataPelajaran.create({ nama: tag });
    const kelas = await tx.orm.public.Kelas.create({ guruId: guru.id, periodeId: periode.id, mataPelajaranId: mapel.id, jenjang: 'SD', kuotaMaksimum: 10, kuotaMinimum: 1, biayaPeriode: '100000' });
    const slot = await tx.orm.public.JadwalItem.create({ kelasId: kelas.id, hari: 'Kamis', jamMulai: '08:00:00', jamSelesai: '09:00:00' });
    return { guru: guru.id, periode: periode.id, mapel: mapel.id, kelas: kelas.id, slot: slot.id };
  }));
  saveReport();
  await check('PostgreSQL rollback after second insert fails', async () => {
    let count = 0;
    const failing = new Proxy(db, { get(target, key) {
      if (key !== 'transaction') return Reflect.get(target, key);
      return callback => target.transaction(tx => callback(new Proxy(tx, { get(t, k) {
        if (k !== 'orm') return Reflect.get(t, k);
        return { public: new Proxy(t.orm.public, { get(models, model) {
          const collection = Reflect.get(models, model);
          if (model !== 'SesiPertemuan') return collection;
          return new Proxy(collection, { get(c, method) {
            if (method !== 'create') {
              const value = Reflect.get(c, method);
              return typeof value === 'function' ? value.bind(c) : value;
            }
            return async data => { if (++count === 2) throw new Error('TEST_INSERT_FAILURE'); return c.create(data); };
          } });
        } }) };
      } })));
    } });
    await assert.rejects(sinkronkanSesiKelas(failing, ids.kelas, ids.guru), /TEST_INSERT_FAILURE/);
    assert.equal((await sesiRows()).length, 0);
  });
  await check('Concurrent sync requests both succeed without duplicate sessions', async () => {
    const results = await Promise.allSettled([
      sinkronkanSesiKelas(db, ids.kelas, ids.guru),
      sinkronkanSesiKelas(db, ids.kelas, ids.guru),
    ]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 2);
    assert.equal(results.reduce((n, r) => n + (r.status === 'fulfilled' ? r.value.dibuat : 0), 0), 4);
    assert.equal((await sesiRows()).length, 4);
  });
  await check('Sequential retry preserves stored time snapshot', async () => {
    const [first] = await sesiRows();
    assert.ok(first);
    await db.orm.public.SesiPertemuan.where({ id: first.id }).update({ jamMulai: '07:30:00' });
    assert.equal((await sinkronkanSesiKelas(db, ids.kelas, ids.guru)).dibuat, 0);
    assert.equal((await sesiRows()).find(s => s.id === first.id).jamMulai, '07:30:00');
  });
  await check('Other teacher cannot sync this fixture class', async () => {
    await assert.rejects(sinkronkanSesiKelas(db, ids.kelas, -1), /Kelas tidak tersedia/);
    assert.equal((await sesiRows()).length, 4);
  });
} catch (error) {
  report.setupError = error.code ?? error.name;
  process.exitCode = 1;
} finally {
  try {
    if (ids.kelas) {
      await db.transaction(async tx => {
        await tx.execute(db.raw.sql`delete from public.sesi_pertemuan where jadwal_item_id = ${ids.slot}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.jadwal_item where id = ${ids.slot} and kelas_id = ${ids.kelas}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.kelas where id = ${ids.kelas} and guru_id = ${ids.guru}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.mata_pelajaran where id = ${ids.mapel} and nama = ${tag}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.periode_pendaftaran where id = ${ids.periode} and nama = ${tag}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.users where id = ${ids.guru} and name = ${tag}`.affectedCount().build());
      });
      for (const [model, id] of [['User', ids.guru], ['Kelas', ids.kelas], ['JadwalItem', ids.slot], ['MataPelajaran', ids.mapel], ['PeriodePendaftaran', ids.periode]]) {
        assert.equal((await db.orm.public[model].where({ id }).all()).length, 0);
      }
      assert.equal((await sesiRows()).length, 0);
    }
    report.cleanup = true;
  } catch (error) { report.cleanupError = error.code ?? error.name; process.exitCode = 1; }
  saveReport();
  await db.close();
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath.pathname}`);
}
