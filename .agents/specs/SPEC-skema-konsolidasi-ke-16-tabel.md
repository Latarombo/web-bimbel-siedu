# SPEC: Konsolidasi Skema Database ke 16 Tabel Inti

> **Modul ID:** `schema-consolidation-16`
> **Aktor:** Pengembang & AI Agent
> **Status:** In Progress (Approved by User)
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md) SDD Siklus Kerja, [CONSTRAINTS.md](../../CONSTRAINTS.md)

---

## 1. Objective & User Story

- **Konteks:** Database Siedu saat ini memiliki 20 tabel di skema `public`. Berdasarkan audit, masih terdapat 2 tabel tak terpakai (_dormant_) tanpa baris data, 1 tabel pelaporan foto yang hanya duplikasi dari audit log, dan 1 tabel token reset sandi yang redundan dengan tabel pengguna.
- **Tujuan:** Merampingkan skema database dari **20 tabel menjadi 16 tabel inti** tanpa mengurangi fitur maupun fungsionalitas bisnis apa pun:
    1. **Drop `laporan_perkembangan` (-1 tabel):** 0 baris, 0 query (belum pernah diimplementasikan).
    2. **Drop `peserta_sesi` (-1 tabel):** 0 baris, 0 query (presensi sudah tercatat langsung di `presensi`).
    3. **Peleburan `laporan_foto_status` (-1 tabel):** Logika keberatan foto privat dialihkan murni ke tabel `audit_perubahan` yang sudah otomatis mencatat payload laporan.
    4. **Peleburan `password_reset_tokens` ke `users` (-1 tabel):** Memindahkan kolom `reset_token_hash` dan `reset_token_expires_at` langsung ke tabel `users`.
- **User Story:** Sebagai pengembang dan pengelola sistem, saya ingin skema database berada pada batas paling efisien (16 tabel inti), bebas dari tabel tidur dan redundansi relasi, dengan performa tinggi dan nol utang teknis.

---

## 2. Command Verifikasi (Wajib Lolos)

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Perubahan Skema

### A. Tabel `laporan_perkembangan` & `peserta_sesi`

- Drop table `public.laporan_perkembangan` dan `public.peserta_sesi`.
- Hapus definisi model dan relasi terkait dari `contract.prisma`.

### B. Tabel `laporan_foto_status`

- Hapus operasi `LaporanFotoStatus.create` dari Server Action `laporFotoPrivat` (`src/app/actions/teacher.ts`).
- Audit log pada `AuditPerubahan` dipertahankan sebagai sumber data audit keberatan foto.
- Drop table `public.laporan_foto_status` dan hapus model dari `contract.prisma`.

### C. Tabel `password_reset_tokens` -> Lebur ke `users`

- Tambahkan kolom pada tabel `users`:
    - `reset_token_hash` (`text`, nullable, unique)
    - `reset_token_expires_at` (`timestamptz`, nullable)
- Update `src/app/actions/password-reset.ts`:
    - Request reset: Update `User` dengan `resetTokenHash` dan `resetTokenExpiresAt`.
    - Verify reset: Query `User` berdasarkan `resetTokenHash`.
    - Execute reset: Update password baru dan set `resetTokenHash = null`, `resetTokenExpiresAt = null`.
- Drop table `public.password_reset_tokens` dan hapus model dari `contract.prisma`.

---

## 4. Acceptance Criteria (Given — When — Then)

- **AC 1 (Pembersihan Dormant):**
    - Given tabel `laporan_perkembangan` dan `peserta_sesi` dihapus.
    - When aplikasi dijalankan.
    - Then seluruh fungsionalitas presensi, penilaian, dan jadwal tetap berfungsi 100% normal.
- **AC 2 (Keberatan Foto Privat):**
    - Given orang tua melaporkan foto privat di portal feed/presensi.
    - When form laporan dikirim.
    - Then laporan tercatat di `audit_perubahan` dan toast sukses tetap muncul ke orang tua.
- **AC 3 (Reset Password Terpadu):**
    - Given pengguna meminta reset kata sandi di portal login.
    - When tautan reset dibuka dan kata sandi baru disimpan.
    - Then token diverifikasi dari tabel `users`, sandi terupdate, dan token terhapus (single-use).
- **AC 4 (Integritas Tipe Data):**
    - When `npx tsc --noEmit` dijalankan via PowerShell Windows.
    - Then lolos 100% dengan **0 error**.

---

## 5. Tracer-Bullet Task Breakdown

- [x] **Slice 1: Eksekusi DDL Database (Supabase PostgreSQL)**
- [x] **Slice 2: Pembaruan Kontrak Prisma (`contract.prisma`)**
- [x] **Slice 3: Penyesuaian Logika Kode (`teacher.ts` & `password-reset.ts`)**
- [x] **Slice 4: Emit Kontrak (`npx prisma contract emit`) & Verifikasi TypeScript (`npx tsc --noEmit`)**
- [x] **Slice 5: Pembaruan Dokumentasi (`DATABASE_SCHEMA.md` & Artefak)**
