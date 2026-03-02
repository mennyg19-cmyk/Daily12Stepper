import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  // Step 1 powerless inventory — single row, editable anytime
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step1_inventory (
      id TEXT PRIMARY KEY DEFAULT 'default',
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);
  // Insert default row if empty
  const existing = await db.getFirstAsync('SELECT 1 FROM step1_inventory LIMIT 1');
  if (!existing) {
    await db.runAsync(
      "INSERT INTO step1_inventory (id, content, updated_at) VALUES ('default', '', ?)",
      [new Date().toISOString()]
    );
  }
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS step1_inventory;');
}
