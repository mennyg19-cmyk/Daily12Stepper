/**
 * App Lock — persist config and presets to AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppLockConfig,
  AppLockPreset,
  PresetScheduleConfig,
  PresetScheduleRule,
  PresetCustomRange,
  PresetHolidayRule,
} from './types';
import { DEFAULT_PRESET_SCHEDULE_CONFIG } from './types';
import { getAllBuiltInPresets } from './presets';
import { getHolidaysForDateRange, isDateOnHoliday } from './hebcal';

const CONFIG_KEY = 'daily12stepper_app_lock_config';
const PRESETS_KEY = 'daily12stepper_app_lock_presets';
const ACTIVE_PRESET_KEY = 'daily12stepper_app_lock_active_preset';
const PRESET_SCHEDULE_KEY = 'daily12stepper_app_lock_preset_schedule';
const BYPASS_DATE_KEY = 'daily12stepper_app_lock_bypass_date';

export async function getAppLockConfig(): Promise<AppLockConfig> {
  const activeId = await getActivePresetId();
  if (activeId) {
    const presets = await getPresets();
    const preset = presets.find((p) => p.id === activeId);
    if (preset) return { ...preset.config };
  }
  try {
    const v = await AsyncStorage.getItem(CONFIG_KEY);
    if (v) {
      const parsed = JSON.parse(v);
      return { ...parsed };
    }
  } catch {}
  return {
    enabled: false,
    mode: 'full',
    emergencyAppIds: [],
    tiers: [],
    schedule: {
      activateAt: 'morning',
      morningHour: 6,
      nightHour: 22,
    },
    fullModeBlockAll: true,
    allowBypassForToday: false,
  };
}

/** Get the date (YYYY-MM-DD) when user last bypassed, or null. */
export async function getBypassDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(BYPASS_DATE_KEY);
  } catch {}
  return null;
}

/** Set bypass for today. Call when user taps "Skip today". */
export async function setBypassForToday(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await AsyncStorage.setItem(BYPASS_DATE_KEY, today);
}

/** Check if lock is bypassed for the given date. */
export async function isBypassedForDate(dateStr: string): Promise<boolean> {
  const bypassed = await getBypassDate();
  return bypassed === dateStr;
}

export async function saveAppLockConfig(config: AppLockConfig): Promise<void> {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  const activeId = await getActivePresetId();
  if (activeId) {
    const all = await getPresets();
    const custom = all.filter((p) => !p.isBuiltIn);
    const preset = custom.find((p) => p.id === activeId);
    if (preset) {
      const updated = custom.map((p) =>
        p.id === activeId ? { ...p, config } : p
      );
      await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
    }
  }
}

export async function getPresets(): Promise<AppLockPreset[]> {
  const builtIn = getAllBuiltInPresets();
  try {
    const v = await AsyncStorage.getItem(PRESETS_KEY);
    if (v) {
      const custom: AppLockPreset[] = JSON.parse(v);
      return [...builtIn, ...custom];
    }
  } catch {}
  return builtIn;
}

export async function savePreset(preset: AppLockPreset): Promise<void> {
  const existing = await getPresets();
  const custom = existing.filter((p) => !p.isBuiltIn);
  const idx = custom.findIndex((p) => p.id === preset.id);
  const updated = idx >= 0 ? [...custom.slice(0, idx), preset, ...custom.slice(idx + 1)] : [...custom, preset];
  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  const activeId = await getActivePresetId();
  if (activeId === preset.id) {
    await saveAppLockConfig(preset.config);
  }
}

export async function deletePreset(id: string): Promise<void> {
  const existing = await getPresets();
  const custom = existing.filter((p) => !p.isBuiltIn && p.id !== id);
  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(custom));
}

export async function getActivePresetId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_PRESET_KEY);
  } catch {}
  return null;
}

export async function setActivePresetId(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem(ACTIVE_PRESET_KEY, id);
  } else {
    await AsyncStorage.removeItem(ACTIVE_PRESET_KEY);
  }
}

/** Get the config that should be active (from schedule, active preset, or legacy config) */
export async function getActiveConfig(): Promise<AppLockConfig> {
  return getActiveConfigForDate(new Date());
}

/** Apply a preset as active: save its config and set active id */
export async function applyPreset(preset: AppLockPreset): Promise<void> {
  await saveAppLockConfig(preset.config);
  await setActivePresetId(preset.id);
}

