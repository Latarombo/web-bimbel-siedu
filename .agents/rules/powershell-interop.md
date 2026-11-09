# PowerShell Interop Execution Rule (WSL + Windows)

Saat agen berjalan di WSL dan perlu memanggil PowerShell Windows untuk verifikasi (`tsc`, `lint`, `test`, dll.):

1. **Selalu sertakan flag `-NonInteractive -NoProfile`** dan **arahkan input kosong `< /dev/null`**:
   ```bash
   powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
   ```
2. **Penyebab masalah sebelumnya**:
   Tanpa `-NonInteractive` dan `< /dev/null`, PowerShell Windows secara bawaan berjalan dalam mode interaktif dan mengikat console stdin. Di background subprocess WSL, ini menyebabkan proses menggantung (*hang*) menunggu input dan akhirnya dibatalkan (*canceled*).
3. **Aturan Environment**:
   - Perintah npm mutating (`install`, `dev`, `build`, `lint`) dan git commit hanya dijalankan dari sisi Windows.
   - Verifikasi read-only via interop wajib menggunakan format non-interaktif di atas.
