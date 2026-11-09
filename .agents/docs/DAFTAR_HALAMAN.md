# Daftar Halaman — Siedu (Next.js App Router)

> Referensi: `ATURAN_SISTEM.md`, `PRD.md`, `ROADMAP_SIEDU.md`, `DESIGN.md`. Standar teks & label navigasi antarmuka mengikuti Bahasa Indonesia sesuai `DESIGN.md` (misal: "Katalog Kelas", "Riwayat Pembayaran", "Jadwal & Presensi"). Update file ini kalau ada halaman baru diputuskan atau route berubah.

---

## A. Public (Guest) — `app/(public)/`

| # | Halaman | Route |
|---|---|---|
| A1 | Landing Page | `/` |
| A2 | Browse Classes (Katalog) | `/classes` |
| A3 | Class Detail | `/classes/[id]` |
| A4 | About | `/about` |
| A5 | Privacy Policy | `/privacy-policy` |
| A6 | Terms & Conditions | `/terms` |
| A7 | Contact (formulir pesan masuk) | `/contact` |

## B. Auth — `app/(auth)/`

| # | Halaman | Route |
|---|---|---|
| B1 | Login | `/login` |
| B2 | Register — Step 1 (email+password) | `/register` |
| B3 | Register — Step 2 (info akun + consent, BR#25) | `/register/account-info` |
| B4 | Register — Step 3 (profil Anak) | `/register/child-info` |
| B5 | Forgot Password | `/forgot-password` |
| B6 | Reset Password | `/reset-password/[token]` |

## C. Parent — `app/(parent)/`

| # | Halaman | Route | Catatan |
|---|---|---|---|
| C1 | Home (Dashboard) | `/home` | Sudah didesain lengkap (lihat riwayat chat) |
| C2 | Browse Classes (reuse dari A2/A3, form daftar tampil kalau login) | `/classes`, `/classes/[id]` | |
| C3 | Enrollment Detail | `/enrollments/[id]` | Tombol aksi kondisional per status |
| C4 | Payment Channel Selection | `/enrollments/[id]/pay` | Redirect ke Midtrans Snap |
| C5 | Payment Confirmation | `/enrollments/[id]/payment-result` | |
| C6 | Payment History & Status | `/payments` | Top-level nav |
| C7 | Schedule & Attendance | `/schedule-attendance` | Top-level nav, tab gabungan |
| C8 | Manage Children (list) | `/children` | Di dropdown Parent |
| C9 | Add Child | `/children/new` | |
| C10 | Edit Child | `/children/[id]/edit` | Read-only kalau ada Pendaftaran aktif (Keputusan #5) |
| C11 | Cancellation Request | `/enrollments/[id]/cancel` | |
| C12 | Edit Account Profile | `/profile` | Di dropdown Parent |

## D. Teacher — `app/(teacher)/`

| # | Halaman | Route |
|---|---|---|
| D1 | Dashboard | `/teacher/dashboard` |
| D2 | My Classes (jadwal + entry presensi) | `/teacher/classes` |
| D3 | Attendance Form | `/teacher/classes/[classId]/sessions/[date]/attendance` |
| D4 | Grades & Progress | `/teacher/grades` |
| D5 | Grade Input Form | `/teacher/grades/[enrollmentId]` |
| D6 | Correction Requests | `/teacher/corrections` |
| D7 | Edit Profile | `/teacher/profile` |

## E. Admin — `app/(admin)/`

| # | Halaman | Route | Catatan |
|---|---|---|---|
| E1 | Dashboard | `/admin/dashboard` | |
| E2 | Subjects (Mata Pelajaran) | `/admin/subjects` | list+form |
| E3 | Enrollment Periods | `/admin/periods` | list+form |
| E4 | Teachers | `/admin/teachers` | list+form |
| E5 | Classes | `/admin/classes` | list+form, validasi BR#6 |
| E6 | ⚠️ Problematic Enrollments | `/admin/enrollments/flagged` | BR belum final — wireframe kasar saja |
| E7 | Refund Verification | `/admin/refunds` | |
| E8 | Duplicate Children Review | `/admin/duplicate-children` | BR#16 |
| E9 | Correction Approvals | `/admin/corrections` | BR#18 |
| E10 | ⚠️ Reports (Enrollment & Finance) | `/admin/reports` | Format belum dibahas — wireframe kasar |
| E11 | Pesan Masuk (inbox form Kontak) | `/admin/messages` | Tabel + status baru/diproses/selesai |

## F. Sistem (bukan halaman UI)

| # | Fungsi | Route |
|---|---|---|
| F1 | Cron check timeout (BR#21) | `/api/cron/check-timeout` |
| F2 | Webhook Midtrans | `/api/webhooks/midtrans` |

---

## Urutan Pengerjaan yang Disarankan

1. **Auth** (B1–B6) — prasyarat semua orang
2. **Public + Parent inti** (A1–A6, C1, C3) — value tertinggi
3. **Payment flow** (C4, C5, C6) — paling kompleks, tapi keputusan Midtrans+BR#23 sudah final
4. **Teacher** (D1–D7) — bisa paralel, tidak bergantung payment
5. **Admin CRUD dasar** (E1–E5)
6. **Admin lanjutan** (E7, E8, E9)
7. **Item ⚠️** (E6, E10) — tunda sampai BR-nya dirumuskan

**Total: 34 halaman UI + 2 route sistem.**

---

## Cara Update File Ini

- Tandai `[x]` di depan nomor kalau halaman sudah selesai dibuat, biar jadi checklist progres.
- Kalau ada halaman baru yang diputuskan di tengah jalan, tambahkan di grup yang sesuai dengan nomor urut berikutnya (mis. C13), jangan sisipkan di tengah supaya referensi lama tidak berubah.

