# SPEC-whatsapp-creator-multi-element-editor.md
# Spesifikasi Multi-Element Overlay Editor WhatsApp Story (Persistent Layers, Blur Zone, Rotations, Color Fill, Stroke Sizing)

## 1. Objective & User Story
Sebagai guru yang membuat status WhatsApp pembelajaran, saya ingin:
1. **Tool Exclusivity**: Saat memilih alat baru (misal Pensil lalu Shape), alat sebelumnya dinonaktifkan secara eksklusif agar tidak terjadi konflik interaksi kanvas.
2. **Persistent Placed Elements**: Teks, bentuk penyorot (shape), emoji, dan area sensor (blur) yang telah diletakkan di foto **tetap tersimpan** di atas foto (tidak hilang saat beralih alat atau mengklik luar), dan dapat diklik kembali untuk diedit/dipindah/dihapus.
3. **Menu Rotasi Konsisten di Bagian Bawah**: Tombol rotasi foto (+90° searah jarum jam terus menerus secara fisik) tersedia konsisten di baris bawah utama (dekat deretan thumbnail foto) serta di sub-toolbar crop.
4. **Teks Tanpa Kotak Bening**: Saat opsi latar belakang dinonaktifkan (`hasBackground = false`), kotak pembungkus teks benar-benar transparan tanpa kotak hitam semu (`bg-transparent backdrop-blur-none`), mengandalkan *text-shadow* tipografi bersih.
5. **Interactive Blur/Sensor Zone**: Kotak blur dapat digeser (*drag and drop*), diatur dimensinya (*resize* dengan 8 handle), serta diatur intensitas buramnya dan jenis blurnya (Mosaik/Pixelate ala WhatsApp vs Gaussian Blur halus).
6. **Rotasi Elemen (Shape, Teks, Emoji)**: Elemen yang dipilih memiliki tuas rotasi (*top stem handle*) yang memungkinkan pengguna memutar elemen (0 - 360°) secara interaktif.
7. **Ukuran Coretan Pensil (Brush Stroke Size)**: Pengguna dapat mengatur ketebalan coretan pensil (Tipis, Sedang, Tebal, Sangat Tebal).
8. **Warna Pinggir, Warna Isi, dan Pengubah Bentuk (Shape Switcher)**:
   - Pengguna dapat memilih warna garis pinggir (*stroke*) dan warna isi (*fill* - dengan opsi transparan).
   - Pengguna dapat mengubah tipe bentuk aktif secara langsung (Kotak ↔ Lingkaran ↔ Garis ↔ Panah) tanpa perlu menghapus dan membuat ulang.
9. **Interactive Emoji (Drag & Drop, Rotasi, Resize)**: Emoji ditempatkan sebagai *overlay element* interaktif yang bisa digeser, diputar, dan diubah ukurannya.

---

## 2. Command Verifikasi
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL/siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Architecture

### TypeScript Overlay Layer Schema
```typescript
export type OverlayElement =
  | {
      id: string;
      type: 'text';
      text: string;
      x: number; // percentage (0-100)
      y: number; // percentage (0-100)
      rotation: number; // degrees (0-360)
      color: string;
      fontName: string;
      hasBackground: boolean;
    }
  | {
      id: string;
      type: 'shape';
      shapeType: 'rect' | 'circle' | 'line' | 'arrow';
      x: number; // center x %
      y: number; // center y %
      width: number; // %
      height: number; // %
      rotation: number; // degrees (0-360)
      strokeColor: string;
      fillColor: string; // 'transparent' or color hex
      strokeWidth: number;
    }
  | {
      id: string;
      type: 'blur';
      blurType: 'pixelate' | 'gaussian';
      intensity: number; // 4 - 30
      x: number; // center x %
      y: number; // center y %
      width: number; // %
      height: number; // %
    }
  | {
      id: string;
      type: 'emoji';
      emoji: string;
      x: number; // center x %
      y: number; // center y %
      size: number; // px or %
      rotation: number; // degrees (0-360)
    };
```

---

## 4. Acceptance Criteria (Given-When-Then)

### AC-1: Tool Exclusivity
- **Given** Guru sedang mengaktifkan alat Pensil (dapat menggambar di kanvas).
- **When** Guru menekan tombol Shape di top toolbar.
- **Then** Alat Pensil langsung dinonaktifkan (`isPenActive = false`, sub-palette pena tertutup), dan Shape Tool menjadi aktif dengan popover 2x2.

### AC-2: Persistence & Click to Select
- **Given** Guru telah menempatkan teks atau shape di atas foto.
- **When** Guru mengetuk area foto kosong di luar elemen tersebut.
- **Then** Garis hijau seleksi hilang sehingga foto bersih.
- **When** Guru mengetuk kembali teks atau shape tersebut.
- **Then** Elemen kembali terseleksi dengan garis hijau, tuas rotasi, handle resize, dan toolbar bawah yang sesuai terbuka.

### AC-3: Rotasi Foto di Baris Bawah
- **Given** Guru berada di tampilan editor foto WhatsApp.
- **When** Guru menekan tombol putar cepat (+90°) di baris bawah utama.
- **Then** Foto langsung diputar 90 derajat searah jarum jam secara fisik tanpa harus masuk ke mode potong.

### AC-4: Teks Tanpa Latar Belakang
- **Given** Guru mengklik tombol toggle `✓ Latar belakang` hingga tidak aktif.
- **When** Kotak teks ditampilkan di atas foto.
- **Then** Latar belakang teks 100% transparan tanpa kotak hitam semu / blur, dan teks tetap jelas dengan text shadow.

### AC-5: Interactive Blur Zone
- **Given** Guru mengklik alat blur / sensor.
- **When** Kotak sensor muncul di atas foto.
- **Then** Guru dapat menyeret posisi sensor ke wajah murid, menarik 8 handle untuk memperbesar/memperkecil, mengubah jenis blur (Pixelate vs Gaussian), dan mengatur intensitas blur.

### AC-6: Rotasi Shape, Teks, dan Emoji
- **Given** Elemen teks, shape, atau emoji sedang terseleksi.
- **When** Guru menyeret tuas lingkaran rotasi di atas elemen.
- **Then** Elemen berputar mengikuti sudut seretan pointer secara *real-time* (0-360°), dan hasil rotasi tersimpan serta ter-render sempurna saat diekspor.

### AC-7: Ukuran Coretan Pensil & Warna Shape (Stroke + Fill)
- **Given** Guru memilih pensil atau shape.
- **Then** Pensil menyediakan pilihan ketebalan coretan.
- **Then** Shape menyediakan pilihan warna garis pinggir (*stroke*), warna isi (*fill* termasuk transparan), serta kemampuan mengganti tipe bentuk (misal Lingkaran diubah ke Kotak).

---

## 5. Out of Scope
- Server-side image rendering engine (seluruh manipulasi dilakukan *client-side* murni dengan HTML5 Canvas offscreen agar performa secepat kilat).
