-- =============================================================================
-- UCL 2025-26 Knockout: Cuartos de Final, Semifinales y Final
-- Compatible con MySQL (UUID() function)
-- 
-- LÓGICA DE PLACEHOLDERS:
--   Los partidos de ROUND_16 tienen bracketIds 1-8 (LEG_1) y 1-8 (LEG_2).
--   Los ganadores de cada llave van a Cuartos:
--     Llave 1 (bracketId=1) → Cuartos bracketId=9, Home slot
--     Llave 2 (bracketId=2) → Cuartos bracketId=9, Away slot
--     Llave 3 (bracketId=3) → Cuartos bracketId=10, Home slot
--     etc.
--   El sistema busca el nextMatch por placeholder 'Ganador {bracketId}'.
-- =============================================================================

-- PRIMERO: Limpiar partidos de estas fases si ya existían (evitar duplicados)
DELETE FROM `matches`
WHERE `tournamentId` = 'UCL2526'
  AND `phase` IN ('QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');

-- =============================================================================
-- CUARTOS DE FINAL (QUARTER_FINAL)
-- 4 llaves × 2 partidos (ida + vuelta)
-- Brackets: 9, 10, 11, 12
-- Cruces: G1 vs G2, G3 vs G4, G5 vs G6, G7 vs G8
-- =============================================================================

-- Cuartos bracketId=9: Ganador 1 vs Ganador 2
INSERT INTO `matches` (`id`, `tournamentId`, `homeTeam`, `awayTeam`, `homeTeamPlaceholder`, `awayTeamPlaceholder`, `date`, `status`, `phase`, `homeFlag`, `awayFlag`, `bracketId`, `group`)
VALUES
  (UUID(), 'UCL2526', '', '', 'Ganador 1', 'Ganador 2', '2026-04-08 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 9, 'LEG_1'),
  (UUID(), 'UCL2526', '', '', 'Ganador 2', 'Ganador 1', '2026-04-15 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 9, 'LEG_2');

-- Cuartos bracketId=10: Ganador 3 vs Ganador 4
INSERT INTO `matches` (`id`, `tournamentId`, `homeTeam`, `awayTeam`, `homeTeamPlaceholder`, `awayTeamPlaceholder`, `date`, `status`, `phase`, `homeFlag`, `awayFlag`, `bracketId`, `group`)
VALUES
  (UUID(), 'UCL2526', '', '', 'Ganador 3', 'Ganador 4', '2026-04-08 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 10, 'LEG_1'),
  (UUID(), 'UCL2526', '', '', 'Ganador 4', 'Ganador 3', '2026-04-15 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 10, 'LEG_2');

-- Cuartos bracketId=11: Ganador 5 vs Ganador 6
INSERT INTO `matches` (`id`, `tournamentId`, `homeTeam`, `awayTeam`, `homeTeamPlaceholder`, `awayTeamPlaceholder`, `date`, `status`, `phase`, `homeFlag`, `awayFlag`, `bracketId`, `group`)
VALUES
  (UUID(), 'UCL2526', '', '', 'Ganador 5', 'Ganador 6', '2026-04-09 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 11, 'LEG_1'),
  (UUID(), 'UCL2526', '', '', 'Ganador 6', 'Ganador 5', '2026-04-16 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 11, 'LEG_2');

-- Cuartos bracketId=12: Ganador 7 vs Ganador 8
INSERT INTO `matches` (`id`, `tournamentId`, `homeTeam`, `awayTeam`, `homeTeamPlaceholder`, `awayTeamPlaceholder`, `date`, `status`, `phase`, `homeFlag`, `awayFlag`, `bracketId`, `group`)
VALUES
  (UUID(), 'UCL2526', '', '', 'Ganador 7', 'Ganador 8', '2026-04-09 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 12, 'LEG_1'),
  (UUID(), 'UCL2526', '', '', 'Ganador 8', 'Ganador 7', '2026-04-16 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 12, 'LEG_2');

-- =============================================================================
-- SEMIFINALES (SEMI_FINAL)
-- 2 llaves × 2 partidos (ida + vuelta)
-- Brackets: 13, 14
-- Cruces: Ganador9 vs Ganador10, Ganador11 vs Ganador12
-- =============================================================================

-- Semis bracketId=13: Ganador 9 vs Ganador 10
INSERT INTO `matches` (`id`, `tournamentId`, `homeTeam`, `awayTeam`, `homeTeamPlaceholder`, `awayTeamPlaceholder`, `date`, `status`, `phase`, `homeFlag`, `awayFlag`, `bracketId`, `group`)
VALUES
  (UUID(), 'UCL2526', '', '', 'Ganador 9', 'Ganador 10', '2026-04-28 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 13, 'LEG_1'),
  (UUID(), 'UCL2526', '', '', 'Ganador 10', 'Ganador 9',  '2026-05-05 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 13, 'LEG_2');

-- Semis bracketId=14: Ganador 11 vs Ganador 12
INSERT INTO `matches` (`id`, `tournamentId`, `homeTeam`, `awayTeam`, `homeTeamPlaceholder`, `awayTeamPlaceholder`, `date`, `status`, `phase`, `homeFlag`, `awayFlag`, `bracketId`, `group`)
VALUES
  (UUID(), 'UCL2526', '', '', 'Ganador 11', 'Ganador 12', '2026-04-29 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 14, 'LEG_1'),
  (UUID(), 'UCL2526', '', '', 'Ganador 12', 'Ganador 11', '2026-05-06 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 14, 'LEG_2');

-- =============================================================================
-- FINAL
-- 1 partido único
-- bracketId=15
-- =============================================================================
INSERT INTO `matches` (`id`, `tournamentId`, `homeTeam`, `awayTeam`, `homeTeamPlaceholder`, `awayTeamPlaceholder`, `date`, `status`, `phase`, `homeFlag`, `awayFlag`, `bracketId`, `group`)
VALUES
  (UUID(), 'UCL2526', '', '', 'Ganador 13', 'Ganador 14', '2026-05-31 20:00:00', 'PENDING', 'FINAL', 'tbd', 'tbd', 15, 'SINGLE_LEG');

-- =============================================================================
-- VERIFICACION: Lanzar estos SELECTs para confirmar la inserción
-- SELECT bracketId, phase, `group`, homeTeamPlaceholder, awayTeamPlaceholder, homeTeam, awayTeam, status
-- FROM matches
-- WHERE tournamentId = 'UCL2526'
-- ORDER BY phase, bracketId, `group`;
-- =============================================================================
