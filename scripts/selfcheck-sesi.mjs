// Windows: node --test scripts/selfcheck-sesi.mjs
// Pure date/session planning tests. No database connection or fixture writes.
import assert from 'node:assert/strict';
import test from 'node:test';
import { hariIni } from '../src/lib/hari.ts';

async function planner() {
  const loaded = await import('../src/lib/rencana-sesi.ts');
  return loaded.rencanakanSesi;
}

const kamis = { id: 11, hari: 'Kamis', jamMulai: '08:00:00', jamSelesai: '09:00:00' };

test('generator hanya membuat tanggal jadwal dalam batas periode inklusif', async () => {
  const rencanakanSesi = await planner();
  const sesi = rencanakanSesi('2026-09-17', '2026-10-01', [kamis]);
  assert.deepEqual(sesi, ['2026-09-17', '2026-09-24', '2026-10-01'].map(tanggalPertemuan => ({
    jadwalItemId: 11, tanggalPertemuan, jamMulai: '08:00:00', jamSelesai: '09:00:00',
  })));
});

test('generator menolak tanggal semu, format longgar, dan rentang terbalik', async () => {
  const rencanakanSesi = await planner();
  for (const [mulai, akhir] of [
    ['2026-02-30', '2026-03-05'], ['2026-02-01', '2026-02-29'],
    ['2026-9-1', '2026-10-01'], ['2026-10-01', '2026-09-01'],
  ]) assert.throws(() => rencanakanSesi(mulai, akhir, [kamis]), RangeError);
  assert.equal(rencanakanSesi('2024-02-29', '2024-02-29', [kamis]).length, 1);
});

test('rencana ulang melewati sesi yang sudah tersimpan tanpa mengubah snapshot jam', async () => {
  const rencanakanSesi = await planner();
  const existing = [{ jadwalItemId: 11, tanggalPertemuan: '2026-09-17' }];
  const jadwal = [kamis, { ...kamis, id: 12, jamMulai: '10:00:00', jamSelesai: '11:00:00' }];
  const sesi = rencanakanSesi('2026-09-17', '2026-09-17', jadwal, existing);
  assert.deepEqual(sesi.map(s => s.jadwalItemId), [12]);
  assert.equal(sesi[0].jamMulai, '10:00:00');
  assert.deepEqual(rencanakanSesi('2026-09-17', '2026-09-17', jadwal, [...existing, ...sesi]), []);
  assert.deepEqual(rencanakanSesi('2026-09-18', '2026-09-18', jadwal), []);
});

test('hari ini berganti tepat tengah malam WIB, bukan tengah malam UTC', () => {
  assert.equal(hariIni(new Date('2026-09-16T16:59:59Z')), 'Rabu');
  assert.equal(hariIni(new Date('2026-09-16T17:00:00Z')), 'Kamis');
});


test('renscan ulang membuat tanggal yang hilang di masa lalu dan masa depan, tidak melompati slot', async () => {
  const rencanakanSesi = await planner();
  const jadwal = [kamis, { ...kamis, id: 12, jamMulai: '10:00:00', jamSelesai: '11:00:00' }];
  const existing = [{ jadwalItemId: 11, tanggalPertemuan: '2026-09-03' }, { jadwalItemId: 12, tanggalPertemuan: '2026-09-03' }];
  const sesi = rencanakanSesi('2026-09-01', '2026-09-30', jadwal, existing);
  assert.deepEqual(sesi.map(s => `${s.jadwalItemId}:${s.tanggalPertemuan}`), [
    '11:2026-09-10', '12:2026-09-10', '11:2026-09-17', '12:2026-09-17', '11:2026-09-24', '12:2026-09-24',
  ]);
  assert.ok(sesi.every(s => s.jamMulai === '08:00:00' || s.jamMulai === '10:00:00'));
});
