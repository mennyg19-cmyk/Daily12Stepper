import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';

export async function recordMeditationSession(date: string, durationSeconds: number): Promise<void> {
  if (!(await isSQLiteAvailable())) return;
  const db = await getDatabase();
  const id = `med_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO meditation_sessions (id, date, duration_seconds, created_at) VALUES (?, ?, ?, ?)',
    [id, date, durationSeconds, now]
  );
}

export async function getMeditationSecondsForDate(date: string): Promise<number> {
  if (!(await isSQLiteAvailable())) return 0;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(duration_seconds), 0) as total FROM meditation_sessions WHERE date = ?',
    [date]
  );
  return row?.total ?? 0;
}

export async function getMeditationSecondsForDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  if (!(await isSQLiteAvailable())) return 0;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(duration_seconds), 0) as total FROM meditation_sessions WHERE date >= ? AND date <= ?',
    [startDate, endDate]
  );
  return row?.total ?? 0;
}
