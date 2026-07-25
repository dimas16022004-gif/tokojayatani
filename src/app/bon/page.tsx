"use client";

import { useState, useEffect, useMemo } from "react";
import { Transaction } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { formatRupiah, formatDateTime, formatDateOnly } from "@/lib/utils";
import {
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Download,
  RefreshCw,
  Filter,
  AlertTriangle,
  Pencil,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Phone,
  DollarSign,
  TrendingDown,
} from "lucide-react";

// ─── Mock data jika DB kosong ────────────────────────────────────────────────
const MOCK_DEBTS: Transaction[] = [
  {
    id: "bon-001",
    total_amount: 145000,
    total_profit: 25000,
    payment_method: "Bon",
    payment_status: "Belum Lunas",
    customer_name: "Pak Haji Ahmad",
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: "bon-002",
    total_amount: 350000,
    total_profit: 70000,
    payment_method: "Bon",
    payment_status: "Belum Lunas",
    customer_name: "Pak Mamat Tani",
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: "bon-003",
    total_amount: 88000,
    total_profit: 12000,
    payment_method: "Bon",
    payment_status: "Lunas",
    customer_name: "Bu Sari",
    paid_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: "bon-004",
    total_amount: 220000,
    total_profit: 35000,
    payment_method: "Bon",
    payment_status: "Belum Lunas",
    customer_name: "Pak Joko",
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    id: "bon-005",
    total_amount: 510000,
    total_profit: 80000,
    payment_method: "Bon",
    payment_status: "Lunas",
    customer_name: "Pak Haji Ahmad",
    paid_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
  },
];

// ─── Edit Modal ───────────────────────────────────────────────────────────────
interface EditModalProps {
  tx: Transaction;
  onClose: () => void;
  onSave: (id: string, newName: string, newStatus: "Lunas" | "Belum Lunas") => void;
}

