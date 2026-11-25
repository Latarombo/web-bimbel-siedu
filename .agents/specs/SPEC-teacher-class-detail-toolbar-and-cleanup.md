# Spesifikasi: Toolbar Terpadu & Pembersihan Subheader Redundan pada Detail Kelas Guru

## 1. Objective & User Story
Sebagai seorang guru di Siedu, ketika saya membuka halaman rincian kelas (`/teacher/classes/[classId]`), saya ingin setiap tab navigasi memiliki kontrol pencarian (*searchbar*) dan penyaringan (*filter*) yang cepat dan terpadu, serta bebas dari teks judul/subjudul redundan (seperti *"Tugas & Asesmen sub: Daftar tugas, kuis, dan ujian terstruktur untuk kelas ini."*) yang memboroskan ruang vertikal, sehingga saya dapat langsung fokus mencari murid, sesi, atau tugas secara efisien.

## 2. Invariant & Batasan Kritis
- **Halaman yang Ditargetkan:** `src/components/teacher/classes/class-detail-view.tsx` (dan jika diperlukan komponen terkait kalender sesi `teacher-calendar-view.tsx`).
- **Pembersihan Teks Redundan:**
  - Hapus blok subheader teks di Tab Tugas & Asesmen: `"Tugas & Asesmen"` + `"Daftar tugas, kuis, dan ujian terstruktur untuk kelas ini."`.
  - Hapus blok subheader teks di Tab Roster Siswa: `"Daftar Siswa"` + `"Daftar murid terdaftar dalam rombongan belajar ini."`.
- **Toolbar per Tab Navigasi:**
  - **Tab Roster:** Search input (nama siswa/NIS) + FilterDropdown Status Siswa (`all`, `terdaftar`, `tertunggak`) + Tombol aksi Broadcast WA.
  - **Tab Tugas & Asesmen:** Search input (nama tugas) + FilterDropdown Status Asesmen (`all`, `terbit`, `draf`) + Tombol Buat Tugas Baru.
  - **Tab Jadwal & Sesi:** FilterDropdown Status Sesi (`all`, `terjadwal`, `selesai`, `dibatalkan`) untuk menyaring sesi yang ditampilkan di kalender/agenda.
  - **Tab Ringkasan:** Dibiarkan bersih tanpa toolbar pencarian karena merupakan tampilan ringkasan metrik statistik.
- **Standar Desain & Constraints:**
  - Mematuhi `CONSTRAINTS.md`: Tanpa `@ts-ignore`, icon restraint, empty state yang solutif saat hasil filter nihil, tinggi kontrol input seragam (h-9 / h-10), dan dukungan dark mode penuh.

## 3. Data Contracts & State Management
- Di `class-detail-view.tsx`:
  - `studentStatusFilter`: `'all' | 'terdaftar' | 'tertunggak'` (state baru)
  - `assessmentSearch`: string (state baru)
  - `assessmentStatusFilter`: `'all' | 'terbit' | 'draf'` (state baru)
  - `scheduleStatusFilter`: `'all' | 'terjadwal' | 'selesai' | 'dibatalkan'` (state baru)
- Penyaringan data berbasis `useMemo` untuk efisiensi re-render:
  - `filteredStudents`: menyaring berdasarkan `searchQuery` dan `studentStatusFilter`.
  - `filteredAssessments`: menyaring berdasarkan `assessmentSearch` dan `assessmentStatusFilter`.
  - `filteredCalendarSessions`: menyaring berdasarkan `scheduleStatusFilter`.

## 4. Acceptance Criteria (Given-When-Then)
- **AC-1:** Pada tab "Roster Siswa", tidak ada lagi teks subheader "Daftar Siswa" dan deskripsinya. Toolbar menampilkan input pencarian siswa dan dropdown filter status (Semua / Terdaftar / Tertunggak) yang memfilter tabel secara instan.
- **AC-2:** Pada tab "Tugas & Asesmen", teks "Tugas & Asesmen sub: Daftar tugas, kuis, dan ujian terstruktur untuk kelas ini." telah dihapus. Digantikan oleh toolbar yang memuat Searchbar nama tugas, FilterDropdown status (Semua / Terbit / Draf), dan tombol "Buat Tugas".
- **AC-3:** Pada tab "Jadwal & Sesi", tersedia filter status sesi (Semua Sesi / Terjadwal / Selesai / Dibatalkan) yang memperbarui tampilan kalender/agenda sesi kelas.
- **AC-4:** Tampilan saat pencarian atau filter menghasilkan 0 data (*empty state*) menyajikan teks yang jelas dan petunjuk untuk menyetel ulang filter.
- **AC-5:** Seluruh perubahan responsif pada mobile dan lulus verifikasi `npx tsc --noEmit` tanpa error.
