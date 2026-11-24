# SPEC: WhatsApp Status Tray & Segmented Story Rings (Ref: status.png)

> **Modul ID:** `whatsapp-status-tray-and-segmented-rings`
> **Aktor:** Guru (`role: guru`) & Orang Tua (`role: parent`)
> **Status:** Specify (Phase 2 SDD - Siap Implementasi)
> **Rujukan Visual:** Referensi tangkapan layar `status.png` (WhatsApp Web/Desktop Status Tray)
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md).

---

## 1. Objective & User Story

### Konteks & Masalah

1. **Kebutuhan Pengalaman Familiar WhatsApp:** Pengguna (baik Guru maupun Orang Tua) sangat terbiasa dengan antarmuka WhatsApp Status di mana pembaruan ditampilkan dalam bentuk daftar kontak dengan cincin status (_status rings_), baris status saya dengan tombol popover `Foto & Video` atau `Teks`, serta indikator lingkaran bersegmen (_segmented rings_) untuk membedakan jumlah status yang sedang aktif.
2. **Kesesuaian dengan Referensi `status.png`:** Tampilan status saat ini perlu diselaraskan agar mengadopsi struktur visual WhatsApp Web Status:
    - Header "Status" yang bersih dengan tombol tambah `(+)`.
    - Baris "Status saya" dengan avatar pengguna, badge plus hijau, dan dropdown popover: `Foto & Video` vs `Teks`.
    - Seksi "Pembaruan Terkini" dengan cincin hijau (solid untuk 1 status, bersegmen/terbelah untuk 2+ status).
    - Penanda waktu yang manusiawi (_"Hari Ini Pukul 11.16"_).

### User Story

- _Sebagai Guru_, saya ingin:
    - Melihat baris "Status saya" di `/teacher/status` dengan badge `+`, dan ketika mengklik tombol tambah dapat memilih antara **Foto & Video** (kamera/galeri) atau **Teks** (pengumuman teks).
    - Melihat status aktif saya dengan lingkaran bersegmen sesuai jumlah status yang telah saya terbitkan dalam 24 jam terakhir.
- _Sebagai Orang Tua_, saya ingin:
    - Melihat daftar guru yang mengajar anak-anak saya di halaman utama `/home`.
    - Melihat cincin status hijau pada avatar guru jika ada pembaruan pembelajaran baru (terbelah sesuai jumlah status aktif sang guru).
    - Mengklik avatar/nama guru untuk membuka pemutar status (_story viewer_) bergaya WhatsApp dengan navigasi progress bar di atas.

---

## 2. Command Verifikasi

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL/siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Komponen & Struktur Berkas

```
src/
├── components/
│   ├── common/
│   │   └── whatsapp-story-ring.tsx          → [BARU] Reusable SVG Segmented Story Ring (Solid vs Multi-segment)
│   ├── teacher/
│   │   ├── status-hub-view.tsx              → [REFAC] Mengadopsi WhatsApp Tray Layout (Header, Status Saya, Popover, Segmented Ring)
│   │   └── whatsapp-story-creator-modal.tsx → Mendukung mode Foto/Video vs Teks
│   └── parent/
│       ├── parent-status-tray.tsx           → [BARU] WhatsApp Status Tray untuk orang tua (Daftar Guru & Segmented Rings)
│       └── learning-status-inline-story.tsx → Viewer interaktif WhatsApp Story dengan progress bar & humanized time
```

---

## 4. Rincian Teknis & Desain Komponen

### Slice 1: Segmented Story Ring (`WhatsAppStoryRing`)

