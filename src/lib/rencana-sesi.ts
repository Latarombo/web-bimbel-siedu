import type { Hari } from './hari';

type SlotJadwal = {
  id: number;
  hari: Hari;
  jamMulai: string;
  jamSelesai: string;
};

type RencanaSesi = {
  jadwalItemId: number;
  tanggalPertemuan: string;
  jamMulai: string;
  jamSelesai: string;
};

const HARI: Hari[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function parseTanggal(value: string): number {
  const waktu = Date.parse(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(waktu)
    || new Date(waktu).toISOString().slice(0, 10) !== value) {
    throw new RangeError('Tanggal kalender tidak valid');
  }
  return waktu;
}

/** Rencana murni, belum menyimpan sesi atau membekukan peserta masa depan. */
export function rencanakanSesi(
  tanggalMulai: string,
  tanggalSelesai: string,
  jadwal: readonly SlotJadwal[],
  tersimpan: readonly Pick<RencanaSesi, 'jadwalItemId' | 'tanggalPertemuan'>[] = [],
): RencanaSesi[] {
  const awal = parseTanggal(tanggalMulai);
  const akhir = parseTanggal(tanggalSelesai);
  if (awal > akhir) throw new RangeError('Rentang periode terbalik');
  const hasil: RencanaSesi[] = [];
  const kunci = new Set(tersimpan.map(s => `${s.jadwalItemId}:${s.tanggalPertemuan}`));
  for (let waktu = awal; waktu <= akhir; waktu += 86_400_000) {
    const tanggal = new Date(waktu);
    const tanggalPertemuan = tanggal.toISOString().slice(0, 10);
    for (const slot of jadwal) {
      if (slot.hari !== HARI[tanggal.getUTCDay()]) continue;
      const key = `${slot.id}:${tanggalPertemuan}`;
      if (kunci.has(key)) continue;
      kunci.add(key);
      hasil.push({
        jadwalItemId: slot.id,
        tanggalPertemuan,
        jamMulai: slot.jamMulai,
        jamSelesai: slot.jamSelesai,
      });
    }
  }
  return hasil;
}