// ─── Preset schedule (which preset when) ─────────────────────────────────────

export async function getPresetScheduleConfig(): Promise<PresetScheduleConfig> {
  try {
    const v = await AsyncStorage.getItem(PRESET_SCHEDULE_KEY);
    if (v) {
      const parsed = JSON.parse(v);
      return { ...DEFAULT_PRESET_SCHEDULE_CONFIG, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_PRESET_SCHEDULE_CONFIG };
}

export async function savePresetScheduleConfig(config: PresetScheduleConfig): Promise<void> {
  await AsyncStorage.setItem(PRESET_SCHEDULE_KEY, JSON.stringify(config));
}

/** Check if date (YYYY-MM-DD) is in a custom range */
function isInCustomRange(dateStr: string, range: PresetCustomRange): boolean {
  const d = dateStr.slice(0, 10);
  return d >= range.startDate.slice(0, 10) && d <= range.endDate.slice(0, 10);
}

/** Check if day of week (0-6) matches a rule */
function dayMatchesRule(dayOfWeek: number, rule: PresetScheduleRule): boolean {
  switch (rule.dayPattern) {
    case 'always':
      return true;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'workdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'custom':
      return (rule.customDays ?? []).includes(dayOfWeek);
    default:
      return false;
  }
}

export type ResolvedPresetResult =
  | { type: 'preset'; presetId: string }
  | { type: 'skip_lock' }
  | null;

/** Resolve which preset should be active for a given date. */
export async function resolvePresetForDate(date: Date): Promise<ResolvedPresetResult> {
  const schedule = await getPresetScheduleConfig();
  const presets = await getPresets();
  const dateStr = date.toISOString().slice(0, 10);
  const dayOfWeek = date.getDay();

  // 1. Custom ranges (highest priority)
  for (const range of schedule.customRanges) {
    if (isInCustomRange(dateStr, range) && presets.some((p) => p.id === range.presetId)) {
      return { type: 'preset', presetId: range.presetId };
    }
  }

  // 2. Jewish holiday rules
  if (schedule.jewishHolidaysEnabled && schedule.holidayRules.length > 0) {
    try {
      const holidays = await getHolidaysForDateRange(
        dateStr,
        dateStr,
        schedule.jewishCalendarInIsrael
      );
      for (const rule of schedule.holidayRules) {
        const matches = rule.holidayCategory
          ? isDateOnHoliday(dateStr, holidays, { holidayCategory: rule.holidayCategory })
          : rule.holidayId
            ? isDateOnHoliday(dateStr, holidays, { holidaySlug: rule.holidayId })
            : false;
        if (matches) {
          if (rule.action === 'skip_lock') return { type: 'skip_lock' };
          if (rule.action === 'use_preset' && rule.presetId && presets.some((p) => p.id === rule.presetId)) {
            return { type: 'preset', presetId: rule.presetId };
          }
        }
      }
    } catch {
      // Fall through to day rules if Hebcal fails
    }
  }

  // 3. Day-of-week rules (by priority desc)
  const matchingRules = schedule.rules
    .filter((r) => dayMatchesRule(dayOfWeek, r) && presets.some((p) => p.id === r.presetId))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  if (matchingRules.length > 0) return { type: 'preset', presetId: matchingRules[0].presetId };

  // 4. Default preset
  if (schedule.defaultPresetId && presets.some((p) => p.id === schedule.defaultPresetId)) {
    return { type: 'preset', presetId: schedule.defaultPresetId };
  }

  return null;
}

/** Get the config that should be active for a date (respecting schedule). */
export async function getActiveConfigForDate(date: Date): Promise<AppLockConfig> {
  const resolved = await resolvePresetForDate(date);
  if (resolved?.type === 'skip_lock') {
    return { ...(await getAppLockConfig()), enabled: false };
  }
  if (resolved?.type === 'preset') {
    const presets = await getPresets();
    const preset = presets.find((p) => p.id === resolved.presetId);
    if (preset) return preset.config;
  }
  const activeId = await getActivePresetId();
  if (activeId) {
    const presets = await getPresets();
    const preset = presets.find((p) => p.id === activeId);
    if (preset) return preset.config;
  }
  return getAppLockConfig();
}
