-- ====================================================================
-- SKEMA DATABASE SUPABASE DILENGKAPI: TOKO JAYA TANI (VERSI LENGKAP)
-- Fitur: Barcode Scanner, Metode Pembayaran (Tunai/QRIS/Bon), Struk Thermal
-- ====================================================================

-- 1. TABEL PRODUCTS (Produk/Barang)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Umum',
    buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk percepat pencarian berdasarkan barcode, nama, dan kategori
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Tambahkan kolom barcode jika tabel sudah ada sebelumnya
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='barcode') THEN
        ALTER TABLE public.products ADD COLUMN barcode VARCHAR(100) UNIQUE;
    END IF;
END $$;

-- 2. TABEL TRANSACTIONS (Penjualan / Kasir Header)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_profit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Tunai', -- 'Tunai', 'QRIS', 'Bon'
    customer_name VARCHAR(255) DEFAULT 'Pelanggan Umum',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tambahkan kolom payment_method & customer_name jika tabel sudah ada sebelumnya
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_method') THEN
        ALTER TABLE public.transactions ADD COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'Tunai';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='customer_name') THEN
        ALTER TABLE public.transactions ADD COLUMN customer_name VARCHAR(255) DEFAULT 'Pelanggan Umum';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON public.transactions(payment_method);

-- 3. TABEL TRANSACTION_ITEMS (Detail Barang Transaksi)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_tx_id ON public.transaction_items(transaction_id);

-- ====================================================================
-- TRIGGER UPDATED_AT OTOMATIS
-- ====================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_timestamp ON public.products;
CREATE TRIGGER set_products_timestamp
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ====================================================================
-- FUNGSI RPC SUPABASE: PROSES TRANSAKSI & KURANGI STOK OTOMATIS
-- DENGAN SUPPORT METODE PEMBAYARAN & NAMA PELANGGAN
-- ====================================================================
CREATE OR REPLACE FUNCTION process_transaction(
    items JSONB,
    p_payment_method TEXT DEFAULT 'Tunai',
    p_customer_name TEXT DEFAULT 'Pelanggan Umum'
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_product_id UUID;
    v_qty INT;
    v_curr_stock INT;
    v_buy_price NUMERIC(12, 2);
    v_sell_price NUMERIC(12, 2);
    v_product_name TEXT;
    
    v_item_profit NUMERIC(12, 2);
    v_total_amount NUMERIC(12, 2) := 0;
    v_total_profit NUMERIC(12, 2) := 0;
    
    v_transaction_id UUID;
BEGIN
    -- Validasi ketersediaan stok & hitung total transaksi
    FOR v_item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;

        SELECT name, stock, buy_price, sell_price 
        INTO v_product_name, v_curr_stock, v_buy_price, v_sell_price
        FROM public.products
        WHERE id = v_product_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan.', v_product_id;
        END IF;

        IF v_curr_stock < v_qty THEN
            RAISE EXCEPTION 'Stok produk "%" tidak mencukupi. (Stok tersedia: %, diminta: %)', v_product_name, v_curr_stock, v_qty;
        END IF;

        v_item_profit := (v_sell_price - v_buy_price) * v_qty;
        v_total_amount := v_total_amount + (v_sell_price * v_qty);
        v_total_profit := v_total_profit + v_item_profit;
    END LOOP;

    -- Insert ke tabel transactions dengan metode pembayaran
    INSERT INTO public.transactions (total_amount, total_profit, payment_method, customer_name)
    VALUES (v_total_amount, v_total_profit, COALESCE(p_payment_method, 'Tunai'), COALESCE(p_customer_name, 'Pelanggan Umum'))
    RETURNING id INTO v_transaction_id;

    -- Insert ke transaction_items & kurangi stok produk
    FOR v_item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;

        SELECT name, buy_price, sell_price 
        INTO v_product_name, v_buy_price, v_sell_price
        FROM public.products
        WHERE id = v_product_id;

        v_item_profit := (v_sell_price - v_buy_price) * v_qty;

        INSERT INTO public.transaction_items (
            transaction_id,
            product_id,
            product_name,
            quantity,
            buy_price,
            sell_price,
            profit
        ) VALUES (
            v_transaction_id,
            v_product_id,
            v_product_name,
            v_qty,
            v_buy_price,
            v_sell_price,
            v_item_profit
        );

        -- Kurangi stok produk
        UPDATE public.products
        SET stock = stock - v_qty
        WHERE id = v_product_id;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'total_amount', v_total_amount,
        'total_profit', v_total_profit,
        'payment_method', COALESCE(p_payment_method, 'Tunai'),
        'customer_name', COALESCE(p_customer_name, 'Pelanggan Umum')
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Gagal memproses transaksi: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ROW LEVEL SECURITY
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Publik Products" ON public.products;
DROP POLICY IF EXISTS "Akses Publik Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Akses Publik Transaction Items" ON public.transaction_items;

CREATE POLICY "Akses Publik Products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Publik Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Publik Transaction Items" ON public.transaction_items FOR ALL USING (true) WITH CHECK (true);

-- SEED DATA CONTOH DENGAN BARCODE
INSERT INTO public.products (barcode, name, category, buy_price, sell_price, stock, min_stock)
VALUES 
    ('8991001001', 'Pupuk Urea Subur 50kg', 'Pupuk', 120000, 145000, 25, 5),
    ('8991001002', 'Pupuk NPK Mutiara 16-16-16 1kg', 'Pupuk', 18000, 23000, 40, 10),
    ('8991001003', 'Benih Padi Ciherang Unggul 5kg', 'Benih', 65000, 80000, 15, 5),
    ('8991001004', 'Benih Jagung Hibrida BISI-18 1kg', 'Benih', 85000, 105000, 8, 3),
    ('8991001005', 'Pestisida RoundUp 1 Liter', 'Pestisida', 75000, 92000, 12, 4),
    ('8991001006', 'Fungisida Antracol 70WP 500g', 'Pestisida', 48000, 60000, 3, 5),
    ('8991001007', 'Cangkul Baja Asli Tani', 'Alat Tani', 55000, 75000, 6, 2),
    ('8991001008', 'Sprayer Elektrik Hama 16 Liter', 'Alat Tani', 280000, 350000, 2, 3),
    ('8991001009', 'Benih Cabai Rawit Setan 10g', 'Benih', 22000, 30000, 0, 5)
ON CONFLICT (barcode) DO NOTHING;
