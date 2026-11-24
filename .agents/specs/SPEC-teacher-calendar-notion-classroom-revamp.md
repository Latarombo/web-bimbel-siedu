# SPEC: Rombak Kalender Mengajar Guru Berbasis Pola Google Classroom (Weekly, Monthly, Agenda)

> **Modul ID:** `teacher-calendar-classroom-revamp`
> **Aktor:** Guru (`teacher`)
> **Status:** Selesai & Terverifikasi (Completed & Verified)
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md) SDD Siklus Kerja, [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../../.agents/docs/DESIGN.md)

---

## 1. Objective & User Story

- **Konteks:**
  Guru menginginkan antarmuka kalender meniru persis tampilan dan alur kerja **Google Classroom Calendar** (`classroom.google.com/calendar`), dengan mempertahankan 3 mode tampilan esensial: **Mingguan (Weekly Schedule)**, **Bulanan (Monthly Grid)**, dan **Agenda Kompak (Schedule/To-Do)**.

- **Tujuan:**
    1. **Google Classroom Header Toolbar & Unified Card:** Toolbar atas khas Google Classroom dengan filter kelas tunggal ("Semua kelas"), tombol navigasi "Hari ini", panah stepper `<` `>`, label rentang tanggal yang tegas, dan toggle mode tampilan (Mingguan, Bulanan, Agenda) disatukan ke dalam **satu kartu kontainer utuh** bersama grid kalender (tidak dipisah card/floating toolbar).
    2. **Classroom Event Cards (Clean Typography Tanpa Pill Jenjang):** Setiap kartu sesi mengadopsi palet warna tematik kelas Google Classroom dengan garis aksen kiri (_left-accent border_), jam sesi tabular yang bersih (tanpa pill badge jenjang terpisah), dan penamaan kelas tipografis yang komprehensif (misal: `Matematika · SD (Kelas 3-4)`), jumlah siswa, serta indikator tugas jika tersedia.
    3. **Slide-Over Detail Drawer (Classroom Style):** Mengklik sesi membuka laci samping kanan via `NativeDialog` tanpa reload, menampilkan detail sesi, progres presensi, jurnal materi/PR, daftar tugas terhubung dengan link ke buku nilai, serta tombol presensi.
    4. **Tiga Mode Tampilan Penuh:**
        - **Mingguan (Weekly):** Kolom 7 hari (Senin s/d Minggu) dengan highlight lingkaran biru pada hari ini.
        - **Bulanan (Monthly):** Kisi 7 kolom dengan chip sesi beraksen warna tema kelas dan penanda tugas (`• T`).
        - **Agenda:** Daftar linier kronologis berbasis tanggal dengan rincian kelas dan tugas.
    5. **Kepatuhan Desain & Kualitas:** Mematuhi seluruh batasan `CONSTRAINTS.md` (Icon Restraint, Anti-Header Pill Clutter, Pemisahan Deskripsi & Counter, Kontras WCAG AA, dan lulus `npx tsc --noEmit`).

- **User Story:**
    - _Sebagai Guru_, saya ingin melihat jadwal mengajar mingguan dan bulanan dalam kanvas yang bersih tanpa terdistraksi kartu metrik berukuran besar.
    - _Sebagai Guru_, saya ingin mengklik sesi mengajar untuk melihat ringkasan materi, presensi, dan tugas kelas di panel samping tanpa harus berpindah halaman.
    - _Sebagai Guru_, saya ingin dapat memfilter sesi berdasarkan jenjang atau status presensi yang belum tuntas dicatat.

---

## 2. Command Verifikasi (Wajib Lolos)

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

_Kriteria: Wajib lulus 100% dengan exit code 0 tanpa error._

---

## 3. Data Contracts & Arsitektur Komponen

### A. Tipe Data Sesi Kalender (`TeacherCalendarSessionItem`)

