import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type { ExtraToolRow, ExtraToolCompletionRow } from '@/lib/database/schema';

export type ExtraToolFrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ExtraTool {
  id: string;
  name: string;
  frequencyType: ExtraToolFrequencyType;
  frequencyValue: number;
  reminderEnabled: boolean;
  reminderTime: string | null;
  orderIndex: number;
}

function rowToTool(row: ExtraToolRow): ExtraTool {
  return {
    id: row.id,
    name: row.name,
    frequencyType: row.frequency_type as ExtraTool['frequencyType'],
    frequencyValue: row.frequency_value,
    reminderEnabled: row.reminder_enabled === 1,
    reminderTime: row.reminder_time,
    orderIndex: row.order_index,
  };
}

export async function getExtraTools(): Promise<ExtraTool[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(extra_tools)");
  const hasToolType = cols.some((c) => c.name === 'tool_type');
  const rows = await db.getAllAsync<ExtraToolRow & { tool_type?: string }>(
    'SELECT * FROM extra_tools ORDER BY order_index ASC, name ASC'
  );
  const filtered = hasToolType ? rows.filter((r) => r.tool_type !== 'sponsor_work_time') : rows;
  return filtered.map(rowToTool);
}

export async function createExtraTool(
  name: string,
  frequencyType: ExtraToolFrequencyType,
  frequencyValue: number,
  reminderEnabled: boolean,
  reminderTime: string | null
): Promise<ExtraTool> {
  const db = await getDatabase();
  const id = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const maxOrder = await db.getFirstAsync<{ max: number }>(
    'SELECT COALESCE(MAX(order_index), -1) + 1 as max FROM extra_tools'
  );
  const orderIndex = maxOrder?.max ?? 0;

  await db.runAsync(
    `INSERT INTO extra_tools (id, name, frequency_type, frequency_value, reminder_enabled, reminder_time, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name.trim(), frequencyType, frequencyValue, reminderEnabled ? 1 : 0, reminderTime, orderIndex]
  );

  const rows = await db.getAllAsync<ExtraToolRow>('SELECT * FROM extra_tools WHERE id = ?', [id]);
  if (!rows[0]) throw new Error('Failed to create tool');
  return rowToTool(rows[0]);
}

export async function updateExtraTool(
  id: string,
  updates: Partial<Pick<ExtraTool, 'name' | 'frequencyType' | 'frequencyValue' | 'reminderEnabled' | 'reminderTime' | 'orderIndex'>>
): Promise<ExtraTool> {
  const db = await getDatabase();
  const tool = await db.getFirstAsync<ExtraToolRow>('SELECT * FROM extra_tools WHERE id = ?', [id]);
  if (!tool) throw new Error('Tool not found');

  const name = updates.name ?? tool.name;
  const frequencyType = updates.frequencyType ?? (tool.frequency_type as ExtraTool['frequencyType']);
  const frequencyValue = updates.frequencyValue ?? tool.frequency_value;
  const reminderEnabled = updates.reminderEnabled ?? (tool.reminder_enabled === 1);
  const reminderTime = updates.reminderTime !== undefined ? updates.reminderTime : tool.reminder_time;
  const orderIndex = updates.orderIndex ?? tool.order_index;

  await db.runAsync(
    `UPDATE extra_tools SET name = ?, frequency_type = ?, frequency_value = ?, reminder_enabled = ?, reminder_time = ?, order_index = ?
     WHERE id = ?`,
    [name.trim(), frequencyType, frequencyValue, reminderEnabled ? 1 : 0, reminderTime, orderIndex, id]
  );

  const rows = await db.getAllAsync<ExtraToolRow>('SELECT * FROM extra_tools WHERE id = ?', [id]);
  if (!rows[0]) throw new Error('Failed to update tool');
  return rowToTool(rows[0]);
}

export async function deleteExtraTool(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM extra_tools WHERE id = ?', [id]);
}

export async function getCompletionsForDate(date: string): Promise<Set<string>> {
  if (!(await isSQLiteAvailable())) return new Set();
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExtraToolCompletionRow>(
    'SELECT tool_id FROM extra_tool_completions WHERE date = ?',
    [date]
  );
  return new Set(rows.map((r) => r.tool_id));
}

export async function recordCompletion(toolId: string, date: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO extra_tool_completions (tool_id, date, completed_at) VALUES (?, ?, ?)',
    [toolId, date, now]
  );
}

export async function removeCompletion(toolId: string, date: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM extra_tool_completions WHERE tool_id = ? AND date = ?', [
    toolId,
    date,
  ]);
}
