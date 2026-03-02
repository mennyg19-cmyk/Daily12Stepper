import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(reader_bookmarks)");
  const hasAuto = cols.some((c) => c.name === 'is_auto_bookmark');
  if (!hasAuto) {
    await db.execAsync(`ALTER TABLE reader_bookmarks ADD COLUMN is_auto_bookmark INTEGER NOT NULL DEFAULT 0;`);
  }
}

export async function down(db: SQLiteDatabase): Promise<void> {
  // SQLite doesn't support DROP COLUMN easily
}
