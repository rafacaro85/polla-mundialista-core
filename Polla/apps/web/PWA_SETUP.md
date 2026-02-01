# PWA Implementation Guide

## ✅ Completed Setup

### 1. Dependencies Installed
- `@ducanh2912/next-pwa` - Modern PWA plugin for Next.js App Router

### 2. Files Created/Modified

#### `public/manifest.json`
- App name: "Polla Mundialista 2026"
- Theme colors: #00E676 (primary), #0F172A (background)
- Display mode: standalone (hides browser UI)
- Icons: 192x192 and 512x512 PNG files

#### `next.config.ts`
- Wrapped with PWA plugin
- **Disabled in development** to prevent caching issues
- Service worker auto-registration enabled
- Offline fallback configured

#### `src/app/layout.tsx`
- Added PWA meta tags
- Manifest link
- Apple Web App settings
- Theme color configuration

#### `src/app/offline/page.tsx`
- Custom offline fallback page
- Branded styling with retry button

#### `public/icon-192x192.png` & `public/icon-512x512.png`
- Generated PWA icons with World Cup trophy design

---

## 🚀 Testing the PWA

### Development
```bash
npm run dev
```
**Note:** PWA features are disabled in development to prevent caching issues.

### Production Build
```bash
npm run build
npm start
```

### Testing Installation
1. Open the app in Chrome/Edge on desktop or mobile
2. Look for the install prompt in the address bar
3. Click "Install" to add to home screen
4. The app will open in standalone mode (no browser UI)

### Testing Offline Mode
1. Install the PWA
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Navigate to any page - you should see the offline fallback

---

## 📱 Mobile Testing

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (⋮) → "Add to Home screen"
3. The app icon will appear on your home screen

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will install with the configured icon

---

## 🔧 Customization

### Changing App Colors
Edit `public/manifest.json`:
```json
{
  "theme_color": "#00E676",
  "background_color": "#0F172A"
}
```

### Updating Icons
Replace the following files in `public/`:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

**Icon Requirements:**
- Square format (1:1 aspect ratio)
- PNG format
- Transparent or solid background
- Simple, recognizable design

### Modifying Offline Page
Edit `src/app/offline/page.tsx` to customize the offline experience.

---

## 📦 Generated Files (Auto-Generated, Don't Edit)

The following files are automatically generated during build:
- `public/sw.js` - Service Worker
- `public/workbox-*.js` - Workbox runtime files
- `public/sw.js.map` - Source map

These are excluded from Git via `.gitignore`.

---

## 🎯 Next Steps

1. **Test on Real Devices**: Install on Android/iOS to verify behavior
2. **Custom Icons**: Replace placeholder icons with your final logo
3. **Splash Screens**: Add iOS splash screens for better UX
4. **Push Notifications**: Implement if needed for engagement
5. **Analytics**: Track PWA install events

---

## 🐛 Troubleshooting

### PWA Not Installing
- Ensure you're using HTTPS (required for PWA)
- Check that `manifest.json` is accessible at `/manifest.json`
- Verify icons exist at specified paths

### Service Worker Not Updating
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Clear site data in DevTools → Application → Storage
- Unregister old service workers in DevTools → Application → Service Workers

### Offline Mode Not Working
- Check that `skipWaiting: true` is set in `next.config.ts`
- Verify offline page exists at `/offline`
- Test in production build (not dev mode)
