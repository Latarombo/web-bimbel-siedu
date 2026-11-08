<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 1. Aturan Environment (WSL + Windows Interop)

Project berada di drive Windows (`/mnt/d/...`).
- **Mutating Commands**: Semua perintah npm mutating (`install`, `dev`, `build`, `lint`) dan git commit **HANYA** boleh dijalankan dari PowerShell Windows. JANGAN jalankan npm dari WSL — binari native (mis. lightningcss) berbeda OS dan mencampur install dapat merusak dev server.
- **Interop Verifikasi (WSL ke PowerShell Windows)**:
  Saat agent di WSL memanggil PowerShell Windows untuk verifikasi (`tsc`, `lint`, dll.), **SELALU** sertakan flag `-NonInteractive -NoProfile` dan redirect input `< /dev/null`:
  ```bash
  powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
  ```
  *Alasan*: Tanpa `-NonInteractive` dan tanpa `< /dev/null`, PowerShell Windows berjalan dalam mode interaktif dan mengikat console stdin, sehingga proses background di WSL menggantung (*hang*) menunggu input hingga akhirnya dibatalkan (*canceled*).

---

## 2. Metodologi Spec-Driven Development (SDD) & Siklus Kerja

Setiap penambahan fitur baru, perubahan besar, atau keputusan arsitektur non-trivial **WAJIB** mengikuti siklus kerja SDD berikut:

```
[1. Grill / Wawancara] ➔ [2. Tulis Spec (.agents/specs/)] ➔ [3. Cek Constraints] 
       ➔ [4. Vertical Slices (Tiket)] ➔ [5. Implementasi Minimalis] ➔ [6. Audit & Verifikasi]
```

1. **Fase 1: Think, Deliberate & Grill (Wawancara Kebutuhan):**
   - Sebelum menulis kode atau spec, AI **WAJIB** melakukan proses wawancara/klarifikasi terarah (menggunakan opsi interaktif beserta rekomendasi AI) untuk memvalidasi kebutuhan nyata, menguji asumsi tersembunyi, dan mengeliminasi fitur spekulatif (*YAGNI*).
   - Untuk perbaikan kecil/pasti (misal: perbaikan bug spesifik, fix typo, atau instruksi yang sudah jelas 100%), AI dapat langsung mengeksekusi secara minimal tanpa wawancara panjang.
2. **Fase 2: Specify (Menulis Kontrak Spesifikasi):**
   - Fitur baru dirumuskan dalam dokumen spesifikasi di folder `.agents/specs/<fitur>.md` sebelum implementasi kode.
   - Komponen spec mencakup: *Objective & User Story*, *Command Verifikasi*, *Data Contracts (TypeScript/Zod/Prisma)*, *Acceptance Criteria (Given-When-Then)*, dan *Out-of-Scope*.
3. **Fase 3: Quality Constraints (Kontrak Kualitas):**
   - Patuhi seluruh standar kualitas yang didefinisikan di [`CONSTRAINTS.md`](CONSTRAINTS.md).
   - Dilarang keras menambahkan supresi tipe (`@ts-ignore`, `@ts-expect-error`), `eslint-disable` tanpa izin, atau melompati/menghapus tes demi mencapai hasil hijau (*green*).
4. **Fase 4: Vertical Slices & Task Breakdown (Tracer Bullets):**
   - Pekerjaan dipecah menjadi irisan vertikal kecil (*tracer-bullet slices*) yang mencakup fungsionalitas end-to-end (skema/data, server action/API, UI, validasi) per tiket, bukan membelah layer secara horizontal.
   - Setiap irisan dapat diuji dan diverifikasi secara mandiri.
