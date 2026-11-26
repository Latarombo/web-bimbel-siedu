# SPEC: Pembaruan Skema & Redesain CRUD Tabel Portal Admin (Pola `/teacher/classes/18`)

> **Modul ID:** `admin-crud-redesign-and-schema`  
> **Aktor:** Administrator (`role: admin`)  
> **Status:** Draft — Menunggu Persetujuan Human (SDD Phase 2)  
> **Referensi Desain:** [`src/components/teacher/classes/class-detail-view.tsx`](../../src/components/teacher/classes/class-detail-view.tsx) (`/teacher/classes/18`)  
> **Rujukan Aturan:** [`AGENTS.md`](../../AGENTS.md), [`CONSTRAINTS.md`](../../CONSTRAINTS.md), [`DESIGN.md`](../docs/DESIGN.md), [`ATURAN_SISTEM.md`](../docs/ATURAN_SISTEM.md)

---

## 1. Objective & User Story

Menyederhanakan struktur data bimbingan belajar dengan menghapus entitas terpisah `MataPelajaran` dan memperkaya kolom `Kelas`, `Anak`, serta `JadwalItem`, sekaligus menyeragamkan seluruh halaman tabel operasional & master data di Portal Admin (`/admin/*`) agar memiliki antarmuka modern, bersih, dan konsisten dengan pola desain `/teacher/classes/18` lengkap beserta fungsionalitas CRUD berbasis Modal/Drawer.

### User Story
*Sebagai Administrator Bimbel*, saya ingin:
1. Mengelola Kelas (beserta nama kelas & mapel langsung), Semester, Guru, Orang Tua, Anak, Jadwal (beserta tempat/alamat), Pendaftaran, dan Pembayaran dalam antarmuka tabel yang seragam, responsif, mudah dicari/disortir, dan memiliki aksi CRUD lengkap via Modal/Drawer.
2. Melihat rincian lengkap Orang Tua beserta daftar anaknya, menelusuri ringkasan status pembayaran di Tabel Pendaftaran via tombol icon, serta memantau dan mengonfirmasi setiap transaksi cicilan/lunas di halaman khusus Tabel Pembayaran.
3. Tidak lagi mengelola halaman terpisah Mata Pelajaran karena nama kelas dan mapel melekat langsung pada entitas Kelas.

---

## 2. Commands Verifikasi

```bash
# 1. Emit kontrak Prisma 8 & generate migration (via PowerShell Windows)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx prisma contract emit" < /dev/null
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx prisma migration plan --name admin_schema_simplification" < /dev/null
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; .\scripts\prisma-win.ps1 apply" < /dev/null
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; .\scripts\prisma-win.ps1 verify" < /dev/null

# 2. Verifikasi kompilasi TypeScript (Wajib 0 error)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null

# 3. Verifikasi ESLint & Build Next.js
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run lint" < /dev/null
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run build" < /dev/null
```

---

## 3. Perubahan Skema Database & Strategi Migrasi (`src/prisma/contract.prisma`)

### 3.1 Perubahan Model Data
1. **Hapus Model `MataPelajaran` (`mata_pelajaran`):**
   - Hapus model `MataPelajaran` beserta seluruh relasi/index/check constraint-nya.
2. **Perbarui Model `Kelas` (`kelas`):**
   - Hapus `mataPelajaranId` (`mata_pelajaran_id`) dan relasi `mataPelajaran`.
   - Tambah `nama String` (`@map("nama")`, `@@check("length(nama) <= 120")`).
   - Tambah `mapel String` (`@map("mapel")`, `@@index([mapel])`, `@@check("length(mapel) <= 100")`).
3. **Perbarui Model `Anak` (`anak`):**
   - Tambah `alamat String?` (`@map("alamat")`, `@@check("alamat IS NULL OR length(alamat) <= 500")`).
   - Ganti kolom `emailNotifikasi` (`@map("email_notifikasi")`) menjadi `email String?` (`@map("email")`, `@@check("email IS NULL OR length(email) <= 255")`).
