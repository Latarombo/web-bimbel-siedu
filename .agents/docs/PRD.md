# Product Requirements Document (PRD) — Siedu v2.0

**Version:** 2.2  
**Last Updated:** 5 September 2026  
**Status:** Active Development  
**Project Type:** School Management System / Platform as a Service (SaaS)

---

## 1. Executive Summary

**Siedu** adalah sistem informasi pendaftaran bimbingan belajar (bimbel) berbasis web untuk satu lembaga, melayani siswa jenjang TK hingga SMA. Platform ini mengelola alur lengkap dari pendaftaran siswa, pengelolaan kelas, manajemen pembayaran cicilan, hingga tracking presensi dan progres belajar.

**Key Facts:**
- **Target User:** Orang Tua/Wali sebagai pengambil keputusan dan pembayar, Guru sebagai input data kehadiran/nilai, Admin sebagai pengelola sistem
- **Business Model:** SaaS untuk satu lembaga per instalasi (single-tenant)
- **Geographic Focus:** Indonesia (terutama karena integrasi payment gateway lokal)
- **Project Type:** School Information System (academic management)

**Why Build This:**
Lembaga bimbel saat ini mengelola pendaftaran dan pembayaran secara manual (spreadsheet, email, transfer manual). Sistem Siedu mengotomasi alur ini, mengurangi kesalahan data, mempercepat verifikasi pembayaran, dan memberikan transparansi real-time kepada Orang Tua tentang status anak (presensi, nilai, riwayat pembayaran).

---

## 2. Problem Statement

### User Pain Points

| User | Current Pain | Desired Outcome |
|---|---|---|
| **Orang Tua** | Harus telepon/email ke bimbel untuk tahu kuota kelas; bayar transfer manual, tunggu konfirmasi; tidak tahu progres anak real-time | Dashboard self-service: lihat kelas tersedia, bayar online langsung, riwayat pembayaran, presensi & nilai anak real-time |
| **Guru** | Catat kehadiran di buku manual, lapor ke admin; tidak ada sistem tracking progres terstruktur | Input presensi & nilai digital, data langsung bisa diakses Orang Tua, history edit terlindungi |
| **Admin/Owner** | Catat pendaftaran manual, rekonsiliasi pembayaran vs form; tidak ada laporan keuangan/statistik | Dashboard statistik real-time, automated payment gateway, laporan pendaftaran & keuangan instant, deteksi duplikasi akun |

### Business Impact

- **Current:** Proses manual → error input tinggi, follow-up pembayaran manual (inefficient), Orang Tua tidak puas transparansi
- **With Siedu:** Otomasi alur → akurasi data tinggi, cash flow lebih jelas (tracking pembayaran otomatis), Orang Tua puas, Admin fokus ke business growth daripada admin tasks

---

## 3. Goals & Success Metrics

### Primary Goals

1. **Provide Self-Service Enrollment for Parents** — Orang Tua bisa daftar anak ke kelas tanpa intervensi admin
2. **Automate Payment Processing** — Pembayaran terintegrasi payment gateway (Midtrans), cicilan tracking otomatis
3. **Transparent Student Progress Tracking** — Orang Tua bisa lihat presensi & nilai anak real-time
4. **Reduce Admin Workload** — Automated quota management, timeout handling, duplicate detection

### Success Metrics

| Metric | Target | Timeline |
|---|---|---|
| Enrollment Time (manual → online) | Reduce dari 30 min → 5 min | Upon launch |
| Payment Processing | 95% cicilan tepat waktu (vs. 60% saat ini) | After payment gateway integration |
| Parent Satisfaction Score | 4.0/5.0 pada customer survey | 3 bulan after launch |
| Admin Time/Enrollment | Reduce dari 15 min → 2 min | Upon launch |

---

## 4. Features & Capabilities

### F1. User Registration & Authentication

**Priority:** Must Have

**Description:**  
Multi-role user registration system. Orang Tua dapat mendaftar akun baru dengan email/password, memberikan 2 consent awal (privacy policy & parental guardianship). Admin dan Guru didaftarkan oleh Admin (tidak self-signup). Autentikasi menggunakan Auth.js (Credentials Provider kustom) — lihat catatan migrasi stack.

**Goal:**  
Ensure only authorized users access the system; separate access paths per role (Orang Tua, Guru, Admin).

**Use Case:**

