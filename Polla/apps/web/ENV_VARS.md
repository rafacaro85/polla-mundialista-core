# Frontend Environment Variables

## Required Variables

### API Configuration
**Variable:** `NEXT_PUBLIC_API_URL`  
**Description:** URL base del backend API  
**Local:** `http://localhost:3000/api`  
**Production:** `https://polla-mundialista-2026-production.up.railway.app/api`

## Setup Instructions

1. Create a `.env.local` file in `apps/web/`
2. Add the required variables
3. For production (Vercel), set these in the Vercel dashboard under Settings → Environment Variables

## Example `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Production Configuration (Vercel)

```env
NEXT_PUBLIC_API_URL=https://polla-mundialista-2026-production.up.railway.app/api
```
