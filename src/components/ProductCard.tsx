"use client";

import { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { Plus, AlertTriangle, Check } from "lucide-react";

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({
  product,
  cartQuantity,
  onAddToCart,
}: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.min_stock;
  const remainingStock = product.stock - cartQuantity;

  return (
    <div
      className={`relative flex flex-col justify-between p-4 bg-white rounded-2xl border-2 transition-all shadow-sm ${
        isOutOfStock
          ? "border-gray-200 opacity-60 bg-gray-50"
          : isLowStock
          ? "border-amber-300 hover:border-amber-500 hover:shadow-md"
          : "border-emerald-100 hover:border-emerald-500 hover:shadow-md"
      }`}
    >
      {/* Top Header: Badge Kategori & Indikator Stok Menipis */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 uppercase tracking-wider">
          {product.category}
        </span>

        {isOutOfStock ? (
          <span className="px-2 py-1 text-xs font-black text-white bg-rose-600 rounded-md flex items-center gap-1 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> STOK HABIS
          </span>
        ) : isLowStock ? (
          <span className="px-2 py-1 text-xs font-bold text-amber-900 bg-amber-200 rounded-md flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-800" /> Sisa {product.stock}
          </span>
        ) : (
          <span className="text-xs font-bold text-gray-500">
            Stok: <strong className="text-gray-900 font-extrabold">{product.stock}</strong>
          </span>
        )}
      </div>

      {/* Main Info: Nama Produk & Harga */}
      <div className="my-2">
        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
          {formatRupiah(product.sell_price)}
        </p>
      </div>

      {/* Bottom Button Action */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        {cartQuantity > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full flex items-center gap-1 border border-amber-300">
            <Check className="w-3.5 h-3.5 text-amber-700" /> {cartQuantity} di keranjang
          </span>
        )}

        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock || remainingStock <= 0}
          className={`w-full py-2.5 px-3 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
            isOutOfStock || remainingStock <= 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
          }`}
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>{remainingStock <= 0 ? "Stok Maksimal" : "Tambah"}</span>
        </button>
      </div>
    </div>
  );
}
