# 🚀 Migración Exitosa a LaPollaVirtual.com

Este documento resume la configuración final y exitosa de la infraestructura tras la migración al dominio privado.

## 🏗️ Arquitectura Desplegada

*   **Frontend**: Next.js en Vercel (`apps/web`) -> `https://lapollavirtual.com`
*   **Backend API**: NestJS en Vercel (`apps/api`) -> Proyecto separado.
*   **Base de Datos**: PostgreSQL en Railway.

## 🔐 Configuración Crítica

### 1. Variables de Entorno (Frontend)
Estas variables aseguran que el frontend sepa con quién hablar.

| Variable | Valor | Nota |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `/api` | Utiliza el proxy interno de Next.js configurado en `next.config.ts`. |
| `SERVER_URL` | `[URL_DEL_PROYECTO_API_VERCEL]` | Dirección real del backend. Las peticiones a `/api` se redirigen aquí. |

### 2. Variables de Entorno (Backend)
Estas variables permiten la conexión a la BD y a Google.

| Variable | Valor | Nota |
| :--- | :--- | :--- |
| `DB_HOST` | `roundhouse.proxy.rlwy.net` (ejemplo) | **CRÍTICO:** Usar el TCP Proxy público de Railway, no el dominio interno. |
| `DB_PORT` | `[PUERTO_TCP_RAILWAY]` | Puerto de 5 dígitos (ej: 56629). |
| `DB_SSL` | `true` | Necesario para conectar desde Vercel. Code patch aplicado para soportarlo. |
| `FRONTEND_URL` | `https://lapollavirtual.com` | Para redirecciones tras OAuth. |
| `GOOGLE_CALLBACK_URL` | `https://lapollavirtual.com/api/auth/google/redirect` | Ruta exacta que coincide con NestJS y Google Console. |

### 3. Autenticación & Invitaciones
Se implementó un sistema robusto para manejar invitaciones (`/invite/[code]`) que sobrevive al flujo de OAuth:

*   **Persistencia:** Se usan **Cookies** (`pendingInviteCode`) en lugar de LocalStorage para soportar cambios de protocolo/dominio durante el login de Google.
*   **Red de Seguridad:** Si la redirección automática falla, el Dashboard muestra un **Banner Azul** para procesar la invitación manualmente.
*   **CORS:** El backend tiene `https://lapollavirtual.com` en su lista blanca explícita.

## ✅ Estado Final
*   Login con Google funcionando.
*   Conexión a Base de Datos estable.
*   Invitaciones Inteligentes funcionando incluso para usuarios nuevos.

---
*Generado automáticamente tras la sesión de soporte del 26/12/2025.*
