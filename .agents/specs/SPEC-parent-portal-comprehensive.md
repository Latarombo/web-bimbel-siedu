# SPEC: Portal Orang Tua Komprehensif (Status Story Guru WA, Penguncian Data Anak & Rapor Siswa)

> **Modul ID:** `parent-portal-comprehensive`
> **Aktor:** Orang Tua / Wali (`role: orang_tua`)
> **Status:** Specify (Phase 2 SDD — Siap Implementasi)
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md).

---

## 1. Objective & User Story

### Konteks & Masalah

1. **Status Pembelajaran Guru Multi-Anak:** Orang tua yang mendaftarkan lebih dari satu anak ke kelas yang berbeda membutuhkan akses pemantauan status pembelajaran (foto kegiatan & kabar kegiatan belajar 24 jam ala WhatsApp Story) dari seluruh guru yang mengampu anak-anaknya, bukan hanya anak yang sedang dipilih pada dropdown switcher.
2. **Integritas Profil Anak Terdaftar:** Saat anak telah terdaftar pada kelas aktif, data profil anak harus dikunci total dari pengubahan sepihak agar tidak merusak data akademik, sertifikat, absensi, dan penagihan transaksi yang sedang berjalan.
3. **Akses Rapor Siswa Semester:** Orang tua memerlukan akses transparan dan resmi untuk melihat dokumen Rapor Semester anak (`/enrollments/[id]/report`) yang memuat rekapitulasi kehadiran otomatis, rekapitulasi nilai tugas/asesmen, catatan evaluasi guru, serta kemampuan cetak PDF resmi.

### User Story

_Sebagai Orang Tua/Wali Siswa_, saya ingin:

- Melihat linimasa status dokumentasi belajar (gaya WhatsApp Story) dari semua guru yang mengampu anak-anak saya di bagian atas Dashboard.
- Mengetahui bahwa profil anak saya aman dan terkunci saat mengikuti kelas bimbingan belajar.
- Mengakses halaman Rapor Siswa Semester resmi per kelas yang diikuti anak saya, membaca capaian dan evaluasi guru secara lengkap, serta mencetak atau menyimpannya dalam format PDF.

---

## 2. Commands Verifikasi

```bash
# 1. Verifikasi kompilasi TypeScript (Wajib 0 error)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null

# 2. Verifikasi linter
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run lint" < /dev/null
```

---

## 3. Project Structure

Berkas yang dibuat atau diperbarui dalam spesifikasi ini:

```
src/
├── app/
│   └── [locale]/
│       └── (parent)/
│           ├── home/
│           │   └── page.tsx                         → Agregasi status guru multi-anak & link akses rapor
│           ├── children/
│           │   └── [id]/
│           │       └── edit/
│           │           └── page.tsx                 → Penegasan status terkunci total
│           └── enrollments/
│               └── [id]/
│                   ├── page.tsx                     → Tautan akses Rapor Semester anak
│                   └── report/
│                       └── page.tsx                 → Halaman Dokumen Resmi Rapor Siswa Semester Ortu
├── components/
│   └── parent/
│       ├── child-edit-form.tsx                      → Penguncian total form anak terdaftar (A3)
│       ├── learning-status-inline-story.tsx         → Story container & multi-class badges
│       └── reports/
│           └── parent-report-view.tsx               → Tampilan cetak & baca Rapor Orang Tua
└── lib/
    └── rapor.ts                                     → Fungsi getRaporDetail (didukung forParentId)
```

---

## 4. Vertical Slices (Rincian Fitur)

### Slice 1: Multi-Anak Status Pembelajaran Guru (WhatsApp Story Style)

- **Problem:** Dashboard orang tua saat ini hanya mengambil pendaftaran untuk satu anak yang aktif di switcher (`p.anakId.eq(dipilih.id)`).
- **Solusi:**
    1. Ubah query status agar mengambil seluruh pendaftaran aktif dari **seluruh anak** milik orang tua yang sedang login (`anakList.map(a => a.id)`).
    2. Saring status aktif (< 24 jam) dari seluruh kelas yang diikuti anak-anak tersebut via `filterStatusForParent`.
    3. Di komponen `LearningStatusInlineStory`, tampilkan avatar ring guru dengan label kelas dan indikator nama anak penerima (misal: "Matematika 7 · Anton").
    4. Story Viewer WhatsApp Style: progress bar per slide foto, transisi auto-advance 5 detik, pause on hold/hover, foto kegiatan tajam, dan caption teks dari guru.

### Slice 2: Penguncian Total Formulir Anak Terdaftar (Opsi A3)

