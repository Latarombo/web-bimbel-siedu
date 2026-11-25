# Spec: Perbaikan Filter Status "Sesi Terjadwal" pada Detail Kelas

## 1. Objective & User Story
Sebagai guru yang melihat tab "Jadwal & Sesi Pertemuan" pada halaman detail kelas (`/teacher/classes/[classId]`), saya ingin filter "Sesi Terjadwal" hanya menampilkan sesi yang berstatus terjadwal dan **belum** selesai / belum diisi presensi, sehingga sesi yang sudah selesai atau sudah terisi presensi tidak muncul ganda di filter "Sesi Terjadwal" maupun filter "Selesai / Terisi".

## 2. Command Verifikasi
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

## 3. Root Cause Analysis
- Pada database, field `statusSesi` pada tabel `SesiPertemuan` memiliki nilai bawaan `"terjadwal"`.
- Ketika guru mengisi presensi atau sesi selesai, presensi dicatat (`presensiCount > 0`), namun nilai `statusSesi` tidak otomatis berubah di level baris atau sesi rencana.
- Logika sebelumnya pada `class-detail-view.tsx`:
  - Filter `"selesai"` mengecek: `s.statusSesi === "selesai" || (s.presensiCount > 0 && s.statusSesi !== "dibatalkan")`.
  - Filter `"terjadwal"` hanya mengecek: `s.statusSesi === "terjadwal"`.
- Akibatnya, sesi yang sudah selesai / terisi presensi masih memiliki `s.statusSesi === "terjadwal"`, sehingga **tetap lolos** saat filter "Sesi Terjadwal" aktif.

## 4. Acceptance Criteria
- [x] **Given** guru memilih filter "Sesi Terjadwal" (`scheduleStatusFilter === "terjadwal"`), **When** sesi pertemuan telah memiliki data presensi (`presensiCount > 0`) atau berstatus selesai (`statusSesi === "selesai"`), **Then** sesi tersebut tidak ditampilkan di kalender/jadwal.
- [x] **Given** guru memilih filter "Selesai / Terisi" (`scheduleStatusFilter === "selesai"`), **When** sesi pertemuan telah diisi presensi (`presensiCount > 0`) atau berstatus selesai dan tidak dibatalkan, **Then** sesi tersebut ditampilkan.
- [x] **Given** sesi yang dibatalkan (`statusSesi === "dibatalkan"`), **Then** sesi tersebut tidak muncul di filter "Sesi Terjadwal" maupun "Selesai / Terisi".
- [x] Filter status menjadi saling konsisten dan *mutually exclusive* antara "Sesi Terjadwal" dan "Selesai / Terisi".

## 5. Implementation Plan
- Perbarui useMemo `filteredCalendarSessions` pada `src/components/teacher/classes/class-detail-view.tsx`:
  ```tsx
  const filteredCalendarSessions = useMemo(() => {
    return calendarSessions.filter((s) => {
      const isCompleted =
        s.statusSesi === "selesai" ||
        (s.presensiCount > 0 && s.statusSesi !== "dibatalkan");
      const isCancelled = s.statusSesi === "dibatalkan";

      if (scheduleStatusFilter === "all") return true;
      if (scheduleStatusFilter === "terjadwal") {
        return s.statusSesi === "terjadwal" && !isCompleted && !isCancelled;
      }
      if (scheduleStatusFilter === "selesai") return isCompleted;
      if (scheduleStatusFilter === "belum_presensi") {
        return s.presensiCount === 0 && !isCancelled;
      }
      if (scheduleStatusFilter === "dibatalkan") return isCancelled;
      return true;
    });
  }, [calendarSessions, scheduleStatusFilter]);
  ```
