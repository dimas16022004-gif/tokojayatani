"use client";

import { useState, useEffect, useMemo } from "react";
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
  RefreshCw,
  ShoppingBag,
  Download,
  CreditCard,
  QrCode,
  FileText,
  Filter,
  Search,
  Bell,
  CheckCircle2,
  BookOpen,
  User,
  Clock,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter 3 Bulanan (Triwulan)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentQuarter = Math.ceil(currentMonth / 3); // 1, 2, 3, 4

  // Pengingat di Awal Bulan ke-4 (Bulan 1, 4, 7, 10)
  const isQuarterReminderMonth = [1, 4, 7, 10].includes(currentMonth);
  const previousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
  const previousQuarterYear = currentQuarter === 1 ? currentYear - 1 : currentYear;

  const [selectedQuarter, setSelectedQuarter] = useState<string>(currentQuarter.toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  // Filter Riwayat Transaksi Interaktif
  const [searchHistory, setSearchHistory] = useState("");
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<string>("Semua");
  const [historyDebtFilter, setHistoryDebtFilter] = useState<string>("semua");

  // Filter Periode: mode = "semua" | "hari_ini" | "kemarin" | "minggu_ini" | "minggu_lalu" | "bulan_ini" | "bulan_lalu" | "custom_hari" | "custom_minggu" | "custom_bulan"
  const [periodMode, setPeriodMode] = useState<string>("semua");

  // Custom Hari: pilih tanggal spesifik
  const todayISO = new Date().toISOString().slice(0, 10);
  const [customDay, setCustomDay] = useState<string>(todayISO);

  // Custom Minggu: pilih tahun + nomor minggu
  const getISOWeek = (d: Date): number => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };
  const currentWeekNum = getISOWeek(new Date());
  const [customWeek, setCustomWeek] = useState<string>(
    `${currentYear}-W${String(currentWeekNum).padStart(2, "0")}`
  );

  // Custom Bulan: pilih tahun-bulan
  const [customMonth, setCustomMonth] = useState<string>(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}`
  );

  // Initial Mock Transactions jika DB kosong
  const mockTransactions: Transaction[] = [
    {
      id: "tx-1",
      total_amount: 350000,
      total_profit: 65000,
      payment_method: "Tunai",
      payment_status: "Lunas",
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
      ],
    },
    {
      id: "tx-2",
      total_amount: 145000,
      total_profit: 25000,
      payment_method: "Bon",
      payment_status: "Belum Lunas",
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
      total_amount: 350000,
      total_profit: 70000,
      payment_method: "Bon",
      payment_status: "Belum Lunas",
      customer_name: "Pak Mamat Tani",
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      items: [
        {
          id: "ti-4",
          transaction_id: "tx-3",
          product_name: "Sprayer Elektrik Hama 16 Liter",
          quantity: 1,
          buy_price: 280000,
          sell_price: 350000,
          profit: 70000,
          created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
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

  // Pelunasan Hutang (Tandai Lunas)
  const handlePayDebt = async (txId: string, customerName: string) => {
    const confirmPay = window.confirm(
      `Tandai hutang atas nama "${customerName}" sebagai SUDAH LUNAS?`
    );
    if (!confirmPay) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ payment_status: "Lunas", paid_at: new Date().toISOString() })
        .eq("id", txId);

      if (error) {
        console.warn("Update Supabase error, update state lokal:", error.message);
      }
      
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === txId
            ? { ...tx, payment_status: "Lunas", paid_at: new Date().toISOString() }
            : tx
        )
      );
      alert(`Hutang atas nama "${customerName}" berhasil ditandai LUNAS!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Ringkasan Hari Ini
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

  // DAFTAR PELANGGAN BERHUTANG (BELUM LUNAS)
  const unpaidDebts = transactions.filter(
    (tx) => tx.payment_method === "Bon" && tx.payment_status === "Belum Lunas"
  );
  const totalUnpaidDebtAmount = unpaidDebts.reduce(
    (sum, tx) => sum + Number(tx.total_amount),
    0
  );

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
      "Status Pembayaran",
      "Nama Pelanggan",
      "Total Penjualan (Rp)",
      "Total Keuntungan (Rp)",
    ];

    const rows = targetData.map((tx) => [
      `"${tx.id}"`,
      `"${formatDateTime(tx.created_at)}"`,
      `"${tx.payment_method || "Tunai"}"`,
      `"${tx.payment_status || "Lunas"}"`,
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

  // FILTER RIWAYAT TRANSAKSI - LOGIKA PERIODE
  const filteredHistoryTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter Pencarian Nama/ID
      const matchesSearch =
        !searchHistory ||
        (tx.customer_name &&
          tx.customer_name.toLowerCase().includes(searchHistory.toLowerCase())) ||
        tx.id.toLowerCase().includes(searchHistory.toLowerCase());

      // Filter Metode Pembayaran
      const matchesPayment =
        historyPaymentFilter === "Semua" || tx.payment_method === historyPaymentFilter;

      // Filter Status Hutang
      let matchesDebt = true;
      if (historyDebtFilter === "belum_lunas") {
        matchesDebt = tx.payment_status === "Belum Lunas";
      } else if (historyDebtFilter === "lunas") {
        matchesDebt = tx.payment_status === "Lunas";
      }

      // Filter Periode
      let matchesPeriod = true;
      const txDate = new Date(tx.created_at);
      const now = new Date();

      if (periodMode === "hari_ini") {
        matchesPeriod = txDate.toDateString() === now.toDateString();
      } else if (periodMode === "kemarin") {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        matchesPeriod = txDate.toDateString() === yesterday.toDateString();
      } else if (periodMode === "minggu_ini") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        matchesPeriod = txDate >= startOfWeek && txDate <= endOfWeek;
      } else if (periodMode === "minggu_lalu") {
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);
        matchesPeriod = txDate >= startOfLastWeek && txDate <= endOfLastWeek;
      } else if (periodMode === "bulan_ini") {
        matchesPeriod =
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear();
      } else if (periodMode === "bulan_lalu") {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear =
          now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        matchesPeriod =
          txDate.getMonth() === lastMonth &&
          txDate.getFullYear() === lastMonthYear;
      } else if (periodMode === "custom_hari" && customDay) {
        const selectedDate = new Date(customDay);
        matchesPeriod =
          txDate.getDate() === selectedDate.getDate() &&
          txDate.getMonth() === selectedDate.getMonth() &&
          txDate.getFullYear() === selectedDate.getFullYear();
      } else if (periodMode === "custom_minggu" && customWeek) {
        // customWeek format: "2026-W30"
        const [wyear, wnum] = customWeek.split("-W").map(Number);
        const txWeekNum = getISOWeek(txDate);
        matchesPeriod = txDate.getFullYear() === wyear && txWeekNum === wnum;
      } else if (periodMode === "custom_bulan" && customMonth) {
        // customMonth format: "2026-07"
        const [myear, mmonth] = customMonth.split("-").map(Number);
        matchesPeriod =
          txDate.getFullYear() === myear && txDate.getMonth() + 1 === mmonth;
      }

      return matchesSearch && matchesPayment && matchesDebt && matchesPeriod;
    });
  }, [transactions, searchHistory, historyPaymentFilter, historyDebtFilter, periodMode, customDay, customWeek, customMonth]);

  // Ringkasan Statistik Periode yang Difilter
  const filteredRevenue = filteredHistoryTransactions.reduce((s, tx) => s + Number(tx.total_amount), 0);
  const filteredProfit = filteredHistoryTransactions.reduce((s, tx) => s + Number(tx.total_profit), 0);


  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-sm font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-5 h-5" /> Laporan Ringkas & Pembukuan
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Laporan Penjualan & Buku Hutang</h2>
          <p className="text-emerald-100 text-sm sm:text-base font-medium mt-0.5">
            Pantau hutang pelanggan, ekspor laporan per 3 bulan, & pelunasan bon.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
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

      {/* MODUL KHUSUS BUKU CATATAN PIUTANG / HUTANG PELANGGAN */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-rose-300 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                Buku Catatan Hutang Pelanggan (Bon)
              </h3>
              <p className="text-xs sm:text-sm font-bold text-rose-700">
                Daftar pembeli yang memiliki bon dan belum melunasi pembayaran.
              </p>
            </div>
          </div>

          <div className="bg-rose-50 border-2 border-rose-200 p-3.5 rounded-2xl text-right shrink-0">
            <span className="text-xs font-bold text-rose-800 uppercase block">Total Piutang Belum Dibayar:</span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 block">
              {formatRupiah(totalUnpaidDebtAmount)}
            </span>
            <span className="text-[11px] font-bold text-gray-500 block">
              ({unpaidDebts.length} Pelanggan Berhutang)
            </span>
          </div>
        </div>

        {/* Tabel / Daftar Pelanggan Berhutang */}
        <div className="space-y-3">
          {unpaidDebts.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 font-bold">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-base font-black">Alhamdulillah! Tidak Ada Hutang Pelanggan yang Tertunggak.</p>
              <p className="text-xs font-medium text-emerald-700 mt-0.5">Semua transaksi bon telah lunas terbayar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {unpaidDebts.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-rose-50/60 border-2 border-rose-200 hover:border-rose-400 transition-all flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-base text-gray-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-rose-600" /> {tx.customer_name || "Pelanggan Umumm"}
                      </span>
                      <span className="px-2.5 py-1 text-xs font-black bg-rose-600 text-white rounded-lg animate-pulse">
                        BELUM LUNAS
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 font-medium flex items-center justify-between border-t border-rose-200/60 pt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {formatDateTime(tx.created_at)}
                      </span>
                      <span className="font-mono text-gray-500">#{tx.id.substring(0, 8)}</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs font-bold text-gray-500 uppercase">Sisa Total Hutang:</span>
                      <span className="text-xl font-black text-rose-700">
                        {formatRupiah(tx.total_amount)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePayDebt(tx.id, tx.customer_name || "Pelanggan")}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tandai Lunas (Bayar Hutang)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NOTIFIKASI PENGINGAT DI AWAL BULAN KE-4 */}
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
          {/* Header Riwayat */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
              <ShoppingBag className="w-6 h-6 text-emerald-700" />
              <h3>Riwayat Transaksi</h3>
            </div>
            <button
              onClick={() => handleExportCustomCSV(filteredHistoryTransactions, "Riwayat_Transaksi")}
              className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Riwayat (.csv)
            </button>
          </div>

          {/* FILTER PERIODE — TAB PILLS */}
          <div className="space-y-2">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Filter Periode
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "semua", label: "Semua" },
                { id: "hari_ini", label: "Hari Ini" },
                { id: "kemarin", label: "Kemarin" },
                { id: "minggu_ini", label: "Minggu Ini" },
                { id: "minggu_lalu", label: "Minggu Lalu" },
                { id: "bulan_ini", label: "Bulan Ini" },
                { id: "bulan_lalu", label: "Bulan Lalu" },
                { id: "custom_hari", label: "📅 Pilih Hari" },
                { id: "custom_minggu", label: "📆 Pilih Minggu" },
                { id: "custom_bulan", label: "🗓️ Pilih Bulan" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setPeriodMode(id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                    periodMode === id
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-md"
                      : "bg-white text-gray-600 border-gray-300 hover:border-emerald-500 hover:text-emerald-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input Dinamis untuk Custom Hari / Minggu / Bulan */}
            {periodMode === "custom_hari" && (
              <div className="flex items-center gap-2 mt-1.5 p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CalendarCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <label className="text-xs font-black text-emerald-800 shrink-0">Pilih Tanggal:</label>
                <input
                  type="date"
                  value={customDay}
                  onChange={(e) => setCustomDay(e.target.value)}
                  max={todayISO}
                  className="px-3 py-1.5 rounded-xl border-2 border-emerald-300 bg-white text-xs font-bold text-gray-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            )}

            {periodMode === "custom_minggu" && (
              <div className="flex items-center gap-2 mt-1.5 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <CalendarRange className="w-4 h-4 text-blue-700 shrink-0" />
                <label className="text-xs font-black text-blue-800 shrink-0">Pilih Minggu:</label>
                <input
                  type="week"
                  value={customWeek}
                  onChange={(e) => setCustomWeek(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border-2 border-blue-300 bg-white text-xs font-bold text-gray-900 focus:outline-hidden focus:border-blue-600"
                />
                <span className="text-[11px] font-bold text-blue-700">(Senin s/d Minggu)</span>
              </div>
            )}

            {periodMode === "custom_bulan" && (
              <div className="flex items-center gap-2 mt-1.5 p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <CalendarDays className="w-4 h-4 text-amber-700 shrink-0" />
                <label className="text-xs font-black text-amber-800 shrink-0">Pilih Bulan:</label>
                <input
                  type="month"
                  value={customMonth}
                  onChange={(e) => setCustomMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border-2 border-amber-300 bg-white text-xs font-bold text-gray-900 focus:outline-hidden focus:border-amber-600"
                />
              </div>
            )}
          </div>

          {/* Ringkasan Statistik Periode yang Difilter */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black uppercase text-emerald-700">Total Transaksi</p>
              <p className="text-lg font-black text-emerald-900">{filteredHistoryTransactions.length}</p>
              <p className="text-[10px] font-bold text-gray-400">nota</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black uppercase text-blue-700">Total Omzet</p>
              <p className="text-base font-black text-blue-900">{formatRupiah(filteredRevenue)}</p>
              <p className="text-[10px] font-bold text-gray-400">penjualan</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black uppercase text-amber-700">Total Untung</p>
              <p className="text-base font-black text-amber-900">{formatRupiah(filteredProfit)}</p>
              <p className="text-[10px] font-bold text-gray-400">kotor</p>
            </div>
          </div>

          {/* FILTER PENCARIAN, PEMBAYARAN & HUTANG */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama pembeli / ID nota..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
            </div>

            {/* Filter Status Hutang */}
            <select
              value={historyDebtFilter}
              onChange={(e) => setHistoryDebtFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-rose-300 text-xs font-bold text-rose-900 focus:border-rose-600 focus:outline-hidden"
            >
              <option value="semua">🗒️ Semua Status</option>
              <option value="belum_lunas">❌ Bon Belum Lunas</option>
              <option value="lunas">✅ Sudah Lunas</option>
            </select>

            {/* Filter Metode Pembayaran */}
            <select
              value={historyPaymentFilter}
              onChange={(e) => setHistoryPaymentFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="Semua">💳 Semua Pembayaran</option>
              <option value="Tunai">💵 Tunai (Cash)</option>
              <option value="QRIS">📱 QRIS / Transfer</option>
              <option value="Bon">📄 Bon / Piutang</option>
            </select>
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
                  className={`p-4 rounded-2xl border transition-colors space-y-2 ${
                    tx.payment_status === "Belum Lunas"
                      ? "bg-rose-50/50 border-rose-300 hover:border-rose-400"
                      : "bg-gray-50 border-gray-200 hover:border-emerald-300"
                  }`}
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

                      {/* BADGE STATUS LUNAS / BELUM LUNAS */}
                      <span
                        className={`px-2 py-0.5 text-[11px] font-black rounded-md ${
                          tx.payment_status === "Belum Lunas"
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {tx.payment_status === "Belum Lunas" ? "BELUM LUNAS" : "LUNAS"}
                      </span>
                    </div>
                    <span className="text-gray-500">{formatDateTime(tx.created_at)}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        Pembeli: <strong className="text-gray-800">{tx.customer_name || "Pelanggan Umum"}</strong>
                      </p>
                      <p className="text-lg font-black text-emerald-700">
                        {formatRupiah(tx.total_amount)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-semibold">Keuntungan Kotor</p>
                        <p className="text-base font-extrabold text-amber-700">
                          +{formatRupiah(tx.total_profit)}
                        </p>
                      </div>

                      {/* Tombol Pelunasan jika Belum Lunas */}
                      {tx.payment_status === "Belum Lunas" && (
                        <button
                          onClick={() => handlePayDebt(tx.id, tx.customer_name || "Pelanggan")}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs"
                        >
                          Bayar Hutang
                        </button>
                      )}
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
