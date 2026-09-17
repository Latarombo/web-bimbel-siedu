// Windows: node --test scripts/selfcheck-presensi-action.mjs
// Actual action, with authentication/Next and persistence isolated in memory.
// Does not prove PostgreSQL constraints, transactions or HTTP transport.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as hari from '../src/lib/hari.ts';
import * as rencanaSesi from '../src/lib/rencana-sesi.ts';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/app/actions/teacher.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const pageSource = readFileSync(new URL('../src/app/[locale]/(teacher)/teacher/classes/[classId]/sessions/[date]/attendance/page.tsx', import.meta.url), 'utf8');
const compiledPage = ts.transpileModule(pageSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

const compiledViews = ['dashboard/page.tsx', 'classes/[classId]/page.tsx'].map(path => ts.transpileModule(
  readFileSync(new URL(`../src/app/[locale]/(teacher)/teacher/${path}`, import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } },
).outputText);
function elements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => elements(child, predicate));
  if (!node || typeof node !== 'object' || !node.props) return [];
  return [...(predicate(node.props) ? [node.props] : []), ...elements(node.props.children, predicate)];
}

function harness({ status = 'aktif', guruId = 7, weekday = 'Kamis', failInsert = 0, sesiDibatalkan = false } = {}) {
  let inserts = 0;
  const writes = [];
  const rows = {
    Kelas: [{ id: 1, guruId, periodeId: 2, status }],
    PeriodePendaftaran: [{ id: 2, tanggalMulai: '2026-09-01', tanggalSelesai: '2026-09-30', status: 'ditutup' }],
    JadwalItem: [{ id: 11, kelasId: 1, hari: weekday, jamMulai: '08:00:00', jamSelesai: '09:00:00' }],
    MataPelajaran: [], Anak: [], NilaiProgres: [],
    Pendaftaran: [{ id: 5, kelasId: 1, status: 'terdaftar' }],
    Presensi: [],
    SesiPertemuan: sesiDibatalkan ? [{ id: 500, jadwalItemId: 11, tanggalPertemuan: '2026-09-17', statusSesi: 'dibatalkan', jamMulai: '08:00:00', jamSelesai: '09:00:00' }] : [],
  };
  function table(name, predicates = []) {
    assert.ok(Object.hasOwn(rows, name), `Unexpected table ${name}`);
    return {
      where(condition) {
        const predicate = typeof condition === 'function'
          ? condition(new Proxy({}, { get: (_, key) => ({
            eq: value => row => row[key] === value,
            gte: value => row => row[key] >= value,
            in: values => row => values.includes(row[key]),
          }) }))
          : row => Object.entries(condition).every(([key, value]) => row[key] === value);
        return table(name, [...predicates, predicate]);
      },
      async *all() { yield* rows[name].filter(row => predicates.every(p => p(row))); },
      async create(data) {
        if (name === 'Presensi' && ++inserts === failInsert) throw new Error('TEST_INSERT_FAILURE');
        const row = { id: rows[name].length + 100, createdAt: new Date().toISOString(), ...data };
        rows[name].push(row);
        writes.push({ name, data }); return row;
      },
      async update(data) { writes.push({ name, data }); },
    };
  }
  const orm = { public: new Proxy({}, { get: (_, key) => table(key) }) };
  const db = { orm, raw: { sql(strings, ...values) {
    const sql = strings.join('?');
    assert.match(sql, /for update/i);
    return { returnsRow() { return { build() { return { sql, values }; } }; } };
  } }, async transaction(fn) {
    const before = structuredClone(rows);
    const count = writes.length;
    try { return await fn({ orm, async *query({ sql, values: [id, second] }) {
      if (sql.includes('from public.kelas')) yield* rows.Kelas.filter(k => k.id === id && k.guruId === second);
      else if (sql.includes('from public.sesi_pertemuan')) yield* rows.SesiPertemuan.filter(s => s.jadwalItemId === id && s.tanggalPertemuan === second);
      else throw new Error('Unexpected SQL');
    } }); } catch (error) {
      for (const name of Object.keys(rows)) rows[name].splice(0, rows[name].length, ...before[name]);
      writes.splice(count);
      throw error;
    }
  } };
  const actionModule = { exports: {} };
  const context = {
    exports: actionModule.exports, module: actionModule,
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : ['2026-09-17T03:00:00Z'])); }
    },
    require(name) {
      if (name === '@/prisma/db') return { db };
      if (name === '@/lib/auth') return { auth: async () => ({ user: { id: '7', role: 'guru' } }) };
      if (name === '@/i18n/locale') return { getLocaleDariCookie: async () => 'id' };
      if (name === 'next-intl/server') return { getTranslations: async () => (key, values) => values ? `${key}:${JSON.stringify(values)}` : key, getLocale: async () => 'id' };
      if (name === 'next/navigation') return { notFound() { throw new Error('NOT_FOUND'); } };
      if (name === '@/i18n/navigation') return { Link: 'a', redirect() { throw new Error('REDIRECT'); } };
      if (name.startsWith('@/components/')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? true : 'div' });
      if (name === 'next/cache') return { revalidatePath() {} };
      if (name === '@/lib/hari') return hari;
      if (name === '@/lib/rencana-sesi') return rencanaSesi;
      if (name === '@/lib/collect') return { collect: async iterable => {
        const result = []; for await (const row of iterable) result.push(row); return result;
      } };
      return require(name);
    },
  };
  vm.runInNewContext(compiled, context);
  const pageModule = { exports: {} };
  vm.runInNewContext(compiledPage, { ...context, exports: pageModule.exports, module: pageModule });
  const views = compiledViews.map(code => {
    const viewModule = { exports: {} };
    vm.runInNewContext(code, { ...context, exports: viewModule.exports, module: viewModule });
    return viewModule.exports.default;
  });
  return {
    dashboard: () => views[0](),
    detail: () => views[1]({ params: Promise.resolve({ classId: '1' }) }),
    writes, rows,
    page(date, sesi) {
      return pageModule.exports.default({ params: Promise.resolve({ classId: "1", date }), searchParams: Promise.resolve({ sesi }) });
    },
    async save(tanggal, slot = '11') {
      const form = new FormData();
      for (const [key, value] of Object.entries({ kelas_id: '1', jadwal_item_id: slot, tanggal, presensi_5: 'hadir', presensi_6: 'izin' })) form.set(key, value);
      return actionModule.exports.savePresensi({}, form);
    },
  };
}

