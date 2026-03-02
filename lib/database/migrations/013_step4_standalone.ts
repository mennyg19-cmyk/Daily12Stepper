import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step4_standalone (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'resentment',
      who TEXT NOT NULL DEFAULT '',
      why TEXT NOT NULL DEFAULT '',
      affects TEXT NOT NULL DEFAULT '',
      my_part TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS step4_standalone;');
}
