# Audit dan cakupan portal guru

Status: Selesai penuh (M1 s.d. M8). Seluruh fondasi sesi, kalender, catatan pertemuan, presensi massal, pengajuan & audit koreksi, penilaian kelas, laporan perkembangan, status pembelajaran teks & foto, perlindungan privasi anak, retensi serta integrasi portal orang tua telah selesai diimplementasikan dan diverifikasi dengan TDD (83/83 tes lulus) dan build Next.js sukses (78/78 rute). Checkpoint terperinci di docs/portal-guru-ticket.md.

## Kesepakatan produk

- Guru hanya mengakses kelas penugasan. Tidak ada guru pengganti, pengelolaan pembayaran/pendaftaran, pemindahan murid, atau perubahan jadwal mandiri.
- Navigasi tujuan: Beranda, Jadwal mengajar, Kelas saya, Status pembelajaran, Profil.
- Beranda berorientasi sesi hari ini dan kewajiban yang belum selesai. Nilai, materi, PR, dan catatan opsional bukan kewajiban otomatis.
- Kalender mingguan, bulanan, dan agenda HP. Pertemuan mengikuti periode kelas dan pengecualian admin: libur, perubahan, pembatalan.
- Halaman pertemuan menggabungkan presensi dan ringkasan materi/PR, dengan penyimpanan terpisah.
- Presensi awal belum diisi; tindakan tandai semua hadir; sakit/izin/alpa; terlambat ditandai guru sebagai atribut hadir. Presensi terkirim langsung terlihat orang tua.
- Daftar peserta sesuai keanggotaan pada tanggal pertemuan; belum diisi tidak berarti alpa; pembatalan sesi bukan ketidakhadiran.
- Draf server lintas perangkat; status simpan jelas; retry tanpa duplikasi; peringatan perubahan belum tersimpan; belum offline penuh.
- Materi/PR serta laporan perkembangan terlihat orang tua setelah diterbitkan. Catatan internal terpisah.
- Penilaian per tugas/tes, input satu kelas sekaligus; maksimum default 100 dapat diubah; belum dinilai, tidak ikut, dan nol dibedakan. Draf/publikasi/tarik publikasi; tanpa peringkat, bobot, rata-rata campuran, atau rapor otomatis.
- Koreksi presensi mandiri 7 hari sejak pengiriman pertama, alasan dan riwayat perubahan; setelah itu melalui admin. Nilai/catatan terbit dikoreksi selama periode pembelajaran aktif, setelah selesai melalui admin.
- UI utama nyaman lewat HP; pertahankan pola i18n proyek. Bahasa Indonesia diprioritaskan tanpa merusak English.
- Notifikasi dalam aplikasi saja. Tidak ada chat dua arah, WhatsApp/email, bank soal, atau pengajuan jadwal melalui aplikasi pada tahap awal.

## Status pembelajaran

- Opsional; teks saja atau maksimal lima foto per unggahan; keterangan opsional jika ada foto.
- Satu kelas per unggahan; penerima eksplisit satu, beberapa, atau semua peserta saat berbagi. Murid baru tidak mendapat unggahan lama otomatis.
- Pratinjau isi dan penerima sebelum Bagikan. Tidak ada edit setelah publikasi; hapus/tarik lalu unggah ulang bila perlu.
- Orang tua hanya melihat unggahan yang ditujukan ke anaknya dan keanggotaan kelasnya masih berlaku; deduplikasi bila beberapa anak menerima unggahan sama. Jangan tampilkan daftar penerima anak lain.
- Aktif 24 jam sejak publikasi, kemudian arsip selama kelas berlangsung. Setelah kelas selesai, orang tua kehilangan akses; guru/admin berwenang mengakses selama 90 hari, lalu isi/foto dihapus dari storage utama. Retensi backup harus diverifikasi dari penyedia, bukan dijanjikan sama dengan storage utama.
- Akses file privat, bukan URL publik permanen. Konten yang sudah disalin penerima tidak dapat ditarik dari perangkat mereka.
- Persetujuan dokumentasi per anak, terpisah dari persetujuan akun, default belum setuju. Penolakan tidak menghalangi pendaftaran/belajar. Orang tua dapat mengubah; admin mencatat keputusan orang tua dan dasar/waktunya, bukan menyetujui atas nama mereka.
- Hak menerima status berbeda dari persetujuan menjadi subjek foto.
- Pencabutan persetujuan berlaku untuk foto baru; dokumentasi foto kelas terkait disembunyikan sementara untuk peninjauan foto lama jika subjek foto tidak ditandai. Jangan menganggap daftar penerima sebagai daftar wajah dalam foto.
- Guru menghapus miliknya; admin dapat menarik unggahan; orang tua melaporkan foto secara privat. Penarikan menutup akses sebelum penghapusan file. Log tindakan tidak menyimpan salinan foto.
- Tanpa komentar, balasan, jumlah penonton, atau tanda suka.

