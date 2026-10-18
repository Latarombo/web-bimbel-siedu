import { db } from '../prisma/db';
import { collect } from './collect';
import { labelHari } from './label';

import { UKURAN_HALAMAN_KATALOG, type FilterKatalog } from './katalog-shared';

export * from './katalog-shared';

export async function kelasKatalogHalaman(filter: FilterKatalog, locale: string = 'id') {
  const hariLabels = JSON.stringify(Object.fromEntries(
    ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((hari) => [hari, labelHari(hari, locale)]),
  ));
  const belumAdaJadwal = locale === 'en' ? 'Schedule to follow' : 'Jadwal menyusul';

  const rawTingkat = (filter.tingkat ?? '').trim();
  const numMatch = rawTingkat.match(/\b(\d+)\b/);
  const gradeNum = numMatch ? parseInt(numMatch[1], 10) : 0;
  const isTkA = Boolean(rawTingkat && /\b(tk\s*a|kelompok\s*a|\ba\b)/i.test(rawTingkat));
  const isTkB = Boolean(rawTingkat && /\b(tk\s*b|kelompok\s*b|\bb\b)/i.test(rawTingkat));

  const qClean = filter.q.trim();
  const qWords = qClean.toLowerCase().split(/\s+/).filter(Boolean);
  const qWordsJson = JSON.stringify(qWords);

  const plan = db.raw.sql`
    with jadwal_teks as (
      select j.kelas_id, string_agg(
        (${hariLabels}::jsonb ->> j.hari) || ' ' || left(j.jam_mulai::text, 5) || '-' || left(j.jam_selesai::text, 5),
        ', ' order by j.hari
      ) as teks
      from jadwal_item j
      group by j.kelas_id
    ), kelas_search as (
      select
        k.id, k.jenjang, k.tingkat, k.biaya_periode, k.created_at, k.status, k.mata_pelajaran_id,
        m.nama as mapel_nama, coalesce(m.deskripsi, '') as mapel_deskripsi,
        lower(m.nama || ' ' || coalesce(m.deskripsi, '') || ' ' || k.jenjang::text || ' ' || coalesce(k.tingkat, '') || ' ' || coalesce(k.ruangan, '') || ' ' || g.name || ' ' || coalesce(jt.teks, ${belumAdaJadwal})) as searchable
      from kelas k
      join mata_pelajaran m on m.id = k.mata_pelajaran_id
      join users g on g.id = k.guru_id
      left join jadwal_teks jt on jt.kelas_id = k.id
    ), cocok as materialized (
      select id, jenjang, biaya_periode, created_at
      from kelas_search
      where status = 'aktif'
        and (${filter.mapelId ?? 0} = 0 or mata_pelajaran_id = ${filter.mapelId ?? 0})
        and (
          ${rawTingkat} = '' or ${rawTingkat} = 'Semua'
          or lower(coalesce(tingkat, '')) = lower(${rawTingkat})
          or strpos(lower(coalesce(tingkat, '')), lower(${rawTingkat})) > 0
          or strpos(lower(mapel_nama || ' ' || mapel_deskripsi), lower(${rawTingkat})) > 0
          or (${gradeNum} > 0 and (
            coalesce(tingkat, '') ~* ('\m' || ${gradeNum}::text || '\M')
            or (
              (regexp_match(coalesce(tingkat, ''), '(\d+)\s*[-–—]\s*(\d+)')) is not null
              and ${gradeNum} between ((regexp_match(coalesce(tingkat, ''), '(\d+)\s*[-–—]\s*(\d+)'))[1])::int
                                  and ((regexp_match(coalesce(tingkat, ''), '(\d+)\s*[-–—]\s*(\d+)'))[2])::int
            )
          ))
          or (${isTkA} and (
            coalesce(tingkat, '') ~* '\m(tk\s*)?a\M'
            or lower(coalesce(tingkat, '')) like '%kelompok a%'
            or lower(coalesce(tingkat, '')) like '%preschool%'
          ))
          or (${isTkB} and (
            coalesce(tingkat, '') ~* '\m(tk\s*)?b\M'
            or lower(coalesce(tingkat, '')) like '%kelompok%b%'
          ))
        )
        and (
          ${qClean} = ''
          or strpos(searchable, lower(${qClean})) > 0
          or not exists (
            select 1 from jsonb_array_elements_text(${qWordsJson}::jsonb) as elem
            where strpos(searchable, elem) = 0
              and not (
                elem ~ '^\d+$'
                and (regexp_match(coalesce(tingkat, ''), '(\d+)\s*[-–—]\s*(\d+)')) is not null
                and elem::int between ((regexp_match(coalesce(tingkat, ''), '(\d+)\s*[-–—]\s*(\d+)'))[1])::int
                                  and ((regexp_match(coalesce(tingkat, ''), '(\d+)\s*[-–—]\s*(\d+)'))[2])::int
              )
          )
        )
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
