# SPEC: Konsolidasi & Penyederhanaan Skema Database (23 -> 20 Tabel)

> **Modul ID:** `schema-consolidation`  
> **Aktor:** Pengembang & AI Agent  
> **Status:** Approved (Siap Eksekusi)  
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md) SDD Siklus Kerja, [CONSTRAINTS.md](../../CONSTRAINTS.md), [SPEC-penyederhanaan-dan-konsolidasi-alur-nilai.md](./SPEC-penyederhanaan-dan-konsolidasi-alur-nilai.md)

---

## 1. Objective & User Story
- **Konteks:** Database Siedu saat ini memiliki 23 tabel di skema `public`. Berdasarkan audit arsitektur, terdapat redundansi tabel 1:1, tabel junction berlebih, dan tabel legacy yang sudah dimigrasikan.
- **Tujuan:** Merampingkan skema database dari **23 tabel menjadi 20 tabel** tanpa mengurangi fitur maupun fungsionalitas bisnis apa pun:
  1. **Dekomisi Tuntas `nilai_progres` (-1 tabel):** Mengalihkan sisa query administratif/ekspor ke `Penilaian` & `HasilPenilaian`, kemudian men-drop tabel legacy `nilai_progres`.
  2. **Peleburan Relasi 1:1 `catatan_pertemuan` ke `sesi_pertemuan` (-1 tabel):** Memindahkan atribut jurnal materi dan PR langsung ke entitas induk `sesi_pertemuan` untuk mengeliminasi query ganda dan join 1:1 yang tidak perlu.
  3. **Eliminasi Junction `status_pembelajaran_penerima` (-1 tabel):** Menghilangkan tabel penerima per-siswa karena hak akses feed status kelas secara natural diturunkan dari keanggotaan kelas aktif (`pendaftaran.kelas_id = status_pembelajaran.kelas_id`).
- **User Story:** Sebagai pengembang dan pengelola sistem, saya ingin skema database lebih ringkas, performa query lebih cepat tanpa join berlebih, dan bebas dari tabel usang sehingga pemeliharaan sistem jangka panjang menjadi jauh lebih mudah.

---

## 2. Command Verifikasi (Wajib Lolos)
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Perubahan Skema

### A. Tabel `nilai_progres`
- **Tindakan:** DROP TABLE `public.nilai_progres`.
- **Hapus dari `contract.prisma`:**
  - `model NilaiProgres`
  - Relasi `User.nilaiDiinput`
  - Relasi `Pendaftaran.nilaiProgres`

### B. Tabel `catatan_pertemuan` -> Lebur ke `sesi_pertemuan`
- **Atribut Baru pada `sesi_pertemuan`:**
  - `catatanMateri`: `String?` (`@map("catatan_materi")`, Check: `<= 2000`)
  - `catatanPr`: `String?` (`@map("catatan_pr")`, Check: `<= 1000`)
  - `catatanDraf`: `Boolean` (`@default(true) @map("catatan_draf")`)
  - `catatanDiterbitkanPada`: `TimestamptzString?` (`@map("catatan_diterbitkan_pada")`)
- **Tindakan DB:**
  - `ALTER TABLE "public"."sesi_pertemuan" ADD COLUMN "catatan_materi" text, ADD COLUMN "catatan_pr" text, ADD COLUMN "catatan_draf" boolean DEFAULT true NOT NULL, ADD COLUMN "catatan_diterbitkan_pada" timestamptz;`
  - Migrasikan data yang ada dari `catatan_pertemuan` ke `sesi_pertemuan`.
  - `DROP TABLE IF EXISTS "public"."catatan_pertemuan" CASCADE;`
- **Hapus dari `contract.prisma`:**
  - `model CatatanPertemuan`
  - Relasi `User.catatanPertemuan`
  - Relasi `SesiPertemuan.catatan`

### C. Tabel `status_pembelajaran_penerima`
- **Tindakan DB:**
  - `DROP TABLE IF EXISTS "public"."status_pembelajaran_penerima" CASCADE;`
