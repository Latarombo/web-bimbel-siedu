# SPEC: Pembatasan Karakter Input Seluruh Form Siedu (End-to-End)

> **Status:** Approved (Hasil Sesi `/grill-me`)  
> **Tanggal:** 2026-11-22  
> **Author:** Antigravity  
> **Modul Terkait:**  
> - `src/prisma/contract.prisma` (PostgreSQL CHECK Constraints)  
> - `src/app/actions/` (`register.ts`, `login.ts`, `password-reset.ts`, `profile.ts`, `account-info.ts`, `child-info.ts`, `kontak.ts`, `admin.ts`, `teacher.ts`)  
> - `src/components/ui/field.tsx` (`Input` & `Textarea` counter support)  
> - `src/components/` (`admin/`, `auth/`, `contact/`, `parent/`, `pendaftaran/`, `teacher/`)  
> - `src/i18n/messages/` (`id/`, `en/`)  
> **Skills Terkait:** `postgresql-table-design`, `modern-web-guidance`, `ui-ux-pro-max`, `spec-driven-development`, `constraint-driven-development`, `ponytail`

---

## 1. Objective & User Story

### Objective
Menerapkan batasan panjang karakter huruf yang logis, aman, dan berstandar industri (RFC 5321, Bcrypt limit 72 byte, ITU-T E.164, Permendagri No. 73/2022) secara **End-to-End** di seluruh form aplikasi Siedu:
1. **Database Layer:** Menambahkan PostgreSQL `CHECK (length(...) <= n)` constraints pada Prisma Next contract.
2. **Server Action Layer:** Memperketat validasi skema Zod pada seluruh Server Actions dengan pesan multibahasa (`id` dan `en`).
3. **Frontend UI Layer:** Menambahkan atribut native `maxLength` pada `<input>` dan visual character counter (mis. `120 / 500`) pada `<Textarea>` tanpa menambah library eksternal baru.

### User Stories
- **Sebagai Pengguna (Orang Tua, Guru, Publik):** Saat saya mengetik di form (nama, catatan, materi, pesan), saya tidak bisa mengetik melebihi kuota karakter yang diizinkan (tertahan native `maxLength`), dan untuk input panjang seperti alamat atau materi pembelajaran, saya dapat melihat sisa karakter secara langsung melalui indikator counter di bawah textarea.
- **Sebagai Administrator & Pengembang Sistem:** Database dan server aman dari serangan DoS payload panjang (misal string password jutaan karakter yang membebani hashing Bcrypt) serta data di database tetap bersih, rapi, dan terhindar dari pemborosan memori/storage.

---

## 2. Command Verifikasi

Sesuai aturan environment WSL + Windows Interop:
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Standard Character Limits Blueprint

Berikut adalah matriks standarisasi seluruh field input di Siedu:

