import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'daily12stepper_theme_mode';
const REMINDER_ENABLED_KEY = 'daily12stepper_reminder_enabled';
const REMINDER_TIME_KEY = 'daily12stepper_reminder_time';

export async function getThemeMode(): Promise<ThemeMode> {
  try {
    const v = await AsyncStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, mode);
}

export async function getDailyReminderEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
    return v === 'true';
  } catch {}
  return false;
}

export async function setDailyReminderEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, String(enabled));
}

export async function getDailyReminderTime(): Promise<string> {
  try {
    const v = await AsyncStorage.getItem(REMINDER_TIME_KEY);
    if (v) return v;
  } catch {}
  return '09:00';
}

export async function setDailyReminderTime(time: string): Promise<void> {
  await AsyncStorage.setItem(REMINDER_TIME_KEY, time);
}

const COMMITMENT_BYPASS_KEY = 'daily12stepper_commitment_bypass_date';
const COMMITMENT_WEB_PREFIX = 'daily12stepper_commitment_';

export async function getCommitmentForDateWeb(date: string): Promise<{
  date: string;
  commitmentType: string;
  customDurationMinutes: number | null;
  createdAt: string;
} | null> {
  try {
    const v = await AsyncStorage.getItem(COMMITMENT_WEB_PREFIX + date);
    if (!v) return null;
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export async function saveCommitmentWeb(
  date: string,
  commitmentType: string,
  customDurationMinutes: number | null
): Promise<void> {
  await AsyncStorage.setItem(
    COMMITMENT_WEB_PREFIX + date,
    JSON.stringify({
      date,
      commitmentType,
      customDurationMinutes,
      createdAt: new Date().toISOString(),
    })
  );
}

export async function getCommitmentBypassedForDate(date: string): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(COMMITMENT_BYPASS_KEY);
    return v === date;
  } catch {}
  return false;
}

export async function setCommitmentBypassed(date: string): Promise<void> {
  await AsyncStorage.setItem(COMMITMENT_BYPASS_KEY, date);
}

export type PrayerLanguage = 'traditional' | 'modern';

const PRAYER_LANGUAGE_KEY = 'daily12stepper_prayer_language';

export async function getPrayerLanguage(): Promise<PrayerLanguage> {
  try {
    const v = await AsyncStorage.getItem(PRAYER_LANGUAGE_KEY);
    if (v === 'traditional' || v === 'modern') return v;
  } catch {}
  return 'traditional';
}

export async function setPrayerLanguage(lang: PrayerLanguage): Promise<void> {
  await AsyncStorage.setItem(PRAYER_LANGUAGE_KEY, lang);
}
