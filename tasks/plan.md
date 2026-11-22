# Implementation Plan: Penyederhanaan & Konsolidasi Alur Nilai

> **Spec Reference:** [`.agents/specs/SPEC-penyederhanaan-dan-konsolidasi-alur-nilai.md`](../.agents/specs/SPEC-penyederhanaan-dan-konsolidasi-alur-nilai.md)  
> **Status:** Active Execution  

---

## 1. Major Components & Dependencies

```
[1. Data Migration Script]
       │
       ▼
[2. Server Actions Refactor (teacher.ts & admin.ts)]
       │
       ├───────────────────────────────┐
       ▼                               ▼
[3. Teacher Portal UI]        [4. Parent Portal UI & Lib Sync]
- QuickGradeDrawer             - lib/orang-tua-dashboard.ts
- teacher-grades-view          - NilaiTrendChart (Skala 100)
- teacher/grades/[enrollmentId] - schedule-attendance?tab=nilai
       │                               │
       └───────────────┬───────────────┘
                       ▼
       [5. Verification & Typecheck Gate]
       (powershell npx tsc --noEmit)
```

---

## 2. Implementation Order

1. **Migration & Data Layer:**
   - Script untuk migrasi aman catatan `NilaiProgres` yang ada ke `Penilaian` & `HasilPenilaian`.
   - Update `src/app/actions/teacher.ts`: tambah `saveSingleStudentGrade`, sesuaikan `saveNilai`, sederhanakan `ajukanKoreksi` (khusus presensi).
   - Update `src/app/actions/admin.ts`: sederhanakan `prosesKoreksi` (khusus presensi).
2. **Portal Guru UI:**
   - Update `src/components/teacher/classes/quick-grade-drawer.tsx`: sambungkan ke daftar `Penilaian` kelas & `saveSingleStudentGrade`.
   - Update `src/app/[locale]/(teacher)/teacher/classes/[classId]/page.tsx` & `class-detail-view.tsx`: teruskan data penilaian kelas ke drawer.
   - Update `src/app/[locale]/(teacher)/teacher/grades/[enrollmentId]/page.tsx`: sederhanakan tampilan riwayat ke `HasilPenilaian` tanpa dualitas tab legacy.
   - Update `src/components/teacher/grades/teacher-grades-view.tsx` & `/teacher/grades/page.tsx`: hitung rata-rata murid murni dari `HasilPenilaian` (mengecualikan `tidak_ikut`).
3. **Portal Orang Tua & Library Sync:**
   - Update `src/lib/orang-tua-dashboard.ts`: ganti pembacaan `NilaiProgres` dengan `HasilPenilaian` (diterbitkan & normalisasi skala 100).
   - Update `src/components/parent/nilai-trend-chart.tsx`: pastikan visualisasi skala 100 rapi.
   - Update `src/app/[locale]/(parent)/schedule-attendance/page.tsx`: pastikan sinkron dengan data yang sama.
4. **Verifikasi & Audit:**
   - Verifikasi ketat `npx tsc --noEmit` via PowerShell Windows.
   - Uji alur input nilai guru & tampilan orang tua.
