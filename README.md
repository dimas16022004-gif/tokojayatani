# 🌾 Toko Jaya Tani - Aplikasi Web Manajemen Toko & Kasir Sederhana

Aplikasi web manajemen toko & kasir modern, intuitif, dan responsif yang dirancang khusus agar mudah digunakan oleh orang tua untuk mencatat stok barang dan transaksi penjualan toko pertanian **Toko Jaya Tani**.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js 14+ (App Router) + TypeScript
- **Styling**: Tailwind CSS (Desain bersih, responsif HP & Laptop, warna bertema alam/tani)
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL & Client)
- **RPC Stored Function**: `process_transaction` (Transaksi atomik & pengurangan stok otomatis)

---

## 📁 Struktur Folder Project

```text
TokoJayaTani/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout + Navbar Responsif (Desktop & Bottom Mobile Bar)
│   │   ├── page.tsx               # Halaman Kasir / Transaksi Sederhana (POS)
│   │   ├── produk/
│   │   │   └── page.tsx           # Halaman Kelola Stok & Produk (CRUD + Badge Merah Stok Menipis)
│   │   ├── laporan/
│   │   │   └── page.tsx           # Halaman Ringkasan Laporan Penjualan (Hari Ini & Keuntungan)
│   │   └── globals.css            # Tailwind Directives & Custom Touch Scrollbars
│   ├── components/
│   │   ├── Navbar.tsx             # Navigasi atas (Desktop) & Navigasi bawah (HP)
│   │   ├── ProductCard.tsx        # Card Produk untuk Kasir
│   │   ├── CartDrawer.tsx         # Keranjang Belanja Floating, Kembalian & Modal Nota Transaksi
│   │   ├── ProductTable.tsx       # Tabel Produk dengan Filter, Badge Stok Menipis & Tombol Aksi
│   │   ├── ProductModal.tsx       # Modal Tambah/Edit Produk
│   │   └── StatCard.tsx           # Card Statistik Ringkasan Laporan
│   ├── lib/
│   │   ├── supabaseClient.ts      # Inisialisasi Supabase Client & Fallback Mock Data
│   │   ├── types.ts               # Interface TypeScript (Product, CartItem, Transaction, dll)
│   │   └── utils.ts               # Helper formatRupiah(), formatDateTime(), cn()
├── supabase/
│   └── schema.sql                 # Script Database SQL Supabase lengkap (Tabel, RPC, Trigger, & Seed)
├── .env.local.example             # Template variabel lingkungan Supabase
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🗄️ Langkah-Langkah Setting Database Supabase

1. Buat project baru di **[Supabase Console](https://supabase.com)**.
2. Masuk ke menu **SQL Editor** pada Dashboard Supabase Anda.
3. Buka file `supabase/schema.sql` pada project ini, lalu salin dan jalankan (*Run*) seluruh script SQL tersebut.
   - Script ini secara otomatis membuat tabel `products`, `transactions`, `transaction_items`, trigger `updated_at`, fungsi RPC atomik `process_transaction`, dan **Seed Data produk awal Toko Jaya Tani** (Pupuk, Benih, Pestisida, Alat Tani).
4. Masuk ke **Project Settings -> API** di Dashboard Supabase untuk menyalin credentials:
   - `Project URL`
   - `anon / public key`

---

## ⚙️ Cara Menjalankan Aplikasi Secara Lokal

1. **Salin File Environment Variable**:
   Buat file `.env.local` pada folder utama project dan isikan kredensial Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxx.xxxxxxx
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```

4. **Buka Aplikasi di Browser**:
   Akses `http://localhost:3000` pada browser laptop atau perangkat HP Anda.

---

## 💡 Fitur Utama Aplikasi

### 1. Halaman Kasir / Transaksi (POS) (`/`)
- **Pencarian Cepat**: Cari nama barang dengan mudah atau filter per kategori.
- **Keranjang Belanja Interaktif**: Tambah/kurangi kuantitas barang dengan tombol `+` dan `-` yang besar dan mudah ditekan di HP.
- **Kalkulator Kembalian Otomatis**: Menampilkan total belanja, opsi uang pas/nominal, dan menghitung uang kembalian secara real-time.
- **Transaksi Atomik & Pengurangan Stok**: Menggunakan fungsi RPC Supabase `process_transaction` untuk memasukkan record transaksi dan **mengurangi stok barang secara otomatis**.
- **Nota Cetak**: Menampilkan nota ringkas yang siap dicetak/ditunjukkan kepada pembeli setelah transaksi berhasil.

### 2. Halaman Kelola Stok & Produk (`/produk`)
- **Tabel Ringkas**: Menampilkan daftar produk, harga modal, harga jual, dan stok saat ini.
- **Badge Merah Stok Menipis/Habis**: Indikator **Merah** menonjol saat `stok <= min_stock` agar toko tidak kehabisan persediaan barang.
- **Fitur CRUD**: Tambah produk baru, edit harga/stok, atau hapus produk.

### 3. Halaman Laporan Penjualan (`/laporan`)
- **Ringkasan Penjualan Hari Ini**: Menampilkan **Total Pendapatan (Omzet)** dan **Total Keuntungan Kotor** secara real-time.
- **Daftar Restock Kritis**: Menampilkan produk mana saja yang perlu segera diisi ulang.
- **Riwayat Penjualan**: Menampilkan daftar transaksi terbaru beserta detail nilainya.