```typescript
export interface CalendarTugasItem {
    id: number;
    nama: string;
    nilaiMaksimum: number;
    draf: boolean;
}

export interface TeacherCalendarSessionItem {
    kelasId: number;
    sesiPertemuanId?: number;
    jadwalItemId: number;
    tanggalPertemuan: string; // "YYYY-MM-DD"
    jamMulai: string; // "08:00"
    jamSelesai: string; // "09:30"
    kelasNama: string;
    jenjang: string;
    statusSesi: string; // "terjadwal" | "selesai" | "dibatalkan"
    pesertaCount: number;
    presensiCount: number;
    isPast: boolean;
    isToday: boolean;
    catatanMateri?: string | null;
    catatanPr?: string | null;
    tugasList: CalendarTugasItem[];
}
```

### B. Filter State Kalender

- `selectedClassId: number | null` (Semua kelas atau kelas spesifik)
- `selectedJenjang: string | null` (Semua jenjang atau TK / SD / SMP / SMA)
- `selectedStatus: 'all' | 'unrecorded' | 'recorded' | 'today'`
- `viewMode: 'weekly' | 'monthly' | 'agenda'`

### C. Komponen Arsitektur

1. `src/app/[locale]/(teacher)/teacher/calendar/page.tsx`
    - Server Component: Fetch kelas guru, jadwal item, periode, sesi pertemuan, presensi, pendaftaran aktif, dan data tugas (`penilaian`).
    - Menyusun relasi `tugasList` dan materi pertemuan per sesi.
    - Mengirim data bersih ke Client Component tanpa waterfall.
2. `src/components/teacher/calendar/teacher-calendar-view.tsx`
    - Client Component: Mengelola kanvas kalender, compact metric strip, filter bar, mode tampilan (Weekly, Monthly, Agenda), dan slide-over detail drawer.
3. `src/components/teacher/calendar/calendar-session-drawer.tsx`
    - Client Component: Laci samping `NativeDialog` slide-over dari kanan yang menampilkan detail sesi, progres presensi, materi pertemuan, daftar tugas terkait, dan tombol cepat "Catat Presensi" / "Lihat Roster Kelas".

---

## 4. Acceptance Criteria (Given - When - Then)

- **AC 1 (Compact Metric Strip ala Notion):**
    - **Given** guru membuka `/teacher/calendar`.
    - **When** halaman dimuat.
    - **Then** area atas menampilkan header bersih tanpa badge di samping judul (Anti-Header Pill), diikuti _Compact Metric Strip_ horizontal yang menyajikan total sesi, sesi hari ini, sesi belum dicatat, dan sesi selesai dengan tipografi tajam dan ruang vertikal minimal.

- **AC 2 (Notion Database Multi-Filter):**
    - **Given** guru berada di kalender.
    - **When** guru memilih filter Jenjang atau Status Presensi ("Perlu Presensi").
    - **Then** sesi di grid kalender (Weekly, Monthly, Agenda) langsung tersaring secara reaktif tanpa me-reload halaman.

- **AC 3 (Indikator Tugas di Sesi Kalender ala Classroom):**
    - **Given** sesi pertemuan memiliki 1 atau lebih tugas/asesmen terkait.
    - **When** sesi ditampilkan di kalender mingguan/bulanan/agenda.
    - **Then** kartu sesi menyertakan chip/indikator tugas (misal: `1 Tugas`), membedakannya dari sesi biasa.

- **AC 4 (Slide-Over Session Detail Drawer):**
    - **Given** guru mengklik salah satu sesi di kalender.
    - **When** kartu sesi diklik.
    - **Then** panel drawer muncul mulus dari sisi kanan (`NativeDialog` slide-in-from-right) tanpa reload halaman, menampilkan:
        - Info waktu & nama kelas.
        - Status presensi (hadir / belum dicatat).
        - Ringkasan catatan materi/jurnal (jika ada).
        - Daftar tugas terhubung (jika ada) beserta nilai maksimum.
        - Tombol aksi "Catat Presensi" dan "Buka Kelas".
    - **When** guru menekan tombol Esc, backdrop, atau tombol tutup (X).
    - **Then** drawer menutup dengan mulus dan fokus kembali ke kanvas kalender.

- **AC 5 (Zero TypeScript Error & UI Constraint Guardrails):**
    - **When** `npx tsc --noEmit` dijalankan.
    - **Then** lulus 100% tanpa error, tanpa supresi tipe (`@ts-ignore`, `any`), dan mematuhi aturan Icon Restraint.

---

