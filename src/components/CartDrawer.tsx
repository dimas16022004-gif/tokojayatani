"use client";

import { useState } from "react";
import { CartItem, PaymentMethod } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  X,
  Printer,
  DollarSign,
  Loader2,
  CreditCard,
  QrCode,
  Copy,
} from "lucide-react";

interface CartDrawerProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProcessTransaction: (
    paymentAmount: number,
    paymentMethod: PaymentMethod,
    customerName: string
  ) => Promise<boolean>;
}

export default function CartDrawer({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProcessTransaction,
}: CartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Tunai");
  const [customerName, setCustomerName] = useState<string>("Pelanggan Umum");
  const [paymentInput, setPaymentInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTxData, setCompletedTxData] = useState<{
    totalAmount: number;
    paymentAmount: number;
    changeAmount: number;
    paymentMethod: PaymentMethod;
    customerName: string;
    items: CartItem[];
    date: string;
  } | null>(null);

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.sell_price * item.quantity,
    0
  );
  const totalProfit = cart.reduce(
    (sum, item) =>
      sum + (item.product.sell_price - item.product.buy_price) * item.quantity,
    0
  );

  const paymentNumber = parseFloat(paymentInput.replace(/\D/g, "")) || 0;
  const changeAmount = paymentNumber - totalAmount;

  const handleQuickPayment = (amount: number) => {
    setPaymentInput(amount.toString());
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!paymentInput.trim()) {
      alert(
        paymentMethod === "Tunai"
          ? "⚠️ Harap masukkan nominal uang tunai yang diterima dari pembeli terlebih dahulu!"
          : "⚠️ Harap masukkan nominal transfer yang diterima di rekening BRI terlebih dahulu!"
      );
      return;
    }

    if (paymentNumber < totalAmount) {
      alert(
        `⚠️ Nominal uang yang dibayarkan KURANG!\n\n` +
        `Total Belanja: ${formatRupiah(totalAmount)}\n` +
        `Nominal Diterima: ${formatRupiah(paymentNumber)}\n` +
        `Kurang: ${formatRupiah(totalAmount - paymentNumber)}`
      );
      return;
    }

    setIsProcessing(true);
    const finalPayment = paymentNumber;
    const success = await onProcessTransaction(
      finalPayment,
      paymentMethod,
      customerName
    );
    setIsProcessing(false);

    if (success) {
      setCompletedTxData({
        totalAmount,
        paymentAmount: finalPayment,
        changeAmount: paymentMethod === "Tunai" ? finalPayment - totalAmount : 0,
        paymentMethod,
        customerName: customerName || "Pelanggan Umum",
        items: [...cart],
        date: new Date().toLocaleString("id-ID"),
      });
      setShowReceipt(true);
      onClearCart();
      setPaymentInput("");
      setCustomerName("Pelanggan Umum");
      setPaymentMethod("Tunai");
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Button for Mobile & Desktop Trigger */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-30 print:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-transform active:scale-95 border-2 border-emerald-400"
        >
          <div className="relative">
            <ShoppingCart className="w-7 h-7" />
            {totalItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-400 text-emerald-950 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-emerald-900 shadow">
                {totalItemCount}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-emerald-200 uppercase">Keranjang</p>
            <p className="text-lg font-black leading-none">{formatRupiah(totalAmount)}</p>
          </div>
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity print:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side / Bottom Sheet Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white shadow-2xl transform transition-transform duration-300 flex flex-col print:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header Drawer */}
        <div className="p-4 sm:p-5 bg-emerald-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-amber-300" />
            <div>
              <h2 className="text-xl font-black text-amber-300 leading-none">
                Keranjang Belanja
              </h2>
              <p className="text-xs text-emerald-200 font-semibold mt-0.5">
                {totalItemCount} Jenis Barang
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-emerald-200 hover:bg-emerald-700 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <ShoppingCart className="w-16 h-16 stroke-1 mb-3 text-gray-300" />
              <p className="font-extrabold text-lg text-gray-700">Keranjang Masih Kosong</p>
              <p className="text-sm mt-1">Pilih barang dari daftar produk di sebelah kiri untuk dimasukkan ke keranjang.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-base truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {formatRupiah(item.product.sell_price)} x {item.quantity}
                  </p>
                  <p className="text-sm font-black text-emerald-700 mt-0.5">
                    {formatRupiah(item.product.sell_price * item.quantity)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center font-black text-gray-700 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-7 text-center font-black text-base text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center font-black text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus barang"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Calculation & Action */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-200 space-y-3">
            {/* Total Summary */}
            <div className="space-y-1.5 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <div className="flex justify-between text-sm text-emerald-900 font-bold">
                <span>Total Keuntungan Kotor:</span>
                <span className="text-emerald-700">{formatRupiah(totalProfit)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-gray-900 pt-1 border-t border-emerald-200/60">
                <span>TOTAL HARGA:</span>
                <span className="text-emerald-700">{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            {/* Pilih Metode Pembayaran */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Tunai")}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 transition-all ${
                    paymentMethod === "Tunai"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("QRIS")}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 transition-all ${
                    paymentMethod === "QRIS"
                      ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-blue-700" />
                  <span>QRIS / Transfer</span>
                </button>
              </div>
            </div>

            {/* Info Rekening Transfer BRI */}
            {paymentMethod === "QRIS" && (
              <div className="p-3 bg-blue-50 rounded-2xl border-2 border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-700 text-white rounded-lg font-black text-xs flex items-center justify-center shadow-xs">
                      BRI
                    </div>
                    <div>
                      <p className="text-xs font-black text-blue-950 leading-none">BANK BRI</p>
                      <p className="text-[10px] font-bold text-blue-700 mt-0.5">Toko Jaya Tani</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("807901001140535");
                      alert("✅ Nomor rekening BRI 807901001140535 berhasil disalin!");
                    }}
                    className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin
                  </button>
                </div>
                <div className="p-2 bg-white rounded-xl border border-blue-200 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">No. Rekening BRI</p>
                  <p className="text-base font-black text-blue-950 tracking-wider">8079-0100-1140-535</p>
                </div>
              </div>
            )}

            {/* Input Nominal Pembayaran (Wajib untuk Tunai & Transfer) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                {paymentMethod === "Tunai"
                  ? "Uang Tunai Diterima (Rp) *"
                  : "Nominal Transfer Diterima (Rp) *"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder={`Contoh: ${totalAmount}`}
                  value={paymentInput}
                  onChange={(e) => setPaymentInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-gray-300 font-extrabold text-lg text-gray-900 focus:border-emerald-600 focus:outline-hidden"
                />
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-2.5 top-3" />
              </div>

              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickPayment(totalAmount)}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg border border-emerald-300"
                >
                  Uang Pas ({formatRupiah(totalAmount)})
                </button>
                {[50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickPayment(amt)}
                    className="px-2.5 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Kembalian Calculation */}
            {paymentMethod === "Tunai" && paymentNumber > 0 && (
              <div
                className={`p-3 rounded-xl font-bold flex justify-between items-center text-sm ${
                  changeAmount >= 0
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-rose-100 text-rose-900 border border-rose-300"
                }`}
              >
                <span>{changeAmount >= 0 ? "UANG KEMBALIAN:" : "UANG KURANG:"}</span>
                <span className="text-base font-black">
                  {formatRupiah(Math.abs(changeAmount))}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" /> Memproses Transaksi...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" /> PROSES TRANSAKSI
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Nota / Thermal Receipt Modal After Success */}
      {showReceipt && completedTxData && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:inset-auto">
          {/* Struk thermal 58mm/80mm container */}
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-4 border-emerald-500 animate-in fade-in zoom-in duration-200 print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full">
            <div className="text-center pb-4 border-b border-dashed border-gray-300">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2 print:hidden">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900">TOKO JAYA TANI</h3>
              <p className="text-xs text-gray-500 font-semibold">{completedTxData.date}</p>
              <div className="mt-2 text-xs font-bold text-gray-800 space-y-0.5">
                <p>Metode: <strong className="uppercase">{completedTxData.paymentMethod}</strong></p>
                {completedTxData.paymentMethod === "QRIS" && (
                  <p className="text-blue-700 font-extrabold">BRI: 8079-0100-1140-535</p>
                )}
                {completedTxData.customerName && (
                  <p>Pembeli: <strong>{completedTxData.customerName}</strong></p>
                )}
              </div>
            </div>

            <div className="py-4 space-y-2 max-h-48 overflow-y-auto print:max-h-none text-sm border-b border-dashed border-gray-300">
              {completedTxData.items.map((item) => (
                <div key={item.product.id} className="flex justify-between font-medium">
                  <div>
                    <p className="font-bold text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} x {formatRupiah(item.product.sell_price)}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatRupiah(item.product.sell_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="py-3 space-y-1 text-sm font-bold text-gray-800">
              <div className="flex justify-between text-base font-black text-gray-900">
                <span>TOTAL:</span>
                <span className="text-emerald-700">
                  {formatRupiah(completedTxData.totalAmount)}
                </span>
              </div>
              {completedTxData.paymentMethod === "Tunai" && (
                <>
                  <div className="flex justify-between">
                    <span>DIBAYAR:</span>
                    <span>{formatRupiah(completedTxData.paymentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-extrabold bg-emerald-50 p-2 rounded-lg print:bg-transparent">
                    <span>KEMBALIAN:</span>
                    <span>{formatRupiah(completedTxData.changeAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak Struk
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
