# Portal Guru Siedu — Ticket Eksekusi Multi-Sesi

Dokumen ini adalah indeks ticket dan handoff untuk melanjutkan implementasi ketika konteks agent habis. Baca bersama docs/portal-guru-audit.md dan instruksi proyek terbaru. Setelah satu langkah, perbarui checklist dan catatan bukti. Jangan commit atau push tanpa permintaan eksplisit pengguna.

## Konteks proyek

- Repositori: /mnt/d/projek_react/PJBL/siedu (Windows D:\projek_react\PJBL\siedu), branch main, banyak perubahan belum commit milik user. JANGAN commit, push, atau reset tanpa diminta.
- Stack: Next.js 16 App Router (src/app/[locale]/...), Tailwind v4, Prisma Next 8 contract-first (src/prisma/contract.prisma, db.orm.public.<Model>, plugin @prisma/orm-postgres), next-intl (src/i18n/messages/{id,en}), next-auth v5 (role: admin|guru|orang_tua), Supabase Postgres.
- ATURAN KERAS ENV (AGENTS.md): npm dan toolchain Node/Prisma dijalankan lewat PowerShell Windows; git commit juga hanya dari Windows. Git read-only boleh dari WSL. Contoh PowerShell: powershell.exe -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; <cmd>". Agent di WSL hanya edit file. Verifikasi halaman dev dari WSL via IP gateway (cek `ip route`, mis. http://192.168.96.1:3000), bukan localhost.
- Verifikasi minimal tiap milestone: `npm run lint` (beberapa error pre-existing di scripts/check-admin-i18n.cjs dan src/components/landing/CountUp.tsx bukan penambahannya; pastikan TIDAK menambah error baru), `npm run build`, tes khusus milestone.
- Referensi lengkap keputusan produk: docs/portal-guru-audit.md (WAJIB dibaca: bagian "Kesepakatan produk", "Status pembelajaran", "Temuan implementasi", "Dampak desain data dan urutan pengerjaan"). Temuan bernomor 1-13 di dokumen itu adalah daftar bug/lubang yang diketahui.
- Audit lint: error pre-existing ada di scripts/check-admin-i18n.cjs, src/components/landing/CountUp.tsx; warning banyak di file parent/public yang sudah ada. File baru bebas error.

## Status audit (sudah dilakukan)

Audit statis selesai. Perbaikan satu bug sudah lulus tes:
- presensi-form.tsx dulu mengirim label terjemahan (present/excused/...) sebagai value radio; sekarang value = kode status (hadir/izin/sakit/alpa), label tetap diterjemahkan. Tes: scripts/selfcheck-presensi-form.mjs (node --test, render HTML form React via TypeScript transpile; server action dan wrapper visual diisolasi, bukan tes RSC/server action/DB end-to-end; RED dulu untuk EN, GREEN sesudah fix). Pola tes ini bisa ditiru untuk form lain.
- Saat audit awal belum ada migrasi. Kini paket fondasi M1 sudah dibuat dan direview offline (lihat checkpoint); diterapkan setelah persetujuan perintah apply; lihat bukti dan batas verifikasi pada checkpoint.

## Keputusan produk yang TIDAK boleh dilanggar

1. Guru hanya akses kelas yang diampu (cek guruId di setiap query & action). Tanpa guru pengganti, tanpa kelola pembayaran/pendaftaran/murid, tanpa ubah jadwal sendiri.
2. Navigasi guru final: Beranda, Jadwal mengajar (kalender), Kelas saya, Status pembelajaran, Profil.
3. Presensi: awal "belum diisi" (bukan default hadir), tombol "Tandai semua hadir" lalu ubah pengecualian, status hadir/izin/sakit/alpa, terlambat = flag manual pada hadir. Kirim presensi = langsung terlihat orang tua. Belum diisi ≠ alpa. Sesi dibatalkan bukan ketidakhadiran.
4. Presensi dan catatan pertemuan (materi/PR) form satu halaman tapi TERSIMPAN TERPISAH; presensi tidak boleh diblokir materi kosong.
5. Draf tersimpan di server (lanjut dari perangkat lain), status simpan eksplisit (draf/terkirim/gagal), retry tidak menduplikasi (upsert by key unik), peringatan bila meninggalkan form kotor.
6. Koreksi: presensi mandiri 7 hari sejak PENGIRIMAN PERTAMA SESI (satu titik waktu per sesi, bukan per baris), wajib alasan, riwayat perubahan (siapa/kapan/alasan/sebelum/sesudah) tersimpan. Setelah 7 hari lewat admin. Nilai/catatan: koreksi mandiri selama periode pembelajaran AKTIF (jangan pakai PeriodePendaftaran.status; itu status pendaftaran, bukan pembelajaran). Terbit yang keliru bisa ditarik jadi draf (bukan dihapus).
7. Penilaian: entitas penilaian per kelas (nama, tanggal, maksimum default 100 boleh diubah), input nilai seluruh kelas sekali daftar. Nilai kosong = belum dinilai (bukan 0). "Tidak ikut" dibedakan dari 0. Draf/publikasi/tarik publikasi ke ortu. Tanpa bobot, peringkat, rapor otomatis. Data NilaiProgres lama = legacy history, jangan dihapus atau dianggap punya nama tugas.
8. Catatan internal guru vs laporan perkembangan terbit ke ortu = dua hal berbeda; internal tidak pernah tampil ke ortu.
9. Status pembelajaran (WhatsApp-status style): opsional; teks saja ATAU maks 5 foto + keterangan; satu kelas per unggahan; penerima eksplisit saat "Bagikan" (1/beberapa/semua peserta) — murid baru TIDAK dapat unggahan lama; pratinjau sebelum bagikan; tidak bisa edit setelah terbit (hapus + unggah ulang); ortu hanya lihat yang ditujukan ke anaknya DAN keanggotaan kelas masih aktif; aktif 24 jam lalu arsip selama kelas berjalan; setelah kelas selesai ortu kehilangan akses, guru/admin akses 90 hari lalu file dihapus dari storage utama (retensi backup = tanggung jawab penyedia, jangan janjikan sama); storage PRIVAT (bukan URL publik), tampilkan hanya via signed URL/akses server-side; tanpa komentar/balasan/viewer count/like; guru hapus miliknya, admin tarik unggahan, ortu laporkan foto (privat).
10. Persetujuan dokumentasi PER ANAK, terpisah dari persetujuan akun, default BELUM setuju, penolakan tidak menghalangi pendaftaran; ortu ubah sendiri, admin hanya mencatat keputusan ortu (dasar + waktu). Pencabutan: berlaku untuk unggahan baru; foto kelas terkait disembunyikan sementara untuk review (jangan anggap daftar penerima = wajah dalam foto).
11. UI mobile-first, tanpa em-dash, tanpa gradient baru, tanpa label UPPERCASE kecil, tanpa badge dekoratif, tone Indonesia manusiawi. Tombol rounded-lg (ikut Hero), rounded-full hanya ikon bulat/badge/chip. Desain milik user (HeroSection, LoginForm, Footer) jangan disentuh.
12. i18n: kunci baru ke src/i18n/messages/{id,en}/teacher.json (dan parent.json bila tampil ke ortu). Bahasa Indonesia diprioritaskan; setiap kunci baru tetap disediakan pada id/en dalam ticket yang sama agar locale English tidak rusak. Value form selalu kode kanonik, label dari terjemahan.

