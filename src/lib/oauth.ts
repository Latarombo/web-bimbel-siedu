// Sumber kebenaran status OAuth Google — HANYA diimpor dari server components /
// server config (auth.ts). Jangan diimpor dari client component: env non-publik
// tidak tersedia di bundle browser; client mendapat status via props dari page.
export const googleOAuthEnabled = Boolean(
  process.env['AUTH_GOOGLE_ID'] && process.env['AUTH_GOOGLE_SECRET'],
);
