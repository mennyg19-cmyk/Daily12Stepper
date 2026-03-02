import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';

export interface Step4Person {
  id: string;
  personName: string;
  orderIndex: number;
  createdAt: string;
}

export interface Step4Resentment {
  id: string;
  personId: string;
  description: string;
  column3Done: boolean;
  column4Done: boolean;
  column3Text: string;
  column4Text: string;
  defectsJson: string | null;
  orderIndex: number;
  createdAt: string;
}

export async function getStep4People(): Promise<Step4Person[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT id, person_name, order_index, created_at FROM step4_people ORDER BY order_index ASC, created_at ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    personName: r.person_name,
    orderIndex: r.order_index,
    createdAt: r.created_at,
  }));
}

export async function addStep4Person(personName: string): Promise<Step4Person> {
  const db = await getDatabase();
  const id = `p4_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const maxOrder = await db.getFirstAsync<{ max: number }>(
    'SELECT COALESCE(MAX(order_index), -1) + 1 as max FROM step4_people'
  );
  const orderIndex = maxOrder?.max ?? 0;
  await db.runAsync(
    'INSERT INTO step4_people (id, person_name, order_index, created_at) VALUES (?, ?, ?, ?)',
    [id, personName.trim(), orderIndex, now]
  );
  const rows = await db.getAllAsync<any>('SELECT * FROM step4_people WHERE id = ?', [id]);
  const r = rows[0]!;
  return {
    id: r.id,
    personName: r.person_name,
    orderIndex: r.order_index,
    createdAt: r.created_at,
  };
}

export async function deleteStep4Person(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM step4_people WHERE id = ?', [id]);
}

export async function getStep4Resentments(personId: string): Promise<Step4Resentment[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM step4_resentments WHERE person_id = ? ORDER BY order_index ASC, created_at ASC',
    [personId]
  );
  return rows.map((r) => ({
    id: r.id,
    personId: r.person_id,
    description: r.description,
    column3Done: r.column_3_done === 1,
    column4Done: r.column_4_done === 1,
    column3Text: r.column_3_text ?? '',
    column4Text: r.column_4_text ?? '',
    defectsJson: r.defects_json,
    orderIndex: r.order_index,
    createdAt: r.created_at,
  }));
}

export async function addStep4Resentment(personId: string, description: string): Promise<Step4Resentment> {
  const db = await getDatabase();
  const id = `r4_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const maxOrder = await db.getFirstAsync<{ max: number }>(
    'SELECT COALESCE(MAX(order_index), -1) + 1 as max FROM step4_resentments WHERE person_id = ?',
    [personId]
  );
  const orderIndex = maxOrder?.max ?? 0;
  await db.runAsync(
    'INSERT INTO step4_resentments (id, person_id, description, column_3_done, column_4_done, column_3_text, column_4_text, order_index, created_at) VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?)',
    [id, personId, description.trim(), '', '', orderIndex, now]
  );
  const rows = await db.getAllAsync<any>('SELECT * FROM step4_resentments WHERE id = ?', [id]);
  const r = rows[0]!;
  return {
    id: r.id,
    personId: r.person_id,
    description: r.description,
    column3Done: r.column_3_done === 1,
    column4Done: r.column_4_done === 1,
    column3Text: r.column_3_text ?? '',
    column4Text: r.column_4_text ?? '',
    defectsJson: r.defects_json,
    orderIndex: r.order_index,
    createdAt: r.created_at,
  };
}

export async function updateStep4Resentment(
  id: string,
  updates: Partial<Pick<Step4Resentment, 'description' | 'column3Done' | 'column4Done' | 'column3Text' | 'column4Text' | 'defectsJson'>>
): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM step4_resentments WHERE id = ?', [id]);
  if (!row) return;
  const description = updates.description ?? row.description;
  const column3Done = updates.column3Done !== undefined ? (updates.column3Done ? 1 : 0) : row.column_3_done;
  const column4Done = updates.column4Done !== undefined ? (updates.column4Done ? 1 : 0) : row.column_4_done;
  const column3Text = updates.column3Text ?? row.column_3_text ?? '';
  const column4Text = updates.column4Text ?? row.column_4_text ?? '';
  const defectsJson = updates.defectsJson !== undefined ? updates.defectsJson : row.defects_json;
  await db.runAsync(
    'UPDATE step4_resentments SET description = ?, column_3_done = ?, column_4_done = ?, column_3_text = ?, column_4_text = ?, defects_json = ? WHERE id = ?',
    [description, column3Done, column4Done, column3Text, column4Text, defectsJson, id]
  );
}

