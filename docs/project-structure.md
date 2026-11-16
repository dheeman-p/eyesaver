# Project structure

The repository is a single npm package that builds two targets from one `src/` tree.
This page walks through the top-level layout and each source folder.

## Directory tree

```text
eyesaver/
├── .github/
│   ├── agents/                     # Speckit agent definitions
│   ├── prompts/                    # Speckit prompt templates
│   ├── copilot-instructions.md     # Copilot guidance
│   └── workflows/
│       └── deploy.yml              # GitHub Pages deploy workflow (PWA)
├── .claude/
│   └── commands/
│       └── write_test.md           # Claude Code test-writing command
├── .specify/                       # Speckit workflow configuration and templates
├── .vscode/
│   └── settings.json               # Editor settings (Speckit tool approvals)
├── public/
│   └── icons/                      # PNG icons copied into both build outputs
│       ├── icon-16.png
│       ├── icon-48.png
│       ├── icon-128.png
│       ├── icon-192.png
│       └── icon-512.png
├── specs/
│   ├── 001-eye-exercise-reminder/  # Original extension feature spec + contracts
│   └── 002-pwa-background-notifications/ # PWA feature spec + contracts
├── src/
│   ├── background/
│   │   └── service-worker.ts       # Chrome MV3 alarm/notification lifecycle
│   ├── manifest.json               # Chrome MV3 manifest
│   ├── popup/
│   │   ├── App.vue                 # Extension popup root component
│   │   ├── main.ts                 # Extension bootstrap (Vue + Pinia + Vuetify)
│   │   ├── index.html              # Extension popup HTML entry
│   │   ├── components/
│   │   │   └── __tests__/
│   │   │       └── CountdownTimer.spec.ts   # The one automated spec
│   │   ├── composables/
│   │   │   └── useStorage.ts       # Reactive chrome.storage.local bridge
│   │   ├── stores/
│   │   │   ├── exerciseStore.ts    # Current exercise/index
│   │   │   ├── scheduleStore.ts    # Countdown/active-notification state
│   │   │   └── settingsStore.ts    # UserSettings with validation
│   │   └── styles/
│   │       ├── _variables.scss     # Popup SCSS tokens (mirrors shared tokens)
│   │       └── main.scss           # Popup global styles (380px body)
│   ├── pwa/
│   │   ├── App.vue                 # PWA root component (foreground logic + settings)
│   │   ├── main.ts                 # PWA bootstrap (Vue + Pinia + Vuetify)
│   │   ├── index.html              # PWA HTML entry
│   │   ├── env.d.ts                # vite-plugin-pwa + NotificationOptions types
│   │   ├── service-worker.ts       # PWA service worker (precache + background reminders)
│   │   ├── components/
│   │   │   ├── BackgroundSyncNotice.vue
│   │   │   └── NotificationPermissionBanner.vue
│   │   ├── composables/
│   │   │   └── useIDBStorage.ts    # IndexedDB helpers for the PWA window
│   │   ├── stores/
│   │   │   ├── scheduleStore.ts    # PWA schedule state
│   │   │   └── settingsStore.ts    # PWA settings state
│   │   └── styles/
│   │       └── main.scss           # PWA global styles
│   └── shared/
│       ├── components/
│       │   ├── CountdownTimer.vue  # Extension countdown (imports @popup store)
│       │   ├── ExerciseCard.vue    # Exercise display used by both targets
│       │   └── SettingsPanel.vue   # Extension settings form (imports @popup store)
│       ├── constants/
│       │   └── index.ts            # Alarm/notification IDs, storage keys, defaults, bounds
│       ├── exercises/
│       │   └── index.ts            # Static EXERCISES catalogue
│       ├── styles/
│       │   └── _variables.scss     # Shared SCSS design tokens
│       └── types/
│           └── index.ts            # Shared TypeScript interfaces
├── CLAUDE.md                       # Stale/incomplete guidance — see note below
├── README.md                       # End-user quick start
├── package.json                    # Scripts and dependencies
├── package-lock.json               # Lockfile
├── tsconfig.json                   # TypeScript config + path aliases
├── vite.config.ts                  # Extension Vite config
├── vite.config.pwa.ts              # PWA Vite config
├── vitest.config.ts                # Vitest config
└── .gitignore                      # Ignores node_modules, dist/, dist-pwa/, .env*
```

## Top-level items

### Build and project configuration

- **`package.json`** — all npm scripts and dependencies. The scripts are the canonical
  entry points: `dev`, `build`, `dev:pwa`, `build:pwa`, `preview:pwa`, `test`,
  `test:watch`.