4. **Perbarui Model `JadwalItem` (`jadwal_item`):**
   - Tambah `tempat String?` (`@map("tempat")`, `@@check("tempat IS NULL OR length(tempat) <= 150")`).

### 3.2 Backfill Data pada `migration.ts` (`dataTransform`)
Sebelum menghapus tabel `mata_pelajaran` dan kolom `kelas.mata_pelajaran_id` serta `anak.email_notifikasi`:
1. **`kelas.mapel` & `kelas.nama`:**
   - `kelas.mapel` diisi dari `mata_pelajaran.nama` yang berelasi dengan `kelas.mata_pelajaran_id`.
   - `kelas.nama` diisi otomatis dengan format: `mata_pelajaran.nama || ' · ' || kelas.jenjang || COALESCE(' (' || kelas.tingkat || ')', '')`.
2. **`anak.email`:**
   - `anak.email` disalin dari nilai `anak.email_notifikasi` yang sudah ada.
3. **`jadwal_item.tempat`:**
   - `jadwal_item.tempat` diisi awal dari `kelas.ruangan` milik kelas terkait (jika tidak null).

### 3.3 Dampak Lintas Modul (*Cross-App Sync*)
Seluruh modul aplikasi yang sebelumnya membaca `mataPelajaran` atau `anak.emailNotifikasi` diperbarui agar tetap berfungsi penuh:
- **Katalog Publik (`src/lib/katalog.ts`, `src/app/api/katalog/suggest/route.ts`, `src/app/[locale]/(public)/classes/*`):**
  - Pencarian & filter mapel menggunakan daftar nilai unik `kelas.mapel` (non-dibatalkan).
  - Judul kartu/detail kelas menampilkan `kelas.nama` dan sub-label `kelas.mapel`.
- **Portal Orang Tua (`src/lib/orang-tua-dashboard.ts`, `src/lib/services/pendaftaran.ts`, `src/app/actions/child-info.ts`, `src/components/parent/*`, `src/components/pendaftaran/child-info-form.tsx`):**
  - Form tambah/edit anak memakai field `email` dan `alamat` (opsional) menggantikan `email_notifikasi`.
  - Ringkasan kelas anak menampilkan `kelas.nama` & `kelas.mapel`.
- **Portal Guru (`src/app/[locale]/(teacher)/*`, `src/lib/rapor.ts`, `src/app/api/export/class/[classId]/route.ts`, `student-profile-drawer.tsx`):**
  - Header/daftar kelas menampilkan `kelas.nama` dan `kelas.mapel`.
  - Drawer profil siswa membaca `anak.email` dan `anak.alamat` (fallback ke orang tua jika null), serta jadwal membaca `jadwalItem.tempat` (fallback ke `kelas.ruangan`).
- **Seed & Utility Scripts (`scripts/seed.ts`, `scripts/seed-katalog.ts`, `scripts/check-data.ts`):**
  - Disesuaikan dengan kolom `kelas.nama`, `kelas.mapel`, `anak.email`, `anak.alamat`, `jadwal_item.tempat`.

---

## 4. Sistem Desain & Pola UI Admin (Mengikuti `/teacher/classes/18`)

Semua halaman tabel di Portal Admin wajib menerapkan anatomi komponen berikut secara konsisten (dapat diekstrak ke komponen helper admin reusable seperlunya tanpa over-engineering):

1. **Header Halaman Bersih:**
   - `h1` menggunakan `text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50`, **tanpa** pill/badge di samping judul (*Anti-Header Pill Clutter*), dan **tanpa** counter dinamis di dalam kalimat deskripsi (*Anti-Redundant Counter*).
2. **Tabs (jika halaman memiliki > 1 view):**
   - Menggunakan komponen `UnderlineTabs` (`@/components/ui/underline-tabs`).
