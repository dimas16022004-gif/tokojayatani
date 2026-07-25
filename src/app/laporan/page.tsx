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
  Search,
  Bell,
} from "lucide-react";

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter 3 Bulanan (Triwulan)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentQuarter = Math.ceil(currentMonth / 3); // 1, 2, 3, 4

  // Pengingat di Awal Bulan ke-4 (Bulan 4/April, Bulan 7/Juli, Bulan 10/Oktober, Bulan 1/Januari)
  const isQuarterReminderMonth = [1, 4, 7, 10].includes(currentMonth);

  // Menentukan triwulan sebelumnya yang baru saja selesai untuk direkap
  const previousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
  const previousQuarterYear = currentQuarter === 1 ? currentYear - 1 : currentYear;

  const [selectedQuarter, setSelectedQuarter] = useState<string>(currentQuarter.toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  // Filter Riwayat Transaksi Interaktif
  const [searchHistory, setSearchHistory] = useState("");
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<string>("Semua");
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("semua");

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
    {
      id: "tx-3",
      total_amount: 230000,
      total_profit: 45000,
      payment_method: "QRIS",
      customer_name: "Bu Siti Tani",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      items: [],
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
    const startMonth = (quarter - 1) * 3;
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

  // Ekspor Laporan Bebas / Kapan Saja (.csv)
  const handleExportCustomCSV = (targetData: Transaction[], titlePrefix: string) => {
    if (targetData.length === 0) {
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

    const rows = targetData.map((tx) => [
      `"${tx.id}"`,
      `"${formatDateTime(tx.created_at)}"`,
      `"${tx.payment_method || "Tunai"}"`,
      `"${tx.customer_name || "Pelanggan Umum"}"`,
      tx.total_amount,
      tx.total_profit,
    ]);

    const filename = `${titlePrefix}_Toko_Jaya_Tani_${new Date().toISOString().slice(0, 10)}.csv`;

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

  // FILTER RIWAYAT TRANSAKSI TERHUBUNG
  const filteredHistoryTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.customer_name && tx.customer_name.toLowerCase().includes(searchHistory.toLowerCase())) ||
      tx.id.toLowerCase().includes(searchHistory.toLowerCase());

    const matchesPayment =
      historyPaymentFilter === "Semua" || tx.payment_method === historyPaymentFilter;

    let matchesDate = true;
    const txDate = new Date(tx.created_at);
    const now = new Date();

    if (historyDateFilter === "hari_ini") {
      matchesDate = txDate.toDateString() === now.toDateString();
    } else if (historyDateFilter === "7_hari") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = txDate >= sevenDaysAgo;
    } else if (historyDateFilter === "bulan_ini") {
      matchesDate =
        txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

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
            Ekspor laporan kapan saja & pengingat rekap di awal bulan ke-4.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          {/* Tombol Ekspor Bebas Kapan Saja */}
          <button
            onClick={() => handleExportCustomCSV(transactions, "Laporan_Penjualan_Lengkap")}
            className="py-3 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap"
          >
            <Download className="w-5 h-5 stroke-[3]" />
            <span>Ekspor Semua Laporan (.csv)</span>
          </button>

          <button
            onClick={fetchReports}
            className="py-3 px-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* NOTIFIKASI PENGINGAT DI AWAL BULAN KE-4 (BULAN 1, 4, 7, 10) */}
      <div
        className={`p-5 rounded-3xl border-2 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
          isQuarterReminderMonth
            ? "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-300 text-emerald-950 shadow-xl"
            : "bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-600 text-white"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold shadow-md ${
              isQuarterReminderMonth
                ? "bg-emerald-950 text-amber-300"
                : "bg-amber-400 text-emerald-950"
            }`}
          >
            <Bell
              className={`w-6 h-6 ${
                isQuarterReminderMonth ? "animate-bounce text-amber-400" : "text-emerald-950"
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase ${
                  isQuarterReminderMonth
                    ? "bg-emerald-950 text-amber-300"
                    : "bg-amber-400 text-emerald-950"
                }`}
              >
                {isQuarterReminderMonth
                  ? "PENGINGAT AWAL BULAN KE-4"
                  : "Status Rekap 3 Bulanan"}
              </span>
              <span className="text-xs font-bold">
                {getQuarterLabel(currentQuarter.toString())} {currentYear}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black mt-1">
              {isQuarterReminderMonth
                ? `Waktunya Rekap Pembukuan 3 Bulan Lalu (${getQuarterLabel(
                    previousQuarter.toString()
                  )})!`
                : `Periode Saat Ini: ${getQuarterLabel(currentQuarter.toString())}`}
            </h3>
            <p className="text-xs sm:text-sm font-medium mt-0.5 opacity-90">
              {isQuarterReminderMonth
                ? "Bulan ini adalah awal bulan ke-4. Tekan tombol di sebelah kanan untuk mengekspor laporan 3 bulan lalu secara manual."
                : "Sistem akan menampilkan pengingat utama setiap awal bulan ke-4 (Januari, April, Juli, Oktober)."}
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            handleExportCustomCSV(
              transactions.filter((tx) => {
                const txDate = new Date(tx.created_at);
                const { startDate, endDate } = getQuarterRange(
                  previousQuarter,
                  previousQuarterYear
                );
                return txDate >= startDate && txDate <= endDate;
              }),
              `Laporan_Triwulan_${previousQuarter}_Tahun_${previousQuarterYear}`
            )
          }
          className={`self-stretch md:self-auto py-3 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95 whitespace-nowrap ${
            isQuarterReminderMonth
              ? "bg-emerald-950 hover:bg-emerald-900 text-amber-300"
              : "bg-amber-400 hover:bg-amber-300 text-emerald-950"
          }`}
        >
          <Download className="w-5 h-5 stroke-[3]" />
          <span>Ekspor 3 Bulan Lalu (.csv)</span>
        </button>
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

      {/* MODUL KHUSUS FILTER & EKSPOR PER 3 BULAN (TRIWULANAN) */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-emerald-950 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-400/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-amber-300 flex items-center justify-center font-bold">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black">Filter Laporan 3 Bulanan</h3>
              <p className="text-xs font-bold text-emerald-950/80">
                Pilih periode 3 bulan kapan saja untuk mengunduh file rekapitulasi.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              handleExportCustomCSV(
                quarterlyTransactions,
                `Laporan_Triwulan_${selectedQuarter}_Tahun_${selectedYear}`
              )
            }
            className="py-3 px-5 rounded-2xl bg-emerald-950 hover:bg-emerald-900 text-amber-300 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 whitespace-nowrap"
          >
            <Download className="w-5 h-5 stroke-[3] text-amber-400" />
            <span>Unduh Laporan Periode Ini (.csv)</span>
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

      {/* Layout Grid Dua Kolom: Peringatan Stok Menipis & Riwayat Penjualan Terfilter */}
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

        {/* Kolom Kanan: Riwayat Transaksi Terakhir dengan FILTER INTERAKTIF */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border-2 border-emerald-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
              <ShoppingBag className="w-6 h-6 text-emerald-700" />
              <h3>Riwayat Transaksi</h3>
            </div>
            <span className="text-xs font-bold text-gray-500">
              Menampilkan {filteredHistoryTransactions.length} dari {transactions.length} Transaksi
            </span>
          </div>

          {/* BARIS FILTER RIWAYAT TRANSAKSI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari pembeli / ID nota..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Filter Metode Pembayaran */}
            <div>
              <select
                value={historyPaymentFilter}
                onChange={(e) => setHistoryPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="Semua">Semua Pembayaran</option>
                <option value="Tunai">Tunai (Cash)</option>
                <option value="QRIS">QRIS / Transfer</option>
                <option value="Bon">Bon / Piutang</option>
              </select>
            </div>

            {/* Filter Waktu */}
            <div>
              <select
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="semua">Semua Rentang Waktu</option>
                <option value="hari_ini">Hari Ini</option>
                <option value="7_hari">7 Hari Terakhir</option>
                <option value="bulan_ini">Bulan Ini</option>
              </select>
            </div>
          </div>

          {/* DAFTAR RIWAYAT TRANSAKSI TERFILTER */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredHistoryTransactions.length === 0 ? (
              <p className="text-center text-sm font-bold text-gray-500 py-8">
                Tidak ada riwayat transaksi yang cocok dengan filter.
              </p>
            ) : (
              filteredHistoryTransactions.map((tx) => (
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
