# Spec: Teacher Class Detail Attendance Navigation

- **Status**: Draft
- **Target**: `src/components/teacher/classes/class-detail-view.tsx`, `src/app/[locale]/(teacher)/teacher/classes/[classId]/page.tsx`
- **Related Skills**: `frontend-design`, `ui-ux-pro-max`, `impeccable`

---

## 1. Objective & User Story

### Objective
Menambahkan navigasi presensi yang komprehensif pada halaman detail kelas (`/teacher/classes/[classId]`), mencakup:
1. **Tab Baru "Presensi"** di dalam baris `UnderlineTabs` bersanding dengan *Roster Siswa*, *Jadwal & Sesi*, dan *Tugas & Asesmen*.
2. **Tombol Dropdown Presensi di Header Aksi** dengan 2 pilihan akses cepat:
   - *Isi Presensi Sesi Terdekat* (langsung membuka form presensi sesi aktif/terdekat).
   - *Lihat Rekap Presensi* (membuka matriks kehadiran komprehensif di `/teacher/attendance?classId=[id]`).
3. **Tampilan Tab Presensi** yang memuat daftar sesi pertemuan kelas beserta status pencatatan kehadiran (jumlah hadir, belum presensi) dan tombol aksi cepat untuk mengisi presensi per sesi.

### User Story
- **Sebagai Guru**, saat membuka detail kelas (misal `/teacher/classes/44`), saya ingin dapat dengan cepat mengakses dan mengisi presensi siswa melalui tombol aksi di header maupun tab presensi khusus tanpa harus berpindah-pindah antar menu kalender.

---

## 2. Command Verifikasi

Sesuai aturan Windows/WSL di `AGENTS.md`:
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Interfaces

### 3.1 UnderlineTabs Definition
```typescript
type TabId = "roster" | "schedule" | "attendance" | "assessments" | "summary";
```

### 3.2 Dropdown Actions Menu
- Option 1: `Isi Presensi Sesi Terdekat` -> `/teacher/classes/${classId}/sessions/${targetDate}/attendance?sesi=${targetSlot}`
- Option 2: `Lihat Rekap Presensi` -> `/teacher/attendance?classId=${classId}`

---

## 4. Acceptance Criteria (Given-When-Then)

### Skenario 1: Tab Presensi di Navigasi Kelas
- **Given** guru membuka halaman `/teacher/classes/44`.
- **When** melihat bar navigasi tab horizontal (`UnderlineTabs`).
- **Then** terdapat tab `"Presensi"` di antara `"Jadwal & Sesi"` dan `"Tugas & Asesmen"`.
- **When** guru mengklik tab `"Presensi"`.
- **Then** konten tab menampilkan daftar sesi pertemuan kelas dengan status presensi (sudah terisi atau belum presensi) serta tombol link langsung ke form presensi sesi.

### Skenario 2: Tombol Dropdown Presensi di Header
- **Given** guru berada di halaman detail kelas.
- **When** melihat baris aksi header atas (di samping tombol "Bagikan Status" dan "Buat Tugas").
- **Then** terdapat tombol aksi `"Presensi"` dengan ikon dropdown.
- **When** tombol diklik.
- **Then** muncul 2 opsi pilihan:
  1. *Isi Presensi Sesi Terdekat*: Mengarahkan langsung ke halaman form presensi sesi tanggal terdekat.
  2. *Lihat Rekap Presensi*: Mengarahkan ke halaman rekap kehadiran (`/teacher/attendance`).

---

## 5. Out-of-Scope (YAGNI)
- Penambahan backend endpoint baru (semua route dan helper presensi sudah tersedia di platform).
