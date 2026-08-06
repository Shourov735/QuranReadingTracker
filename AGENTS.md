# AGENTS.md — Quran Reading Tracker

Read this file completely before writing any code. Then read `PROGRESS_LOG.md`
to see exactly what previous phases already built. Then read the phase prompt
given to you for this session — it defines the scope for THIS session only.
Do not implement features from later phases even if they seem related or easy
to add while you're in there.

## What this project is

A personal, offline-first Expo/React Native app for tracking daily Quran
reading progress along two completely independent tracks:

- **Arabic reading** — tracked by Surah + Ruku
- **Bangla translation reading** — tracked by Surah + Ayat

Single local user, no accounts, no backend, no cloud, no internet dependency.
The code should still be clean enough that a stranger can clone the repo and
run it for themselves.

## Locked product decisions

These were explicitly decided by the project owner — do not deviate:

- **End of Quran behavior**: when a track's progress passes the last Ruku (Arabic)
  or last Ayat (Bangla) of Surah 114 (An-Nas), that track becomes **completed**.
  It freezes at Surah 114 / its last Ruku or Ayat and stops auto-advancing.
  The Home screen shows a completed state. The user must manually reset that
  track (start over at Surah 1) to begin a new reading cycle. There is no
  automatic loop back to Surah 1.
- **Daily reminder default time**: 18:30 (6:30 PM) local device time, fixed
  for v1. This approximates Maghrib in Dhaka; it is not solar-calculated.
  Editable reminder time is a documented future feature, not built now.
- **Streak definition**: a calendar day only counts toward the "consecutive
  reading days" streak if **both** Arabic and Bangla progress were updated
  that day. Updating only one track does not extend the streak.

## Tech stack

- Expo (latest stable SDK) + Expo Router (file-based routing)
- TypeScript, strict mode
- `@react-native-async-storage/async-storage` for persistence
- `expo-notifications` for **local** scheduled reminders only — never push
- Only add a dependency in the phase that actually needs it. Do not
  pre-install things "for later."

## Non-negotiable architecture rules

- Arabic progress and Bangla progress are separate data records. Logic for
  one must never read or mutate the other's data.
- All Quran structural data (surah names, ayat counts, ruku counts) comes
  from `data/quran-metadata.json` via a typed loader. Never hardcode or
  invent surah numbers, names, or counts in component code.
- Progress-mutation logic (advancing ruku/ayat, rolling over to the next
  surah, detecting completion) lives in plain TypeScript modules under
  `domain/`, with zero React or React Native imports, so it stays easy to
  reason about and test in isolation.
- All persistence goes through one storage abstraction in `services/`, never
  raw `AsyncStorage` calls scattered through components. This keeps a future
  swap (SQLite, cloud sync) to a single file.

## Code style

- No comments in code. Code should read clearly from naming alone. The one
  exception: a one-line comment directly above an unavoidable `any` or a
  genuinely non-obvious workaround, explaining why.
- Do not add configurability, abstraction, or extra features beyond what the
  current phase prompt asks for, even if it seems like a natural extension.
- Meaningful, descriptive names for files, functions, variables, components.
- Functional components and hooks only. No class components.

## Folder structure

```
app/                   Expo Router screens (file-based routing)
components/            Reusable presentational components
domain/                Pure business logic (no RN/React imports)
data/                  quran-metadata.json + typed loader
services/              Storage layer, notification scheduling
types/                 Shared TypeScript types
theme/                 Colors, spacing, light/dark theme definitions
```

Do not deviate from this without a strong, stated reason.

## Testing constraints

- No Android emulator is used or available. All testing is manual, through
  Expo Go on a physical Android phone, via `npx expo start` and live reload.
- `expo-notifications`: local scheduled notifications only. Push
  notifications are unsupported in Expo Go on Android since SDK 53 — this
  project never needs push, so don't add push tokens, permissions, or
  server-side notification code of any kind.
- Don't assume `adb` or emulator-only debugging tools are available.

## Out of scope until explicitly requested

Multiple daily reminders, monthly reading graphs, backup/restore, cloud
sync, widgets, bookmarking, verse notes, reading goals, Juz-based tracking,
multiple translations, user accounts, solar-calculated Maghrib times. These
are documented future ideas — don't scaffold for them speculatively.

## End of every phase

1. Manually verify the acceptance criteria in the phase prompt actually work
   in Expo Go on a physical device.
2. Append one entry to `PROGRESS_LOG.md` (format is in that file) describing
   what was built, files touched, any decisions or deviations, and anything
   the next phase needs to know.
3. Leave the working tree clean and suggest a commit message in the form
   `phase-N: short description`.
4. Ask the project owner to manually verify the phase on their phone. Only
   when the owner confirms everything works, commit the changes and push to
   GitHub. Do not push before that confirmation.
