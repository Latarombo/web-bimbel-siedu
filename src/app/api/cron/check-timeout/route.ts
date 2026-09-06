import { NextResponse } from 'next/server';
import { processTimeouts } from '@/lib/services/pendaftaran';

// BR#21 — dipicu tiap 5 menit dari scheduler EKSTERNAL (cron-job.org / GitHub Actions),
// bukan vercel.json cron (Hobby max 1x/hari). Header: Authorization: Bearer $CRON_SECRET.
// Guard anti-overlap: cron-job.org "no parallel runs" / GitHub Actions concurrency group.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET belum diset' }, { status: 500 });
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { dibatalkan } = await processTimeouts();
  return NextResponse.json({ ok: true, dibatalkan_timeout: dibatalkan });
}
