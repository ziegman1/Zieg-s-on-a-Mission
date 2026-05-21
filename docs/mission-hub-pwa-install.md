# Mission Hub PWA — install & service worker

Mission Hub is installable as a scoped PWA under `/community`. This doc covers testing the install hint, service worker, and clearing test state.

## Manifest & icons

- Manifest: `/mission-hub/manifest.webmanifest`
- Icons: `/mission-hub/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`
- Constants: `src/lib/community/mission-hub-pwa.ts`

## Service worker

- Script: `/community/sw.js` (file: `public/community/sw.js`)
- Registration scope: `/community/` (only registered on `/community/*` pages)
- Cache name: `mission-hub-static-v1`

### What is cached

Precache on install (GET only):

- `/mission-hub/manifest.webmanifest`
- `/mission-hub/apple-touch-icon.png`
- `/mission-hub/icon-192.png`
- `/mission-hub/icon-512.png`

### What is never cached

- Any non-GET request (POST uploads, server actions, etc.)
- `/api/*` routes
- HTML/RSC navigations, feed data, member/profile responses
- Anything outside the precache list (fetch handler only intercepts precache paths)

## Install hint banner

Component: `src/components/community/community-install-hint.tsx`

Shown when **all** of the following are true:

- User is on a `/community` route (not login/join)
- Signed in as a **member** or **owner**
- Not already in standalone / installed PWA mode
- Not dismissed (`localStorage` key below)
- **Mobile** (viewport ≤ 767px), **or** browser fired `beforeinstallprompt` (Chrome install)

Platform copy:

- **iOS:** “Tap Share, then Add to Home Screen.”
- **Android:** “Tap Install app or Add to Home screen.”
- **Desktop:** hidden unless `beforeinstallprompt` is available (then shows **Install** button)

Dismissal is stored in:

```text
localStorage["mission-hub-install-hint-dismissed"] = "1"
```

## Test on iPhone (Safari)

1. Deploy or use HTTPS (or `localhost` on Mac for limited testing).
2. Sign in to Mission Hub at `/community` as a member or owner.
3. Confirm the install hint appears below the top bar (unless dismissed or already installed).
4. **Add to Home Screen:** Share → **Add to Home Screen**.
5. Launch from the home screen icon — should open standalone at `/community` with Mission Hub chrome (no main site header).
6. Re-open Safari to `/community` — hint should **not** show in standalone mode.

### Verify service worker (optional)

Safari → Develop → your device → inspect page → Storage / Service Workers (availability varies by iOS version). Registration is best-effort on iOS; install still works without SW.

## Test on Android (Chrome)

1. Sign in at `/community` on a phone or emulator.
2. If eligible, tap **Install** on the hint (when `beforeinstallprompt` fires), or use menu → **Install app** / **Add to Home screen**.
3. Open the installed app — standalone display, theme color in task switcher.
4. Chrome DevTools (remote debugging): **Application → Manifest** and **Service Workers** — confirm `/community/sw.js` is active with scope `/community/`.

## Test on desktop

- Install hint is **hidden** unless Chrome fires `beforeinstallprompt` (then you get the **Install** button).
- Manual install: address bar install icon or browser menu, when offered.

## Clear dismissal / localStorage during testing

In the browser console on `/community`:

```javascript
localStorage.removeItem("mission-hub-install-hint-dismissed");
location.reload();
```

Or Application → Local Storage → your origin → delete `mission-hub-install-hint-dismissed`.

To unregister the service worker (reset SW cache):

1. DevTools → **Application → Service Workers** → **Unregister**
2. **Application → Cache Storage** → delete `mission-hub-static-v1`
3. Hard reload

## Local development notes

- `next dev` serves `public/community/sw.js` at `/community/sw.js`.
- Service workers require a secure context (`https://` or `http://localhost`).
- After changing `sw.js`, bump `CACHE_NAME` in the file and reload twice (or unregister) to pick up changes.
