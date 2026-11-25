# Spec: Navigasi Langsung Sesi Pertemuan Kalender Guru

## 1. Objective & User Story
Sebagai Guru, saat saya melihat sesi pertemuan pada kalender (baik di `/teacher/calendar` maupun tab Jadwal/Kalender di `/teacher/classes/[classId]`), saya ingin mengklik sesi tersebut dan langsung diarahkan ke halaman kerja sesi pertemuan (`/teacher/classes/[classId]/sessions/[date]/attendance?sesi=[jadwalItemId]`) tanpa dialog card / drawer rincian sesi terlebih dahulu, agar alur kerja presensi dan pengajaran lebih cepat dan bebas hambatan (*frictionless*).

## 2. Verification Commands
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

## 3. Data Contracts & UI Changes
- Komponen: `src/components/teacher/calendar/teacher-calendar-view.tsx`
  - Ganti elemen interaktif sesi pada 4 mode tampilan kalender (Harian / *Daily*, Mingguan / *Weekly*, Bulanan / *Monthly*, Agenda Kompak / *Agenda*):
    - Jika sesi aktif (`statusSesi !== 'dibatalkan'`): render sebagai `<Link href={`/teacher/classes/${session.kelasId}/sessions/${session.tanggalPertemuan}/attendance?sesi=${session.jadwalItemId}`}>`.
    - Jika sesi dibatalkan (`statusSesi === 'dibatalkan'`): render sebagai elemen non-interaktif (`<div>`) dengan `cursor-not-allowed`, teks coret (`line-through`), dan `opacity-60`.
  - Hapus state drawer `selectedSession` dan komponen `CalendarSessionDrawer` dari `TeacherCalendarView`.

## 4. Acceptance Criteria (Given-When-Then)
- **AC1: Navigasi Langsung Mode Harian (Daily)**
  - **Given**: Guru berada di kalender mode Harian.
  - **When**: Guru mengklik salah satu sesi pertemuan aktif.
  - **Then**: Browser langsung berpindah ke `/teacher/classes/[classId]/sessions/[date]/attendance?sesi=[jadwalItemId]` tanpa memunculkan dialog/drawer.
- **AC2: Navigasi Langsung Mode Mingguan (Weekly Grid)**
  - **Given**: Guru berada di kalender mode Mingguan.
  - **When**: Guru mengklik kartu sesi pada grid hari.
  - **Then**: Browser langsung berpindah ke `/teacher/classes/[classId]/sessions/[date]/attendance?sesi=[jadwalItemId]` tanpa memunculkan dialog/drawer.
- **AC3: Navigasi Langsung Mode Bulanan (Monthly)**
  - **Given**: Guru berada di kalender mode Bulanan.
  - **When**: Guru mengklik chip sesi pada sel tanggal kalender.
  - **Then**: Browser langsung berpindah ke `/teacher/classes/[classId]/sessions/[date]/attendance?sesi=[jadwalItemId]` tanpa memunculkan dialog/drawer.
- **AC4: Navigasi Langsung Mode Agenda Kompak (Agenda)**
  - **Given**: Guru berada di kalender mode Agenda.
  - **When**: Guru mengklik baris sesi.
  - **Then**: Browser langsung berpindah ke `/teacher/classes/[classId]/sessions/[date]/attendance?sesi=[jadwalItemId]` tanpa memunculkan dialog/drawer.
- **AC5: Sesi Dibatalkan Tidak Dapat Diklik**
  - **Given**: Terdapat sesi dengan status `dibatalkan`.
  - **When**: Guru melihat sesi tersebut.
  - **Then**: Sesi ditampilkan dengan gaya coret (`line-through`) dan `cursor-not-allowed` serta tidak melakukan navigasi.
- **AC6: Type Check Lolos**
  - **Given**: Seluruh perubahan selesai.
  - **When**: Menjalankan `npx tsc --noEmit`.
  - **Then**: Kompilasi TypeScript sukses tanpa error (exit code 0).

## 5. Out-of-Scope
- Mengubah logika halaman presensi `/attendance`.
- Menghapus komponen file `calendar-session-drawer.tsx` dari repositori (cukup tidak digunakan di `TeacherCalendarView` untuk meminimalisasi resiko).
