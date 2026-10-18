export const UKURAN_HALAMAN_KATALOG = 12;
export const JENJANG_KATALOG = ['Semua', 'TK', 'SD', 'SMP', 'SMA'] as const;
export type FilterKatalog = {
  q: string;
  jenjang: typeof JENJANG_KATALOG[number];
  mapelId?: number;
  tingkat?: string;
  sort: 'terbaru' | 'termurah' | 'termahal';
  page: number;
};

export function filterKatalog(params: Record<string, string | string[] | undefined>): FilterKatalog {
  const page = typeof params.page === 'string' && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  const mapelId = typeof params.mapelId === 'string' && /^\d+$/.test(params.mapelId) && Number(params.mapelId) > 0
    ? Number(params.mapelId)
    : undefined;
  const tingkat = typeof params.tingkat === 'string' && params.tingkat.trim().length > 0 && params.tingkat.trim() !== 'Semua'
    ? params.tingkat.trim().slice(0, 30)
    : undefined;
  return {
    q: typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '',
    jenjang: JENJANG_KATALOG.includes(params.jenjang as FilterKatalog['jenjang']) ? params.jenjang as FilterKatalog['jenjang'] : 'Semua',
    mapelId,
    tingkat,
    sort: params.sort === 'termurah' || params.sort === 'termahal' ? params.sort : 'terbaru',
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1_000_000) : 1,
  };
}

export function urlKatalog(filter: FilterKatalog, perubahan: Partial<FilterKatalog> = {}) {
  const next = { ...filter, ...perubahan };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.jenjang !== 'Semua') params.set('jenjang', next.jenjang);
  if (next.mapelId) params.set('mapelId', String(next.mapelId));
  if (next.tingkat && next.tingkat !== 'Semua') params.set('tingkat', next.tingkat);
  if (next.sort !== 'terbaru') params.set('sort', next.sort);
  if (next.page > 1) params.set('page', String(next.page));
  return `/classes${params.size ? `?${params}` : ''}`;
}

/** Filter/count di Postgres; hanya ID satu halaman dan empat hitungan keluar DB.
 * Raw lane dipakai untuk pencarian gabungan relasi dan count facet dalam satu snapshot.
 * Input menjadi parameter SQL, termasuk pilihan sort. Tidak ada SQL hasil konkatenasi.
 */
export function matchesTingkat(cTingkat: string | null | undefined, filterTingkat: string, jenjang?: string): boolean {
  if (!filterTingkat || filterTingkat === 'Semua') return true;
  if (!cTingkat) return false;
  const rawTingkat = filterTingkat.trim();
  const t = cTingkat.trim().toLowerCase();
  const rawLower = rawTingkat.toLowerCase();
  if (t === rawLower || t.includes(rawLower)) return true;

  const numMatch = rawTingkat.match(/\b(\d+)\b/);
  let gradeNum = numMatch ? parseInt(numMatch[1], 10) : 0;

  // Normalisasi alias penomoran jenjang (misal SMP Kelas 1 -> Kelas 7, SMA Kelas 2 -> Kelas 11)
  if (jenjang) {
    const jUpper = jenjang.toUpperCase();
    if (jUpper === 'SMP' && gradeNum >= 1 && gradeNum <= 3) {
      gradeNum += 6;
    } else if (jUpper === 'SMA' && gradeNum >= 1 && gradeNum <= 3) {
      gradeNum += 9;
    }
  }

  if (gradeNum > 0) {
    const wordRegex = new RegExp(`(^|\\D)${gradeNum}(\\D|$)`);
    if (wordRegex.test(t)) return true;
    const rangeMatch = t.match(/(\d+)\s*[-–—]\s*(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (gradeNum >= start && gradeNum <= end) return true;
    }
  }

  const isTkA = /\b(tk\s*a|kelompok\s*a|\ba\b)/i.test(rawTingkat);
  const isTkB = /\b(tk\s*b|kelompok\s*b|\bb\b)/i.test(rawTingkat);
  if (isTkA && (t.includes('kelompok a') || t.includes('preschool') || /(^|\D)(tk\s*)?a(\D|$)/i.test(t))) return true;
  if (isTkB && (t.includes('kelompok b') || /(^|\D)(tk\s*)?b(\D|$)/i.test(t))) return true;

  return false;
}