## Usulan desain data, bukan skema final yang sudah diterapkan

Nama dan kolom berikut adalah rancangan awal agent, bukan API atau simbol yang sudah tersedia. Validasi terhadap kontrak dan kebutuhan ticket sebelum implementasi. Lengkapi waktu kirim pertama presensi, draf, pengajuan koreksi, catatan internal, laporan foto dan log persetujuan yang belum tercakup di daftar ringkas ini. Gunakan snake_case via @map mengikuti kontrak proyek.

1. `SesiPertemuan` (sesi_pertemuan): jadwalItemFk, tanggalPertemuan (date), statusSesi enum (terjadwal|selesai|dibatalkan), jamMulai/jamSelesai (time, snapshot dari jadwal saat dibuat agar perubahan jadwal tidak merusak histori), lokasi?, dibatalkanAlasan?, createdAt/updatedAt. Unique (jadwalItemId, tanggal). Index tanggal.
2. `PesertaSesi` (peserta_sesi): sesiFk, pendaftaranFk, keanggotaan yang berlaku pada tanggal sesi. Jangan membekukan seluruh peserta masa depan ketika kalender dibuat; rekonsiliasi sesi mendatang ketika peserta masuk/keluar, dan pertahankan histori sesi lampau. Data lama tanpa riwayat keanggotaan harus ditandai keterbatasannya, bukan direkonstruksi dengan tebakan. Unique (sesiId, pendaftaranId). Sumber daftar presensi per sesi (menggantikan filter status sekarang).
3. `CatatanPertemuan` (catatan_pertemuan): sesiFk (unique per sesi), materi?, pr?, draf bool default true, diterbitkanPada?, dicatatOleh (guruFk), createdAt/updatedAt.
4. `Presensi` (yang ada) ditambah: sesiPertemuanFk? (nullable, migrate: isi dari jadwalItemId+tanggalPertemuan yang cocok), terlambat bool default false, diperbaruiDari? audit. JANGAN mengubah arti status/status existing.
5. `AuditPerubahan` (audit_perubahan): entitas (presensi|nilai|catatan|status_guru), entitasId, aksi (ubah|tarik|hapus), sebelum?, sesudah?, alasan?, aktor (userFk), createdAt. Untuk koreksi dan penarikan.
6. `Penilaian` (penilaian): kelasFk, nama, tanggal, nilaiMaksimum default 100, draf bool, diterbitkanPada?, dibuatOleh. `HasilPenilaian` (hasil_penilaian): penilaianFk, pendaftaranFk, nilai? , statusHasil enum (belum_dinilai|dinilai|tidak_ikut), catatan?. Unique (penilaianId, pendaftaranId).
7. `StatusGuru` (status_guru): guruFk, kelasFk, teks?, createdAt, dibagikanPada?, dihapusPada?, dihapusOleh?. `StatusGuruPenerima` (status_guru_penerima): statusGuruFk, pendaftaranFk. Foto: `StatusGuruFoto` (status_guru_foto): statusGuruFk, storagePath, keterangan?, urutan.
8. `PersetujuanDokumentasi` (persetujuan_dokumentasi): anakFk, disetujui bool, diperbaruiOleh?, dasarKeputusan?, updatedAt. Index anak.

Urutan milestone: tulis dan jalankan tes gagal untuk perilaku pertama, implementasikan irisan terkecil (kontrak/emit/plan/review bila perlu), uji pada database dev yang targetnya sudah dikonfirmasi, jalankan tes sampai lulus, lint/build, lalu perbarui bukti. Jangan menulis seluruh implementasi sebelum tes. Checklist selesai hanya bila kriteria penerimaan terpenuhi.

