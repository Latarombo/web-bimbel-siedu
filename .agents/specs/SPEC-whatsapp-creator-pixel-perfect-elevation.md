# SPEC: Pixel-Perfect WhatsApp Story Creator Tools (Shapes, Draggable Text, & Adaptive Crop)

> **Modul ID:** `whatsapp-creator-pixel-perfect-elevation`  
> **Aktor:** Guru (`role: guru`)  
> **Status:** Approved by User via SDD Phase 1 Grill  
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md).  
> **Referensi Screenshot:**
> - `Screenshot 2026-11-24 230459.png` (Shape Tool Popover 2x2: Square, Circle, Line, Arrow; Active Shape with neon green selection bounding box & 8 handles + top rotation dot; Bottom toolbar with thickness controls & Trash button).
> - `Screenshot 2026-11-24 230655.png` (Text Tool: White card text box with neon green border, attached smiley button on top, placeholder `"Ketik sesuatu"`; Bottom toolbar with 8 color dots, Font selector dropdown, Toggle background button, and Trash button).

---

## 1. Objective & User Stories

### A. Objective
Mewujudkan antarmuka dan interaksi penyuntingan foto di `WhatsappStoryCreatorModal` agar 100% presisi visual dan fungsional sesuai referensi WhatsApp Web asli pada screenshot, meliputi:
1. Shape Tool Popover 2x2 (Kotak, Lingkaran, Garis, Panah diagonal) & manipulasi bentuk dengan tombol hapus.
2. Text Tool interaktif: Card teks dengan border hijau neon, placeholder `"Ketik sesuatu"`, attached smiley button, draggable, serta bottom toolbar (palette 8 warna, dropdown font, toggle latar belakang, dan tombol hapus).
3. Ikon Blur WhatsApp Web: Menggunakan ikon matriks titik melingkar (*dotted mosaic circle*).
4. Rotasi Fisik & Pemotongan Presisi (Crop): Rotasi foto menukar dimensi fisik (lebar-tinggi saat 90°/270°) sehingga bingkai pemotong (*crop box*) menempel 100% pada foto tanpa ruang kosong hitam.

---

## 2. Command Verifikasi (Quality Contract)

```bash
# Verifikasi TypeCheck via PowerShell Windows
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Detail Arsitektur & Implementasi Teknis

### A. Rotasi Fisik Citra & Crop Tanpa Ruang Kosong
Saat tombol rotasi diklik dalam mode Crop atau toolbar:
1. Gambar diputar secara fisik pada offscreen canvas sebesar +90° searah jarum jam (atau -90°).
2. DataURL foto aktif langsung diperbarui dengan hasil rotasi fisik tersebut, sehingga dimensi `width` dan `height` bertukar secara alami di DOM.
3. Kontainer pembungkus foto langsung beradaptasi dengan dimensi baru, sehingga kotak crop dan 8 titik handles menempel 100% pada gambar tanpa area kosong.

### B. Ikon Blur Matriks Titik WhatsApp (Dotted Mosaic Circle)
Menggunakan SVG kustom representasi asli WhatsApp Web:
- Lingkaran yang terbentuk dari matriks titik-titik sensor (*mosaic blur dot pattern*).

### C. Popover Bentuk 2x2 (`Screenshot 2026-11-24 230459.png`)
- Tampilan kartu mengambang putih dengan sudut melengkung halus (*rounded-2xl shadow-2xl bg-white text-slate-800*).
- Grid 2x2 berisi 4 ikon garis abu-abu gelap tebal:
  1. Kotak (*Square*)
  2. Lingkaran (*Circle*)
  3. Garis diagonal (*Slash / Diagonal Line*)
  4. Panah diagonal kanan-atas (*Arrow Up-Right*)
- Menambahkan bentuk menempatkannya di tengah foto dengan bounding box seleksi bergaris hijau neon (`#25D366`) dan 8 titik putih.
- Toolbar bawah menampilkan tombol Hapus (tempat sampah) saat bentuk aktif.

### D. Teks Draggable & Toolbar Teks Bawah (`Screenshot 2026-11-24 230655.png`)
- **Elemen Teks di atas Foto:**
  - Card putih dengan border hijau neon (`border-2 border-[#25D366] rounded-xl px-4 py-2`).
  - Di atas kartu (tengah atas): lingkaran tombol emoji senyum (`Smile`).
  - Input teks langsung dengan placeholder `"Ketik sesuatu"`.
  - Dapat di-drag & drop bebas di seluruh area foto.
- **Toolbar Bawah Teks:**
  - 8 Pilihan Warna: Hitam, Abu-abu, Putih, Sian (Biru Muda), Hijau Muda, Ungu, Oranye, Merah.
  - Pemilih Font: Sans Serif, Serif, Mono, Display.
  - Toggle Latar Belakang: Tombol dengan ikon centang `✓ Latar belakang` untuk mengaktifkan/menonaktifkan card latar belakang teks.
  - Tombol Tempat Sampah (Hapus Teks) di sisi kanan.

---

## 4. Acceptance Criteria (Given - When - Then)

1. *Given* Guru membuka tool bentuk (Shape), *When* Popover terbuka, *Then* muncul kartu putih 2x2 dengan ikon Kotak, Lingkaran, Garis, dan Panah sesuai `Screenshot 2026-11-24 230459.png`.
2. *Given* Guru membuka tool teks (Aa), *When* Teks muncul di atas foto, *Then* tampil kartu putih dengan border hijau neon, attached smiley button, dan placeholder `"Ketik sesuatu"`, yang dapat dipindahkan posisinya (*draggable*).
3. *Given* Teks aktif, *When* Guru melihat toolbar bawah, *Then* tersedia 8 warna, pilihan font, tombol toggle `Latar belakang`, dan tombol hapus sesuai `Screenshot 2026-11-24 230655.png`.
4. *Given* Guru merotasi foto di mode Crop, *When* Foto berputar 90°, *Then* gambar diputar secara fisik tanpa ada ruang kosong hitam di sekitar bingkai crop.
5. *Given* Toolbar atas dilihat, *Then* ikon blur menggunakan ikon matriks titik melingkar ala WhatsApp.
6. *Given* Verifikasi tipe dijalankan, *Then* `npx tsc --noEmit` lolos dengan exit code 0.