| No | Grup Data | Field / Entitas | Tipe Input | Min | Max | Rujukan Standar / Alasan |
|:---|:---|:---|:---:|:---:|:---:|:---|
| 1 | **Akun & Profil** | Nama Pengguna (`User.name`, `Guru`) | text | 2 | 100 | Permendagri No. 73/2022 (KTP maks 60) + ruang gelar/marga |
| 2 | **Akun & Profil** | Nama Anak (`Anak.nama`) | text | 2 | 100 | Standar nama kependudukan |
| 3 | **Akun & Profil** | Email (`User.email`, `Anak.emailNotifikasi`, `PesanKontak.email`) | email | 5 | 255 | RFC 5321 (Maksimum email 254-255 karakter) |
| 4 | **Akun & Profil** | Kata Sandi (`User.password`) | password | 8 | 72 | Limit algoritma hashing Bcrypt (72 byte) & proteksi DoS |
| 5 | **Akun & Profil** | Nomor Telepon (`User`, `Anak`, `PesanKontak`) | tel | 10 | 20 | ITU-T E.164 (maks 15 digit) + toleransi prefix `+62`/spasi |
| 6 | **Lokasi & Alamat**| Detail Alamat (`User.alamat`, `Guru.alamat`) | textarea| 5 | 500 | Standar alamat Indonesia (jalan, RT/RW, nomor, patokan) |
| 7 | **Lokasi & Alamat**| Wilayah/Kecamatan (`User`, `Pendaftaran`) | text | 1 | 100 | Nama kecamatan/wilayah terpanjang di Indonesia ~34 kar |
| 8 | **Lokasi & Alamat**| Sekolah Asal (`PesanKontak.sekolah`) | text | - | 150 | Nama sekolah formal lengkap |
| 9 | **Akademik/Admin** | Tingkat Kelas (`Kelas.tingkat`, `Anak.tingkat`) | text | - | 30 | Misal "Kelas 10 MIPA 1", "TK B" |
| 10| **Akademik/Admin** | Ruangan (`Kelas.ruangan`) | text | - | 50 | Misal "Lab Komputer 2", "Ruang Anggrek B-101" |
| 11| **Akademik/Admin** | Nama Mata Pelajaran (`MataPelajaran.nama`) | text | 2 | 100 | Misal "Matematika Peminatan Sains" |
| 12| **Akademik/Admin** | Deskripsi Mata Pelajaran (`MataPelajaran.deskripsi`)| textarea| - | 500 | Ringkasan silabus mapel |
| 13| **Akademik/Admin** | Nama Periode (`PeriodePendaftaran.nama`) | text | 2 | 100 | Misal "Semester Genap 2026/2027" |
| 14| **Harian Guru** | Catatan Presensi (`Presensi.catatan`) | text | - | 255 | Catatan absensi murid harian |
| 15| **Harian Guru** | Catatan Nilai (`NilaiProgres`, `HasilPenilaian`) | textarea| - | 1000 | Feedback progres kualitatif murid |
| 16| **Harian Guru** | Materi Pertemuan (`CatatanPertemuan.materi`) | textarea| - | 2000 | Ringkasan materi ajar guru |
| 17| **Harian Guru** | PR / Tugas Pertemuan (`CatatanPertemuan.pr`) | textarea| - | 1000 | Instruksi pekerjaan rumah |
| 18| **Harian Guru** | Nama Penilaian (`Penilaian.nama`) | text | 2 | 100 | Misal "Ulangan Harian 1 - Trigonometri" |
| 19| **Harian Guru** | Konten Status (`StatusPembelajaran.kontenTeks`) | textarea| 1 | 1000 | Caption / pembaruan kelas harian |
| 20| **Koreksi & Laporan**| Alasan Koreksi (`PengajuanKoreksi.alasan`) | textarea| 5 | 1000 | Justifikasi perubahan entri terkunci |
| 21| **Koreksi & Laporan**| Catatan Admin Koreksi (`PengajuanKoreksi.catatanAdmin`)| textarea| - | 1000 | Catatan persetujuan/penolakan admin |
| 22| **Koreksi & Laporan**| Alasan & Catatan Foto (`LaporanFotoStatus`) | textarea| 5 | 500 / 1000 | Pelaporan foto privat oleh orang tua |
| 23| **Kontak Publik** | Pesan Kontak (`PesanKontak.pesan`) | textarea| 10 | 2000 | Isi pesan pertanyaan calon siswa/orang tua |

---

## 4. Architectural Implementation Details

