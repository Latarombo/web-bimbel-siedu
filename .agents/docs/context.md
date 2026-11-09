Saya sedang mengembangkan sebuah project bernama **SiEdu (Sistem Edukasi)**. Saya ingin kamu memahami konteks project ini terlebih dahulu sebelum membantu saya mengerjakan atau merevisi dokumen PRD.

## 1. Gambaran Umum SiEdu

SiEdu adalah **sistem informasi bimbingan belajar berbasis web** yang ditujukan untuk lembaga bimbel. Tujuan utamanya adalah membantu lembaga bimbel meningkatkan dan mengatur manajemen bimbel, sekaligus memberikan kemudahan bagi orang tua untuk mendaftarkan anaknya ke kelas bimbel dan memantau perkembangan anak.

SiEdu bukan hanya website pendaftaran. Sistem ini juga digunakan untuk mengelola data dan kegiatan bimbel, seperti data orang tua, anak, guru, kelas, jadwal, absensi, nilai, dan hasil belajar.

Target lembaga yang digunakan sebagai konteks project adalah lembaga bimbel akademik yang melayani siswa dari jenjang TK sampai SMA.

## 2. Tujuan Utama

Tujuan SiEdu adalah:

* Membantu meningkatkan manajemen lembaga bimbel.
* Mempermudah pengelolaan data bimbel secara terpusat.
* Mempermudah orang tua dalam mendaftarkan anak ke kelas bimbel.
* Memudahkan orang tua memantau perkembangan anak.
* Membantu guru dalam mengelola absensi, nilai, dan hasil belajar siswa.
* Membantu admin mengelola operasional bimbel.

## 3. Role Pengguna

SiEdu memiliki 3 role utama:

### Orang Tua

Orang tua merupakan pengguna yang dapat:

* Login ke sistem.
* Mengedit profil orang tua.
* Menambahkan profil anak.
* Mengedit profil anak.
* Mendaftarkan anak ke kelas bimbel.
* Melihat kelas yang diikuti anak.
* Melihat jadwal kelas anak.
* Melihat absensi anak.
* Melihat nilai anak.
* Melihat hasil belajar anak berupa deskripsi/catatan dari guru.
* Memantau perkembangan anak.

Anak/siswa **tidak memiliki akun atau login sendiri**. Data anak dikelola melalui akun Orang Tua.

### Guru

Guru dapat:

* Login ke sistem menggunakan email dan password.
* Melihat kelas yang dia ajar.
* Melihat jadwal mengajar.
* Melihat siswa yang berada di kelas yang dia ajar.
* Menginput absensi siswa.
* Menginput nilai siswa.
* Menginput hasil belajar siswa berupa deskripsi/catatan.
* Mengelola data pembelajaran siswa yang berada di kelasnya.

### Admin

Admin dapat:

* Login menggunakan email dan password.
* Mengelola data guru.
* Mengelola data orang tua.
* Mengelola data anak.
* Menambahkan dan mengelola kelas.
* Mengatur jadwal guru.
* Mengelola data yang diperlukan untuk operasional bimbel.
* Melihat data/laporan apabila fitur laporan tersebut sudah tersedia.

## 4. Alur Pendaftaran

Alur utama pendaftaran orang tua adalah:

1. Orang tua login menggunakan Google.
2. Orang tua melengkapi informasi profil, seperti:

   * Nama lengkap
   * Nomor telepon
   * Alamat
3. Orang tua mengisi data anak:

   * Nama lengkap anak
   * Kelas/jenjang anak
   * Nomor telepon anak (opsional)
   * Email anak (opsional)
4. Orang tua memilih kelas bimbel yang tersedia.
5. Orang tua mendaftarkan anak ke kelas tersebut.
6. Proses pembayaran nantinya akan dilakukan melalui payment gateway.
7. Setelah mengikuti kelas, orang tua dapat memantau jadwal, absensi, nilai, dan hasil belajar anak.

Mekanisme kelas adalah: **Admin membuat dan mengatur kelas terlebih dahulu**, kemudian orang tua memilih kelas yang tersedia untuk anaknya.

## 5. Jadwal

Pengelolaan jadwal dilakukan oleh Admin.

* Admin membuat dan mengatur jadwal kelas serta guru.
* Guru dapat melihat jadwal mengajarnya.
* Orang tua dapat melihat jadwal kelas yang diikuti anaknya.

