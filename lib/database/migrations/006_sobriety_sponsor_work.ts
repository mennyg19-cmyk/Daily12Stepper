import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  // Sobriety tracking — single row with start date
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sobriety_tracking (
      id TEXT PRIMARY KEY DEFAULT 'default',
      start_date TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Extend extra_tools for sponsor work time and sobriety
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(extra_tools)");
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('tool_type')) {
    await db.execAsync(`ALTER TABLE extra_tools ADD COLUMN tool_type TEXT NOT NULL DEFAULT 'standard';`);
    await db.execAsync(`ALTER TABLE extra_tools ADD COLUMN special_config_json TEXT;`);
    await db.execAsync(`ALTER TABLE extra_tools ADD COLUMN counts_toward_sponsor_time INTEGER NOT NULL DEFAULT 0;`);
    await db.execAsync(`ALTER TABLE extra_tools ADD COLUMN sponsor_time_minutes INTEGER NOT NULL DEFAULT 5;`);
  }
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS sobriety_tracking;');
  // Cannot easily remove columns in SQLite
}