export async function deleteStep4Resentment(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM step4_resentments WHERE id = ?', [id]);
}

export interface Step4Standalone {
  id: string;
  type: 'resentment' | 'fear' | 'harm';
  who: string;
  why: string;
  affects: string;
  myPart: string;
  createdAt: string;
}

export async function getStep4Standalone(): Promise<Step4Standalone[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM step4_standalone ORDER BY created_at ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    who: r.who,
    why: r.why,
    affects: r.affects,
    myPart: r.my_part,
    createdAt: r.created_at,
  }));
}

export async function addStep4Standalone(
  type: 'resentment' | 'fear' | 'harm',
  who: string,
  why: string,
  affects: string,
  myPart: string
): Promise<Step4Standalone> {
  const db = await getDatabase();
  const id = `s4_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO step4_standalone (id, type, who, why, affects, my_part, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, type, who.trim(), why.trim(), affects.trim(), myPart.trim(), now]
  );
  const rows = await db.getAllAsync<any>('SELECT * FROM step4_standalone WHERE id = ?', [id]);
  const r = rows[0]!;
  return {
    id: r.id,
    type: r.type,
    who: r.who,
    why: r.why,
    affects: r.affects,
    myPart: r.my_part,
    createdAt: r.created_at,
  };
}

export async function updateStep4Standalone(
  id: string,
  updates: Partial<Pick<Step4Standalone, 'who' | 'why' | 'affects' | 'myPart'>>
): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM step4_standalone WHERE id = ?', [id]);
  if (!row) return;
  const who = updates.who ?? row.who ?? '';
  const why = updates.why ?? row.why ?? '';
  const affects = updates.affects ?? row.affects ?? '';
  const myPart = updates.myPart ?? row.my_part ?? '';
  await db.runAsync(
    'UPDATE step4_standalone SET who = ?, why = ?, affects = ?, my_part = ? WHERE id = ?',
    [who, why, affects, myPart, id]
  );
}

export async function deleteStep4Standalone(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM step4_standalone WHERE id = ?', [id]);
}

/** Get all defects from Step 4 in order of first appearance (for Step 6) */
export async function getStep4DefectsInOrder(): Promise<string[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const [resentmentRows, standaloneRows] = await Promise.all([
    db.getAllAsync<any>(
      'SELECT column_3_text, column_4_text, defects_json FROM step4_resentments ORDER BY created_at ASC'
    ),
    db.getAllAsync<any>('SELECT affects, my_part FROM step4_standalone ORDER BY created_at ASC'),
  ]);
  const seen = new Set<string>();
  const result: string[] = [];
  const addDefects = (parts: string[]) => {
    for (const p of parts) {
      const defect = p.trim();
      if (defect && !seen.has(defect)) {
        seen.add(defect);
        result.push(defect);
      }
    }
  };
  for (const r of resentmentRows) {
    const parts: string[] = [];
    if (r.column_4_text) {
      parts.push(...r.column_4_text.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean));
    }
    if (r.column_3_text) {
      parts.push(...r.column_3_text.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean));
    }
    if (r.defects_json) {
      try {
        const arr = JSON.parse(r.defects_json) as string[];
        if (Array.isArray(arr)) parts.push(...arr);
      } catch {
        // Ignore
      }
    }
    addDefects(parts);
  }
  for (const r of standaloneRows) {
    const parts: string[] = [];
    if (r.affects) parts.push(...r.affects.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean));
    if (r.my_part) parts.push(...r.my_part.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean));
    addDefects(parts);
  }
  return result;
}