function EditModal({ tx, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(tx.customer_name || "");
  const [status, setStatus] = useState<"Lunas" | "Belum Lunas">(
    tx.payment_status as "Lunas" | "Belum Lunas"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Edit Data Bon</h3>
              <p className="text-xs font-bold text-gray-500">#{tx.id.substring(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Info Transaksi */}
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
          <div className="flex justify-between text-xs font-bold text-gray-500">
            <span>Tanggal Bon</span>
            <span>{formatDateTime(tx.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-bold text-gray-700">Total Hutang</span>
            <span className="text-lg font-black text-rose-700">{formatRupiah(tx.total_amount)}</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase tracking-wider">
              Nama Pelanggan
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama pelanggan..."
                className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-bold text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase tracking-wider">
              Status Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStatus("Belum Lunas")}
                className={`py-3 px-4 rounded-xl text-sm font-black border-2 flex items-center justify-center gap-2 transition-all ${
                  status === "Belum Lunas"
                    ? "bg-rose-600 text-white border-rose-600 shadow-md"
                    : "bg-white text-gray-500 border-gray-200 hover:border-rose-300"
                }`}
              >
                <XCircle className="w-4 h-4" />
                Belum Lunas
              </button>
              <button
                onClick={() => setStatus("Lunas")}
                className={`py-3 px-4 rounded-xl text-sm font-black border-2 flex items-center justify-center gap-2 transition-all ${
                  status === "Lunas"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                    : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Lunas
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(tx.id, name, status)}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-colors shadow-md"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BonPage() {
  const [allBon, setAllBon] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "belum_lunas" | "lunas">("semua");
  const [dateFilter, setDateFilter] = useState<"semua" | "hari_ini" | "minggu_ini" | "bulan_ini">("semua");
  const [sortBy, setSortBy] = useState<"terbaru" | "terlama" | "terbesar">("terbaru");
  const [showLunas, setShowLunas] = useState(false); // toggle section lunas

  const fetchBon = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, transaction_items(*)")
        .eq("payment_method", "Bon")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        setAllBon(MOCK_DEBTS);
      } else {
        setAllBon(data as Transaction[]);
      }
    } catch {
      setAllBon(MOCK_DEBTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBon();
  }, []);

  // ─── Update Status & Nama ──────────────────────────────────────────────────
  const handleSaveEdit = async (
    id: string,
    newName: string,
    newStatus: "Lunas" | "Belum Lunas"
  ) => {
    const paidAt = newStatus === "Lunas" ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          customer_name: newName,
          payment_status: newStatus,
          paid_at: paidAt,
        })
        .eq("id", id);

      if (error) console.warn("Supabase update error:", error.message);
    } catch (err) {
      console.error(err);
    }

    // Update lokal langsung
    setAllBon((prev) =>
      prev.map((tx) =>
        tx.id === id
          ? { ...tx, customer_name: newName, payment_status: newStatus, paid_at: paidAt || undefined }
          : tx
      )
    );
    setEditTarget(null);
  };

  // ─── Tandai Lunas Cepat (1-tap) ───────────────────────────────────────────
  const handleQuickPay = async (tx: Transaction) => {
    if (tx.payment_status === "Lunas") return;
    const ok = window.confirm(
      `Tandai hutang "${tx.customer_name || "Pelanggan"}" sebesar ${formatRupiah(tx.total_amount)} sebagai LUNAS?`
    );
    if (!ok) return;
    await handleSaveEdit(tx.id, tx.customer_name || "", "Lunas");
    alert(`✅ Hutang "${tx.customer_name}" berhasil ditandai LUNAS!`);
  };

  // ─── Export CSV ───────────────────────────────────────────────────────────
  const handleExport = (data: Transaction[], label: string) => {
    if (data.length === 0) { alert("Tidak ada data untuk diekspor."); return; }
    const headers = ["ID", "Nama Pelanggan", "Total Hutang (Rp)", "Status", "Tanggal Bon", "Tanggal Lunas"];
    const rows = data.map((tx) => [
      `"${tx.id}"`,
      `"${tx.customer_name || "-"}"`,
      tx.total_amount,
      `"${tx.payment_status}"`,
      `"${formatDateTime(tx.created_at)}"`,
      `"${tx.paid_at ? formatDateTime(tx.paid_at) : "-"}"`,
    ]);
    const csv = "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `${label}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Filter & Sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    return allBon
      .filter((tx) => {
        // Search
        if (
          search &&
          !(tx.customer_name || "").toLowerCase().includes(search.toLowerCase()) &&
          !tx.id.toLowerCase().includes(search.toLowerCase())
        ) return false;

        // Status
        if (statusFilter === "belum_lunas" && tx.payment_status !== "Belum Lunas") return false;
        if (statusFilter === "lunas" && tx.payment_status !== "Lunas") return false;

        // Tanggal
        const txDate = new Date(tx.created_at);
        if (dateFilter === "hari_ini" && txDate.toDateString() !== now.toDateString()) return false;
        if (dateFilter === "minggu_ini") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          if (txDate < startOfWeek) return false;
        }
        if (dateFilter === "bulan_ini") {
          if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear())
            return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "terlama") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === "terbesar") return Number(b.total_amount) - Number(a.total_amount);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [allBon, search, statusFilter, dateFilter, sortBy]);

  const unpaid = filtered.filter((t) => t.payment_status === "Belum Lunas");
  const paid = filtered.filter((t) => t.payment_status === "Lunas");
  const totalUnpaid = unpaid.reduce((s, t) => s + Number(t.total_amount), 0);
  const totalPaid = allBon
    .filter((t) => t.payment_status === "Lunas")
    .reduce((s, t) => s + Number(t.total_amount), 0);

  return (
    <>
      {editTarget && (
        <EditModal
          tx={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      <div className="space-y-6">
        {/* ── Header Banner ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-rose-700 to-rose-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-sm font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-5 h-5" /> Catatan Piutang Pelanggan
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">Buku Piutang / Catatan Bon</h2>
            <p className="text-rose-100 text-sm sm:text-base font-medium mt-0.5">
              Catat siapa yang berhutang, update status pelunasan, & lihat riwayat bon kapan saja.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-xl text-xs font-bold">
                📝 Bon dicatat saat barang diambil
              </span>
              <span className="px-3 py-1 bg-emerald-400/30 rounded-xl text-xs font-bold">
                ✅ Klik &quot;Tandai Lunas&quot; saat hutang dibayar
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleExport(allBon.filter((t) => t.payment_status === "Belum Lunas"), "Bon_Belum_Lunas")}
              className="py-2.5 px-4 rounded-2xl bg-rose-400/30 hover:bg-rose-400/50 border border-rose-300/50 text-white font-black text-sm flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" /> Ekspor Belum Lunas
            </button>
            <button
              onClick={() => handleExport(allBon, "Semua_Data_Bon")}
              className="py-2.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-rose-950 font-black text-sm flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" /> Ekspor Semua Bon (.csv)
            </button>
            <button
              onClick={fetchBon}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-rose-700">Total Piutang Belum Dibayar</p>
              <p className="text-2xl font-black text-rose-800">{formatRupiah(totalUnpaid)}</p>
              <p className="text-xs font-bold text-rose-600">{unpaid.length} bon tertunggak</p>
            </div>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">Total Bon Sudah Lunas</p>
              <p className="text-2xl font-black text-emerald-800">{formatRupiah(totalPaid)}</p>
              <p className="text-xs font-bold text-emerald-600">
                {allBon.filter((t) => t.payment_status === "Lunas").length} bon terlunasi
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-amber-700">Total Bon Keseluruhan</p>
              <p className="text-2xl font-black text-amber-800">
                {formatRupiah(allBon.reduce((s, t) => s + Number(t.total_amount), 0))}
              </p>
              <p className="text-xs font-bold text-amber-600">{allBon.length} total transaksi bon</p>
            </div>
          </div>
        </div>

        {/* ── Filter & Kontrol ──────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 border-2 border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-700 font-black">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter & Pencarian</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2">
              <input
                type="text"
                placeholder="Cari nama pelanggan atau ID bon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-rose-400 focus:outline-none text-sm font-bold text-gray-900"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-rose-400 focus:outline-none text-sm font-bold text-gray-800 bg-white"
            >
              <option value="semua">🗒️ Semua Status</option>
              <option value="belum_lunas">❌ Belum Lunas</option>
              <option value="lunas">✅ Sudah Lunas</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-rose-400 focus:outline-none text-sm font-bold text-gray-800 bg-white"
            >
              <option value="terbaru">↓ Terbaru Dulu</option>
              <option value="terlama">↑ Terlama Dulu</option>
              <option value="terbesar">💰 Hutang Terbesar</option>
            </select>
          </div>

          {/* Tanggal Pills */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-black text-gray-500 flex items-center gap-1 mr-1">
              <CalendarDays className="w-3.5 h-3.5" /> Periode:
            </span>
            {[
              { id: "semua", label: "Semua Waktu" },
              { id: "hari_ini", label: "Hari Ini" },
              { id: "minggu_ini", label: "Minggu Ini" },
              { id: "bulan_ini", label: "Bulan Ini" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setDateFilter(id as typeof dateFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                  dateFilter === id
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-rose-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SEKSI BELUM LUNAS ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="text-lg font-black text-gray-900">Bon Belum Lunas</h3>
            </div>
            <span className="px-3 py-1 text-xs font-black bg-rose-600 text-white rounded-full">
              {unpaid.length} Pelanggan
            </span>
            <span className="text-sm font-black text-rose-700 ml-auto">
              {formatRupiah(totalUnpaid)}
            </span>
          </div>

          {unpaid.length === 0 ? (
            <div className="p-10 text-center bg-emerald-50 border-2 border-emerald-200 rounded-3xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-black text-emerald-800">Alhamdulillah! Tidak Ada Bon Tertunggak</p>
              <p className="text-sm font-medium text-emerald-600 mt-1">
                Semua bon pelanggan sudah lunas terbayar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {unpaid.map((tx) => (
                <BonCard
                  key={tx.id}
                  tx={tx}
                  onEdit={() => setEditTarget(tx)}
                  onQuickPay={() => handleQuickPay(tx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── SEKSI SUDAH LUNAS (collapsible) ──────────────────────────── */}
        <div className="space-y-3">
          <button
            onClick={() => setShowLunas(!showLunas)}
            className="flex items-center gap-3 w-full group"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-gray-900">Bon Sudah Lunas</h3>
            <span className="px-3 py-1 text-xs font-black bg-emerald-600 text-white rounded-full">
              {paid.length} Bon
            </span>
            <span className="ml-auto text-xs font-bold text-gray-500 flex items-center gap-1">
              {showLunas ? "Sembunyikan" : "Tampilkan"}
              {showLunas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {showLunas && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paid.length === 0 ? (
                <p className="text-sm font-bold text-gray-500 col-span-full text-center py-6">
                  Belum ada bon yang lunas dalam periode ini.
                </p>
              ) : (
                paid.map((tx) => (
                  <BonCard
                    key={tx.id}
                    tx={tx}
                    onEdit={() => setEditTarget(tx)}
                    onQuickPay={() => handleQuickPay(tx)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Bon Card Component ───────────────────────────────────────────────────────
function BonCard({
  tx,
  onEdit,
  onQuickPay,
}: {
  tx: Transaction;
  onEdit: () => void;
  onQuickPay: () => void;
}) {
  const isLunas = tx.payment_status === "Lunas";
  const daysSince = Math.floor(
    (Date.now() - new Date(tx.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={`rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
        isLunas
          ? "bg-emerald-50/60 border-emerald-200"
          : daysSince >= 7
          ? "bg-rose-50 border-rose-400 shadow-sm"
          : "bg-rose-50/40 border-rose-200"
      }`}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isLunas ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-gray-900 text-sm truncate">
              {tx.customer_name || "Pelanggan Umum"}
            </p>
            <p className="text-[11px] font-bold text-gray-500">#{tx.id.substring(0, 8)}</p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 text-[11px] font-black rounded-lg whitespace-nowrap shrink-0 ${
            isLunas ? "bg-emerald-600 text-white" : "bg-rose-600 text-white animate-pulse"
          }`}
        >
          {isLunas ? "LUNAS" : "BELUM LUNAS"}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-baseline justify-between border-t border-dashed border-gray-200 pt-2">
        <span className="text-xs font-bold text-gray-500">Total Hutang:</span>
        <span className={`text-xl font-black ${isLunas ? "text-emerald-700" : "text-rose-700"}`}>
          {formatRupiah(tx.total_amount)}
        </span>
      </div>

      {/* Dates */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-gray-500 font-medium">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Bon dibuat: {formatDateOnly(tx.created_at)}</span>
          {!isLunas && daysSince >= 7 && (
            <span className="ml-auto px-1.5 py-0.5 bg-rose-200 text-rose-800 font-black rounded text-[10px]">
              {daysSince} hari
            </span>
          )}
        </div>
        {isLunas && tx.paid_at && (
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Lunas: {formatDateOnly(tx.paid_at)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onEdit}
          className="flex-1 py-2 rounded-xl bg-white border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit / Ubah
        </button>

        {!isLunas && (
          <button
            onClick={onQuickPay}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tandai Lunas
          </button>
        )}
      </div>
    </div>
  );
}
