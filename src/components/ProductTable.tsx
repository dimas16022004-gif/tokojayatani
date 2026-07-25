"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  Barcode,
} from "lucide-react";

interface ProductTableProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export default function ProductTable({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const categories = ["Semua", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory =
      selectedCategory === "Semua" || product.category === selectedCategory;
    const isLow = product.stock <= product.min_stock;
    const matchesLowStock = !onlyLowStock || isLow;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nama barang atau nomor barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 text-base font-semibold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 rounded-xl border-2 border-gray-200 text-base font-bold text-gray-800 bg-gray-50 focus:border-emerald-600 focus:outline-hidden appearance-none pr-10"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  Kategori: {cat}
                </option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-gray-500 absolute right-3 top-4 pointer-events-none" />
          </div>
        </div>

        {/* Action Toggle & Add Product Button */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 font-bold text-xs sm:text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded"
            />
            <span>Stok Menipis ({products.filter((p) => p.stock <= p.min_stock).length})</span>
          </label>

          <button
            onClick={onAddProduct}
            className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base flex items-center gap-2 shadow-md transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-800 text-white text-xs sm:text-sm font-black uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6">Nama Produk</th>
                <th className="py-4 px-4">Barcode / Kategori</th>
                <th className="py-4 px-4 text-right">Harga Modal</th>
                <th className="py-4 px-4 text-right">Harga Jual</th>
                <th className="py-4 px-4 text-center">Stok</th>
                <th className="py-4 px-4 text-center">Status Stok</th>
                <th className="py-4 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-base text-gray-600">Tidak ada produk ditemukan.</p>
                    <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= product.min_stock;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-emerald-50/50 transition-colors ${
                        isOutOfStock
                          ? "bg-rose-50/40"
                          : isLowStock
                          ? "bg-amber-50/40"
                          : ""
                      }`}
                    >
                      <td className="py-4 px-4 sm:px-6 font-extrabold text-gray-900 text-base">
                        {product.name}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 inline-block">
                            {product.category}
                          </span>
                          {product.barcode && (
                            <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                              <Barcode className="w-3.5 h-3.5 text-gray-400" /> {product.barcode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-600">
                        {formatRupiah(product.buy_price)}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-emerald-700 text-base">
                        {formatRupiah(product.sell_price)}
                      </td>
                      <td className="py-4 px-4 text-center font-black text-base">
                        {product.stock}
                        <span className="text-xs font-medium text-gray-400 block">
                          (min: {product.min_stock})
                        </span>
                      </td>

                      {/* BADGE STOK MENIPIS / HABIS */}
                      <td className="py-4 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5" /> STOK HABIS
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> STOK MENIPIS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Aman
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors"
                            title="Edit Produk"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(product.id)}
                            className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
