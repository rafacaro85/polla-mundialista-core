# Backend Environment Variables

## Required Variables

### Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=polla_db

### JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

### Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/redirect

### Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3001

## Production Example

### Railway/Production
FRONTEND_URL=https://your-app.vercel.app
GOOGLE_CALLBACK_URL=https://your-api.railway.app/api/auth/google/redirect

### Port (Railway sets this automatically)
PORT=3000
