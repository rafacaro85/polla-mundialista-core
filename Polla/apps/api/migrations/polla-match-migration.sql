-- =============================================================================
-- POLLA MATCH: Migración de Base de Datos
-- Rama: cliente/polla-match
-- Fecha: 2026-04-15
-- Descripción: Agregar tipo de evento (BAR/ENTERPRISE) y tabla match_purchases
-- =============================================================================

-- 1. Agregar campo matchEventType a la tabla leagues
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS "match_event_type" VARCHAR DEFAULT 'BAR';

-- 2. Crear tabla de compras de partidos
CREATE TABLE IF NOT EXISTS match_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "leagueId" UUID NOT NULL,
  "matchId" VARCHAR,
  "packageId" VARCHAR,
  amount INTEGER NOT NULL DEFAULT 0,
  status VARCHAR DEFAULT 'PENDING',
  "voucherUrl" VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_match_purchases_league ON match_purchases("leagueId");
CREATE INDEX IF NOT EXISTS idx_match_purchases_status ON match_purchases(status);

-- Verificación:
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'leagues' AND column_name = 'match_event_type';
-- SELECT * FROM match_purchases LIMIT 5;
