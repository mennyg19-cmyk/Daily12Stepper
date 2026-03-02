import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';

export interface Step5Sharing {
  id: string;
  personName: string;
  whatShared: string;
  notes: string;
  orderIndex: number;
  date: string;
  createdAt: string;
}

export async function getStep5SharingsForDate(date: string): Promise<Step5Sharing[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM step5_sharings WHERE date = ? ORDER BY order_index ASC, created_at ASC',
    [date]
  );
  return rows.map((r) => ({
    id: r.id,
    personName: r.person_name,
    whatShared: r.what_shared ?? '',
    notes: r.notes ?? '',
    orderIndex: r.order_index,
    date: r.date,
    createdAt: r.created_at,
  }));
}

export async function addStep5Sharing(
  date: string,
  personName: string,
  whatShared: string,
  notes: string
): Promise<Step5Sharing> {
  const db = await getDatabase();
  const id = `s5_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const maxOrder = await db.getFirstAsync<{ max: number }>(
    'SELECT COALESCE(MAX(order_index), -1) + 1 as max FROM step5_sharings WHERE date = ?',
    [date]
  );
  const orderIndex = maxOrder?.max ?? 0;
  await db.runAsync(
    'INSERT INTO step5_sharings (id, person_name, what_shared, notes, order_index, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, personName.trim(), whatShared.trim(), notes.trim(), orderIndex, date, now]
  );
  const rows = await db.getAllAsync<any>('SELECT * FROM step5_sharings WHERE id = ?', [id]);
  const r = rows[0]!;
  return {
    id: r.id,
    personName: r.person_name,
    whatShared: r.what_shared ?? '',
    notes: r.notes ?? '',
    orderIndex: r.order_index,
    date: r.date,
    createdAt: r.created_at,
  };
}

export async function updateStep5Sharing(
  id: string,
  updates: Partial<Pick<Step5Sharing, 'personName' | 'whatShared' | 'notes'>>
): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM step5_sharings WHERE id = ?', [id]);
  if (!row) return;
  const personName = updates.personName ?? row.person_name;
  const whatShared = updates.whatShared ?? row.what_shared ?? '';
  const notes = updates.notes ?? row.notes ?? '';
  await db.runAsync(
    'UPDATE step5_sharings SET person_name = ?, what_shared = ?, notes = ? WHERE id = ?',
    [personName, whatShared, notes, id]
  );
}

export async function deleteStep5Sharing(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM step5_sharings WHERE id = ?', [id]);
}
