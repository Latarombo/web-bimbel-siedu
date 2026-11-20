# Master Capability Map — Siedu System Architecture

> **Dokumen Induk Dekomposisi Modul (SDD Phase 0)**  
> **Status:** Active & Mengikat  
> **Referensi Aturan:** [`ATURAN_SISTEM.md`](../docs/ATURAN_SISTEM.md), [`PRD.md`](../docs/PRD.md), [`DAFTAR_HALAMAN.md`](../docs/DAFTAR_HALAMAN.md).

Peta kapabilitas ini mendefinisikan batas modul (*module boundaries*), penanggung jawab fungsional, relasi dependensi satu arah (*unidirectional dependency direction*), dan urutan implementasi (*build order*). Setiap fitur baru atau refaktor wajib mengacu pada ID modul di bawah ini.

---

## 1. Tabel Modul Sistem

| Modul ID | Tanggung Jawab & Ruang Lingkup | Bergantung Pada | Aktor Utama | Status Implementasi |
|---|---|---|---|---|
| `auth` | Autentikasi multi-role (Auth.js v5), alur registrasi wali 3-langkah (BR#25), session JWT, reset password. | — | Publik, Orang Tua, Guru, Admin | Selesai (Aktif) |
| `public-catalog` | Beranda publik, katalog kelas dengan filter jenjang, detail silabus/kelas, halaman legal & kontak. | `auth` | Tamu (Guest) | Selesai (Aktif) |
| `parent-children` | Kelola profil anak (tambah, edit, daftar anak). Anak tidak memiliki kredensial login mandiri. | `auth` | Orang Tua | Selesai (Aktif) |
| `parent-enrollment` | Pengajuan pendaftaran kelas anak, validasi jenjang (BR#13), anti-bentrok jadwal (BR#9), row lock kuota (BR#1). | `parent-children`, `admin-classes` | Orang Tua | Selesai (Aktif) |
| `payment-midtrans` | Integrasi tagihan DP & cicilan manual (BR#14, BR#24, BR#28), checkout Snap, Webhook SHA512 (BR#17, BR#26). | `parent-enrollment` | Orang Tua, Sistem | Selesai (Backend), P1 (Frontend Snap) |
| `parent-academic` | Pemantauan jadwal belajar mingguan terpadu, rekap kehadiran sesi, nilai evaluasi, dan catatan kemajuan anak. | `parent-enrollment`, `teacher-attendance`, `teacher-grading` | Orang Tua | Selesai (Aktif) |
| `teacher-classes` | Dasbor kelas aktif yang diampu, jadwal tatap muka mingguan, roster siswa terdaftar per kelas. | `auth`, `admin-classes` | Guru | Selesai (Aktif, refaktor UI) |
| `teacher-attendance`| Lembar input presensi pertemuan (Hadir, Izin, Sakit, Alpa), penguncian otomatis edit 7 hari kalender (BR#18). | `teacher-classes` | Guru | Selesai (Aktif, kuncian 7 hari P4) |
| `teacher-grading` | Input nilai evaluasi akademik & catatan naratif kualitatif perkembangan belajar anak (jendela 7 hari). | `teacher-classes` | Guru | Selesai (Aktif, kuncian 7 hari P4) |
| `teacher-corrections`| Formulir permohonan koreksi presensi atau nilai kepada Admin setelah melewati batas waktu 7 hari (BR#18). | `teacher-attendance`, `teacher-grading` | Guru, Admin | Rencana (P4) |
| `admin-master-data` | CRUD master Mata Pelajaran, Periode Pendaftaran (buka/tutup/selesai), dan Akun Pengajar Guru. | `auth` | Admin | Selesai (Aktif) |
| `admin-classes` | CRUD Penawaran Kelas, anti-bentrok jadwal pengajar (BR#6), konfigurasi biaya & syarat DP (BR#12). | `admin-master-data` | Admin | Selesai (Aktif) |
| `admin-governance` | Evaluasi kuota minimum penutupan kelas (BR#10) dan tata kelola pendaftaran bermasalah. | `admin-classes`, `parent-enrollment` | Admin | Rencana (Next) |
| `admin-reports` | Dasbor analitik penerimaan siswa, rekonsiliasi kas masuk, status tunggakan cicilan, laporan operasional. | `payment-midtrans`, `parent-enrollment` | Admin | Rencana (Next) |
| `system-cron` | Background job berkala (5 menit) pemeriksaan timeout 1x24 jam (`/api/cron/check-timeout`) & pelepasan kuota (BR#2, BR#11, BR#21). | `parent-enrollment` | Vercel Cron | Selesai (Aktif) |

---

## 2. Diagram Pohon Dependensi & Urutan Pengerjaan (*Build Order*)

```
[auth]
  ├──► [public-catalog]
  ├──► [admin-master-data]
  │       └──► [admin-classes]
  │               ├──► [teacher-classes]
  │               │       ├──► [teacher-attendance] ──► [teacher-corrections]
  │               │       └──► [teacher-grading]    ──► [teacher-corrections]
  │               │
  │               └──► [parent-children]
  │                       └──► [parent-enrollment]
  │                               ├──► [system-cron]
  │                               ├──► [payment-midtrans] ──► [admin-reports]
  │                               └──► [parent-academic]
  └──► [admin-governance]
```

### Urutan Implementasi Terstruktur:
1. **Fondasi Inti:** `auth` ➔ `admin-master-data` ➔ `admin-classes` ➔ `parent-children`
2. **Transaksi & Alur Belajar:** `parent-enrollment` ➔ `payment-midtrans` & `system-cron`
3. **Portal Operasional Guru:** `teacher-classes` ➔ `teacher-attendance` & `teacher-grading` ➔ `parent-academic`
4. **Tata Kelola Lanjutan:** `teacher-corrections` ➔ `admin-governance` ➔ `admin-reports`

---

## 3. Fitur yang Dikecualikan (*Explicit Out of Scope*)

Berdasarkan keputusan arsitektur domain Siedu:
- ❌ **Fitur Refund & Pengajuan Pembatalan Sepihak Wali:** Sistem **TIDAK MENYEDIAKAN** fitur atau alur pengajuan refund mandiri oleh orang tua. Pembatalan sukarela oleh wali murid tidak memicu pengembalian dana uang muka (DP non-refundable). Pembatalan otomatis hanya terjadi lewat mekanisme timeout sistem 1x24 jam (kuota dilepas otomatis) atau evaluasi penutupan kuota kelas oleh Admin.
- ❌ **Siswa Login Mandiri:** Siswa jenjang TK–SMA tidak memiliki akun login independen; seluruh akses perkembangan belajar dikelola lewat akun Orang Tua / Wali Sah.
- ❌ **Auto-Debit Cicilan:** Pembayaran cicilan dilakukan mandiri oleh orang tua setiap bulan (tidak ada pendebitan otomatis rekening/kartu kredit).