## 6. Absensi, Nilai, dan Hasil Belajar

Guru dapat menginput:

* Absensi siswa.
* Nilai siswa.
* Hasil belajar siswa.

Hasil belajar berupa **deskripsi atau catatan dari guru**, bukan hanya angka.

Orang tua dapat melihat data tersebut untuk memantau perkembangan anak.

## 7. Status Pengerjaan Project

Project saat ini sudah memiliki:

* Login.
* Logout.
* Register/alur pembuatan data pengguna.
* CRUD data.
* Pengelolaan orang tua.
* Pengelolaan anak.
* Pengelolaan guru.
* Pengelolaan kelas.
* Pengelolaan jadwal.
* Pengelolaan absensi.
* Pengelolaan nilai.
* Pengelolaan hasil belajar.
* Fitur untuk masing-masing role sesuai kebutuhan.
* Tampilan website bilingual Bahasa Indonesia dan Bahasa Inggris.

Secara umum, fitur CRUD yang dibutuhkan sudah dibuat.

### Fitur yang belum selesai

Integrasi pembayaran menggunakan **Midtrans belum dibuat**.

Jadi jangan menulis Midtrans sebagai fitur yang sudah selesai atau sudah digunakan pada sistem saat ini. Jika diperlukan dalam PRD, letakkan sebagai fitur yang masih dalam pengembangan atau future development.

### Fitur yang tidak jadi digunakan

Fitur **refund tidak jadi dibuat dalam SiEdu**, sehingga jangan memasukkannya sebagai functional requirement maupun future development kecuali saya meminta secara khusus.

## 8. Teknologi

Teknologi yang digunakan:

* TypeScript
* React
* Next.js
* Tailwind CSS
* Prisma ORM versi 8.0
* PostgreSQL
* Supabase
* Vercel
* Git
* GitHub
* VS Code

Next.js digunakan sebagai framework fullstack dengan App Router.

Database menggunakan PostgreSQL melalui Supabase.

Prisma yang digunakan adalah **Prisma ORM versi 8.0**, bukan "Prisma Next".

## 9. Bahasa dan Tampilan

SiEdu dibuat dalam dua bahasa:

* Bahasa Indonesia
* Bahasa Inggris

Website ditujukan agar mudah digunakan oleh orang tua, guru, dan admin.

Konsep desain SiEdu adalah **Modern & Friendly**.

## 10. Konteks PRD

Saya memiliki PRD lama untuk SiEdu yang masih memiliki beberapa bagian yang tidak sesuai dengan kondisi project saat ini.

Ketika membantu saya merevisi PRD:

* Jangan menganggap semua fitur yang tertulis di PRD lama sudah dibuat.
* Prioritaskan konteks project yang saya berikan di atas.
* Jangan menambahkan fitur yang belum saya sebutkan.
* Jangan menganggap fitur Midtrans sudah selesai.
* Jangan memasukkan refund.
* Pastikan deskripsi produk menggambarkan SiEdu sebagai sistem informasi bimbel untuk **manajemen lembaga dan pendaftaran**, bukan hanya sistem pendaftaran.
* Pastikan fitur Orang Tua, Guru, dan Admin sesuai dengan fungsi yang saya jelaskan.
* Jangan membuat klaim bahwa sistem memiliki fitur yang sebenarnya belum dibuat.
* Gunakan bahasa Indonesia yang natural dan mudah dipahami, seperti laporan siswa SMK jurusan RPL.
* Hindari bahasa yang terlalu formal, terlalu rumit, atau terasa seperti tulisan AI.
* Jika ada bagian yang belum jelas, tanyakan terlebih dahulu daripada membuat asumsi.

## 11. Fokus Utama SiEdu

Hal yang paling ingin ditonjolkan dari SiEdu adalah:

**Pengelolaan/manajemen bimbel dan kemudahan orang tua.**

Jadi ketika membuat deskripsi, latar belakang, tujuan, ruang lingkup, functional requirements, atau bagian PRD lainnya, pastikan dua hal tersebut tetap menjadi inti.

Saya akan memberikan dokumen atau bagian PRD setelah konteks ini. Jangan langsung mengubahnya sebelum memahami isi yang saya berikan. Jika terdapat bagian yang bertentangan dengan konteks di atas, tunjukkan terlebih dahulu bagian yang bertentangan dan jelaskan apa yang perlu disesuaikan.

