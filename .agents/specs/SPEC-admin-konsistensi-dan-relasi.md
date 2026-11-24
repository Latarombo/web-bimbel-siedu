# SPEC: Peningkatan Keterhubungan Relasi & Konsistensi Antarmuka Portal Admin

> **Modul ID:** `admin-konsistensi-dan-relasi`
> **Aktor:** Administrator (`role: admin`)
> **Status:** Approved (SDD Phase 2 - Ready for Implementation)
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [GEMINI.md](../../GEMINI.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md), [ATURAN_SISTEM.md](../docs/ATURAN_SISTEM.md).

---

## 1. Objective & User Story

### Konteks & Masalah

1. **Relasi Data yang Terisolasi (_Disconnected Master Data_):**
    - Pada halaman `/admin/classes`, admin hanya dapat melihat ringkasan baris kelas dan tombol edit form, tanpa memiliki akses ke **Roster Siswa**, rincian pembayaran/cicilan pendaftaran di kelas tersebut, serta rekap kehadiran pertemuan.
    - Pada halaman master `/admin/teachers`, `/admin/subjects`, dan `/admin/periods`, counter kelas yang ditampilkan berupa angka pasif (_dead badge_) tanpa kemampuan klik untuk menelusuri (_drill-down_) kelas terkait.
    - Pada halaman pendaftaran, admin hanya memiliki akses ke `/admin/enrollments/flagged` (khusus pendaftaran bermasalah). Tidak ada hub `/admin/enrollments` lengkap untuk memfilter, mencari, dan memantau seluruh pendaftaran aktif, lunas, maupun tertunggak.
2. **Pelanggaran Aturan Desain (Header Pill Clutter & Non-Type KPIs):**
    - Komponen `PageHeader` pada `src/components/admin/ui.tsx` masih merender prop `meta` sebagai pill/kapsul dekoratif ber-border (`inline-flex items-center rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-700`), melanggar aturan [AGENTS.md](../../AGENTS.md) Bagian 3.3 (_Anti-Header Pill Clutter_).
    - Navigasi metrik di dashboard admin belum terhubung secara konsisten ke halaman entitas yang relevan.

### User Story

_Sebagai Administrator_, saya ingin dapat menelusuri data akademik secara menyeluruh dua arah-mulai dari detail kelas (melihat roster siswa terdaftar, status cicilan, jadwal, dan guru pengampu), hub pendaftaran lengkap, tautan cerdas dari master guru/mapel/periode ke daftar kelas terfilter, serta antarmuka yang bersih tanpa pill clutter-sehingga pengelolaan administrasi lembaga berjalan efektif, transparan, dan terhubung dengan baik.

---

## 2. Commands Verifikasi

```bash
# Verifikasi kompilasi TypeScript (Wajib 0 error, gunakan PowerShell Windows sesuai aturan interop WSL)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Project Structure & Affected Files

```
src/
├── app/
│   └── [locale]/
│       ├── admin/
│       │   ├── layout.tsx                                    → Update NavSections (Pendaftaran sebagai menu utama + badge)
│       │   ├── dashboard/page.tsx                            → Hubungkan kartu metrik ke URL filter entitas terkait
│       │   ├── classes/
│       │   │   ├── page.tsx                                  → Filter guruId, mapelId, periodeId + tautan ke Detail Kelas
│       │   │   └── [classId]/
│       │   │       └── page.tsx                              → [BARU] Halaman Detail Kelas (Tab Roster, Jadwal, Info Guru)
│       │   ├── enrollments/
│       │   │   ├── page.tsx                                  → [BARU] Hub Pendaftaran Lengkap (Filter status, pencarian, detail ortu)
│       │   │   └── flagged/page.tsx                          → Pertahankan rute flagged + tautan kembali ke Hub Pendaftaran
│       │   ├── teachers/page.tsx                             → Tautkan badge kelas ke /admin/classes?guruId=X
│       │   ├── subjects/page.tsx                             → Tautkan badge kelas ke /admin/classes?mapelId=Y
│       │   └── periods/page.tsx                              → Tautkan badge kelas ke /admin/classes?periodeId=Z
├── components/
│   └── admin/
│       └── ui.tsx                                            → Hapus pill kapsul di PageHeader (ubah jadi tipografi tenang)
├── i18n/
│   └── messages/
│       ├── id/admin.json & adminForms.json                   → Tambahkan key lokalisasi ID baru
│       └── en/admin.json & adminForms.json                   → Tambahkan key lokalisasi EN baru
└── .agents/
    └── docs/
        └── DAFTAR_HALAMAN.md                                 → Perbarui indeks rute portal admin