5. **Fase 5: Implementasi Minimalis (Prinsip Ponytail & Anti-Overengineering):**
   - HANYA buat apa yang diminta secara eksplisit oleh spec dan user (*You Aren't Gonna Need It*).
   - Terapkan pola *ponytail* (lazy senior dev mode): solusi paling sederhana, diff paling ringkas, tanpa wrapper/abstraksi prematur yang belum memiliki pemanggil.
6. **Fase 6: Audit & Verifikasi:**
   - Cocokkan diff hasil perubahan dengan spesifikasi (*anti-spec drift* via skill `check-impl-against-spec`).
   - Verifikasi ketat: `npx tsc --noEmit` wajib bersih dari error sebelum tugas dinyatakan selesai.

---

## 3. Prinsip Desain Visual & UI (Icon Restraint & Clean Typography)

1. **Pembatasan Ikon & Anti-Visual Clutter (Icon Restraint):**
   - **DILARANG** menambahkan ikon dekoratif/pemanis (*decorative icons*) pada tombol teks standar, heading, atau label jika teks sudah jelas maknanya.
   - **DILARANG** membuat ikon di dalam kotak/lingkaran berwarna (*icon in tinted circles/squares*) pada kartu metrik atau kartu KPI. Metrik harus mengandalkan kekuatan tipografi dan angka yang jujur (*"KPIs are type, not tiles"*).
   - Ikon **HANYA** diperbolehkan untuk 3 kondisi:
     1. Navigasi utama (misalnya icon baris sidebar) untuk membantu pemindaian visual (*visual scanning*).
     2. Tombol mandiri tanpa teks (*icon-only button* yang wajib disertai atribut aksesibilitas `aria-label`).
     3. Indikator status kritis yang memerlukan pengenalan instan (misal: alert sukses/peringatan/error).
2. **Pemisahan Deskripsi & Counter Data (Anti-Redundant Counter):**
   - **DILARANG** menyisipkan atau menggabungkan counter angka/total dinamis ke dalam kalimat deskripsi, subtitle grafik/kartu, atau helper text (contoh dilarang: `"Jumlah siswa dengan status 'hadir' per hari · 1 kehadiran"` atau `"Daftar kelas aktif · 5 kelas"`).
   - Teks deskripsi/subtitle HANYA bertugas menjelaskan konteks atau makna visualisasi data secara bersih. Angka atau metrik harus berdiri sendiri pada elemen data yang semestinya (misalnya: kartu KPI, data bar chart, badge terpisah, atau tooltip).
3. **Larangan Pill / Badge Clutter di Header Halaman (Anti-Header Pill Clutter):**
   - **DILARANG KERAS** menaruh pill, badge ber-border, atau chip status/counter (contoh dilarang: pill `"5 Siswa"`, pill `"Kelas Aktif"`, badge kategori, atau label status) berjejer di samping kanan judul halaman (`<h1>`/`<h2>`) atau di dalam baris header utama.
   - Header bertumpuk badge (*badge soup*) adalah anti-pattern dan *AI cliché* yang membuat antarmuka tampak amatir, murahan, dan merusak hierarki tipografi judul utama.
   - **Aturan Alokasi Informasi yang Benar:**
     1. *Counter / Jumlah Item:* Alokasikan ke badge tab navigasi (misal: tab `Roster Siswa (5)`), kartu KPI/metrik terpisah, atau di dalam tabel data.
     2. *Status & Konteks:* Jika status entitas atau konteks perlu diketahui, tampilkan sebagai teks tipografi sekunder yang tenang di subheader (misal: `Periode: Semester Genap 2024/2025`) atau pada panel ringkasan data, BUKAN sebagai pill/kapsul dekoratif di samping teks judul.
     3. Judul halaman (`h1`) harus berdiri bersih, percaya diri, dan berwibawa mengandalkan kekuatan tipografi (*confident, uncluttered typography*).
4. **Anti-AI Clichés & Desain Berkarakter:**
   - Hindari tata letak template seragam dengan border-radius seragam dan shadow abu-abu generic. Rujuk selalu panduan desain di [`.agents/docs/DESIGN.md`](.agents/docs/DESIGN.md) dan skill `frontend-design`.

---

## 4. Standar Kode & Performa React/Next.js

Mengacu pada panduan [`.agents/skills/vercel-react-best-practices/`](.agents/skills/vercel-react-best-practices/):
1. **Eliminasi Waterfall:** Eksekusi async independen secara paralel dengan `Promise.all()`, hindari `await` dini dalam percabangan logika, dan manfaatkan Suspense boundaries.
2. **Optimasi Bundle:** Hindari barrel file re-export besar, gunakan dynamic import (`next/dynamic`) untuk komponen berat non-kritis.
3. **Server-Side & Data Fetching:** Gunakan `React.cache()` untuk deduplikasi query per-request, minimalkan data serialisasi ke Client Component.
4. **Re-render Hygiene:** Turunkan state langsung saat render (hindari `useEffect` untuk state turunan), gunakan callback stabil dan ternary untuk render kondisional (bukan `&&`).

---

## 5. Peta Direktori Dokumentasi Proyek

- [`.agents/docs/PRD.md`](.agents/docs/PRD.md): Spesifikasi kebutuhan fungsional & bisnis Siedu.
- [`.agents/docs/DESIGN.md`](.agents/docs/DESIGN.md): Panduan sistem desain UI, palet token, dan tipografi.
- [`.agents/docs/DAFTAR_HALAMAN.md`](.agents/docs/DAFTAR_HALAMAN.md): Indeks rute halaman, role akses, dan status implementasi.
- [`.agents/docs/ATURAN_SISTEM.md`](.agents/docs/ATURAN_SISTEM.md): Aturan arsitektur dan invariant sistem.
- [`.agents/specs/`](.agents/specs/): Arsip dokumen spesifikasi fitur teknis (hasil workflow SDD).
- [`CONSTRAINTS.md`](CONSTRAINTS.md): Kontrak batasan teknis & standar kualitas kode.
