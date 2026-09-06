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

/** YYYY-MM-DD → enum Hari (UTC biar deterministik di server). */
export function hariDariTanggal(tgl: string): Hari {
  const d = new Date(`${tgl}T00:00:00Z`);
  return MAP[d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })];
}

export function hariIni(): Hari {
  const now = new Date();
  const tgl = now.toISOString().slice(0, 10);
  return hariDariTanggal(tgl);
}

/** BR#18 — masih dalam jendela 7 hari sejak input pertama? */
export function dalamJendela7Hari(createdAt: Date | string): boolean {
  const t = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return Date.now() - t.getTime() <= 7 * 86_400_000;
}
