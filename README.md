# Quran Reading Tracker

An offline-first Expo/React Native app for tracking daily Quran reading progress
along two completely independent tracks — Arabic reading by Surah + Ruku, and
Bangla translation reading by Surah + Ayat.

## Badges

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform: Android](https://img.shields.io/badge/Platform-Android-3DDC84.svg)
![Built with Expo](https://img.shields.io/badge/Built%20with-Expo-000020.svg)

## Table of Contents

- [About](#about)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Build your own installable APK](#build-your-own-installable-apk)
  - [Download the APK](#download-the-apk)
- [Project Structure](#project-structure)
- [How This Project Was Built](#how-this-project-was-built)
- [Data Sources & Acknowledgments](#data-sources--acknowledgments)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## About

This is a personal, offline-first reading tracker for the Quran. It maintains
two fully independent progress records — Arabic reading (Surah + Ruku) and
Bangla translation reading (Surah + Ayat) — because the two habits advance at
different speeds and must never interfere with each other. Everything runs on
the device: a single local user, no accounts, no backend, no cloud, and no
internet connection required.

## Features

- Home screen with live progress cards for both tracks, a both-tracks streak
  banner, and one-tap quick updates ("Mark Ruku done" / "Mark Ayat done")
- Manual update screens with Surah + Ruku/Ayat pickers for both tracks, for
  times when reading happens without the app open
- End-of-Quran handling: finishing Surah 114 completes and freezes a track at
  An-Nas with a celebration card and a "Start New Cycle" reset
- Reading history log and statistics — current/longest streak, total reading
  days, lifetime completions per track
- Daily local reminder notification at 18:30, skipped automatically for the day
  once both tracks are updated
- Settings: daily reminder info, per-track reset, System/Light/Dark theme
  override, and an about section with the repository link
- Light and dark themes across the whole app
- Fully offline and private — progress never leaves the device

## Screenshots

![Home screen](./assets/screenshots/home.png)

![Update screen](./assets/screenshots/update.png)

![History and stats](./assets/screenshots/history.png)

## Tech Stack

- Expo (SDK 57) + Expo Router (file-based routing)
- React Native + TypeScript (strict mode)
- `@react-native-async-storage/async-storage` for persistence
- `expo-notifications` for local scheduled reminders only — never push
- `@react-native-picker/picker` for the surah/position pickers

## Getting Started

Requirements: Node.js + npm, a physical Android phone, and a free Expo account
(for EAS builds). This project does not use an Android emulator — all testing
is done on a real device.

### Build your own installable APK

Install the EAS CLI, log in with your Expo account, and start a preview build:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

EAS builds the app's native code on Expo's servers — no local Android toolchain
needed — and returns a link to a single installable APK. Download it from that
link and install it on your phone. Building requires a free Expo account and
consumes free-tier build quota.

### Download the APK

Prefer to skip the build? A signed APK built from this repository is available
for direct download:

<https://expo.dev/accounts/shourov735s-team/projects/quran-reading-tracker/builds/fad1201b-f01e-45da-9e79-161a3428f744>

Install it on any Android device (you may need to allow installs from unknown
sources). The app runs standalone — Expo Go is not required.

## Project Structure

```
app/          Expo Router screens (file-based routing)
components/   Reusable presentational components
domain/       Pure business logic (no React/RN imports)
data/         quran-metadata.json + typed loader
services/     Storage layer, notification scheduling
types/        Shared TypeScript types
theme/        Colors, light/dark theme definitions
```

## How This Project Was Built

The app was built in explicit phases (0–11), one feature at a time: metadata
layer → storage → progress logic → Home → update screens → reminder →
settings → history/stats → dark mode → polish → EAS build setup. Each phase
added a dated entry to `PROGRESS_LOG.md` describing what was built, decisions
made, and anything the next phase needed to know.

- `AGENTS.md` — the full project spec and architecture rules
- `PROGRESS_LOG.md` — the complete build history

## Data Sources & Acknowledgments

`data/quran-metadata.json` (all 114 surahs, Arabic names, transliterations,
and ayah/ruku counts) was derived from the
[`malekverse/quran-dataset`](https://github.com/malekverse/quran-dataset)
project on GitHub, which is licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Ayah counts are verified against the standard total of 6,236. Ruku counts come
from that dataset's own numbering, which totals 556 rukus — not the commonly
cited 558, a known variance between mushaf printing conventions. As a result,
a surah or two may differ by one ruku from your physical copy; this can be
corrected with the app's manual-edit feature.

## Roadmap

The following are documented future ideas — **not yet implemented**:

- Multiple daily reminders
- Monthly reading graph
- Backup and restore
- Cloud synchronization
- Widgets
- Bookmarking
- Verse notes
- Reading goals (e.g., finish one Juz every 10 days)
- Juz-based progress tracking
- Multiple translations
- Editable reminder time

## Contributing

This is a public, MIT-licensed repository, meant to be cloned and forked.

1. Fork the repository on GitHub, then clone your fork:
   ```bash
   git clone https://github.com/<your-username>/QuranReadingTracker.git
   cd QuranReadingTracker
   ```
2. Install dependencies and run locally:
   ```bash
   npm install
   npx expo start
   ```
   Scan the QR code with Expo Go on a physical Android phone. This is the
   project's only supported dev/test workflow — no emulator.
3. Before opening a pull request, read `AGENTS.md` — it contains the
   architecture rules, folder structure, and code style that all code must
   follow.

This is primarily a personal project, so responses to PRs and issues may be
slow — but contributions are welcome.

## License

[MIT](./LICENSE)
