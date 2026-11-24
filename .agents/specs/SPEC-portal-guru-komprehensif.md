# SPEC: Peningkatan Komprehensif Portal Guru Siedu

> **Modul ID:** `teacher-comprehensive-portal`  
> **Aktor:** Guru & Orang Tua  
> **Status:** Draft Approved (Fase 2 SDD)  
> **Rujukan Standar:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), Modern Web Guidance (`dialog`, `navigation-drawer`, `forms`).

---

## 1. Objective & User Story

### Konteks & Kebutuhan
Portal Guru di Siedu membutuhkan integrasi alur kerja guru yang kohesif, transparan, dan produktif mulai dari masuk kelas, memantau profil siswa, mengelola tugas (CRUD), mengisi presensi tanpa batasan waktu penguncian, mendokumentasikan jurnal kelas per pertemuan, membagikan status pembelajaran foto/kamera, hingga merekap dan menerbitkan rapor siswa di akhir periode/semester.

### User Stories
1. **Navigasi & Profil Siswa:**  
   *Sebagai Guru*, saat membuka kelas yang saya ampu, saya dapat melihat daftar siswa (*Roster*) dan membuka **Slide-over Sheet (Drawer)** profil siswa untuk melihat biodata lengkap, kontak orang tua, dan rekap capaian tanpa harus meninggalkan konteks kelas.
2. **Presensi Siswa Tanpa Batas Waktu:**  
   *Sebagai Guru*, saya dapat mengisi dan memperbarui presensi siswa (Hadir, Izin, Sakit, Alpa, Terlambat, Catatan) untuk setiap sesi pertemuan kelas kapan saja tanpa dibatasi penguncian 7 hari, dengan pencatatan audit perubahan otomatis di background.
3. **CRUD Tugas & Keterikatan Pertemuan:**  
   *Sebagai Guru*, saya dapat Membuat, Melihat Detail, Mengedit, dan Menghapus Tugas (*Asesmen*) pada kelas, menautkannya ke sesi pertemuan tertentu, menyertakan catatan/instruksi tugas, serta memberikan nilai dan catatan individual per siswa.
4. **Jurnal Kelas per Pertemuan:**  
   *Sebagai Guru*, saya dapat mencatat materi pembelajaran dan catatan PR/evaluasi kelas (murni teks) untuk setiap sesi pertemuan di kelas yang saya ampu sebagai rekaman kegiatan belajar terstruktur.
5. **Status Pembelajaran (Foto Kamera / Galeri):**  
   *Sebagai Guru*, saya dapat membuat status pembelajaran berupa foto (dari galeri atau langsung kamera perangkat) dengan caption dan target kelas yang saya ampu, yang dapat dilihat secara eksklusif oleh orang tua yang mendaftarkan anaknya di kelas tersebut.
6. **Kalkulasi Otomatis & Rapor Siswa Akhir Semester:**  
   *Sebagai Guru*, saya dapat membuka halaman khusus Rapor Kelas (`/teacher/classes/[classId]/reports` & `/teacher/classes/[classId]/reports/[enrollmentId]`), di mana sistem otomatis menghitung rata-rata nilai tugas dan persentase kehadiran siswa, lalu saya dapat mengisi evaluasi kualitatif/nilai subjektif, menyimpannya sebagai draf, atau menerbitkannya langsung ke portal orang tua.

---

## 2. Command Verifikasi (Wajib Lolos)

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Skema Basis Data

### A. Kolom Tambahan (PostgreSQL Supabase)
1. **`pendaftaran`**:
   - `catatan_rapor`: `TEXT NULL` — Catatan evaluasi akhir / nilai subjektif guru untuk rapor semester.
   - `rapor_diterbitkan_pada`: `TIMESTAMPTZ NULL` — Waktu penerbitan rapor ke orang tua (NULL = draf/belum terbit).
2. **`penilaian`**:
   - `catatan`: `TEXT NULL` — Instruksi atau catatan spesifik tugas.

