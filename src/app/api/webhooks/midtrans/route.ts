export async function POST(req: Request) {
  // F2 — Webhook Midtrans
  const body = await req.json().catch(()=>({}));
  return Response.json({ ok: true, route: "/api/webhooks/midtrans", received: body, note: "placeholder — verifikasi signature menyusul" });
}
