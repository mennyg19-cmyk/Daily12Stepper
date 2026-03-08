/**
 * Profile — name, birthday, addictions, sponsor work time.
 * Stored locally (AsyncStorage) for greetings and celebrations.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'daily12stepper_profile';
const ADDICTIONS_KEY = 'daily12stepper_addictions';
const SPONSOR_WORK_TIME_KEY = 'daily12stepper_sponsor_work_time_minutes';
const CARDS_COLLAPSED_KEY = 'daily12stepper_cards_collapsed';

export interface Profile {
  name: string;
  birthday: string | null; // YYYY-MM-DD
}

export interface Addiction {
  id: string;
  name: string;
  startDatetime: string | null; // ISO string
  orderIndex: number;
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  birthday: null,
};

export async function getProfile(): Promise<Profile> {
  try {
    const v = await AsyncStorage.getItem(PROFILE_KEY);
    if (v) {
      const parsed = JSON.parse(v);
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_PROFILE };
}

export async function saveProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getAddictions(): Promise<Addiction[]> {
  try {
    const v = await AsyncStorage.getItem(ADDICTIONS_KEY);
    if (v) {
      const parsed = JSON.parse(v) as Addiction[];
      return parsed.sort((a, b) => a.orderIndex - b.orderIndex);
    }
  } catch {}
  return [];
}

export async function saveAddictions(addictions: Addiction[]): Promise<void> {
  await AsyncStorage.setItem(ADDICTIONS_KEY, JSON.stringify(addictions));
}

export async function addAddiction(name: string): Promise<Addiction> {
  const list = await getAddictions();
  const maxOrder = list.length > 0 ? Math.max(...list.map((a) => a.orderIndex)) : -1;
  const addiction: Addiction = {
    id: `addiction_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim(),
    startDatetime: null,
    orderIndex: maxOrder + 1,
  };
  await saveAddictions([...list, addiction]);
  return addiction;
}

export async function updateAddiction(id: string, updates: Partial<Pick<Addiction, 'name' | 'startDatetime'>>): Promise<void> {
  const list = await getAddictions();
  const updated = list.map((a) => (a.id === id ? { ...a, ...updates } : a));
  await saveAddictions(updated);
}

export async function deleteAddiction(id: string): Promise<void> {
  const list = await getAddictions().then((a) => a.filter((x) => x.id !== id));
  await saveAddictions(list);
}

export async function getSponsorWorkTimeMinutes(): Promise<number | null> {
  try {
    const v = await AsyncStorage.getItem(SPONSOR_WORK_TIME_KEY);
    if (v) {
      const n = parseInt(v, 10);
      if (!isNaN(n) && n > 0) return n;
    }
  } catch {}
  return null;
}

export async function setSponsorWorkTimeMinutes(minutes: number | null): Promise<void> {
  if (minutes != null && minutes > 0) {
    await AsyncStorage.setItem(SPONSOR_WORK_TIME_KEY, String(minutes));
  } else {
    await AsyncStorage.removeItem(SPONSOR_WORK_TIME_KEY);
  }
}

export async function getCardsCollapsed(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(CARDS_COLLAPSED_KEY);
    return v === 'true';
  } catch {}
  return false;
}

export async function setCardsCollapsed(collapsed: boolean): Promise<void> {
  await AsyncStorage.setItem(CARDS_COLLAPSED_KEY, collapsed ? 'true' : 'false');
}

/** Check if today is the user's birthday (MM-DD match) */
export function isBirthdayToday(birthday: string | null): boolean {
  if (!birthday) return false;
  const [, m, d] = birthday.split('-').map(Number);
  const now = new Date();
  return now.getMonth() + 1 === (m ?? 0) && now.getDate() === (d ?? 0);
}

/** Get greeting with optional name */
export function getGreetingWithName(name: string | null): string {
  const h = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (h >= 12) timeGreeting = h < 17 ? 'Good afternoon' : 'Good evening';
  if (name?.trim()) {
    return `${timeGreeting}, ${name.trim()}`;
  }
  return timeGreeting;
}
