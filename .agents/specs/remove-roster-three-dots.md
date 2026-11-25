# Spec: Penghapusan Menu Titik Tiga pada Kolom Aksi Roster Siswa

## 1. Objective & User Story
Sebagai Guru yang membuka halaman detail kelas (`/teacher/classes/[classId]`), saya ingin kolom aksi pada tabel Roster Siswa bersih tanpa ikon titik tiga (`MoreVertical`), sehingga tampilan antarmuka lebih tenang, tidak berantakan (*uncluttered*), dan akses tindakan utama (Profil Siswa dan Input Nilai Cepat) tetap langsung dan cepat. Tautan sekunder seperti Rapor Siswa, Riwayat Nilai, dan Riwayat Presensi dapat diakses secara terpusat melalui Drawer Profil Lengkap Siswa.

## 2. Verification Commands
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

## 3. Data Contracts & UI Changes
- Komponen: `src/components/teacher/classes/class-detail-view.tsx`
  - Pada baris tabel desktop: Hapus `DropdownMenu` dan ikon `MoreVertical` dari kolom sticky `Aksi`. Sisakan tombol ikon mandiri `Eye` (Profil Lengkap Siswa) dan `Pencil` (Input Nilai Cepat), keduanya dengan `aria-label` yang jelas.
  - Pada tampilan kartu mobile (`block md:hidden`): Hapus `DropdownMenu` dan ikon `MoreVertical` di pojok kanan atas kartu siswa.
- Komponen: `src/components/teacher/classes/student-profile-drawer.tsx`
  - Tambahkan tautan navigasi sekunder ke Riwayat Nilai (`/teacher/grades/${student.id}`) dan Riwayat Presensi (`/teacher/corrections?entitas=siswa&id=${student.id}`) di dalam drawer profil siswa agar tidak ada kapabilitas yang hilang.

## 4. Acceptance Criteria (Given-When-Then)
- **AC1: Kolom Aksi Tabel Bersih**
  - **Given**: Guru membuka tab "Roster Siswa" pada `/teacher/classes/[classId]`.
  - **When**: Guru melihat kolom "Aksi" pada tabel desktop.
  - **Then**: Tidak ada ikon titik tiga (`MoreVertical`) atau menu dropdown tersembunyi.
  - **And**: Tersedia tombol profil (`Eye`) dan input nilai cepat (`Pencil`) dengan atribut aksesibilitas yang valid.
- **AC2: Tampilan Mobile Konsisten**
  - **Given**: Guru melihat kartu siswa di layar resolusi mobile (< 768px).
  - **When**: Guru memeriksa bagian kartu siswa.
  - **Then**: Tidak ada ikon titik tiga di pojok kanan atas kartu.
- **AC3: Akses Rapor & Riwayat Tetap Lengkap**
  - **Given**: Guru membuka Drawer Profil Siswa dengan mengklik nama siswa atau ikon profil.
  - **When**: Guru melihat isi drawer profil.
  - **Then**: Tersedia akses ke Rapor Siswa, Riwayat Nilai, dan Riwayat Presensi.
- **AC4: Kualitas & Tipe Data Bersih**
  - **Given**: Perubahan kode selesai.
  - **When**: Menjalankan `npx tsc --noEmit`.
  - **Then**: Kompilasi TypeScript sukses tanpa error (exit code 0).

## 5. Out-of-Scope
- Mengubah struktur data atau query API database.
- Mengubah layout tab selain Roster Siswa (misal: Jadwal, Presensi, Penilaian).