M1: SesiPertemuan + PesertaSesi + generator sesi dari JadwalItem dalam rentang periode (fungsi di src/lib/, cron/ondemand), integrasi presensi page/action ke sesi nyata (peserta dari snapshot), perbaiki temuan #4-#7 (validasi tanggal/periode, konsistensi WIB, link ?sesi=). 
M2: CatatanPertemuan + draf/publikasi + transaksi presensi (temuan #3) + audit log + koreksi 7 hari berbasis pengiriman pertama sesi + halaman koreksi guru/admin fungsional.
M3: Kalender guru (mingguan/bulanan/agenda) dari SesiPertemuan, Beranda dari sesi nyata (temuan #8), detail kelas (temuan #9), halaman ortu menampilkan materi/PR terbit.
M4: Penilaian + HasilPenilaian + input massal kelas + draf/publikasi + tarik + integrasi detail kelas & ortu; NilaiProgres jadi legacy.
M5: Catatan internal vs laporan perkembangan (pemisahan publikasi), tampilan ortu.
M6: StatusGuru teks end-to-end (buat, penerima, pratinjau, bagikan, hapus; ortu lihat; akses guard keanggotaan/periode).
M7: PersetujuanDokumentasi + storage privat (Supabase Storage, signed URL, env baru) + foto upload + laporan ortu + tarik admin + retensi 90 hari (cron).
M8: Polishing UI mobile, i18n en menyusul, tes akses live via browser (login guru & ortu), lint+build final.

## Detail teknis penting

- Migrasi: muat skill prisma-8 beserta references/migrations.md dan references/migration-model.md. Baca konfigurasi tanpa menampilkan rahasia. Emit dari kontrak sumber, tentukan origin dari graph/ref aktual, lalu plan dan review semua operasi. Jangan menjalankan scripts/prisma-win.ps1 task plan secara buta: nama dan origin di sana untuk fitur lama. Jangan memakai db update pada database bersama untuk memperbaiki ref. Gunakan jalur migration formal dan --advance-ref db sesuai dokumentasi versi terpasang. Jangan reset/drop atau menghapus paket yang pernah diterapkan. Sebelum apply, konfirmasi target adalah dev, siapkan pemulihan, dan pastikan perubahan destruktif mendapat izin khusus. Izin mengubah database tidak berarti izin menghapus data atau mengubah produksi.
- ORM pitfall: selalu db.orm.public.<Model>; .include('rel', cb); tx tanpa .raw; .where dua kolom (a.lt(b)) BROKEN di rc.8 → filter JS atau db.sql; enum = text+CHECK; @@check pakai nama kolom snake_case; await .all() cukup (tanpa collect baru). ada helper collect() legacy yang masih dipakai codebase, boleh dipakai konsisten dengan file sekitar.
- Server action pattern: guardGuru() di src/app/actions/teacher.ts; zod; pesan error via getTranslations('teacher'); revalidatePath. Ikuti pola file yang ada. Ekspor dari file 'use server' WAJIB fungsi (jangan const/array).
- Waktu: semua hari/tanggal pakai WIB (Asia/Jakarta). Konsistenkan lewat src/lib/hari.ts; perbaiki hariIni() yang pakai UTC (temuan #5) hanya bila pemanggil lain aman (cek dulu pemakainya di services/pembayaran.ts).
- RLS/security: akses file foto via route handler authenticated (app/api/...) yang cek sesi+keanggotaan, bukan public bucket. Route handler boleh di app/api/[locale]-free path (matcher proxy sudah exclude api).
- Tests: tiru scripts/selfcheck-presensi-form.mjs untuk form; scripts/selfcheck-pendaftaran.ts untuk service/DB (referensi pola saja, bukan untuk dijalankan mentah pada DB bersama: script lama memakai cleanup luas. Gunakan database tes terisolasi atau fixture ID unik per run dengan cleanup tepat ID dan finally); scripts/uji-gerbang-http.ts untuk gate login HTTP (butuh dev server jalan). Setiap milestone tambahkan selfcheck.
- JANGAN: menimpa perubahan user di working tree, menambah dependency baru tanpa persetujuan, membuat fitur di luar kesepakatan (chat, notif WA/email, rapor otomatis, peringkat, guru pengganti), menghapus data, hardcode angka statistik dekoratif.
- Gaya output: bahasa Indonesia, tanpa em-dash (pakai koma/s.d.), tanpa gradient/uppercase-kicker/badge dekoratif di UI baru, catat setiap hapus-fake yang terpaksa dilakukan.

## Progres (update setelah tiap milestone)

- [x] Audit statis + bug presensi EN (selfcheck-presensi-form, lint file terkait, build OK). Laporan: docs/portal-guru-audit.md.
- [ ] M1 sesi pertemuan + peserta + integrasi presensi
- [ ] M2 catatan pertemuan + transaksi + audit + koreksi
- [ ] M3 kalender + beranda + detail kelas + ortu materi/PR
- [ ] M4 penilaian massal + publikasi
- [ ] M5 catatan internal vs laporan
- [ ] M6 status teks
- [ ] M7 foto + persetujuan + storage + retensi
- [ ] M8 polishing + uji live

## Ticket dan kriteria penerimaan

Setiap M adalah satu ticket lokal, bukan issue GitHub. Status awal seluruh M1-M8: TODO. Jangan tandai DONE hanya karena kontrak atau komponen sudah ditulis.

### M1: Fondasi sesi dan peserta
- Dependensi: audit dan pemeriksaan target database dev.
- Sesi terbentuk hanya dalam rentang periode; generator berulang tidak menduplikasi sesi.
- Dua slot pada hari sama tetap berbeda; tanggal/hari konsisten WIB.
- Admin dapat mencatat pengecualian libur, perubahan waktu/tanggal/lokasi, dan pembatalan tanpa merusak histori; perubahan guru ditolak.
- Peserta sesi mengikuti keanggotaan tanggal sesi, bukan membekukan daftar murid saat kalender pertama dibuat.
- Backfill presensi lama tidak kehilangan baris atau mengarang histori; catat kasus yang tidak dapat dipetakan.
- Tes: batas periode, tanggal tidak valid, tengah malam WIB, idempotensi, peserta masuk/keluar, perubahan jadwal, dan akses kelas lain ditolak.

### M2: Pertemuan, presensi, draf dan koreksi
- Dependensi: M1.
- Awal belum diisi; tandai semua hadir dan ubah pengecualian; ringkasan sebelum kirim.
- Draf server tidak tampil ke orang tua; kirim presensi atomik dan langsung terlihat penerima yang berhak.
- Materi/PR dapat disimpan dan diterbitkan tanpa menghambat presensi.
- Waktu kirim pertama tidak bergeser karena retry/koreksi. Terlambat hanya untuk hadir.
- Koreksi mandiri membutuhkan alasan; setelah tujuh hari ada pengajuan guru dan keputusan admin dengan audit sebelum/sesudah.
- Tes: kegagalan di tengah penyimpanan rollback, retry tidak ganda, konflik dua tab tidak menimpa diam-diam, batas tujuh hari, catatan kosong, sesi dibatalkan, dan privasi draf.

### M3: Kalender, Beranda dan kelas
- Dependensi: M1-M2.
- Kalender mingguan/bulanan/agenda, Hari ini, navigasi waktu, dan klik langsung ke sesi tepat.
- Beranda menonjolkan sesi terdekat dan presensi wajib tertunda; tidak memaksa nilai/catatan opsional.
- Perubahan/pembatalan terlihat dalam aplikasi; tidak mengirim WA/email.
- Detail kelas menyediakan pertemuan, murid dan akses penilaian; orang tua melihat materi/PR yang sudah terbit.
- Tes: tidak ada jadwal, beberapa kelas, dua sesi sehari, libur, sesi lampau, navigasi HP dan keyboard.

### M4: Penilaian kelas
- Dependensi: M1-M3.
- Input satu daftar kelas; nama/tanggal/skala; nol, kosong dan tidak ikut berbeda.
- Draf/publikasi/tarik publikasi berjalan sampai portal orang tua; nilai selalu ditampilkan dengan skala.
- Edit selama periode ajar aktif diaudit, setelah selesai melalui admin. Tidak mengunci hanya karena pendaftaran ditutup.
- Nilai legacy tetap terbaca tanpa nama tugas rekaan; tidak ada rata-rata campuran atau ambang prestasi sembarang.
- Tes: skala/batas nilai, nilai nol, draf privat, tarik publikasi, pengiriman ulang, akses antar kelas dan periode selesai.

### M5: Perkembangan murid
- Dependensi: M4.
- Detail murid menunjukkan histori kelas terkait, kehadiran, penilaian dan perkembangan.
- Catatan internal berbeda dari laporan orang tua, termasuk pada query/API dan pratinjau.
- Tidak membocorkan catatan internal melalui audit, notifikasi, atau payload halaman orang tua.
- Tes: publikasi/tarik, koreksi, akses guru kelas lain dan pemisahan data internal.

### M6: Status teks
- Dependensi: M1 dan M3; dapat berjalan setelah fondasi stabil tanpa menunggu foto.
- Buat dari menu status atau pertemuan, pilih kelas/penerima, pratinjau, bagikan secara atomik.
- Penerima dibekukan saat publikasi; anak baru tidak mendapat unggahan lama; dua anak penerima satu orang tua tidak menduplikasi status.
- Aktif 24 jam lalu arsip; keluar kelas/kelas selesai menutup akses orang tua; tidak bisa edit setelah terbit.
- Guru menghapus miliknya, admin dapat menarik; tidak ada fitur sosial tambahan.
- Tes: teks kosong ditolak, penerima kosong ditolak, penerima luar kelas ditolak, batas 24 jam, akses setelah keluar/selesai dan penarikan.

### M7: Foto, persetujuan dan retensi
- Dependensi: M6; target storage privat dan biaya/retensi penyedia terkonfirmasi.
- Persetujuan per anak default belum setuju; penolakan tidak memblokir pendaftaran; perubahan memiliki dasar/pelaku/waktu.
- Kamera/galeri, pratinjau, maksimum lima foto, validasi format/ukuran di server, kompresi dan penghapusan metadata lokasi bila relevan.
- File selalu melalui pemeriksaan akses; penarikan/revokasi tidak boleh dilewati lewat URL lama atau cache. Signed URL saja belum membuktikan pencabutan seketika, tentukan mekanisme proxy/cache yang tepat.
- Pencabutan menyembunyikan foto terkait untuk review; laporan orang tua privat; guru/admin menarik dan menghapus sesuai kewenangan.
- Retensi: 24 jam aktif, arsip selama kelas, akses guru/admin 90 hari setelah selesai, purge isi/foto storage utama. Log audit tidak menyimpan ulang konten yang sudah dihapus.
- Tes: bukan penerima ditolak, upload gagal/retry, file yatim dibersihkan, limit lima, revokasi, URL/cache lama, penghapusan gagal dan retry cron, batas retensi. Jangan uji dengan foto anak nyata.

### M8: Pemeriksaan akhir
- Dependensi: M1-M7.
- Lima menu guru sesuai keputusan, layout HP tanpa overflow, label/error/save state jelas dan keyboard dapat digunakan.
- Kunci ID/EN lengkap; value form tetap kanonik.
- Jalankan uji authenticated guru/orang tua/admin memakai akun tes; gunakan vault untuk login browser, jangan meminta password di chat.
- Uji alur sehari guru sampai data orang tua, kegagalan jaringan, draf lintas perangkat, koreksi dan laporan foto.
- Build, lint file berubah dan tes terkait lulus. Lint repo yang masih gagal harus dilaporkan terpisah dengan baseline, bukan dinyatakan lulus.

## Resume setelah konteks habis

1. Baca AGENTS.md, CLAUDE.md, dokumen ini dan docs/portal-guru-audit.md.
2. Jalankan git status dan git branch lagi. Bedakan perubahan user, perubahan fitur, dan artefak generated. Jangan mengasumsikan snapshot di dokumen masih mutakhir.
3. Muat skill yang relevan: nextjs-wsl-frontend, prisma-8 beserta referensinya, test-driven-development; panduan UI saat mengubah tampilan. Baca dokumentasi Next lokal sebelum menulis kode.
4. Pilih ticket TODO pertama yang dependensinya selesai. Periksa simbol dan usages aktual, jangan menyalin nama rancangan sebagai API yang sudah ada.
5. Mulai tes perilaku terkecil, buktikan RED, lalu implementasikan sampai GREEN. Catat bukti secara bertahap agar tidak hilang saat konteks habis.
6. Sebelum pindah ticket atau berhenti, isi checkpoint berikut dengan fakta dan perintah yang benar-benar dijalankan. Jangan mencatat proses background masih berjalan tanpa ID dan cara memeriksanya.

## Checkpoint terakhir

### Hasil terbaru, menggantikan batas verifikasi lama di bawah

- Presensi yang sudah tercatat tetap muncul pada halaman sesi dan bisa dikoreksi sesuai kunci 7 hari walaupun pendaftaran kemudian dibatalkan. Action dan loader memilih pendaftaran milik kelas yang aktif ATAU memiliki presensi pada slot+tanggal tersebut. Pendaftaran batal tanpa bukti presensi tidak otomatis dimasukkan. Tidak membuat PesertaSesi/backfill atau mengarang status keanggotaan lampau.
- RED: murid dengan presensi lama hilang dari form setelah status dibatalkan. GREEN: 26 tes regresi, lint action/halaman/harness, dan build TypeScript + 72 halaman lulus melalui PowerShell Windows.
- PostgreSQL action asli dengan auth/locale/cache stub: 7/7 lulus, laporan docs/test-results/uji-presensi-9fc0120e-3865-49ad-aa39-5c57b25bfc31.json, cleanup=true dan ketidakadaan seluruh fixture diverifikasi. Termasuk koreksi status hadir ke sakit setelah pembatalan pendaftaran, perubahan hari rutin, rollback, concurrent first save, retry, dan penolakan sesi batal. Run pendahulu 6/6 pada uji-presensi-3bf8df61-4b5e-472a-a63a-3f2bf7e07301.json juga cleanup=true.
- Ini hanya pelestarian bukti presensi yang ada, BUKAN roster historis lengkap. Murid aktif baru masih bisa muncul pada tanggal lampau karena interval keanggotaan belum tersedia. PesertaSesi memiliki statusDaftar/createdAt saja, belum provenance dan interval masuk/keluar. Berikutnya perlu rancangan dan migrasi histori yang ditinjau, lalu wiring perubahan status pendaftaran; jangan menggunakan updatedAt sebagai tanggal aktivasi/pembatalan atau mengisi histori dari status sekarang.
- Tidak ada migrasi atau commit. Browser authenticated tetap belum terverifikasi, tidak mencoba vault lagi pada langkah ini. M1 tetap IN PROGRESS.

### Hasil perubahan hari sebelumnya

- Sesi tersimpan tetap valid ketika hari jadwal rutin berubah: action membaca sesi slot+tanggal sebelum validasi hari; halaman, dashboard, dan detail kelas mempertahankan sesi tersimpan. Tanpa sesi tersimpan, tanggal yang tidak cocok dengan hari rutin tetap ditolak. Guard kepemilikan, periode, dan pembatalan tetap berlaku. Ini bukan implementasi hari libur atau reschedule lengkap.
- RED: action menolak sesi tersimpan setelah hari rutin berubah. GREEN: 25/25 tes regresi lulus, termasuk action serta ketiga halaman dengan boundary ORM/auth/waktu terkontrol. ESLint file terkait dan build TypeScript + 72 halaman lulus pada langkah perubahan; suite 25 tes dijalankan ulang dan tetap lulus pada percobaan browser berikutnya.
- Browser nyata membuka /id/teacher/dashboard dan dialihkan ke /login?next=...; belum authenticated. Vault kosong; percobaan awal tidak mengenali origin sesi bernama, percobaan berikutnya pada /id/login menghasilkan save_declined. Jangan meminta simpan login lagi pada turn yang sama atau menyuntik cookie autentikasi buatan. Belum ada bukti submit form/edit melalui HTTP authenticated.
- Blocker verifikasi browser: perlu sesi browser login guru uji yang sah. Histori peserta/provenance, hari libur, serta reschedule lengkap tetap belum selesai. Tidak ada mutasi DB atau commit pada langkah ini.

### Hasil detail kelas sebelumnya

- Detail kelas kini menautkan tiap slot ke tanggal pertemuan berikutnya mulai hari ini WIB, dibatasi periode kelas, melewati sesi dibatalkan, dan menyertakan ?sesi=<jadwalItemId>. Tanggal serta snapshot jam tujuan tampil pada tautan; tombol presensi hari ini hanya muncul bila ada slot valid. Kelas batal/periode selesai tidak menawarkan tautan presensi. Perhitungan memakai planner murni, GET tidak membuat sesi DB.
- RED: dua slot berbeda dan tombol header sebelumnya menuju tanggal hari ini tanpa selector; kelas batal tetap memiliki tautan. GREEN: 23/23 tes regresi lulus via PowerShell (`node --import ./scripts/ts-resolve.mjs --test scripts/selfcheck-presensi-action.mjs scripts/selfcheck-presensi-form.mjs scripts/selfcheck-service-sesi.mjs scripts/selfcheck-sesi.mjs`). ESLint detail kelas dan dua harness lulus; npm run build lulus TypeScript + 72 halaman.
- Tidak ada mutasi DB, migrasi, atau commit pada langkah detail kelas. Server Windows terdeteksi mendengarkan port 3000, tetapi belum ada uji browser authenticated. Tes halaman memakai komponen asli dengan ORM/auth/waktu terkontrol, bukan HTTP. Baseline lint repo sebelumnya tetap 15 error/24 warning.
- Berikutnya: histori peserta/provenance dan pengecualian jadwal. Tautan saat ini belum menyediakan pemilih sesi lampau; perubahan hari jadwal rutin/reschedule belum ditangani penuh. M1 belum selesai.

### Hasil tampilan sebelumnya

- Tampilan dashboard dan presensi kini memakai snapshot jam SesiPertemuan bila tersedia, dengan fallback jadwal rutin hanya untuk sesi yang belum tersimpan. Pilihan slot presensi menyembunyikan sesi dibatalkan. Dashboard menyaring kelas aktif, batas tanggal periode, dan sesi dibatalkan; tautan presensi menyertakan ?sesi=<jadwalItemId>. Hari, tanggal, dan jam dashboard memakai satu instant WIB. GET tetap read-only.
- RED tampilan: header masih 08:00/09:00 ketika snapshot 07:00/07:45; dua slot dashboard memiliki href sama tanpa selector; kelas batal masih menawarkan presensi. GREEN: 20/20 tes melalui `node --import ./scripts/ts-resolve.mjs --test scripts/selfcheck-presensi-action.mjs scripts/selfcheck-presensi-form.mjs scripts/selfcheck-service-sesi.mjs scripts/selfcheck-sesi.mjs`. Tes menjalankan komponen asli dengan boundary auth/ORM dan waktu terkontrol, bukan browser.
- ESLint dua halaman berubah dan harness lulus; npm run build lulus (TypeScript, 72 halaman); git diff --check kedua halaman lulus. npm run lint seluruh repo masih gagal 15 error/24 warning, error di scripts/check-admin-i18n.cjs dan src/components/landing/CountUp.tsx, sesuai baseline. Tidak diperbaiki karena di luar cakupan.
- Batas langkah tampilan: tidak ada mutasi DB atau commit. Detail kelas sudah dibaca tetapi belum diubah, tautannya masih mengarah ke tanggal hari ini tanpa selector; perbaiki berikutnya dengan tanggal valid dalam periode. Perubahan hari jadwal rutin/reschedule belum didukung penuh oleh pembacaan sesi. Histori peserta dan uji browser authenticated masih belum selesai. M1 tetap IN PROGRESS.

### Hasil integrasi action sebelumnya

- Integrasi action kini aktif: `savePresensi` membentuk hanya sesi slot+tanggal yang dikirim saat ada presensi yang bisa ditulis, lalu mengisi `Presensi.sesiPertemuanId`. Seluruh validasi DB, pembentukan sesi, dan insert/update presensi memakai satu transaksi. Lock kelas selaras dengan generator kalender; sesi existing dikunci sebelum pemeriksaan pembatalan. GET/prefetch tidak menulis database.
- Action dan halaman presensi menolak sesi individual dibatalkan; pesan action tersedia ID/EN. Belum ada UI admin pembatalan pada langkah ini. Snapshot jam sesi existing tidak ditulis ulang.
- RED: action belum membentuk sesi (satu write, bukan dua), sesi dibatalkan masih menerima presensi, halaman sesi dibatalkan belum menolak. GREEN: 17 tes regresi lulus. ESLint action/halaman/harness lulus; build TypeScript + 72 halaman lulus melalui PowerShell Windows.
- PostgreSQL: `node --import ./scripts/ts-resolve.mjs scripts/uji-presensi-transaksi-db.mjs --allow-fixtures` lulus 5/5, laporan `docs/test-results/uji-presensi-7932ad07-87c9-40c4-be4e-3f98c0069849.json`. Gagal insert kedua me-rollback sesi DAN presensi; retry menghubungkan dua presensi ke satu sesi; pengulangan tidak duplikat; dua simpan pertama bersamaan berhasil; sesi batal tidak mengubah presensi. Cleanup=true, seluruh fixture diverifikasi terhapus. Auth/locale/cache di-stub, bukan bukti HTTP authenticated.
- Perbaikan transaksi pendahulu juga diuji live 3/3: laporan `uji-presensi-0712ec76-3e93-4661-800f-633fc2d1854f.json` dan `uji-presensi-4fa1729c-adab-41d9-bd3b-878a6f15dad8.json`, masing-masing cleanup=true.
- Batas terbaru: roster masih filter status pendaftaran saat ini, belum PesertaSesi/histori. Aturan legacy koreksi per baris 7 hari dan hasil parsial untuk baris terkunci masih dipertahankan, bukan mekanisme koreksi sesi final. Perubahan jadwal/periode dari jalur admin belum semuanya memakai protokol lock yang sama. Belum uji HTTP atau browser authenticated. Tidak ada migrasi/commit pada langkah ini.
- Berikutnya: histori keanggotaan/provenance sebelum mengganti roster atau backfill. Lengkapi sumber sesi nyata pada tampilan jadwal dan penanganan pengecualian, lalu uji HTTP. Jangan mengklaim M1 selesai.

### Riwayat hasil uji service (sebelum integrasi action)

- Pengguna mengizinkan fixture pada database terkonfigurasi dan penghapusan hanya data uji. Izin ini bukan bukti bahwa lingkungan adalah dev atau backup sudah tersedia.
- `src/lib/service-sesi.ts` kini mengunci baris kelas dengan SELECT FOR UPDATE sebelum membaca sesi tersimpan, di dalam transaksi yang sama. Dua sinkronisasi bersamaan berhasil tanpa duplikasi di PostgreSQL terkonfigurasi.
- RED database: sebelum lock, hanya satu dari dua permintaan sinkronisasi berhasil. GREEN database: rollback insert kedua, dua sinkronisasi bersamaan, retry menjaga snapshot jam, dan penolakan guru lain semuanya lulus (4/4).
- Perintah melalui PowerShell Windows: `node --import ./scripts/ts-resolve.mjs scripts/uji-sesi-db.mjs --allow-fixtures`. Laporan run GREEN bersih: `docs/test-results/uji-sesi-9d5f7869-b63b-4963-97c9-d092700b355f.json`, exit 0, cleanup=true. Fixture guru/periode/mapel/kelas/slot 62/24/25/33/42 sudah dihapus dan ketidakadaannya beserta sesi diverifikasi dengan query.
- Dua run awal mengalami cleanup gagal (FK sesi_pertemuan_jadwal_item_id_fkey). Recovery SQL berparameter dalam transaksi sudah menghapus tepat fixture run c2ff4733 (60/22/23/31/40) dan dc9bf257 (61/23/24/32/41), kemudian ketidakadaan diverifikasi. Tidak ada fixture tersisa dari ketiga run. Urutan ORM sebelumnya sudah sesi lalu slot; penyebab detail perilaku delete ORM belum dipastikan, tidak menyimpulkan salah urutan atau memperluas investigasi.
- Regresi: `node --import ./scripts/ts-resolve.mjs --test scripts/selfcheck-service-sesi.mjs scripts/selfcheck-sesi.mjs scripts/selfcheck-presensi-form.mjs scripts/selfcheck-presensi-action.mjs` lulus 15/15. ESLint service dan tiga harness terkait lulus; `npm run build` lulus TypeScript dan 72 halaman. Lint repo penuh tidak diulang.
- Harness berada di scripts/ yang diabaikan Git (git check-ignore terkonfirmasi). Sebelum menyerahkan lewat commit, pindahkan tes ke lokasi tracked atau beri pengecualian terarah; belum mengubah aturan ignore atau staging.
- Belum diuji: action presensi terhadap PostgreSQL, HTTP authenticated, roster historis, pembatalan sesi individual. Belum memasang service pada UI/action. M1 tetap IN PROGRESS.
- Langkah berikutnya: integrasikan pembentukan sesi dan simpan presensi dalam satu transaksi di jalur mutasi savePresensi, bukan GET/prefetch; lanjutkan fixture DB terisolasi dengan cleanup yang sudah terbukti. Jangan mengulang investigasi cleanup atau menganggap uji service sebagai alur presensi selesai.

### Riwayat checkpoint sebelum uji database

- Ticket aktif: M1 IN PROGRESS, belum memenuhi seluruh kriteria penerimaan.
- Tugas terakhir: service internal sinkronkanSesiKelas di src/lib/service-sesi.ts, memakai tipe ORM nyata dan filter kelas/guru/status serta sesi hanya dari slot kelas terkait. Panggilan ulang berurutan melewati sesi lama tanpa mengubah snapshot jam. Tidak ada mutasi database live dalam tahap ini.
- Tes service: scripts/selfcheck-service-sesi.mjs, jalankan dengan node --import ./scripts/ts-resolve.mjs --test (hook diperlukan untuk import TS tanpa ekstensi). Harness tidak lagi menyembunyikan ERR_MODULE_NOT_FOUND dari dependensi. Fixture September 2026: empat Kamis 3/10/17/24, bukan lima. RED guard kelas batal terbukti sebelum implementasi; GREEN total empat suite: 14 tes lulus. Lint service/harness dan npm run build lulus (72 halaman).
- Batas service: belum dipanggil halaman/action. Seluruh baca/tulis kini memakai db.transaction dan tx.orm; tes kegagalan insert kedua RED (satu baris tersisa) lalu GREEN (rollback memori, retry empat sesi). Total 15 tes lulus; lint service/harness dan build lulus. Ini BUKAN bukti rollback PostgreSQL atau HTTP. Insert bersamaan belum ditangani. Stub siapkanPesertaSesi telah dihapus, snapshot peserta belum diimplementasikan karena histori keanggotaan belum tersedia. Tidak ada pengisian otomatis peserta lampau dari status sekarang.
- Evaluasi konvergensi: jangan menambah pengujian service terisolasi sebagai pengganti integrasi. Jalur berikutnya savePresensi di src/app/actions/teacher.ts, bukan pembayaran/pendaftaran dan bukan loader GET. Pembentukan sesi dan penyimpanan presensi harus berbagi transaksi, bukan memanggil service yang commit sendiri sebelum presensi. Perlu target DB tes terkonfirmasi dan akun uji untuk verifikasi HTTP authenticated beserta state DB sebelum/sesudah. Jangan klaim selesai dari mock atau build; bila prasyarat belum ada, minta satu konfirmasi langsung, jangan mengulang siklus tes memori.
- Langkah lanjutan service: transaksi dan conflict handling ORM dengan tes kegagalan/retry bersamaan di database tes terisolasi; kemudian desain histori keanggotaan/provenance, backfill dan integrasi presensi. M1 tetap IN PROGRESS.
- Artefak handoff: docs/portal-guru-ticket.md dan docs/portal-guru-audit.md.
- Perubahan aplikasi yang sudah ada dari pekerjaan ini: satu perbaikan value presensi di src/components/teacher/presensi-form.tsx; tes scripts/selfcheck-presensi-form.mjs.
- Bukti sebelumnya: tes 2 lulus, lint dua file lulus, build lulus; lint repo masih memiliki error di luar perubahan. Bukan bukti penyimpanan live.
- Database: paket migrations/app/20260917T0932_teacher_session_foundation DITERAPKAN 2026-09-17 10:13 UTC, 1 migrasi/15 operasi berhasil (JSON ok=true). Origin add_pesan_kontak, hash 84974d020d7845e7285162f3fab97665e461868b497e86e6a80e3bb81af2ffbf; target 52f1fa0cb41940ca1fba49354f50d9002f0b0988c802918c6dac20bb268ed641. migration plan/show lulus, 15 operasi additive, tanpa drop/data transform. Riwayat live sebelum apply cocok origin; migration status sesudah apply menunjukkan currentContract=targetContract=52f1fa0… dan paket status applied. Pengguna menyetujui perintah apply melalui approval tool. Identitas lingkungan sebagai dev dan backup/pemulihan BELUM terbukti; keluaran host gagal, jangan mengklaim sebaliknya. Jangan lakukan mutasi tambahan sebelum memastikan target/pemulihan.
- Proses background dari ticket: tidak ada.
- Blocker yang diketahui: konfigurasi storage privat dan retensi backup belum diverifikasi. Ini memblokir rilis foto, bukan persiapan M1.
- Perubahan lanjutan: src/lib/rencana-sesi.ts menghasilkan rencana tanggal dalam periode inklusif, menolak tanggal semu/rentang terbalik, melewati kunci slot+tanggal yang sudah ada; BELUM dipanggil service/halaman. src/lib/hari.ts memakai WIB dan parameter Date opsional; helper pembayaran bernama sama adalah fungsi lokal terpisah, tidak diubah.
- Tes baru scripts/selfcheck-sesi.mjs: RED sebelum tiap perilaku; gagal karena planner belum tersedia, tanggal semu tidak ditolak, kunci sesi lama dibuat ulang. Tes hari memakai Date terinjeksi, bukan jam server nyata. GREEN akhir: node --test scripts/selfcheck-sesi.mjs scripts/selfcheck-presensi-form.mjs, 6/6 lulus melalui PowerShell.
- Verifikasi terkini: eslint tiga file baru/diubah lulus; npm run build lulus (TypeScript + 72 halaman). npm run lint gagal 15 error/24 warning; error di scripts/check-admin-i18n.cjs dan src/components/landing/CountUp.tsx, tidak ada pada file M1.
- Review batas skema: kontrak awal belum memuat tanggal asal yang stabil saat reschedule, lokasi/riwayat perubahan jadwal, interval keanggotaan, atau provenance backfill lama. PesertaSesi.statusDaftar bukan bukti histori keanggotaan. Jangan mengisi histori dari status pendaftaran sekarang. Paket 15 operasi ini fondasi saja, bukan migrasi M1 lengkap.
- Langkah berikutnya: konfirmasi database terkonfigurasi memang dev dan mekanisme pemulihan sebelum mutasi berikutnya. Lengkapi desain histori/pengecualian dan backfill dengan tes, service simpan idempoten (uji race di DB), peserta historis, guard kelas/sesi batal, serta integrasi halaman/action presensi. Planner murni lulus bukan bukti idempotensi DB. Jangan menandai M1 selesai atau melanjutkan M2.
- Catatan runtime: marker DB kini cocok kontrak emitted; tes CRUD/model sesi dan integrasi presensi belum dijalankan. Tidak ada backfill/generator DB dijalankan. Ref db di graph masih lama, gunakan --from 20260917T0932_teacher_session_foundation untuk rencana forward; jangan edit paket yang telah diterapkan.
- scripts/db-dev.ps1 diperbaiki menjadi wrapper read-only migration status, tanpa parsing .env manual atau shortcut apply, dengan exit code yang dipropagasikan. Nama file bukan bukti lingkungan dev.
- Guard M1 tambahan: src/app/actions/teacher.ts menolak tanggal semu, tanggal di luar periode, dan kelas dibatalkan. Halaman attendance menerapkan aturan sama serta 404 untuk ?sesi= eksplisit tidak cocok; tidak fallback ke slot pertama. tanggalValid ditambahkan di src/lib/hari.ts; pesan error ID/EN tersedia di teacher.json.
- Tes scripts/selfcheck-presensi-action.mjs menjalankan action dan halaman asli yang ditranspilasi, dengan auth/Next/ORM diganti boundary memori. RED terbukti: luar periode dan kelas batal menghasilkan sukses sebelum fix, tanggal semu salah pesan, halaman tidak menolak URL invalid. GREEN: 12/12 pada node --test scripts/selfcheck-sesi.mjs scripts/selfcheck-presensi-form.mjs scripts/selfcheck-presensi-action.mjs. Kontrol positif: pendaftaran ditutup tetap menerima tanggal ajar yang valid. Guard kelas lain/slot salah juga diuji.
- Verifikasi setelah guard: lint empat file TS/TSX/MJS terkait lulus, npm run build lulus (TypeScript + 72 halaman). Lint repo tidak diulang pada tahap guard, baseline sebelumnya tetap 15 error/24 warning. Belum uji HTTP authenticated atau PostgreSQL; tes memori bukan bukti transaksi/constraint/penyimpanan live.
- Sisa khusus guard: pembatalan SesiPertemuan individual belum dipakai, roster masih status saat ini, validasi input nilai belum dicakup tahap ini. Jangan menyebut integrasi sesi selesai. Langkah berikutnya tetap service sesi/peserta dengan histori dan uji DB terisolasi, bukan pindah fitur.

Template pembaruan checkpoint:
- Ticket/status:
- Perubahan file:
- Tes RED (perintah + kegagalan yang relevan):
- Tes GREEN/lint/build (perintah + hasil):
- Migrasi (path, origin, target dev, diterapkan atau belum):
- Batas verifikasi dan blocker:
- Langkah berikutnya yang spesifik:
- Commit: tidak dilakukan kecuali diminta pengguna.
