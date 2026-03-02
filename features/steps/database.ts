import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';

export interface StepworkSession {
  id: string;
  stepNumber: number;
  date: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
}

export async function getStepworkForStepAndDate(
  stepNumber: number,
  date: string
): Promise<StepworkSession[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    step_number: number;
    date: string;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number;
  }>(
    'SELECT * FROM stepwork_sessions WHERE step_number = ? AND date = ? ORDER BY started_at',
    [stepNumber, date]
  );
  return rows.map((r) => ({
    id: r.id,
    stepNumber: r.step_number,
    date: r.date,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationSeconds: r.duration_seconds,
  }));
}

export async function getSponsorInstructions(stepNumber: number): Promise<string | null> {
  if (!(await isSQLiteAvailable())) return null;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ sponsor_instructions: string | null }>(
    'SELECT sponsor_instructions FROM step_modules WHERE step_number = ?',
    [stepNumber]
  );
  return row?.sponsor_instructions ?? null;
}

export async function saveSponsorInstructions(
  stepNumber: number,
  instructions: string | null
): Promise<void> {
  const db = await getDatabase();
  const exists = await db.getFirstAsync(
    'SELECT 1 FROM step_modules WHERE step_number = ?',
    [stepNumber]
  );
  if (exists) {
    await db.runAsync(
      'UPDATE step_modules SET sponsor_instructions = ? WHERE step_number = ?',
      [instructions ?? '', stepNumber]
    );
  } else {
    await db.runAsync(
      'INSERT INTO step_modules (step_number, sponsor_instructions, base_content_json) VALUES (?, ?, NULL)',
      [stepNumber, instructions ?? '']
    );
  }
}

export async function startStepworkSession(
  stepNumber: number,
  date: string
): Promise<string> {
  const db = await getDatabase();
  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO stepwork_sessions (id, step_number, date, started_at, ended_at, duration_seconds)
     VALUES (?, ?, ?, ?, NULL, 0)`,
    [id, stepNumber, date, now]
  );
  return id;
}

export async function endStepworkSession(
  sessionId: string,
  durationSeconds: number
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE stepwork_sessions SET ended_at = ?, duration_seconds = ? WHERE id = ?',
    [now, durationSeconds, sessionId]
  );
}

export async function getTotalDurationForStepAndDate(
  stepNumber: number,
  date: string
): Promise<number> {
  if (!(await isSQLiteAvailable())) return 0;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(duration_seconds), 0) as total FROM stepwork_sessions WHERE step_number = ? AND date = ?',
    [stepNumber, date]
  );
  return row?.total ?? 0;
}

export async function getStepsDoneToday(date: string): Promise<Set<number>> {
  if (!(await isSQLiteAvailable())) return new Set();
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ step_number: number }>(
    'SELECT step_number FROM step_completions WHERE date = ?',
    [date]
  );
  return new Set(rows.map((r) => r.step_number));
}

export async function markStepDone(stepNumber: number, date: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO step_completions (step_number, date, completed_at) VALUES (?, ?, ?)',
    [stepNumber, date, now]
  );
}

export interface StepDurationRow {
  stepNumber: number;
  date: string;
  totalSeconds: number;
}

export async function getStepDurationsByDateRange(
  startDate: string,
  endDate: string
): Promise<StepDurationRow[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ step_number: number; date: string; total: number }>(
    `SELECT step_number, date, SUM(duration_seconds) as total
     FROM stepwork_sessions
     WHERE date >= ? AND date <= ?
     GROUP BY step_number, date`,
    [startDate, endDate]
  );
  return rows.map((r) => ({
    stepNumber: r.step_number,
    date: r.date,
    totalSeconds: r.total,
  }));
}

export async function getTotalStepworkSecondsForDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  if (!(await isSQLiteAvailable())) return 0;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(duration_seconds), 0) as total
     FROM stepwork_sessions
     WHERE date >= ? AND date <= ?`,
    [startDate, endDate]
  );
  return row?.total ?? 0;
}