3. **Section Toolbar di Atas Tabel:**
   - Kiri: Input pencarian (`h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs`) dengan tombol clear (`X`).
   - Kanan: `FilterDropdown` (jika ada filter status/jenjang/semester) dan tombol primary `+ Tambah ...` (`rounded-lg bg-blue-600 text-white`) — teks bersih tanpa ikon dekoratif berlebih sesuai *Icon Restraint*.
4. **Kontainer & Gaya Tabel (`/teacher/classes/18`):**
   - Wrapper: `rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs`.
   - `thead`: `border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300`.
   - Kolom `No` (`sticky left-0`) & Kolom Nama/Utama (`sticky left-12`, `border-r`, shadow kanan halus) tetap menempel saat scroll horizontal.
   - Kolom `Aksi` (`md:sticky md:right-0`, `border-l`, shadow kiri halus) rata kanan (`text-right`).
   - Header kolom sortable memakai tombol dengan `ArrowUpDown` / `ArrowUp` / `ArrowDown`.
   - Angka nominal, kuota, dan tanggal menggunakan `text-right tabular-nums`.
   - Footer: Komponen `TablePagination` (`@/components/ui/table-pagination`, default 10 baris/halaman).
   - Empty State: Kontainer `rounded-lg border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-12 text-center` beserta tombol reset pencarian saat filter kosong.
5. **Pola CRUD via Modal / Drawer (`NativeDialog`):**
   - Seluruh form **Tambah**, **Edit**, dan **Lihat Detail** pada halaman tabel admin dibuka di dalam Modal/Drawer (`@/components/common/native-dialog`), bukan panel sticky di samping kanan tabel.
   - Tombol aksi baris tabel: tombol icon-only ringkas dengan `aria-label` dan `title` (`Eye`, `Pencil`, `Trash2`, `Check`) sesuai aturan *Icon Restraint*.
   - Aksi hapus menggunakan konfirmasi aman (dialog konfirmasi) dan dilindungi validasi server-side agar tidak memutus integritas data transaksi.

---

## 5. Spesifikasi Per Modul / Halaman Admin

### 5.1 Penghapusan Modul Mata Pelajaran
- Hapus rute `/admin/subjects` (`src/app/[locale]/admin/subjects/page.tsx`).
- Hapus komponen `src/components/admin/mapel-form.tsx`.
- Hapus server action `saveMapel` & `hapusMapel` dari `src/app/actions/admin.ts`.
- Hapus item navigasi Mata Pelajaran dari `NAV_SECTIONS` di `src/app/[locale]/admin/layout.tsx`.

### 5.2 Tabel Kelas (`/admin/classes`)
- **Kolom Tabel:** `No`, `Nama Kelas`, `Mapel`, `Guru`, `Kuota` (`kuotaTerisi / kuotaMaksimum` + persentase/bar), `Biaya` (`biayaPeriode` + info DP jika ada), `Jadwal` (ringkasan hari & jam), `Status` (`aktif` / `dibatalkan`), `Aksi`.
- **Aksi CRUD:**
  - **Create:** Tombol `Tambah Kelas` membuka Modal `KelasForm` (field: `nama`, `mapel`, `guruId`, `periodeId`, `jenjang`, `tingkat`, `ruangan`, `kuotaMinimum`, `kuotaMaksimum`, `biayaPeriode`, `biayaDp`, `tenorMaksimum`, `status`, serta hingga 3 slot jadwal awal + `tempat`).
  - **Read / Detail:** Klik baris / icon `Eye` ke `/admin/classes/[classId]`.
  - **Update:** Icon `Pencil` membuka Modal `KelasForm` terisi data kelas (atau link edit jika diperlukan).
  - **Delete (`hapusKelas`):** Icon `Trash2` dengan konfirmasi. **Proteksi aman:** Tolak penghapusan dengan pesan jelas jika kelas memiliki `Pendaftaran` terkait atau `Presensi` tercatat (hanya hapus kelas kosong/belum bertransaksi; `JadwalItem` ikut terhapus cascade bila kelas aman dihapus).

