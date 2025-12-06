# 🔧 Variables de Entorno - Backend (Railway)

## ⚠️ CRÍTICAS - Sin estas la app NO funcionará

### Google OAuth (OBLIGATORIO)
```env
GOOGLE_CLIENT_ID=tu-google-client-id-aqui
GOOGLE_SECRET=tu-google-client-secret-aqui
GOOGLE_CALLBACK_URL=https://tu-backend.railway.app/api/auth/google/redirect
```

### Frontend URL (OBLIGATORIO)
```env
FRONTEND_URL=https://tu-app.vercel.app
```

### Database (OBLIGATORIO)
```env
DB_HOST=tu-db-host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu-password
DB_DATABASE=polla_db
```

### JWT (OBLIGATORIO)
```env
JWT_SECRET=un-secreto-super-seguro-cambialo-en-produccion
```

## 📝 Ejemplo completo para Railway

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_CALLBACK_URL=https://polla-mundialista-core-production.up.railway.app/api/auth/google/redirect

# Frontend
FRONTEND_URL=https://polla-mundialista-core-4hjkbuatz-rafaels-projects-10ecd374.vercel.app

# Database (Railway PostgreSQL)
DB_HOST=postgres.railway.internal
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu-password-de-railway
DB_DATABASE=railway

# JWT
JWT_SECRET=change-this-to-a-random-secret-in-production

# Port (Railway lo configura automáticamente)
PORT=3000
```

## 🚀 Cómo configurar en Railway

1. Ve a tu proyecto en Railway
2. Click en tu servicio de API
3. Variables tab
4. Add Variable
5. Pega cada variable con su valor
6. Deploy

## ✅ Verificación

Después de configurar, verifica en los logs de Railway que veas:
```
✅ Global prefix configured: /api
🚀 Server running on port: [PUERTO]
```
