@echo off
title Toko Jaya Tani - Menjalankan Aplikasi Kasir
color 2F
echo ====================================================================
echo               TOKO JAYA TANI - SISTEM KASIR & STOK
echo ====================================================================
echo.
echo Sedang menyiapkan aplikasi web...
echo Browser akan terbuka secara otomatis dalam beberapa detik.
echo.

cd /d "c:\xampp\htdocs\TokoJayaTani"

:: Buka browser otomatis ke localhost:3000 setelah jeda singkat
start timeout /t 3 >nul & start http://localhost:3000

:: Jalankan server Next.js dev
npm run dev
