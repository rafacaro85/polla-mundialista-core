-- ============================================
-- PROTOCOLO FÉNIX: Limpieza Total de Usuarios
-- ============================================
-- ADVERTENCIA: Este script eliminará TODOS los usuarios
-- de la base de datos. Úsalo solo si quieres empezar de cero.
-- Paso 1: Eliminar todas las predicciones (dependen de usuarios)
DELETE FROM predictions;
-- Paso 2: Eliminar todos los participantes de ligas
DELETE FROM league_participants;
-- Paso 3: Eliminar todas las ligas (si fueron creadas por usuarios)
DELETE FROM leagues;
-- Paso 4: Eliminar todos los códigos de acceso
DELETE FROM access_codes;
-- Paso 5: Eliminar TODOS los usuarios
DELETE FROM users;
-- Verificación: Contar usuarios restantes (debe ser 0)
SELECT COUNT(*) as usuarios_restantes
FROM users;
-- ============================================
-- RESULTADO ESPERADO: 0 usuarios
-- ============================================