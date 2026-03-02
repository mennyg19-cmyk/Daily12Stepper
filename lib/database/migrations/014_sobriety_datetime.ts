import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  // Add start_datetime column (ISO string with time)
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(sobriety_tracking)");
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('start_datetime')) {
    await db.execAsync(`ALTER TABLE sobriety_tracking ADD COLUMN start_datetime TEXT;`);
    // Migrate existing start_date to start_datetime (use midnight)
    await db.execAsync(
      `UPDATE sobriety_tracking SET start_datetime = start_date || 'T00:00:00.000Z' WHERE start_datetime IS NULL AND start_date IS NOT NULL`
    );
  }

  // Sobriety history for streaks and relapses
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sobriety_history (
      id TEXT PRIMARY KEY,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT,
      days_count INTEGER,
      is_relapse INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS sobriety_history;');
}
