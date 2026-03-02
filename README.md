# Daily 12 Stepper

A mobile app for working through the Twelve Steps of Alcoholics Anonymous. Built with Expo and React Native, it helps you track daily stepwork, inventories, meditation, gratitude, and more—with optional commitment gating and app lock features.

---

## What the App Does

Daily 12 Stepper guides you through the Twelve Steps with structured content, timers, and personal tracking. You can make a daily commitment (24 hours or custom), work through each step with sponsor instructions, keep inventories, meditate, and log gratitude—all in one place.

---

## Features

### Today (Dashboard)

- **Daily commitment** — Optional 24-hour or custom-duration commitment. When active, shows a live countdown. Tap to commit or skip for the day.
- **Steps 1–12** — List of all steps with completion checkmarks. Tap any step to open it. Collapsible cards show step previews.
- **Quick links** — Extra Tools, Metrics, Gratitude, Reader.

### Steps 1–12

Each step screen includes:

- **Step content** — Reading material and instructions.
- **Sponsor instructions** — Editable notes from your sponsor (saved per step).
- **Stepwork timer** — Auto-starts when you begin; tracks time spent per step. Steps 1–3 start on scroll; steps 4+ start on focus.
- **Mark done** — Check off when you’ve completed the step for today.

**Step-specific features:**

- **Steps 1–3** — Reading + reflection with checkoff.
- **Step 4** — Moral inventory (resentments, fears) with structured forms.
- **Step 5** — Admit wrongs; sharings with sponsor.
- **Step 6** — Defects of character; readiness checklist.
- **Step 7** — Humility prayer; defect episodes.
- **Step 8** — Amends list; persons harmed.
- **Step 9** — Direct amends tracking.
- **Step 10** — Daily inventory (resentment & fear); links to inventory screen.
- **Step 11** — Morning/nightly inventory, meditation timer, prayer.
- **Step 12** — Carry the message; spiritual awakening notes.

### Step 10 — Inventory (Resentment & Fear)

- **Resentment form** — Who, what happened, affects, defects, assets.
- **Fear form** — Same structure for fears.
- Entries saved and editable. Protected by privacy lock when enabled.

### Step 11 — Meditation & Inventory

- **Meditation timer** — Start/stop with background support. Manual entry option. Tracks duration.
- **Morning inventory** — Quick morning check-in.
- **Nightly inventory** — Evening reflection with defect tracking and Step 7 prayer.

### Gratitude

- Add gratitude entries with optional date.
- Duplicate detection warns if similar entry exists.
- View, edit, and delete entries.

### Reader

- Add books via URL or local file.
- WebView-based reading with scroll position saved.
- **Bookmarks** — Add, edit, delete; link bookmarks to extra tools.
- **Auto-bookmark** — Option to auto-save position.
- **Stepwork integration** — Reading from a step counts toward stepwork time.

### Extra Tools

- **Custom tools** — Add tools like “Call sponsor 3x/week” with frequency (daily/weekly/monthly) and reminders.
- **Completions** — Mark tools done per day; view by today or date filter.
- **Sobriety counters** — One counter per addiction from profile; live timers (days, hours, minutes, seconds).
- **Sponsor work time** — Daily target (e.g. 60 min); progress from stepwork + tool completions. Compact view shows “X min left” or “Done”.
- **Gratitude & Reader** — Quick links.

### Metrics

- **Stepwork** — Line chart of last 7 days; total and daily average.
- **Meditation** — Total and daily average.
- **Steps completed** — Count over last 7 days.
- **Time by step** — Breakdown per step.
- **Daily breakdown** — Per-day stepwork, meditation, steps, gratitude, tools, commitment status.

### Profile

- **Name** — Used in greetings.
- **Birthday** — Optional; birthday message on dashboard.
- **Addictions** — Add multiple (e.g. alcohol, drugs). Each has optional sobriety start date/time for counters.
- **Sponsor work time** — Default daily target (minutes).

### Settings

- **Appearance** — Light, dark, or system theme.
- **Collapse step cards** — Show only step titles on dashboard.
- **Privacy lock** — Face ID or password for sensitive screens.
- **App Lock** — Block/hide apps until commitment (Cape-style).
- **Notifications** — Per-type reminders (commitment, stepwork, per-step, tools).
- **Data** — Export and import JSON backup.

