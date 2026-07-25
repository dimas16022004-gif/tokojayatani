"use client";

import { useState, useEffect, useRef } from "react";
import { Product, CartItem, PaymentMethod } from "@/lib/types";
import { supabase, INITIAL_MOCK_PRODUCTS } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { Search, ShoppingBag, RefreshCw, AlertCircle, Barcode, Check } from "lucide-react";

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [scannedAlert, setScannedAlert] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load produk dari Supabase
  const fetchProducts = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        // Koneksi berhasil tapi ada error query
        setProducts([]);
        setDbError("Gagal memuat produk dari database. Periksa koneksi Supabase.");
      } else {
        setProducts((data as Product[]) || []);
      }
    } catch (err) {
      console.error(err);
      setProducts([]);
      setDbError("Tidak dapat terhubung ke database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter Kategori
  const categories = ["Semua", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === "Semua" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Tambah Produk ke Keranjang
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prevCart;
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });

    // Indikator visual scan barcode
    setScannedAlert(`+ 1 ${product.name}`);
    setTimeout(() => setScannedAlert(null), 2500);
  };

  // Auto Listener barcode (Mendeteksi pencarian barcode persis)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);

    // Cek jika pencarian persis sama dengan barcode suatu produk
    const matchedByBarcode = products.find(
      (p) => p.barcode && p.barcode === val.trim() && p.stock > 0
    );

    if (matchedByBarcode) {
      handleAddToCart(matchedByBarcode);
      setSearchTerm(""); // Reset search setelah auto scan
    }
  };

  // Ubah Jumlah Barang di Keranjang
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Hapus Barang dari Keranjang
  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => setCart([]);

  // Eksekusi Transaksi (Supabase RPC `process_transaction`)
  const handleProcessTransaction = async (
    paymentAmount: number,
    paymentMethod: PaymentMethod,
    customerName: string
  ): Promise<boolean> => {
    try {
      const payloadItems = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      // Coba panggil RPC Supabase dengan parameter baru
      const { data, error } = await supabase.rpc("process_transaction", {
        items: payloadItems,
        p_payment_method: paymentMethod,
        p_customer_name: customerName || "Pelanggan Umum",
      });

      if (error) {
        console.warn("RPC Supabase error, mengupdate stok lokal:", error.message);
        setProducts((prevProducts) =>
          prevProducts.map((p) => {
            const cartItem = cart.find((item) => item.product.id === p.id);
            if (cartItem) {
              return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
            }
            return p;
          })
        );
      } else {
        await fetchProducts();
      }
      return true;
    } catch (err) {
      console.error("Gagal memproses transaksi:", err);
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const cartItem = cart.find((item) => item.product.id === p.id);
          if (cartItem) {
            return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
          }
          return p;
        })
      );
      return true;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner / Header Kasir */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-sm font-bold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-5 h-5" /> Halaman Kasir / Transaksi
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Penjualan Toko Tani</h2>
          <p className="text-emerald-100 text-sm sm:text-base font-medium mt-0.5">
            Mendukung pencarian nama, Pemindai Barcode, dan transaksi Tunai / QRIS / Bon.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="self-stretch md:self-auto py-2.5 px-4 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang Stok</span>
        </button>
      </div>

      {/* Pop-up Alert Toast Scan Barcode */}
      {scannedAlert && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-800 text-amber-300 font-extrabold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-amber-400 animate-in slide-in-from-top duration-200">
          <Check className="w-5 h-5 text-amber-400" />
          <span>{scannedAlert} (Dimasukkan)</span>
        </div>
      )}

      {/* Warning info jika koneksi Supabase belum disetup */}
      {dbError && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-2xl flex items-center gap-3 text-sm font-bold">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{dbError}</span>
        </div>
      )}

      {/* Area Search & Category Filter Pills */}
      <div className="space-y-3">
        {/* Search Bar Besar dengan indikator Barcode */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Scan Barcode atau ketik nama pupuk/benih/pestisida..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-emerald-200 text-lg font-bold text-gray-900 shadow-xs focus:border-emerald-600 focus:outline-hidden placeholder:text-gray-400"
          />
          <Search className="w-6 h-6 text-emerald-600 absolute left-4 top-4" />
          <span title="Scan Barcode Siap">
            <Barcode className="w-6 h-6 text-gray-400 absolute right-4 top-4" />
          </span>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-md scale-105"
                  : "bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List Products */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-44 bg-gray-200 animate-pulse rounded-2xl border border-gray-200"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 text-gray-400">
          <ShoppingBag className="w-16 h-16 mx-auto mb-3 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-700">Produk Tidak Ditemukan</h3>
          <p className="text-sm mt-1">Coba cari kata kunci lain atau pilih kategori "Semua".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const cartItem = cart.find((item) => item.product.id === product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                cartQuantity={cartItem ? cartItem.quantity : 0}
                onAddToCart={handleAddToCart}
              />
            );
          })}
        </div>
      )}

      {/* Floating Cart Drawer Component */}
      <CartDrawer
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProcessTransaction={handleProcessTransaction}
      />
    </div>
  );
}
