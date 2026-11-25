# Spec: Penghapusan Aturan & Pembatasan 7 Hari pada Presensi Guru

## 1. Objective & User Story
Sebagai Guru, saya ingin dapat mencatat dan menyunting presensi siswa kapan saja secara langsung tanpa terhalang aturan 7 hari atau alur pengajuan koreksi admin. Teks aturan *"Catatan perkembangan siswa dicatat melalui halaman nilai. Entri lebih dari 7 hari hanya dapat diubah melalui admin."* beserta kartu metrik status kunci 7 hari di antarmuka presensi dihapus agar formulir dan ringkasan sesi lebih bersih, ringkas, dan bebas hambatan.

## 2. Verification Commands
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

## 3. Data Contracts & UI Changes
- **Tampilan UI Formulir Presensi**:
  - `src/components/teacher/attendance/attendance-table.tsx`:
    - Hapus elemen `<p>{t('attendanceFormHelp')}</p>`.
    - Hapus elemen UI kunci / status `s.terkunci` (presensi selalu dapat diedit langsung oleh guru).
  - `src/components/teacher/presensi-form.tsx`:
    - Hapus elemen `<p>{t("attendanceFormHelp")}</p>`.
  - `src/components/teacher/attendance/session-stat-strip.tsx`:
    - Hapus kartu ke-4 (Batas 7 hari / `sevenDayRule`), ubah grid dari 4 kolom menjadi 3 kolom bersih (Total Siswa, Presensi Terisi, Butuh Perhatian).
    - Hapus prop `terkunciN` dari `SessionStatStripProps`.
- **Halaman & Aksi Server**:
  - `src/app/[locale]/(teacher)/teacher/classes/[classId]/sessions/[date]/attendance/page.tsx`:
    - Hapus prop `terkunciN` yang dioper ke `SessionStatStrip`.
    - Hapus import tak terpakai `dalamJendela7Hari`.
  - `src/app/actions/teacher.ts`:
    - Hapus import tak terpakai `dalamJendela7Hari`.
- **Lokalisasi**:
  - `src/i18n/messages/id/teacher.json` & `src/i18n/messages/en/teacher.json`:
    - Hapus entri `attendanceFormHelp`.

## 4. Acceptance Criteria (Given-When-Then)
- **AC1: Teks Petunjuk 7 Hari Dihapus dari Form Presensi**
  - **Given**: Guru membuka halaman pencatatan presensi sesi (`/teacher/classes/[classId]/sessions/[date]/attendance`).
  - **When**: Guru melihat bagian bawah form presensi.
  - **Then**: Teks *"Catatan perkembangan siswa dicatat melalui halaman nilai. Entri lebih dari 7 hari hanya dapat diubah melalui admin."* sudah tidak muncul di layar.
- **AC2: Ringkasan Metrik Sesi Bersih 3 Kolom**
  - **Given**: Guru melihat ringkasan metrik sesi (`SessionStatStrip`).
  - **When**: Memeriksa kartu metrik di atas tabel presensi.
  - **Then**: Hanya menampilkan 3 kartu metrik relevan (Total Murid, Progres Terisi, Butuh Perhatian) tanpa kartu "Batas 7 hari".
- **AC3: Akses Penyuntingan Presensi Langsung**
  - **Given**: Guru menyunting entri presensi kapan saja.
  - **When**: Guru mengubah status dan menyimpan form.
  - **Then**: Presensi tersimpan langsung tanpa terkunci.
- **AC4: Kompilasi TypeScript Bersih**
  - **Given**: Semua file diubah.
  - **When**: Menjalankan `npx tsc --noEmit`.
  - **Then**: Lolos tanpa error (exit code 0).

## 5. Out-of-Scope
- Menghapus fungsi utilitas waktu di `src/lib/format/hari.ts` (karena digunakan untuk modul pembayaran tagihan).
