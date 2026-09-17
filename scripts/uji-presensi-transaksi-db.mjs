// Windows: node --import ./scripts/ts-resolve.mjs scripts/uji-presensi-transaksi-db.mjs --allow-fixtures
// Actual action + PostgreSQL. Only auth/locale/cache are stubbed, not HTTP verification.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as hari from '../src/lib/hari.ts';
import { collect } from '../src/lib/collect.ts';

if (!process.argv.includes('--allow-fixtures') || !process.env.DATABASE_URL) throw new Error('Approved fixture opt-in and DATABASE_URL required');
const { db } = await import('../src/prisma/db.ts');
const require = createRequire(import.meta.url);
const tag = `uji-presensi-${randomUUID()}`;
const report = { tag, fixture: {}, tests: [], cleanup: false };
const ids = report.fixture;
const reportPath = new URL(`../docs/test-results/${tag}.json`, import.meta.url);
mkdirSync(new URL('../docs/test-results/', import.meta.url), { recursive: true });
const save = () => writeFileSync(reportPath, JSON.stringify(report, null, 2));
const compiled = ts.transpileModule(readFileSync(new URL('../src/app/actions/teacher.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
let inserts = 0;
let failAt = 2;
let invalidations = 0;
// Bind methods to the original receiver: ORM uses private class fields.
function wrappedOrm(orm) {
  return { public: new Proxy(orm.public, { get(models, key) {
    const value = Reflect.get(models, key);
    if (key !== 'Presensi') return value;
    return new Proxy(value, { get(collection, method) {
      if (method === 'create') return async data => {
        if (++inserts === failAt) throw new Error('TEST_INSERT_FAILURE');
        return collection.create(data);
      };
      const member = Reflect.get(collection, method);
      return typeof member === 'function' ? member.bind(collection) : member;
    } });
  } }) };
}
const wrappedDb = new Proxy(db, { get(target, key) {
  if (key === 'orm') return wrappedOrm(target.orm);
  if (key === 'transaction') return fn => target.transaction(tx => fn(new Proxy(tx, { get(t, k) {
    if (k === 'orm') return wrappedOrm(t.orm);
    const member = Reflect.get(t, k);
    return typeof member === 'function' ? member.bind(t) : member;
  } })));
  const member = Reflect.get(target, key);
  return typeof member === 'function' ? member.bind(target) : member;
} });
const actionModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: actionModule, exports: actionModule.exports,
  require(name) {
    if (name === '@/prisma/db') return { db: wrappedDb };
    if (name === '@/lib/auth') return { auth: async () => ({ user: { id: String(ids.guru), role: 'guru' } }) };
    if (name === '@/i18n/locale') return { getLocaleDariCookie: async () => 'id' };
    if (name === 'next-intl/server') return { getTranslations: async () => key => key };
    if (name === 'next/cache') return { revalidatePath() { invalidations++; } };
    if (name === '@/lib/hari') return hari;
    if (name === '@/lib/collect') return { collect };
    return require(name);
  },
});
async function submit(tanggal = '2026-09-17', statusPertama = 'hadir') {
  const form = new FormData();
  for (const [key, value] of Object.entries({ kelas_id: ids.kelas, jadwal_item_id: ids.slot, tanggal,
    [`presensi_${ids.p1}`]: statusPertama, [`presensi_${ids.p2}`]: 'izin' })) form.set(key, String(value));
  return actionModule.exports.savePresensi({}, form);
}
const attendance = () => db.orm.public.Presensi.where({ jadwalItemId: ids.slot }).all();
try {
  Object.assign(ids, await db.transaction(async tx => {
    const createUser = (suffix, role) => tx.orm.public.User.create({ role, name: `${tag}-${suffix}`, email: `${tag}-${suffix}@example.invalid`, nomorTelepon: '0000000000', password: '!disabled-test-account' });
    const guru = await createUser('guru', 'guru');
    const parent = await createUser('parent', 'orang_tua');
    const period = await tx.orm.public.PeriodePendaftaran.create({ nama: tag, tanggalMulai: '2026-09-01', tanggalSelesai: '2026-09-30', tanggalTutupPendaftaran: '2026-09-01', status: 'ditutup' });
    const subject = await tx.orm.public.MataPelajaran.create({ nama: tag });
    const kelas = await tx.orm.public.Kelas.create({ guruId: guru.id, periodeId: period.id, mataPelajaranId: subject.id, jenjang: 'SD', kuotaMaksimum: 10, kuotaMinimum: 1, biayaPeriode: '100000' });
    const slot = await tx.orm.public.JadwalItem.create({ kelasId: kelas.id, hari: 'Kamis', jamMulai: '08:00:00', jamSelesai: '09:00:00' });
    const kids = [];
    const enrollments = [];
    for (let i = 1; i <= 2; i++) {
      const kid = await tx.orm.public.Anak.create({ orangTuaId: parent.id, nama: `${tag}-${i}`, tanggalLahir: '2016-01-01', jenjangTerakhir: 'SD' });
      const enrollment = await tx.orm.public.Pendaftaran.create({ anakId: kid.id, kelasId: kelas.id, periodeId: period.id, jenjangSaatDaftar: 'SD', metodeBayar: 'lunas', status: 'terdaftar' });
      kids.push(kid.id); enrollments.push(enrollment.id);
    }
    return { guru: guru.id, parent: parent.id, periode: period.id, mapel: subject.id, kelas: kelas.id, slot: slot.id, a1: kids[0], a2: kids[1], p1: enrollments[0], p2: enrollments[1] };
  }));
  save();
  await assert.rejects(submit(), /TEST_INSERT_FAILURE/);
  assert.equal(inserts, 2);
  assert.equal((await attendance()).length, 0, 'Partial attendance must roll back');
  assert.equal((await db.orm.public.SesiPertemuan.where({ jadwalItemId: ids.slot }).all()).length, 0);
  assert.equal(invalidations, 0);
  report.tests.push({ name: 'second insert failure rolls back first attendance in PostgreSQL', ok: true });
  failAt = 0;
  assert.equal((await submit()).ok, true);
  const rows = await attendance();
  assert.equal(rows.length, 2);
  const sessions = await db.orm.public.SesiPertemuan.where({ jadwalItemId: ids.slot }).all();
  assert.equal(sessions.length, 1);
  assert.ok(rows.every(r => r.sesiPertemuanId === sessions[0].id));
  assert.equal(rows.find(r => r.pendaftaranId === ids.p1).status, 'hadir');
  assert.equal(rows.find(r => r.pendaftaranId === ids.p2).status, 'izin');
  assert.equal(invalidations, 1);
  report.tests.push({ name: 'retry saves both pupils during a closed enrollment period', ok: true });
  assert.equal((await submit()).ok, true);
  assert.equal((await attendance()).length, 2);
  report.tests.push({ name: 'sequential repeat does not duplicate attendance', ok: true });
  // Exercise concurrent first saves on another valid date without existing rows.
  const concurrent = await Promise.all([submit('2026-09-24'), submit('2026-09-24')]);
  assert.ok(concurrent.every(r => r.ok));
  assert.equal((await attendance()).length, 4);
  assert.equal((await db.orm.public.SesiPertemuan.where({ jadwalItemId: ids.slot }).all()).length, 2);
  report.tests.push({ name: 'concurrent first saves create one occurrence and two attendance rows', ok: true });
  await db.orm.public.Pendaftaran.where({ id: ids.p1 }).update({ status: 'dibatalkan_orang_tua' });
  assert.equal((await submit('2026-09-17', 'sakit')).ok, true);
  assert.equal((await attendance()).find(r => r.pendaftaranId === ids.p1 && r.tanggalPertemuan === '2026-09-17').status, 'sakit');
  assert.equal((await attendance()).length, 4);
  report.tests.push({ name: 'withdrawn pupil with recorded attendance remains correctable without duplicate rows', ok: true });
  await db.orm.public.JadwalItem.where({ id: ids.slot }).update({ hari: 'Jumat', jamMulai: '10:00:00', jamSelesai: '11:00:00' });
  assert.equal((await submit()).ok, true);
  assert.equal((await attendance()).length, 4);
  const preserved = await db.orm.public.SesiPertemuan.where({ id: sessions[0].id }).first();
  assert.equal(preserved.jamMulai, '08:00:00');
  assert.equal((await submit('2026-09-10')).error, 'wrongWeekday');
  report.tests.push({ name: 'stored occurrence survives recurring weekday change without duplicates or snapshot overwrite', ok: true });
  await db.orm.public.SesiPertemuan.where({ id: sessions[0].id }).update({ statusSesi: 'dibatalkan' });
  const beforeCancel = await attendance();
  assert.equal((await submit()).error, 'attendanceSessionCancelled');
  assert.deepEqual(await attendance(), beforeCancel);
  report.tests.push({ name: 'cancelled occurrence rejects action with no attendance changes', ok: true });
} catch (error) {
  report.failure = { name: error.name, code: error.code ?? error.cause?.code };
  if (error.code === 'ERR_ASSERTION') report.failure.assertion = error.message;
  process.exitCode = 1;
} finally {
  try {
    if (ids.kelas) {
      await db.transaction(async tx => {
        await tx.execute(db.raw.sql`delete from public.presensi where jadwal_item_id = ${ids.slot}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.sesi_pertemuan where jadwal_item_id = ${ids.slot}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.pendaftaran where id in (${ids.p1}, ${ids.p2}) and kelas_id = ${ids.kelas}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.anak where id in (${ids.a1}, ${ids.a2}) and orang_tua_id = ${ids.parent}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.jadwal_item where id = ${ids.slot} and kelas_id = ${ids.kelas}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.kelas where id = ${ids.kelas} and guru_id = ${ids.guru}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.mata_pelajaran where id = ${ids.mapel} and nama = ${tag}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.periode_pendaftaran where id = ${ids.periode} and nama = ${tag}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.users where id = ${ids.guru} and name = ${tag + '-guru'}`.affectedCount().build());
        await tx.execute(db.raw.sql`delete from public.users where id = ${ids.parent} and name = ${tag + '-parent'}`.affectedCount().build());
      });
      for (const [model, id] of [['User', ids.guru], ['User', ids.parent], ['Anak', ids.a1], ['Anak', ids.a2], ['Pendaftaran', ids.p1], ['Pendaftaran', ids.p2], ['Kelas', ids.kelas], ['JadwalItem', ids.slot], ['MataPelajaran', ids.mapel], ['PeriodePendaftaran', ids.periode]]) {
        assert.equal((await db.orm.public[model].where({ id }).all()).length, 0);
      }
      assert.equal((await attendance()).length, 0);
      assert.equal((await db.orm.public.SesiPertemuan.where({ jadwalItemId: ids.slot }).all()).length, 0);
    }
    report.cleanup = true;
  } catch (error) { report.cleanupError = error.code ?? error.cause?.code ?? error.name; process.exitCode = 1; }
  save();
  await db.close();
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath.pathname}`);
}
