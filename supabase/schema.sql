-- ====================================================================
-- SKEMA DATABASE SUPABASE: TOKO JAYA TANI (VERSI CATATAN HUTANG)
-- ====================================================================

-- 1. TABEL PRODUCTS
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

-- 2. TABEL TRANSACTIONS (Dengan status payment_status: 'Lunas' / 'Belum Lunas')
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_profit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Tunai', -- 'Tunai', 'QRIS', 'Bon'
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Lunas', -- 'Lunas', 'Belum Lunas'
    customer_name VARCHAR(255) DEFAULT 'Pelanggan Umum',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tambahkan kolom payment_status & paid_at jika belum ada
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_status') THEN
        ALTER TABLE public.transactions ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'Lunas';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='paid_at') THEN
        ALTER TABLE public.transactions ADD COLUMN paid_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON public.transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions(customer_name);

-- 3. TABEL TRANSACTION_ITEMS
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

-- Jaring pengaman: stok tidak boleh minus, di level manapun ia diubah
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'products_stock_non_negative'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);
    END IF;
END $$;

-- Selaraskan dengan form Produk (min_stock minimal 1, bukan 0)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'products_min_stock_at_least_1'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT products_min_stock_at_least_1 CHECK (min_stock >= 1);
    END IF;
END $$;

-- TRIGGER UPDATED_AT
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

-- FUNGSI RPC SUPABASE: PROSES TRANSAKSI DENGAN STATUS HUTANG (BELUM LUNAS UNTUK BON)
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
    v_status TEXT;
BEGIN
    -- Jika Metode Pembayaran 'Bon', atur status 'Belum Lunas'
    IF p_payment_method = 'Bon' THEN
        v_status := 'Belum Lunas';
    ELSE
        v_status := 'Lunas';
    END IF;

    -- Validasi ketersediaan stok & hitung total
    FOR v_item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;

        -- FOR UPDATE mengunci baris produk ini sampai transaksi selesai,
        -- supaya 2 transaksi yang berjalan bersamaan tidak sama-sama lolos
        -- validasi stok berdasarkan angka stok yang sama (race condition).
        SELECT name, stock, buy_price, sell_price 
        INTO v_product_name, v_curr_stock, v_buy_price, v_sell_price
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

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

    -- Insert ke tabel transactions
    INSERT INTO public.transactions (total_amount, total_profit, payment_method, payment_status, customer_name, paid_at)
    VALUES (
        v_total_amount, 
        v_total_profit, 
        COALESCE(p_payment_method, 'Tunai'), 
        v_status, 
        COALESCE(p_customer_name, 'Pelanggan Umum'),
        CASE WHEN v_status = 'Lunas' THEN NOW() ELSE NULL END
    )
    RETURNING id INTO v_transaction_id;

    -- Insert detail & kurangi stok
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
        'payment_status', v_status,
        'customer_name', COALESCE(p_customer_name, 'Pelanggan Umum')
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Gagal memproses transaksi: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- FUNGSI PELUNASAN HUTANG
CREATE OR REPLACE FUNCTION pay_debt(p_transaction_id UUID)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.transactions
    SET payment_status = 'Lunas',
        paid_at = NOW()
    WHERE id = p_transaction_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Publik Products" ON public.products;
DROP POLICY IF EXISTS "Akses Publik Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Akses Publik Transaction Items" ON public.transaction_items;

CREATE POLICY "Akses Publik Products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Publik Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Publik Transaction Items" ON public.transaction_items FOR ALL USING (true) WITH CHECK (true);
