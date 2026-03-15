-- seed_ucl2526_knockout.sql

-- NOTA: El modelo 'matches' no tiene una columna 'leg'. 
-- Para diferenciar la ida de la vuelta, usaremos la misma fase ('ROUND_16') 
-- y el orden natural de la fecha servirá para que el frontend las agrupe,
-- o bien utilizaremos la convención acordada en el sistema.

INSERT INTO "matches" (
  "id", "tournamentId", "homeTeam", "awayTeam", "date", 
  "status", "phase", "homeFlag", "awayFlag", "bracketId", "group"
) VALUES 

-- OCTAVOS DE FINAL (ROUND_16) - IDA (MARTES 10 MARZO 2026)
(gen_random_uuid(), 'UCL2526', 'Galatasaray', 'Liverpool', '2026-03-10 17:45:00', 'PENDING', 'ROUND_16', 'galatasaray', 'liverpool', 1, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Atalanta', 'Bayern München', '2026-03-10 20:00:00', 'PENDING', 'ROUND_16', 'atalanta', 'bayern_munchen', 2, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Newcastle', 'Barcelona', '2026-03-10 20:00:00', 'PENDING', 'ROUND_16', 'newcastle', 'barcelona', 3, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Atlético Madrid', 'Tottenham', '2026-03-10 20:00:00', 'PENDING', 'ROUND_16', 'atletico_madrid', 'tottenham', 4, 'LEG_1'),

-- OCTAVOS DE FINAL (ROUND_16) - IDA (MIÉRCOLES 11 MARZO 2026)
(gen_random_uuid(), 'UCL2526', 'Leverkusen', 'Arsenal', '2026-03-11 17:45:00', 'PENDING', 'ROUND_16', 'leverkusen', 'arsenal', 5, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'PSG', 'Chelsea', '2026-03-11 20:00:00', 'PENDING', 'ROUND_16', 'psg', 'chelsea', 6, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Real Madrid', 'Manchester City', '2026-03-11 20:00:00', 'PENDING', 'ROUND_16', 'real_madrid', 'manchester_city', 7, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Bodø/Glimt', 'Sporting CP', '2026-03-11 20:00:00', 'PENDING', 'ROUND_16', 'bodo_glimt', 'sporting_cp', 8, 'LEG_1'),

-- OCTAVOS DE FINAL (ROUND_16) - VUELTA (MARTES 17 MARZO 2026)
(gen_random_uuid(), 'UCL2526', 'Sporting CP', 'Bodø/Glimt', '2026-03-17 17:45:00', 'PENDING', 'ROUND_16', 'sporting_cp', 'bodo_glimt', 8, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Chelsea', 'PSG', '2026-03-17 20:00:00', 'PENDING', 'ROUND_16', 'chelsea', 'psg', 6, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Manchester City', 'Real Madrid', '2026-03-17 20:00:00', 'PENDING', 'ROUND_16', 'manchester_city', 'real_madrid', 7, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Arsenal', 'Leverkusen', '2026-03-17 20:00:00', 'PENDING', 'ROUND_16', 'arsenal', 'leverkusen', 5, 'LEG_2'),

-- OCTAVOS DE FINAL (ROUND_16) - VUELTA (MIÉRCOLES 18 MARZO 2026)
(gen_random_uuid(), 'UCL2526', 'Barcelona', 'Newcastle', '2026-03-18 17:45:00', 'PENDING', 'ROUND_16', 'barcelona', 'newcastle', 3, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Galatasaray', 'Liverpool', '2026-03-18 20:00:00', 'PENDING', 'ROUND_16', 'galatasaray', 'liverpool', 1, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Atalanta', 'Bayern München', '2026-03-18 20:00:00', 'PENDING', 'ROUND_16', 'atalanta', 'bayern_munchen', 2, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Tottenham', 'Atlético Madrid', '2026-03-18 20:00:00', 'PENDING', 'ROUND_16', 'tottenham', 'atletico_madrid', 4, 'LEG_2'),

-- CUARTOS DE FINAL (QUARTER_FINAL) - IDA Y VUELTA (TBD)
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-08 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 9, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-08 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 10, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-09 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 11, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-09 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 12, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-15 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 9, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-15 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 10, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-16 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 11, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-16 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 12, 'LEG_2'),

-- SEMIFINALES (SEMI_FINAL) - IDA Y VUELTA (TBD)
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-28 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 13, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-29 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 14, 'LEG_1'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-05-05 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 13, 'LEG_2'),
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-05-06 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 14, 'LEG_2'),

-- FINAL (FINAL) - PARTIDO ÚNICO
(gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-05-31 20:00:00', 'PENDING', 'FINAL', 'tbd', 'tbd', 15, 'SINGLE_LEG');
