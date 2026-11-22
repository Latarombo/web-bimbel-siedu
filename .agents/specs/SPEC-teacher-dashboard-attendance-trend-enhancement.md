# SPEC: Peningkatan Statistik Tren Hadir 7 Hari & Decommission Distribusi Presensi Siswa

> **Status:** Implemented & Verified  
> **Tanggal:** 2026-11-22  
> **Skills Terkait:** `frontend-design`, `ui-ux-pro-max`, `impeccable`, `spec-driven-development`, `ponytail`  
> **Referensi Standar:** [DESIGN.md](file:///mnt/d/projek_react/PJBL/siedu/.agents/docs/DESIGN.md), [CONSTRAINTS.md](file:///mnt/d/projek_react/PJBL/siedu/CONSTRAINTS.md), [AGENTS.md](file:///mnt/d/projek_react/PJBL/siedu/AGENTS.md).

---

## 1. Objective & User Story

Sebagai seorang Guru di Siedu, saya ingin statistik dashboard fokus pada performa aktivitas mengajar nyata tanpa distraksi statistik donut "Student Attendance Distribution" yang berlebihan, serta menginginkan visualisasi "7-Day Attendance Trend" yang lebih lengkap, akurat, dan kaya informasi (mencakup tingkat kehadiran %, total hadir, rincian izin/sakit/alpa, tooltip komprehensif, dan status kosong yang elegan), sehingga saya dapat memantau tren kehadiran siswa mingguan secara komprehensif dan cepat.

---

## 2. Keputusan Arsitektur & Perubahan UI/UX

1. **Decommission Statistik "Student Attendance Distribution":**
   - Menghapus komponen `RekapPresensiCard` dan data kalkulasi donut presensi dari `src/app/[locale]/(teacher)/teacher/dashboard/page.tsx`.
   - Mengeliminasi query dan data turunan yang tidak lagi dipakai.

2. **Peningkatan Statistik "7-Day Attendance Trend" (`TrenKehadiranCard` & `AktivitasMingguanBar`):**
   - **Header Metrik Terpadu:**
     - Menampilkan judul "7-Day Attendance Trend" dan deskripsi singkat.
     - Menampilkan persentase tingkat kehadiran 7 hari (*7-Day Attendance Rate* %) dengan tipografi besar dan jelas di sudut kanan header.
   - **Stat Strip Ringkasan 7 Hari:**
     - Baris metrik tipografi tenang (kelipatan 8px: `gap-2`, `pt-4`) merangkum:
       - **Hadir:** Jumlah siswa hadir (indikator warna hijau / emerald).
       - **Izin / Sakit:** Jumlah siswa dengan izin atau sakit (indikator warna amber).
       - **Alpa:** Jumlah siswa alpa/tanpa keterangan (indikator warna rose).
       - **Total Presensi:** Total rekapitulasi data 7 hari.
   - **Eliminasi Celah Bawah Inkonsisten pada Chart:**
     - Mengubah margin Recharts dari `bottom: 24` menjadi `bottom: 0`, sehingga label sumbu X duduk tepat dan proporsional di atas padding kartu tanpa menghasilkan ruang kosong berlebih di bagian bawah diagram.
     - Menyusun hirarki kartu secara `justify-between` bertingkat sehingga chart memposisikan dirinya di bagian bawah kartu secara proporsional.
   - **Kaya Data Harian (*Multi-status Awareness*):**
     - Setiap titik hari merekam status lengkap: `hadir`, `izin`, `sakit`, `alpa`, `total`, dan `rate` (tingkat kehadiran per hari).
   - **Tooltip Interaktif Cerdas:**
     - Tooltip menampilkan rincian multi-status lengkap per tanggal (Hadir, Izin, Sakit, Alpa, serta persentase kehadiran hari tersebut).
   - **State Kosong Elegan (*Graceful Empty State*):**
     - Jika belum ada data presensi yang dicatat dalam 7 hari terakhir (`totalPresensi === 0`), tampilkan panel panduan kosong yang tenang dan ramah, bukan diagram bergaris kosong tanpa nilai.

3. **Konsolidasi 3 Kartu Metrik (Decommission Taught Classes):**
   - Menghapus kartu "Kelas Diampu" (*Taught Classes*) sehingga tersisa 3 kartu metrik utama:
     1. **Sesi Hari Ini (`todaySessions`):** Menjadi kartu prioritas operasional harian.
     2. **Total Murid (`totalStudents`):** Menunjukkan jumlah murid aktif yang dibimbing.
     3. **Perlu Dinilai (`needsGrading`):** Menunjukkan antrean penilaian yang perlu ditindaklanjuti.
   - **Height Alignment Sejajar Sisi Kiri:** Menggunakan `items-stretch` pada kontainer hero dan `flex-1` pada masing-masing kartu metrik dengan `gap-4` (16px), sehingga total tinggi 3 kartu metrik presisi sejajar sempurna dengan kartu grafik Tren Kehadiran di sebelah kirinya.
   - **Responsive Layout Mobile (< 1024px):** Kartu prioritas *Sesi Hari Ini* tampil dengan lebar penuh (`col-span-2`), diikuti oleh *Total Murid* dan *Perlu Dinilai* yang berdampingan di bawahnya (`grid-cols-2 gap-4`).
   - **Tipografi Vertikal Terpusat:** Konten di dalam setiap kartu metrik diratakan di tengah vertikal (`justify-center p-4 sm:p-6`) dengan label huruf kapital elegan dan angka metrik tebal (*"KPIs are type, not tiles"*).

4. **Kepatuhan 8-pt Grid & UI Restraint:**
   - Seluruh spasi mematuhi kelipatan 8px (`gap-2`, `gap-4`, `p-4`, `p-6`).
   - Metrik berbasis tipografi murni tanpa ikon dekoratif berlebihan.

---

## 3. Komponen & Data Contracts

### A. Tipe Data `HariAktivitas` di `dashboard-charts.tsx`
```ts
export type HariAktivitas = {
  label: string;
  fullLabel?: string;
  hadir: number;
  izin?: number;
  sakit?: number;
  alpa?: number;
  total?: number;
  rate?: number;
  isToday?: boolean;
  fill?: string;
};
```

### B. Props `TrenKehadiranCardProps`
```ts
export interface TrenKehadiranCardProps {
  aktivitasData: HariAktivitas[];
  title: string;
  subtitle: string;
  rateLabel: string;
  attendanceRate: number;
  totalHadir: number;
  totalIzinSakit: number;
  totalAlpa: number;
  totalPresensi: number;
  emptyTitle: string;
  emptyDesc: string;
}
```

---

## 4. Acceptance Criteria (Given-When-Then)

1. **Scenario: Penghapusan Student Attendance Distribution**
   - **Given** guru membuka halaman dashboard guru `/teacher/dashboard`.
   - **When** halaman dimuat.
   - **Then** kartu "Student Attendance Distribution" (donut chart) sudah tidak lagi tampil di dashboard.
   - **And** tata letak di bawah hero section langsung menampilkan agenda sesi hari ini / antrean penilaian tanpa ruang kosong aneh.

2. **Scenario: Peningkatan 7-Day Attendance Trend**
   - **Given** kartu "7-Day Attendance Trend" di sisi kiri hero section.
   - **When** ada data presensi dalam 7 hari terakhir.
   - **Then** tampil persentase tingkat kehadiran di header, baris ringkasan (Hadir, Izin/Sakit, Alpa, Total), serta grafik batang dengan hari ini tersorot.
   - **And** saat pointer diarahkan ke batang hari, tooltip menampilkan rincian Hadir, Izin, Sakit, Alpa, dan persentase hari tersebut.

3. **Scenario: State Kosong 7-Day Attendance Trend**
   - **Given** guru baru atau belum ada presensi dicatat dalam 7 hari terakhir.
   - **When** halaman dimuat.
   - **Then** kartu menampilkan pesan ramah bahwa belum ada presensi tercatat dalam 7 hari terakhir dengan panduan singkat.

4. **Scenario: Verifikasi Type-Check**
   - **Given** semua perubahan diaplikasikan.
   - **When** dijalankan `npx tsc --noEmit` via PowerShell Windows.
   - **Then** proses selesai dengan kode keluar 0 tanpa error.

---

## 5. Verification Command

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL/siedu'; npx tsc --noEmit" < /dev/null
```
