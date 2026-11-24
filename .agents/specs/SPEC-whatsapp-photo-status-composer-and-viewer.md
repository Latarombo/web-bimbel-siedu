# SPEC: WhatsApp Web Photo Status Composer & Story Viewer Elevation

> **Modul ID:** `whatsapp-photo-status-composer-and-viewer`  
> **Aktor:** Guru (`role: guru`) & Wali Murid (`role: orang_tua`)  
> **Status:** Approved by User via SDD Phase 1 Grill  
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md).  
> **Referensi Screenshot:**
> - Composer Status Foto: `Screenshot 2026-11-24 203809.png` (Layout WhatsApp Web: toolbar kreatif lengkap di atas, kanvas foto di tengah, bar keterangan, dan bar bawah 3 kolom: pill status di kiri, thumbnail carousel di tengah, tombol kirim hijau di kanan).
> - Story Viewer: `Screenshot 2026-11-24 203846.png` (Layout WhatsApp Web: backdrop blur bleed, kartu story tengah dengan progress bar segmen, back button, avatar ber-badge hijau `+`, nama "Anda", waktu status, controls jeda/volume/menu/tutup, dan indikator penonton `👁 0` di bawah).

---

## 1. Objective & User Story

Sebagai Guru:
1. Saat mengunggah foto pembelajaran, guru mendapatkan pengalaman penyuntingan foto yang kaya dan intuitif persis WhatsApp Web (`Screenshot 2026-11-24 203809.png`), meliputi:
   - Toolbar atas: Undo, Redo, Crop/Rotate, Filter warna, Pen/Gambar bebas di kanvas, Text overlay di atas foto (Aa), Shape (kotak), Mosaic/Blur sensor, Stiker/Emoji, HD indicator, toggle layout, dan Download foto.
   - Kanvas tengah yang responsif dan interaktif.
   - Baris input keterangan dengan tombol emoji.
   - Baris bawah terbagi 3 elemen: Tombol pill `(1 Disertakan) status` di kiri (membuka pilihan kelas sasaran & info konsen foto), filmstrip thumbnail + tombol `+` di tengah, dan tombol bulat hijau kirim `➤` di kanan.
2. Saat guru melihat status aktif miliknya (`Screenshot 2026-11-24 203846.png`):
   - Tampilan story viewer berlatar belakang blurred backdrop dari foto tersebut.
   - Header menampilkan avatar dengan badge `+` hijau, nama pengunggah "Anda", waktu publikasi ("Hari Ini Pukul 20.38"), tombol navigasi/jeda/volume/menu/tutup.
   - Di bagian bawah terdapat tombol indikator mata `👁 [Jumlah Penonton]`. Saat diklik, membuka popover/drawer daftar nama wali murid yang telah melihat status ini.

Sebagai Wali Murid:
1. Saat membuka status pembelajaran dari guru di portal orang tua, sistem secara otomatis mencatat bahwa wali murid telah melihat status tersebut (audit view tracking).

---

## 2. Data Contracts & Actions

### A. Tracking Penonton Status (View Tracking via `AuditPerubahan`)

Menggunakan tabel `AuditPerubahan` yang sudah ada untuk persistensi tanpa perlu migrasi skema destruktif:
- `entitas`: `"StatusPembelajaran"`
- `entitasId`: ID status pembelajaran
- `aksi`: `"VIEW"`
- `diubahOleh`: ID pengguna (wali murid)
- `dataBaru`: JSON string `{ userName: string, viewedAt: string }`

### B. Server Actions (`src/app/actions/teacher.ts`)

1. `catatStatusDilihat(statusId: number): Promise<{ success: boolean }>`
   - Memeriksa sesi aktif. Jika wali murid membuka status, catat log `VIEW` jika belum pernah dicatat sebelumnya untuk user tersebut pada status tersebut.
2. `getStatusViewers(statusId: number): Promise<{ viewers: Array<{ userId: number; userName: string; viewedAt: string }> }>`
   - Mengambil daftar unik penonton status pembelajaran untuk guru pemilik status.

---

## 3. UI/UX Specifications