- **Problem:** Form edit anak masih mengizinkan pengubahan nomor kontak atau foto ketika kelas aktif.
- **Solusi:**
    1. Sesuai keputusan wawancara A3, jika anak memiliki pendaftaran berstatus aktif (`menunggu_pembayaran`, `terdaftar`, `tertunggak`), seluruh formulir dikunci total menjadi read-only view.
    2. Form menampilkan ringkasan data identitas anak, kartu info kelas yang sedang diikuti, alert status terkunci (`editLockedNotice`), dan tombol navigasi tunggal: "Kembali ke Daftar Anak".
    3. Server action `updateChild` di `src/app/actions/child-info.ts` memvalidasi `anakTerkunci` dan menolak setiap manipulasi request mutasi.

### Slice 3: Halaman Rapor Siswa Semester untuk Orang Tua (`/enrollments/[id]/report`)

- **Fitur Utama:**
    1. Rute Server Component `/enrollments/[id]/report` yang memvalidasi kepemilikan orang tua via `getRaporDetail(pendaftaranId, { forParentId: ortuId })`.
    2. Menampilkan header resmi Siedu, data profil siswa, profil kelas, nama guru pengampu, dan periode semester.
    3. Rekapitulasi Presensi: Total sesi, Hadir, Izin, Sakit, Alpa, dan persentase kehadiran dengan tipografi `tabular-nums`.
    4. Rekapitulasi Asesmen/Tugas: Daftar tugas yang diterbitkan guru beserta nilai siswa, nilai maksimum, dan catatan per tugas.
    5. Catatan Rapor Guru: Evaluasi subjektif guru (`catatan_rapor`) yang menyoroti perkembangan anak.
    6. Tombol Aksi: Tombol "Cetak / Simpan PDF" (`window.print()`) dengan styling cetak rapi (`@media print` tanpa header navigasi web) dan tombol "Kembali ke Rincian Pendaftaran".

### Slice 4: Integrasi Akses Rapor di Dashboard & Pendaftaran

- Di kartu kelas Dashboard Orang Tua (`/home`): Jika kelas memiliki rapor yang telah diterbitkan guru (`raporDiterbitkanPada`), tampilkan tombol sekunder yang tenang "Lihat Rapor Semester".
- Di halaman Rincian Pendaftaran (`/enrollments/[id]`): Sediakan panel/tombol "Rapor Hasil Belajar" jika status pendaftaran aktif atau selesai.

---

## 5. Acceptance Criteria (Given-When-Then)

### Skenario 1: Melihat Status Guru dari Dua Anak Berbeda

- **GIVEN** Orang tua memiliki Anak A di Kelas 7 Matematika (Guru Budi) dan Anak B di Kelas 9 IPA (Guru Siti).
- **WHEN** Orang tua membuka Dashboard (`/home`).
- **THEN** Story Bar menampilkan status aktif dari kedua guru (Guru Budi & Guru Siti) terlepas dari anak mana yang sedang dipilih di switcher.

### Skenario 2: Pencegahan Edit Profil Anak Terdaftar

- **GIVEN** Anak sudah terdaftar di kelas Matematika aktif.
- **WHEN** Orang tua membuka halaman edit profil anak (`/children/[id]/edit`).
- **THEN** Formulir terkunci total dalam mode read-only, tombol simpan dinonaktifkan, dan tampil pesan bahwa data anak terkunci selama mengikuti kelas aktif.

### Skenario 3: Membuka dan Mencetak Rapor Siswa

- **GIVEN** Guru telah menerbitkan rapor semester untuk pendaftaran anak.
- **WHEN** Orang tua mengklik tautan "Lihat Rapor Semester".
- **THEN** Halaman `/enrollments/[id]/report` terbuka menampilkan kalkulasi nilai, persentase kehadiran, catatan guru, dan tombol Cetak PDF yang siap diformat untuk cetak A4.

---

## 6. Boundaries & Quality Constraints

- **KPIs are Type, not Tiles:** Jangan gunakan kartu berikon warna-warni untuk angka persentase atau nilai di rapor orang tua; gunakan tipografi bersih dan angka yang jujur.
- **No Header Pill Clutter:** Dilarang meletakkan pill badge berjejer di samping judul `h1` rapor.
- **Design Consistency:** Ikuti palet warna Siedu (biru, slate netral, rounded rapi) dan dukung dark mode.
- **Keamanan Akses Data (RLS):** Validasi ketat kepemilikan orang tua (`anak.orangTuaId === ortuId`) sehingga orang tua tidak bisa mengintip rapor anak orang lain.
