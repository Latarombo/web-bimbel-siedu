import { db } from '../prisma/db';
import { collect } from './collect';
import { labelHari } from './label';

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
export async function kelasKatalogHalaman(filter: FilterKatalog, locale: string = 'id') {
  const hariLabels = JSON.stringify(Object.fromEntries(
    ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((hari) => [hari, labelHari(hari, locale)]),
  ));
  const belumAdaJadwal = locale === 'en' ? 'Schedule to follow' : 'Jadwal menyusul';
  const plan = db.raw.sql`
    with cocok as materialized (
      select k.id, k.jenjang, k.biaya_periode, k.created_at
      from kelas k
      join mata_pelajaran m on m.id = k.mata_pelajaran_id
      join users g on g.id = k.guru_id
      where k.status = 'aktif'
        and (${filter.mapelId ?? 0} = 0 or k.mata_pelajaran_id = ${filter.mapelId ?? 0})
        and (${filter.tingkat ?? ''} = '' or ${filter.tingkat ?? ''} = 'Semua' or lower(coalesce(k.tingkat, '')) = lower(${filter.tingkat ?? ''}) or strpos(lower(m.nama || ' ' || coalesce(m.deskripsi, '')), lower(${filter.tingkat ?? ''})) > 0)
        and (${filter.q} = '' or strpos(lower(
          m.nama || ' ' || coalesce(m.deskripsi, '') || ' ' || g.name || ' ' || coalesce((
            select string_agg(
              (${hariLabels}::jsonb ->> j.hari) || ' ' || left(j.jam_mulai::text, 5) || '-' || left(j.jam_selesai::text, 5),
              ', ' order by j.hari
            ) from jadwal_item j where j.kelas_id = k.id
          ), ${belumAdaJadwal})
        ), lower(${filter.q})) > 0)
    ), hitungan as (
      select jenjang, count(*)::int as jumlah from cocok group by jenjang
    ), total as (
      select coalesce(sum(jumlah) filter (where ${filter.jenjang} = 'Semua' or jenjang = ${filter.jenjang}), 0)::int as jumlah
      from hitungan
    ), halaman as (
      select jumlah, greatest(1, ceil(jumlah::numeric / ${UKURAN_HALAMAN_KATALOG})::int) as maksimum,
        least(${filter.page}, greatest(1, ceil(jumlah::numeric / ${UKURAN_HALAMAN_KATALOG})::int)) as nomor
      from total
    ), hasil as (
      select id from cocok
      where ${filter.jenjang} = 'Semua' or jenjang = ${filter.jenjang}
      order by
        case when ${filter.sort} = 'termurah' then biaya_periode end asc,
        case when ${filter.sort} = 'termahal' then biaya_periode end desc,
        created_at desc, id desc
      limit ${UKURAN_HALAMAN_KATALOG}
      offset (select (nomor - 1) * ${UKURAN_HALAMAN_KATALOG} from halaman)
    )
    select json_build_object(
      'ids', coalesce((select json_agg(id) from hasil), '[]'::json),
      'jumlahJenjang', coalesce((select json_object_agg(jenjang, jumlah) from hitungan), '{}'::json),
      'total', jumlah, 'page', nomor, 'totalPages', maksimum
    )::text as data from halaman
  `.returnsRow({ data: 'pg/text@1' }).build();
  const [result] = await collect(db.runtime().query(plan));
  const info = JSON.parse(result.data) as {
    ids: number[]; jumlahJenjang: Record<string, number>; total: number; page: number; totalPages: number;
  };
  // Relasi hanya dimuat untuk maksimal 12 ID, bukan seluruh katalog.
  const rows = info.ids.length ? await collect(
    db.orm.public.Kelas.where((k) => k.id.in(info.ids))
      .include('mataPelajaran', (b) => b.select('id', 'nama', 'deskripsi'))
      .include('guru', (b) => b.select('id', 'name'))
      .include('periode', (b) => b.select('id', 'nama'))
      .include('jadwalItem', (b) => b.select('id', 'hari', 'jamMulai', 'jamSelesai').orderBy((j) => j.hari.asc()))
      .limit(UKURAN_HALAMAN_KATALOG).all(),
  ) : [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  return {
    ...info,
    rows: info.ids.flatMap((id) => { const row = byId.get(id); return row ? [row] : []; }),
    semua: Object.values(info.jumlahJenjang).reduce((sum, count) => sum + count, 0),
  };
}

export async function daftarMataPelajaranKatalog() {
  return collect(db.orm.public.MataPelajaran.orderBy((m) => m.nama.asc()).all());
}