- Komponen SVG presisi tinggi untuk merender cincin status:
    - Parameter: `count` (jumlah status), `size` (diameter pixel), `strokeWidth`, `isViewed` (sudah dilihat / abu-abu vs belum dilihat / hijau emerald `emerald-500`), `gap` (jarak antar segmen dalam derajat).
    - Jika `count === 1`: Render lingkaran `<circle>` tunggal mulus.
    - Jika `count > 1`: Render busur `<circle strokeDasharray="..." strokeDashoffset="...">` atau SVG path yang membagi lingkaran 360 derajat menjadi `count` bagian dengan celah 4-6 derajat di antara setiap segmen, persis seperti kontak "Pak Fatah" pada `status.png`.

### Slice 2: Status Hub Guru (`/teacher/status`)

- Mengikuti layout `status.png`:
    - **Header:** Judul tebal "Status" dengan tombol menu dan tombol tambah `(+)`.
    - **Baris "Status saya":**
        - Avatar guru dengan `WhatsAppStoryRing` (jika ada status aktif) dan badge plus `(+)` hijau di pojok kanan bawah jika belum atau ingin menambah status.
        - Title: "Status saya", Subtitle: _"Klik untuk membuat pembaruan status"_ (atau _"Hari Ini Pukul 10.30"_ jika sudah ada status aktif).
        - Klik tombol `(+)` membuka popover mengambang:
            - `Foto & Video` (ikon gambar) → membuka `WhatsappStoryCreatorModal` mode kamera/media.
            - `Teks` (ikon pensil) → membuka `WhatsappStoryCreatorModal` mode teks berlatar warna.
    - **Seksi "Status Aktif Saya":** Daftar status aktif yang sedang tayang dengan opsi hapus/tarik.
    - **Seksi "Riwayat Status":** Arsip status terdahulu.

### Slice 3: Status Tray Orang Tua (`ParentStatusTray`)

- Di portal orang tua (`/home`):
    - Mengelompokkan status aktif berdasarkan guru pengajar anak-anak orang tua tersebut.
    - Ditampilkan dalam format deret kontak WhatsApp:
        - Avatar guru dengan `WhatsAppStoryRing` hijau (bersegmen sesuai jumlah status aktif).
        - Nama guru dan mata pelajaran/anak (misal: "Pak Fatah · Guru Matematika Anton").
        - Keterangan waktu manusiawi (_"Hari Ini Pukul 09.02"_ atau format lokal ID).
    - Klik baris/avatar guru langsung membuka full-experience story viewer WhatsApp.

---

## 5. Acceptance Criteria (Given-When-Then)

### Skenario 1: Guru Membuat Status dari Dropdown Popover

- **GIVEN** Guru membuka `/teacher/status`.
- **WHEN** Guru menekan tombol plus pada baris "Status saya".
- **THEN** Muncul dropdown dengan pilihan "Foto & Video" dan "Teks".
- **WHEN** Guru memilih "Foto & Video", memilih foto kelas, mengetik caption, dan mengirim.
- **THEN** Status tersimpan, dan avatar "Status saya" menampilkan cincin hijau aktif.

### Skenario 2: Segmented Ring pada Guru dengan Banyak Status

- **GIVEN** Guru telah menerbitkan 2 status aktif dalam 24 jam.
- **WHEN** Orang tua membuka `/home`.
- **THEN** Avatar guru menampilkan cincin hijau terbagi menjadi 2 segmen terpisah (seperti Pak Fatah pada referensi).

### Skenario 3: Membuka WhatsApp Story Viewer

- **GIVEN** Orang tua melihat kontak guru dengan cincin hijau aktif.
- **WHEN** Orang tua mengklik baris kontak tersebut.
- **THEN** Terbuka story viewer dengan progress bar di atas yang berpindah otomatis setiap 5 detik atau saat layar diklik.

---

## 6. Constraints & Anti-Patterns

- Sesuai `AGENTS.md` & `CONSTRAINTS.md`: Dilarang menggunakan icon dekoratif berlebih di luar semantic meaning.
- SVG segmented ring harus matematis akurat dan responsif terhadap dark mode.
- Wajib verifikasi kompilasi TypeScript (`npx tsc --noEmit`) dengan exit code 0.
