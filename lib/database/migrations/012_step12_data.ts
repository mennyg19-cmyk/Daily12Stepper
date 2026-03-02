import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step12_instructions (
      id TEXT PRIMARY KEY,
      step_number INTEGER NOT NULL,
      instruction_text TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step12_sponsees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      current_step_number INTEGER NOT NULL DEFAULT 1,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
  // Seed default instructions for steps 1-12
  const existing = await db.getFirstAsync('SELECT 1 FROM step12_instructions LIMIT 1');
  if (!existing) {
    const now = new Date().toISOString();
    for (let i = 1; i <= 12; i++) {
      const id = `inst_${i}`;
      await db.runAsync(
        'INSERT INTO step12_instructions (id, step_number, instruction_text, order_index, created_at) VALUES (?, ?, ?, ?, ?)',
        [id, i, `Step ${i} instructions—edit as needed.`, i - 1, now]
      );
    }
  }
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS step12_sponsees;');
  await db.execAsync('DROP TABLE IF EXISTS step12_instructions;');
}
