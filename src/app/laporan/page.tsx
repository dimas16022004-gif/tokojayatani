"use client";

import { useState, useEffect, useMemo } from "react";
import { Transaction, Product } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
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
  Filter,
  Search,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null); // detail view
  const [isResetting, setIsResetting] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

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

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch transaksi
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*, transaction_items(*)")
        .order("created_at", { ascending: false });

      if (!txError && txData) {
        const formattedTx = txData.map((tx: any) => ({
          ...tx,
          payment_status: tx.payment_status || "Lunas",
          items: tx.items && tx.items.length > 0 ? tx.items : (tx.transaction_items || []),
        }));
        setTransactions(formattedTx as Transaction[]);
      } else {
        setTransactions([]);
      }

      const { data: prodData, error: prodError } = await supabase
        .from("products")
        .select("*");

      if (!prodError && prodData) {
        setLowStockProducts((prodData as Product[]).filter((p) => p.stock <= p.min_stock));
      } else {
        setLowStockProducts([]);
      }
    } catch (err) {
      console.error(err);
      setTransactions([]);
      setLowStockProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

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

  // Hapus 1 Transaksi & Kembalikan Stok Produk
  const handleDeleteSingleTransaction = async (tx: Transaction) => {
    const confirmDelete = window.confirm(
      `⚠️ Hapus transaksi #${tx.id.substring(0, 8)} (${formatRupiah(tx.total_amount)})?\n\n` +
      `Stok barang dalam nota ini akan otomatis dikembalikan ke persediaan produk.\n\n` +
      `Lanjutkan penghapusan?`
    );
    if (!confirmDelete) return;

    try {
      // 1. Kembalikan stok untuk setiap item barang
      const items = (tx.items && tx.items.length > 0)
        ? tx.items
        : ((tx as any).transaction_items && (tx as any).transaction_items.length > 0)
        ? (tx as any).transaction_items
        : [];

      for (const item of items) {
        if (item.product_id) {
          const { data: prod } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();

          if (prod) {
            await supabase
              .from("products")
              .update({ stock: prod.stock + item.quantity })
              .eq("id", item.product_id);
          }
        }
      }

      // 2. Hapus item transaksi dari transaction_items
      await supabase
        .from("transaction_items")
        .delete()
        .eq("transaction_id", tx.id);

      // 3. Hapus transaksi utama dari transactions
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", tx.id);

      if (error) {
        console.warn("Delete transaction error:", error.message);
      }

      // 4. Update state lokal & refetch
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
      await fetchReports();
      alert(`✅ Transaksi #${tx.id.substring(0, 8)} berhasil dihapus dan stok barang telah dikembalikan.`);
    } catch (err) {
      console.error("Gagal menghapus transaksi:", err);
      alert("❌ Terjadi kesalahan saat menghapus transaksi.");
    }
  };

  // Ubah Status Pelunasan Transaksi (Lunas / Belum Lunas)
  const handleTogglePaymentStatus = async (tx: Transaction, targetStatus: "Lunas" | "Belum Lunas") => {
    const confirmMsg = targetStatus === "Lunas"
      ? `Tandai transaksi #${tx.id.substring(0, 8)} (${formatRupiah(tx.total_amount)}) atas nama "${tx.customer_name || "Pelanggan"}" sebagai SUDAH LUNAS?`
      : `Ubah status transaksi #${tx.id.substring(0, 8)} menjadi BELUM LUNAS?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const nowIso = targetStatus === "Lunas" ? new Date().toISOString() : null;
      const { error } = await supabase
        .from("transactions")
        .update({ payment_status: targetStatus, paid_at: nowIso })
        .eq("id", tx.id);

      if (error) {
        console.warn("Update status error:", error.message);
      }

      await fetchReports();
      alert(`✅ Status transaksi #${tx.id.substring(0, 8)} berhasil diubah menjadi ${targetStatus.toUpperCase()}!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Ekspor Laporan Bebas / Kapan Saja (.csv)
  // ── RESET TRANSAKSI SETELAH EKSPOR ────────────────────────────────────────
  const handleResetTransactions = async (exportedIds: string[]) => {
    if (exportedIds.length === 0) return;

    const confirm1 = window.confirm(
      `✅ File CSV berhasil diunduh!\n\n` +
      `Apakah Anda ingin MENGHAPUS ${exportedIds.length} transaksi yang sudah direkap dari sistem?\n\n` +
      `⚠️ Data yang dihapus TIDAK BISA dikembalikan.\n` +
      `Pastikan file CSV sudah tersimpan dengan aman dulu!`
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      `❗ Konfirmasi sekali lagi:\n\n` +
      `Hapus ${exportedIds.length} transaksi dari riwayat?\n` +
      `(Tekan OK untuk hapus, Cancel untuk batalkan)`
    );
    if (!confirm2) return;

    setIsResetting(true);
    try {
      // Hapus dari Supabase
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", exportedIds);

      if (error) {
        console.warn("Supabase delete error (mungkin mock data):", error.message);
      }

      // Hapus dari state lokal
      setTransactions((prev) => prev.filter((tx) => !exportedIds.includes(tx.id)));
      alert(`✅ ${exportedIds.length} transaksi berhasil dihapus dari riwayat.\nSilakan lanjutkan operasional toko.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  // ── EKSPOR CSV (dengan opsi reset setelah ekspor) ─────────────────────────
  const handleExportCustomCSV = async (
    targetData: Transaction[],
    titlePrefix: string,
    offerReset = false
  ) => {
    if (targetData.length === 0) {
      alert("Belum ada data transaksi untuk diekspor.");
      return;
    }

    // Header CSV detail dengan item
    const lines: string[] = [
      [
        "ID Transaksi",
        "Tanggal & Waktu",
        "Metode Pembayaran",
        "Status Pembayaran",
        "Nama Pelanggan",
        "Nama Barang",
        "Jumlah (Qty)",
        "Harga Satuan (Rp)",
        "Subtotal (Rp)",
        "Total Transaksi (Rp)",
        "Total Keuntungan (Rp)",
      ].join(","),
    ];

    targetData.forEach((tx) => {
      const items = (tx.items && tx.items.length > 0)
        ? tx.items
        : ((tx as any).transaction_items && (tx as any).transaction_items.length > 0)
        ? (tx as any).transaction_items
        : null;
      if (items) {
        items.forEach((item: any, idx: number) => {
          lines.push(
            [
              idx === 0 ? `"${tx.id}"` : `""`,
              idx === 0 ? `"${formatDateTime(tx.created_at)}"` : `""`,
              idx === 0 ? `"${tx.payment_method || "Tunai"}"` : `""`,
              idx === 0 ? `"Lunas"` : `""`,
              idx === 0 ? `"${tx.customer_name || "Pelanggan Umum"}"` : `""`,
              `"${item.product_name}"`,
              item.quantity,
              item.sell_price,
              item.quantity * item.sell_price,
              idx === 0 ? tx.total_amount : `""`,
              idx === 0 ? tx.total_profit : `""`,
            ].join(",")
          );
        });
      } else {
        lines.push(
          [
            `"${tx.id}"`,
            `"${formatDateTime(tx.created_at)}"`,
            `"${tx.payment_method || "Tunai"}"`,
            `"Lunas"`,
            `"${tx.customer_name || "Pelanggan Umum"}"`,
            `"(detail tidak tersedia)"`,
            `""`,
            `""`,
            `""`,
            tx.total_amount,
            tx.total_profit,
          ].join(",")
        );
      }
    });

    const filename = `${titlePrefix}_Toko_Jaya_Tani_${new Date().toISOString().slice(0, 10)}.csv`;
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + lines.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Tawarkan reset setelah ekspor
    if (offerReset) {
      const exportedIds = targetData.map((tx) => tx.id);
      await handleResetTransactions(exportedIds);
    }
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

      // Filter Status Pelunasan
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

  // Ringkasan Statistik Periode yang Difilter — Omzet hanya dari transaksi LUNAS
  const filteredPaidTransactions = filteredHistoryTransactions.filter(
    (tx) => tx.payment_status === "Lunas"
  );
  const filteredRevenue = filteredPaidTransactions.reduce((s, tx) => s + Number(tx.total_amount), 0);
  const filteredProfit = filteredPaidTransactions.reduce((s, tx) => s + Number(tx.total_profit), 0);


  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-sm font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-5 h-5" /> Laporan Ringkas & Pembukuan
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Laporan Penjualan Toko Tani</h2>
          <p className="text-emerald-100 text-sm sm:text-base font-medium mt-0.5">
            Pantau omzet, untung kotor, dan ekspor laporan transaksi toko.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={() => handleExportCustomCSV(transactions, "Laporan_Penjualan_Lengkap", true)}
            className="py-3 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap"
          >
            <Download className="w-5 h-5 stroke-[3]" />
            <span>Ekspor + Reset Semua (.csv)</span>
          </button>

          <button
            onClick={fetchReports}
            className="py-3 px-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
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
                `Laporan_Triwulan_${selectedQuarter}_Tahun_${selectedYear}`,
                true
              )
            }
            className="py-3 px-5 rounded-2xl bg-emerald-950 hover:bg-emerald-900 text-amber-300 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 whitespace-nowrap"
          >
            <Download className="w-5 h-5 stroke-[3] text-amber-400" />
            <span>Unduh + Reset Periode (.csv)</span>
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
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-gray-900 text-base">
            Rincian Pembayaran Hari Ini ({formatDateOnly(new Date().toISOString())})
          </h3>
          <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
            ✅ Omzet = Tunai + QRIS
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <p className="text-xs font-bold text-emerald-800 uppercase">Tunai</p>
            </div>
            <p className="text-lg font-black text-emerald-900">{formatRupiah(tunaiTotal)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-4 h-4 text-blue-700" />
              <p className="text-xs font-bold text-blue-800 uppercase">QRIS</p>
            </div>
            <p className="text-lg font-black text-blue-900">{formatRupiah(qrisTotal)}</p>
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
              <p className="text-[10px] font-bold text-gray-400">total penjualan</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black uppercase text-amber-700">Total Untung</p>
              <p className="text-base font-black text-amber-900">{formatRupiah(filteredProfit)}</p>
              <p className="text-[10px] font-bold text-gray-400">estimasi untung kotor</p>
            </div>
          </div>

          {/* FILTER PENCARIAN, PEMBAYARAN & STATUS PELUNASAN */}
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

            {/* Filter Status Pelunasan */}
            <select
              value={historyDebtFilter}
              onChange={(e) => setHistoryDebtFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-rose-300 text-xs font-bold text-rose-900 focus:border-rose-600 focus:outline-hidden"
            >
              <option value="semua">🗒️ Semua Status</option>
              <option value="belum_lunas">⏳ Belum Lunas (Hutang)</option>
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
            </select>
          </div>

          {/* DAFTAR RIWAYAT TRANSAKSI — DETAIL ACCORDION */}
          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {filteredHistoryTransactions.length === 0 ? (
              <p className="text-center text-sm font-bold text-gray-500 py-8">
                Tidak ada riwayat transaksi yang cocok dengan filter.
              </p>
            ) : (
              filteredHistoryTransactions.map((tx) => {
                const isExpanded = expandedTxId === tx.id;
                const hasItems = tx.items && tx.items.length > 0;
                const isUnpaid = tx.payment_status === "Belum Lunas";
                return (
                  <div
                    key={tx.id}
                    className={`rounded-2xl border-2 transition-all overflow-hidden ${
                      isUnpaid ? "border-rose-300 bg-rose-50/40" : "border-gray-200 bg-gray-50"
                    } ${isExpanded ? "shadow-md" : ""}`}
                  >
                    {/* Baris Ringkasan */}
                    <div className="p-3.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs pb-2 border-b border-gray-200/60 mb-2">
                        <span className="font-black text-gray-900">#{tx.id.substring(0, 8)}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${
                          tx.payment_method === "QRIS" ? "bg-blue-200 text-blue-900" : "bg-emerald-200 text-emerald-900"
                        }`}>{tx.payment_method || "Tunai"}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${
                          isUnpaid
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {isUnpaid ? "BELUM LUNAS" : "LUNAS"}
                        </span>
                        <span className="ml-auto text-gray-400 font-semibold">{formatDateTime(tx.created_at)}</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">
                            Pembeli: <strong className="text-gray-800">{tx.customer_name || "Pelanggan Umum"}</strong>
                          </p>
                          <div className="flex items-baseline gap-3 mt-0.5">
                            <p className="text-base font-black text-emerald-700">{formatRupiah(tx.total_amount)}</p>
                            <p className="text-xs font-bold text-amber-600">+{formatRupiah(tx.total_profit)} untung</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Tombol Tandai Lunas jika Belum Lunas */}
                          {isUnpaid && (
                            <button
                              onClick={() => handleTogglePaymentStatus(tx, "Lunas")}
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Tandai Lunas
                            </button>
                          )}

                          {/* Tombol Lihat Detail */}
                          <button
                            onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                            className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1 border transition-all ${
                              isExpanded
                                ? "bg-gray-200 text-gray-700 border-gray-300"
                                : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            }`}
                          >
                            {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" />Tutup</> : <><ChevronDown className="w-3.5 h-3.5" />Lihat Detail</>}
                          </button>

                          {/* Ekspor 1 Nota */}
                          <button
                            onClick={() => handleExportCustomCSV([tx], `Nota_${tx.id.substring(0, 8)}`, false)}
                            className="py-1.5 px-2.5 rounded-xl text-xs font-black flex items-center gap-1 bg-white border border-gray-300 text-gray-600 hover:border-gray-400 transition-all"
                            title="Unduh nota ini (.csv)"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Hapus 1 Transaksi */}
                          <button
                            onClick={() => handleDeleteSingleTransaction(tx)}
                            className="py-1.5 px-2.5 rounded-xl text-xs font-black flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all"
                            title="Hapus transaksi ini & kembalikan stok"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Detail Items — Accordion */}
                    {isExpanded && (
                      <div className="border-t-2 border-dashed border-gray-200 bg-white px-4 py-3 space-y-2">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Detail Barang Dibeli</p>
                        {hasItems ? (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="text-left px-2.5 py-2 font-black text-gray-600 rounded-l-lg">Nama Barang</th>
                                    <th className="text-center px-2.5 py-2 font-black text-gray-600">Qty</th>
                                    <th className="text-right px-2.5 py-2 font-black text-gray-600">Harga Satuan</th>
                                    <th className="text-right px-2.5 py-2 font-black text-gray-600 rounded-r-lg">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {tx.items!.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                      <td className="px-2.5 py-2 font-bold text-gray-900">{item.product_name}</td>
                                      <td className="px-2.5 py-2 text-center font-bold text-gray-700">{item.quantity}x</td>
                                      <td className="px-2.5 py-2 text-right font-bold text-gray-700">{formatRupiah(item.sell_price)}</td>
                                      <td className="px-2.5 py-2 text-right font-black text-emerald-700">{formatRupiah(item.quantity * item.sell_price)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-gray-300">
                                    <td colSpan={3} className="px-2.5 py-2 text-right text-xs font-black text-gray-700">TOTAL</td>
                                    <td className="px-2.5 py-2 text-right text-base font-black text-emerald-800">{formatRupiah(tx.total_amount)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                              <span className="text-[11px] font-bold text-gray-500">
                                {tx.items!.length} jenis barang · {tx.items!.reduce((s, i) => s + i.quantity, 0)} item total
                              </span>
                              <span className="text-xs font-black text-amber-600">Keuntungan: +{formatRupiah(tx.total_profit)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="py-4 text-center text-xs font-bold text-gray-400">
                            Detail item tidak tersedia untuk transaksi ini.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
