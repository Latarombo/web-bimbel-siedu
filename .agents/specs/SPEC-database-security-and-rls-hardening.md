# Spesifikasi Teknis: Pengamanan Database & Hardening Row Level Security (RLS) Siedu

## 1. Objective & User Story
**Objective:**
Mengamankan database PostgreSQL Supabase dari kebocoran data publik melalui PostgREST Data API dengan mengaktifkan Row Level Security (RLS) secara menyeluruh pada semua tabel di schema `public` dan mencabut (*revoke*) izin akses publik dari role `anon` dan `authenticated` pada tabel sensitif internal, tanpa mengganggu operasional Next.js Server Actions dan Prisma Next.

**User Story:**
- *Sebagai Pengembang & Lembaga Bimbingan Belajar*, saya ingin data siswa, transaksi pembayaran, data audit, dan token pengguna terlindungi dari akses publik tanpa izin melalui Supabase Data API / anon key.
- *Sebagai Sistem Siedu*, aplikasi web berbasis Next.js Server Actions harus tetap dapat membaca dan menulis data secara lancar tanpa degradasi performa atau hambatan permission.

---

## 2. Command Verifikasi
1. **Verifikasi Security Advisor Supabase:**
   ```sql
   -- Linter advisor rls_disabled_in_public harus menghasilkan count 0
   SELECT * FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
   ```
2. **Verifikasi Kebocoran PostgREST API (Harus Gagal / Kosong):**
   ```bash
   curl -s -H "apikey: <ANON_KEY>" "https://cawpjvqmjnhiywkavucv.supabase.co/rest/v1/anak?select=*"
   curl -s -H "apikey: <ANON_KEY>" "https://cawpjvqmjnhiywkavucv.supabase.co/rest/v1/pembayaran?select=*"
   curl -s -H "apikey: <ANON_KEY>" "https://cawpjvqmjnhiywkavucv.supabase.co/rest/v1/users?select=*"
   # Output yang diharapkan: [] atau 401/403
   ```
3. **Verifikasi Aplikasi Next.js & Prisma (Tetap Berjalan Normal):**
   ```bash
   powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
   ```

---

## 3. Data Contracts & DDL Remediasi

### A. Pengaktifan RLS pada 23 Tabel Publik
Mengaktifkan RLS default-deny pada seluruh tabel schema `public`:
```sql
ALTER TABLE "public"."anak" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."kelas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mata_pelajaran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."nilai_progres" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pembayaran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pendaftaran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pengajuan_pembatalan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."periode_pendaftaran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."presensi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."jadwal_item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pesan_kontak" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."peserta_sesi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sesi_pertemuan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."catatan_pertemuan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_perubahan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pengajuan_koreksi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."hasil_penilaian" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."penilaian" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."laporan_perkembangan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."laporan_foto_status" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."status_pembelajaran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."status_pembelajaran_penerima" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."password_reset_tokens" ENABLE ROW LEVEL SECURITY;
```

### B. Pencabutan Izin Role Publik pada Tabel Sensitif Internal
```sql
REVOKE ALL ON TABLE "public"."audit_perubahan" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."password_reset_tokens" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."pesan_kontak" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."users" FROM anon, authenticated;
```

---

## 4. Acceptance Criteria (Given-When-Then)

### Skenario 1: Percobaan Akses Data Sensitif oleh Pihak Luar via REST API
- **Given:** Seseorang memiliki URL Supabase dan public `anon key` proyek Siedu.
- **When:** Mengirimkan request HTTP GET ke endpoint `https://cawpjvqmjnhiywkavucv.supabase.co/rest/v1/anak` atau `.../pembayaran`.
- **Then:** Supabase PostgREST mengembalikan array kosong `[]` (atau `403 Forbidden`), tidak ada satupun baris data siswa atau pembayaran yang bocor.

### Skenario 2: Operasional Aplikasi Siedu melalui Next.js & Prisma
- **Given:** Pengguna (Orang Tua, Guru, atau Admin) berinteraksi dengan aplikasi Siedu di Next.js.
- **When:** Server Actions mengeksekusi query database via Prisma (`postgres` user dengan `rolbypassrls = true`).
- **Then:** Seluruh query SELECT, INSERT, UPDATE, dan DELETE dieksekusi dengan sukses tanpa batasan permission RLS.

### Skenario 3: Linter Keamanan Supabase Bersih
- **Given:** Tool `get_advisors` (security) dijalankan.
- **When:** Melakukan audit terhadap linter `rls_disabled_in_public`.
- **Then:** Menghasilkan 0 temuan (*clean* / no security errors).

---

## 5. Out-of-Scope
- Penambahan constraint deteksi anak duplikat (fitur duplikasi anak telah didekomisi/dihapus sesuai keputusan sistem).
- Pembuatan RLS policy client-side Supabase, karena Siedu 100% menggunakan arsitektur server-side (Next.js Server Actions & Prisma).
