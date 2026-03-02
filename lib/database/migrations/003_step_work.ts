import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  // Step 4 work (inventory), Step 5 (sharing), Step 6/7 (defects/shortcomings) — JSON per step per date
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step_work_data (
      step_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (step_number, date)
    );
  `);

  // Step 8: Amends list — people to make amends to (persistent, not per-day)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step_amends (
      id TEXT PRIMARY KEY,
      person_name TEXT NOT NULL,
      notes TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Step 9: Amends completions — when each amend was done (per date)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step_amends_completions (
      amends_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (amends_id, date),
      FOREIGN KEY (amends_id) REFERENCES step_amends(id) ON DELETE CASCADE
    );
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS step_amends_completions;');
  await db.execAsync('DROP TABLE IF EXISTS step_amends;');
  await db.execAsync('DROP TABLE IF EXISTS step_work_data;');
}
