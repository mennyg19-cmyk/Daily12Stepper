import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  // Add linked_step_number to reader_bookmarks (nullable; when set, bookmark is associated with a step)
  await db.execAsync(`
    ALTER TABLE reader_bookmarks ADD COLUMN linked_step_number INTEGER;
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  // SQLite doesn't support DROP COLUMN easily; would need table recreate - skip for now
}
