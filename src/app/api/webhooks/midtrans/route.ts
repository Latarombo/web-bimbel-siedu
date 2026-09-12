import { NextResponse } from "next/server";
import { verifikasiSignature, midtransConfigured } from "@/lib/midtrans";
import { terapkanStatusMidtrans } from "@/lib/services/pembayaran";

export const dynamic = "force-dynamic";

// F2 — Webhook Midtrans. Midtrans POST json_notifikasi ke sini setelah status
// berubah. Wajib: verifikasi signature_key (SHA512, lib/midtrans.ts) sebelum
// eksekusi apa pun; simpan mentah untuk audit; balas 200 cepat supaya Midtrans
// stop retry — kalau gagal proses, log dan tetap 200 (retry Midtrans tetap
// jalan untuk status berikutnya; lookup /pay jadi jaring pengaman).
type Notif = {
  transaction_status?: string;
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  [k: string]: unknown;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Notif | null;
  if (!body || typeof body.order_id !== "string") {
    return NextResponse.json(
      { ok: false, error: "body tidak valid" },
      { status: 400 },
    );
  }

  if (!midtransConfigured()) {
    // Gateway belum dikonfigurasi — jangan pernah ubah data dari sumber tak terverifikasi.
    return NextResponse.json(
      { ok: false, error: "MIDTRANS_SERVER_KEY belum diset" },
      { status: 500 },
    );
  }

  if (!verifikasiSignature(body)) {
    console.warn("[midtrans webhook] signature tidak valid", {
      order_id: body.order_id,
      transaction_status: body.transaction_status,
    });
    return NextResponse.json(
      { ok: false, error: "signature invalid" },
      { status: 403 },
    );
  }

  const note = await terapkanStatusMidtrans(
    body.order_id,
    String(body.transaction_status ?? ""),
  );
  console.log(
    "[midtrans webhook]",
    body.order_id,
    body.transaction_status,
    note.note,
  );
  return NextResponse.json({ ok: note.ok, note: note.note });
}
