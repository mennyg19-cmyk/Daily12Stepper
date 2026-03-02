import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step_completions (
      step_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (step_number, date)
    );
    CREATE INDEX IF NOT EXISTS idx_step_completions_date ON step_completions(date);
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS step_completions;');
}
