"use client";

import { useState, useEffect } from "react";
import { Transaction, Product } from "@/lib/types";
import { supabase, INITIAL_MOCK_PRODUCTS } from "@/lib/supabaseClient";
import { formatRupiah, formatDateTime, formatDateOnly } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  AlertTriangle,
  Calendar,
  RefreshCw,
  ShoppingBag,
  Download,
  CreditCard,
  QrCode,
  FileText,
} from "lucide-react";

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Mock Transactions jika DB kosong
  const mockTransactions: Transaction[] = [
    {
      id: "tx-1",
      total_amount: 350000,
      total_profit: 65000,
      payment_method: "Tunai",
      customer_name: "Pelanggan Umum",
      created_at: new Date().toISOString(),
      items: [
        {
          id: "ti-1",
          transaction_id: "tx-1",
          product_name: "Pupuk NPK Mutiara 16-16-16 1kg",
          quantity: 2,
          buy_price: 18000,
          sell_price: 23000,
          profit: 10000,
          created_at: new Date().toISOString(),
        },
        {
          id: "ti-2",
          transaction_id: "tx-1",
          product_name: "Sprayer Elektrik Hama 16 Liter",
          quantity: 1,
          buy_price: 280000,
          sell_price: 304000,
          profit: 55000,
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: "tx-2",
      total_amount: 145000,
      total_profit: 25000,
      payment_method: "Bon",
      customer_name: "Pak Haji Ahmad",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      items: [
        {
          id: "ti-3",
          transaction_id: "tx-2",
          product_name: "Pupuk Urea Subur 50kg",
          quantity: 1,
          buy_price: 120000,
          sell_price: 145000,
          profit: 25000,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ],
    },
  ];

  const fetchReports = async () => {
    setLoading(true);
    try {
      // 1. Fetch Transaksi Hari Ini
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*, transaction_items(*)")
        .order("created_at", { ascending: false });

      if (txError || !txData || txData.length === 0) {
        setTransactions(mockTransactions);
      } else {
        setTransactions(txData as Transaction[]);
      }

      // 2. Fetch Stok Menipis
      const { data: prodData, error: prodError } = await supabase
        .from("products")
        .select("*");

      if (prodError || !prodData || prodData.length === 0) {
        setLowStockProducts(INITIAL_MOCK_PRODUCTS.filter((p) => p.stock <= p.min_stock));
      } else {
        setLowStockProducts((prodData as Product[]).filter((p) => p.stock <= p.min_stock));
      }
    } catch (err) {
      console.error(err);
      setTransactions(mockTransactions);
      setLowStockProducts(INITIAL_MOCK_PRODUCTS.filter((p) => p.stock <= p.min_stock));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Hitung Ringkasan Penjualan Hari Ini
  const todayStr = new Date().toDateString();
  const todayTransactions = transactions.filter(
    (tx) => new Date(tx.created_at).toDateString() === todayStr
  );

  const todayRevenue = todayTransactions.reduce((sum, tx) => sum + Number(tx.total_amount), 0);
  const todayProfit = todayTransactions.reduce((sum, tx) => sum + Number(tx.total_profit), 0);
  const todayCount = todayTransactions.length;

  // Breakdown per Metode Pembayaran
  const tunaiTotal = todayTransactions
    .filter((tx) => tx.payment_method === "Tunai")
    .reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  const qrisTotal = todayTransactions
    .filter((tx) => tx.payment_method === "QRIS")
    .reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  const bonTotal = todayTransactions
    .filter((tx) => tx.payment_method === "Bon")
    .reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  // Fitur Ekspor Laporan Penjualan ke Excel / CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("Belum ada data transaksi untuk diekspor.");
      return;
    }

    const headers = [
      "ID Transaksi",
      "Tanggal & Waktu",
      "Metode Pembayaran",
      "Nama Pelanggan",
      "Total Penjualan (Rp)",
      "Total Keuntungan (Rp)",
    ];

    const rows = transactions.map((tx) => [
      `"${tx.id}"`,
      `"${formatDateTime(tx.created_at)}"`,
      `"${tx.payment_method || "Tunai"}"`,
      `"${tx.customer_name || "Pelanggan Umum"}"`,
      tx.total_amount,
      tx.total_profit,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Penjualan_Toko_Jaya_Tani_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-sm font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-5 h-5" /> Laporan Ringkas & Pembukuan
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Laporan Penjualan</h2>
          <p className="text-emerald-100 text-sm sm:text-base font-medium mt-0.5">
            Ringkasan omzet, keuntungan kotor, rincian Tunai/QRIS/Bon, & ekspor ke Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span>Ekspor Excel / CSV</span>
          </button>

          <button
            onClick={fetchReports}
            className="py-2.5 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stat Cards Ringkasan Penjualan Hari Ini */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pendapatan Hari Ini"
          value={formatRupiah(todayRevenue)}
          subtitle={`${todayCount} Transaksi berhasil`}
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          title="Total Keuntungan Kotor"
          value={formatRupiah(todayProfit)}
          subtitle="Estimasi margin keuntungan"
          icon={TrendingUp}
          variant="amber"
        />
        <StatCard
          title="Jumlah Penjualan"
          value={`${todayCount} Nota`}
          subtitle="Transaksi pelanggan hari ini"
          icon={Receipt}
          variant="blue"
        />
      </div>

      {/* Breakdown Rincian Metode Pembayaran Hari Ini */}
      <div className="bg-white rounded-3xl p-5 border-2 border-emerald-100 shadow-sm space-y-3">
        <h3 className="font-extrabold text-gray-900 text-base">
          Rincian Pembayaran Hari Ini ({formatDateOnly(new Date().toISOString())})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-emerald-700" />
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase">Tunai (Cash)</p>
                <p className="text-lg font-black text-emerald-900">{formatRupiah(tunaiTotal)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <QrCode className="w-5 h-5 text-blue-700" />
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase">QRIS / Transfer</p>
                <p className="text-lg font-black text-blue-900">{formatRupiah(qrisTotal)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-amber-700" />
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase">Bon / Piutang</p>
                <p className="text-lg font-black text-amber-900">{formatRupiah(bonTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Grid Dua Kolom: Peringatan Stok Menipis & Riwayat Penjualan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Peringatan Stok Menipis (Red Warning) */}
        <div className="bg-white rounded-3xl p-5 border-2 border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2 text-rose-700 font-black text-lg">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <h3>Stok Perlu Di-Restock</h3>
            </div>
            <span className="px-2.5 py-1 text-xs font-black bg-rose-600 text-white rounded-full shadow-xs">
              {lowStockProducts.length} Produk
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-sm font-bold text-gray-500 py-6">
                Semua stok produk saat ini dalam kondisi aman!
              </p>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2"
                >
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm">{product.name}</h4>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">
                      Harga Jual: {formatRupiah(product.sell_price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 text-xs font-black bg-rose-600 text-white rounded-lg block">
                      Stok: {product.stock}
                    </span>
                    <span className="text-[10px] font-bold text-rose-800 block mt-0.5">
                      Min: {product.min_stock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Riwayat Transaksi Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border-2 border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
              <ShoppingBag className="w-6 h-6 text-emerald-700" />
              <h3>Riwayat Transaksi Terakhir</h3>
            </div>
            <span className="text-xs font-bold text-gray-500">
              Total {transactions.length} Transaksi Tercatat
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-center text-sm font-bold text-gray-500 py-8">
                Belum ada transaksi tercatat.
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-emerald-300 transition-colors space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-bold text-gray-600 pb-2 border-b border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-extrabold">
                        Nota ID: #{tx.id.substring(0, 8)}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[11px] font-black rounded-md ${
                          tx.payment_method === "Bon"
                            ? "bg-amber-200 text-amber-900"
                            : tx.payment_method === "QRIS"
                            ? "bg-blue-200 text-blue-900"
                            : "bg-emerald-200 text-emerald-900"
                        }`}
                      >
                        {tx.payment_method || "Tunai"}
                      </span>
                    </div>
                    <span className="text-gray-500">{formatDateTime(tx.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        Pembeli: <strong className="text-gray-800">{tx.customer_name || "Pelanggan Umum"}</strong>
                      </p>
                      <p className="text-lg font-black text-emerald-700">
                        {formatRupiah(tx.total_amount)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-semibold">Keuntungan Kotor</p>
                      <p className="text-base font-extrabold text-amber-700">
                        +{formatRupiah(tx.total_profit)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
