# Phase 4: User Setup Required

**Generated:** 2026-02-03
**Phase:** 04-ui-user-experience
**Status:** Incomplete

## Environment Variables

No environment variables required for this phase.

## Dashboard Configuration

### Google Maps SDK for Android

Map display on Android requires a Google Maps API key. iOS uses Apple Maps by default (no API key needed).

**Steps:**

- [ ] **Create Google Cloud project and enable Maps SDK for Android**
  - Location: [Google Cloud Console](https://console.cloud.google.com/) -> APIs & Services -> Enable APIs
  - Search for "Maps SDK for Android" and enable it

- [ ] **Create API key**
  - Location: [Google Cloud Console](https://console.cloud.google.com/) -> APIs & Services -> Credentials
  - Click "Create Credentials" -> "API key"
  - Recommended: Restrict key to Android apps and Maps SDK for Android

- [ ] **Add API key to app.json**
  - Open `app.json` in project root
  - Add the following configuration:
  ```json
  {
    "expo": {
      "android": {
        "config": {
          "googleMaps": {
            "apiKey": "YOUR_API_KEY_HERE"
          }
        }
      }
    }
  }
  ```

## Verification

After completing the setup:

1. Run the app on an Android device or emulator:
   ```bash
   npx expo run:android
   ```

2. Navigate to a drive summary screen
3. Verify the map displays with the route polyline

**Note:** iOS maps work immediately without configuration using Apple Maps.

---
**Once all items complete:** Mark status as "Complete"
