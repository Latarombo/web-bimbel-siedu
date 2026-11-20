# Aturan Sistem & Arsitektur Siedu (Single Source of Truth)

Dokumen ini adalah **acuan tunggal arsitektur dan aturan bisnis** bagi pengembang dan agen AI coding. Setiap perancangan fitur baru, penulisan kode, atau perubahan skema database **WAJIB** selaras dengan isi dokumen ini.

---

## 🏛️ PILAR I: KATALOG ATURAN BISNIS DOMAIN (BUSINESS RULES BR#1 – BR#31)

Katalog aturan bisnis ini adalah logika domain murni bimbel yang berlaku independen dari teknologi/framework apapun.

### A. Alur Pendaftaran & Kuota Kelas

| # | Aturan Bisnis | Deskripsi Domain & Ketentuan |
|:---:|:---|:---|
| **BR#1** | **Penguncian Kuota Pendaftaran** | Kuota kelas wajib dikunci (`kuota_terisi` bertambah 1) seketika saat wali murid mengajukan pendaftaran anak. Operasi ini wajib dilindungi proteksi konkurensi tingkat baris (*Row-Level Database Lock*) agar aman dari perebutan kuota (*race condition*). |
| **BR#2** | **Batas Waktu Pembayaran Awal (1×24 Jam)** | Pendaftaran yang baru diajukan memiliki batas waktu 1×24 jam untuk pembayaran awal (DP atau Lunas). Jika melewati batas waktu tanpa pembayaran berhasil, pendaftaran otomatis berubah status menjadi `dibatalkan_timeout`. |
| **BR#10** | **Evaluasi Kuota Minimum Kelas** | Kuota minimum kelas dievaluasi secara otomatis saat periode pendaftaran resmi ditutup. Jika `kuota_terisi < kuota_minimum`, maka penawaran kelas dibatalkan dan status pendaftaran menjadi `dibatalkan_kelas`. Sistem tidak menyediakan fitur refund otomatis internal; penyelesaian administratif/dana diselesaikan secara manual oleh manajemen lembaga di luar sistem. |
| **BR#11** | **Pelepasan Kuota Otomatis** | Kuota kelas WAJIB dilepas kembali (`kuota_terisi` berkurang 1) saat pendaftaran berstatus `dibatalkan_timeout`. Pelepasan kuota ini **hanya berlaku** untuk pembatalan sebelum status mencapai `terdaftar`. Pembatalan sukarela setelah status `terdaftar` tidak melepaskan kuota (slot tetap dialokasikan). |
| **BR#13** | **Kesesuaian Jenjang Pendidikan** | Kelas yang dapat dipilih anak dibatasi secara ketat berdasarkan `anak.jenjang_terakhir` (TK/SD/SMP/SMA). Jika data jenjang anak belum lengkap, sistem wajib mewajibkan pengisian jenjang terlebih dahulu sebelum memilih kelas. |
| **BR#29** | **Pencegahan Pendaftaran Duplikat & Hak Daftar Ulang** | Pendaftaran aktif dijaga oleh *partial unique constraint* pada kombinasi `(anak_id, kelas_id, periode_id)` selama status bukan kelompok `dibatalkan_*`. Anak yang pendaftarannya pernah dibatalkan (karena *timeout* atau pembatalan sah) **berhak mendaftar ulang** ke kelas dan periode yang sama. |

---

### B. Skema Tagihan, Cicilan & Pembayaran

