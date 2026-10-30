<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Env rule (WSL + Windows)

Project di drive Windows (`/mnt/d/...`). Semua perintah npm (`install`, `dev`, `build`, `lint`) dan git commit HANYA dari PowerShell Windows. JANGAN jalankan npm dari WSL — binari native (mis. lightningcss) beda OS, dan campur install bikin dev server rusak.

### Aturan Eksekusi Interop (Agar task tidak hang / canceled):
Saat agent di WSL memanggil PowerShell Windows untuk verifikasi (`tsc`, `lint`, dll.), SELALU sertakan flag `-NonInteractive -NoProfile` dan redirect input `< /dev/null`:
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```
*Alasan*: Tanpa `-NonInteractive` dan tanpa `< /dev/null`, PowerShell Windows berjalan dalam mode interaktif dan mengikat console stdin, sehingga proses background di WSL menggantung (*hang*) menunggu input hingga akhirnya dihentikan/dibatalkan (*canceled*).

## Prinsip Desain & Implementasi (YAGNI & Mindful Decision Making)

1. **Think & Deliberate Before Coding (Menimbang Sebelum Menulis Kode):**
   - Sebelum membuat fitur baru, perubahan besar, atau arsitektur baru, pertimbangkan:
     * Apa masalah inti yang ingin diselesaikan?
     * Apa solusi paling sederhana dan minimal (KISS - Keep It Simple, Stupid)?
     * Apakah ada asumsi atau dependensi tersembunyi yang perlu diklarifikasi?
   - Untuk setiap fitur baru atau perubahan non-trivial: **AI WAJIB melakukan proses "grill" / wawancara kebutuhan** terlebih dahulu. Ajukan pertanyaan kritis secara terarah (menggunakan pilihan opsi interaktif beserta rekomendasi AI) untuk memvalidasi kebutuhan esensial dan mengeliminasi fitur yang belum diperlukan SEBELUM menulis kode sebaris pun.
   - Untuk perbaikan kecil/pasti (misal: perbaikan bug spesifik, fix typo, atau perubahan instruksi yang sudah jelas 100%), AI dapat langsung mengeksekusi secara minimal tanpa proses wawancara panjang.

2. **Anti-Overengineering (YAGNI - You Aren't Gonna Need It):**
   - HANYA buat apa yang diminta secara eksplisit oleh user.
   - DILARANG menambahkan fitur spekulatif untuk "jaga-jaga di masa depan", helper/utilitas yang belum ada pemanggilnya, abstraksi yang terlalu dini (*premature abstraction*), atau opsi konfigurasi yang tidak diminta.
   - Hindari membuat boilerplate berlebihan atau struktur file yang rumit jika solusi sederhana sudah cukup.

3. **Smallest Viable Increment (Implementasi Bertahap & Tepat Sasaran):**
   - Buat implementasi dalam iterasi terkecil yang langsung berfungsi dan bisa diverifikasi.
   - Jangan menambahkan komponen atau data dummy yang tidak relevan dengan esensi tugas.
