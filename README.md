# EyeSaver

Eye exercise reminder app available as a **Chrome Extension** and a **Progressive Web App (PWA)**.

## Quick Start

```bash
npm install
```

## Chrome Extension

```bash
npm run build
```

Load the `dist/` folder as an unpacked extension in Chrome:
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `dist/` folder

## PWA (Progressive Web App)

### Development

```bash
npm run dev:pwa
```

Opens at `http://localhost:5173`. Hot-reload enabled for UI changes.

### Production Build & Preview

```bash
npm run build:pwa
npm run preview:pwa
```

Opens at `http://localhost:4173`.

### Install the PWA

1. Run `npm run build:pwa && npm run preview:pwa`
2. Open `http://localhost:4173` in **Chrome** or **Edge**
3. Click the install icon (⊕) in the address bar, or look for the "Install app" prompt
4. Click **Install**
5. The app opens in a standalone window (no address bar)

> **Note:** For production deployment, serve `dist-pwa/` over HTTPS. Chrome/Edge allow localhost without HTTPS for development.

### Deploy

The `dist-pwa/` folder is a static site. Deploy to any HTTPS host:

```bash
# GitHub Pages
npm run build:pwa
# push dist-pwa/ to gh-pages branch

# Netlify
netlify deploy --dir=dist-pwa --prod

# Vercel
vercel dist-pwa --prod
```

### Features

- **Offline support** — works without internet after first visit
- **Background notifications** — reminds you even with the browser closed (Chrome/Edge desktop)
- **Install as app** — runs in its own window, appears in your taskbar/dock
- **No account needed** — all data stored locally in IndexedDB

### Browser Support

| Browser | Background Notifications | Foreground Only |
|---------|:------------------------:|:---------------:|
| Chrome 80+ | ✅ | ✅ |
| Edge 80+ | ✅ | ✅ |
| Firefox 63+ | ❌ | ✅ |
| Safari 16.4+ | ❌ | ✅ |

Browsers without Periodic Background Sync show an info notice and require keeping a tab open.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (extension popup) |
| `npm run build` | Build Chrome extension → `dist/` |
| `npm run dev:pwa` | Vite dev server (PWA) |
| `npm run build:pwa` | Build PWA → `dist-pwa/` |
| `npm run preview:pwa` | Preview PWA production build |
| `npm test` | Run unit tests |