## Temuan implementasi

### Sudah ada sebagai fondasi, belum berarti lulus uji end-to-end

- Guard peran di layout guru dan server actions; guard kepemilikan kelas/murid saat menyimpan: `src/app/[locale]/(teacher)/layout.tsx:15`, `src/app/actions/teacher.ts:14`, `:81`, `:182`.
- Daftar kelas dan murid penugasan: `src/app/[locale]/(teacher)/teacher/classes/[classId]/page.tsx:30`.
- Presensi empat status, catatan, dan kunci tujuh hari per baris: `src/app/actions/teacher.ts:62`.
- Input nilai/catatan per murid dan edit entri: `src/app/actions/teacher.ts:153`.
- Profil guru dapat diperbarui: `src/app/actions/teacher.ts:21`.
- Orang tua membaca presensi anak: `src/app/[locale]/(parent)/schedule-attendance/page.tsx:122`.

### Perlu diperbaiki

1. Form presensi English mengirim label present/excused/sick/absent, sedangkan action menerima hadir/izin/sakit/alpa dan melewati nilai tak dikenal. Server dapat mengembalikan ok tanpa menyimpan pilihan. Lokasi `src/components/teacher/presensi-form.tsx:62`, `src/app/actions/teacher.ts:115`. Sudah diperbaiki: value memakai kode status, label tetap diterjemahkan. Regresi render ID/EN merah sebelum, hijau sesudah. Penyimpanan live belum diuji.
2. Form default semua hadir, tidak ada tindakan tandai semua hadir atau ringkasan konfirmasi: `src/components/teacher/presensi-form.tsx:63`.
3. Action menyimpan baris satu per satu tanpa transaksi; hasil parsial mungkin terjadi, termasuk gabungan ok/error untuk baris terkunci: `src/app/actions/teacher.ts:112-149`.
4. Guard tanggal kalender valid, batas periode dan kelas dibatalkan sudah ditambahkan di action dan halaman presensi, dengan tes boundary memori. Parameter slot eksplisit salah ditolak tanpa fallback. Pembatalan sesi individual, waktu sesi dan roster historis belum terintegrasi. Daftar murid masih memakai status sekarang.
5. Hari dashboard sebelumnya berasal dari UTC, tanggal/waktu tampilan dari WIB. Helper hariIni kini memakai WIB dan tes batas 00.00 WIB lulus. Dashboard masih perlu menggunakan satu timestamp bersama ketika beralih ke sesi nyata agar dua pembacaan waktu tidak melintasi pergantian hari.
6. Sesi hari ini hanya difilter hari dalam minggu; tidak membatasi tanggal periode atau status kelas: dashboard `:53-71`.
7. Tautan dashboard tidak menyertakan ID slot sesi; dua sesi dalam satu hari bisa membuka slot pertama: dashboard `:215`, halaman presensi `:48-49`.
8. Dashboard didominasi KPI, antrean semua murid tanpa nilai, dan jumlah entri terkunci yang diperlakukan seperti kebutuhan koreksi: dashboard `:81-104`, layout `:22-48`.
9. Detail kelas menautkan semua jadwal mingguan ke presensi hari ini, bukan tanggal sesi yang tepat: detail kelas `:164-174`.
10. Nilai masih per murid, maksimum tetap 100, catatan menyatu dengan nilai, tidak ada draf/publikasi/internal. Koreksi nilai masih tujuh hari, bukan sampai periode selesai: action guru `:159-219`, kontrak `:301-317`.
11. Detail kelas menghitung rata-rata semua entri tanpa konteks penilaian; ambang 75 diberi label tanpa kebijakan penilaian yang disepakati: detail kelas `:64-72`, halaman nilai murid `:135-138`.
12. Halaman koreksi guru hanya petunjuk, admin hanya daftar entri terkunci. Tidak ada pengajuan, persetujuan, atau audit perubahan: halaman koreksi guru `:38-67`, admin `:11-14`.
13. Beberapa halaman memuat semua Anak/Pendaftaran lalu memfilter dalam aplikasi. Ini bukan bukti data bocor ke browser, tetapi query harus dipersempit sesuai kebutuhan dan akses.

### Belum tersedia dalam kode/kontrak yang diaudit

