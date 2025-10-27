-- ========================================
-- DODANIE POLA TYPE DO PARKING_LOTS
-- ========================================
-- Dodaje pole 'type' do określenia typu parkingu:
-- - covered (zadaszony)
-- - outdoor (odkryty)
-- - ev_charging (z ładowarką EV)

-- 1. Dodaj kolumnę type do parking_lots
ALTER TABLE parking_lots
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'outdoor';

-- 1b. Dodaj constraint dla type
ALTER TABLE parking_lots
DROP CONSTRAINT IF EXISTS parking_lots_type_check;

ALTER TABLE parking_lots
ADD CONSTRAINT parking_lots_type_check
CHECK (type IN ('covered', 'outdoor', 'ev_charging'));

-- 2. Ustaw domyślną wartość dla istniejących parkingów
UPDATE parking_lots
SET type = 'outdoor'
WHERE type IS NULL;

-- 3. Dodaj indeks dla szybszego filtrowania
CREATE INDEX IF NOT EXISTS idx_parking_lots_type ON parking_lots(type);

-- ========================================
-- WERYFIKACJA
-- ========================================

SELECT '✅ Kolumna type została dodana do parking_lots!' AS status;

-- Pokaż strukturę kolumny
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'parking_lots'
AND column_name = 'type';

-- Pokaż rozkład typów parkingów
SELECT
  type,
  COUNT(*) as count
FROM parking_lots
GROUP BY type
ORDER BY count DESC;
