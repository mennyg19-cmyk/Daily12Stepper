# App Lock — Native Implementation Guide

This document describes how to implement the native app-blocking functionality for iOS and Android. The feature blocks or hides apps until the user makes their daily commitment, similar to [Cape](https://getcape.app/).

## Current Status

- **UI & data layer**: Complete (presets, schedule, tiers, emergency apps)
- **Presets**: 4 built-in (Light, Medium, Heavy, Extreme) + user-created with naming and notes
- **Storage**: AsyncStorage for config and presets
- **Instructions**: Full setup guide and per-preset instructions (how it works, how to replicate)
- **Native bridge**: Stub in `features/app-lock/native.ts` — returns `false` for `isAppLockAvailable()`

## iOS Implementation

### Requirements

- iOS 16+
- **Family Controls entitlement** — must request from Apple (takes 1–2 weeks)
- Physical device (simulator does not support Family Controls)

### APIs

1. **FamilyControls** — Authorization and app selection
   - `AuthorizationCenter.shared.requestAuthorization(for: .individual)`
   - `FamilyActivityPicker` — SwiftUI view for selecting apps/categories

2. **ManagedSettings** — Enforce restrictions
   - `ManagedSettingsStore()` — apply shields to selected apps
   - `store.shield.applications = selection.applicationTokens`
   - `store.shield.applicationCategories = selection.categoryTokens`

3. **DeviceActivity** — Schedule when restrictions apply
   - `DeviceActivityCenter` — schedule activity monitoring
   - `DeviceActivitySchedule` — time windows (e.g. 6 AM until commitment)

### Steps

1. Add Family Controls capability in Xcode
2. Request entitlement: [Apple Developer](https://developer.apple.com/contact/request/extension/) → Family Controls
3. Create Expo config plugin or native module that:
   - Exports `isAppLockAvailable()` — check authorization status
   - Exports `requestAppLockAuthorization()` — call `AuthorizationCenter.requestAuthorization`
   - Exports `openAppPicker(selectedIds, mode)` — present `FamilyActivityPicker`, return selected tokens
   - Exports `applyRestrictions(config)` — use `ManagedSettingsStore` to shield apps
   - Exports `clearRestrictions()` — clear `ManagedSettingsStore`

### References

- [Family Controls | Apple Developer](https://developer.apple.com/documentation/familycontrols)
- [ManagedSettings | Apple Developer](https://developer.apple.com/documentation/managedsettings)
- [DeviceActivity | Apple Developer](https://developer.apple.com/documentation/deviceactivity)
- [A Developer's Guide to Apple's Screen Time APIs](https://medium.com/@juliusbrussee/a-developers-guide-to-apple-s-screen-time-apis-familycontrols-managedsettings-deviceactivity-e660147367d7)

---

## Android Implementation

### Requirements

- `PACKAGE_USAGE_STATS` permission
- User must grant via Settings → Apps → Special access → Usage access
- Overlay or Accessibility Service to intercept app launches

### Approach

**Option A: UsageStatsManager + Overlay**
- Use `UsageStatsManager` to detect when user opens a blocked app
- Show overlay / redirect to your app when blocked app is in foreground
- Requires `UsageStatsManager.queryUsageStats()` polling or `UsageStatsManager` listeners

**Option B: Accessibility Service**
- Register Accessibility Service that monitors `TYPE_WINDOW_STATE_CHANGED`
- When blocked app opens, perform action (e.g. go home, show overlay)
- Gray area: Google may reject if it feels like blocking user control

**Option C: Digital Wellbeing APIs**
- Limited third-party access; may not be suitable

### Steps

1. Add `android.permission.PACKAGE_USAGE_STATS` to AndroidManifest
2. Guide user to Settings to grant Usage Access
3. Create a foreground service or overlay that:
   - Polls `UsageStatsManager.getUsageStats()` for current foreground app
   - If blocked, show overlay or `Intent` to launch your app
4. For app picker: use `PackageManager.getInstalledApplications()` to list apps, let user select

### References

- [UsageStatsManager | Android Developers](https://developer.android.com/reference/android/app/usage/UsageStatsManager)
- [AppBlock Android implementation](https://appblock.app/help/android/blocking-conditions-android)

---

## Integration with Daily 12 Stepper

### Data Flow

1. User configures lock in Settings → App Lock
2. Config saved via `features/app-lock/storage.ts`
3. When lock should be active (based on schedule + commitment status):
   - Call `applyRestrictions()` with block list from config
4. When user commits or completes required steps:
   - Call `clearRestrictions()` or update with new allow list

### Commitment Integration

- **Full mode**: Lock until `getCommitmentForDate(today)` returns active commitment
- **Tiered mode**: Lock until user completes steps for each tier; unlock tier's apps when `getStepsDoneToday()` includes required steps

### Schedule

- `schedule.activateAt === 'morning'` → Lock from `morningHour` until commitment
- `schedule.activateAt === 'night'` → Lock from `nightHour` previous day until commitment
- Requires background/scheduled task or push notification to trigger lock at the right time

---

## Expo Config Plugin (Optional)

To add the Family Controls entitlement and Android permissions via EAS/Expo:

```js
// app.plugin.js or in app config
const { withInfoPlist, withAndroidManifest } = require('@expo/config-plugins');

function withAppLock(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.NSFamilyControlsUsageDescription = 
      'Daily 12 Stepper uses Family Controls to help you stay focused by limiting app access until you make your daily commitment.';
    return config;
  });
  config = withAndroidManifest(config, (config) => {
    // Add PACKAGE_USAGE_STATS
    return config;
  });
  return config;
}
```
