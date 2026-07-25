"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, BarChart3, Store, BookOpen } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Kasir / Penjualan",
      mobileLabel: "Kasir",
      icon: ShoppingCart,
    },
    {
      href: "/produk",
      label: "Kelola Stok & Produk",
      mobileLabel: "Produk",
      icon: Package,
    },
    {
      href: "/bon",
      label: "Catatan Piutang",
      mobileLabel: "Piutang",
      icon: BookOpen,
    },
    {
      href: "/laporan",
      label: "Laporan Penjualan",
      mobileLabel: "Laporan",
      icon: BarChart3,
    },
  ];

  return (
    <>
      {/* Top Header Navigation (Desktop & Tablet) */}
      <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-400 text-emerald-900 flex items-center justify-center font-bold text-xl sm:text-2xl shadow-lg group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-950" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-amber-300">
                  TOKO JAYA TANI
                </h1>
                <p className="text-xs sm:text-sm text-emerald-200 font-medium">
                  Sistem Kasir & Manajer Stok
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isActive
                        ? "bg-amber-400 text-emerald-950 shadow-md scale-105"
                        : "text-emerald-100 hover:bg-emerald-700 hover:text-white"
                    } ${item.href === "/bon" && !isActive ? "text-rose-200 hover:text-white" : ""}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.href === "/bon" && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Bottom Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-900 border-t border-emerald-700 shadow-2xl px-2 py-1.5">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all relative ${
                  isActive
                    ? "bg-amber-400 text-emerald-950 font-black scale-95 shadow-lg"
                    : "text-emerald-200 font-medium hover:text-white hover:bg-emerald-800"
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-0.5 ${isActive ? "text-emerald-950" : item.href === "/bon" ? "text-rose-300" : "text-emerald-300"}`}
                />
                {/* Dot indikator Bon */}
                {item.href === "/bon" && !isActive && (
                  <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                )}
                <span className="text-[10px] leading-tight text-center truncate max-w-full">
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
