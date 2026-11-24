# SPEC: WhatsApp Web Style Status Creator & Photo Picker Flow untuk Guru

> **Modul ID:** `whatsapp-style-status-creator`
> **Aktor:** Guru (`role: guru`)
> **Status:** Implemented & Verified (Phase 6 SDD - 0 TypeScript Error)
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md).
> **Referensi Desain:**
>
> - Editor Foto: `Screenshot 2026-11-24 141251.png` (WhatsApp Web Image Story Canvas & Toolbar)
> - Editor Teks: `Screenshot 2026-11-24 141517.png` (WhatsApp Web Solid Color Text Canvas & Controls)

---

## 1. Objective & User Story

### Alur Interaksi Pengguna (Trigger Flow)

1. **Opsi "Foto & Video":**
    - Saat guru mengklik opsi "Foto & Video" pada dropdown tombol _Tambah Status_ atau avatar _Status saya_, sistem **langsung membuka dialog pemilihan file folder native browser** (`input[type="file"]`).
    - Begitu guru memilih satu atau lebih file foto, gambar langsung dikompresi di sisi browser (`compressImageFile`) dan modal status editor langsung terbuka dengan foto sudah dimuat penuh di tengah layar, mengadopsi tampilan WhatsApp Web persis pada referensi `Screenshot 2026-11-24 141251.png`.
2. **Opsi "Teks":**
    - Saat guru mengklik opsi "Teks" pada dropdown, sistem langsung membuka editor status teks layar penuh berlatar warna solid persis pada referensi `Screenshot 2026-11-24 141517.png`.

---

## 2. Rincian Desain Visual & Komponen

### A. Editor Status Foto (`Screenshot 2026-11-24 141251.png`)

- **Latar Belakang:** Gelap pekat khas WhatsApp Web (`#0b141a` / `#111b21`).
- **Top Bar:**
    - Sisi Kiri: Tombol Tutup (`✕`), Tombol Undo (`↶`), Tombol Redo (`↷`).
    - Sisi Tengah/Kanan (Toolbar Alat):
        - Putar Foto (`Crop` / Rotasi 90° interaktif: 0°, 90°, 180°, 270°).
        - Filter Efek (`Sparkles`: Asli, B&W, Hangat, Sejuk, Vivid).
        - Pensil / Gambar (`Pencil`).
        - Teks Overlay (`Type`).
        - Sensor / Buram (`Grid`).
        - Pemilih Stiker & Emoji (`Smile` & `SmilePlus` dengan floating ribbon emoji).
        - Lencana `HD` (High Definition).
    - Sisi Kanan: Tombol Unduh Foto (`Download`).
- **Kanvas Tengah:**
    - Foto utama ditampilkan secara terpusat (`object-contain max-h-[64vh]`), mempertahankan rasio aspek foto.
    - Filmstrip thumbnail di bawah foto (jika ada lebih dari 1 foto, hingga batas maksimal 5 foto, lengkap dengan tombol `+` untuk menambah foto tambahan dan tombol `✕` hapus per thumbnail).
- **Bottom Bar:**
    - Input teks mengambang: _"Tambah keterangan"_ dengan tombol emoji di sebelah kanan input.
    - Pill Audiens di kiri: `(Kontak) status · [Nama Kelas]` dengan ikon cincin status WhatsApp (klik membuka popover pemilihan kelas).
    - Tombol Kirim Hijau Bulat WhatsApp di kanan: `size-12 rounded-full bg-[#00a884]` dengan ikon kirim pesawat kertas putih.

### B. Editor Status Teks (`Screenshot 2026-11-24 141517.png`)

- **Latar Belakang:** Warna solid cerah satu layar penuh.
    - Warna default persis screenshot: Coral Pink (`#f1787c`).
    - Palet warna yang dapat diganti via tombol palette: Coral (`#f1787c`), WhatsApp Teal (`#00a884`), Amber (`#b9770e`), Royal Blue (`#2563eb`), Purple (`#7c3aed`), Crimson (`#e11d48`), dan Slate (`#1e293b`).
- **Top Bar:**
    - Sisi Kiri: Tombol Tutup (`✕`) putih bersih.
    - Sisi Kanan: Tombol Emoji (`Smile`), Tombol Ganti Font (`Aa`: Sans, Serif, Mono, Display, Italic), Tombol Ganti Warna Latar (`Palette`).
- **Kanvas Tengah:**
    - Area teks besar terpusat tanpa batas (_borderless centered textarea_): `text-4xl sm:text-5xl md:text-6xl text-white font-semibold text-center placeholder-white/50 bg-transparent resize-none focus:ring-0`.
    - Placeholder: _"Ketik status..."_.
- **Bottom Bar:**
    - Pill Audiens di kiri: `(Kontak) status · [Nama Kelas]` dengan ikon cincin status WhatsApp ber-border putih transparan.
    - Tombol Kirim Hijau Bulat WhatsApp di kanan: `size-12 rounded-full bg-[#00a884]`.

---

## 3. Berkas Implementasi

1. [`src/lib/image-compress.ts`](../../src/lib/image-compress.ts): Modul kompresi foto klien sebelum payload dikirim ke server.
2. [`src/components/teacher/whatsapp-story-creator-modal.tsx`](../../src/components/teacher/whatsapp-story-creator-modal.tsx): Komponen modal ganda (Foto & Teks) yang mengadopsi 100% detail kedua screenshot referensi.
3. [`src/components/teacher/status-hub-view.tsx`](../../src/components/teacher/status-hub-view.tsx): Integrasi trigger dropdown foto langsung membuka native file dialog.
4. [`src/components/teacher/classes/class-detail-view.tsx`](../../src/components/teacher/classes/class-detail-view.tsx): Integrasi trigger "Bagikan Status" di halaman detail kelas.

---

## 4. Command Verifikasi

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL/siedu'; npx tsc --noEmit" < /dev/null
# Hasil: Exit code 0 (Clean)
```
