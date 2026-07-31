import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const viewport: Viewport = {
  themeColor: "#166534",
};

export const metadata: Metadata = {
  title: "Toko Jaya Tani - Kasir & Manajemen Stok",
  description: "Aplikasi web manajemen toko tani yang mudah & intuitif untuk mencatat stok barang dan penjualan.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Toko Jaya Tani",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col pb-20 md:pb-6">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