- **`package-lock.json`** — exact dependency tree; used by `npm ci`.
- **`tsconfig.json`** — strict TypeScript configuration and the `@shared`, `@popup`,
  `@pwa` path aliases.
- **`vite.config.ts`** — extension build. Loads `src/manifest.json` and passes it to
  `vite-plugin-web-extension`; registers the Vue and Vuetify plugins; outputs `dist/`.
- **`vite.config.pwa.ts`** — PWA build. Sets `base: '/eyesaver/'`, uses
  `vite-plugin-pwa` with the `injectManifest` strategy, and roots the build at
  `src/pwa`; outputs `dist-pwa/`.
- **`vitest.config.ts`** — Vitest configuration (jsdom environment, Vue plugin,
  `@shared`/`@popup` aliases).
- **`.gitignore`** — ignores `node_modules/`, `dist/`, `dist-pwa/`, `build/`, `.env*`,
  logs, coverage, and Speckit/Claude scratch paths.

### Source code

- **`src/manifest.json`** — the Chrome Manifest V3 manifest: popup action, background
  service worker, permissions (`notifications`, `storage`, `alarms`), and icons.
- **`src/background/service-worker.ts`** — the extension service worker. Owns alarm
  scheduling, notification display, snooze/dismiss handling, and storage-change
  reactions.
- **`src/popup/`** — the extension popup application.
  - `App.vue` is the root; it composes `ExerciseCard`, `CountdownTimer`, and
    `SettingsPanel`.
  - `main.ts` bootstraps Vue, Pinia, and Vuetify (explicit component registration).
  - `composables/useStorage.ts` is the reactive `chrome.storage.local` bridge.
  - `stores/` holds the three Pinia stores.
  - `components/__tests__/` contains the single automated spec (no other popup
    components live here — shared UI components now live under `src/shared/components/`).
- **`src/pwa/`** — the Progressive Web App.
  - `App.vue` is the root; it implements the foreground timer, permission flow,
    notification handling, settings, and the update prompt.
  - `main.ts` bootstraps Vue, Pinia, and Vuetify.
  - `service-worker.ts` precaches assets and handles background wake-ups and
    notification clicks.
  - `composables/useIDBStorage.ts` provides IndexedDB helpers used by the PWA stores.
  - `stores/` holds the PWA Pinia stores.
- **`src/shared/`** — code shared by both targets.
  - `types/`, `constants/`, and `exercises/` are the shared data layer.
  - `components/` contains the three shared Vue components. Note the coupling caveat:
    `CountdownTimer.vue` and `SettingsPanel.vue` import popup stores through `@popup`,
    so only the extension popup uses them; the PWA uses only `ExerciseCard.vue`.
  - `styles/_variables.scss` is the shared SCSS token file (duplicated in
    `src/popup/styles/_variables.scss`).

### Assets and content

- **`public/icons/`** — five PNG icons. Both builds copy the whole `public/` directory
  into their output (the extension uses Vite's default `publicDir` and emits
  `dist/icons/`; the PWA sets `publicDir: '../../public'` and emits
  `dist-pwa/icons/`), so all five PNGs end up in both outputs. The extension manifest
  *references* `icon-16/48/128.png`, while the PWA manifest *references*
  `icon-192/512.png`.
- **`specs/`** — the original feature specifications, data models, contracts, plans,
  tasks, and quickstarts for the extension (`001-`) and the PWA (`002-`). Useful for
  understanding the original intent, but some file maps are outdated.
- **`.claude/`** — Claude Code configuration; contains a single tracked command
  (`commands/write_test.md`) describing test-writing conventions.
- **`.specify/`** and **`.github/agents|prompts/`** — Speckit tooling configuration and
  templates used for feature planning; not part of the runtime application.
- **`.github/workflows/deploy.yml`** — GitHub Actions workflow that builds the PWA and
  deploys `dist-pwa/` to GitHub Pages.
- **`.vscode/settings.json`** — editor settings (Speckit terminal approvals).

## Build outputs

- `dist/` — extension build output (gitignored).
- `dist-pwa/` — PWA build output (gitignored).

## Important note about stale file maps

`CLAUDE.md` and the quickstarts in `specs/001-eye-exercise-reminder/quickstart.md` and
`specs/002-pwa-background-notifications/quickstart.md` were written against an earlier
layout. They list `ExerciseCard.vue`, `SettingsPanel.vue`, and `CountdownTimer.vue`
under `src/popup/components/`, and claim there are no tests. The current source is
authoritative: those components live in `src/shared/components/`, and there is one
Vitest spec in `src/popup/components/__tests__/CountdownTimer.spec.ts`.
