import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import { getStep4DefectsInOrder } from './step4Database';

export interface StepAmends {
  id: string;
  personName: string;
  notes: string;
  orderIndex: number;
  createdAt: string;
}

export interface StepAmendsWithDone extends StepAmends {
  doneToday: boolean;
}

export async function getStepWorkData(
  stepNumber: number,
  date: string
): Promise<Record<string, unknown> | null> {
  if (!(await isSQLiteAvailable())) return null;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ data_json: string }>(
    'SELECT data_json FROM step_work_data WHERE step_number = ? AND date = ?',
    [stepNumber, date]
  );
  if (!row) return null;
  try {
    return JSON.parse(row.data_json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function saveStepWorkData(
  stepNumber: number,
  date: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const json = JSON.stringify(data);
  await db.runAsync(
    `INSERT OR REPLACE INTO step_work_data (step_number, date, data_json, updated_at) VALUES (?, ?, ?, ?)`,
    [stepNumber, date, json, now]
  );
}

export async function getAmendsList(): Promise<StepAmends[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    person_name: string;
    notes: string;
    order_index: number;
    created_at: string;
  }>('SELECT * FROM step_amends ORDER BY order_index ASC, created_at ASC');
  return rows.map((r) => ({
    id: r.id,
    personName: r.person_name,
    notes: r.notes,
    orderIndex: r.order_index,
    createdAt: r.created_at,
  }));
}

export async function addAmends(personName: string, notes: string): Promise<StepAmends> {
  const db = await getDatabase();
  const id = `amends_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const maxOrder = await db.getFirstAsync<{ max: number }>(
    'SELECT COALESCE(MAX(order_index), -1) + 1 as max FROM step_amends'
  );
  const orderIndex = maxOrder?.max ?? 0;
  await db.runAsync(
    'INSERT INTO step_amends (id, person_name, notes, order_index, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, personName.trim(), notes.trim(), orderIndex, now]
  );
  const rows = await db.getAllAsync<{
    id: string;
    person_name: string;
    notes: string;
    order_index: number;
    created_at: string;
  }>('SELECT * FROM step_amends WHERE id = ?', [id]);
  const r = rows[0]!;
  return {
    id: r.id,
    personName: r.person_name,
    notes: r.notes,
    orderIndex: r.order_index,
    createdAt: r.created_at,
  };
}

export async function deleteAmends(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM step_amends WHERE id = ?', [id]);
}

export async function getAmendsDoneForDate(date: string): Promise<Set<string>> {
  if (!(await isSQLiteAvailable())) return new Set();
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ amends_id: string }>(
    'SELECT amends_id FROM step_amends_completions WHERE date = ?',
    [date]
  );
  return new Set(rows.map((r) => r.amends_id));
}

export async function getAmendsNotesForDate(date: string): Promise<Record<string, string>> {
  if (!(await isSQLiteAvailable())) return {};
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ amends_id: string; feedback_notes: string | null }>(
    'SELECT amends_id, feedback_notes FROM step_amends_completions WHERE date = ?',
    [date]
  );
  const result: Record<string, string> = {};
  for (const r of rows) {
    if (r.feedback_notes) result[r.amends_id] = r.feedback_notes;
  }
  return result;
}

export async function updateAmendsCompletionNotes(amendsId: string, date: string, notes: string): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync(
    'SELECT 1 FROM step_amends_completions WHERE amends_id = ? AND date = ?',
    [amendsId, date]
  );
  if (existing) {
    await db.runAsync(
      'UPDATE step_amends_completions SET feedback_notes = ? WHERE amends_id = ? AND date = ?',
      [notes, amendsId, date]
    );
  }
}

/** Get Step 6 defects (Step 4 + manual) with ready set, for use in Step 6 and Step 7. */
export async function getStep6DefectsOrdered(date: string): Promise<{
  defects: string[];
  readyDefects: string[];
}> {
  const [step4Defects, data] = await Promise.all([
    getStep4DefectsInOrder(),
    getStepWorkData(6, date),
  ]);
  const manual = (data?.manualDefects as string[]) ?? [];
  const merged = [...step4Defects];
  for (const m of manual) {
    if (m.trim() && !merged.includes(m.trim())) merged.push(m.trim());
  }
  const ready = (data?.readyDefects as string[]) ?? [];
  return { defects: merged, readyDefects: ready };
}

export async function getStep1Inventory(): Promise<string> {
  if (!(await isSQLiteAvailable())) return '';
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ content: string }>(
    'SELECT content FROM step1_inventory WHERE id = ?',
    ['default']
  );
  return row?.content ?? '';
}

export async function getStep2Data(): Promise<{ ready: boolean; powerDescription: string }> {
  if (!(await isSQLiteAvailable())) return { ready: false, powerDescription: '' };
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ ready: number; power_description: string }>(
    'SELECT ready, power_description FROM step2_data WHERE id = ?',
    ['default']
  );
  return {
    ready: row?.ready === 1,
    powerDescription: row?.power_description ?? '',
  };
}

export async function saveStep2Data(ready: boolean, powerDescription: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO step2_data (id, ready, power_description, updated_at) VALUES (?, ?, ?, ?)',
    ['default', ready ? 1 : 0, powerDescription, now]
  );
}

export async function saveStep1Inventory(content: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO step1_inventory (id, content, updated_at) VALUES (?, ?, ?)',
    ['default', content, now]
  );
}

export async function toggleAmendsDone(amendsId: string, date: string, notes?: string): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync(
    'SELECT 1 FROM step_amends_completions WHERE amends_id = ? AND date = ?',
    [amendsId, date]
  );
  const now = new Date().toISOString();
  if (existing) {
    await db.runAsync(
      'DELETE FROM step_amends_completions WHERE amends_id = ? AND date = ?',
      [amendsId, date]
    );
    return false;
  } else {
    const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(step_amends_completions)");
    const hasNotes = cols.some((c) => c.name === 'feedback_notes');
    if (hasNotes) {
      await db.runAsync(
        'INSERT INTO step_amends_completions (amends_id, date, completed_at, feedback_notes) VALUES (?, ?, ?, ?)',
        [amendsId, date, now, notes ?? '']
      );
    } else {
      await db.runAsync(
        'INSERT INTO step_amends_completions (amends_id, date, completed_at) VALUES (?, ?, ?)',
        [amendsId, date, now]
      );
    }
    return true;
  }
}
