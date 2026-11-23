# SPEC: Redesain Tabel Roster Siswa di Detail Kelas (`/teacher/classes/[classId]`)

> **Status:** Approved (via interactive grill)  
> **Tanggal:** 2026-11-22  
> **Author:** Antigravity  
> **Skills Terkait:** `spec-driven-development`, `modern-web-guidance`, `web-design-guidelines`, `frontend-design`, `ui-ux-pro-max`

---

## 1. Objective & User Story
Sebagai guru pengampu kelas bimbingan di halaman detail rombel (`/teacher/classes/[classId]`), saya ingin tabel roster siswa:
1. Memiliki kolom aksi ringkas berbasis kombinasi ikon mandiri (`[Eye]` untuk Rincian Siswa, `[Pencil]` untuk Input Nilai Cepat Drawer, dan `[MoreVertical]` untuk menu opsi tambahan) sehingga tidak memboroskan ruang horizontal desktop.
2. Kolom data kehadiran tersaji padat (`Sesi Hadir` & `Persentase` terpadu: `10/12 (83%)`) dengan avatar inisial nama siswa.
3. Mendukung pengurutan (*client-side sorting*) berdasarkan Nama, Kehadiran, Jumlah Tugas, dan Nilai Rata-rata.
4. Tampilan mobile (< md) tetap mempertahankan tombol teks ergonomis ramah jempol di bagian bawah kartu dengan tombol menu `[MoreVertical]` di sudut kanan atas kartu.
5. Mematuhi standar aksesibilitas (*WCAG AA*, `aria-label` kontekstual per murid, `aria-hidden="true"` pada SVG ikon, `aria-sort` pada header).

---

## 2. Command Verifikasi
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```
Toleransi error TypeScript: **0**.

---

## 3. Data Contracts & UI Architecture

### A. State Sorting
```typescript
type SortKey = "nama" | "kehadiran" | "tugas" | "nilai";
type SortDir = "asc" | "desc";
interface RosterSortState {
  key: SortKey;
  dir: SortDir;
}
```

### B. Kombinasi Kolom Aksi Desktop
1. `Link` (`/teacher/grades/${s.id}`):
   - Ikon: `Eye` (16px)
   - Ukuran: `size-8` (`rounded-lg`, hover `bg-slate-100 dark:bg-slate-800`)
   - Aksesibilitas: `aria-label={`Rincian capaian belajar ${s.nama}`}`, `title="Rincian Siswa"`.
2. `button` (memicu `setGradingStudentId(s.id)`):
   - Ikon: `Pencil` (16px)
   - Ukuran: `size-8` (`rounded-lg`, hover `bg-blue-50 dark:bg-blue-950/40 hover:text-blue-600`)
   - Aksesibilitas: `aria-label={`Input nilai cepat untuk ${s.nama}`}`, `title="Input Nilai Cepat"`.
3. `DropdownMenuTrigger` (`MoreVertical`):
   - Ikon: `MoreVertical` (16px)
   - Ukuran: `size-8` (`rounded-lg`)
   - Aksesibilitas: `aria-label={`Menu aksi lainnya untuk ${s.nama}`}`, `title="Aksi Lainnya"`.
   - Menu items:
     - `Riwayat Presensi` ➔ `/teacher/corrections?entitas=siswa&id=${s.id}`
     - `Rekap Nilai Lengkap` ➔ `/teacher/grades/${s.id}`

### C. Pemadatan Kolom Data
- **Kolom Siswa:** Avatar inisial (`size-7` rounded-full) + nama tebal truncate.
- **Kolom Kehadiran:** Rata kanan, `tabular-nums`, format: `${s.hadir}/${s.tercatat}` + `(${pct}%)`.
- **Kolom Tugas Dinilai:** Rata kanan, `tabular-nums`, format: `${s.nNilai} tugas`.
- **Kolom Nilai Rata-rata:** Rata kanan, `tabular-nums font-semibold`.

---

## 4. Acceptance Criteria (Given-When-Then)

1. **Kolom Aksi Ikon Mandiri:**
   - **Given** guru membuka detail kelas di desktop,
   - **When** melihat kolom Aksi pada baris siswa,
   - **Then** guru melihat 3 tombol ikon rapi: `[Eye]`, `[Pencil]`, dan `[MoreVertical]`,
   - **And** saat di-hover/focus kursor, muncul visual feedback kontur halus dan tooltip penjelas.
2. **Aksesibilitas Screen Reader:**
   - **Given** pengguna menavigasi tabel dengan teknologi asistif atau keyboard tab,
   - **When** fokus berada pada tombol ikon,
   - **Then** pembaca layar membacakan aksi spesifik beserta nama siswa (bukan teks generik).
3. **Pengurutan Kolom (Sorting):**
   - **Given** guru berada di tab Roster,
   - **When** guru mengklik header kolom "Nilai Rata-rata" atau "Kehadiran",
   - **Then** baris siswa terurut menaik (*ascending*), dan klik kedua membalik menjadi menurun (*descending*), disertai atribut `aria-sort`.
4. **Ergonomi Layar Mobile (< md):**
   - **Given** guru membuka detail kelas dari ponsel,
   - **When** melihat kartu murid,
   - **Then** kartu menampilkan menu `[MoreVertical]` di sudut kanan atas kartu, metrik 2 kolom di tengah, dan dua tombol teks lebar `[Rincian Siswa]` & `[Input Nilai]` di bawah kartu.

---

## 5. Out-of-Scope
- Perubahan pada modal export atau drawer quick assessment.
- Pagination server-side (tetap menggunakan pagination client-side per 10 siswa yang sudah ada).
