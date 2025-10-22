-- ========================================
-- SYSTEM ELASTYCZNYCH TARYF CENOWYCH
-- ========================================
-- Dodaje różne ceny: godzina, dzień, tydzień, miesiąc

-- 1. Dodaj nowe kolumny do parking_lots
ALTER TABLE parking_lots
ADD COLUMN IF NOT EXISTS price_per_day DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_per_week DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_per_month DECIMAL(10, 2);

-- 2. Ustaw domyślne wartości dla istniejących parkingów
-- (jeśli mają tylko price_per_hour)
UPDATE parking_lots
SET
  price_per_day = price_per_hour * 20,      -- 20h za dzień (taniej niż 24h)
  price_per_week = price_per_hour * 120,    -- ~17h za dzień przez 7 dni
  price_per_month = price_per_hour * 480    -- ~16h za dzień przez 30 dni
WHERE price_per_day IS NULL;

-- 3. Dodaj kolumnę taryfy do rezerwacji (opcjonalnie)
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'hourly'
CHECK (pricing_type IN ('hourly', 'daily', 'weekly', 'monthly'));

-- ========================================
-- FUNKCJA POMOCNICZA DO KALKULACJI CENY
-- ========================================

CREATE OR REPLACE FUNCTION calculate_parking_price(
  p_lot_id BIGINT,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS TABLE(
  best_price DECIMAL(10, 2),
  pricing_type VARCHAR(20),
  duration_hours DECIMAL(10, 2)
) AS $$
DECLARE
  v_hours DECIMAL(10, 2);
  v_days DECIMAL(10, 2);
  v_price_hour DECIMAL(10, 2);
  v_price_day DECIMAL(10, 2);
  v_price_week DECIMAL(10, 2);
  v_price_month DECIMAL(10, 2);
  v_hourly_price DECIMAL(10, 2);
  v_daily_price DECIMAL(10, 2);
  v_weekly_price DECIMAL(10, 2);
  v_monthly_price DECIMAL(10, 2);
  v_best_price DECIMAL(10, 2);
  v_best_type VARCHAR(20);
BEGIN
  -- Oblicz czas trwania
  v_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
  v_days := v_hours / 24;

  -- Pobierz ceny z tabeli
  SELECT price_per_hour, price_per_day, price_per_week, price_per_month
  INTO v_price_hour, v_price_day, v_price_week, v_price_month
  FROM parking_lots
  WHERE id = p_lot_id;

  -- Oblicz cenę dla każdej taryfy
  v_hourly_price := v_hours * v_price_hour;
  v_daily_price := CEIL(v_days) * COALESCE(v_price_day, v_hours * v_price_hour);
  v_weekly_price := CEIL(v_days / 7) * COALESCE(v_price_week, v_hourly_price);
  v_monthly_price := CEIL(v_days / 30) * COALESCE(v_price_month, v_hourly_price);

  -- Wybierz najtańszą opcję
  v_best_price := v_hourly_price;
  v_best_type := 'hourly';

  IF v_days >= 1 AND v_daily_price < v_best_price THEN
    v_best_price := v_daily_price;
    v_best_type := 'daily';
  END IF;

  IF v_days >= 7 AND v_weekly_price < v_best_price THEN
    v_best_price := v_weekly_price;
    v_best_type := 'weekly';
  END IF;

  IF v_days >= 30 AND v_monthly_price < v_best_price THEN
    v_best_price := v_monthly_price;
    v_best_type := 'monthly';
  END IF;

  RETURN QUERY SELECT v_best_price, v_best_type, v_hours;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- WERYFIKACJA
-- ========================================

SELECT '✅ System elastycznych taryf został dodany!' AS status;

-- Pokaż strukturę parking_lots
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'parking_lots'
AND column_name LIKE 'price%'
ORDER BY column_name;

-- Pokaż przykładowe ceny
SELECT
  id,
  name,
  price_per_hour,
  price_per_day,
  price_per_week,
  price_per_month
FROM parking_lots
LIMIT 5;
