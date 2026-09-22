# Siedu Project Rules & Guidelines

## Env rule (WSL + Windows)

Project di drive Windows (`/mnt/d/...`). Semua perintah npm (`install`, `dev`, `build`, `lint`) dan git commit HANYA dari PowerShell Windows. JANGAN jalankan npm dari WSL — binari native (mis. lightningcss) beda OS, dan campur install bikin dev server rusak.

### Aturan Eksekusi Interop PowerShell (Agar task tidak hang / canceled)
Saat agent di WSL memanggil PowerShell Windows untuk verifikasi (`tsc`, `lint`, dll.), SELALU sertakan flag `-NonInteractive -NoProfile` dan redirect input `< /dev/null`:
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```
*Alasan*: Tanpa `-NonInteractive` dan tanpa `< /dev/null`, PowerShell Windows berjalan dalam mode interaktif dan mengikat console stdin, sehingga proses background di WSL menggantung (*hang*) menunggu input hingga akhirnya dihentikan/dibatalkan (*canceled*).