test('halaman menolak tanggal invalid, luar periode, kelas batal dan slot eksplisit salah', async () => {
  for (const date of ['2026-02-30', '2026-08-27', '2026-10-01']) {
    await assert.rejects(harness().page(date), /NOT_FOUND/);
  }
  await assert.rejects(harness({ status: 'dibatalkan' }).page('2026-09-17'), /NOT_FOUND/);
  await assert.rejects(harness().page('2026-09-17', '999'), /NOT_FOUND/);
});

test('tanggal dalam periode diterima walau pendaftaran ditutup, sesi terbentuk satu transaksi', async () => {
  const app = harness();
  assert.equal((await app.save('2026-09-17')).ok, true);
  assert.equal(app.writes.length, 2);
  const sesiWrite = app.writes.find((w) => w.name === 'SesiPertemuan');
  assert.equal(sesiWrite.data.jamMulai, '08:00:00');
  assert.equal(sesiWrite.data.jamSelesai, '09:00:00');
  assert.equal(app.rows.Presensi[0].sesiPertemuanId, sesiWrite.data.id ?? app.rows.SesiPertemuan[0].id);
  assert.ok(await app.page('2026-09-17', '11'));
});

test('sesi dibatalkan ditolak tanpa menulis presensi', async () => {
  const app = harness({ sesiDibatalkan: true });
  const result = await app.save('2026-09-17');
  assert.equal(result.error, 'attendanceSessionCancelled');
  assert.equal(app.writes.length, 0);
  await assert.rejects(app.page('2026-09-17', '11'), /NOT_FOUND/);
});

