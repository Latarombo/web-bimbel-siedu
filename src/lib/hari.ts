export type Hari = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu";

const MAP: Record<string, Hari> = {
  Monday: "Senin",
  Tuesday: "Selasa",
  Wednesday: "Rabu",
  Thursday: "Kamis",
  Friday: "Jumat",
  Saturday: "Sabtu",
  Sunday: "Minggu",
};

/** Tolak normalisasi Date seperti 30 Februari menjadi tanggal di bulan Maret. */
export function tanggalValid(value: string): boolean {
  const waktu = Date.parse(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(waktu)
    && new Date(waktu).toISOString().slice(0, 10) === value;
}

/** YYYY-MM-DD → enum Hari (UTC biar deterministik di server). */
export function hariDariTanggal(tgl: string): Hari {
  const d = new Date(`${tgl}T00:00:00Z`);
  return MAP[d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })];
}

/** Tanggal kalender Jakarta, terlepas dari zona waktu proses Node. */
export function tanggalWIB(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export function hariIni(now: Date = new Date()): Hari {
  return hariDariTanggal(tanggalWIB(now));
}

/** BR#18 — masih dalam jendela 7 hari sejak input pertama? */
export function dalamJendela7Hari(createdAt: Date | string): boolean {
  const t = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return Date.now() - t.getTime() <= 7 * 86_400_000;
}

/** Menghitung sisa waktu batas bayar 24 jam sejak pendaftaran dibuat. */
export function sisaWaktu24Jam(createdAt: Date | string): {
  isExpired: boolean;
  sisaJam: number;
  sisaMenit: number;
} {
  const t = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const deadlineMs = t.getTime() + 24 * 60 * 60 * 1000;
  const sisaMs = deadlineMs - Date.now();
  const isExpired = sisaMs <= 0;
  const sisaMenitTotal = Math.max(0, Math.floor(sisaMs / (1000 * 60)));
  const sisaJam = Math.floor(sisaMenitTotal / 60);
  const sisaMenit = sisaMenitTotal % 60;
  return { isExpired, sisaJam, sisaMenit };
}
