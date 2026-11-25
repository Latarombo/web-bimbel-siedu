# Spesifikasi: Kolom Pertemuan, Filter Sesi & Kelengkapan Nilai, dan Icon Action Nilai Siswa

## 1. Objective & User Story
Sebagai guru yang mengelola kelas di halaman detail kelas (`/teacher/classes/[classId]`), pada tab **Tugas & Asesmen**, saya ingin:
1. Melihat kolom **Pertemuan** pada tabel desktop sehingga dapat mengetahui keterkaitan setiap tugas dengan sesi pertemuan kelas secara instan.
2. Menyaring tugas berdasarkan **Pertemuan** (Semua Pertemuan / Sesi Terpilih / Tanpa Sesi).
3. Menyaring tugas berdasarkan **Kelengkapan Nilai** (Semua / Sudah Lengkap / Belum Lengkap) untuk membedakan tugas yang seluruh siswanya telah dinilai dengan tugas yang masih memerlukan input nilai.
4. Tombol aksi **Nilai Siswa** disajikan sebagai tombol ikon mandiri (*icon-only button*) yang seragam dengan tombol *Ubah* dan *Hapus*, dilengkapi aksesibilitas `aria-label` dan tooltip `title`.

## 2. Kontrak Data & State Management
Pada `src/components/teacher/classes/class-detail-view.tsx`:
- **State Baru:**
  - `assessmentSessionFilter`: `string` (default: `"all"`, nilai: `"all" | "none" | "${sesiId}"`)
  - `assessmentCompletionFilter`: `"all" | "lengkap" | "belum"` (default: `"all"`)
- **Penyaringan `filteredAssessments`:**
  - `matchSession`:
    - `"all"`: lolos semua.
    - `"none"`: `a.sesiPertemuanId == null`.
    - `sesiId`: `String(a.sesiPertemuanId) === assessmentSessionFilter`.
  - `matchCompletion`:
    - `"all"`: lolos semua.
    - `"lengkap"`: `a.countBelum === 0 && a.countDinilai > 0`.
    - `"belum"`: `a.countBelum > 0 || a.countDinilai === 0`.
- **Reset Paginasi:** Setiap perubahan `assessmentSessionFilter` atau `assessmentCompletionFilter` memanggil `setAssessmentPage(1)`.

## 3. UI/UX Changes
1. **Toolbar Tab Tugas & Asesmen:**
   - Input Cari Nama Tugas.
   - FilterDropdown Status Tugas (Semua Status / Terbit / Draf).
   - FilterDropdown Pertemuan (Semua Pertemuan / Pertemuan #1 / ... / Tanpa Pertemuan).
   - FilterDropdown Kelengkapan Nilai (Semua Progres / Sudah Lengkap / Belum Lengkap).
   - Tombol "Reset Filter" jika ada filter aktif yang menghasilkan 0 data.
2. **Struktur Kolom Tabel Desktop:**
   - `No` (w-12, sticky left 0)
   - `Nama Tugas` (sticky left 12)
   - `Pertemuan` (tengah/kiri: teks `Pertemuan #N` dengan title tanggal & jam sesi, atau `-` jika mandiri)
   - `Tanggal` (text-right)
   - `Siswa Dinilai` (text-right)
   - `Status` (text-center: Terbit / Draf)
   - `Aksi` (sticky right 0: 3 tombol ikon seragam: `Pencil`, `ClipboardCheck`, `Trash2`)
3. **Tombol Aksi Nilai Siswa:**
   - Menggunakan ikon `ClipboardCheck` (`size-3.5`).
   - Ukuran wrapper seragam dengan tombol Pencil (`p-2`, rounded-lg, border border-slate-200).
   - Atribut aksesibilitas: `title="Nilai Siswa"` dan `aria-label="Nilai siswa untuk tugas [Nama Tugas]"`.

## 4. Acceptance Criteria
- [x] **AC-1:** Tabel Tugas & Asesmen memiliki kolom "Pertemuan".
- [x] **AC-2:** Filter pertemuan bekerja secara reaktif dan memfilter tugas yang terkait dengan sesi atau tugas mandiri.
- [x] **AC-3:** Filter kelengkapan nilai bekerja menyaring tugas yang sudah 100% dinilai vs yang masih memiliki siswa belum dinilai.
- [x] **AC-4:** Tombol aksi "Nilai Siswa" berbentuk icon-only button menggunakan icon `ClipboardCheck` dengan aksesibilitas lengkap.
- [x] **AC-5:** Seluruh filter terintegrasi dengan paginasi (halaman kembali ke 1 saat filter berubah).
- [x] **AC-6:** Verifikasi tipe TypeScript (`npx tsc --noEmit`) bersih dari error.