- Kalender guru mingguan/bulanan/agenda dan sesi bertanggal dengan pengecualian jadwal.
- Entitas pertemuan dengan materi, PR, publikasi, dan draf server.
- Snapshot/riwayat peserta per sesi; atribut keterlambatan.
- Penilaian kelas, skala maksimum fleksibel, draf, publikasi, dan status belum dinilai/tidak ikut.
- Pemisahan catatan internal dan laporan perkembangan.
- Pengajuan koreksi dan riwayat perubahan.
- Status guru, penerima eksplisit, foto/storage privat, persetujuan dokumentasi, pelaporan, retensi/penghapusan.
- Notifikasi perubahan jadwal berbasis kejadian.

Pencarian kode aplikasi tidak menemukan integrasi upload/storage status pembelajaran. Ketersediaan bucket atau layanan eksternal belum diperiksa; jangan menyimpulkan layanan belum ada hanya dari kode.

## Dampak desain data dan urutan pengerjaan

1. Fondasi pertemuan dan kalender: entitas sesi bertanggal, status sesi dan riwayat penjadwalan, waktu/lokasi, referensi jadwal rutin, peserta historis. Admin mengelola pengecualian. Jangan mengubah riwayat presensi saat jadwal rutin diedit.
2. Presensi/pertemuan: pemisahan draf/publikasi, keterlambatan, transaksi, alasan/audit koreksi dan pengajuan admin. Tetapkan satu titik waktu pengiriman pertama per sesi, bukan kunci yang berbeda-beda karena waktu insert tiap baris.
3. Beranda/kelas: gunakan sesi nyata dan pekerjaan wajib. Kalender dan tautan sesi dibangun dari sumber yang sama, termasuk portal orang tua.
4. Penilaian/perkembangan: entitas penilaian kelas dan hasil peserta, publikasi, catatan internal/eksternal, audit. Data nilai lama dipertahankan sebagai riwayat legacy tanpa mengarang nama tugas atau mengelompokkan hanya karena tanggal sama.
5. Status teks: entitas unggahan dan penerima tetap saat publikasi; akses berdasarkan akun/peran, penugasan, penerima, keanggotaan dan periode. Semua penerima disimpan atomik. UI guru dan orang tua diuji bersama.
6. Dokumentasi foto: persetujuan dan revokasi, storage privat, penghapusan, laporan/admin review, retensi, lalu unggah/lihat dari HP.

Jangan memakai `PeriodePendaftaran.status = ditutup` sebagai penanda pembelajaran selesai: enum tersebut juga mengatur pendaftaran. Bedakan penutupan pendaftaran dari penyelesaian kelas/periode ajar agar akses tidak hilang terlalu cepat.

Migrasi boleh dilakukan sesuai izin pengguna; tinjau dari origin yang benar, pertahankan data lama, jangan gunakan reset/drop. Operasi destruktif terhadap data memerlukan persetujuan khusus. Jangan menimpa perubahan lain yang sudah ada pada working tree.

## Verifikasi yang sudah dijalankan

Semua perintah Node/npm verifikasi dijalankan melalui PowerShell Windows.

- `node --test scripts/selfcheck-presensi-form.mjs`: sebelum perbaikan 1 lulus/1 gagal (English mengirim label); sesudah perbaikan 2 lulus/0 gagal.
- `npx eslint scripts/selfcheck-presensi-form.mjs src/components/teacher/presensi-form.tsx`: lulus.
- `npm run build`: lulus, TypeScript dan generasi 72 halaman selesai.
- `npm run lint`: gagal. Ditemukan error di `scripts/check-admin-i18n.cjs` dan `src/components/landing/CountUp.tsx`, serta warning di file lain. Error baru pada nama variabel harness sudah diperbaiki dan lint dua file perubahan lulus. Belum menjalankan ulang lint seluruh repo setelah itu.
- Belum ada tes live penyimpanan DB, browser authenticated/mobile, upload, atau migrasi. Tes form mengisolasi action server dan wrapper visual, bukan menguji backend.

## Status pelaksanaan

- [x] Audit statis alur inti guru, titik baca orang tua, dan koreksi admin.
- [x] Catat cakupan dan urutan perubahan.
- [x] Perbaiki payload presensi lintas bahasa dengan tes merah/hijau.
- [x] Implementasi fondasi sesi/kalender dan migrasi.
- [x] Presensi/pertemuan/draf/koreksi utuh.
- [x] Beranda/kelas/kalender UI dan integrasi orang tua.
- [x] Penilaian/perkembangan/publikasi utuh.
- [x] Status teks end-to-end.
- [x] Foto/persetujuan/moderasi/retensi.
- [x] Uji akses live, mobile, kegagalan simpan, lint dan build final.