```

---

## 4. Detailed Specification & Acceptance Criteria

### Slice 1: Standardisasi Komponen UI Admin (Anti-Header Pill Clutter & Konsistensi)

- **Target:** `src/components/admin/ui.tsx` (`PageHeader`).
- **Ketentuan:**
    - Hapus badge/pill kapsul ber-border `rounded-full bg-slate-200/70` pada prop `meta` di `PageHeader`.
    - Ubah representasi `meta` menjadi tipografi sekunder yang tenang: `· {meta}` dengan styling teks slate (`text-slate-500 font-medium`), menyatu secara elegan di baris deskripsi tanpa kapsul/border pemanis.
    - Sesuai aturan [AGENTS.md](../../AGENTS.md) Bagian 3.3: _"Judul halaman (h1) harus berdiri bersih, percaya diri, dan berwibawa mengandalkan kekuatan tipografi"_.

### Slice 2: Halaman Detail Kelas (`/admin/classes/[classId]`)

- **Target:** `src/app/[locale]/admin/classes/[classId]/page.tsx`
- **Fitur & Tab:**
    1. **Header Kelas:** Nama mata pelajaran, jenjang, tingkat, ruangan, nama guru pengampu, status kelas (aktif/dibatalkan), serta tombol aksi "Ubah Kelas" (`/admin/classes/[classId]/edit`).
    2. **Tab 1: Roster Siswa (`tab=roster` - Default):**
        - Tabel seluruh siswa yang terdaftar di kelas ini (`Pendaftaran`).
        - Kolom: Nama Siswa & Usia/Tingkat, Nama Orang Tua & Kontak Telepon/Alamat, Status Pendaftaran (`StatusBadge`), Metode Bayar (Lunas / DP + Cicilan), Ringkasan Pembayaran (Sudah bayar berapa vs Total tagihan), dan Tanggal Terdaftar.
        - Empty state ramah jika belum ada siswa terdaftar: _"Belum ada siswa yang terdaftar di kelas ini"_.
    3. **Tab 2: Jadwal & Presensi (`tab=jadwal`):**
        - Daftar slot jadwal belajar mingguan (`JadwalItem`: hari, jam mulai–selesai).
        - Rekap ringkas total sesi presensi yang telah dicatat oleh guru, jumlah hadir, izin, sakit, dan alpa untuk siswa di kelas ini.
    4. **Tab 3: Info & Pengajar (`tab=info`):**
        - Profil guru pengampu: nama, email, nomor telepon, alamat.
        - Konfigurasi kuota: Kuota Terisi, Kuota Minimum (BR#10), Kuota Maksimum.
        - Konfigurasi biaya: Biaya Periode, Biaya DP, Tenor Maksimum (BR#12, BR#28).
        - Periode pendaftaran: Nama periode, tanggal mulai–selesai, batas tutup pendaftaran.

### Slice 3: Hub Pendaftaran Lengkap (`/admin/enrollments`) & Integrasi Sidebar

- **Target:** `src/app/[locale]/admin/enrollments/page.tsx` & `src/app/[locale]/admin/layout.tsx`
- **Fitur:**
    1. **Menu Sidebar:**
        - Menu "Pendaftaran" di sidebar diarahkan ke `/admin/enrollments`.
        - Badge counter tetap menampilkan jumlah pendaftaran bermasalah (`tertunggak`, `dibatalkan_timeout`, `dibatalkan_tunggakan`, `dibatalkan_kelas`) sebagai indikator antrean kerja aktif.
    2. **Filter Tabs:**
        - `Semua` (seluruh pendaftaran)
        - `Terdaftar` (status `terdaftar`)
        - `Menunggu Pembayaran` (status `menunggu_pembayaran`)
        - `Bermasalah` (status bermasalah, link langsung atau filter ke status masalah)
    3. **Tabel Pendaftaran:**
        - Kolom: Siswa & Jenjang, Kelas & Guru, Orang Tua & Kontak, Metode & Tenor, Status Pendaftaran, Status Pembayaran (Lunas/Pending/Gagal dari relasi `Pembayaran`), Tanggal Daftar.
        - Kolom Nama Kelas merupakan link langsung ke `/admin/classes/[classId]`.
        - Filter status dan pencarian interaktif via `DataTable`.

### Slice 4: Tautan Relasi Silang Pintar (Cross-Entity Smart Links)

- **Target:**
    - `src/app/[locale]/admin/classes/page.tsx`:
        - Mendukung filter `guruId`, `mapelId`, `periodeId` via query params.
        - Menampilkan informasi filter aktif (misal: _"Menampilkan kelas untuk pengajar: Budi"_ dengan tombol reset).
        - Kolom Mata Pelajaran memiliki tautan judul ke `/admin/classes/[classId]`.
        - Kolom Pengajar memiliki tautan ke `/admin/classes?guruId=[id]` atau profil pengajar.
    - `src/app/[locale]/admin/teachers/page.tsx`:
        - Counter `nKelas` menjadi tautan aktif ke `/admin/classes?guruId=[id]`.
    - `src/app/[locale]/admin/subjects/page.tsx`:
        - Counter `nKelas` menjadi tautan aktif ke `/admin/classes?mapelId=[id]`.
    - `src/app/[locale]/admin/periods/page.tsx`:
        - Counter `nKelas` menjadi tautan aktif ke `/admin/classes?periodeId=[id]`.
    - `src/app/[locale]/admin/dashboard/page.tsx`:
        - Kartu metrik Siswa Aktif ➔ `/admin/enrollments?status=terdaftar`
        - Kartu metrik Guru ➔ `/admin/teachers`
        - Kartu metrik Kelas Aktif ➔ `/admin/classes?status=aktif`
        - Kartu metrik Menunggu Pembayaran ➔ `/admin/enrollments?status=menunggu_pembayaran`
        - Kartu metrik Tunggakan ➔ `/admin/enrollments?status=tertunggak`

---

## 5. Constraints & Quality Standards (Patuhi CONSTRAINTS.md)

1. **Anti-Header Pill Clutter:** Dilarang menggunakan rounded badge / pill di header halaman utama.
2. **Icon Restraint:** Kartu metrik tidak boleh memiliki wrapper lingkaran berwarna (_tinted circle_), berfokus pada ketegasan tipografi (_"KPIs are type, not tiles"_).
3. **No Soft Deletes (BR#30):** Operasi query murni menggunakan status dan relasi langsung tanpa referensi ke `deleted_at`.
4. **Type Safety & Zero Errors:** Seluruh Server Component dan Client Component bertipe ketat (_strict TypeScript_). `npx tsc --noEmit` wajib bersih.
5. **No Regressions:** Fitur yang telah ada (seperti `/admin/enrollments/flagged`, CRUD Guru, Mapel, Periode, Kelas) tetap berfungsi 100% tanpa regresi.

---

## 6. Acceptance Criteria (Given-When-Then)

- **Scenario 1: Akses Roster Siswa di Detail Kelas**
    - **Given** Admin berada di `/admin/classes`.
    - **When** Admin mengklik nama kelas atau aksi "Rincian".
    - **Then** Sistem membuka `/admin/classes/[classId]` dan menampilkan tab "Roster Siswa" dengan tabel siswa, status pendaftaran, status pembayaran, dan kontak orang tua.

- **Scenario 2: Filter Kelas Berdasarkan Guru/Mapel/Periode**
    - **Given** Admin berada di `/admin/teachers` (atau `/admin/subjects` atau `/admin/periods`).
    - **When** Admin mengklik angka jumlah kelas pada seorang guru.
    - **Then** Sistem membuka `/admin/classes?guruId=[id]` dan tabel kelas langsung menampilkan hanya kelas yang diampu guru tersebut.

- **Scenario 3: Navigasi Hub Pendaftaran**
    - **Given** Admin berada di halaman admin manapun.
    - **When** Admin mengklik menu "Pendaftaran" di sidebar.
    - **Then** Sistem membuka `/admin/enrollments` yang menampilkan seluruh pendaftaran dengan tab status terpisah dan badge counter antrean bermasalah.

- **Scenario 4: Verifikasi Kompilasi & Standar Desain**
    - **Given** Seluruh perubahan selesai diimplementasikan.
    - **When** Perintah verifikasi `npx tsc --noEmit` dijalankan.
    - **Then** Tidak ada pesan error TypeScript yang muncul (exit code 0).
