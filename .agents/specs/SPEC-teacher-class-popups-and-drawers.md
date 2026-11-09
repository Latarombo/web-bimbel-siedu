# SPEC: Teacher Class Detail - Modals & Slide-over Drawers (Stripe, Linear, & SpeedGrader Benchmark)

## 1. Objective & User Story
Sebagai guru pengampu kelas, saya ingin menyelesaikan mutasi dan aksi cepat harian (ekspor berkas, input nilai murid secara berurutan, dan pembuatan draf tugas) langsung dari halaman detail kelas (`/teacher/classes/[classId]`) menggunakan modal popup dan slide-over drawer tanpa terlempar keluar halaman atau kehilangan konteks tabel, dengan mengadopsi standar UX kelas dunia (Stripe, Linear, dan Google Classroom SpeedGrader).

---

## 2. Command Verifikasi
Verifikasi TypeScript wajib exit code 0 tanpa error:
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Component Signatures

### A. Modal Ekspor Data (`ExportClassModal`)
```typescript
interface ExportClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
}
type ExportType = "summary" | "attendance" | "grades";
```

### B. Slide-over Drawer Input Nilai (`QuickGradeDrawer`)
```typescript
interface QuickGradeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRosterItem | null;
  studentIndex: number;
  totalStudents: number;
  onNextStudent: () => void;
  onPrevStudent: () => void;
  classId: number;
  onSavedSuccess?: (pendaftaranId: number, nilai: number | null, catatan: string | null) => void;
}
```

### C. Modal Buat Tugas Cepat (`QuickAssessmentModal`)
```typescript
interface QuickAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  onSuccess: (newAssessmentId?: number) => void;
}
```

---

## 4. Acceptance Criteria (Given-When-Then)

### AC1: Modal Ekspor Data Terpadu (Stripe Table Export Pattern)
- **Given** guru berada di halaman detail kelas.
- **When** guru mengklik tombol `Ekspor` di area header atas (atau shortcut di Tab 4).
- **Then**:
  - Modal dialog terpusat (`max-w-md`) muncul dengan transisi halus dan backdrop blur.
  - Menampilkan 3 pilihan berkas dalam radio card yang jelas:
    1. *Rekap Ringkasan Siswa (CSV)*: Statistik rerata nilai, kehadiran, dan kuota.
    2. *Rekap Riwayat Presensi (CSV)*: Log kehadiran harian setiap pertemuan & status.
    3. *Rekap Nilai & Asesmen (CSV)*: Log seluruh nilai tugas & progres murid.
  - Tombol aksi utama "Unduh Berkas (.csv)" men-download file dari `/api/export/class/[classId]?type={selectedType}`.
  - Tombol sekunder "Batal" dan tombol Esc menutup modal.

### AC2: Slide-over Drawer Input Nilai Siswa (Google Classroom SpeedGrader Pattern)
- **Given** guru berada di Tab `Roster Siswa`.
- **When** guru mengklik tombol `Input Nilai` pada salah satu baris murid.
- **Then**:
  - Slide-over panel muncul dari sisi kanan layar (`max-w-md`) tanpa memblokir pandangan tabel secara total.
  - Header drawer memuat identitas murid, status registrasi, serta tombol navigasi cepat murid sebelumnya (`<`) dan berikutnya (`>`) beserta indikator `Siswa X dari Y`.
  - Formulir memuat:
    - Input Tanggal Penilaian (default tanggal hari ini).
    - Input Nilai Angka (0-100) dengan tipografi tabular tebal.
    - Textarea Catatan Umpan Balik / Progres.
  - Tombol "Simpan Nilai" memanggil server action `saveNilai`, menampilkan status loading dan notifikasi sukses.
  - Tautan teks sekunder *"Buka Riwayat Lengkap & Rapor"* mengarah ke `/teacher/grades/[enrollmentId]` bagi guru yang membutuhkan riwayat mendalam.
  - Drawer dapat ditutup dengan tombol silang (X), klik backdrop luar, atau menekan tombol `Esc`.

### AC3: Modal Buat Tugas Cepat (Linear Create Issue Pattern)
- **Given** guru mengklik tombol `Buat Tugas` di header atau di Tab `Tugas & Asesmen`.
- **When** modal terbuka:
  - Muncul modal dialog terpusat (`max-w-lg`).
  - Formulir mencakup:
    - Nama Tugas / Asesmen (Wajib, misal: "Ulangan Harian Bab 3").
    - Tanggal Pelaksanaan (Wajib, default hari ini).
    - Nilai Maksimum (Default 100).
    - Status Publikasi (Opsi Draf atau Terbit Langsung).
  - Saat disimpan, memanggil server action `savePenilaianBatch`.
  - Jika berhasil, modal otomatis tertutup, tab otomatis berpindah ke `Tugas & Asesmen`, dan tugas baru segera tampil di daftar.

### AC4: Aksesibilitas, Fokus, dan Responsif
- **Given** seluruh modal dan drawer.
- **When** berinteraksi:
  - Mendukung navigasi keyboard: tombol `Esc` menutup overlay, fokus tertahan di dalam modal/drawer (focus trap), dan focus ring terlihat jelas (`focus-visible`).
  - Responsif: Pada layar mobile (< 640px), drawer dan modal menyesuaikan lebar layar secara penuh (full-width bottom-sheet / modal) dengan aman.
  - Scroll lock aktif pada elemen `body` saat overlay terbuka untuk mencegah scroll ganda (*scroll bleed*).

### AC5: Kepatuhan Standar Kualitas (Quality Constraints)
- **Given** aturan di `AGENTS.md` dan `CONSTRAINTS.md`.
- **Then**:
  - Tidak ada ikon dekoratif pada tombol teks.
  - Ikon hanya pada tombol mandiri (X close, < > chevron) dengan atribut `aria-label`.
  - Zero TypeScript error (`npx tsc --noEmit` lolos hijau).
  - Tidak ada supresi tipe `@ts-ignore` / `@ts-expect-error` / `as any`.

---

## 5. Out-of-Scope
- Pencatatan presensi massal tetap berada pada rute penuh `/attendance`.
- Official Report Card dan Sertifikat tetap pada rute dokumen cetak resmi.
