# Project Quality Constraints (CONSTRAINTS.md)

Dokumen ini adalah kontrak kualitas kode (*quality bar*) untuk proyek Siedu yang bersifat mengikat bagi setiap developer dan AI Agent. Dilarang menurunkan standar (*weakening the bar*) dalam setiap perubahan kode.

---

## 1. Type Safety & Compiler Constraints
- **Strict TypeScript:** Kode harus selalu lolos kompilasi tanpa error (`npx tsc --noEmit`).
- **Zero Suppression:** Dilarang menambahkan `@ts-ignore`, `@ts-expect-error`, atau `as any` untuk membungkam pesan error tipe data. Selesaikan akar masalah tipe secara semantik.
- **Linter Suppressions:** Dilarang menyisipkan `eslint-disable` tanpa persetujuan eksplisit dari human developer.

---

## 2. Arch & Implementation Constraints (Anti-Overengineering & YAGNI)
- **Minimal Viable Diff (Ponytail Mode):** Solusi terkecil dan paling sederhana yang memenuhi acceptance criteria adalah solusi yang dipilih.
- **No Speculative Abstractions:** Dilarang membuat wrapper, helper, interface generic, atau opsi konfigurasi yang belum memiliki pemanggil nyata.
- **Vertical Slicing:** Fitur dikembangkan dalam irisan vertikal end-to-end yang dapat diverifikasi mandiri, bukan pecahan layer horizontal yang terbengkalai.

---

## 3. UI/UX & Design Constraints
- **Icon Restraint:**
  - Dilarang menambahkan ikon dekoratif/pemanis pada tombol teks, heading, atau label standar.
  - Dilarang membuat ikon di dalam kotak/lingkaran berwarna pada kartu metrik atau kartu KPI (*"KPIs are type, not tiles"*).
  - Ikon hanya untuk: (1) Navigasi utama sidebar, (2) Tombol ikon mandiri dengan `aria-label`, (3) Status alert kritis.
- **Pemisahan Deskripsi & Counter (Anti-Redundant Counter):**
  - Dilarang menyisipkan counter angka/total dinamis ke dalam kalimat subtitle atau deskripsi (contoh dilarang: `"Daftar kelas aktif · 5 kelas"`). Metrik harus berdiri sendiri pada elemen KPI atau visual data.
- **Anti-Header Pill Clutter (Larangan Pill/Badge di Header Halaman):**
  - Dilarang menaruh pill, badge ber-border, atau chip (misal: `"5 Siswa"`, `"Kelas Aktif"`, badge kategori) tepat di samping heading (H1/H2) atau di baris header halaman.
  - Header halaman wajib mengandalkan tipografi yang bersih dan berwibawa. Counter angka dialokasikan ke tab bar atau kartu KPI; metadata status disajikan sebagai teks subheader yang tenang atau di panel ringkasan data.
- **Responsive & Accessible:**
  - Seluruh layout wajib responsif hingga layar mobile (< 640px).
  - Elemen interaktif harus mendukung navigasi keyboard (`focus-visible`) dan memiliki kontras warna yang memenuhi standar WCAG AA.

---

## 4. Performance & Next.js Constraints
- **Eliminate Waterfalls:** Selalu gunakan `Promise.all()` untuk pengambilan data independen yang tidak saling bergantung.
- **RSC Serialization:** Hanya kirim data yang benar-benar dibutuhkan oleh Client Components dari Server Components.
- **No Barrel Re-exports:** Hindari mengimpor dari barrel files (`index.ts`) yang membengkakkan bundle size; impor langsung dari modul spesifik.
- **Clean Conditionals:** Gunakan ternary (`condition ? <Comp /> : null`), hindari operator `&&` yang berisiko merender angka `0` atau `false` ke DOM.

---

## 5. Verification Gate Before Landing
Setiap task dianggap **selesai** HANYA jika:
1. `npx tsc --noEmit` lolos dengan exit code 0 tanpa error.
2. Diff perubahan tidak melanggar aturan-aturan di atas.
3. Kode memenuhi acceptance criteria dari spec atau tiket yang dikerjakan.
