import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step4_people (
      id TEXT PRIMARY KEY,
      person_name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step4_resentments (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      column_3_done INTEGER NOT NULL DEFAULT 0,
      column_4_done INTEGER NOT NULL DEFAULT 0,
      column_3_text TEXT NOT NULL DEFAULT '',
      column_4_text TEXT NOT NULL DEFAULT '',
      defects_json TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (person_id) REFERENCES step4_people(id) ON DELETE CASCADE
    );
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS step4_resentments;');
  await db.execAsync('DROP TABLE IF EXISTS step4_people;');
}