### A. Database Layer (`src/prisma/contract.prisma`)
Mengikuti rekomendasi skill `postgresql-table-design`, tipe data tetap `String` (PostgreSQL `text`) dengan menambahkan `@@check` constraints:
```prisma
// Contoh penambahan check constraints di contract.prisma:
@@check(expression: "length(name) <= 100", name: "user_name_len")
@@check(expression: "length(email) <= 255", name: "user_email_len")
@@check(expression: "alamat IS NULL OR length(alamat) <= 500", name: "user_alamat_len")
@@check(expression: "length(nomor_telepon) <= 20", name: "user_phone_len")
@@check(expression: "length(nama) <= 100", name: "anak_nama_len")
@@check(expression: "tingkat IS NULL OR length(tingkat) <= 30", name: "anak_tingkat_len")
@@check(expression: "email_notifikasi IS NULL OR length(email_notifikasi) <= 255", name: "anak_email_notif_len")
@@check(expression: "nomor_telepon IS NULL OR length(nomor_telepon) <= 20", name: "anak_phone_len")
@@check(expression: "length(nama) <= 100", name: "mapel_nama_len")
@@check(expression: "deskripsi IS NULL OR length(deskripsi) <= 500", name: "mapel_deskripsi_len")
@@check(expression: "length(nama) <= 100", name: "periode_nama_len")
@@check(expression: "tingkat IS NULL OR length(tingkat) <= 30", name: "kelas_tingkat_len")
@@check(expression: "ruangan IS NULL OR length(ruangan) <= 50", name: "kelas_ruangan_len")
@@check(expression: "catatan IS NULL OR length(catatan) <= 255", name: "presensi_catatan_len")
@@check(expression: "catatan_kualitatif IS NULL OR length(catatan_kualitatif) <= 1000", name: "nilai_catatan_len")
@@check(expression: "materi IS NULL OR length(materi) <= 2000", name: "catatan_materi_len")
@@check(expression: "pr IS NULL OR length(pr) <= 1000", name: "catatan_pr_len")
@@check(expression: "length(nama) <= 100", name: "penilaian_nama_len")
@@check(expression: "catatan IS NULL OR length(catatan) <= 1000", name: "hasil_catatan_len")
@@check(expression: "length(konten_teks) <= 1000", name: "status_konten_len")
@@check(expression: "length(alasan) <= 1000", name: "koreksi_alasan_len")
@@check(expression: "catatan_admin IS NULL OR length(catatan_admin) <= 1000", name: "koreksi_catatan_admin_len")
@@check(expression: "length(nama) <= 100", name: "pesan_kontak_nama_len")
@@check(expression: "length(telepon) <= 20", name: "pesan_kontak_telepon_len")
@@check(expression: "length(email) <= 255", name: "pesan_kontak_email_len")
@@check(expression: "sekolah IS NULL OR length(sekolah) <= 150", name: "pesan_kontak_sekolah_len")
@@check(expression: "length(pesan) <= 2000", name: "pesan_kontak_pesan_len")
```

### B. Server Action Layer (Zod Validation & i18n)
Seluruh Server Actions diperbarui dengan validasi `.max()` yang sinkron dan konsisten:
- `src/app/actions/register.ts`: email `.max(255)`, password `.min(8).max(72)`.
- `src/app/actions/login.ts`: email `.max(255)`, password `.max(72)`.
- `src/app/actions/password-reset.ts`: email `.max(255)`, password `.min(8).max(72)`.
- `src/app/actions/profile.ts`: name `.min(2).max(100)`, alamat `.min(5).max(500)`, nomor_telepon `.min(10).max(20)`.
- `src/app/actions/account-info.ts`: name `.min(2).max(100)`, wilayah `.min(1).max(100)`, detail_alamat `.min(5).max(500)`, nomor_telepon `.min(10).max(20)`.
- `src/app/actions/child-info.ts`: nama `.min(2).max(100)`, tingkat `.min(1).max(30)`, email_notifikasi `.max(255)`, nomor_telepon `.min(10).max(20)`.
- `src/app/actions/admin.ts`:
  - `mapelSchema`: nama `.min(2).max(100)`, deskripsi `.max(500)`.
  - `periodeSchema`: nama `.min(2).max(100)`.
  - `guruSchema`: nama `.min(2).max(100)`, email `.max(255)`, password `.min(8).max(72)`, alamat `.max(500)`, nomor_telepon `.min(10).max(20)`.
  - `kelasSchema`: tingkat `.max(30)`, ruangan `.max(50)`.
  - `prosesKoreksi`: catatan_admin `.max(1000)`.
- `src/app/actions/teacher.ts`:
  - `updateGuruProfile`: nama `.min(2).max(100)`, alamat `.max(500)`, nomor_telepon `.min(10).max(20)`.
  - `savePresensi`: catatan `.max(255)`.
  - `saveNilai`: catatan `.max(1000)`.
  - `saveCatatanPertemuan`: materi `.max(2000)`, pr `.max(1000)`.
  - `ajukanKoreksi`: alasan `.min(5).max(1000)`, data_usulan `.max(1000)`.
  - `savePenilaianBatch`: nama `.min(2).max(100)`, catatan `.max(1000)`.
  - `bagikanStatusPembelajaran`: kontenTeks `.min(1).max(1000)`.
  - `laporkanFotoStatus`: alasan `.min(5).max(500)`, catatan `.max(1000)`.