### Privacy Lock

- **Modes** — Off, Face ID/Touch ID, or password.
- **Protected screens** — Inventories, sobriety, app lock, profile.
- **Session** — 5-minute unlock after authentication.

### App Lock

- **Concept** — Block or hide apps until you make your daily commitment (similar to Cape).
- **Presets** — Light, Medium, Heavy, Extreme + custom presets.
- **Schedule** — Morning (e.g. 6 AM), night (e.g. 10 PM), or custom.
- **Lock mode** — Full (block all) or tiered (unlock app groups as you complete steps).
- **Unlock tiers** — Define tiers (e.g. Steps 1–3 → productivity apps; Steps 4–6 → communication).
- **Emergency apps** — Always allow (Phone, Messages, etc.).
- **Sponsor password** — When set, only sponsor can change rules (15-min verification).
- **Preset schedule** — Different presets by day (weekdays, weekends) or custom ranges (vacation).
- **Jewish holidays** — Optional rules for holidays (skip lock or use preset).
- **Native support** — UI and config complete; native blocking requires Family Controls (iOS) / Usage Access (Android). See `docs/APP_LOCK_NATIVE.md`.

### Notifications

- **Commitment** — Remind to make daily commitment (e.g. 6:00).
- **Stepwork** — General stepwork reminder.
- **Per-step** — Optional reminder per step (Steps 1–12).
- **Tools** — Per-tool reminders configured in Extra Tools (e.g. “Call sponsor” at 9:00).

---

## Tech Stack

- **Expo SDK 54** — React Native framework
- **React 19** — UI
- **Expo Router** — File-based navigation
- **NativeWind (Tailwind)** — Styling
- **expo-sqlite** — Local database
- **expo-secure-store** — Passwords, tokens
- **expo-local-authentication** — Face ID / Touch ID
- **expo-notifications** — Push reminders
- **react-native-svg** — Charts (metrics)
- **date-fns** — Date handling

---

## Project Structure

```
app/                    # Screens (Expo Router)
  index.tsx             # Today dashboard
  settings.tsx          # Settings
  profile.tsx           # Profile
  privacy.tsx           # Privacy lock settings
  notifications.tsx     # Notification config
  metrics.tsx           # Metrics
  inventory.tsx         # Step 10 inventory
  step11.tsx            # Step 11
  steps/[stepNumber].tsx # Steps 1–12 (except 11)
  extra-tools.tsx       # Extra Tools
  gratitude.tsx         # Gratitude
  reader/               # Reader (book list, book view)
  app-lock/             # App Lock (presets, schedule, tiers, etc.)

components/             # Shared UI
  AppHeader, ModalSurface, PrivacyGate, CommitmentGate, etc.

contexts/               # React context
  PrivacyContext.tsx

features/               # Feature modules
  commitment/           # Daily commitment
  inventory/            # Step 10, morning, nightly forms
  steps/                # Step content, database, stepwork
  extra-tools/          # Custom tools
  gratitude/            # Gratitude
  sobriety/             # Sobriety counters
  sponsor-work-time/    # Sponsor work time
  meditation/           # Meditation timer
  reader/               # Reader books, bookmarks
  app-lock/             # App Lock types, presets, storage

lib/                    # Core logic
  database/             # SQLite schema, migrations
  profile.ts            # Profile, addictions
  settings.ts           # Theme, reminders
  privacy.ts            # Privacy lock
  sponsorPassword.ts    # App Lock sponsor password
  notifications.ts      # Push scheduling
  notificationConfig.ts # Per-type notification config
  metrics.ts            # Metrics aggregation
  exportImport.ts       # Backup/restore
  commitment.ts         # Commitment logic
  stepContent.ts        # Step text
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for testing on device) or iOS Simulator / Android Emulator

### Install

```bash
npm install
```

### Run

```bash
npm start
```

Then press `i` for iOS or `a` for Android.

### Build

```bash
npx expo run:ios
npx expo run:android
```

For EAS Build (cloud):

```bash
npx eas build --platform ios
npx eas build --platform android
```

---

## Data & Privacy

- All data is stored locally on your device (SQLite + AsyncStorage).
- Export creates a JSON file you can backup or share.
- Import restores from a previously exported file.
- Privacy lock and sponsor password use SecureStore for sensitive values.

---

## License

Private project.
