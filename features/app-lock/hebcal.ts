/**
 * Hebcal API — fetch Jewish holidays for preset scheduling.
 * https://www.hebcal.com/home/195/jewish-calendar-rest-api
 * No API key required. CC BY 4.0.
 */
import type { JewishHolidayItem } from './types';

const HEBCAL_BASE = 'https://www.hebcal.com/hebcal';

export interface HebcalParams {
  year: number;
  /** Israel vs Diaspora */
  inIsrael?: boolean;
  /** Include major holidays */
  maj?: boolean;
  /** Include minor holidays */
  min?: boolean;
  /** Include modern holidays (Yom HaShoah, etc.) */
  mod?: boolean;
  /** Include minor fasts */
  nx?: boolean;
}

export interface HebcalResponse {
  title: string;
  items: Array<{
    title: string;
    date: string;
    hdate?: string;
    category: string;
    subcat?: string;
    yomtov?: boolean;
    hebrew?: string;
    link?: string;
    memo?: string;
  }>;
}

/** Fetch Jewish holidays for a year from Hebcal */
export async function fetchJewishHolidays(params: HebcalParams): Promise<JewishHolidayItem[]> {
  const { year, inIsrael = false, maj = true, min = true, mod = true, nx = true } = params;
  const url = new URL(HEBCAL_BASE);
  url.searchParams.set('v', '1');
  url.searchParams.set('cfg', 'json');
  url.searchParams.set('year', String(year));
  if (maj) url.searchParams.set('maj', 'on');
  if (min) url.searchParams.set('min', 'on');
  if (mod) url.searchParams.set('mod', 'on');
  if (nx) url.searchParams.set('nx', 'on');
  if (inIsrael) url.searchParams.set('i', 'on');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Hebcal API error: ${res.status}`);
  const data: HebcalResponse = await res.json();

  return (data.items ?? []).filter((i) => i.category === 'holiday') as JewishHolidayItem[];
}

/** Extract a stable holiday slug from Hebcal link (e.g. "rosh-hashana-2025" -> "rosh-hashana") */
export function getHolidaySlug(item: JewishHolidayItem): string {
  if (item.link) {
    const m = item.link.match(/hebcal\.com\/h\/([^?]+)/);
    if (m) {
      const slug = m[1];
      const yearMatch = slug.match(/-20\d{2}$/);
      return yearMatch ? slug.replace(/-20\d{2}$/, '') : slug;
    }
  }
  return item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

import type { HolidayCategory } from './types';

/** Chol Hamoed pattern in title (CH''M, CH"M, חוה"מ, חוה״מ) */
const CHOL_HAMOED_PATTERN = /CH['"״]*M|חוה["'״]*מ|chol\s*hamoed/i;

/** Check if a Hebcal item matches a holiday category */
export function itemMatchesCategory(item: JewishHolidayItem, category: HolidayCategory): boolean {
  switch (category) {
    case 'major':
      return item.subcat === 'major';
    case 'minor':
      return item.subcat === 'minor';
    case 'chol_hamoed':
      return CHOL_HAMOED_PATTERN.test(item.title) || (item.hebrew != null && CHOL_HAMOED_PATTERN.test(item.hebrew));
    case 'assur_bemelacha':
      return item.yomtov === true;
    default:
      return false;
  }
}

/** Check if a date string (YYYY-MM-DD) falls on a Jewish holiday matching category or slug */
export function isDateOnHoliday(
  dateStr: string,
  holidays: JewishHolidayItem[],
  options?: { holidaySlug?: string; holidayCategory?: HolidayCategory }
): boolean {
  const dateOnly = dateStr.slice(0, 10);
  return holidays.some((h) => {
    const hDate = h.date.startsWith('2') ? h.date.slice(0, 10) : h.date;
    if (hDate !== dateOnly) return false;
    if (options?.holidayCategory) {
      return itemMatchesCategory(h, options.holidayCategory);
    }
    if (options?.holidaySlug) {
      const slug = getHolidaySlug(h);
      return slug === options.holidaySlug || slug.startsWith(options.holidaySlug + '-');
    }
    return true;
  });
}

/** Get holidays for a date range (caches by year) */
const yearCache = new Map<number, JewishHolidayItem[]>();

export async function getHolidaysForDateRange(
  startDate: string,
  endDate: string,
  inIsrael: boolean
): Promise<JewishHolidayItem[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const years = new Set<number>();
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) years.add(y);

  const all: JewishHolidayItem[] = [];
  for (const year of years) {
    let cached = yearCache.get(year);
    if (!cached) {
      cached = await fetchJewishHolidays({ year, inIsrael });
      yearCache.set(year, cached);
    }
    all.push(...cached);
  }

  const startStr = startDate.slice(0, 10);
  const endStr = endDate.slice(0, 10);
  return all.filter((h) => {
    const d = h.date.slice(0, 10);
    return d >= startStr && d <= endStr;
  });
}
