// Integrasi Midtrans SNAP (server-side only — JANGAN diimpor dari komponen client).
// Konfig: MIDTRANS_SERVER_KEY (wajib utk gateway aktif), MIDTRANS_CLIENT_KEY
// (utk SnapJS; belum dipakai di sini — alur redirect saja), MIDTRANS_ENV
// =sandbox|production (default sandbox). Tidak ada key = gateway dianggap
// belum aktif; UI fallback ke instruksi transfer manual.
// Referensi: Midtrans SNAP API v2 — create: POST /snap/v1/transaction,
// status: GET /v2/{order_id}/status.
import { createHash, timingSafeEqual } from "node:crypto";

export function midtransServerKey(): string {
  return process.env.MIDTRANS_SERVER_KEY ?? "";
}

export function midtransConfigured(): boolean {
  return midtransServerKey().length > 0;
}

function baseUrl(): string {
  return (process.env.MIDTRANS_ENV ?? "sandbox") === "production"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${midtransServerKey()}:`).toString("base64");
}

export type SnapTransaksi = { token: string; redirect_url: string };

/** Buat transaksi SNAP (channel VA/gopay/etc via redirect). order_id milik kita. */
export async function snapCreate(params: {
  orderId: string;
  grossAmount: number;
  email?: string;
  firstName?: string;
  description?: string;
  finishUrl?: string;
}): Promise<SnapTransaksi> {
  const body = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    enabled_payments: [
      "bca_va",
      "bri_va",
      "cimb_va",
      "permata_va",
      "echannel",
      "gopay",
      "shopeepay",
      "other_cash",
    ],
    item_details: [
      {
        id: params.orderId,
        price: params.grossAmount,
        quantity: 1,
        name: params.description ?? "Pembayaran kelas Siedu",
      },
    ],
    user_info: {
      user_name: params.firstName ?? "",
      email: params.email ?? "",
    },
    ...(params.finishUrl ? { callback: { finish: params.finishUrl } } : {}),
  };
  const res = await fetch(`${baseUrl()}/snap/v1/transaction`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Midtrans SNAP create ${res.status}: ${text.slice(0, 200)}`,
    );
  }
  const json = (await res.json()) as Partial<SnapTransaksi>;
  if (!json.token || !json.redirect_url)
    throw new Error("Respons SNAP tidak lengkap.");
  return { token: json.token, redirect_url: json.redirect_url };
}

/**
 * Lookup status transaksi (GET /v2/{order_id}/status). Return status final
 * kalau array v2 punya satu, atau status tunggal; null bila 404/belum ada.
 */
export async function snapStatus(orderId: string): Promise<string | null> {
  const res = await fetch(
    `${baseUrl()}/v2/${encodeURIComponent(orderId)}/status`,
    {
      headers: { Accept: "application/json", Authorization: authHeader() },
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Midtrans status ${res.status}`);
  const json = (await res.json().catch(() => null)) as {
    transaction_status?: string | string[];
  } | null;
  const st = json?.transaction_status;
  if (Array.isArray(st)) {
    const final = st.find((s) =>
      ["settlement", "capture", "cancel", "expire", "deny"].includes(s),
    );
    return final ?? st[st.length - 1] ?? null;
  }
  return typeof st === "string" ? st : null;
}

const FINAL_STATUSES = ["settlement", "capture", "cancel", "expire", "deny"];
export function isFinalStatus(st: string): boolean {
  return FINAL_STATUSES.includes(st.toLowerCase());
}

/**
 * Verifikasi signature_key notifikasi webhook Midtrans.
 * v1: sha512(order_id + status_code + gross_amount + server_key)
 * v2: sha512(order_id + status_code + server_key)  (tanpa gross_amount)
 * Cocok salah satu = valid. Constant-time compare.
 */
export function verifikasiSignature(notif: Record<string, unknown>): boolean {
  const key = midtransServerKey();
  if (!key) return false;
  const sig = String(notif.signature_key ?? "");
  if (!/^[0-9a-f]{128}$/i.test(sig)) return false;
  const orderId = String(notif.order_id ?? "");
  const statusCode = String(notif.status_code ?? "");
  const gross = String(notif.gross_amount ?? "");
  const hash = (input: string) =>
    createHash("sha512").update(input).digest("hex");
  const v1 = hash(`${orderId}${statusCode}${gross}${key}`);
  const v2 = hash(`${orderId}${statusCode}${key}`);
  const sigBuf = Buffer.from(sig.toLowerCase(), "hex");
  const eq = (hex: string) => {
    const buf = Buffer.from(hex, "hex");
    return buf.length === sigBuf.length && timingSafeEqual(buf, sigBuf);
  };
  return eq(v1) || eq(v2);
}
