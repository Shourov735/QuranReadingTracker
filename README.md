# Quran Reading Tracker

A personal, offline-first Expo/React Native app for tracking daily Quran
reading progress along two completely independent tracks:

- **Arabic reading** — tracked by Surah + Ruku
- **Bangla translation reading** — tracked by Surah + Ayat

Single local user, no accounts, no backend, no cloud. All data stays on the
device.

## Features

- Home screen with live progress cards for both tracks, a both-tracks streak
  banner, and one-tap quick updates ("Mark Ruku done" / "Mark Ayat done")
- Manual update screens with Surah + Ruku/Ayat pickers for both tracks
- End-of-Quran handling: completing Surah 114 freezes a track at An-Nas with
  a celebration card and a "Start New Cycle" reset
- Reading history log and statistics (current/longest streak, total reading
  days, lifetime completions per track)
- Daily local reminder notification at 18:30 (skips the day automatically
  once both tracks are updated for that day)
- Settings: daily reminder info, reset per track, light/dark/system theme
  override, about section
- Light and dark themes across the whole app

## Tech stack

- Expo (SDK 57) + Expo Router (file-based routing)
- React Native + TypeScript (strict mode)
- `@react-native-async-storage/async-storage` for persistence
- `expo-notifications` for local scheduled reminders only — never push
- `@react-native-picker/picker` for the surah/position pickers

## How to run

Requirements: Node.js + npm, and the Expo Go app on a physical Android phone.

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. All testing happens this way — no Android
emulator is used or supported by this project.

## Project structure

```
app/          Expo Router screens (file-based routing)
components/   Reusable presentational components
domain/       Pure business logic (no React/RN imports)
data/         quran-metadata.json + typed loader
services/     Storage layer, notification scheduling
types/        Shared TypeScript types
theme/        Colors, light/dark theme definitions
```

## How this project is built

The app was built in explicit phases (0–10), one feature at a time: metadata
layer → storage → progress logic → Home → update screens → reminder →
settings → history/stats → dark mode → polish. Each phase added a dated entry
to `PROGRESS_LOG.md` describing what was built, decisions made, and anything
the next phase needed to know.

- `AGENTS.md` — the full project spec and architecture rules
- `PROGRESS_LOG.md` — the complete build history

## License

MIT
