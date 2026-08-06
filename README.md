# Quran Reading Tracker

A personal, offline-first Expo/React Native app for tracking daily Quran
reading progress along two independent tracks:

- **Arabic reading** — tracked by Surah + Ruku
- **Bangla translation reading** — tracked by Surah + Ayat

Single local user, no accounts, no backend, no cloud. All data stays on the
device.

## Get started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on a physical Android phone.

## Project structure

```
app/          Expo Router screens (file-based routing)
components/   Reusable presentational components
domain/       Pure business logic (no React/RN imports)
data/         quran-metadata.json + typed loader
services/     Storage layer, notification scheduling
types/        Shared TypeScript types
theme/        Colors, spacing, light/dark theme definitions
```

See `AGENTS.md` for the full project spec and architecture rules, and
`PROGRESS_LOG.md` for the build history.
