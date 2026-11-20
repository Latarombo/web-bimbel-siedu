# SPEC-teacher-classes-card-redesign: Desain Kartu Rombongan Belajar Guru (/teacher/classes)

- **Status:** Approved by User -> Implementing V2
- **Author:** Antigravity (AI Pair Programmer)
- **Target Route:** `/teacher/classes` (`TeacherClassesView`)
- **Reference Component:** `KelasCardView` (`src/components/kelas-card.tsx`)

---

## 1. Objective & User Story

Sebagai **Guru Pengajar (Teacher)**,  
Saya ingin melihat daftar rombongan belajar yang saya ampu dalam format kartu visual yang selaras dengan tema visual katalog kelas publik (`/classes`),  
Namun bebas dari ornamen marketing (seperti centang hijau promosi atau pill badge status aktif yang tidak relevan),  
Serta dapat diklik di seluruh area kartu untuk langsung membuka detail kelas atau presensi hari ini secara cepat.

---

## 2. Keputusan Desain & Alignment Pengguna (V2)

1. **Penghapusan Pill "Aktif" (User Decision A1):**
   - Hapus pill badge "Aktif" ber-border di kanan atas kartu.
   - Gantikan dengan tipografi teks bersih `Jenjang {c.jenjang}`. Jika kelas berstatus dibatalkan, tampilkan teks tipografi sekunder yang tenang (`Dibatalkan`), tanpa kapsul/pill badge ber-border.

2. **Penghapusan Ikon Centang Hijau (User Decision A1):**
   - Ikon centang hijau (`<Check>`) dihapus sepenuhnya dari badan kartu karena kurang relevan untuk konteks operasional rombel.
   - Gantikan dengan baris informasi operasional berbasis *Key-Value Clean Rows* yang tenang dan berwibawa:
     - **Jadwal Rutin:** Hari dan rentang jam tatap muka (`tabular-nums`).
     - **Sesi Hari Ini:** Status sesi hari ini (waktu & penanda perlu presensi jika ada pertemuan, atau teks tenang jika tidak ada jadwal).
     - **Kapasitas Rombel:** Rasio keterisian siswa (`X / Y Siswa`).
     - **Ruang Kelas:** Nama ruangan atau keterangan alokasi.
     - **Periode:** Nama periode akademik aktif.

3. **Interaksi Klik Seluruh Kartu via Stretched Link (User Decision A2):**
   - Seluruh area kartu dapat diklik untuk membuka halaman detail kelas (`/teacher/classes/[id]`) menggunakan pola *Stretched Link* (`absolute inset-0`).
   - Tombol CTA di bawah menggunakan `relative z-10` sehingga:
     - Jika hari ini ada jadwal mengajar aktif: Tombol CTA menjadi **"Catat Presensi Hari Ini"** (Biru Brand) yang langsung membuka lembar presensi sesi hari ini.
     - Jika tidak ada jadwal hari ini: Tombol CTA menjadi **"Buka Detail Kelas"** (Slate Netral).
   - Tautan sekunder ("Roster Siswa", "Nilai Siswa") menggunakan `relative z-10` untuk navigasi cepat.
   - Menghindari anti-pattern nested `<a>` tag dalam DOM HTML5.

4. **Kerapatan Grid Kolom:**
   - 3 kolom pada desktop (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`), selaras dengan katalog kelas.

---

## 3. Data Contracts & Props

Menggunakan data contract yang sudah ada pada `TeacherClassesViewProps`:
- `ClassCardItem` (id, mapelNama, jenjang, tingkat, ruangan, periodeNama, kuotaMaksimum, kuotaTerisi, status, schedules, hasSessionToday).
- `todayStr` dan `todayDayLabel`.

---

## 4. Verifikasi Kualitas

1. `powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL/siedu'; npx tsc --noEmit" < /dev/null`
2. Hasil verifikasi tipe: 0 error.
3. Kepatuhan penuh terhadap `CONSTRAINTS.md` (Icon Restraint, Anti-Header Pill Clutter, Tabular Nums, WCAG AA).
