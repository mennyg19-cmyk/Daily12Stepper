/**
 * App Lock — types for phone lockdown until commitment.
 * Similar to Cape app: block/hide apps until user commits or completes steps.
 */

export type LockMode = 'full' | 'tiered';

export type BuiltInPresetId = 'light' | 'medium' | 'heavy' | 'extreme';

/** How this tier unlocks */
export type TierUnlockCondition =
  | 'steps'           // Unlock when required steps are done
  | 'sponsor_work_time_half'  // Unlock when 50% of sponsor work time done
  | 'sponsor_work_time_full'; // Unlock when 100% of sponsor work time done

/** Single tier: unlock these apps when user completes the unlock condition */
export interface AppLockTier {
  id: string;
  /** How to unlock: steps, half sponsor work time, or full sponsor work time */
  unlockCondition?: TierUnlockCondition;
  /** Step numbers that must be done to unlock (when unlockCondition is 'steps') */
  requiredSteps: number[];
  /** App identifiers (bundle ID on iOS, package name on Android) */
  appIds: string[];
  /** User-facing label */
  label: string;
}

export interface AppLockSchedule {
  /** When lock activates. "night" = e.g. 22:00 previous day, "morning" = e.g. 06:00 */
  activateAt: 'night' | 'morning' | 'custom';
  /** For custom: hour (0-23) when lock activates */
  customActivateHour?: number;
  /** For night: hour (e.g. 22 = 10 PM) */
  nightHour?: number;
  /** For morning: hour (e.g. 6 = 6 AM) */
  morningHour?: number;
}

export interface AppLockConfig {
  enabled: boolean;
  mode: LockMode;
  /** Apps always allowed (Phone, Messages, Emergency) */
  emergencyAppIds: string[];
  /** Tiered mode: which apps unlock at each tier */
  tiers: AppLockTier[];
  schedule: AppLockSchedule;
  /** Full mode: completely hide/block all except this app + emergency */
  fullModeBlockAll: boolean;
  /** Allow user to bypass lock for today ("not in the mood") */
  allowBypassForToday?: boolean;
}

/** A saved preset — built-in or user-created */
export interface AppLockPreset {
  id: string;
  name: string;
  notes: string;
  config: AppLockConfig;
  /** Built-in presets cannot be deleted, only customized and saved as copy */
  isBuiltIn?: boolean;
  builtInId?: BuiltInPresetId;
  createdAt?: string;
}

/** Day-of-week pattern for when a preset applies */
export type PresetDayPattern =
  | 'always'
  | 'weekends'
  | 'workdays'
  | 'custom';

/** Rule: which preset runs on which days */
export interface PresetScheduleRule {
  id: string;
  presetId: string;
  /** When this preset applies */
  dayPattern: PresetDayPattern;
  /** For custom: 0=Sun, 1=Mon, ..., 6=Sat */
  customDays?: number[];
  /** Priority: higher wins. Custom ranges and holiday overrides have higher priority. */
  priority?: number;
}

/** User-defined date range (vacation, etc.) — overrides day-of-week rules */
export interface PresetCustomRange {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  presetId: string;
  notes?: string;
}

/** Jewish holiday rule — what to do on specific holidays */
export type HolidayAction = 'use_preset' | 'skip_lock';

/** Granular holiday category for rules (from Hebcal) */
export type HolidayCategory =
  | 'major'           // subcat major (Rosh Hashana, Yom Kippur, Pesach, Sukkot, etc.)
  | 'minor'           // subcat minor (Tu BiShvat, Lag BaOmer, Purim, Chanukah candles, etc.)
  | 'chol_hamoed'     // Intermediate days of Pesach/Sukkot (title contains CH''M)
  | 'assur_bemelacha'; // Yom Tov — work forbidden (yomtov: true in Hebcal)

export interface PresetHolidayRule {
  id: string;
  /** Category-based rule (preferred) */
  holidayCategory?: HolidayCategory;
  /** Legacy: specific holiday slug (e.g. "rosh-hashana") */
  holidayId?: string;
  action: HolidayAction;
  /** For use_preset: which preset to use */
  presetId?: string;
}

/** Jewish holiday from Hebcal API */
export interface JewishHolidayItem {
  title: string;
  date: string;
  hdate?: string;
  category: string;
  subcat?: string;
  /** Yom Tov — assur b'melacha (work forbidden) */
  yomtov?: boolean;
  hebrew?: string;
  link?: string;
  memo?: string;
}

/** Full preset schedule config — which preset when */
export interface PresetScheduleConfig {
  /** Default preset when no rule matches */
  defaultPresetId: string | null;
  rules: PresetScheduleRule[];
  customRanges: PresetCustomRange[];
  holidayRules: PresetHolidayRule[];
  /** Enable Jewish holiday rules (fetches from Hebcal) */
  jewishHolidaysEnabled: boolean;
  /** Israel vs Diaspora for holiday dates */
  jewishCalendarInIsrael: boolean;
}

export const DEFAULT_PRESET_SCHEDULE_CONFIG: PresetScheduleConfig = {
  defaultPresetId: null,
  rules: [],
  customRanges: [],
  holidayRules: [],
  jewishHolidaysEnabled: false,
  jewishCalendarInIsrael: false,
};

export const DEFAULT_APP_LOCK_CONFIG: AppLockConfig = {
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
};