```sql
ALTER TABLE "public"."pendaftaran" 
  ADD COLUMN IF NOT EXISTS "catatan_rapor" text,
  ADD COLUMN IF NOT EXISTS "rapor_diterbitkan_pada" timestamp with time zone;

ALTER TABLE "public"."penilaian"
  ADD COLUMN IF NOT EXISTS "catatan" text;
```

*Catatan: Jumlah tabel publik tetap 16 tabel. Tidak ada tabel baru yang ditambahkan.*

### B. Prisma Next Contract (`contract.prisma`)
- `Pendaftaran`:
  ```prisma
  catatanRapor         String?            @map("catatan_rapor")
  raporDiterbitkanPada TimestamptzString? @map("rapor_diterbitkan_pada")
  ```
- `Penilaian`:
  ```prisma
  catatan String? @map("catatan")
  ```

---

## 4. Arsitektur Komponen & UI Patterns (Modern Web Guidance)

1. **Slide-over Sheet Profil Siswa (`navigation-drawer` pattern):**
   - Menggunakan native `<dialog>` atau slide-over drawer dengan `overscroll-behavior: contain;`.
   - Menampilkan avatar inisial/foto, nama lengkap, jenjang, tanggal lahir, kontak orang tua/wali, rekap kehadiran (hadir/total sesi), dan rekap rata-rata nilai.
   - Tombol aksi: *"Input Nilai Siswa Ini"* (membuka QuickGradeDrawer) dan *"Buka Rapor"* (navigasi ke rapor siswa).
2. **Presensi Siswa Bebas Waktu:**
   - Hapus pengecekan `dalamJendela7Hari` pada `savePresensi` dan `AttendancePage`.
   - Simpan catatan ke `AuditPerubahan` saat terjadi modifikasi status presensi yang sudah pernah ada.
3. **CRUD Tugas Terpadu:**
   - Modal Buat / Edit Tugas mendukung pilihan: Nama, Tanggal, Nilai Maksimum, Sesi Pertemuan terkait (`sesi_id`), Catatan Tugas (`catatan`).
   - Tombol Edit & Hapus Tugas di tabel tugas kelas (`ClassDetailView`) dan halaman detail penilaian.
4. **Jurnal Kelas per Pertemuan:**
   - Tab / Form terdedikasi di halaman pertemuan kelas untuk mengedit `catatanMateri` dan `catatanPr` teks murni.
   - Ringkasan jurnal tampil di detail pertemuan dan kalender sesi.
5. **Status Pembelajaran Kamera & Galeri:**
   - Input berkas dengan atribut `accept="image/*"` dan tombol terpisah untuk potret langsung kamera (`capture="environment"`).
   - Validasi batas maksimal 5 foto, preview thumbnail sebelum upload, dan opsi hapus foto.
   - Penyimpanan privat Supabase Storage bucket `status-pembelajaran`.
6. **Rapor Kelas & Rapor Siswa (`/teacher/classes/[classId]/reports`):**
   - Halaman Indeks Rapor Kelas: Roster siswa dengan metrik otomatis (% kehadiran, rata-rata tugas), status pengisian (*Belum Diisi*, *Draf*, *Diterbitkan*), tombol aksi cepat.
   - Halaman Detail / Pengisian Rapor Siswa:
     - Identitas resmi siswa & kelas.
     - Ringkasan otomatis kehadiran (Hadir, Izin, Sakit, Alpa, %).
     - Rincian tabel seluruh tugas/asesmen kelas beserta nilai siswa & nilai rata-rata terhitung otomatis.
     - Area input guru: Evaluasi Perkembangan / Nilai Subjektif / Catatan Guru.
     - Aksi: Simpan Draf, Terbitkan ke Orang Tua, dan Tampilan Bersih Siap Cetak (Print View).

---

## 5. Acceptance Criteria (Given — When — Then)

### AC 1: Profil Siswa via Slide-over Drawer
- **Given** guru berada di tab "Roster Siswa" pada `/teacher/classes/[classId]`,
- **When** guru mengklik nama siswa atau ikon profil siswa,
- **Then** slide-over sheet muncul dari sisi kanan menampilkan informasi lengkap siswa tanpa memuat ulang halaman.

