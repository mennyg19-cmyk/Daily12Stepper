/**
 * App Lock — built-in presets and full instructions.
 */
import type { AppLockConfig, AppLockPreset, BuiltInPresetId } from './types';

export interface PresetInfo {
  id: BuiltInPresetId;
  name: string;
  shortDescription: string;
  fullDescription: string;
  howItWorks: string;
  howToReplicate: string;
  config: AppLockConfig;
}

export const BUILT_IN_PRESETS: Record<BuiltInPresetId, PresetInfo> = {
  light: {
    id: 'light',
    name: 'Light',
    shortDescription: 'Gentle morning reminder. Lock activates at 6 AM until commitment.',
    fullDescription:
      'Light blocking is ideal for building the habit without feeling restricted. The lock activates at 6 AM each morning. Until you make your commitment, only this app and your emergency apps (Phone, Messages) are accessible. All other apps are blocked or hidden.',
    howItWorks:
      '• Lock activates at 6:00 AM daily\n• Full mode: blocks everything except this app + emergency apps\n• Unlocks immediately when you tap "Yes, 24 hours" or make a custom commitment\n• Emergency apps: add Phone, Messages, and any must-have apps',
    howToReplicate:
      '1. Set Schedule → Morning, 6:00 AM\n2. Set Lock mode → Full\n3. Add emergency apps (Phone, Messages)\n4. Enable App Lock',
    config: {
      enabled: true,
      mode: 'full',
      emergencyAppIds: [],
      tiers: [],
      schedule: { activateAt: 'morning', morningHour: 6, nightHour: 22 },
      fullModeBlockAll: true,
    },
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    shortDescription: 'Morning lock with tiered unlock. Complete steps 1–3 to unlock productivity apps.',
    fullDescription:
      'Medium blocking adds structure: lock from 6 AM, but you can unlock productivity apps (email, calendar, notes) after completing steps 1–3. Social media and entertainment stay blocked until commitment.',
    howItWorks:
      '• Lock activates at 6:00 AM\n• Tiered mode: complete steps to unlock app groups\n• Tier 1 (Steps 1–3): Productivity apps — email, calendar, notes\n• Tier 2 (Steps 4–6): Communication — messaging, calls\n• Full unlock: only after daily commitment\n• Customize tiers in Unlock Tiers to pick which apps go where',
    howToReplicate:
      '1. Schedule → Morning, 6:00 AM\n2. Lock mode → Tiered\n3. Add Tier 1: Steps 1,2,3 → select productivity apps\n4. Add Tier 2: Steps 4,5,6 → select communication apps\n5. Emergency apps: Phone, Messages\n6. Enable App Lock',
    config: {
      enabled: true,
      mode: 'tiered',
      emergencyAppIds: [],
      tiers: [
        {
          id: 'tier-1',
          requiredSteps: [1, 2, 3],
          appIds: [],
          label: 'Productivity (Steps 1–3)',
        },
        {
          id: 'tier-2',
          requiredSteps: [4, 5, 6],
          appIds: [],
          label: 'Communication (Steps 4–6)',
        },
      ],
      schedule: { activateAt: 'morning', morningHour: 6, nightHour: 22 },
      fullModeBlockAll: true,
    },
  },
  heavy: {
    id: 'heavy',
    name: 'Heavy',
    shortDescription: 'Night lock. Apps blocked from 10 PM until commitment next day.',
    fullDescription:
      'Heavy blocking starts the lock at 10 PM the night before. Your phone is effectively limited to this app and emergency apps from evening until you commit the next day. Good for serious focus.',
    howItWorks:
      '• Lock activates at 10:00 PM (previous day)\n• Full mode: only this app + emergency apps\n• You wake up with a locked phone — commit first thing\n• Emergency apps: Phone, Messages, Alarm, Maps',
    howToReplicate:
      '1. Schedule → Night, 22:00 (10 PM)\n2. Lock mode → Full\n3. Emergency apps: Phone, Messages, Alarm, Maps\n4. Enable App Lock',
    config: {
      enabled: true,
      mode: 'full',
      emergencyAppIds: [],
      tiers: [],
      schedule: { activateAt: 'night', morningHour: 6, nightHour: 22 },
      fullModeBlockAll: true,
    },
  },
  extreme: {
    id: 'extreme',
    name: 'Extreme',
    shortDescription: 'Maximum lock. Night start, tiered unlock, minimal emergency apps.',
    fullDescription:
      'Extreme blocking combines night activation with strict tiered unlock. Lock from 9 PM. Unlock apps only as you complete steps. Minimal emergency apps. For users who want maximum accountability.',
    howItWorks:
      '• Lock activates at 9:00 PM\n• Tiered: Tier 1 (Steps 1–4), Tier 2 (Steps 5–8), Tier 3 (Steps 9–12)\n• Only Phone and Messages as emergency\n• Full unlock only after commitment + all 12 steps optional',
    howToReplicate:
      '1. Schedule → Night, 21:00 (9 PM)\n2. Lock mode → Tiered\n3. Tier 1: Steps 1,2,3,4 → essential tools\n4. Tier 2: Steps 5,6,7,8 → secondary apps\n5. Tier 3: Steps 9,10,11,12 → entertainment\n6. Emergency: Phone, Messages only\n7. Enable App Lock',
    config: {
      enabled: true,
      mode: 'tiered',
      emergencyAppIds: [],
      tiers: [
        { id: 'tier-1', requiredSteps: [1, 2, 3, 4], appIds: [], label: 'Essential (Steps 1–4)' },
        { id: 'tier-2', requiredSteps: [5, 6, 7, 8], appIds: [], label: 'Secondary (Steps 5–8)' },
        { id: 'tier-3', requiredSteps: [9, 10, 11, 12], appIds: [], label: 'Full (Steps 9–12)' },
      ],
      schedule: { activateAt: 'night', morningHour: 6, nightHour: 21 },
      fullModeBlockAll: true,
    },
  },
};

export function getBuiltInPreset(id: BuiltInPresetId): AppLockPreset {
  const info = BUILT_IN_PRESETS[id];
  return {
    id: `builtin-${id}`,
    name: info.name,
    notes: info.shortDescription,
    config: { ...JSON.parse(JSON.stringify(info.config)) },
    isBuiltIn: true,
    builtInId: id,
  };
}

export function getAllBuiltInPresets(): AppLockPreset[] {
  return (['light', 'medium', 'heavy', 'extreme'] as BuiltInPresetId[]).map(getBuiltInPreset);
}
