# Spec: Teacher Header and Sidebar Elevation

- **Status**: Draft
- **Target**: `src/components/teacher/teacher-shell.tsx`, `src/components/teacher/teacher-sidebar.tsx`, `src/components/teacher/teacher-header.tsx`
- **Related Skills**: `modern-web-guidance`, `frontend-design`, `ui-ux-pro-max`, `impeccable`

---

## 1. Objective & User Story

### Objective
Menyelaraskan tema visual Portal Guru dengan warna latar belakang putih bersih (`bg-white dark:bg-slate-950`) yang menyatu dengan sidebar, menghadirkan komponen **Header Sticky** (`TeacherHeader`) di bagian atas layout yang memuat lonceng notifikasi dan foto profil pengguna, merapikan sidebar menjadi bentuk kotak tegas (`rounded-none`), menyesuaikan ukuran logo brand agar seimbang dengan logo di guest landing page (`h-7 sm:h-7.5`), serta memindahkan navigasi profil dari footer sidebar ke header atas.

### User Story
- **Sebagai Guru**, saya ingin memiliki header yang elegan di atas layar dengan icon lonceng notifikasi dan foto profil saya, sehingga saya dapat dengan cepat melihat notifikasi dan mengakses menu profil/logout kapan saja.
- **Sebagai Guru**, saya ingin tampilan latar belakang halaman dan sidebar menyatu dengan warna putih bersih tanpa radius melengkung yang aneh di sudut atas sidebar, dengan logo proporsional seperti di landing page utama.

---

## 2. Command Verifikasi

Sesuai aturan interop Windows & WSL di `AGENTS.md`:
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Interfaces

### 3.1 TeacherHeader Component Props
```typescript
export interface TeacherHeaderProps {
  userName: string;
  userEmail?: string | null;
  userImage?: string | null;
  role: string;
  initialNotifications?: NotificationItem[];
  onOpenMobileDrawer: () => void;
  onOpenLogout: () => void;
}
```

### 3.2 Notification Item Interface
```typescript
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  category?: 'attendance' | 'task' | 'class' | 'correction' | 'system';
  href?: string;
}
```

---

## 4. Acceptance Criteria (Given-When-Then)

### Skenario 1: Latar Belakang Putih Selaras
- **Given** seorang Guru membuka halaman mana pun di Portal Guru (`/teacher/*`).
- **When** halaman dimuat.
- **Then** background utama adalah putih (`bg-white dark:bg-slate-950`), menyatu secara seamless dengan warna sidebar (`bg-white dark:bg-slate-900`), menggantikan background `#FAF9F9`.

### Skenario 2: Bentuk Sidebar Kotak (Squared / Box)
- **Given** sidebar Portal Guru ditampilkan di layar desktop (lg+).
- **When** diperiksa tampilan fisiknya.
- **Then** sudut kanan atas sidebar tidak lagi memiliki radius melengkung besar (`rounded-tr-[36px]` dihapus, menjadi `rounded-none`).
- **And** logo Siedu di bagian atas sidebar berukuran proporsional (`h-7 sm:h-7.5 w-auto`) identik dengan ukuran logo di navbar landing page guest.

### Skenario 3: Pembersihan Profil dari Footer Sidebar
- **Given** sidebar ditampilkan dalam mode collapsed maupun expanded.
- **When** melihat bagian footer sidebar.
- **Then** blok profil pengguna di footer sidebar dihapus, hanya menyisakan tombol tema (Theme Switcher) untuk menjaga kesederhanaan sidebar.

### Skenario 4: TeacherHeader Sticky & Aksesibilitas
- **Given** tampilan halaman guru di desktop maupun mobile.
- **When** halaman di-scroll ke bawah.
- **Then** `TeacherHeader` tetap melekat di posisi atas (`sticky top-0 z-30`) dengan latar `bg-white/95 dark:bg-slate-900/95 backdrop-blur-md` dan batas tipis `border-b border-slate-200 dark:border-slate-800`.
- **And** di mobile (`lg:hidden`), terdapat tombol toggle drawer navigasi dengan `aria-label="Buka menu navigasi"`.

### Skenario 5: Interaksi Lonceng Notifikasi & Menu Profil di Header
- **Given** guru melihat ikon lonceng, tombol ganti bahasa (ID - EN), dan avatar profil lingkaran murni di `TeacherHeader`.
- **When** guru mengklik tombol pengubah bahasa (ID/EN).
- **Then** locale rute berpindah secara mulus tanpa reload penuh (soft navigation via next-intl routing).
- **When** guru mengklik ikon lonceng notifikasi.
- **Then** terbuka popover notifikasi dinamis yang memuat data operasional riil dari database (misalnya: `"Terdapat X sesi pertemuan minggu ini belum presensi."` atau `"Terdapat X tugas siswa menunggu penilaian."`).
- **And** saat item notifikasi diklik, pengguna langsung diarahkan ke halaman tujuan yang relevan (`/teacher/attendance` untuk presensi, `/teacher/grades` untuk tugas, `/teacher/calendar` untuk jadwal) dan status item ditandai sudah dibaca.
- **When** guru mengklik avatar profil lingkaran murni.
- **Then** terbuka dropdown menu profil yang menampilkan nama lengkap, email, peran "Guru", tautan langsung ke `/teacher/profile`, dan opsi "Keluar" (Logout) yang membuka konfirmasi `LogoutDialog`.

---

## 5. Out-of-Scope (YAGNI)
- Perubahan arsitektur skema database untuk tabel notifikasi real-time (cukup mock notification client-side store yang extensible).
- Perubahan layout pada Portal Admin (`/admin/*`) dan Portal Orang Tua (`/home`, dll.).