### C. Frontend UI Layer (`src/components/ui/field.tsx`)
Penyempurnaan komponen `Textarea` dan `Input`:
1. `Input`: Meneruskan atribut native `maxLength` dan `minLength` secara transparan.
2. `Textarea`:
   - Menerima prop opsional `showCount?: boolean` atau secara otomatis menampilkan counter jika prop `maxLength` diisi.
   - Menyajikan indikator sisa/total karakter di sudut kanan bawah (misal: `42/500`) dengan tipografi tabular yang tenang (`text-xs text-slate-400 font-mono`) tanpa melanggar batasan `Icon Restraint`.

---

## 5. Vertical Slices & Task Breakdown

### Slice 1: Database Contract & Check Constraints
- Tambahkan `@@check` constraints untuk batas panjang karakter pada entitas `User`, `Anak`, `MataPelajaran`, `PeriodePendaftaran`, `Kelas`, `Presensi`, `NilaiProgres`, `CatatanPertemuan`, `Penilaian`, `HasilPenilaian`, `StatusPembelajaran`, `PengajuanKoreksi`, `LaporanFotoStatus`, `PesanKontak` di `src/prisma/contract.prisma`.
- Emit contract types jika diperlukan.

### Slice 2: Server Actions, Zod Schemas & i18n
- Tambahkan translasi pesan `passwordMax`, `materiMax`, `prMax`, `statusContentMax`, `assessmentNameMax`, `charCount` pada `src/i18n/messages/id/` dan `src/i18n/messages/en/` (`auth.json`, `adminForms.json`, `teacher.json`).
- Perbarui dan sinkronkan seluruh skema Zod di 9 file Server Actions.

### Slice 3: Frontend UI Components, Textarea Counter & Native Attributes
- Perbarui `src/components/ui/field.tsx` untuk menyertakan counter visual pada `Textarea` bila `maxLength` disertakan.
- Pasang `maxLength` pada input form di:
  - Form Auth & Akun: `register-form.tsx`, `login-form.tsx`, `reset-form.tsx`, `account-info-form.tsx`, `child-info-form.tsx`, `profile-form.tsx`.
  - Form Kontak: `contact-form.tsx`.
  - Form Admin: `guru-form.tsx`, `mapel-form.tsx`, `periode-form.tsx`, `kelas-form.tsx`.
  - Form Guru: `presensi-form.tsx`, `nilai-form.tsx`, `session-journal-form.tsx`, `penilaian-form.tsx`, `status-form.tsx`, `pengajuan-koreksi-form.tsx`.
- Verifikasi bebas error: `powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null`.

---

## 6. Acceptance Criteria (Given-When-Then)

### Skenario 1: Input Melebihi Batas Tertahan di UI
- **GIVEN** Pengguna berada di halaman registrasi, profil, atau catatan pertemuan.
- **WHEN** Pengguna mengetik nama > 100 karakter atau catatan materi > 2000 karakter.
- **THEN** Input form menghentikan pengetikan tepat pada batas maksimum karakter berkat atribut `maxLength`, dan indikator counter menampilkan `100/100` atau `2000/2000`.

### Skenario 2: Pencegahan DoS Password Panjang di Backend
- **GIVEN** Klien mengirimkan request register atau reset password langsung dengan payload password > 72 karakter.
- **WHEN** Server Action memvalidasi data dengan Zod.
- **THEN** Request ditolak sebelum proses `bcrypt.hash()` dijalankan, dan error field `passwordMax` dikembalikan.

### Skenario 3: Konsistensi Validasi Nomor Telepon & Alamat
- **GIVEN** Administrator menambah Guru atau Orang Tua mengedit Profil.
- **WHEN** Mengisi alamat hingga 500 karakter atau nomor telepon 10-20 karakter.
- **THEN** Kedua aksi berhasil disimpan secara seragam tanpa penolakan asimetris.

---

## 7. Out-of-Scope
- Perubahan tipe fisik kolom Postgres dari `TEXT` menjadi `VARCHAR(n)` (tetap gunakan `TEXT` + `CHECK` sesuai standar `postgresql-table-design`).
- Menambahkan rich-text editor / WYSIWYG untuk catatan materi pertemuan (tetap menggunakan clean native `<textarea>`).
- Validasi karakter khusus non-ASCII (hanya pembatasan panjang karakter huruf/angka standar).
