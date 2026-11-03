# To-Do List

A small to-do app with no build step and no dependencies. Plain HTML, CSS and JavaScript, saved in the
browser's `localStorage`, and installable on a phone as an offline app (PWA).

## Run it on your computer

- Double-click `index.html`, **or**
- Double-click `start.cmd` (opens `http://localhost:3000`)

## Run it on your phone

1. Connect the phone and the computer to the **same Wi-Fi**.
2. On the computer, double-click `start.cmd` (or run `node server.js`).
3. The terminal prints a "Phone / tablet" address, e.g. `http://192.168.1.42:3000`. Type that into the
   phone's browser.
4. If Windows asks about the firewall, allow Node.js on **private networks**.

Use `Ctrl+C` in the terminal to stop the server.

## Add it to the home screen

**Android (Chrome):** open the address, tap the ⋮ menu → **Add to Home screen** / **Install app**.
Full install + offline mode needs HTTPS (see below); over plain HTTP Chrome may only offer a shortcut.

**iPhone (Safari):** open the address, tap **Share** → **Add to Home Screen**.

For a real install with offline support, serve the folder over HTTPS. Any of these work:

```powershell
# Option A: temporary public HTTPS URL
npx cloudflared tunnel --url http://localhost:3000

# Option B: host the folder on a static host (Netlify, Vercel, GitHub Pages, ...)
```

Then open the HTTPS URL on the phone and install from there. Browsers only allow service workers
(offline mode) on `https://` or `localhost`, not on a plain `http://192.168.x.x` address.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Markup and mobile meta tags |
| `style.css` | Styling, light/dark theme, phone layout |
| `app.js` | Task logic, storage, service-worker registration |
| `manifest.webmanifest` | App name, icons, standalone display mode |
| `sw.js` | Offline cache of the app shell |
| `server.js` | Zero-dependency static server for phone testing |
| `start.cmd` | Double-click launcher (Windows) |
| `icons/` | Generated PNG app icons |
| `scripts/make-icons.ps1` | Regenerates the icons |

## Notes

- Tasks are stored **per device and per browser**; there is no account or sync.
- To wipe the data, clear the site data in the browser (or run `localStorage.clear()` in the console).
- When you change `style.css`, `app.js` or `index.html`, bump `CACHE_VERSION` in `sw.js` so installed
  copies refresh their cache.
- If you later want a real `.apk`/`.ipa` from the same files, [Capacitor](https://capacitorjs.com/) can
  wrap this folder with no code changes to the app itself.