### A. Composer Status Foto (`Screenshot 2026-11-24 203809.png`)
- **Theme:** Dark `#0c1317` / `#111b21`
- **Top Header Bar:**
  - Left: Close (`✕`)
  - Center tools:
    - Undo (`↺`) / Redo (`↻`)
    - Crop / Rotate (`⛶`)
    - Filter warna (`✨`)
    - Pen tool (`✏️`): Kanvas HTML5 interaktif untuk menggambar garis warna-warni langsung di atas foto
    - Text overlay (`Aa`): Menambahkan teks bebas di atas foto
    - Shape tool (`▢`): Menambahkan bingkai/kotak penyorot di atas foto
    - Sensor / Blur (`▦`): Mengaktifkan filter blur/sensor
    - Emoji / Stiker picker (`😊` / `🏷️`): Menempelkan stiker/emoji pada foto
    - Lencana `HD`
  - Right:
    - Sidebar icon
    - Download icon (`⬇️`)
- **Center Canvas:**
  - Foto utama dengan layer kanvas doodle/overlay interaktif.
- **Bottom Footer:**
  - Row 1: Input "Tambah keterangan" dengan background `#202c33`, icon emoji di kanan (`max-w-2xl mx-auto`).
  - Row 2: Tata letak kontrol bawah seragam dan konsisten penuh dengan mode teks (`w-full px-6 pb-6 pt-2`):
    - Left: Tombol pill `(1 Disertakan) status` berada di posisi kiri bawah yang sama persis dengan pill audiens mode teks (`px-6`, padding dan tinggi seragam). Mengklik membuka popover pemilihan kelas & validasi izin foto murid.
    - Center: Filmstrip thumbnail (foto aktif ber-border hijau `#00a884`) + tombol `+` kotak terpusat di antara pill dan tombol kirim.
    - Right: Tombol kirim bulat hijau `#00a884` (`size-12`) berada di posisi kanan bawah yang sama persis dengan tombol kirim mode teks (`px-6`).

### B. Story Viewer (`Screenshot 2026-11-24 203846.png`)
- **Backdrop:** Full-screen blurred backdrop bleed dari gambar aktif.
- **Kontrol Luar Card:**
  - Tombol panah kembali (`←`) di luar card pada pojok kiri atas viewport.
  - Tombol silang tutup (`✕`) di luar card pada pojok kanan atas viewport.
  - Tombol bulat chevron kiri `<` dan kanan `>` melayang di luar kartu foto pada desktop.
- **Story Card Header:**
  - Segmented progress bar tipis putih di paling atas.
  - Baris header:
    - Sisi Kiri: Avatar bulat dengan mini badge `+` hijau di sudut kanan bawah, Nama "Anda" (untuk guru sendiri) atau nama guru, dan Subtitle waktu ("Hari Ini Pukul 20.38"). Rata kiri (*left-aligned*), bukan di tengah-tengah.
    - Sisi Kanan: Tombol Pause/Play, Mute/Unmute, dan Dropdown Menu `⋮` (termasuk opsi hapus status untuk guru & unduh foto).
- **Story Card Footer:**
  - Teks keterangan (*caption*) ditampilkan bersih langsung di atas foto (*clean typography* dengan bayangan teks lembut), tanpa kartu/pill pembungkus.
  - Tombol indikator `👁 <count>` terpusat di bawah foto.
  - Mengklik tombol membuka sheet daftar penonton (nama wali murid & waktu melihat).
- **Status Ring Indikator (Halaman Status Guru):**
  - Cincin status (`WhatsAppStoryRing`) berwarna hijau (`stroke-emerald-500`) saat ada status baru yang belum dilihat.
  - Segera setelah status dilihat, cincin status berubah menjadi abu-abu netral (`stroke-slate-300 dark:stroke-slate-600` / tidak hijau) dan disimpan secara persisten di `localStorage`.

### C. Status Teks & Tata Letak Layar Penuh
- **Mode Pembuat Status Teks (`WhatsappStoryCreatorModal`):**
  - Tampilan layar penuh (*full screen*) berlatar warna solid/gradien aktif (`activeBg.value`), bersih tanpa pembungkus kartu atau kanvas gelap luar.
  - Teks terpusat presisi secara vertikal dan horizontal dengan auto-resize.
  - Tersedia 14 palet warna solid dan gradien dengan floating ribbon pemilih tema.
  - Pilihan font typografi: Sans, Serif, Mono, Display, Italic.