### 5.3 Tabel Pendaftaran (`/admin/enrollments`)
- **Kolom Tabel:** `No`, `Nama Orang Tua`, `Nama Anak`, `Kelas yang Diambil` (`kelas.nama`), `Mapel yang Diambil` (`kelas.mapel`), `Metode Bayar` (`Lunas` / `DP + Cicilan`), `Status Pembayaran` (ringkasan: `Lunas`, `DP Lunas`, `Menunggu Bayar`, `Tertunggak`, `Dibatalkan`), `Tanggal Daftar` (`createdAt`), `Aksi`.
- **Aksi:**
  - Tombol icon-only `Eye` (`aria-label="Lihat detail pendaftaran"`) menuju `/admin/enrollments/[id]`.
- **Filter:** `FilterDropdown` / `UnderlineTabs` berdasarkan status (`Semua`, `Lunas / Terdaftar`, `Menunggu Bayar`, `Bermasalah`).

### 5.4 Tabel Semester (`/admin/periods`)
- **Kolom Tabel:** `No`, `Semester` (`nama`), `Status` (`dibuka` / `ditutup` / `selesai`), `Tanggal Mulai`, `Tanggal Selesai` (+ info batas tutup pendaftaran), `Aksi`.
- **Aksi CRUD:**
  - **Create:** Tombol `Tambah Semester` membuka Modal `PeriodeForm`.
  - **Update:** Icon `Pencil` membuka Modal `PeriodeForm` dengan data semester terkait.
  - **Delete (`hapusPeriode`):** Icon `Trash2` dengan konfirmasi. **Proteksi aman:** Tolak jika masih memiliki `Kelas` atau `Pendaftaran` pada periode tersebut.

### 5.5 Tabel Guru (`/admin/teachers`)
- **Kolom Tabel:** `No`, `Nama Guru` (dengan avatar inisial), `Nomor Telepon`, `Email`, `Kelas yang Diampu` (daftar nama kelas yang diampu atau tautan ke kelas), `Alamat` (`User.alamat`), `Aksi`.
- **Aksi CRUD:**
  - **Create:** Tombol `Tambah Guru` membuka Modal `GuruForm` (wajib password awal).
  - **Update:** Icon `Pencil` membuka Modal `GuruForm` (password opsional).
  - **Delete (`hapusGuru`):** Icon `Trash2` dengan konfirmasi. **Proteksi aman:** Tolak jika guru masih mengampu `Kelas` atau memiliki `Presensi` / `Penilaian`.

### 5.6 Tabel Orang Tua (`/admin/parents`)
- **Kolom Tabel:** `No`, `Nama Orang Tua` (avatar inisial), `Nomor Telepon`, `Email`, `Alamat Lengkap`, `Aksi`.
- **Aksi CRUD + Detail:**
  - **Detail (`Eye`):** Membuka Drawer/Modal rincian lengkap Orang Tua yang menampilkan seluruh profil Orang Tua (nama, email, nomor telepon, alamat, status verifikasi, tanggal bergabung) **serta daftar lengkap Data Anak miliknya** (nama anak, tanggal lahir, jenjang, tingkat, email, nomor telepon, alamat, dan riwayat kelas terdaftar).
  - **Create (`saveOrangTuaAdmin`):** Tombol `Tambah Orang Tua` membuka Modal form (`nama`, `email`, `nomorTelepon`, `alamat`, `password`).
  - **Update (`saveOrangTuaAdmin`):** Icon `Pencil` membuka Modal edit (`nama`, `email`, `nomorTelepon`, `alamat`, `password` opsional).
  - **Delete (`hapusOrangTuaAdmin`):** Icon `Trash2` dengan konfirmasi. **Proteksi aman:** Tolak jika akun orang tua memiliki data `Anak` yang sudah pernah melakukan `Pendaftaran`. Catat mutasi ke `AuditPerubahan`.