| # | Aturan Bisnis | Deskripsi Domain & Ketentuan |
|:---:|:---|:---|
| **BR#4** | **Masa Tenggang Keterlambatan Cicilan** | Tagihan cicilan bulanan yang melewati tanggal jatuh tempo diberikan masa tenggang toleransi selama **7 hari kerja** sebelum dinyatakan sebagai tunggakan berat. |
| **BR#7** | **Konsekuensi Tunggakan Melebihi Tenggang** | Jika tagihan cicilan belum dibayar setelah masa tenggang 7 hari kerja berakhir, status pendaftaran otomatis berubah menjadi `dibatalkan_tunggakan`. Cicilan yang telah dibayarkan sebelumnya tidak dapat dikembalikan (*non-refundable*), dan sisa tagihan cicilan ke depan dibatalkan. |
| **BR#12** | **Validasi Skema DP + Cicilan** | Metode pembayaran "DP + Cicilan" wajib ditolak oleh validasi sistem jika kelas yang bersangkutan tidak memiliki konfigurasi biaya uang muka (`kelas.biaya_dp` kosong / bernilai nol). |
| **BR#14** | **Penerbitan Baris Tagihan Pembayaran** | Begitu pendaftaran diajukan, sistem menerbitkan 1 baris tagihan awal (tipe `dp` atau `lunas`). Baris tagihan cicilan untuk bulan-bulan berikutnya **diterbitkan secara serentak** seketika tagihan DP diverifikasi lunas oleh sistem (bukan dibuat sebelum DP lunas, dan bukan dibuat mencicil per bulan lewat scheduler). |
| **BR#23** | **Pemisahan Metode Bayar vs Kanal Gateway** | **(a) Metode Bayar:** Skema penagihan internal Siedu (`lunas` atau `dp_cicilan`).<br>**(b) Kanal Pembayaran:** Saluran transfer pada payment gateway (QRIS, VA Bank, E-Wallet, Kartu).<br>⚠️ **Kanal Terlarang:** Fasilitas cicilan kartu kredit bank (*credit card installments*) dan BNPL pihak ketiga (Kredivo, Akulaku, dsb.) **WAJIB DINONAKTIFKAN** pada konfigurasi gateway untuk mencegah bentrok ganda dengan skema cicilan internal Siedu. |
| **BR#24** | **Sifat Pembayaran Cicilan Manual** | Pembayaran cicilan bulanan Siedu bersifat **manual**. Wali murid wajib membuka rincian tagihan dan menekan tombol pembayaran mandiri. Sistem tidak melakukan pendebitan otomatis (*auto-debit*) dari rekening atau kartu wali. |
| **BR#28** | **Formula Tenor & Nominal Cicilan** | Parameter `tenor_bulan` merepresentasikan **total seluruh tahapan tagihan termasuk DP**. Rumus nominal per cicilan: `(biaya_periode - biaya_dp) / (tenor_bulan - 1)`. Wali murid memilih `tenor_bulan <= kelas.tenor_maksimum` saat mendaftar. |

---

### C. Validasi Penjadwalan & Struktur Data

| # | Aturan Bisnis | Deskripsi Domain & Ketentuan |
|:---:|:---|:---|
| **BR#6** | **Anti-Bentrok Jadwal Pengajar (Guru)** | Seorang guru tidak boleh mengampu dua kelas yang memiliki irisan jadwal (hari yang sama dengan rentang jam yang beririsan) pada periode pendaftaran yang sama. Validasi dicek pada level item jadwal (`jadwal_item`). |
| **BR#9** | **Anti-Bentrok Jadwal Belajar Anak** | Seorang anak tidak boleh memiliki dua pendaftaran aktif dengan jadwal belajar yang saling beririsan pada periode yang sama. Validasi dicek pada level item jadwal (`jadwal_item`). |
| **BR#27** | **Relasi 1:N Item Jadwal & Jenjang pada Kelas** | Jadwal belajar per kelas bersifat 1:N melalui entitas `jadwal_item` (hari, jam mulai, jam selesai per pertemuan). Jenjang pendidikan terikat pada entitas `kelas` (kolom `jenjang`), bukan pada `mata_pelajaran`, memungkinkan 1 mata pelajaran diajarkan pada berbagai jenjang melalui penawaran kelas berbeda. |
| **BR#30** | **Model Penghapusan Keras (No Soft Deletes)** | Sistem tidak menggunakan *soft delete* (`deleted_at`). Entitas anak dan pendaftaran yang belum memiliki riwayat transaksi kritis dapat dihapus permanen. Entitas dengan riwayat transaksi diawetkan melalui riwayat status, log pembayaran, dan pengajuan pembatalan. |
| **BR#31** | **Standardisasi Nomenklatur Status Pembatalan** | Pembatalan karena kuota minimum tidak tercapai dibakukan menjadi `dibatalkan_kelas`. Pembatalan otomatis lewat 24 jam adalah `dibatalkan_timeout`. Pembatalan tunggakan cicilan adalah `dibatalkan_tunggakan`. Status tanpa alur bisnis dihapus dari skema. |

---

### D. Penanganan Webhook, Konkurensi & Kebijakan Non-Refund

