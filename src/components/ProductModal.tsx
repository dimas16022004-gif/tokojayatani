"use client";

import { useState, useEffect } from "react";
import { Product } from "@/lib/types";
import { X, Save, PackagePlus, Barcode } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
  editingProduct?: Product | null;
}

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  editingProduct,
}: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    category: "Pupuk",
    buy_price: 0,
    sell_price: 0,
    stock: 10,
    min_stock: 5,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        barcode: editingProduct.barcode || "",
        category: editingProduct.category || "Pupuk",
        buy_price: editingProduct.buy_price,
        sell_price: editingProduct.sell_price,
        stock: editingProduct.stock,
        min_stock: editingProduct.min_stock,
      });
    } else {
      setFormData({
        name: "",
        barcode: "",
        category: "Pupuk",
        buy_price: 0,
        sell_price: 0,
        stock: 10,
        min_stock: 5,
      });
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Nama produk wajib diisi!");
      return;
    }
    setIsSubmitting(true);
    const sanitizedData = {
      ...formData,
      barcode: formData.barcode && formData.barcode.trim() ? formData.barcode.trim() : null,
    };
    await onSave(sanitizedData as unknown as Partial<Product>);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-emerald-600 animate-in fade-in zoom-in duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <PackagePlus className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="text-xl font-black text-gray-900">
              {editingProduct ? "Edit Data Produk" : "Tambah Produk Baru"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Kode Barcode & Nama Produk */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-emerald-700" /> Kode Barcode / SKU (Opsional)
              </label>
              <input
                type="text"
                placeholder="Scan atau ketik nomor barcode..."
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nama Produk / Barang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pupuk Urea 50kg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Kategori Barang
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="Pupuk">Pupuk</option>
              <option value="Benih">Benih</option>
              <option value="Pestisida">Pestisida</option>
              <option value="Alat Tani">Alat Tani</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Harga Beli & Harga Jual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Harga Beli / Modal (Rp)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.buy_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    buy_price: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">
                Harga Jual (Rp)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.sell_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sell_price: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-400 text-base font-black text-emerald-800 bg-emerald-50/50 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Stok & Minimal Stok Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Stok Saat Ini
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-rose-700 uppercase mb-1">
                Batas Min. Stok (Peringatan)
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.min_stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_stock: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-rose-200 text-base font-bold text-gray-900 focus:border-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Produk"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