test('guru kelas lain dan slot milik kelas lain tetap ditolak', async () => {
  const other = harness({ guruId: 99 });
  assert.equal((await other.save('2026-09-17')).error, 'classNotOwned');
  assert.equal(other.writes.length, 0);
  const wrongSlot = harness();
  assert.equal((await wrongSlot.save('2026-09-17', '999')).error, 'invalidSession');
  assert.equal(wrongSlot.writes.length, 0);
});

test('kelas dibatalkan menolak presensi meskipun guru dan tanggal benar', async () => {
  const app = harness({ status: 'dibatalkan' });
  assert.equal((await app.save('2026-09-17')).error, 'attendanceClassCancelled');
  assert.equal(app.writes.length, 0);
});

test('tanggal semu ditolak sebagai tanggal invalid, bukan dialihkan ke hari lain', async () => {
  const app = harness({ weekday: 'Kamis' });
  assert.equal((await app.save('2026-02-30')).error, 'invalidDate');
  assert.equal(app.writes.length, 0);
});

test('presensi di luar periode ditolak sebelum menulis baris', async () => {
  for (const tanggal of ['2026-08-27', '2026-10-01']) {
    const app = harness();
    const result = await app.save(tanggal);
    assert.equal(result.error, 'attendanceOutsidePeriod');
    assert.equal(app.writes.length, 0);
  }
});


test('kegagalan siswa kedua membatalkan presensi siswa pertama, retry berhasil', async () => {
  const app = harness({ failInsert: 2 });
  app.rows.Pendaftaran.push({ id: 6, kelasId: 1, status: 'terdaftar' });
  await assert.rejects(app.save('2026-09-17'), /TEST_INSERT_FAILURE/);
  assert.equal(app.rows.Presensi.length, 0);
  assert.equal(app.rows.SesiPertemuan.length, 0);
  assert.equal(app.writes.length, 0);
  assert.equal((await app.save('2026-09-17')).ok, true);
  assert.equal(app.rows.Presensi.length, 2);
  assert.equal(app.rows.Presensi[0].sesiPertemuanId, app.rows.SesiPertemuan[0].id);
});


test('halaman presensi memakai snapshot jam untuk header dan pilihan slot', async () => {
  const app = harness();
  app.rows.SesiPertemuan.push({ id: 501, jadwalItemId: 11, tanggalPertemuan: '2026-09-17', statusSesi: 'terjadwal', jamMulai: '07:00:00', jamSelesai: '07:45:00' });
  app.rows.JadwalItem.push({ id: 12, kelasId: 1, hari: 'Kamis', jamMulai: '10:00:00', jamSelesai: '11:00:00' });
  const page = await app.page('2026-09-17', '11');
  const [header] = elements(page, p => p.desc?.startsWith('attendanceDescription:'));
  assert.match(header.desc, /"start":"07:00","end":"07:45"/);
  const [link] = elements(page, p => p.href?.endsWith('?sesi=11'));
  assert.equal(link.children.props.children.join(''), '07:00–07:45');
  assert.equal(app.writes.length, 0);
});


test('beranda membuka tiap slot yang tepat dengan snapshot jam, tanpa mutasi GET', async () => {
  const app = harness();
  app.rows.JadwalItem.push({ id: 12, kelasId: 1, hari: 'Kamis', jamMulai: '10:00:00', jamSelesai: '11:00:00' });
  app.rows.SesiPertemuan.push({ id: 501, jadwalItemId: 11, tanggalPertemuan: '2026-09-17', statusSesi: 'terjadwal', jamMulai: '07:00:00', jamSelesai: '07:45:00' });
  const view = await app.dashboard();
  const links = elements(view, p => p.href?.includes('/attendance'));
  assert.deepEqual(links.map(p => p.href).sort(), [
    '/teacher/classes/1/sessions/2026-09-17/attendance?sesi=11',
    '/teacher/classes/1/sessions/2026-09-17/attendance?sesi=12',
  ]);
  assert.ok(JSON.stringify(view).includes('07:45'));
  assert.equal(app.writes.length, 0);
});

