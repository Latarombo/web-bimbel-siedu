/**
 * Utilitas Normalisasi & Validasi Nomor Telepon Seluler Indonesia
 * Sesuai Standar Kominfo RI dan Operator Telekomunikasi Indonesia
 * (Telkomsel, Indosat, XL Axiata, Smartfren, Tri):
 * - Awalan seluler: 08..., +628..., 628...
 * - Panjang nomor: 10 s/d 13 digit
 * - Karakter diizinkan saat ketik: angka, +, -, spasi, tanda kurung
 */

/**
 * Menghapus pemisah (spasi, tanda hubung, kurung, titik) dari input nomor telepon.
 */
export function cleanPhoneInput(phone: string): string {
  return phone.trim().replace(/[\s\-().]/g, '');
}

/**
 * Normalisasi nomor HP Indonesia ke format standar nasional "08xxxxxxxxxx".
 * Contoh:
 * - "+6281234567890" -> "081234567890"
 * - "6281234567890"  -> "081234567890"
 * - "0812-3456-7890" -> "081234567890"
 * - "81234567890"    -> "081234567890"
 */
export function normalizeIndonesianPhone(phone: string): string {
  const clean = cleanPhoneInput(phone);
  if (!clean) return '';

  if (clean.startsWith('+62')) {
    return '0' + clean.slice(3);
  }
  if (clean.startsWith('62')) {
    return '0' + clean.slice(2);
  }
  if (clean.startsWith('8')) {
    return '0' + clean;
  }
  return clean;
}

/**
 * Format nomor telepon ke standar internasional WhatsApp "628xxxxxxxxxx".
 */
export function formatPhoneToWA(phone: string): string {
  const normalized = normalizeIndonesianPhone(phone);
  if (normalized.startsWith('0')) {
    return '62' + normalized.slice(1);
  }
  return normalized;
}

export type PhoneValidationResult = {
  valid: boolean;
  normalized?: string;
  errorKey?: 'phoneCharacters' | 'phonePrefixInvalid' | 'phoneMinDigits' | 'phoneMax';
};

/**
 * Memvalidasi nomor HP Indonesia:
 * 1. Karakter hanya angka, spasi, tanda hubung, tanda kurung, dan tanda + di awal.
 * 2. Harus merupakan nomor seluler Indonesia (diawali 08, +628, 628, atau 8).
 * 3. Panjang digit setelah dinormalisasi harus antara 10 sampai 13 digit.
 */
export function validateIndonesianPhone(phone: string): PhoneValidationResult {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { valid: false, errorKey: 'phoneMinDigits' };
  }

  // Cek karakter terlarang
  if (!/^[0-9+\-\s()]*$/.test(trimmed)) {
    return { valid: false, errorKey: 'phoneCharacters' };
  }

  const clean = cleanPhoneInput(trimmed);
  // Tanda + hanya boleh berada di karakter pertama
  if (clean.includes('+') && !clean.startsWith('+')) {
    return { valid: false, errorKey: 'phoneCharacters' };
  }

  // Cek awalan nomor seluler Indonesia
  const isPrefixValid =
    clean.startsWith('08') ||
    clean.startsWith('+628') ||
    clean.startsWith('628') ||
    clean.startsWith('8');

  if (!isPrefixValid) {
    return { valid: false, errorKey: 'phonePrefixInvalid' };
  }

  const normalized = normalizeIndonesianPhone(clean);

  // Pastikan hasil normalisasi murni angka
  if (!/^\d+$/.test(normalized)) {
    return { valid: false, errorKey: 'phoneCharacters' };
  }

  // Cek rentang digit nomor seluler Indonesia (10 - 13 digit)
  if (normalized.length < 10) {
    return { valid: false, errorKey: 'phoneMinDigits' };
  }
  if (normalized.length > 13) {
    return { valid: false, errorKey: 'phoneMax' };
  }

  return {
    valid: true,
    normalized,
  };
}

/**
 * Menghasilkan seluruh varian representasi nomor telepon
 * untuk query pencarian di database (mencegah bypass duplikasi data).
 * Contoh: "081234567890" -> ["081234567890", "6281234567890", "+6281234567890"]
 */
export function getPhoneLookupVariants(phone: string): string[] {
  const norm = normalizeIndonesianPhone(phone);
  if (!norm || !norm.startsWith('08')) return [phone.trim()];

  const tail = norm.slice(1);
  return [
    norm,
    `62${tail}`,
    `+62${tail}`,
  ];
}
