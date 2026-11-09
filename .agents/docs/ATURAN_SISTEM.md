# Aturan & Dasar Sistem Siedu (Sebelum Lanjut Koding)

Dokumen ini merangkum seluruh keputusan desain, aturan bisnis, dan celah yang sudah diidentifikasi — supaya jadi acuan tunggal sebelum menulis kode baru. Setiap fitur baru WAJIB dicek dulu terhadap dokumen ini.

---

## 1. Aktor & Apa yang Bisa Dilakukan

### Guest (belum login)
- Lihat Landing Page, Katalog Kelas, About Page
- Registrasi akun (jadi Orang Tua) atau Login

### Orang Tua (menggantikan aktor "Siswa" lama)
**Sudah bisa dilakukan (kode sudah ada):**
- Registrasi akun + centang 2 consent (privasi diri sendiri, wali sah anak)
- Tambah / edit / hapus profil Anak
- Ajukan Pendaftaran (pilih Anak + Kelas + metode bayar)
- Lihat status Pendaftaran semua anak di dashboard
- Edit profil akun sendiri (nama, email, password — bawaan Breeze)

**Belum bisa dilakukan (belum ada kode):**
- Membayar tagihan (belum ada payment gateway)
- Melihat riwayat & status pembayaran (halaman belum dibuat)
- Melihat presensi & nilai anak (halaman belum dibuat)
- Mengajukan pembatalan/refund (Controller belum dibuat)

### Guru
**Sudah bisa dilakukan:**
- Login, lihat kelas yang diampu di dashboard

**Belum bisa dilakukan:**
- Input presensi
- Input nilai/progres belajar

### Admin
**Sudah bisa dilakukan:**
- Login, lihat statistik ringkas di dashboard
- CRUD Mata Pelajaran, Periode Pendaftaran, Data Guru, Kelas (termasuk validasi bentrok jadwal guru)

**Belum bisa dilakukan:**
- Memantau/membatalkan Pendaftaran bermasalah
- Verifikasi pengajuan refund kasus khusus
- Lihat laporan pendaftaran & keuangan

---

## 2. Struktur Data Inti