- **Story Viewer (`WhatsAppStoryViewerModal`):**
  - Baik status foto maupun status teks (`currentSlide.isTextOnly`), area di luar kartu utama pada viewport memiliki pencahayaan ambient sinematik (`blur-[110px] opacity-45 transition-all duration-700`) yang membiaskan warna/gradien status ke latar belakang gelap.
  - Kanvas penyuntingan foto didukung pencahayaan sinematik ambient blur dari foto aktif di belakangnya (`blur-3xl opacity-30`).

### D. Pemisahan Alur Status Saya/Terbaru dan Riwayat Status (Strict Stream Segregation)
- **Status Saya & Seksi TERBARU:**
  - Saat guru mengklik "Status saya" (baik pada cincin avatar maupun teks judul), viewer HANYA memuat status-status aktif hari ini (`orderedActiveStatuses`) yang diurutkan secara kronologis terbit (`a.diterbitkanPada - b.diterbitkanPada`).
  - Tidak mencampurkan status kedaluwarsa/riwayat (`archivedStatuses`).
  - Saat status aktif terakhir selesai diputar, penampil otomatis tertutup dan tidak pernah melompat ke status riwayat.
  - Pada daftar item seksi TERBARU dan RIWAYAT, tampilan item bersih ala WhatsApp Web: HANYA menampilkan nama kelas (misal: "Matematika") dan waktu publikasi (misal: "Hari Ini Pukul 22.16"), tanpa cuplikan teks keterangan (*caption*).
  - Terdapat tombol indikator penonton dengan ikon mata `👁 Dilihat oleh [count]` menggantikan teks jumlah murid. Mengklik tombol ini membuka dialog daftar nama orang tua murid yang telah melihat status pembelajaran tersebut.
  - Saat guru mengklik salah satu status di daftar TERBARU, penampil hanya memuat status-status aktif dan melompat ke status yang dipilih (`handleOpenActiveStatus`).
- **Seksi RIWAYAT:**
  - Saat guru mengklik salah satu item di daftar RIWAYAT, penampil HANYA memuat status-status riwayat kedaluwarsa (`orderedArchivedStatuses`), diurutkan dari yang terbaru kedaluwarsa ke yang lebih lama (`handleOpenArchivedStatus`).
  - Tidak mencampurkan status aktif hari ini. Navigasi hanya berputar di dalam kumpulan riwayat status.

---

## 4. Acceptance Criteria (Given - When - Then)

1. **Scenario 1: Tata Letak Composer Foto Menyerupai Screenshot 1**
   - **Given** Guru membuka opsi "Foto & Video" dan memilih foto.
   - **When** Modal composer foto terbuka.
   - **Then** Terdapat toolbar kreatif lengkap di atas (Undo/Redo, Rotate, Filter, Pen canvas, Text Aa, Shape, Blur, Emoji/Sticker, HD, Download).
   - **And** Baris keterangan berada di atas baris kontrol bawah.
   - **And** Baris bawah memuat pill `(1 Disertakan) status` di kiri, thumbnail di tengah, dan tombol kirim hijau di kanan.

2. **Scenario 2: Interaksi Pill Audiens**
   - **Given** Guru berada di modal composer foto.
   - **When** Guru mengklik tombol pill `(1 Disertakan) status`.
   - **Then** Muncul popover pemilihan kelas dan daftar murid terdaftar beserta status izin foto murid.

3. **Scenario 3: Story Viewer Menyerupai Screenshot 2**
   - **Given** Guru atau wali murid membuka status.
   - **When** Penampil story tampil di layar.
   - **Then** Latar belakang menampilkan efek blur dari gambar status.
   - **And** Header menampilkan progress bar, tombol back, avatar dengan badge hijau `+`, nama "Anda", waktu publikasi, controls pause/sound/menu/close.
   - **And** Di bagian bawah foto terdapat indikator `👁 <count>`.

4. **Scenario 4: Pelacakan Penonton Status**
   - **Given** Wali murid melihat status pembelajaran.
   - **When** Status dimuat di viewer orang tua.
   - **Then** Server action `catatStatusDilihat` dipanggil untuk mencatat viewer di `AuditPerubahan`.
   - **And** Saat guru melihat status dan mengklik ikon `👁`, muncul modal penonton yang memuat nama wali murid dan waktu melihat.

---

## 5. Out of Scope
- Filter AI generatif atau penghapus objek berbasis AI pada foto.
- Pengaturan kompresi video (fokus pada status foto dan teks).