### 5.7 Tabel Anak (`/admin/students`)
- **Kolom Tabel:** `No`, `Nama Anak`, `Nama Orang Tua`, `Jenjang` (`TK`/`SD`/`SMP`/`SMA`), `Nomor Telepon`, `Email` (`anak.email`, tampilkan fallback email orang tua dengan label keterangan jika kosong), `Alamat` (`anak.alamat`, tampilkan fallback alamat orang tua jika kosong), `Tanggal Lahir`, `Tingkat / Kelas`, `Aksi`.
- **Aksi CRUD:**
  - **Create (`saveAnakAdmin`):** Tombol `Tambah Anak` membuka Modal form (pilih `orangTuaId`, `nama`, `tanggalLahir`, `jenjangTerakhir`, `tingkat`, `nomorTelepon`, `email`, `alamat`). Validasi BR#16 (cegah duplikat `nama + tanggalLahir` dalam 1 akun orang tua).
  - **Update (`saveAnakAdmin`):** Icon `Pencil` membuka Modal edit data anak.
  - **Delete (`hapusAnakAdmin`):** Icon `Trash2` dengan konfirmasi. **Proteksi aman:** Tolak jika anak sudah memiliki `Pendaftaran`. Catat mutasi ke `AuditPerubahan`.

### 5.8 Tabel Jadwal (`/admin/schedule`)
- **Tabs (`UnderlineTabs`):**
  - Tab 1 (Default): **Daftar Jadwal** (Tabel CRUD).
  - Tab 2: **Matriks Mingguan** (kalender mingguan Senin–Minggu yang sudah ada, diperbarui memakai `kelas.nama`, `kelas.mapel`, dan `jadwalItem.tempat`).
