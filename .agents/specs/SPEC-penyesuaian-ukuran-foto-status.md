# SPEC: Penyesuaian Ukuran Foto Status Pembelajaran (Adaptive Aspect Ratio & Fit Contain)

> **Modul ID:** `penyesuaian-ukuran-foto-status`  
> **Aktor:** Guru (`role: guru`) & Wali Murid (`role: orang_tua`)  
> **Status:** Approved by User via SDD Phase 1 Grill  
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md).  
> **Scope:**
> 1. Modal Editor Status WhatsApp (`WhatsappStoryCreatorModal`): Kanvas & container foto membungkus dimensi fisik foto secara presisi (*hug content*) agar coretan, stiker, dan teks overlay presisi 1:1 tanpa distorsi koordinat.
> 2. Form Pembuatan Status Standar (`StatusForm`): Thumbnail foto dan pratinjau wali murid menyesuaikan aspek rasio foto asli (*fit / contain*), mencegah pemotongan paksa (*unintended cropping*).

---

## 1. Objective & User Story

### A. Objective
Memastikan seluruh foto kegiatan pembelajaran yang diunggah oleh guru—baik yang berorientasi portrait (9:16 / 3:4), square (1:1), maupun landscape (16:9 / 4:3)—menyesuaikan ukuran dan aspek rasio aslinya tanpa terpotong (*fit / contain*) dengan latar belakang ambient yang estetis, serta menjaga akurasi koordinat kanvas coretan/stiker pada editor status.

### B. User Stories
1. **Sebagai Guru di Modal Editor Status WhatsApp:**
   - Saat saya memilih foto berorientasi apa pun (tegak portrait atau mendatar landscape), kontainer kanvas kerja secara dinamis membungkus ukuran foto yang ditampilkan (*tight hug content*).
   - Saat saya mencoret menggunakan kuas/pena, menempelkan teks overlay, bentuk kotak, atau emoji, coretan menempel tepat di atas titik foto yang saya tuju (koordinat piksel kanvas 1:1 dengan gambar fisik).
   - Saat foto diputar 90°/270°, kanvas dan resolusi gambar hasil ekspor menyesuaikan orientasi baru tanpa terpotong (*bounding box swap*).
   - Area di luar foto tetap mempertahankan latar belakang ambient blur sinematik ala WhatsApp Web.

2. **Sebagai Guru di Form Standar Status (`StatusForm`):**
   - Saat memilih foto (maksimal 5), thumbnail tidak lagi dipaksa bujur sangkar terpotong (`aspect-square object-cover`), melainkan menampilkan foto secara utuh (`object-contain` dengan latar belakang neutral yang rapi).
   - Pada kartu "Pratinjau Tampilan Wali Murid", foto ditampilkan dengan rasio asli penuh (*preserve aspect ratio*) yang adaptif (misal 1 foto tampil besar adaptif `max-h-72 object-contain`, multi-foto tampil dalam grid adaptif).

---

## 2. Command Verifikasi (Quality Contract)

```bash
# Verifikasi TypeCheck via PowerShell Windows
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Detail Implementasi & Perubahan Kode

### A. `WhatsappStoryCreatorModal` (`src/components/teacher/whatsapp-story-creator-modal.tsx`)
1. **Wrapper Foto & Kanvas Menyesuaikan Ukuran Gambar:**
   - Bungkus tag `<img>` dan `<canvas>` dalam wrapper `inline-flex` / `relative w-fit h-fit max-w-full max-h-full` yang menyatu erat dengan dimensi rendered `<img>`.
   - Gunakan `w-auto h-auto max-h-[60vh] sm:max-h-[64vh] max-w-[90vw] sm:max-w-2xl object-contain` pada `<img>`.
   - Sinkronisasi ukuran canvas pada `initCanvas`:
     ```ts
     const img = imgRef.current;
     if (!img || !canvas) return;
     const rect = img.getBoundingClientRect();
     canvas.width = Math.round(rect.width) || img.naturalWidth || 600;
     canvas.height = Math.round(rect.height) || img.naturalHeight || 450;
     ```
2. **Koreksi Dimensi Ekspor Foto Terputar (Rotation Bounds):**
   - Pada fungsi `getFlattenedActivePhoto`:
     ```ts
     const isSideways = currentRotation === 90 || currentRotation === 270;
     offscreen.width = isSideways ? img.height : img.width;
     offscreen.height = isSideways ? img.width : img.height;
     ```
     Memastikan saat foto portrait diputar menjadi landscape atau sebaliknya, tidak ada bagian gambar yang terpotong oleh canvas offscreen.

### B. `StatusForm` (`src/components/teacher/status-form.tsx`)
1. **Thumbnail Galeri Foto:**
   - Ubah kontainer dari `aspect-square` dengan `object-cover` menjadi kontainer yang ramah rasio asli (`aspect-4/3` atau adaptif dengan `object-contain p-1` berlatar belakang gelap/netral), sehingga wajah murid atau dokumen kegiatan tidak terpotong tepi atas/bawahnya.
2. **Pratinjau Tampilan Wali Murid (`parentPreview`):**
   - Jika 1 foto: tampilkan secara menonjol dengan kontainer adaptif (`max-h-72 w-full flex items-center justify-center bg-slate-900/5 dark:bg-slate-800/50 rounded-xl p-2`, gambar `max-h-68 w-auto max-w-full object-contain rounded-lg`).
   - Jika >1 foto: tampilkan grid 2-3 kolom dengan rasio `aspect-4/3` dan `object-contain` berlatar belakang lembut.

---

## 4. Acceptance Criteria (Given - When - Then)

- **Skenario 1: Foto Portrait di Editor WhatsApp**
  - *Given* Guru memilih foto dengan rasio portrait 9:16 (misal foto kamera HP tegak).
  - *When* Modal `WhatsappStoryCreatorModal` terbuka.
  - *Then* Foto ditampilkan tegak utuh tanpa terpotong, kanvas coretan pas menutupi dimensi foto, dan latar belakang ambient blur mengisi ruang samping layar.

- **Skenario 2: Menggambar dan Stiker pada Foto**
  - *Given* Guru mengaktifkan Pena atau menempelkan Stiker/Emoji di ujung foto portrait maupun landscape.
  - *When* Guru mencoretkan garis atau stiker.
  - *Then* Posisi coretan dan stiker berada persis di koordinat kursor/sentuhan tanpa pergeseran atau distorsi skala.

- **Skenario 3: Thumbnail & Pratinjau Form Standar**
  - *Given* Guru mengunggah foto kegiatan di `StatusForm`.
  - *When* Foto muncul di daftar dokumentasi dan pratinjau wali murid.
  - *Then* Seluruh foto terlihat utuh (*fit / contain*) tanpa pemotongan kepala atau teks dokumen kegiatan.

- **Skenario 4: Typecheck Bersih**
  - *When* Perintah `npx tsc --noEmit` dijalankan.
  - *Then* Keluar dengan exit code 0 tanpa error tipe.

---

## 5. Out of Scope

- Pemotongan manual bebas (freehand cropping tool dengan slider sudut arbitrer).
- Pengubahan skema database PostgreSQL.
