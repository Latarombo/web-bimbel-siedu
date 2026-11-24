# SPEC: Decommission Refund & Cancellation Subsystem

> **Modul ID:** `governance-cleanup`
> **Aktor:** Pengembang & AI Agent
> **Status:** Landed (Selesai & Terverifikasi)
> **Rujukan Aturan:** [`ATURAN_SISTEM.md`](../docs/ATURAN_SISTEM.md) BR#19, [`CAPABILITY_MAP.md`](./CAPABILITY_MAP.md) Seksi 3, [`PRD.md`](../docs/PRD.md) F12

---

## 1. Objective & User Story

- **Konteks & Masalah:** Berdasarkan keputusan arsitektur resmi dan kesepakatan produk, platform Siedu **tidak menyediakan fitur refund atau pengajuan pembatalan sepihak oleh orang tua**. Kode lama yang masih memuat tabel `PengajuanPembatalan`, rute admin `/admin/refunds`, dan halaman `/enrollments/[id]/cancel` perlu dibersihkan (_decommissioned_) secara tuntas agar tidak membingungkan pengguna, tidak menimbulkan _dead code_, dan selaras dengan prinsip _anti-overengineering_.
- **User Story:** Sebagai pengembang dan pengelola lembaga, saya ingin seluruh artefak dan rute pengajuan refund dihapus dari basis kode, sehingga sistem beroperasi secara ramping dan hanya mendukung pembatalan otomatis sistem (_timeout_ 1x24 jam dan penutupan kelas).
- **Outcome Kunci:**
    1. Halaman `/admin/refunds` dan `/enrollments/[id]/cancel` dihapus.
    2. Model `PengajuanPembatalan` dan enum `KategoriRefund` dihapus dari skema kontrak database.
    3. Verifikasi TypeScript (`npx tsc --noEmit`) lolos bersih dengan exit code 0.

---

## 2. Command Verifikasi (Wajib Lolos)

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. UI/UX Contract (Pembersihan Antarmuka)

- **Portal Orang Tua:** Hapus tombol atau link "Ajukan Pembatalan" pada rincian pendaftaran (`/enrollments/[id]`). Tidak ada lagi akses ke modal/halaman pembatalan.
- **Portal Admin:** Hapus item navigasi sidebar "Verifikasi Refund" dan kartu indikator pengajuan menunggu pada Dasbor Admin (`/admin/dashboard`).
- **Clean Fallback:** Akses langsung ke URL lama (`/admin/refunds` atau `/enrollments/[id]/cancel`) menghasilkan respons 404 (Not Found).

---

## 4. Data Contracts & Skema Database

Entitas yang dihapus dari `src/prisma/contract.prisma`:

- `enum KategoriRefund`
- `model PengajuanPembatalan`
- Relasi `pengajuanPembatalan` pada `model Pendaftaran` dan `model User`.

---

## 5. Acceptance Criteria (Given — When — Then)

### Happy Path

- [x] **AC 1 (Pembersihan UI Orang Tua):**
    - **Given:** Wali murid membuka rincian pendaftaran berstatus `terdaftar` di `/enrollments/[id]`.
    - **When:** Halaman dirender.
    - **Then:** Tidak ada opsi atau tombol untuk mengajukan pembatalan/refund.
- [x] **AC 2 (Pembersihan UI Admin):**
    - **Given:** Administrator login dan mengakses dasbor utama `/admin/dashboard`.
    - **When:** Sidebar dan widget dasbor dirender.
    - **Then:** Menu "Verifikasi Refund" tidak lagi muncul di navigasi dan tidak ada counter badge untuk pengajuan pembatalan.
- [x] **AC 3 (Integritas Tipe Data):**
    - **Given:** Seluruh pemanggil `db.orm.public.PengajuanPembatalan` telah dihapus dari Server Actions.
    - **When:** `npx tsc --noEmit` dijalankan.
    - **Then:** Kompilasi sukses tanpa error tipe data yang tersisa.

---

## 6. Tracer-Bullet Task Breakdown (Irisan Vertikal Pembersihan)

- [x] **Task 1 (UI Portal Wali):** Hapus rute `src/app/[locale]/(parent)/enrollments/[id]/cancel/page.tsx` dan komponen `src/components/parent/cancel-form.tsx`. Bersihkan pemanggilan query `PengajuanPembatalan` pada `src/app/[locale]/(parent)/enrollments/[id]/page.tsx`.
- [x] **Task 2 (UI Portal Admin):** Hapus rute `src/app/[locale]/admin/refunds/page.tsx`. Hapus badge dan link `/admin/refunds` dari `src/app/[locale]/admin/layout.tsx` dan `src/app/[locale]/admin/dashboard/page.tsx`.
- [x] **Task 3 (Server Actions):** Hapus action `ajukanPembatalan` dari `src/app/actions/pembayaran.ts` dan fungsi review refund dari `src/app/actions/admin.ts`.
- [x] **Task 4 (Skema Database & Verifikasi):** Hapus `model PengajuanPembatalan` dan `enum KategoriRefund` dari `src/prisma/contract.prisma`. Jalankan pembaruan kontrak dan verifikasi ketat `npx tsc --noEmit`.

---

## 7. Out of Scope

- Tidak melakukan migrasi data riwayat (jika di database lokal/staging ada data testing tabel `pengajuan_pembatalan`, penghapusan tabel ditangani via migrasi db terpisah).
