import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const jenjang = searchParams.get('jenjang')?.trim() || 'Semua';

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Query rekomendasi kelas aktif yang cocok dengan query
    const rows = await collect(
      db.orm.public.Kelas
        .where((k) => k.status.eq('aktif'))
        .include('mataPelajaran', (b) => b.select('id', 'nama', 'deskripsi'))
        .include('guru', (b) => b.select('id', 'name'))
        .include('periode', (b) => b.select('id', 'nama'))
        .limit(15)
        .all()
    );

    const queryLower = q.toLowerCase();

    // Filter memori cepat untuk mencocokkan jenjang, mata pelajaran, deskripsi, atau guru
    const matches = rows
      .filter((k) => {
        if (jenjang !== 'Semua' && k.jenjang !== jenjang) {
          return false;
        }
        const mapelMatch = k.mataPelajaran.nama.toLowerCase().includes(queryLower);
        const descMatch = (k.mataPelajaran.deskripsi || '').toLowerCase().includes(queryLower);
        const guruMatch = k.guru.name.toLowerCase().includes(queryLower);
        return mapelMatch || descMatch || guruMatch;
      })
      .slice(0, 5)
      .map((k) => ({
        id: k.id,
        nama: k.mataPelajaran.nama,
        jenjang: k.jenjang,
        guru: k.guru.name,
        periode: k.periode.nama,
        biayaPeriode: Number(k.biayaPeriode),
      }));

    return NextResponse.json({ suggestions: matches });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
