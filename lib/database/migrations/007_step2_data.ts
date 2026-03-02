import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  // Step 2: ready to believe + power description (editable daily)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step2_data (
      id TEXT PRIMARY KEY DEFAULT 'default',
      ready INTEGER NOT NULL DEFAULT 0,
      power_description TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);
  const existing = await db.getFirstAsync('SELECT 1 FROM step2_data LIMIT 1');
  if (!existing) {
    await db.runAsync(
      "INSERT INTO step2_data (id, ready, power_description, updated_at) VALUES ('default', 0, '', ?)",
      [new Date().toISOString()]
    );
  }
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS step2_data;');
}
