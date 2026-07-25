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
  Filter,
} from "lucide-react";

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter 3 Bulanan (Triwulan)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentQuarter = Math.ceil(currentMonth / 3); // 1, 2, 3, 4

  const [selectedQuarter, setSelectedQuarter] = useState<string>(currentQuarter.toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

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
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*, transaction_items(*)")
        .order("created_at", { ascending: false });

      if (txError || !txData || txData.length === 0) {
        setTransactions(mockTransactions);
      } else {
        setTransactions(txData as Transaction[]);
      }

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

  const tunaiTotal = todayTransactions
    .filter((tx) => tx.payment_method === "Tunai")
    .reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  const qrisTotal = todayTransactions
    .filter((tx) => tx.payment_method === "QRIS")
    .reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  const bonTotal = todayTransactions
    .filter((tx) => tx.payment_method === "Bon")
    .reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  // Filter Transaksi 3 Bulanan (Triwulan)
  const getQuarterRange = (quarter: number, year: number) => {
    const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
    return { startDate, endDate };
  };

  const getQuarterLabel = (q: string) => {
    switch (q) {
      case "1":
        return "Triwulan 1 (Januari - Maret)";
      case "2":
        return "Triwulan 2 (April - Juni)";
      case "3":
        return "Triwulan 3 (Juli - September)";
      case "4":
        return "Triwulan 4 (Oktober - Desember)";
      default:
        return "Semua Periode";
    }
  };

  // Filter Data Berdasarkan 3 Bulan
  const quarterlyTransactions = transactions.filter((tx) => {
    if (selectedQuarter === "all") return true;
    const txDate = new Date(tx.created_at);
    const { startDate, endDate } = getQuarterRange(
      parseInt(selectedQuarter),
      parseInt(selectedYear)
    );
    return txDate >= startDate && txDate <= endDate;
  });

  const quarterlyRevenue = quarterlyTransactions.reduce(
    (sum, tx) => sum + Number(tx.total_amount),
    0
  );
  const quarterlyProfit = quarterlyTransactions.reduce(
    (sum, tx) => sum + Number(tx.total_profit),
    0
  );

  // Ekspor Laporan 3 Bulanan (Triwulanan) ke CSV / Excel
  const handleExportQuarterlyCSV = () => {
    if (quarterlyTransactions.length === 0) {
      alert(
        `Belum ada data transaksi untuk ${getQuarterLabel(selectedQuarter)} ${selectedYear}.`
      );
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

    const rows = quarterlyTransactions.map((tx) => [
      `"${tx.id}"`,
      `"${formatDateTime(tx.created_at)}"`,
      `"${tx.payment_method || "Tunai"}"`,
      `"${tx.customer_name || "Pelanggan Umum"}"`,
      tx.total_amount,
      tx.total_profit,
    ]);

    const qName = selectedQuarter === "all" ? "Semua_Periode" : `Triwulan_${selectedQuarter}`;
    const filename = `Laporan_3_Bulanan_${qName}_Tahun_${selectedYear}_Toko_Jaya_Tani.csv`;

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
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
            Ringkasan omzet, laporan triwulanan (per 3 bulan), & ekspor otomatis ke Excel.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <div className="bg-emerald-900/80 px-4 py-2 rounded-xl text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-600">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>{formatDateOnly(new Date().toISOString())}</span>
          </div>

          <button
            onClick={fetchReports}
            className="py-2 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
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

      {/* MODUL KHUSUS EKSPOR PER 3 BULAN (TRIWULANAN) */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-emerald-950 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-400/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-amber-300 flex items-center justify-center font-bold">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black">Ekspor Laporan Per 3 Bulan (Triwulan)</h3>
              <p className="text-xs font-bold text-emerald-950/80">
                Pilih periode 3 bulanan untuk mengunduh rekap pembukuan otomatis.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportQuarterlyCSV}
            className="py-3 px-5 rounded-2xl bg-emerald-950 hover:bg-emerald-900 text-amber-300 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 whitespace-nowrap"
          >
            <Download className="w-5 h-5 stroke-[3] text-amber-400" />
            <span>Unduh Laporan 3 Bulan (.csv)</span>
          </button>
        </div>

        {/* Form Filter Triwulan & Tahun */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-black uppercase text-emerald-950 mb-1">
              Pilih Periode 3 Bulan
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white font-extrabold text-gray-900 border-2 border-amber-300 focus:outline-hidden"
            >
              <option value="1">Triwulan 1 (Januari - Maret)</option>
              <option value="2">Triwulan 2 (April - Juni)</option>
              <option value="3">Triwulan 3 (Juli - September)</option>
              <option value="4">Triwulan 4 (Oktober - Desember)</option>
              <option value="all">Semua Periode (1 Tahun Full)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-emerald-950 mb-1">
              Tahun Pembukuan
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white font-extrabold text-gray-900 border-2 border-amber-300 focus:outline-hidden"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="bg-emerald-950/10 p-3 rounded-2xl flex flex-col justify-center border border-amber-400/60">
            <p className="text-xs font-bold text-emerald-900">Total Ringkasan Periode Ini:</p>
            <p className="text-lg font-black text-emerald-950">
              Omzet: {formatRupiah(quarterlyRevenue)}
            </p>
            <p className="text-xs font-extrabold text-emerald-900">
              Keuntungan: +{formatRupiah(quarterlyProfit)} ({quarterlyTransactions.length} Transaksi)
            </p>
          </div>
        </div>
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
              Menampilkan {quarterlyTransactions.length} Transaksi Terfilter
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {quarterlyTransactions.length === 0 ? (
              <p className="text-center text-sm font-bold text-gray-500 py-8">
                Belum ada transaksi tercatat untuk periode ini.
              </p>
            ) : (
              quarterlyTransactions.map((tx) => (
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
