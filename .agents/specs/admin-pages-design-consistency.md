# Spec: Konsistensi Desain Halaman `/admin/messages`, `/admin/audit-logs`, dan `/admin/reports`

## Objective & User Story
Sebagai Admin Siedu, saya ingin halaman `/admin/messages`, `/admin/audit-logs`, dan `/admin/reports` menggunakan bahasa desain yang seragam dengan halaman admin lainnya (`AdminPageHeader`, `AdminTableShell`, `FilterDropdown`, dan gaya kartu KPI Dashboard Admin) sehingga seluruh portal admin terasa kohesif, bersih, dan bebas dari komponen lama (`PageHeader`, `FilterTabs`, `DataTable`, serta kartu KPI `border-t-4`).

## Verification Commands
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx eslint src/app/[locale]/admin/messages/page.tsx src/app/[locale]/admin/audit-logs/page.tsx src/app/[locale]/admin/reports/page.tsx src/components/admin/views/messages-view.tsx src/components/admin/views/audit-logs-view.tsx src/components/admin/views/reports-view.tsx src/components/admin/audit-detail-dialog.tsx" < /dev/null
```

## Data Contracts
- `AdminMessageRow`: `{ id, nama, email, telepon, jenjang, sekolah, subjek, pesan, status: 'baru' | 'diproses' | 'selesai', createdAt, createdAtLabel }`
- `AdminAuditLogRow`: `{ id, aktorNama, aktorRole, entitas, entitasId, aksi, alasan, sebelum, sesudah, createdAt, createdAtLabel }`
- `AdminReportPeriodRow`: `{ id, nama, status, tanggalMulai, tanggalMulaiLabel, tanggalSelesaiLabel, totalPendaftar, aktif, tertunggak, batal, terkumpul, terkumpulCount, pending, pendingCount, totalTagihan }`
- `AdminReportKpi`: `{ label, value, sub }`

## Acceptance Criteria (Given-When-Then)
1. **Header Seragam (`AdminPageHeader`)**:
   - Given admin membuka `/admin/messages`, `/admin/audit-logs`, atau `/admin/reports`,
   - When halaman dirender,
   - Then judul dan deskripsi memakai `AdminPageHeader` (`border-b`, `text-2xl sm:text-3xl font-bold`, tanpa counter pada deskripsi maupun pill/badge di header).
2. **`/admin/messages` (Master-Detail + Toolbar Konsisten)**:
   - Given admin membuka `/admin/messages` (termasuk dari link notifikasi `/admin/messages?status=baru&baca=...`),
   - When melihat kontrol filter dan daftar pesan,
   - Then tersedia toolbar pencarian di kiri dan `FilterDropdown` status (`Semua`, `Baru`, `Diproses`, `Selesai`) di kanan tanpa `FilterTabs` dan tanpa angka counter pada filter; daftar kiri dan panel baca kanan memakai gaya kartu `rounded-lg border` yang selaras dengan `AdminTableShell`, dengan seluruh aksi (`ubahStatusPesan`, `hapusPesan`, `mailto:`) tetap berfungsi.
3. **`/admin/audit-logs` (`AdminTableShell` + `FilterDropdown`)**:
   - Given admin membuka `/admin/audit-logs`,
   - When melihat tabel log audit,
   - Then halaman memakai `AdminTableShell`, kolom `No`, `AdminSortHeader`, `FilterDropdown` tipe entitas (`Semua`, `Pembayaran`, `Pendaftaran`, `Presensi`, `Penilaian`), paginasi bawaan, empty/filtered-empty state, dan modal detail payload (`AuditDetailDialog` berbasis `AdminModal`).
4. **`/admin/reports` (KPI Dashboard Style + `AdminTableShell`)**:
   - Given admin membuka `/admin/reports`,
   - When melihat ringkasan KPI dan tabel per periode,
   - Then kartu KPI tampil tanpa `border-t-4` warna (mengikuti kartu KPI Dashboard Admin: `rounded-2xl border border-slate-200/80 shadow-2xs`, label uppercase kecil di atas angka, angka `tabular-nums`), dan tabel periode memakai `AdminTableShell` dengan pencarian, `FilterDropdown` status semester, kolom `No`, `AdminSortHeader`, dan `TablePagination`.

## Out-of-Scope
- Perubahan skema database atau server action (`ubahStatusPesan`, `hapusPesan`).
- Perubahan halaman admin selain `/admin/messages`, `/admin/audit-logs`, dan `/admin/reports`.