test('beranda tidak menawarkan presensi di luar periode, kelas batal, atau sesi batal', async () => {
  for (const options of [{ status: 'dibatalkan' }, { sesiDibatalkan: true }, { outside: true }]) {
    const app = harness(options);
    if (options.outside) app.rows.PeriodePendaftaran[0].tanggalSelesai = '2026-09-10';
    const view = await app.dashboard();
    assert.equal(elements(view, p => p.href?.includes('/attendance')).length, 0);
    assert.equal(app.writes.length, 0);
  }
});


test('detail kelas menautkan tanggal pertemuan berikutnya per slot dan melewati sesi batal', async () => {
  const app = harness({ sesiDibatalkan: true });
  app.rows.JadwalItem.push({ id: 12, kelasId: 1, hari: 'Jumat', jamMulai: '10:00:00', jamSelesai: '11:00:00' });
  const view = await app.detail();
  const links = elements(view, p => p.href?.includes('/attendance'));
  assert.deepEqual(links.map(p => p.href).sort(), [
    '/teacher/classes/1/sessions/2026-09-18/attendance?sesi=12',
    '/teacher/classes/1/sessions/2026-09-24/attendance?sesi=11',
  ]);
  assert.equal(app.writes.length, 0);
});

test('detail kelas tidak menawarkan presensi setelah periode atau saat kelas dibatalkan', async () => {
  for (const cancelled of [true, false]) {
    const app = harness({ status: cancelled ? 'dibatalkan' : 'aktif' });
    if (!cancelled) app.rows.PeriodePendaftaran[0].tanggalSelesai = '2026-09-10';
    assert.equal(elements(await app.detail(), p => p.href?.includes('/attendance')).length, 0);
  }
});


test('sesi tersimpan tetap dapat dibuka dan disimpan setelah hari rutin berubah', async () => {
  const app = harness({ weekday: 'Jumat' });
  app.rows.SesiPertemuan.push({ id: 501, jadwalItemId: 11, tanggalPertemuan: '2026-09-17', statusSesi: 'terjadwal', jamMulai: '07:00:00', jamSelesai: '07:45:00' });
  assert.equal((await app.save('2026-09-17')).ok, true);
  assert.equal(app.rows.Presensi[0].sesiPertemuanId, 501);
  assert.ok(await app.page('2026-09-17', '11'));
  for (const view of [await app.dashboard(), await app.detail()]) {
    assert.ok(elements(view, p => p.href === '/teacher/classes/1/sessions/2026-09-17/attendance?sesi=11').length > 0);
  }
  assert.equal(app.rows.SesiPertemuan.length, 1);
});

test('hari tidak cocok tanpa sesi tersimpan tetap ditolak', async () => {
  const app = harness({ weekday: 'Jumat' });
  assert.match((await app.save('2026-09-17')).error, /^wrongWeekday/);
  await assert.rejects(app.page('2026-09-17', '11'), /NOT_FOUND/);
  assert.equal(app.writes.length, 0);
});


test('presensi tercatat tetap terbaca dan bisa dikoreksi saat pendaftaran sudah dibatalkan', async () => {
  const app = harness();
  app.rows.Pendaftaran[0].status = 'dibatalkan_orang_tua';
  app.rows.Pendaftaran.push({ id: 6, kelasId: 1, status: 'dibatalkan_orang_tua' });
  app.rows.Presensi.push({ id: 600, pendaftaranId: 5, jadwalItemId: 11, tanggalPertemuan: '2026-09-17', status: 'izin', createdAt: new Date().toISOString(), dicatatOleh: 7 });
  const view = await app.page('2026-09-17', '11');
  const [form] = elements(view, p => Array.isArray(p.siswa));
  assert.deepEqual(Array.from(form.siswa, s => s.pendaftaranId), [5]);
  assert.equal(form.siswa[0].status, 'izin');
  assert.equal((await app.save('2026-09-17')).ok, true);
  const attendanceWrites = app.writes.filter(w => w.name === 'Presensi');
  assert.equal(attendanceWrites.length, 1);
  assert.equal(attendanceWrites[0].data.status, 'hadir');
  assert.equal(app.rows.Presensi.length, 1);
});
