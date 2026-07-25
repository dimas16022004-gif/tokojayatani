"use client";

import { useState, useEffect } from "react";
import { Product } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import ProductTable from "@/components/ProductTable";
import ProductModal from "@/components/ProductModal";
import StatCard from "@/components/StatCard";
import { Package, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data) {
        setProducts(data as Product[]);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Modal Action Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Save (Insert / Update) Produk
  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (editingProduct) {
      // UPDATE
      try {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        await fetchProducts();
      } catch (err) {
        console.warn("Gagal update Supabase, update state lokal:", err);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? ({ ...p, ...productData } as Product) : p
          )
        );
      }
    } else {
      // INSERT
      try {
        const { error } = await supabase.from("products").insert([productData]);
        if (error) throw error;
        await fetchProducts();
      } catch (err) {
        console.warn("Gagal insert Supabase, insert state lokal:", err);
        const newProduct: Product = {
          id: `p-${Date.now()}`,
          name: productData.name || "",
          category: productData.category || "Umum",
          buy_price: productData.buy_price || 0,
          sell_price: productData.sell_price || 0,
          stock: productData.stock || 0,
          min_stock: productData.min_stock || 5,
        };
        setProducts((prev) => [newProduct, ...prev]);
      }
    }
  };

  // DELETE Produk
  const handleDeleteProduct = async (productId: string) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus produk ini?"
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.warn("Gagal delete Supabase, update state lokal:", err);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  // Metrics untuk StatCards
  const totalItems = products.length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length;
  const safeStockCount = products.filter((p) => p.stock > p.min_stock).length;

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-sm font-bold uppercase tracking-wider mb-1">
            <Package className="w-5 h-5" /> Manajemen Inventaris
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Kelola Stok & Produk</h2>
          <p className="text-emerald-100 text-sm sm:text-base font-medium mt-0.5">
            Pantau ketersediaan barang, batas minimal stok, dan ubah data produk toko.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="self-stretch md:self-auto py-2.5 px-4 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stat Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Produk"
          value={totalItems}
          subtitle="Jenis barang terdaftar"
          icon={Package}
          variant="blue"
        />
        <StatCard
          title="Stok Menipis"
          value={lowStockCount}
          subtitle="Perlu segera di-restock"
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="Stok Habis"
          value={outOfStockCount}
          subtitle="Stok sama dengan 0"
          icon={AlertTriangle}
          variant="rose"
        />
        <StatCard
          title="Stok Aman"
          value={safeStockCount}
          subtitle="Stok mencukupi"
          icon={CheckCircle}
          variant="emerald"
        />
      </div>

      {/* Product Table Main */}
      <ProductTable
        products={products}
        onAddProduct={handleOpenAddModal}
        onEditProduct={handleOpenEditModal}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Modal Add / Edit */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />
    </div>
  );
}
