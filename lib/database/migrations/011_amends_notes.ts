import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(step_amends_completions)");
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('feedback_notes')) {
    await db.execAsync(`ALTER TABLE step_amends_completions ADD COLUMN feedback_notes TEXT;`);
  }
}

export async function down(db: SQLiteDatabase): Promise<void> {
  // SQLite doesn't support DROP COLUMN easily
}
