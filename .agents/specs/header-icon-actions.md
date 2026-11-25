# Spec: Dynamic Navbar Action Button for Teacher Portal

## Objective & User Story
Sebagai guru yang menggunakan Siedu Portal Guru, saya ingin bilah navigasi atas (*header navbar*) menampilkan tombol aksi utama yang cerdas dan dinamis:
- Saat berada di halaman detail kelas (`/teacher/classes/*` seperti `/teacher/classes/18`), navbar menampilkan 1 tombol ikon **Create** (`Plus`) untuk langsung membuat tugas baru.
- Saat berada di halaman status pembelajaran (`/teacher/status`), tombol aksi di navbar otomatis berubah menjadi ikon **Kamera** (`Camera`) untuk memicu pembuatan/pembagian dokumentasi belajar.
- Saat berada di halaman presensi (`/teacher/attendance`), tombol aksi di navbar otomatis berubah menjadi ikon **Presensi** (`ClipboardCheck`) untuk membuka sesi presensi terdekat.
- Saat berada di halaman lain (Dashboard, Profil, Kalender, dll.), tidak ada tombol aksi di navbar agar tampilan tetap bersih.
- Tombol aksi redundan di dalam body halaman detail kelas dihilangkan sehingga judul kelas tampil lapang dan minimalis.

## Verification Command
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

## Architecture & Data Contracts
1. **TeacherHeaderActionContext (`src/components/teacher/teacher-header-action-context.tsx`):**
   - Menyediakan `TeacherHeaderActionProvider` di dalam `TeacherShell`.
   - Mengelola state `action`:
     ```ts
     export type HeaderActionType = 'create' | 'camera' | 'attendance';
     export interface HeaderAction {
       type: HeaderActionType;
       label: string;
       onClick?: () => void;
       href?: string;
     }
     ```
   - Hook `useSetTeacherHeaderAction(action)` untuk mendaftarkan aksi saat komponen halaman mount dan membersihkannya saat unmount.
   - Dual-dispatch mechanism: Selain callback Context, event global (`teacher:create-task`, `teacher:create-status`, `teacher:attendance-action`) didukung sebagai fallback responsif instan.

2. **TeacherHeader (`src/components/teacher/teacher-header.tsx`):**
   - Mendeteksi `action` dari Context dan `pathname`:
     - `/teacher/classes/[classId]`: Menampilkan tombol icon `Plus` (`bg-blue-600 text-white`).
     - `/teacher/status`: Menampilkan tombol icon `Camera` (`bg-emerald-600 text-white`).
     - `/teacher/attendance`: Menampilkan tombol icon `ClipboardCheck` (`bg-blue-600 text-white`).
   - Sizing: `size-9` (36×36px), `rounded-full` (lingkaran penuh), `aria-label`, dan `title` tooltip.
   - Diposisikan di sisi kanan navbar, berdampingan dengan switcher bahasa dan bell notifikasi.

3. **ClassDetailView (`src/components/teacher/classes/class-detail-view.tsx`):**
   - Menghilangkan 3 tombol redundan (Presensi, Bagikan Status, Buat Tugas) dari baris judul kelas.
   - Mendaftarkan aksi `create` ke Context dan mendengarkan event `teacher:create-task` untuk membuka `QuickAssessmentModal`.

4. **StatusHubView (`src/components/teacher/status-hub-view.tsx`):**
   - Mendaftarkan aksi `camera` ke Context dan mendengarkan event `teacher:create-status` untuk membuka pemilih foto/story creator.

5. **TeacherAttendanceOverview (`src/components/teacher/attendance/teacher-attendance-overview.tsx`):**
   - Mendaftarkan aksi `attendance` ke Context dengan target URL sesi presensi aktif/terdekat.

## Acceptance Criteria (Given-When-Then)

### Skenario 1: Halaman Detail Kelas (/teacher/classes/18)
- **Given** guru membuka `/teacher/classes/18`
- **When** halaman dimuat
- **Then** di header navbar atas muncul 1 tombol icon `Plus` (Create) berlatar biru primer
- **And** di baris judul kelas (`<h1>`) tidak ada lagi tombol redundan
- **When** guru mengklik tombol `Plus` di header navbar
- **Then** modal pembuatan tugas (`QuickAssessmentModal`) langsung terbuka

### Skenario 2: Halaman Status Pembelajaran (/teacher/status)
- **Given** guru berpindah ke halaman `/teacher/status`
- **When** halaman dimuat
- **Then** tombol di header navbar atas berganti menjadi ikon `Camera` (warna emerald)
- **When** guru mengklik tombol `Camera` di header navbar
- **Then** dialog pemilih foto / story creator langsung terbuka

### Skenario 3: Halaman Presensi (/teacher/attendance)
- **Given** guru membuka halaman `/teacher/attendance`
- **When** halaman dimuat
- **Then** tombol di header navbar atas berganti menjadi ikon `ClipboardCheck`
- **When** guru mengklik tombol `ClipboardCheck` di header navbar
- **Then** diarahkan ke sesi presensi aktif/terdekat

### Skenario 4: Halaman Netral Lainnya (Dashboard, Profil, dll.)
- **Given** guru membuka `/teacher/dashboard` atau `/teacher/profile`
- **When** halaman dimuat
- **Then** tidak ada tombol aksi dinamis di header navbar

## Out-of-Scope
- Mengubah database, endpoint API, atau Server Actions.
- Mengubah UI di portal parent atau admin.
