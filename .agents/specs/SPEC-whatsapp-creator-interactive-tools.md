# SPEC: Interactive Photo Tools & Creative Elevation (WhatsApp Story Creator)

> **Modul ID:** `whatsapp-creator-interactive-tools`  
> **Aktor:** Guru (`role: guru`)  
> **Status:** Approved by User via SDD Phase 1 Grill  
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md).  
> **Scope:**
> 1. Crop & Rotasi Interaktif: Interactive drag handles (pembatas 8 titik tarik sudut/sisi) + rotasi searah jarum jam akumulatif (+90° kontinu), lawan jarum jam, dan tombol reset.
> 2. Carousel Filter Kamera: Pita thumbnail mini melayang di bawah kanvas dengan pratinjau efek visual asli.
> 3. Teks Overlay In-place & Draggable: Teks muncul di tengah kanvas dengan card latar belakang kontras, dapat diketik langsung dan dipindahkan (*drag & drop*) bebas di atas gambar.
> 4. Menu Bentuk Penyorot (Shape Tool): Kotak, Lingkaran, Garis Bawah, dan Tanda Panah (Arrow).
> 5. Pembersihan UI: Menghapus tombol stiker cepat bintang dan lencana HD.

---

## 1. Objective & User Stories

### A. Objective
Meningkatkan keluwesan dan kenyamanan guru saat menyunting foto kegiatan di `WhatsappStoryCreatorModal`, menghadirkan interaksi cropping dan manipulasi teks yang profesional ala WhatsApp / Instagram story editor.

### B. User Stories
1. **Crop & Rotasi Interaktif:**
   - Guru dapat membuka mode Crop/Rotate. Muncul overlay bingkai pemotong dengan titik pegangan (*drag handles*) di sudut dan sisi untuk memotong area fokus foto.
   - Guru dapat memutar foto 90° searah jarum jam terus menerus tanpa berbalik, atau memutar berlawanan arah, serta mereset crop/rotasi ke kondisi awal.
   - Saat "Selesai" diklik, foto dipotong sesuai area yang dipilih.
2. **Carousel Filter Kamera:**
   - Saat tombol filter diklik, muncul pita kartu mini melayang horizontal di atas footer yang menampilkan live preview foto dengan berbagai filter (Asli, Monokrom/B&W, Hangat/Warm, Sejuk/Cool, Sinematik/Vivid) lengkap dengan label nama filter.
3. **Teks Overlay Draggable dengan Card:**
   - Menekan tool teks (`Aa`) langsung memunculkan elemen teks di tengah foto dengan latar belakang kartu semi-transparan (`bg-black/60 backdrop-blur-xs`) agar tulisan selalu kontras dan terbaca.
   - Guru dapat langsung mengetik, memilih warna pena/teks, dan menyeret (*drag & drop*) posisi teks ke area mana pun di atas foto.
4. **Pemilih Bentuk Penyorot:**
   - Menekan tool bentuk membuka popover pilihan 4 bentuk: Kotak (*Rectangle*), Lingkaran (*Circle*), Garis Bawah (*Underline*), dan Panah (*Arrow*).
5. **Kebersihan Antarmuka:**
   - Tombol bintang cepat (`SmilePlus`) dan lencana `HD` dihilangkan untuk menjaga estetika toolbar yang ringkas dan bebas distraksi.

---

## 2. Command Verifikasi (Quality Contract)

```bash
# Verifikasi TypeScript via PowerShell Windows
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Detail Implementasi & Vertical Slices

- **Slice 1: UI Cleanup & Rotasi/Crop State**
  - Hapus tombol bintang (`SmilePlus`) dan lencana `HD`.
  - Tambahkan mode Crop Interaktif dengan overlay pembatas 8 handles (Top-Left, Top, Top-Right, Right, Bottom-Right, Bottom, Bottom-Left, Left).
  - Rotasi searah jarum jam akumulatif (+90° setiap klik) & lawan jarum jam (-90°) serta Reset.
- **Slice 2: Carousel Filter Kamera**
  - Array filter preset: Asli, B&W, Hangat, Sejuk, Sinematik, Vintage.
  - Floating thumbnail carousel melayang di atas footer saat filter aktif.
- **Slice 3: Teks Overlay Draggable dengan Card**
  - State teks overlay: `{ text: string, x: number, y: number, color: string, active: boolean }`.
  - In-place textarea/input dengan background card kontras, support mouse drag & touch drag.
- **Slice 4: Multi-Shape Selector**
  - Dropdown/popover pilihan bentuk: Kotak, Lingkaran, Garis, Panah.
- **Slice 5: Render Flattening & Verification**
  - Flattening menggabungkan crop, rotasi, filter, canvas coretan, bentuk, dan teks draggable secara presisi ke dalam foto final.

---

## 4. Acceptance Criteria (Given - When - Then)

1. *Given* Guru mengklik tombol Crop/Rotate, *When* Guru menarik sudut pembatas crop dan memutar 90° searah jarum jam, *Then* rotasi berputar 90° terus tanpa mundur, dan saat menekan tombol centang/Selesai, gambar terpotong sesuai pembatas.
2. *Given* Guru mengklik tombol Filter, *When* pita carousel muncul, *Then* guru dapat memilih filter visual dengan thumbnail pratinjau mini.
3. *Given* Guru mengklik tool `Aa`, *When* card teks muncul di tengah foto, *Then* guru dapat mengetik langsung dan memindahkan teks ke posisi yang diinginkan.
4. *Given* Guru mengklik tool Bentuk, *When* menu muncul, *Then* guru dapat memilih Kotak, Lingkaran, Garis, atau Panah.
5. *Given* Toolbar dilihat, *Then* tidak ada lagi tombol bintang cepat dan tombol HD.
6. *Given* Verifikasi tipe dijalankan, *Then* `npx tsc --noEmit` lolos dengan exit code 0.
