import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';

export interface SobrietyStreak {
  id: string;
  startDatetime: string;
  endDatetime: string | null;
  daysCount: number | null;
  isRelapse: boolean;
  createdAt: string;
}

export async function getSobrietyStartDatetime(): Promise<string | null> {
  if (!(await isSQLiteAvailable())) return null;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ start_datetime: string | null; start_date: string | null }>(
    'SELECT start_datetime, start_date FROM sobriety_tracking WHERE id = ?',
    ['default']
  );
  if (!row) return null;
  if (row.start_datetime) return row.start_datetime;
  if (row.start_date) return `${row.start_date}T00:00:00.000Z`;
  return null;
}

export async function setSobrietyStartDatetime(isoDatetime: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO sobriety_tracking (id, start_date, start_datetime, updated_at) VALUES (?, ?, ?, ?)',
    ['default', isoDatetime.slice(0, 10), isoDatetime, now]
  );
}

export async function resetSobriety(): Promise<void> {
  const now = new Date().toISOString();
  await setSobrietyStartDatetime(now);
}

export async function resetSobrietyAt(datetime: string): Promise<void> {
  await setSobrietyStartDatetime(datetime);
}

/** Update start datetime without archiving (e.g. correct the time) */
export async function updateSobrietyStartDatetime(isoDatetime: string): Promise<void> {
  await setSobrietyStartDatetime(isoDatetime);
}

/** Archive current streak to history before resetting (for relapse) */
export async function archiveAndReset(isoDatetime: string): Promise<void> {
  if (!(await isSQLiteAvailable())) return;
  const db = await getDatabase();
  const current = await getSobrietyStartDatetime();
  if (current) {
    const start = new Date(current).getTime();
    const end = Date.now();
    const daysCount = Math.floor((end - start) / (24 * 60 * 60 * 1000));
    const id = `sh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await db.runAsync(
      'INSERT INTO sobriety_history (id, start_datetime, end_datetime, days_count, is_relapse, created_at) VALUES (?, ?, ?, ?, 1, ?)',
      [id, current, new Date().toISOString(), daysCount, new Date().toISOString()]
    );
  }
  await setSobrietyStartDatetime(isoDatetime);
}

export async function getSobrietyHistory(): Promise<SobrietyStreak[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM sobriety_history ORDER BY created_at DESC LIMIT 50'
  );
  return rows.map((r) => ({
    id: r.id,
    startDatetime: r.start_datetime,
    endDatetime: r.end_datetime,
    daysCount: r.days_count,
    isRelapse: r.is_relapse === 1,
    createdAt: r.created_at,
  }));
}

export function secondsSince(datetimeStr: string): number {
  const start = new Date(datetimeStr).getTime();
  return Math.floor((Date.now() - start) / 1000);
}

export function daysSince(dateStr: string): number {
  const start = new Date(dateStr);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}