### AC 2: Presensi Tanpa Batas Waktu Penguncian
- **Given** guru membuka sesi presensi pertemuan lampau (> 7 hari lalu),
- **When** guru mengubah status presensi salah satu siswa dan menekan Simpan,
- **Then** data tersimpan berhasil tanpa ditolak aturan 7 hari, dan perubahan tercatat di log audit.

### AC 3: CRUD Tugas & Catatan Tugas
- **Given** guru berada di tab "Tugas & Asesmen" pada `/teacher/classes/[classId]`,
- **When** guru membuat, mengedit, atau menghapus tugas (dengan memilih pertemuan terkait dan mengisi catatan tugas),
- **Then** data tugas diperbarui seketika dan tersinkronisasi dengan sesi pertemuan yang dipilih.

### AC 4: Jurnal Kelas per Pertemuan
- **Given** guru berada di halaman sesi pertemuan kelas,
- **When** guru mengisi catatan jurnal pembelajaran (teks materi & catatan tindak lanjut),
- **Then** jurnal tersimpan pada `SesiPertemuan` dan dapat dibaca oleh guru dan orang tua.

### AC 5: Pembuatan Status Pembelajaran Foto & Kamera
- **Given** guru berada di halaman `/teacher/status`,
- **When** guru memilih kelas yang diampu, mengambil foto via kamera atau galeri, menuliskan caption, dan membagikan status,
- **Then** foto terunggah ke storage dan status aktif tercatat untuk orang tua dari siswa di kelas tersebut.

### AC 6: Kalkulasi Otomatis & Rapor Semester
- **Given** guru membuka `/teacher/classes/[classId]/reports/[enrollmentId]`,
- **When** guru mengisi catatan evaluasi subjektif dan menekan "Terbitkan Rapor",
- **Then** sistem mengkalkulasi rata-rata nilai dan kehadiran secara akurat, menyimpan `catatan_rapor`, dan menetapkan `rapor_diterbitkan_pada`.

---

## 6. Tracer-Bullet Task Breakdown (Vertical Slices)

- [ ] **Slice 1: Database Migration & Prisma Contract Sync**
  - Eksekusi SQL migrasi: tambah `catatan_rapor` & `rapor_diterbitkan_pada` di `pendaftaran`, tambah `catatan` di `penilaian`.
  - Update `src/prisma/contract.prisma`.
- [ ] **Slice 2: Unrestricted Presensi & Jurnal Kelas**
  - Cabut batas `dalamJendela7Hari` pada `savePresensi` dan `AttendancePage`.
  - Sediakan UI form Jurnal Kelas di sesi pertemuan.
- [ ] **Slice 3: Drawer Profil Siswa di Halaman Kelas**
  - Implementasikan komponen `StudentProfileDrawer` yang terintegrasi di `class-detail-view.tsx`.
- [ ] **Slice 4: CRUD Lengkap Tugas (Asesmen)**
  - Lengkapi modal Edit Tugas dan integrasikan `hapusPenilaian` serta input `catatan` tugas.
- [ ] **Slice 5: Kamera Langsung & Upload Foto Status Pembelajaran**
  - Perbarui `status-form.tsx` dengan trigger input kamera langsung (`capture="environment"`), file picker galeri, dan upload Supabase Storage.
- [ ] **Slice 6: Rapor Kelas & Rapor Siswa Guru**
  - Buat rute `/teacher/classes/[classId]/reports` dan `/teacher/classes/[classId]/reports/[enrollmentId]`.
  - Buat server action `simpanRaporSiswa` dan `terbitkanRaporSiswa`.
  - Komponen cetak / print view ramah browser.
- [ ] **Slice 7: Verifikasi Kompilasi & Kepatuhan Aturan**
  - Jalankan `npx tsc --noEmit` via PowerShell Windows hingga 0 error.