> **Use Case 1.1 — Orang Tua Registrasi:**  
> 1. Guest akses halaman Landing Page → klik "Daftar" atau "Pendaftaran"
> 2. Sistem tampilkan form registrasi: Email, Password (min 8 char, 1 uppercase, 1 number), Nama Lengkap, Nomor HP, Alamat (BR#25)
> 3. Orang Tua wajib centang 2 checkbox: (a) "Saya setuju Kebijakan Privasi", (b) "Saya adalah Wali Sah anak yang mendaftar"
> 4. Klik "Daftar" → sistem validasi email unik, password strength, checkbox wajib checked
> 5. Kalau valid: sistem kirim email verifikasi (link berlaku 24 jam)
> 6. Orang Tua buka email, klik link → akun aktif, redirect ke dashboard
> 7. Kalau link expired: form minta email ulang
> 
> **Use Case 1.2 — Orang Tua Login:**  
> 1. Akses halaman login → input email + password
> 2. Sistem validasi credentials vs database
> 3. Kalau valid: set session, redirect ke dashboard Orang Tua (lihat list anak & pendaftaran mereka)
> 4. Kalau invalid: tampilkan error message, form tetap terbuka
> 5. Orang Tua bisa "Lupa Password" → email reset link berlaku 1 jam
> 
> **Use Case 1.3 — Admin/Guru Login:**  
> 1. Admin akses halaman login khusus (/admin/login)
> 2. Input email + password (sudah terdaftar di sistem oleh Admin sebelumnya)
> 3. Redirect ke dashboard Admin atau Guru sesuai role

**Acceptance Criteria:**

- Email format validated (RFC 5322)
- Password minimum 8 characters, min 1 uppercase letter, min 1 number
- Both consent checkboxes mandatory (cannot submit form if unchecked)
- Email uniqueness checked; duplicate email rejected with clear message
- Verification email sent successfully; link valid 24 hours
- After email verification, login credentials work immediately
- Session timeout after 2 hours of inactivity
- "Forgot Password" flow works; reset link valid 1 hour
- Password reset must invalidate old password immediately
- All 3 roles (orang_tua, guru, admin) can login to respective dashboards
- After logout, session cleared, redirect to login page

**Related BR:** None (basic auth, no complex rules)

---

### F2. Manage Child Profiles (Kelola Profil Anak)

**Priority:** Must Have

**Description:**  
Orang Tua dapat mengelola profil anak-anak mereka di bawah satu akun. Setiap anak adalah record dalam tabel `anak`, bukan akun login terpisah. Anak tidak punya email/password, murni data profil (nama, tanggal lahir, jenjang pendidikan). Fitur ini mengikuti pola Ruangguru ("Kelola Profil Anak", bukan "Kelola Akun Anak").

**Goal:**  
Centralize child management under one parent account; support multi-child enrollment.

**Use Case:**

> **Use Case 2.1 — Tambah Profil Anak Baru:**  
> 1. Orang Tua login → dashboard → klik "Tambah Anak"
> 2. Sistem tampilkan form: Nama Anak, Tanggal Lahir (date picker), Jenjang Terakhir (dropdown: TK / SD / SMP / SMA), Nomor Telepon (opsional), Email Notifikasi (opsional — BR#25: HANYA untuk kirim notifikasi terkait Anak, TIDAK PERNAH untuk login/autentikasi; field ini sengaja beda nama dari `users.email` supaya tidak ambigu)
> 3. Orang Tua input data → klik "Simpan"
> 4. Sistem validasi: nama tidak boleh kosong, tanggal lahir valid & tidak di masa depan, jenjang dipilih
> 5. Kalau valid: data tersimpan, tampil di list anak dengan tombol "Edit" & "Hapus"
> 
> **Use Case 2.2 — Edit Profil Anak:**  
> 1. Orang Tua klik "Edit" di card anak
> 2. Form pre-populated dengan data anak existing
> 3. Edit nama/jenjang → klik "Simpan"
> 4. **Special case:** Jika anak sudah punya ≥1 Pendaftaran aktif (status: menunggu_pembayaran/terdaftar/tertunggak), field nama & jenjang harus read-only (tidak bisa diubah) — untuk mencegah data berubah setelah digunakan di Pendaftaran. Tampilkan label "Dikunci (sudah punya pendaftaran aktif)"
> 
> **Use Case 2.3 — Hapus Profil Anak:**  
> 1. Orang Tua klik "Hapus" di card anak
> 2. Sistem cek apakah anak punya riwayat Pendaftaran (status apa saja)
> 3. Kalau ada riwayat: tampilkan pesan "Anak tidak bisa dihapus karena sudah punya pendaftaran. Hubungi Admin untuk bantuan lebih lanjut"
> 4. Kalau tidak ada riwayat: tampilkan konfirmasi "Yakin hapus?" → hapus record

**Acceptance Criteria:**

- CRUD operations (Create, Read, Update, Delete) work for child profiles
- Child name required (not blank)
- Date of birth validated (must be valid date, not in future, reasonable age range TK-SMA)
- Jenjang (education level) dropdown has all 4 options visible & selectable
- Child with active registration (status: menunggu_pembayaran/terdaftar/tertunggak) cannot be edited (name & jenjang read-only)
- Child with any registration history cannot be deleted; error message shown
- Child without registration history can be deleted; confirmation required before delete
- Multiple children can be created per account
- List of children displays in parent dashboard with action buttons

**Related BR:** Ambiguitas #5 (lock read-only when active registration), BR#16 (duplicate detection admin-side)

---

### F3. Initiate Class Enrollment (Ajukan Pendaftaran)

**Priority:** Must Have

**Description:**  
Orang Tua mengajukan pendaftaran untuk salah satu anak ke kelas pilihan. Flow: pilih Anak → pilih Kelas (filtered sesuai jenjang anak) → pilih Metode Bayar (Lunas / DP+Cicilan) → review → submit. Sistem langsung membuat record Pendaftaran dengan status `menunggu_pembayaran` dan menciptakan tagihan pembayaran pertama.

**Goal:**  
Enable parents to enroll children in classes with chosen payment method; lock quota immediately upon submission.

**Use Case:**

> **Use Case 3.1 — Cek Kelas Tersedia & Filter Jenjang:**  
> 1. Orang Tua login → klik "Cari Kelas" atau "Pendaftaran Baru"
> 2. Sistem tampilkan halaman kelas tersedia (only status: periode aktif, kuota belum penuh)
> 3. Orang Tua harus pilih Anak terlebih dahulu (dropdown anak)
> 4. Setelah anak dipilih, sistem auto-filter kelas sesuai jenjang anak tersebut
> 5. **Special case:** Jika jenjang anak belum diisi (null), tampilkan pesan "Lengkapi data jenjang anak terlebih dahulu di profil anak" → link ke edit profil anak
> 6. Tampilkan daftar kelas: Nama Mapel, Guru, Jenjang, Jadwal (list pertemuan — satu kelas bisa 1-3x/minggu, BR#27), Kuota (sisa), Biaya (Lunas / DP + cicilan)
> 
> **Use Case 3.2 — Validasi Jadwal Bentrok:**  
> 1. Orang Tua pilih kelas A (jadwal_item: Selasa 15:00-16:00 — satu kelas punya 1..n JadwalItem, BR#27)
> 2. Sistem cek apakah anak sudah punya Pendaftaran aktif dengan jadwal bentrok (hari sama + jam beririsan pada SALAH SATU pasangan JadwalItem) di periode yang sama
> 3. Kalau ada bentrok: tampilkan pesan "Jadwal bentrok dengan kelas lain yang sedang aktif. Silakan pilih waktu lain atau batalkan pendaftaran yang ada"
> 4. Kalau tidak ada bentrok: lanjut ke step berikutnya
> 
> **Use Case 3.3 — Pilih Metode Pembayaran & Review:**  
> 1. Orang Tua pilih Kelas X → sistem tampilkan opsi pembayaran:
>    - "Lunas (Bayar Semua)" → total biaya ditampilkan
>    - "DP + Cicilan (Bayar Berkala)" → hanya available kalau kelas punya `biaya_dp` (not null); Orang Tua pilih tenor ≤ `kelas.tenor_maksimum` (BR#28)
> 2. Kalau pilih DP+Cicilan tapi kelas tidak punya `biaya_dp`: error "Metode cicilan tidak tersedia untuk kelas ini"; tenor > `tenor_maksimum` ditolak (CHECK DB `pendaftaran_tenor_konsisten`)
> 3. Orang Tua review: Anak (Nama), Kelas (Nama Mapel, Jadwal), Biaya, Metode Bayar
> 4. Klik "Daftar" → submit
> 
> **Use Case 3.4 — Submit Pendaftaran & Lock Quota:**  
> 1. Sistem buka DB transaction, lock row kelas dengan `lockForUpdate()`
> 2. Re-check kuota masih cukup (kuota_terisi < kuota_max)
> 3. Kalau kuota penuh: error "Kuota kelas sudah penuh, pendaftaran gagal"
> 4. Kalau kuota cukup:
>    - Increment `kuota_terisi` kelas
>    - Buat record Pendaftaran: status = "menunggu_pembayaran"
>    - Buat ≥1 record Pembayaran sesuai metode:
>      * Lunas: 1 row tipe "lunas" dengan total biaya
>      * DP+Cicilan: 1 row tipe "dp" saja; cicilan dibuat satu per satu setelah cicilan sebelumnya lunas (BR#14/BR#24). Tenor disimpan di `pendaftaran.tenor_bulan` = total tagihan termasuk DP (BR#28); nominal cicilan = (biaya_periode − biaya_dp) / (tenor_bulan − 1)
>    - Commit transaction
> 5. Redirect ke halaman detail pendaftaran → tampilkan "Pendaftaran berhasil! Lanjut ke pembayaran"

**Acceptance Criteria:**

- Class list filtered by child's jenjang level (no mismatch shown)
- Child jenjang validation: if null, prompt user to complete profile first
- Schedule conflict detection works: if child has active registration with conflicting times, prevent enrollment
- Payment method display: only "DP+Cicilan" if class has `biaya_dp` (not null)
- Payment method validation: reject DP+Cicilan if `biaya_dp` is null
- Quota locked immediately using `lockForUpdate()` when enrollment submitted
- Quota_terisi incremented atomically within transaction
- At least 1 payment record created immediately upon enrollment
- Enrollment status set to "menunggu_pembayaran"
- Review screen shows all key info: child name, class, schedule, payment method, total amount
- Successful enrollment redirects to enrollment detail page with payment info

**Related BR:** BR#1 (row-lock quota), BR#9 (schedule conflict check), BR#12 (payment method validation), BR#13 (jenjang filter), BR#14 (immediate payment record creation), BR#27 (jadwal multi-pertemuan), BR#28 (tenor), BR#29 (partial unique anti-duplikat)

---

### F4. Dashboard & Role-Based Views

**Priority:** Must Have

**Description:**  
Each role sees a customized dashboard with relevant data. Orang Tua sees their children & enrollments; Guru sees classes they teach; Admin sees key statistics.

**Goal:**  
Quick overview of system state per user role; navigation entry point for all features.

**Use Case:**

> **Use Case 4.1 — Parent Dashboard:**  
> 1. Orang Tua login → dashboard shows:
>    - Greeting: "Halo, [Nama]"
>    - Card list: setiap anak dengan summary (e.g., "Aldi | SD | 2 pendaftaran aktif")
>    - Each child card shows: nama, jenjang, button "Lihat Pendaftaran"
>    - Quick action button: "Tambah Anak", "Cari Kelas Baru"
>    - Table: recent enrollments across all children (child name, class, status, action buttons)
> 
> **Use Case 4.2 — Teacher Dashboard:**  
> 1. Guru login → dashboard shows:
>    - Greeting: "Halo, [Nama Guru]"
>    - List of classes guru teaches this period: Nama Mapel, Jadwal, Jumlah Siswa Terdaftar
>    - Quick action buttons: "Input Presensi", "Input Nilai"
>    - Recent enrollments in those classes
> 
> **Use Case 4.3 — Admin Dashboard:**  
> 1. Admin login → dashboard shows:
>    - Key statistics: Total Siswa Terdaftar, Total Pendaftaran Bulan Ini, Total Pembayaran Lunas, Total Pending
>    - Graph: Enrollment trend bulan terakhir
>    - Recent alerts: Pendaftaran timeout belum diproses? Cicilan overdue?
>    - Quick links: Manage Classes, Manage Teachers, View Reports

**Acceptance Criteria:**

- Each role redirected to correct dashboard upon login
- Orang Tua dashboard shows all their children and enrollments
- Guru dashboard shows only classes they teach
- Admin dashboard shows system-wide statistics
- Quick action buttons navigate to relevant features
- Data reflects real-time state (not cached stale data)
- Dashboard loads within 2 seconds

**Related BR:** None (data visibility, no complex business logic)

---

### F5. Payment Management & Integration

**Priority:** Must Have

**Description:**  
Manage payment records, integrate with Midtrans payment gateway for online processing. Payment tiers: DP (down payment), Cicilan (installment), Lunas (full payment). System automatically creates payment records per BR#14. Webhook from Midtrans updates payment status upon successful transaction.

**Goal:**  
Enable online payment processing; automate payment tracking & status updates.

**Use Case:**

> **Use Case 5.1 — View Payment Status (Parent):**  
> 1. Orang Tua klik "Lihat Detail Pendaftaran" → Halaman Detail Pendaftaran
> 2. Tampilkan Tagihan Aktif (hanya 1 yang sedang jatuh tempo):
>    - Card bertuliskan: Tipe (DP / Cicilan bulan ke-X / Lunas), Jumlah, Jatuh Tempo, Status (pending/success/failed)
>    - Button "Bayar Sekarang" → redirect ke payment page Midtrans
> 3. Cicilan belum jatuh tempo: tidak ditampilkan di halaman ini
> 4. Cicilan sudah lunas: masuk ke section "Riwayat Pembayaran" (tab terpisah)
> 
> **Use Case 5.2 — Process Payment via Midtrans:**  
> 1. Orang Tua klik "Bayar Sekarang" → system redirect ke Midtrans Snap payment page
> 2. Orang Tua pilih kanal pembayaran: QRIS, E-Wallet (GoPay/ShopeePay/LinkAja), Transfer Virtual Account, Kartu Debit/Kredit **bayar penuh**. **Kanal cicilan kartu kredit dan BNPL pihak ketiga (Kredivo, Akulaku, dst) WAJIB DINONAKTIFKAN di konfigurasi Midtrans Snap (BR#23)** — skema cicilan pihak ketiga itu dikelola & dilacak bank/penyedia BNPL sendiri, bertabrakan dengan skema cicilan Siedu sendiri (BR#14, BR#24) dan bikin status "Tertunggak" versi Siedu jadi tidak bermakna
> 3. Setelah pembayaran berhasil, Midtrans kirim callback/webhook ke sistem
> 4. Webhook handler proses:
>    - Validasi signature (Midtrans ServerKey)
>    - Lock payment record with `lockForUpdate()`
>    - Re-check payment status in database
>    - Update payment record: status = "success", payment_date = now, reference_gateway = transaction_id (unique)
>    - Update enrollment status: if all payments lunas → status = "terdaftar"; if dp lunas → generate cicilan bulan berikutnya (BR#14)
> 5. Orang Tua diarahkan kembali ke detail pendaftaran → status berubah, tampilkan notifikasi sukses
> 
> **Use Case 5.3 — Automatic Payment Record Creation (BR#14):**  
> 1. Enrollment disubmit dengan metode "DP + Cicilan, 12 bulan"
> 2. Sistem langsung buat records:
>    - 1 row: tipe "dp", amount = kelas.biaya_dp, due_date = +7 hari
>    - 0 rows cicilan (belum dibuat)
> 3. Setelah DP dibayar sukses (webhook masuk), sistem create:
>    - 1 row: tipe "cicilan", amount = (total_biaya - dp) / 11, due_date = +1 bulan, bulan ke-1
> 4. **✅ Resolved (BR#24):** cicilan bulan berikutnya dibuat **satu per satu**, langsung begitu cicilan sebelumnya dinyatakan lunas (bukan dibuat sekaligus 11 baris di muka). Pembayaran cicilan bersifat **manual** — Orang Tua wajib klik "Bayar Sekarang" tiap bulan; sistem TIDAK menarik dana otomatis dari kartu/token tersimpan (bukan auto-debit/recurring charge). Tidak ada gating tanggal — kalau Orang Tua mau melunasi beberapa cicilan sekaligus di hari yang sama, itu diperbolehkan (tidak ada penalti pelunasan dipercepat).
> 
> **Use Case 5.4 — Failed Payment Handling:**  
> 1. Orang Tua coba bayar via Midtrans, tapi transaksi gagal (saldo tidak cukup, dsb)
> 2. Midtrans kirim webhook dengan status "failed" atau "denied"
> 3. Webhook handler: update payment record status = "failed" (atau "pending" kalau still in process)
> 4. Enrollment tetap di status "menunggu_pembayaran" (tidak otomatis dibatalkan)
> 5. Orang Tua bisa coba bayar lagi di kesempatan selanjutnya (dalam jendela 24 jam, BR#2)

**Acceptance Criteria:**

- Payment records created automatically upon enrollment (BR#14)
- Midtrans webhook successfully updates payment status upon callback
- Payment status visible in parent's enrollment detail page
- Only 1 active due payment displayed (others hidden until due)
- After DP success, next installment generated automatically
- Webhook signature validated (security check Midtrans ServerKey)
- Payment record uses `lockForUpdate()` to prevent race condition
- Failed payment does not immediately cancel enrollment (retry window still open, BR#2)
- Payment reference_gateway must be unique (prevent duplicate webhook processing)
- Parent can retry payment if first attempt failed

**Related BR:** BR#4, BR#7, BR#12, BR#14, BR#17, BR#23, BR#24 (BR#20 tidak berlaku — lihat catatan di tabel Business Rules Summary)

---

### F6. Validate Enrollment (Validasi Pendaftaran)

**Priority:** Must Have

**Description:**  
Server-side validation of enrollment data before committing to database. Checks: schedule conflicts per child, schedule conflicts per teacher, payment method compatibility, quota availability. Validations not implemented as DB constraints are enforced in Controller/service layer.

**Goal:**  
Ensure data integrity & business rule compliance; prevent invalid enrollments reaching database.

**Use Case:**

> **Use Case 6.1 — Schedule Conflict Detection (Child):**  
> 1. Child Aldi has active enrollment: Kelas A (Selasa 15:00-16:00, periode X)
> 2. Orang Tua tries to enroll Aldi ke Kelas B (Selasa 15:30-16:30, periode X)
> 3. System detects: both classes same period, same day, time range 15:30-16:00 overlaps with 15:00-16:00
> 4. Validation fails → error message "Jadwal bentrok dengan kelas [A] yang sedang aktif"
> 
> **Use Case 6.2 — Schedule Conflict Detection (Teacher):**  
> 1. Teacher Pak Budi assigned to Kelas A (Selasa 15:00-16:00, periode X)
> 2. Admin tries to assign Pak Budi to Kelas B (Selasa 15:30-16:30, periode X)
> 3. System detects: overlap on same day, period
> 4. Validation fails → error message "Guru sudah mengajar di kelas lain dengan jadwal bentrok"
> 
> **Use Case 6.3 — Payment Method Validation:**  
> 1. Enrollment submit dengan metode "DP + Cicilan"
> 2. System checks kelas.biaya_dp: if null → validation fails "Kelas ini hanya bisa dibayar lunas"
> 
> **Use Case 6.4 — Quota Validation:**  
> 1. Enrollment submit, kelas sudah penuh (kuota_terisi >= kuota_max)
> 2. Validation fails "Kuota kelas sudah penuh"

**Acceptance Criteria:**

- Child schedule conflict detected correctly (same period, same day, time overlap)
- Teacher schedule conflict detected correctly (same period, same day, time overlap)
- Payment method validation enforces BR#12 (no DP+Cicilan if biaya_dp null)
- Quota validation prevents enrollment when full
- All validations happen before DB transaction commits
- Clear error messages shown to user for each validation failure
- Validation logic testable (service/repository layer, not just Controller)

**Related BR:** BR#1, BR#6, BR#9, BR#12, BR#13

---

### F7. Manage Master Data (Admin: CRUD Mata Pelajaran, Periode, Guru, Kelas)

**Priority:** Must Have

**Description:**  
Admin can create, read, update, delete master data: Mata Pelajaran (subjects), Periode Pendaftaran (academic periods), Guru (teachers), Kelas (classes). Each has validation & constraints.

**Goal:**  
Centralize curriculum, schedule, & resource management; ensure consistency across system.

**Use Case:**

> **Use Case 7.1 — Manage Mata Pelajaran:**  
> 1. Admin → "Data Master" → "Mata Pelajaran" → list tampil
> 2. CRUD operations: Create (form: Nama Mapel, Deskripsi), Read (list), Update, Delete (jika tidak ada kelas aktif pakai mapel ini)
> 
> **Use Case 7.2 — Manage Periode Pendaftaran:**  
> 1. Admin → "Data Master" → "Periode Pendaftaran" → list
> 2. Create: Nama Periode (e.g., "2026-2027 Ganjil"), Tanggal Mulai, Tanggal Selesai, Status (aktif/tertutup)
> 3. Update: bisa ubah tanggal, status (kalau ubah ke "tertutup" → trigger check kuota minimum BR#10)
> 
> **Use Case 7.3 — Manage Guru:**  
> 1. Admin → "Data Master" → "Guru" → list
> 2. Create: Email, Nama Guru (akan generate akun dengan temporary password)
> 3. Update: Nama, kontak
> 4. Delete: kalau tidak ada kelas aktif yang diampu guru ini
> 
> **Use Case 7.4 — Manage Kelas:**  
> 1. Admin → "Data Master" → "Kelas" → list
> 2. Create: Periode, Mata Pelajaran, Guru, Jadwal (Hari + jam mulai + jam selesai), Kuota Max, Kuota Min, Biaya Lunas, Biaya DP (nullable)
> 3. System validate schedule: guru tidak punya jadwal bentrok di periode ini (BR#6)
> 4. Update: bisa ubah semua field kalau kelas belum ada enrollment (atau enum status-nya harus "draft")
> 5. Delete: kalau tidak ada enrollment terkait

**Acceptance Criteria:**

- CRUD operations work for all 4 master data types
- Mata Pelajaran: create/read/update/delete functional
- Periode: date range validation (start < end), status toggle
- Guru: email used as identifier, auto-generate account
- Kelas: schedule conflict validation (BR#6), quota constraints visible
- Cannot delete master data with active references (courses using subject, classes with students)
- All form inputs validated server-side
- Data displayed in sortable/searchable list views

**Related BR:** BR#6 (teacher schedule conflict)

---

### F8. Manage Subjects (Mata Pelajaran)

**Priority:** Must Have  
*Subset of F7, detailed view*

**Description:**  
CRUD Mata Pelajaran (subjects). Each subject has name & optional description.

**Goal:**  
Define curriculum offerings.

---

### F9. Manage Periods & Classes (Admin)

**Priority:** Must Have  
*Subset of F7, detailed view*

**Description:**  
CRUD Periode Pendaftaran (academic periods), CRUD Kelas (class offerings). Critical for setting enrollment windows & availability.

**Goal:**  
Define enrollment calendar & class schedule.

---

### F10. Attendance Tracking (Guru Input)

**Priority:** Should Have

**Description:**  
Guru can record student attendance per class session. Edit allowed within 7 days of initial entry (BR#18); after 7 days, locked (require admin correction).

**Goal:**  
Track student participation; enable progress insights.

**Use Case:**

> **Use Case 10.1 — Guru Input Presensi:**  
> 1. Guru login → "Input Presensi" → pilih Kelas
> 2. Sistem tampilkan list siswa di kelas itu (only enrolled with status "terdaftar" atau "tertunggak")
> 3. Guru checklist: Hadirs (✓), Sakit (S), Izin (I), Alpa (A)
> 4. Input catatan (optional)
> 5. Klik "Simpan" → record presensi tersimpan dengan `created_at` timestamp
> 
> **Use Case 10.2 — Edit Presensi (Within 7 Days):**  
> 1. Guru melihat presensi yang baru diinput 2 hari lalu → bisa ubah (input masih "terbuka")
> 2. Ubah Aldi dari Hadirs (✓) menjadi Sakit (S) → simpan
> 3. Update berhasil; presensi updated_at diperbarui
> 
> **Use Case 10.3 — Presensi Terkunci (After 7 Days):**  
> 1. Guru coba edit presensi 10 hari lalu → form read-only, tidak bisa edit
> 2. Tampilkan: "Edit tidak dapat dilakukan. Untuk perubahan, ajukan permintaan koreksi ke Admin"
> 3. Button "Ajukan Koreksi" → form: Alasan Perubahan → submit (generate ticket untuk Admin review)

**Acceptance Criteria:**

- Attendance records created with timestamp
- Teachers can edit within 7 days of creation
- After 7 days, edit blocked; correction request option available
- Correction requests logged and visible to admin
- Student list filtered to only enrolled students
- Multiple attendance status options (Hadir/Sakit/Izin/Alpa)
- Optional notes field for each attendance record

**Related BR:** BR#18 (7-day edit window)

---

### F11. Learning Progress Tracking (Guru Input)

**Priority:** Should Have

**Description:**  
Guru can record student learning progress/grades. Format depends on grade level (qualitative for TK/SD, quantitative for SMP/SMA). Same 7-day edit rule as attendance (BR#18).

**Goal:**  
Track academic progress; enable parent visibility on learning outcomes.

**Use Case:**

> **Use Case 11.1 — Input Nilai (Quantitative, SMP/SMA):**  
> 1. Guru input nilai untuk siswa SMP/SMA: Nama Siswa, Nilai (0-100), Catatan
> 2. Simpan → record tersimpan dengan timestamp
> 
> **Use Case 11.2 — Input Progres (Qualitative, TK/SD):**  
> 1. Guru input untuk siswa TK/SD: Nama Siswa, Kategori Progres (e.g., "Sudah Menguasai" / "Sedang Belajar" / "Belum Menguasai"), Catatan
> 2. Simpan → record tersimpan

**Acceptance Criteria:**

- Progress records support both quantitative (0-100) and qualitative (category) formats
- Format determined by child's jenjang level
- Edit allowed within 7 days of creation
- After 7 days, edit blocked; correction request option
- Progress visible to parent (in separate tab on enrollment detail page)
- Correction requests logged for admin review

**Related BR:** BR#18 (7-day edit window)

---

### F12. Cancellation & Refund Request (Orang Tua)

**Priority:** Should Have

**Description:**  
Orang Tua can submit cancellation request for an enrollment. Admin reviews & approves/rejects based on BR#19 (refund policy). Refund policy: DP hangus untuk pembatalan inisiatif Orang Tua; refund penuh hanya 4 kasus sistem error.

**Goal:**  
Enable flexible enrollment management; protect both school & parents with clear refund policy.

**Use Case:**

> **Use Case 12.1 — Submit Pembatalan Request:**  
> 1. Orang Tua di halaman Detail Pendaftaran (status: "terdaftar") → klik "Ajukan Pembatalan"
> 2. Sistem tampilkan form: Alasan Pembatalan (dropdown: Berubah pikiran / Pindah les / Lainnya), Deskripsi (text area)
> 3. Orang Tua submit → sistem buat record di `pengajuan_pembatalan` table dengan status "pending_review"
> 4. Orang Tua lihat notifikasi: "Permintaan pembatalan sedang diproses. Admin akan menghubungi Anda dalam 1x24 jam"
> 
> **Use Case 12.2 — Admin Review & Approve:**  
> 1. Admin → "Manajemen Pendaftaran" → tab "Pembatalan Pending" → lihat list request
> 2. Klik request → detail: Siswa, Kelas, Alasan, Tanggal Pendaftaran, Total Biaya, Pembayaran Sudah Lunas (amount)
> 3. Admin review:
>    - Jika alasan "Sistem Error" (memenuhi 4 kasus BR#19): approve → status "approved" + refund type "penuh"
>    - Jika alasan "Inisiatif Orang Tua": approve → status "approved" + refund type "hangus_dp" (DP tidak dikembalikan, cicilan/sisa dikembalikan)
> 4. Klik "Approve" → sistem:
>    - Ubah enrollment status menjadi "dibatalkan_orang_tua"
>    - Generate refund transaction (via Midtrans reverse atau manual transfer)
>    - Kirim email ke Orang Tua: "Pembatalan disetujui. Refund akan dikirim dalam 3-5 hari kerja ke rekening: [last 4 digits]"
>    - Release kuota: kuota_terisi kelas dikurangi

**Acceptance Criteria:**

- Orang Tua can submit cancellation from enrollment detail page
- Form includes reason & optional description
- Cancellation request creates record with "pending_review" status
- Admin can view pending cancellation requests
- Admin can approve/reject with notes
- Approved cancellation updates enrollment status to "dibatalkan_orang_tua"
- Refund rules follow BR#19 (DP hangus for voluntary, full refund for 4 system error cases)
- Email notification sent to parent upon approval
- Quota released upon approval (kuota_terisi decremented)

**Related BR:** BR#19 (refund policy), BR#11 (quota release)

---

### F13. Reports & Analytics (Admin)

**Priority:** Nice to Have

**Description:**  
Admin dashboard with reports: enrollment statistics, payment summary, attendance trends, performance by class.

**Goal:**  
Provide business insights for decision-making.

**Use Case:**

> **Use Case 13.1 — Enrollment Report:**  
> 1. Admin → "Laporan" → "Pendaftaran"
> 2. Filter: Periode, Mata Pelajaran, Status
> 3. Tampilkan: Total pendaftaran, breakdown per status (menunggu_pembayaran, terdaftar, tertunggak, dibatalkan_*)
> 4. Export CSV/PDF
> 
> **Use Case 13.2 — Payment Summary:**  
> 1. Admin → "Laporan" → "Keuangan"
> 2. View: Total pembayaran bulan ini, breakdown per metode, outstanding cicilan
> 3. Identify: Pendaftaran dengan pembayaran overdue > 7 hari (tertunggak)

**Acceptance Criteria:**

- Reports display enrollment counts by status
- Payment reports show total revenue, breakdown by payment type
- Filter by period, subject, payment status works
- Export to CSV/PDF available
- Report data updated daily or on-demand
- Performance acceptable (< 5 seconds load time)

**Related BR:** None (reporting feature, no complex rules)

---

## 5. Business Rules Summary

| # | Rule | Impact |
|---|---|---|
| **1** | Quota locked (kuota_terisi incremented) immediately upon enrollment, using `lockForUpdate()` to prevent race condition | Prevents double-booking |
| **2** | Enrollment auto-cancelled if no DP/full payment within 24 hours → status `dibatalkan_timeout` | Ensures timely payment collection |
| **4** | Late installment gets 7-business-day grace period before escalating to delinquency | Fair collection policy |
| **6** | One teacher cannot teach 2 classes with overlapping schedule in same period | Prevents teacher scheduling conflict |
| **7** | Delinquent installment (>7 days late) → enrollment `dibatalkan_tunggakan`; paid installments not refunded | Enforces payment discipline |
| **9** | One child cannot have 2 active enrollments with overlapping schedule in same period | Prevents schedule conflict |
| **10** | Period closure triggers minimum quota check; unfulfilled classes cancelled + full refunds issued | Protects school viability & parent confidence |
| **11** | Quota released (kuota_terisi decremented) only for `dibatalkan_timeout`, not after "terdaftar" status | Locks slots after payment confirmed |
| **12** | "DP+Cicilan" payment rejected if class has no `biaya_dp` defined | Payment method must match class offering |
| **13** | Child can only enroll in classes matching their jenjang level; jenjang must be completed before enrollment | Ensures age-appropriate placement |
| **14** | At least 1 payment record created immediately upon enrollment; next installment created when DP paid | Immediate billing upon commitment |
| **15** | Cancellation status uses term "orang_tua", not "siswa" (e.g., `dibatalkan_orang_tua`) | Reflects actor change from v1 |
| **16** | Duplicate child detection: exact name match (normalized) + same DOB flagged for admin review (not auto-blocked) | Prevents accidental multi-enrollment, respects admin discretion |
| **17** | Race condition between webhook & scheduled job: both use `lockForUpdate()`, re-check status after lock, no state reactivation if already cancelled | Ensures idempotent payment processing |
| **18** | Attendance & progress editable 7 days from creation; after 7 days, locked (corrections via admin request) | Prevents retroactive tampering, allows correction window |
| **19** | Refund policy: DP hangus for voluntary cancellation; full refund only for 4 system error cases (error txn, wrong amount, wrong account, wrong class provable by system) | Balances school & parent interests |
| **20** | ⚠️ **TIDAK BERLAKU di versi ini** (lihat BR#24) — auto-debit failure handling dicatat sebagai potensi pengembangan lanjutan, bukan diimplementasikan sekarang | Superseded by BR#24 (manual installment model) |
| **21** | Timeout check job runs every 5 minutes (Laravel Scheduler, `withoutOverlapping()` required) | Balance precision vs. server load |
| **22** | Timeout auto-cancellation sends email notification to parent (best-effort, try-catch in job, failure does not rollback business state) | Notifies parent; email failures non-blocking |
| **23** | Dua istilah dibedakan tegas: **"Metode bayar"** (lunas/dp_cicilan, skema tagihan Siedu) vs **"Kanal pembayaran"** (QRIS/VA/e-wallet/kartu, cara bayar satu tagihan di Midtrans). Kanal kartu kredit cicilan & BNPL pihak ketiga (Kredivo, Akulaku) WAJIB dinonaktifkan di Midtrans Snap | Mencegah tabrakan skema cicilan Siedu vs cicilan pihak ketiga; status "Tertunggak" Siedu tetap bermakna |
| **24** | Cicilan bulanan Siedu bersifat **manual** — Orang Tua wajib klik "Bayar Sekarang" tiap bulan; sistem TIDAK auto-debit dari kartu/token tersimpan. Tidak ada gating tanggal (pelunasan dipercepat/bayar beberapa cicilan sekaligus diperbolehkan, tanpa penalti). Referensi: kebijakan cicilan Ruangguru menyiratkan aksi manual pembeli, bukan auto-charge | Konsisten dengan preseden publik; menggantikan asumsi auto-debit di BR#20 |
| **25** | Field tambahan: `users.alamat`, `users.nomor_telepon` (sudah ada sebagai `phone_number`); `anak.email_notifikasi` (opsional, **hanya notifikasi, tidak pernah untuk login** — sengaja beda nama dari `users.email`), `anak.nomor_telepon` (opsional) | Melengkapi data kontak sesuai `User_Flow.txt`, tanpa membuka celah anak bisa login |

---

## 6. UX Flow & Design Notes

### Key User Workflows

#### 6.1 Parent Enrollment Flow (Straightforward Path)

```
Login → Dashboard (see children) 
→ Click "Enroll New Class" 
→ Select Child → System filters classes by jenjang 
→ Select Class (view schedule, quota, price) 
→ Select Payment Method (Lunas / DP+Cicilan) 
→ Review & Confirm 
→ Enrollment created (status: menunggu_pembayaran) 
→ Redirect to Payment Page 
→ Click "Pay Now" → Midtrans gateway 
→ Complete payment 
→ Callback from Midtrans → Status updated to "terdaftar" or next installment 
→ Redirect back to enrollment detail (success)
```

#### 6.2 Enrollment Detail Page (Status-Driven Actions)

**Status: menunggu_pembayaran**
- Show active due payment card ("Bayar Sekarang")
- Button: "Bayar Sekarang" (Midtrans), "Batal" (cancel enrollment)
- Hidden: cicilan belum jatuh tempo, previous payments

**Status: terdaftar**
- Show last successful payment card (past tense)
- Show next due payment (if cicilan model) or "Lunas"
- Button: "Ajukan Pembatalan"
- Tab: "Presensi", "Nilai" (read-only, gurunya yang input)

**Status: tertunggak**
- Warning banner: "Cicilan [Bulan X] telat [N hari]. Tenggang [sisa hari] hari. Tutup dalam [sisa hari] hari → pembatalan otomatis"
- Show overdue payment card
- Button: "Bayar Sekarang", "Ajukan Pembatalan"

**Status: dibatalkan_* (any)**
- No action buttons
- Show cancellation reason & date
- Tab: Read-only "Presensi", "Nilai" (historical data)

#### 6.3 Payment Card Design (Only Show 1 Active Due)

**If DP+Cicilan model:**
- Initially: show 1 DP payment card
- After DP paid: show 1 cicilan card (cicilan bulan ke-1)
- After cicilan N paid: show cicilan bulan ke-(N+1)
- Cicilan belum jatuh tempo: hidden
- Cicilan sudah lunas: moved to "Riwayat Pembayaran" section (separate, collapsed list)

**If Lunas model:**
- Show 1 "Lunas" payment card until paid
- After paid: moved to "Riwayat Pembayaran"

### Design Decisions

1. **Presensi & Nilai in Separate Tab** — Enrollment detail page focuses on payment status; attendance/grades accessed via tab (reduces cognitive load)
2. **Single Active Due Payment** — Prevents parent confusion from seeing multiple future installments (Ruangguru pattern)
3. **Conditional Action Buttons** — Button availability changes per status (Bayar / Ajukan Pembatalan / Nothing) — encourages correct user action
4. **Grace Period Visibility** — Tertunggak status shows countdown (remaining days before auto-cancel) to motivate quick payment

---

## 7. System & Environment Requirements

### Supported Environments

| Aspect | Requirement |
|---|---|
| **Web Browsers** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (no IE support) |
| **Operating Systems** | Windows, macOS, Linux (cloud deployment) |
| **Device Types** | Desktop, Tablet, Mobile (responsive design required) |
| **Mobile Responsiveness** | Full functionality on iPhone 6+ & Android 5.0+ |

### Backend Requirements

| Component | Specification |
|---|---|
| **PHP Version** | 8.3+ |
| **Laravel Version** | 13.x LTS |
| **Database** | MySQL 8.0+ or MariaDB 10.5+ |
| **Web Server** | Nginx 1.18+ or Apache 2.4+ |
| **Message Queue (optional)** | Redis 6.0+ (for job queue if using async processing) |
| **Email Service** | SMTP (SendGrid, Mailgun, or local MTA) for verification & notification emails |
| **Payment Gateway** | Midtrans API (sandbox for testing, production for live) |

### Performance Requirements

| Metric | Target |
|---|---|
| Dashboard Load Time | < 2 seconds |
| Enrollment Submit | < 1 second |
| Payment Processing (webhook) | < 500ms |
| Report Generation | < 5 seconds |
| Concurrent Users | Support 100+ simultaneous sessions without degradation |
| Database Query Time | Average < 200ms, p95 < 1 second |

### Security Requirements

| Requirement | Implementation |
|---|---|
| **HTTPS** | All pages served over HTTPS; redirect HTTP → HTTPS |
| **Authentication** | Laravel Breeze (session-based auth) |
| **Authorization** | Role-based middleware (EnsureUserHasRole) |
| **CSRF Protection** | Laravel token validation on all POST/PUT/DELETE requests |
| **Password Policy** | Minimum 8 characters, 1 uppercase, 1 number; SHA-256 hashing (Laravel Bcrypt) |
| **Rate Limiting** | Login attempts: max 5 per minute per IP; API endpoints: 60 req/min per user |
| **Data Encryption** | Payment data in transit (TLS 1.2+); sensitive fields in database encrypted at-rest (optional, Midtrans handles PCI) |
| **Audit Logging** | All user actions (create/update/delete) logged with timestamp & user ID |
| **Session Timeout** | 2 hours of inactivity; auto-logout |

---

## 8. Assumptions

| Assumption | Rationale |
|---|---|
| **Single Lembaga per Installation** | Siedu deployed once per school; multi-tenant not in scope v1 |
| **Stable Internet Connectivity** | Required for payment gateway & email; no offline mode |
| **Parent Email Access** | Verification & password reset emails must be receivable |
| **Midtrans API Availability** | Payment processing depends on Midtrans uptime; SLA assumed ≥99.5% |
| **Admin Responsible for Data Entry** | Master data (subjects, teachers, classes) entered by admin; no import automation yet |
| **One Parent Account per Family** | No joint custody model; single account holder responsible for all children & payments |
| **No Identity Verification** | System does not validate that account creator is actual parent/guardian (follows Ruangguru model) |
| **Email-Based Notifications** | No SMS/WhatsApp gateway integrated; email is primary notification channel |
| **Yearly Billing Cycle** | Enrollment tied to academic period (tahun ajaran), not calendar year |

---

## 9. Constraints

| Constraint | Impact |
|---|---|
| **Single-Tenant Architecture** | No multi-school capability; each deployment is 1 lembaga only |
| **No Multi-Currency** | Only Indonesian Rupiah (IDR) supported; payment gateway fixed to IDR |
| **Midtrans Dependency** | Payment processing cannot use alternative gateways without backend refactor |
| **No Mobile App** | Web-only; no native iOS/Android app in scope v1 |
| **No Third-Party LMS Integration** | Does not sync with external learning platforms (Moodle, Google Classroom, etc.) — standalone system |
| **Limited Historical Data Retention** | No long-term archival; assume active data kept live (backup strategy separate) |
| **Manual Class Scheduling** | Admin manually creates class; no auto-scheduling based on teacher availability |
| **Fixed Grace Period** | 7-day grace for late installments & 7-day edit window for attendance/grades — not configurable per lembaga |
| **English UI Possible** | UI labels & error messages in Indonesian; no multi-language support |

---

## 10. Dependencies

| Dependency | Purpose | Owner | Risk |
|---|---|---|---|
| **Midtrans API** | Online payment processing | Third-party (Midtrans) | Payment cannot proceed if API down; have fallback manual verification process (out of scope v1) |
| **Email Service (SMTP)** | User verification, password reset, payment notifications | Third-party (SendGrid/Mailgun) or internal MTA | If email fails, users cannot verify account; implement retry logic & admin alert |
| **Laravel 13 Framework** | Web framework & ORM | Community-maintained | Version updates may require code changes; stay current with security patches |
| **MySQL 8.0+** | Primary data store | Third-party (self-hosted or cloud) | Data loss if backup fails; enforce automated daily backups |
| **Web Hosting** | Server infrastructure | Third-party (self-hosted or cloud provider) | Downtime halts all access; ensure 99.5% SLA |
| **Timezone & Locale Data** | Localization (date formats, working days) | System/OS | Must handle Indonesia timezone (UTC+7) correctly for date calculations (grace period, etc.) |

---

## 11. Out of Scope

| Feature | Reason |
|---|---|
| **Multi-Institution (Multi-Tenant)** | V1 is single-lembaga; multi-tenant architecture deferred to v2 |
| **Student Self-Login** | Anak are profiles only; no login account for children (follows Ruangguru model) |
| **Identity/KYC Verification** | No document upload or identity checking for account creation |
| **Joint Custody / Guardian Switching** | One account = one guardian; no switching mechanism if custody changes |
| **Multi-Currency / International Payments** | IDR only; no multi-currency or foreign payment method support |
| **Mobile App (Native)** | Web responsive design sufficient for v1; no iOS/Android apps |
| **LMS Integration** | No sync with Moodle, Google Classroom, etc. |
| **API for Third Parties** | No public API; system is internal only |
| **Biometric Authentication** | Fingerprint/face recognition not supported |
| **WhatsApp/SMS Notifications** | Email-only notification channel in v1 |
| **Class Auto-Scheduling** | Admin manually assigns teachers & schedules |
| **Historical Data Archival** | No automated backup/cold-storage strategy; infra responsibility |
| **Advanced Analytics (AI/ML)** | No predictive analytics or ML-based insights |
| **Student Scholarship/Discount System** | Fixed pricing per class; no discount logic or promo codes |

---

## 12. Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0 | Jan 2026 | Initial PRD (student self-login model) |
| 2.0 | 11 Aug 2026 | Major structural change: Siswa → Orang Tua (parent-centric model); 22 Business Rules defined; Midtrans chosen as payment gateway; detailed use cases added; this PRD document created |
| 2.1 | 26 Aug 2026 | BR#23 ditambahkan (pembedaan Metode Bayar vs Kanal Pembayaran, exclude kanal cicilan pihak ketiga); BR#24 ditambahkan (cicilan manual, BR#20 dinyatakan tidak berlaku); BR#25 ditambahkan (field `alamat`, `nomor_telepon` untuk Orang Tua; `email_notifikasi`, `nomor_telepon` untuk Anak, dari `User_Flow.txt`) |

---

## 13. Approval & Stakeholders

| Role | Name | Sign-Off | Date |
|---|---|---|---|
| Product Owner / Project Lead | [Nama] | ☐ | — |
| Technical Lead | [Nama] | ☐ | — |
| Business Stakeholder / Lembaga Owner | [Nama] | ☐ | — |
| UX/Design Lead | [Nama] | ☐ | — |

---

## 14. Glossary & Definitions

| Term | Definition |
|---|---|
| **Siedu** | Sistem Informasi Pendaftaran Bimbel Ulu (project name) |
| **Bimbel** | Bimbingan Belajar (tutoring/remedial education) |
| **Orang Tua** | Parent/Guardian (primary user; handles enrollment & payment) |
| **Anak** | Child/Student (profile under parent account; no login) |
| **Pendaftaran** | Enrollment (record of child × class binding) |
| **Kelas** | Class/Course offering (subject + teacher + schedule + period) |
| **Periode** | Academic period (e.g., "2026-2027 Ganjil" / first semester) |
| **DP** | Down Payment (partial payment upfront, balance via installments) |
| **Cicilan** | Installment (monthly/periodic payment of remaining balance) |
| **Lunas** | Paid in Full (complete payment upfront) |
| **Metode Bayar** | Skema tagihan Siedu sendiri — `lunas` atau `dp_cicilan` (BR#23a). Dipilih sekali di awal saat Pendaftaran diajukan. |
| **Kanal Pembayaran** | Cara Orang Tua membayar satu tagihan tertentu di Midtrans Snap — QRIS, e-wallet, VA, kartu debit/kredit bayar penuh (BR#23b). Dipilih ulang tiap kali ada tagihan baru; TIDAK sama dengan Metode Bayar. |
| **Jenjang** | Grade/Level (TK, SD, SMP, SMA — determines age-appropriate class eligibility) |
| **Kuota** | Enrollment capacity (max students per class) |
| **Bentrok Jadwal** | Schedule conflict (overlapping time slots) |
| **Presensi** | Attendance record |
| **Nilai** | Grade/Score (quantitative progress) |
| **Progres** | Progress report (qualitative progress, e.g., "mastering" vs "learning") |
| **Tertunggak** | Delinquent (payment overdue) |
| **Dibatalkan** | Cancelled (enrollment terminated) |
| **Webhook** | Server-to-server callback (Midtrans notifies Siedu of payment outcome) |
| **Idempotency** | Property where repeated identical requests produce same result (one-time effect) — prevents duplicate payments |
| **BR** | Business Rule (numbered rule governing system behavior) |
| **F** | Functional Requirement (numbered feature/capability) |

---

**END OF DOCUMENT**

---

**How to Use This PRD:**

1. **For Development Teams:** Share this document + `ATURAN_SISTEM.md` + `KONTEKS_SIEDU_UNTUK_AI_CODING.md` at project kickoff and before each sprint
2. **For Stakeholders:** Sections 1-3 (Executive Summary, Problem, Goals) provide business justification; Sections 4-6 (Features, UX, Scope) show what will be built
3. **For QA/Testing:** Features (Section 4) include "Acceptance Criteria" — use as test checklist
4. **For Technical Leads:** Sections 5-9 (Business Rules, UX Flow, Requirements, Assumptions, Constraints, Dependencies) guide architecture & implementation decisions
5. **For Future Reference:** Keep this document version-controlled alongside codebase; update Revision History whenever requirements change