| # | Aturan Bisnis | Deskripsi Domain & Ketentuan |
|:---:|:---|:---|
| **BR#16** | **Pencegahan Duplikat Anak Intra-Akun & Independensi Lintas Akun** | Sistem melarang pembuatan profil anak duplikat (kombinasi `nama` dan `tanggal_lahir` yang sama) **di dalam satu akun orang tua yang sama**. Antar-akun orang tua yang berbeda bersifat sepenuhnya independen; sistem tidak membatasi atau menandai kesamaan nama/tanggal lahir antar-keluarga berbeda (alur deteksi review admin dihapus demi privasi dan independensi akun). |
| **BR#17** | **Konkurensi Webhook vs Pengecekan Timeout** | Callback webhook gateway dan job pengecekan timeout wajib menggunakan transaksi database dengan row-level lock pada data pendaftaran yang sama, serta melakukan *re-check* status terkini. Jika webhook sukses masuk setelah timeout terjadi, pendaftaran tidak direaktivasi dan ditandai untuk peninjauan admin manual. Kunci idempotensi `pembayaran.referensi_gateway` wajib bersifat unik. |
| **BR#18** | **Batas Waktu Edit Presensi & Nilai Guru (7 Hari)** | Guru memiliki wewenang mengedit data presensi dan nilai dalam jangka waktu **7 hari kalender** sejak tanggal sesi pertemuan. Setelah 7 hari, data terkunci permanen. Perubahan setelah masa kunci wajib melalui pengajuan koreksi dengan persetujuan Admin (*Correction Approval*). |
| **BR#19** | **Peniadaan Fitur Refund & Kebijakan Non-Refundable** | Sistem Siedu **TIDAK MENYEDIAKAN** fitur pengajuan refund mandiri oleh orang tua maupun modul pemrosesan refund di dalam sistem. Seluruh pembayaran DP dan cicilan yang telah berhasil bersifat final dan mengikat (*non-refundable*). Pendaftaran tidak dapat dibatalkan secara sepihak oleh orang tua setelah status `terdaftar`; pelepasan kuota hanya terjadi otomatis jika pembayaran awal melewati batas 1x24 jam (`dibatalkan_timeout`). |
| **BR#21** | **Frekuensi Eksekusi Pemeriksaan Timeout** | Job terjadwal pemeriksaan timeout pendaftaran dieksekusi secara berkala setiap **5 menit** dengan mekanisme pencegahan eksekusi tumpang tindih (*overlap prevention*). |
| **BR#22** | **Notifikasi Pembatalan Timeout** | Saat pendaftaran otomatis dibatalkan karena timeout, sistem mengirimkan notifikasi pemberitahuan via email kepada Orang Tua. Notifikasi bersifat *best-effort*; kegagalan pengiriman email tidak membatalkan perubahan status database. |
| **BR#25** | **Kelengkapan Identitas Akun & Notifikasi Anak** | Akun wali murid wajib dilengkapi `alamat` dan `nomor_telepon`. Profil anak memiliki kolom opsional `email_notifikasi` yang **hanya digunakan untuk menerima tembusan informasi belajar**, tidak pernah digunakan untuk kredensial login. |
| **BR#26** | **Pemetaan Status Transaksi Gateway Midtrans** | Status dari gateway dipetakan sebagai berikut:<br>• `settlement` / `capture` (accept) ➔ `pembayaran.status = 'lunas'` & pendaftaran menjadi `'terdaftar'`.<br>• `pending` ➔ `pembayaran.status = 'menunggu_pembayaran'`.<br>• `expire` / `cancel` / `deny` ➔ `pembayaran.status = 'gagal'`. |

---

## 🏗️ PILAR II: ARCHITECTURE DECISION RECORDS (ADR)

Keputusan arsitektur resmi yang menjadi fondasi teknis implementasi Siedu:

### ADR-001: Next.js 15 App Router & TypeScript Full-Stack
* **Status:** Diterima & Aktif (Menggantikan arsitektur lama berbasis PHP/Laravel).
* **Konteks:** Kebutuhan sistem pembelajaran interaktif dengan performa tinggi, UX instan, dan ekosistem komponen modern.
* **Keputusan:** Menggunakan Next.js 15 (App Router, Server Components, Server Actions) dengan TypeScript ketat (*strict mode*).
* **Konsekuensi:** Logika bisnis yang sebelumnya berada di Controller dialihkan ke *Server Services* (`src/lib/services/`) dan *Server Actions* (`src/app/actions/`).

### ADR-002: Prisma ORM & PostgreSQL (Supabase)
* **Status:** Diterima & Aktif.
* **Konteks:** Membutuhkan integritas data relasional tinggi dengan skema kontrak yang mudah diverifikasi.
* **Keputusan:** Kontrak data dikelola melalui skema Prisma (`src/prisma/contract.prisma`) dengan target database Supabase PostgreSQL.
* **Konsekuensi:** Seluruh query database memanfaatkan Prisma Client dengan *type safety* penuh. Operasi multi-tabel wajib dibungkus dalam `prisma.$transaction`.

### ADR-003: Autentikasi Menggunakan Auth.js v5 (NextAuth) dengan Session JWT
* **Status:** Diterima & Aktif.
* **Konteks:** Memisahkan 3 role akses (`admin`, `guru`, `orang_tua`) dengan perlindungan rute yang efisien.
* **Keputusan:** Menggunakan Auth.js v5 berbasis stateless JWT, diamankan melalui lapisan proteksi proxy/middleware di Next.js.
* **Konsekuensi:** Siswa tidak memiliki kredensial mandiri; seluruh interaksi siswa berada di bawah naungan akun wali murid.

