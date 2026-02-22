-- Migración: Agregar columnas brand_color_heading y brand_color_bars a la tabla leagues
-- Fecha: 2026-02-21
-- Usar IF NOT EXISTS para poder re-ejecutar sin errores

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS brand_color_heading VARCHAR(255) NOT NULL DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS brand_color_bars VARCHAR(255) NOT NULL DEFAULT '#00E676';