- **Hapus dari `contract.prisma`:**
  - `model StatusPembelajaranPenerima`
  - Relasi `Anak.statusDiterima`
  - Relasi `Pendaftaran.statusDiterima`
  - Relasi `StatusPembelajaran.penerima`
- **Logika Otorisasi Feed Orang Tua:**
  - Status yang dapat dilihat oleh wali murid adalah status yang memiliki `kelas_id` yang sama dengan pendaftaran aktif anak-anaknya.

---

## 4. Acceptance Criteria (Given — When — Then)
- **AC 1 (Nilai):**  
  - Given seluruh pembacaan nilai telah beralih ke `HasilPenilaian` & `Penilaian`.  
  - When tabel `nilai_progres` dihapus.  
  - Then halaman profil guru, ekspor kelas, dan koreksi admin tetap berjalan normal tanpa error.
- **AC 2 (Catatan Pertemuan):**  
  - Given guru menyimpan jurnal materi/PR di form absensi kelas.  
  - When data disimpan.  
  - Then data langsung tersimpan pada baris `sesi_pertemuan` terkait dan langsung tampil di portal orang tua (`schedule-attendance`).
- **AC 3 (Feed Pembelajaran):**  
  - Given guru mengunggah status kelas.  
  - When status diterbitkan.  
  - Then orang tua dari siswa kelas tersebut langsung dapat melihat feed tersebut di dashboard `/home` tanpa perlu pencatatan baris di tabel penerima.
- **AC 4 (Integritas Tipe Data):**  
  - When `npx tsc --noEmit` dijalankan via PowerShell Windows.  
  - Then kompilasi sukses 100% dengan exit code 0.

---

## 5. Tracer-Bullet Task Breakdown

- [x] **Slice 1: Dekomisi Tuntas `NilaiProgres`**
  - Alihkan sisa query `NilaiProgres` di `src/app/actions/admin.ts`, `src/app/actions/teacher.ts`, `src/app/api/export/class/[classId]/route.ts`, `src/app/[locale]/(teacher)/teacher/classes/[classId]/page.tsx`, `src/app/[locale]/(teacher)/teacher/profile/page.tsx`, `src/app/[locale]/admin/corrections/page.tsx`, `src/app/[locale]/admin/teachers/page.tsx`.
  - Hapus `model NilaiProgres` dari `src/prisma/contract.prisma`.
  - Drop table `public.nilai_progres` di database.
- [x] **Slice 2: Peleburan `CatatanPertemuan` ke `SesiPertemuan`**
  - Tambah kolom `catatan_materi`, `catatan_pr`, `catatan_draf`, `catatan_diterbitkan_pada` ke `sesi_pertemuan` di database & `contract.prisma`.
  - Salin data yang ada di `catatan_pertemuan` ke `sesi_pertemuan`.
  - Update Server Action `saveCatatanPertemuan` di `src/app/actions/teacher.ts` dan pembacaan di `schedule-attendance/page.tsx` & detail sesi.
  - Hapus `model CatatanPertemuan` dan drop table `catatan_pertemuan`.
- [x] **Slice 3: Eliminasi Redundansi `StatusPembelajaranPenerima`**
  - Sederhanakan query pembacaan status di `src/app/[locale]/(parent)/home/page.tsx` dan `src/app/[locale]/(teacher)/teacher/status/page.tsx` untuk filter berbasis `kelas_id`.
  - Hapus `StatusPembelajaranPenerima.create` di `src/app/actions/teacher.ts`.
  - Hapus `model StatusPembelajaranPenerima` dari `contract.prisma` dan drop table di database.
- [x] **Slice 4: Emit Kontrak, Verifikasi & Audit**
  - Jalankan `npx prisma contract emit` via PowerShell Windows.
  - Jalankan `npx tsc --noEmit` via PowerShell Windows.
  - Pastikan database memiliki tepat 20 tabel.
