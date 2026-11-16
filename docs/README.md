# EyeSaver Developer Documentation

EyeSaver is an eye-exercise reminder application for screen-heavy users. It prompts users
to take short, guided eye breaks on a configurable interval, supports snoozing and
dismissing reminders, and rotates through a bundled catalogue of six exercises.

The application ships as **two independently runnable targets from one shared codebase**:

- a **Chrome Manifest V3 extension** (popup UI + background service worker), and
- a **Progressive Web App (PWA)** with offline support and background notifications.

Both targets are built with **Vue 3**, **TypeScript**, **Pinia**, **Vuetify 3**, and **Vite**.

These docs are written for new developers joining the project. They cover how the system
is put together, how to run it locally, and where to find things in the code.

## Table of contents

- [Architecture overview](architecture.md) — components, modules, tech stack, and a high-level diagram
- [Getting started](getting-started.md) — prerequisites, installation, configuration, running the app, and tests
- [Project structure](project-structure.md) — walkthrough of the directory layout
- [Data model](data-model.md) — entities, storage schemas, and relationships
- [Key flows](key-flows.md) — step-by-step extension and PWA reminder flows
- [Interfaces](interfaces.md) — internal contracts between UI, background worker, and storage
- [Development guide](development-guide.md) — conventions, testing, contribution workflow, and common tasks
- [Deployment and operations](deployment.md) — building, deploying, and runtime configuration

## A note on APIs

EyeSaver exposes **no HTTP/REST API** and makes no external API calls at runtime. All
user data is stored locally (in `chrome.storage.local` for the extension and IndexedDB
for the PWA). The [Interfaces](interfaces.md) document therefore covers the **internal
contracts** between the UI, the background service workers, and the storage layers
instead of external endpoints.