- **Kolom Tabel Jadwal:** `No`, `Hari`, `Jam Mulai`, `Jam Selesai`, `Tempat / Alamat` (`jadwalItem.tempat`), (+ sub-kolom/info `Kelas & Guru` agar konteks kelas tetap terbaca jelas), `Aksi`.
- **Aksi CRUD (`saveJadwalAdmin`, `hapusJadwalAdmin`):**
  - **Create:** Tombol `Tambah Jadwal` membuka Modal form (`kelasId`, `hari`, `jamMulai`, `jamSelesai`, `tempat`). Validasi `jamMulai < jamSelesai` dan **anti-bentrok jadwal guru (BR#6)** pada periode aktif yang sama.
  - **Update:** Icon `Pencil` membuka Modal edit slot jadwal (dengan validasi BR#6).
  - **Delete:** Icon `Trash2` dengan konfirmasi. **Proteksi aman:** Tolak jika slot `JadwalItem` sudah memiliki record `Presensi` atau `SesiPertemuan` terkait (atau minimal 1 jadwal tersisa jika kelas aktif punya pendaftaran).

### 5.9 Tabel Pembayaran (`/admin/payments` — Halaman Baru)
- **Navigasi Sidebar:** Ditambahkan di grup *Operasional* atau *Komunikasi & Laporan* pada `src/app/[locale]/admin/layout.tsx` (dengan ikon `CreditCard` / `Wallet` di `admin-sidebar.tsx`).
- **Kolom Tabel Pembayaran:**
  1. `No`
  2. `Nama Orang Tua` (beserta info nama anak)
  3. `Kelas` (`kelas.nama` & `kelas.mapel`)
  4. `Metode Bayar` (`Lunas` / `DP + Cicilan`)
  5. `Harga Kelas` (`kelas.biayaPeriode`, rata kanan `tabular-nums`)
  6. `Pembayaran` (`pembayaran.jumlah` — nominal tagihan/transaksi baris ini, rata kanan `tabular-nums`)
  7. `Nominal Masuk / Total` (akumulasi total tagihan berstatus `berhasil` untuk pendaftaran terkait, rata kanan `tabular-nums`)
  8. `Status` (`pending` / `berhasil` / `gagal`)
  9. `Tanggal Dibayar` (`dibayarPada`, rata kanan `tabular-nums`)
  10. `Cicilan Ke` (`Lunas` / `DP` / `Cicilan #N`)
  11. `Jatuh Tempo` (`jatuhTempo`, rata kanan `tabular-nums`)
  12. `Aksi` (sticky kanan)
- **Aksi Icon:**
  - Icon `Eye` (`aria-label="Lihat detail pendaftaran"`) menuju `/admin/enrollments/[pendaftaranId]`.
  - Icon `Check` (`aria-label="Konfirmasi pembayaran manual"`) muncul bila `status === 'pending'`, membuka `ManualPaymentDialog` untuk konfirmasi via `konfirmasiPembayaranManualAdmin`.

---

## 6. Acceptance Criteria (Given-When-Then)

1. **Migrasi Skema Tanpa Kehilangan Data:**
   - **Given** data kelas & anak eksisting di database, **When** migrasi dijalankan, **Then** tabel `mata_pelajaran` terhapus, kolom `kelas.nama` dan `kelas.mapel` terisi dari data mapel lama, `anak.email` terisi dari `email_notifikasi`, `anak.alamat` dan `jadwal_item.tempat` tersedia, serta `npx prisma db verify` sukses.
2. **Penghapusan Tabel Mata Pelajaran:**
   - **Given** admin membuka portal admin, **When** melihat sidebar dan mengakses `/admin/subjects`, **Then** menu Mata Pelajaran tidak ada di sidebar dan rute tersebut dihapus/404, sementara katalog publik `/classes` tetap berjalan memakai `kelas.nama` & `kelas.mapel`.
3. **CRUD Lengkap via Modal & Konsistensi Desain `/teacher/classes/18`:**
   - **Given** admin membuka `/admin/classes`, `/admin/periods`, `/admin/teachers`, `/admin/parents`, `/admin/students`, atau `/admin/schedule`, **When** melihat tampilan dan menekan Tambah/Edit/Hapus, **Then** seluruh tabel menggunakan layout seragam `/teacher/classes/18` (toolbar search/filter, sticky kolom kiri/kanan, `TablePagination`), form terbuka di Modal/Drawer, dan penghapusan entitas yang terikat transaksi ditolak dengan pesan informatif.
4. **Detail Orang Tua + Anak:**
   - **Given** admin berada di `/admin/parents`, **When** menekan tombol Detail pada baris orang tua, **Then** Modal/Drawer menampilkan seluruh data profil orang tua beserta daftar lengkap data anak-anaknya.
5. **Tabel Pendaftaran & Tabel Pembayaran:**
   - **Given** admin membuka `/admin/enrollments` dan `/admin/payments`, **When** meninjau tabel, **Then** seluruh kolom yang diminta tampil dengan format `tabular-nums`, tombol icon `Eye` mengarah ke rincian pendaftaran, dan tombol icon konfirmasi manual pada `/admin/payments` dapat melunasi tagihan `pending` serta mencatat audit log.

---

## 7. Quality Constraints & Out-of-Scope

### Constraints Checklist (`CONSTRAINTS.md`)
- [ ] `npx tsc --noEmit` (via PowerShell Windows) 0 error.
- [ ] Zero `@ts-ignore`, `@ts-expect-error`, `as any`, dan tanpa `eslint-disable` baru.
- [ ] Patuh *Icon Restraint*, *Anti-Header Pill Clutter*, dan *Anti-Redundant Counter*.
- [ ] `Promise.all()` untuk query paralel; tanpa barrel files baru; conditional ternary (bukan `&&`).

### Out-of-Scope
- Fitur refund otomatis atau pembatalan sepihak oleh orang tua (tetap dilarang sesuai BR#19).
- Perubahan logika gateway Midtrans Snap di luar penyesuaian kolom label kelas/mapel.
- Perubahan halaman non-admin di luar penyesuaian skema (`kelas.nama`/`mapel`, `anak.email`/`alamat`, `jadwal_item.tempat`).
