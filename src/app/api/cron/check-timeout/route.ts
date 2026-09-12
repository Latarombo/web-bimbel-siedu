import { NextResponse } from "next/server";
import { processTimeouts } from "@/lib/services/pendaftaran";
import { processTunggakan } from "@/lib/services/pembayaran";

// BR#21 — dipicu tiap 5 menit dari scheduler EKSTERNAL (cron-job.org / GitHub Actions),
// bukan vercel.json cron (Hobby max 1x/hari). Header: Authorization: Bearer ***
// Guard anti-overlap: cron-job.org "no parallel runs" / GitHub Actions concurrency group.
// Dua tahap: (1) BR#2 timeout 24 jam menunggu_pembayaran, (2) BR#7 tunggakan
// → tertunggak → (lewat tenggang 7 hari) dibatalkan_tunggakan.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "CRON_SECRET belum diset" },
      { status: 500 },
    );
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dibatalkan } = await processTimeouts();
  const { menjadiTertunggak, dibatalkanTunggakan } = await processTunggakan();
  return NextResponse.json({
    ok: true,
    dibatalkan_timeout: dibatalkan,
    menjadi_tertunggak: menjadiTertunggak,
    dibatalkan_tunggakan: dibatalkanTunggakan,
  });
}
