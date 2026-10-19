/**
 * Siedu Rate Limiting Service
 * Mengimplementasikan pembatasan laju request (in-memory sliding window & cooldown)
 * untuk mencegah brute-force, email flooding / spam, dan kehabisan kuota mail provider.
 */

type RateLimitRecord = {
  timestamps: number[];
  lastRequest: number;
};

// Store global in-memory agar konsisten antar request di process yang sama
const globalStore = globalThis as unknown as {
  __siedu_rate_limit_store__?: Map<string, RateLimitRecord>;
};
const store = globalStore.__siedu_rate_limit_store__ ?? new Map<string, RateLimitRecord>();
globalStore.__siedu_rate_limit_store__ = store;

/**
 * Pembersihan otomatis memori lama
 */
function cleanupStore(now: number) {
  if (store.size > 2000) {
    for (const [key, record] of store.entries()) {
      if (now - record.lastRequest > 60 * 60 * 1000) {
        store.delete(key);
      }
    }
  }
}

/**
 * Cek batas request dalam window waktu tertentu (Sliding Log Algorithm)
 * @param key Identifier unik (mis. `pwd_reset_ip:192.168.1.1` atau `pwd_reset_email:a@b.com`)
 * @param limit Jumlah maksimal request yang diizinkan dalam rentang window
 * @param windowMs Durasi window dalam milidetik (mis. 15 * 60 * 1000 untuk 15 menit)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupStore(now);

  const record = store.get(key) ?? { timestamps: [], lastRequest: 0 };
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  validTimestamps.push(now);
  store.set(key, {
    timestamps: validTimestamps,
    lastRequest: now,
  });

  return {
    allowed: true,
    remaining: limit - validTimestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Cek jeda minimum antar request (Cooldown)
 * @param key Identifier unik
 * @param cooldownMs Jeda waktu minimal dalam milidetik (mis. 60 * 1000 untuk 60 detik)
 */
export function checkCooldown(
  key: string,
  cooldownMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupStore(now);

  const record = store.get(key);
  if (record && record.lastRequest) {
    const elapsed = now - record.lastRequest;
    if (elapsed < cooldownMs) {
      const retryAfterSeconds = Math.max(1, Math.ceil((cooldownMs - elapsed) / 1000));
      return {
        allowed: false,
        retryAfterSeconds,
      };
    }
  }

  const timestamps = record?.timestamps ?? [];
  store.set(key, {
    timestamps,
    lastRequest: now,
  });

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

/**
 * Ekstraksi IP Client dari Headers HTTP
 */
export function getClientIp(headersList: { get(name: string): string | null }): string {
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = headersList.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = headersList.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}
