export type PaymentMethod = "Tunai" | "QRIS";
export type PaymentStatus = "Lunas" | "Belum Lunas";

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  category: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  total_amount: number;
  total_profit: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  customer_name?: string;
  paid_at?: string;
  created_at: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  buy_price: number;
  sell_price: number;
  profit: number;
  created_at: string;
}
