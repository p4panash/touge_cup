# Phase 4: User Setup Required

**Generated:** 2026-02-03
**Phase:** 04-ui-user-experience
**Status:** Incomplete

## Environment Variables

### GOOGLE_MAPS_API_KEY

Required for Android map display. iOS uses Apple Maps (no key needed).

**Setup:**

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your API key to `.env.local`:
   ```
   GOOGLE_MAPS_API_KEY=AIza...your-key
   ```

**For EAS Builds (production):**
```bash
eas secret:create --name GOOGLE_MAPS_API_KEY --value "AIza..."
```

## Dashboard Configuration

### Google Maps SDK for Android

- [ ] **Create Google Cloud project and enable Maps SDK for Android**
  - Location: [Google Cloud Console](https://console.cloud.google.com/) -> APIs & Services -> Enable APIs
  - Search for "Maps SDK for Android" and enable it

- [ ] **Create API key**
  - Location: [Google Cloud Console](https://console.cloud.google.com/) -> APIs & Services -> Credentials
  - Click "Create Credentials" -> "API key"

- [ ] **Restrict the API key (recommended)**
  - Application restrictions: Android apps
  - Add package name: `com.papanash.watercupcoach`
  - API restrictions: Maps SDK for Android

- [ ] **Add key to .env.local**
  - See Environment Variables section above

## Verification

After completing the setup:

1. Rebuild the app (env vars are read at build time):
   ```bash
   npx expo run:android
   ```

2. Navigate to a drive summary screen
3. Verify the map displays with the route polyline

**Note:** iOS maps work immediately without configuration using Apple Maps.

---
**Once all items complete:** Mark status as "Complete"
