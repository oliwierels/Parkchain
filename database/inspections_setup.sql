-- ========================================
-- CROWDSCAN INSPECTION SYSTEM - Database Setup
-- ========================================

-- 1. Tabela zgłoszeń inspekcji
CREATE TABLE IF NOT EXISTS inspections (
  id BIGSERIAL PRIMARY KEY,
  lot_id BIGINT NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_occupancy INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'confirmed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_occupancy CHECK (reported_occupancy >= 0)
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_lot_id ON inspections(lot_id);
CREATE INDEX IF NOT EXISTS idx_inspections_reporter_id ON inspections(reporter_id);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at DESC);

-- 2. Tabela nagród
CREATE TABLE IF NOT EXISTS rewards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inspection_id BIGINT REFERENCES inspections(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'points', 'bonus')),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PLN',
  status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);

-- 3. Tabela reputacji użytkowników
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  reports_total INTEGER NOT NULL DEFAULT 0,
  reports_confirmed INTEGER NOT NULL DEFAULT 0,
  reports_rejected INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_reports CHECK (
    reports_total = reports_confirmed + reports_rejected
  )
);

-- Indeks dla wydajności
CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation(score DESC);

-- ========================================
-- FUNKCJE I TRIGGERY
-- ========================================

-- Funkcja do automatycznej aktualizacji reputacji
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  -- Jeśli status zmienił się na confirmed lub rejected
  IF NEW.status IN ('confirmed', 'rejected') AND
     (OLD.status IS NULL OR OLD.status = 'queued') THEN

    -- Upsert reputacji użytkownika
    INSERT INTO user_reputation (user_id, score, reports_total, reports_confirmed, reports_rejected, updated_at)
    VALUES (
      NEW.reporter_id,
      CASE WHEN NEW.status = 'confirmed' THEN 10 ELSE -5 END, -- +10 za confirmed, -5 za rejected
      1,
      CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      score = user_reputation.score + CASE WHEN NEW.status = 'confirmed' THEN 10 ELSE -5 END,
      reports_total = user_reputation.reports_total + 1,
      reports_confirmed = user_reputation.reports_confirmed + CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      reports_rejected = user_reputation.reports_rejected + CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger do automatycznej aktualizacji reputacji
DROP TRIGGER IF EXISTS trigger_update_user_reputation ON inspections;
CREATE TRIGGER trigger_update_user_reputation
AFTER INSERT OR UPDATE ON inspections
FOR EACH ROW
EXECUTE FUNCTION update_user_reputation();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Włącz RLS dla tabel
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;

-- Polityki dla inspections
DROP POLICY IF EXISTS "Użytkownicy mogą tworzyć inspekcje" ON inspections;
CREATE POLICY "Użytkownicy mogą tworzyć inspekcje"
ON inspections FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Użytkownicy widzą swoje inspekcje" ON inspections;
CREATE POLICY "Użytkownicy widzą swoje inspekcje"
ON inspections FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Inspektorzy widzą wszystkie inspekcje" ON inspections;
CREATE POLICY "Inspektorzy widzą wszystkie inspekcje"
ON inspections FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'inspector'
  )
);

DROP POLICY IF EXISTS "Inspektorzy mogą aktualizować inspekcje" ON inspections;
CREATE POLICY "Inspektorzy mogą aktualizować inspekcje"
ON inspections FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'inspector'
  )
);

-- Polityki dla rewards
DROP POLICY IF EXISTS "Użytkownicy widzą swoje nagrody" ON rewards;
CREATE POLICY "Użytkownicy widzą swoje nagrody"
ON rewards FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Polityki dla user_reputation
DROP POLICY IF EXISTS "Użytkownicy widzą swoją reputację" ON user_reputation;
CREATE POLICY "Użytkownicy widzą swoją reputację"
ON user_reputation FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Wszyscy widzą reputację" ON user_reputation;
CREATE POLICY "Wszyscy widzą reputację"
ON user_reputation FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- DANE TESTOWE (opcjonalnie)
-- ========================================

-- Dodaj przykładową reputację dla istniejących użytkowników
-- INSERT INTO user_reputation (user_id, score, reports_total, reports_confirmed, reports_rejected)
-- SELECT id, 0, 0, 0, 0 FROM users
-- ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- KONIEC SKRYPTU
-- ========================================

-- Wyświetl utworzone tabele
SELECT 'Tabele utworzone pomyślnie!' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('inspections', 'rewards', 'user_reputation');
