import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';

export interface Step7Episode {
  id: string;
  defectName: string;
  whenText: string;
  whyText: string;
  betterResponse: string;
  createdAt: string;
}

export async function getStep7EpisodesForDefect(defectName: string): Promise<Step7Episode[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM step7_episodes WHERE defect_name = ? ORDER BY created_at ASC',
    [defectName]
  );
  return rows.map((r) => ({
    id: r.id,
    defectName: r.defect_name,
    whenText: r.when_text ?? '',
    whyText: r.why_text ?? '',
    betterResponse: r.better_response ?? '',
    createdAt: r.created_at,
  }));
}

export async function addStep7Episode(
  defectName: string,
  whenText: string,
  whyText: string,
  betterResponse: string
): Promise<Step7Episode> {
  const db = await getDatabase();
  const id = `e7_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO step7_episodes (id, defect_name, when_text, why_text, better_response, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, defectName, whenText.trim(), whyText.trim(), betterResponse.trim(), now]
  );
  const rows = await db.getAllAsync<any>('SELECT * FROM step7_episodes WHERE id = ?', [id]);
  const r = rows[0]!;
  return {
    id: r.id,
    defectName: r.defect_name,
    whenText: r.when_text ?? '',
    whyText: r.why_text ?? '',
    betterResponse: r.better_response ?? '',
    createdAt: r.created_at,
  };
}

export async function updateStep7Episode(
  id: string,
  updates: Partial<Pick<Step7Episode, 'whenText' | 'whyText' | 'betterResponse'>>
): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM step7_episodes WHERE id = ?', [id]);
  if (!row) return;
  const whenText = updates.whenText ?? row.when_text ?? '';
  const whyText = updates.whyText ?? row.why_text ?? '';
  const betterResponse = updates.betterResponse ?? row.better_response ?? '';
  await db.runAsync(
    'UPDATE step7_episodes SET when_text = ?, why_text = ?, better_response = ? WHERE id = ?',
    [whenText, whyText, betterResponse, id]
  );
}

export async function deleteStep7Episode(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM step7_episodes WHERE id = ?', [id]);
}
