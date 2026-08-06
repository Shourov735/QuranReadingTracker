User Story & Project Context
Project Name

Quran Reading Tracker

Project Goal

I want to build a simple, clean, and distraction-free mobile application that helps me consistently read the Quran and keep track of my reading progress.

I read the Quran almost every day in two different ways:

Arabic Quran
Bangla Translation

These are completely independent reading sessions.

Since I usually progress at different speeds, I need to track them separately.

For example:

Arabic reading may currently be at Surah Al-Baqarah, Ruku 12
Bangla translation may currently be at Surah An-Nisa, Ayat 35

The application should remember both independently.

Primary Users

Initially this app is only for myself.
But anyone should be able to clone my source code from github and make a app for him

Design the architecture so that multiple users could be supported in the future.

Main Features
1. Arabic Reading Tracker

Maintain progress for Arabic Quran.

Store:

Current Surah
Current Ruku

Example:

Arabic Progress

Surah: Al-Baqarah
Ruku: 12

When I finish a Ruku, I press a button.

The application updates the current Ruku.

If it is the last Ruku of the Surah, move automatically to the first Ruku of the next Surah.

2. Bangla Reading Tracker

Maintain progress separately.

Store:

Current Surah
Current Ayat

Example

Bangla Progress

Surah: Al-Imran
Ayat: 85

When I finish reading some ayat, I can update the progress.

If the ayat exceeds the last ayat of that Surah, automatically continue to the next Surah.

3. Independent Progress

Arabic and Bangla progress must never affect each other.

Each has its own state.

4. Daily Reminder

Every day the application should send local notification reminding me to read the Quran or reminding me to update the progress if I don't update that day .

Example notification:

"Don't forget to read the Quran today."
"Update today's progress"

The notification should work even if the app is closed.

The reminder time should be configurable later, but for the first version a fixed default time(at night) is acceptable.

5. Progress Overview

The home screen should immediately show:

Arabic

Current Surah
Current Ruku

Bangla

Current Surah
Current Ayat

Also show:

Last updated date
Number of consecutive reading days (optional if simple to implement)
6. Manual Editing

Sometimes I may read without opening the app.

Therefore I should be able to manually edit:

Arabic

Surah
Ruku

Bangla

Surah
Ayat

using simple dropdowns or pickers.

7. Quran Metadata

The application should contain metadata for all 114 Surahs, including:

Surah number
Arabic name
English transliteration
Number of Ayat
Number of Ruku

This data should be stored locally as JSON.

No internet connection should be required.

8. Data Persistence

Reading progress must remain after closing the app.

Use local storage.

No authentication.

No backend.

No cloud database.

9. UI Requirements

The interface should be minimal.

Prioritize readability over decoration.

Suggested screens:

Home

Shows

Arabic progress
Bangla progress
Quick Update buttons
Update Arabic

Choose

Surah
Ruku

Save

Update Bangla

Choose

Surah
Ayat

Save

Settings
Notification time (future)
About
Technical Requirements

The project must use:

React Native
Expo
TypeScript
Expo Router
AsyncStorage for local persistence
Expo Notifications for reminders

The project should follow modern React Native best practices.

Development Constraints

The project will be generated entirely by OpenCode AI.

The code should be:

Modular
Clean architecture
Reusable
Strongly typed
Easy to maintain
Well-structured folder organization

Avoid unnecessary dependencies.

Testing Constraints

Do not use an Android emulator.

Testing should be done only through Expo Go on a physical Android phone.

The development workflow must support live reload through Expo Go.

More features to implement 

Reading history
Statistics
Dark mode


Future Features (Do Not Implement Now)

The architecture should make it easy to add these later:

Multiple daily reminders
Monthly reading graph
Backup and restore
Cloud synchronization
Widgets
Bookmarking
Notes for verses
Reading goals (e.g., finish one Juz every 10 days)
Juz-based progress tracking
Support for multiple translations
Success Criteria

The app is successful if:

I can instantly see where I stopped reading in Arabic.
I can instantly see where I stopped reading in Bangla.
Updating progress takes only a few taps.
My progress is never lost after closing the app.
I receive daily reminder to read the Quran.
The app works completely offline.
The codebase is clean, scalable, and easy to extend in the future.