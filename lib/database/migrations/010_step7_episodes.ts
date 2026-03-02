import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step7_episodes (
      id TEXT PRIMARY KEY,
      defect_name TEXT NOT NULL,
      when_text TEXT NOT NULL DEFAULT '',
      why_text TEXT NOT NULL DEFAULT '',
      better_response TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS step7_episodes;');
}
