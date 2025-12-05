-- Script SQL para crear partidos de Octavos de Final con placeholders
-- Ejecutar con: psql -U postgres -d polla_db -f create-knockout-matches.sql
-- Verificar si ya existen partidos de octavos
DO $$
DECLARE existing_count INTEGER;
BEGIN
SELECT COUNT(*) INTO existing_count
FROM matches
WHERE phase = 'ROUND_16';
IF existing_count > 0 THEN RAISE NOTICE '⚠️  Found % existing ROUND_16 matches. Skipping seeding.',
existing_count;
ELSE RAISE NOTICE '🌱 Seeding knockout stage matches...';
-- Insertar partidos de Octavos de Final
INSERT INTO matches (
        "homeTeam",
        "awayTeam",
        "homeTeamPlaceholder",
        "awayTeamPlaceholder",
        phase,
        "bracketId",
        date,
        status,
        "homeScore",
        "awayScore"
    )
VALUES -- Día 1
    (
        '',
        '',
        '1A',
        '2B',
        'ROUND_16',
        1,
        '2026-07-01 16:00:00',
        'PENDING',
        NULL,
        NULL
    ),
    (
        '',
        '',
        '1C',
        '2D',
        'ROUND_16',
        2,
        '2026-07-01 20:00:00',
        'PENDING',
        NULL,
        NULL
    ),
    -- Día 2
    (
        '',
        '',
        '1E',
        '2F',
        'ROUND_16',
        3,
        '2026-07-02 16:00:00',
        'PENDING',
        NULL,
        NULL
    ),
    (
        '',
        '',
        '1G',
        '2H',
        'ROUND_16',
        4,
        '2026-07-02 20:00:00',
        'PENDING',
        NULL,
        NULL
    ),
    -- Día 3
    (
        '',
        '',
        '1B',
        '2A',
        'ROUND_16',
        5,
        '2026-07-03 16:00:00',
        'PENDING',
        NULL,
        NULL
    ),
    (
        '',
        '',
        '1D',
        '2C',
        'ROUND_16',
        6,
        '2026-07-03 20:00:00',
        'PENDING',
        NULL,
        NULL
    ),
    -- Día 4
    (
        '',
        '',
        '1F',
        '2E',
        'ROUND_16',
        7,
        '2026-07-04 16:00:00',
        'PENDING',
        NULL,
        NULL
    ),
    (
        '',
        '',
        '1H',
        '2G',
        'ROUND_16',
        8,
        '2026-07-04 20:00:00',
        'PENDING',
        NULL,
        NULL
    );
RAISE NOTICE '✅ Successfully seeded 8 knockout stage matches!';
END IF;
END $$;