- **users**: admin / guru / orang_tua. Orang tua punya `privasi_disetujui_at` & `wali_disetujui_at` (timestamp consent, diisi sekali saat registrasi), serta `alamat` & `nomor_telepon` (diisi saat lengkapi informasi akun, BR#25).
- **anak**: profil di bawah akun Orang Tua (1 akun bisa banyak anak). TIDAK punya email/password untuk login. Punya `email_notifikasi` & `nomor_telepon` (opsional, BR#25) — **hanya untuk notifikasi, tidak pernah untuk autentikasi**.
- **kelas**: milik satu mata pelajaran, satu guru, satu periode. Kuota max & min. `biaya_dp` nullable (kalau kosong = kelas cuma bisa dibayar lunas).
- **pendaftaran**: satu Anak + satu Kelas + satu Periode. Status: `menunggu_pembayaran` → `terdaftar` → (`tertunggak` →) `dibatalkan_*`.
- **pembayaran**: tagihan per Pendaftaran (tipe dp/cicilan/lunas).

---

## 3. Business Rules Lengkap (Final)

| # | Aturan |
|---|---|
| 1 | Kuota kelas dikunci (kuota_terisi bertambah) begitu Pendaftaran diajukan, pakai row-level lock (`lockForUpdate`) supaya aman dari race condition. |
| 2 | Pendaftaran dibatalkan otomatis (`dibatalkan_timeout`) kalau dalam 1x24 jam belum ada pembayaran DP/lunas berhasil. |
| 4 | Cicilan yang telat dapat tenggang 7 hari kerja sebelum dianggap tunggakan berat. |
| 6 | Satu guru tidak boleh mengampu 2 kelas dengan jadwal bentrok (hari sama + jam beririsan) di periode yang sama. Dicek manual di Controller, bukan constraint DB. |
| 7 | Cicilan telat >7 hari kerja → Pendaftaran `dibatalkan_tunggakan`; cicilan yang sudah dibayar tidak direfund, cicilan berikutnya batal. |
| 9 | Satu Anak tidak boleh 2 Pendaftaran aktif dengan jadwal bentrok di periode yang sama. Dicek manual di Controller. |
| 10 | Kuota minimum kelas dicek otomatis saat periode ditutup; kalau tidak terpenuhi → kelas dibatalkan, refund penuh ke semua yang terdaftar di kelas itu. |
| 11 | **(Baru)** Kuota WAJIB dilepas otomatis (kuota_terisi dikurangi) saat Pendaftaran `dibatalkan_timeout`. **Tidak berlaku** untuk pembatalan setelah status "terdaftar" (lihat keputusan di bawah). |
| 12 | **(Baru)** Metode bayar "DP + Cicilan" wajib ditolak server-side kalau `kelas.biaya_dp` kosong. |
| 13 | **(Baru)** Kelas yang bisa dipilih dibatasi sesuai `jenjang_terakhir` Anak. Kalau jenjang anak belum diisi, wajib diminta lengkapi dulu sebelum bisa pilih kelas. |
| 14 | **(Baru)** Begitu Pendaftaran diajukan, sistem WAJIB langsung menerbitkan minimal 1 baris `pembayaran` (tipe dp/lunas). Baris cicilan bulan berikutnya dibuat sekaligus **begitu DP dinyatakan berhasil dibayar** (bukan satu-satu per bulan lewat job terpisah, dan bukan dibuat di muka sebelum DP dibayar). |
| 15 | **(Baru)** Status yang merujuk aktor pengaju pakai istilah `orang_tua`, bukan `siswa` (mis. rename `dibatalkan_siswa` → `dibatalkan_orang_tua`). |
| 16 | **(Baru)** Deteksi anak duplikat lintas akun: exact match `nama` (dinormalisasi huruf kecil + spasi rapi) DAN `tanggal_lahir` sama persis → ditandai kandidat duplikat untuk **ditinjau manual Admin**, tidak diblokir otomatis. |
| 17 | **(Baru)** Race condition webhook payment gateway vs scheduled job timeout: KEDUANYA wajib pakai `lockForUpdate()` dalam DB transaction saat memproses Pendaftaran yang sama, dan WAJIB re-cek status setelah lock didapat (bukan pakai data hasil query awal). Kalau webhook masuk setelah job sudah membatalkan (timeout), JANGAN reaktivasi Pendaftaran — proses refund otomatis untuk pembayaran itu. `pembayaran.referensi_gateway` wajib unique untuk mencegah duplikasi proses dari webhook yang terkirim berulang. |
| 18 | **(Baru)** Edit Presensi & Nilai oleh Guru: bebas diedit dalam 7 hari sejak input pertama. Setelah 7 hari, edit langsung terkunci — perubahan harus lewat pengajuan koreksi ke Admin (dicatat: siapa minta, siapa approve, kapan, alasan, nilai sebelum dikoreksi). |
| 19 | **(Baru)** Refund: DP hangus (non-refundable) untuk pembatalan atas inisiatif Orang Tua sendiri. Refund penuh hanya untuk 4 kasus: kesalahan sistem yang menyebabkan error transaksi, salah input nominal transfer, salah transfer rekening, salah pilih kategori/kelas yang bisa dibuktikan sistem. (Selaras dengan kebijakan refund Ruangguru.) |
| 20 | **(TIDAK BERLAKU di versi ini — lihat BR#24)** Cicilan gagal diproses (bukan cuma telat dibayar manual, tapi gagal charge otomatis dari payment gateway — saldo tidak cukup, kartu ditolak, dst): tetap ikut alur tenggang 7 hari kerja (BR#4) sebelum `dibatalkan_tunggakan` (BR#7). Dicatat sebagai potensi pengembangan lanjutan (Midtrans punya fitur tokenisasi untuk auto-charge), TIDAK diimplementasikan sekarang karena BR#24 memutuskan cicilan bersifat manual. |
| 21 | **(Baru)** Scheduled job pengecekan timeout Pendaftaran (BR#2, BR#11) dijalankan **tiap 5 menit** (Laravel Scheduler, `withoutOverlapping()` wajib dipakai supaya run yang lama tidak tumpang tindih dengan run berikutnya). Dipilih sebagai titik tengah antara presisi (1 menit = beban server tinggi untuk manfaat marjinal, karena kuota tetap tampak "penuh" ke pendaftar lain di jendela 1x24 jam) dan kesederhanaan operasional. |
| 22 | **(Baru)** Saat Pendaftaran otomatis `dibatalkan_timeout`, Orang Tua **wajib** dikirim notifikasi email (bukan WA — belum ada integrasi WA gateway). Notifikasi bersifat **best-effort**: dibungkus try-catch di dalam job, kegagalan kirim email TIDAK boleh menggagalkan/rollback perubahan status atau pelepasan kuota (konsisten dengan prinsip di Bagian 6: "notifikasi cuma lapisan pemberitahuan, bukan syarat sah suatu transaksi"). Referensi publik (halaman bantuan Ruangguru) tidak menyebutkan mekanisme notifikasi auto-cancel secara eksplisit — jadi ini murni usulan internal dengan analisis konsekuensi, bukan preseden yang ditiru langsung. |
| 23 | **(Baru — dua istilah harus dibedakan tegas supaya tidak tertukar saat coding):** <br>**(a) "Metode bayar"** = pilihan skema tagihan Siedu sendiri: `lunas` atau `dp_cicilan` (BR#12/13 lama, F5). Ini yang menentukan apakah sistem menerbitkan 1 tagihan atau banyak tagihan bertahap (BR#14/15).<br>**(b) "Kanal pembayaran"** = cara Orang Tua membayar **satu tagihan tertentu** (DP, cicilan bulan ke-N, atau lunas) di Midtrans Snap — QRIS, e-wallet, VA transfer, kartu debit/kredit **bayar penuh**.<br>**Kanal yang WAJIB DINONAKTIFKAN di konfigurasi Midtrans Snap**: kartu kredit *installment/cicilan* dan BNPL pihak ketiga (Kredivo, Akulaku, dst). Alasan: itu skema cicilan yang dikelola & dilacak bank/penyedia BNPL sendiri (Model B), bertabrakan dengan skema cicilan Siedu sendiri (Model A, BR#4/#7/#14/#15/#20) — kalau keduanya aktif bersamaan, Orang Tua bisa mencicil ke bank/Kredivo DAN ke Siedu untuk transaksi yang sama, dan status "Tertunggak" versi Siedu jadi tidak bermakna karena dari sisi Midtrans transaksi sudah tercatat lunas begitu bank/Kredivo membayarkan ke Siedu. |
| 24 | **(Baru)** Cicilan bulanan Siedu bersifat **manual** — Orang Tua wajib membuka dashboard/halaman detail Pendaftaran dan klik "Bayar Sekarang" untuk tiap tagihan cicilan; sistem TIDAK menarik dana otomatis dari kartu/token tersimpan (bukan auto-debit/recurring charge). Sistem hanya bertanggung jawab menerbitkan tagihan (BR#14/15) dan melacak keterlambatan (BR#4/7) — bukan menagih aktif. Referensi publik: halaman promo cicilan Ruangguru menyatakan pembayaran cicilan ke-2 "wajib dilakukan" oleh pembeli dalam 30 hari, dan kalau "tidak dilakukan" maka pembayaran pertama dianggap harga normal (hangus) — bahasa ini konsisten dengan aksi manual pembeli, bukan mekanisme charge otomatis sistem. Konsekuensi: BR#20 (gagal charge otomatis) tidak berlaku di versi ini. |
| 25 | **(Baru — dari `User_Flow.txt`)** Field tambahan dikonfirmasi masuk skema: <br>**`users`**: tambah `alamat` dan `nomor_telepon` (diisi Orang Tua saat lengkapi informasi akun, setelah registrasi awal).<br>**`anak`**: tambah `email_notifikasi` (opsional, **HANYA untuk kirim notifikasi terkait Anak — TIDAK PERNAH dipakai untuk login/autentikasi**, sengaja diberi nama beda dari `users.email` supaya tidak ambigu di kode, konsisten dengan Keputusan desain #2) dan `nomor_telepon` (opsional).<br>**Catatan penamaan penting**: field "kelas" yang disebut di `User_Flow.txt` untuk profil Anak **BUKAN kolom baru** — itu istilah UI/awam untuk tingkat pendidikan Anak, yang di skema **sudah ada** sebagai `anak.jenjang_terakhir` (BR#13). Nama kolom database TETAP `jenjang_terakhir`, JANGAN dinamai `kelas` di migration/Model — kalau dinamai `kelas`, akan bentrok konsep dengan entitas `kelas` (penawaran kelas bimbel) yang sudah ada, dan bisa bikin developer/AI coding salah paham kolom mana yang dimaksud di query/relasi. Label di UI/form boleh tetap tampil "Kelas" ke Orang Tua kalau itu istilah yang lebih familiar. |
| 26 | **(CADANGAN — nomor ini JANGAN dipakai untuk aturan lain sampai terisi)** Pemetaan `transaction_status` Midtrans (`settlement`/`capture`/`deny`/`expire`/`cancel`) → status `pembayaran` & `pendaftaran` internal. Dirumuskan tepat sebelum item roadmap #16 (webhook) dikerjakan. |
| 27 | **(Baru — 5 Sep 2026, revisi skema #1: jadwal & jenjang)** Jadwal kelas bersifat **1:N** lewat tabel `jadwal_item` (hari + jam mulai + jam selesai per pertemuan; 1 kelas bisa 1-3x seminggu — norma bimbel offline Indonesia, referensi: Insan Pelajar paket 4x/8x/12x pertemuan per bulan, Prima Ceria "2x seminggu = 8 pertemuan"). Kolom `hari`/`jam_mulai`/`jam_selesai` PINDAH dari `kelas` ke `jadwal_item`. BR#6 (bentrok guru) dan BR#9 (bentrok anak) dicek pada level `jadwal_item`: periode sama + hari sama + jam beririsan. Presensi mengikat ke `(pendaftaran_id, tanggal_pertemuan, jadwal_item_id)`. **Jenjang pendidikan melekat pada `kelas` (kolom `jenjang`), BUKAN pada `mata_pelajaran`** — satu "Matematika" ditawarkan lintas jenjang lewat baris kelas berbeda (model data klasik Subject-vs-Course, referensi: dba.stackexchange/22336); BR#13 filter langsung `kelas.jenjang = anak.jenjang_terakhir`. |
| 28 | **(Baru — revisi skema #2: tenor cicilan)** `pendaftaran.tenor_bulan` = **total jumlah tagihan termasuk DP** (tenor 3 = DP + 2 cicilan; konsisten PRD UC 5.3: "12 bulan" → DP + cicilan `(total - dp) / 11`). Nominal per cicilan = `(biaya_periode - biaya_dp) / (tenor_bulan - 1)`. `kelas.tenor_maksimum` (nullable) = tenor maksimum yang ditawarkan kelas; Orang Tua memilih `tenor_bulan <= tenor_maksimum` saat daftar. `metode_bayar = dp_cicilan` WAJIB `tenor_bulan` terisi (dijaga CHECK constraint di DB). Referensi: Ruangguru menjual tenor bervariasi per paket (promo cicil 3x), bukan konstanta sistem. |
| 29 | **(Baru — revisi skema #3: anti-duplikat pendaftaran)** **Partial unique index**: `(anak_id, kelas_id, periode_id)` unik HANYA selama status bukan `dibatalkan_*`. Anak yang pendaftarannya dibatalkan (timeout/tunggakan/orang tua/kelas) **BOLEH** daftar ulang ke kelas yang sama di periode yang sama — konsisten BR#2/#11: kuota yang dilepas saat timeout harus bisa dipakai lagi, termasuk oleh anak yang sama (skenario wajar: lupa bayar 24 jam, bukan pelanggaran). Anak dengan pendaftaran aktif (`menunggu_pembayaran`/`terdaftar`/`tertunggak`) tidak bisa duplikat — dijaga DB. Guard tambahan "setelah `terdaftar` tidak boleh daftar ulang" (Keputusan #4) tetap di app/service. |
| 30 | **(Baru — revisi skema #4: bersih-bersih arsip Laravel)** Tidak ada soft delete: kolom `deleted_at` (anak/kelas/pendaftaran) dan `remember_token` (users) DIHAPUS. Kelas pensiun pakai `status = dibatalkan`; Anak/Pendaftaran hard delete dengan guard riwayat (PRD UC 2.3); riwayat bisnis dijamin enum status + `pengajuan_pembatalan` + `pembayaran`. Waktu pengajuan Pendaftaran = `created_at` (kolom `diajukan_pada` dihapus — satu sumber kebenaran untuk jendela 1x24 jam BR#2; dua kolom waktu hanya sah kalau bisa divergen, dan di UC 3.4 keduanya identik secara fisik). |
| 31 | **(Baru — revisi skema #5: enum status)** `dibatalkan_kuota` di-**rename** jadi `dibatalkan_kelas` — sumbernya BR#10 (kelas batal karena kuota minimum tidak tercapai saat periode ditutup → refund penuh); nama baru lebih eksplisit, makna tidak berubah. Nilai `dibatalkan_pelanggaran` **DIHAPUS** — tidak punya aturan transisi di BR#1-25; kalau nanti dibutuhkan, rumuskan BR baru dulu (metodologi Bagian 8). |

---

## 4. Keputusan Atas Ambiguitas (Final, Tidak Perlu Didiskusikan Ulang)

1. **Consent diberikan sekali di awal registrasi**, sebelum profil Anak ada — diterima sadar, konsisten pola Ruangguru.
2. **Tidak ada verifikasi dokumen identitas** untuk memastikan pendaftar akun benar orang tua/dewasa — diterima sadar, konsisten pola Ruangguru (beda dengan DANA Premini yang minta dokumen).
3. **Tidak ada jalur transisi** anak jadi akun mandiri saat dewasa — di luar cakupan versi ini, dicatat sebagai potensi pengembangan lanjutan.
4. **Kuota HANYA dilepas untuk pembatalan sebelum status "terdaftar"** (timeout). Setelah "terdaftar", slot dianggap terpakai permanen untuk periode itu — tidak dibuka lagi untuk siswa baru di tengah jalan.
5. **Profil Anak (jenjang & tanggal lahir) dikunci read-only** begitu Anak itu punya minimal 1 Pendaftaran aktif (menunggu_pembayaran/terdaftar/tertunggak) — mencegah data berubah diam-diam setelah jadi dasar Pendaftaran. **(Belum diimplementasikan ke kode.)**

---
## 5. Alur Presensi, Nilai & Progres Belajar (Guru)

1. **Jadwal & Presensi:**
   - Presensi diinput per sesi pertemuan kelas (`tanggal_pertemuan` + `jadwal_item_id`).
   - Guru menandai status kehadiran siswa (`hadir`, `izin`, `sakit`, `alpa`).
   - Rekap absensi dapat dipantau oleh Orang Tua secara real-time di dashboard mereka.

2. **Batas Waktu Edit (Hybrid BR#18):**
   - Guru memiliki kebebasan edit presensi dan nilai selama **7 hari** sejak tanggal sesi.
   - Setelah 7 hari, data presensi dan nilai terkunci; perubahan harus diajukan melalui mekanisme koreksi persetujuan Admin (`Correction Approvals`).

3. **Catatan Progres Belajar:**
   - Guru menginput penilaian angka beserta deskripsi catatan kualitatif hasil belajar.
   - Catatan deskripsi ditujukan untuk memberikan konteks nyata perkembangan belajar anak kepada Orang Tua.

---

## 6. Integrasi Pembayaran & Webhook (Midtrans & Cicilan Manual)

1. **Model Pembayaran:**
   - Mendukung pembayaran Lunas dan DP + Cicilan.
   - Tagihan cicilan diterbitkan otomatis oleh sistem per bulan (`tenor_bulan`, BR#28).

2. **Mekanisme Cicilan Manual (BR#24):**
   - Sistem **TIDAK** melakukan auto-debit dari kartu/rekening tersimpan.
   - Orang Tua wajib membuka detail tagihan dan menekan tombol "Bayar Sekarang" untuk setiap cicilan.
   - Webhook payment gateway (Midtrans) memperbarui status pembayaran dan pendaftaran secara otomatis.

3. **Keterlambatan Pembayaran (BR#4 & BR#7):**
   - Tagihan yang melewati batas jatuh tempo berstatus tertunggak (`tertunggak`).
   - Sistem mengirimkan pengingat notifikasi tagihan kepada Orang Tua.

---

## 7. Keamanan, Autentikasi & Otorisasi

1. **Akses & Role Guard:**
   - Akses rute dijaga ketat di middleware berdasarkan role pengguna (`admin`, `guru`, `orang_tua`).
   - Siswa tidak memiliki kredensial mandiri; seluruh profil dan pendaftaran dikelola akun Orang Tua (wali sah).

2. **Integritas Profil Anak:**
   - Field `jenjang_terakhir` dan `tanggal_lahir` anak dikunci read-only begitu memiliki pendaftaran aktif.
   - Validasi bentrok jadwal guru (BR#6) dan anak (BR#9) dieksekusi secara ketat di sisi server sebelum pendaftaran/jadwal dibuat.

---

## 8. Metodologi Perubahan & Aturan Baru

1. **Prinsip Spec-Driven Development (SDD):**
   - Setiap perubahan skema, penambahan Business Rules (BR), atau fitur baru wajib dirumuskan terlebih dahulu ke dalam dokumen spesifikasi teknis (`.agents/specs/`).
   - Penomoran BR bersifat urut dan permanen; nomor yang dibatalkan tidak boleh digunakan ulang tanpa konsensus.

2. **Konsistensi Acuan:**
   - Seluruh developer dan agen AI coding wajib menjadikan dokumen `ATURAN_SISTEM.md`, `PRD.md`, dan `DESIGN.md` sebagai acuan tunggal sebelum menulis atau memodifikasi kode.
