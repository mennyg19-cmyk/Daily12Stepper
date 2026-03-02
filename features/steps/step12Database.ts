import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import * as Clipboard from 'expo-clipboard';

export interface Step12Instruction {
  id: string;
  stepNumber: number;
  instructionText: string;
  orderIndex: number;
  createdAt: string;
}

export interface Step12Sponsee {
  id: string;
  name: string;
  currentStepNumber: number;
  notes: string;
  createdAt: string;
}

export async function getStep12Instructions(): Promise<Step12Instruction[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM step12_instructions ORDER BY order_index ASC, step_number ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    stepNumber: r.step_number,
    instructionText: r.instruction_text ?? '',
    orderIndex: r.order_index,
    createdAt: r.created_at,
  }));
}

export async function updateStep12Instruction(id: string, instructionText: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE step12_instructions SET instruction_text = ? WHERE id = ?', [
    instructionText,
    id,
  ]);
}

export async function getStep12Sponsees(): Promise<Step12Sponsee[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM step12_sponsees ORDER BY created_at ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    currentStepNumber: r.current_step_number ?? 1,
    notes: r.notes ?? '',
    createdAt: r.created_at,
  }));
}

export async function addStep12Sponsee(name: string): Promise<Step12Sponsee> {
  const db = await getDatabase();
  const id = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO step12_sponsees (id, name, current_step_number, notes, created_at) VALUES (?, ?, 1, ?, ?)',
    [id, name.trim(), '', now]
  );
  const rows = await db.getAllAsync<any>('SELECT * FROM step12_sponsees WHERE id = ?', [id]);
  const r = rows[0]!;
  return {
    id: r.id,
    name: r.name,
    currentStepNumber: r.current_step_number ?? 1,
    notes: r.notes ?? '',
    createdAt: r.created_at,
  };
}

export async function updateStep12Sponsee(
  id: string,
  updates: Partial<Pick<Step12Sponsee, 'name' | 'currentStepNumber' | 'notes'>>
): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM step12_sponsees WHERE id = ?', [id]);
  if (!row) return;
  const name = updates.name ?? row.name;
  const currentStepNumber = updates.currentStepNumber ?? row.current_step_number ?? 1;
  const notes = updates.notes ?? row.notes ?? '';
  await db.runAsync(
    'UPDATE step12_sponsees SET name = ?, current_step_number = ?, notes = ? WHERE id = ?',
    [name, currentStepNumber, notes, id]
  );
}

export async function deleteStep12Sponsee(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM step12_sponsees WHERE id = ?', [id]);
}

export async function copyInstructionToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}
