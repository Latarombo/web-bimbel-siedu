export async function GET() {
  // F1 — Cron check timeout (BR#21)
  return Response.json({ ok: true, route: "/api/cron/check-timeout", note: "placeholder — logic BR#21 menyusul" });
}
export async function POST(req: Request) { return GET(); }