## 5. Out-of-Scope (YAGNI)

1. Drag-and-drop rescheduling sesi di kalender (karena jadwal bimbingan belajar terikat jam master yang diatur admin).
2. Perubahan skema database / migration baru (semua kebutuhan data telah dipenuhi oleh 16 tabel yang ada).
3. Pembuatan tugas langsung di dalam drawer kalender (pembuatan tugas tetap di halaman kelas / nilai untuk menjaga alur kerja konsisten).

---

## 6. Tracer-Bullet Task Breakdown

- [x] **Slice 1: Ekstraksi Data Sesi Lengkap & Relasi Tugas di Server Page (`page.tsx`)**
    - Ambil data `Penilaian` kelas guru dan kaitkan ke `allSessions`.
    - Sertakan `catatanMateri`, `catatanPr`, dan `tugasList` pada setiap item sesi.
- [x] **Slice 2: Pembuatan Slide-Over Session Drawer (`calendar-session-drawer.tsx`)**
    - Buat komponen drawer menggunakan `NativeDialog` slide-over kanan.
    - Tampilkan rincian sesi: badge jenjang, jam pertemuan, status kehadiran, materi pembelajaran, dan daftar tugas.
    - Sediakan tombol CTA "Catat Presensi" dan "Roster Kelas".
- [x] **Slice 3: Perombakan Kanvas Kalender (`teacher-calendar-view.tsx`)**
    - Implementasikan _Compact Metric Strip_ ala Notion di atas toolbar.
    - Tambahkan filter Jenjang dan Status Presensi ala properti database Notion.
    - Tambahkan penanda tugas di kartu sesi (Weekly, Monthly, Agenda).
    - Hubungkan klik kartu sesi ke pembukaan Session Drawer.
- [x] **Slice 4: Audit Visual & Verifikasi Interop**
    - Verifikasi kepatuhan terhadap `DESIGN.md` dan `CONSTRAINTS.md`.
    - Jalankan `npx tsc --noEmit` via PowerShell Windows hingga lulus 0 error.
- [x] **Slice 5: Integrasi Kisi Kalender ke Detail Kelas (`/teacher/classes/[classId]`)**
    - Pasang komponen `TeacherCalendarView` pada tab **"Jadwal & Sesi"** (`activeTab === "schedule"`).
    - Konfigurasi properti: `hideClassFilter={true}`, `allowedViews={['daily', 'weekly', 'monthly']}`, `defaultView="weekly"`.
    - Server Page (`page.tsx`) menghitung seluruh sesi kelas menggunakan `rencanakanSesi` pada rentang periode dan memetakan `calendarSessions`.
    - Hapus ikon dekoratif dari tombol segmen tampilan untuk mematuhi aturan _Icon Restraint_.
    - Verifikasi ketat `npx tsc --noEmit` lulus 0 error.
- [x] **Slice 6: Penyelarasan Desain Tampilan Harian Menjadi Agenda Kompak**
    - Mengubah tampilan mode "Harian" (`viewMode === 'daily'`) agar mengadopsi format scannable rows agenda kompak.
    - Menyertakan _Date Header Ribbon_ (`Hari, Tanggal Bulan Tahun` + badge `HARI INI`), baris sesi bergaris aksen kiri jenjang kelas, waktu sesi, nama kelas tipografis (tanpa pill), indikator tugas, dan status presensi.
    - Lulus verifikasi `npx tsc --noEmit` dengan 0 error.
- [x] **Slice 7: Pill Mode Tampilan Inset/Sunken & Perbaikan Dropdown Tambah Status**
    - Mengubah segmented control tabs kalender (_Harian_, _Kisi Mingguan_, _Kisi Bulanan_, _Agenda Kompak_) agar lebih tidak rounded (`rounded-lg` track dan `rounded-md` pill) dengan efek lekukan masuk ke dalam (_inset shadow_ `shadow-[inset_0_1.5px_3px_...]`).
    - Menyelaraskan menu dropdown Tambah Status agar teks dan icon rata kiri (`justify-start`, `gap-2.5`) dengan warna netral (`text-slate-500` / `text-slate-400`).
    - Lulus verifikasi `npx tsc --noEmit` dengan 0 error.
