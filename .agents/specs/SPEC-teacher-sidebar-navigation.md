# SPEC: Perbaikan Navigasi Sidebar Portal Guru Siedu

> **Modul ID:** `teacher-sidebar-navigation`  
> **Aktor:** Guru (`role: guru`)  
> **Status:** Specify (Phase 1 SDD — Awaiting Human Approval)  
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md).

---

## 1. Objective & User Story

### Konteks & Masalah
1. **Mislabeling Fitur:** Rute `/teacher/status` di sidebar guru saat ini diberi label *"Jurnal"*, padahal fitur tersebut adalah **Status Pembelajaran** (dokumentasi foto kamera & kabar belajar ke orang tua murid ala WhatsApp Status). Sedangkan Jurnal Pembelajaran sejati adalah catatan materi teks per sesi pertemuan di dalam kelas.
2. **Menu Usang Pasca Pencabutan Batas 7 Hari:** Menu *"Koreksi"* (`/teacher/corrections`) masih ada di navigasi utama, padahal batas penguncian 7 hari presensi telah dicabut tuntas sehingga guru tidak lagi memerlukan alur permohonan koreksi lama ke admin.
3. **Integrasi Modul Nilai & Rapor:** Penambahan modul Rapor Siswa Semester (`/teacher/classes/[classId]/reports`) perlu diposisikan secara terpadu di bawah menu *"Nilai & Rapor"* tanpa membuat sidebar sesak atau terfragmentasi.

### User Story
*Sebagai Guru*, saya ingin memiliki susunan menu navigasi sidebar yang akurat, ringkas, dan jelas representasinya, sehingga saya dapat dengan cepat berpindah antara melihat jadwal hari ini, mengelola kelas, memantau kalender sesi, merekap nilai & rapor, serta membagikan status dokumentasi foto belajar kepada orang tua murid.

---

## 2. Commands Verifikasi

```bash
# Verifikasi kompilasi TypeScript (Wajib 0 error)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null

# Verifikasi linter
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run lint" < /dev/null
```

---

## 3. Project Structure

File yang terdampak dalam spesifikasi ini:
```
src/
├── components/
│   └── teacher/
│       └── teacher-sidebar.tsx       → Struktur item navigasi, icon, dan section rendering
├── i18n/
│   └── messages/
│       ├── id/
│       │   └── teacher.json          → Label Bahasa Indonesia (navClasses, navGrades, navStatus)
│       └── en/
│           └── teacher.json          → Label Bahasa Inggris sinkron
```

---

## 4. Code Style & Specification

### A. Susunan Item Navigasi Sidebar (5 Menu Inti)
| # | Menu ID | Nama Menu (ID / EN) | Route | Icon (lucide-react) | Keterangan |
|---|---|---|---|---|---|
| 1 | `dashboard` | Dashboard / Dashboard | `/teacher/dashboard` | `LayoutGrid` | Ringkasan jadwal harian, metrik kelas aktif & KPI |
| 2 | `classes` | Kelas Saya / My Classes | `/teacher/classes` | `BookOpen` | Daftar kelas yang diampu, roster murid, jurnal sesi & rapor |
| 3 | `schedule` | Jadwal Mengajar / Teaching Schedule | `/teacher/calendar` | `Calendar` | Kalender agenda belajar mengajar mingguan/bulanan |
| 4 | `grades` | Nilai & Rapor / Grades & Reports | `/teacher/grades` | `Award` | Hub penilaian tugas & rekapitulasi rapor semester |
| 5 | `status` | Status Pembelajaran / Learning Status | `/teacher/status` | `Camera` | Dokumentasi foto (kamera/galeri) & kabar kegiatan belajar |

*Catatan: Profil Guru, saklar tema gelap/terang, dan tombol keluar tetap bertempat di bagian footer bawah sidebar.*

### B. Pola Komponen & Kepatuhan Desain (`teacher-sidebar.tsx`)
```tsx
// Contoh cuplikan konfigurasi 5 item navigasi
const NAV_ITEMS: NavItemDef[] = [
  {
    id: 'dashboard',
    name: t('navDashboard') || 'Dashboard',
    href: '/teacher/dashboard',
    icon: LayoutGrid,
  },
  {
    id: 'classes',
    name: t('navClasses') || 'Kelas Saya',
    href: '/teacher/classes',
    icon: BookOpen,
  },
  {
    id: 'schedule',
    name: t('navSchedule') || 'Jadwal Mengajar',
    href: '/teacher/calendar',
    icon: Calendar,
  },
  {
    id: 'grades',
    name: t('navGrades') || 'Nilai & Rapor',
    href: '/teacher/grades',
    icon: Award,
  },
  {
    id: 'status',
    name: t('navStatus') || 'Status Pembelajaran',
    href: '/teacher/status',
    icon: Camera,
  },
];
```

---

## 5. Testing Strategy
1. **Pemeriksaan Link & Rute Aktif:** Memastikan state aktif (`isRouteActive`) menyala tepat pada menu yang sesuai (misal: `/teacher/classes/[classId]` tetap mengaktifkan menu *"Kelas Saya"*, `/teacher/status` mengaktifkan *"Status Pembelajaran"*).
2. **Kesesuaian Tampilan Collapsed & Drawer Mobile:**
   - Mode desktop ciut (*collapsed*): Ikon menampilkan tooltip nama menu yang sesuai saat di-hover.
   - Mode mobile (*drawer*): Drawer menutup otomatis ketika salah satu item navigasi diklik.
3. **Kompilasi TypeScript:** `npx tsc --noEmit` wajib lulus bersih tanpa error tipe.

---

## 6. Boundaries

- **Always:**
  - Pertahankan token warna netral dan styling rounded-lg sesuai standar [`DESIGN.md`](../docs/DESIGN.md).
  - Sediakan padanan terjemahan pada `src/i18n/messages/id/teacher.json` dan `en/teacher.json` agar locale EN tidak rusak.
  - Jalankan `npx tsc --noEmit` via PowerShell Windows sebelum menyelesaikan tugas.
- **Ask first:**
  - Menambah rute baru di luar rute yang sudah terdaftar.
  - Mengubah struktur layout umum di luar komponen sidebar.
- **Never:**
  - Mengembalikan label "Jurnal" untuk `/teacher/status`.
  - Menambahkan badge atau pill angka statis dekoratif di sidebar (melanggar [`CONSTRAINTS.md`](../../CONSTRAINTS.md)).

---

## 7. Success Criteria

1. Menu `/teacher/status` berlabel resmi **"Status Pembelajaran"** (ID) / **"Learning Status"** (EN) dengan ikon `Camera`.
2. Menu *"Koreksi"* (`/teacher/corrections`) tidak lagi tampil di navigasi utama sidebar guru.
3. Menu Nilai diperbarui menjadi **"Nilai & Rapor"** (`/teacher/grades`) dengan ikon `Award`.
4. Seluruh 5 menu memiliki indikator rute aktif yang tepat baik di desktop maupun mobile drawer.
5. `npx tsc --noEmit` lolos 100% tanpa error.

---

## 8. Open Questions

*(Tidak ada pertanyaan terbuka. Seluruh keputusan desain telah disepakati pada proses wawancara/grill).*
