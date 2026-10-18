import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { matchesTingkat } from '@/lib/katalog-shared';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const jenjang = searchParams.get('jenjang')?.trim() || 'Semua';
  const tingkat = searchParams.get('tingkat')?.trim() || '';

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
        .limit(50)
        .all()
    );

    const queryLower = q.toLowerCase();
    const qWords = queryLower.split(/\s+/).filter(Boolean);

    // Filter memori untuk mencocokkan jenjang, tingkat, mata pelajaran, deskripsi, atau guru
    const matches = rows
      .filter((k) => {
        if (jenjang !== 'Semua' && k.jenjang !== jenjang) {
          return false;
        }
        if (tingkat && !matchesTingkat(k.tingkat, tingkat)) {
          return false;
        }

        const searchable = `${k.mataPelajaran.nama} ${k.mataPelajaran.deskripsi || ''} ${k.jenjang} ${k.tingkat || ''} ${k.guru.name}`.toLowerCase();

        // 1. Cek langsung kecocokan substring lengkap
        if (searchable.includes(queryLower)) return true;

        // 2. Cek apakah setiap kata pencarian ada di data kelas
        return qWords.every((word) => {
          if (searchable.includes(word)) return true;
          if (/^\d+$/.test(word) && k.tingkat) {
            const num = parseInt(word, 10);
            const rangeMatch = k.tingkat.match(/(\d+)\s*[-–—]\s*(\d+)/);
            if (rangeMatch) {
              const start = parseInt(rangeMatch[1], 10);
              const end = parseInt(rangeMatch[2], 10);
              if (num >= start && num <= end) return true;
            }
          }
          return false;
        });
      })
      .slice(0, 5)
      .map((k) => ({
        id: k.id,
        nama: k.mataPelajaran.nama,
        jenjang: k.jenjang,
        tingkat: k.tingkat || '',
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