### ADR-004: Penanganan Race Condition via Row-Level Locking Transaksional
* **Status:** Diterima & Aktif.
* **Konteks:** Menjaga kuota kelas (BR#1) dan idempotensi pembayaran webhook (BR#17) dari benturan konkurensi data.
* **Keputusan:** Menggunakan raw SQL `SELECT ... FOR UPDATE` di dalam unit transaksi Prisma (`prisma.$transaction(async (tx) => { ... })`).
* **Konsekuensi:** Operasi pembaharuan kuota terjamin serial dan bebas dari kondisi *lost update* atau *overbooking*.

### ADR-005: Penjadwalan Tugas Otomatis via Vercel Cron
* **Status:** Diterima & Aktif.
* **Konteks:** Menjalankan rutinitas pengecekan timeout 1×24 jam (BR#2, BR#11, BR#21).
* **Keputusan:** Menyediakan route handler `/api/cron/check-timeout` yang dipanggil setiap 5 menit oleh Vercel Cron dan diamankan dengan header `Authorization: Bearer CRON_SECRET`.
* **Konsekuensi:** Tidak memerlukan daemon server antrean mandiri; eksekusi bersifat serverless dan hemat sumber daya.

### ADR-006: Integrasi Gateway Pembayaran Midtrans Snap & Webhook
* **Status:** Diterima & Aktif.
* **Konteks:** Pemrosesan tagihan biaya pendaftaran dan cicilan dengan berbagai metode transfer lokal.
* **Keputusan:** Menggunakan Midtrans Snap untuk antarmuka bayar dan Route Handler `/api/webhooks/midtrans` dengan verifikasi signature hash SHA512.
* **Konsekuensi:** Penerbitan cicilan dan verifikasi status transaksi dilakukan secara *event-driven* seketika callback webhook diterima.

---

## 🔄 PILAR III: SIKLUS HIDUP DATA & STATUS

### A. Mesin Status Pendaftaran (`pendaftaran.status`)

```
[ Pendaftaran Diajukan ]
           │
           ▼
   menunggu_pembayaran ──────(Lewat 24 Jam Tanpa Bayar)──────► dibatalkan_timeout (Kuota Dilepas)
           │
     (Bayar DP/Lunas)
           │
           ▼
       terdaftar
           │
           ├─────────────────(Cicilan Telat > 7 Hari Kerja)──► dibatalkan_tunggakan (Sisa Batal)
           │
           └─────────────────(Kuota Min Kelas Kurang)────────► dibatalkan_kelas
```

### B. Mesin Status Pembayaran (`pembayaran.status`)

```
   menunggu_pembayaran ──────(Midtrans Settlement)──────────► lunas
           │
           ├─────────────────(Expire / Deny / Cancel)───────► gagal
           │
           └─────────────────(Pendaftaran Batal)─────────────► dibatalkan
```

### C. Siklus Validasi Presensi & Nilai Guru

```
   [ Guru Mengisi Presensi & Nilai ]
                 │
                 ▼
      [ Jendela 7 Hari Bebas Edit ] (BR#18)
                 │
           (Hari ke-8+)
                 │
                 ▼
       [ Data Terkunci Permanen ]
                 │
      (Perlu Perbaikan Data)
                 │
                 ▼
   [ Guru Ajukan Form Koreksi ] ──► [ Admin Review & Persetujuan ] ──► [ Data Terkoreksi ]
```

---

## 👥 PILAR IV: PEMETAAN AKTOR & STATUS IMPLEMENTASI KODE

Ringkasan kemampuan aktor yang **faktual telah diimplementasikan** pada basis kode Next.js saat ini:

### 1. Tamu Publik (*Guest*)
* **Aktif:** Landing page beranda, katalog kelas publik, filter kelas berdasarkan jenjang, detail informasi kelas, halaman tentang kami, kontak, dan halaman kebijakan hukum.

### 2. Orang Tua / Wali Murid (*Role: orang_tua*)
* **Aktif:** Registrasi multi-langkah dengan 2 persetujuan hukum (*consent*), login akun, kelola profil anak (tambah/edit/hapus), pengajuan pendaftaran kelas, melihat ringkasan pendaftaran aktif di beranda, jadwal dan absensi kehadiran anak, serta akses rincian tagihan.

### 3. Guru Pengajar (*Role: guru*)
* **Aktif:** Login portal pengajar, dashboard kelas aktif, melihat kalender jadwal mengajar, pengisian lembar presensi pertemuan (hadir/izin/sakit/alpa), serta pengisian nilai evaluasi dan catatan naratif perkembangan belajar siswa.

### 4. Administrator (*Role: admin*)
* **Aktif:** Dashboard analitik metrik bimbel, manajemen data master mata pelajaran, manajemen periode pendaftaran, pengelolaan akun pengajar/guru, serta pembuatan kelas dengan validasi bentrok jadwal guru secara langsung.
