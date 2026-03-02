import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  // Daily commitments
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_commitments (
      date TEXT PRIMARY KEY,
      commitment_type TEXT NOT NULL CHECK (commitment_type IN ('24h', 'custom', 'none')),
      custom_duration_minutes INTEGER,
      created_at TEXT NOT NULL
    );
  `);

  // Step modules (sponsor instructions per step)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step_modules (
      step_number INTEGER PRIMARY KEY CHECK (step_number BETWEEN 1 AND 12),
      sponsor_instructions TEXT,
      base_content_json TEXT
    );
  `);

  // Stepwork sessions (time tracking per step per day)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS stepwork_sessions (
      id TEXT PRIMARY KEY,
      step_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_stepwork_sessions_date ON stepwork_sessions(date);
    CREATE INDEX IF NOT EXISTS idx_stepwork_sessions_step_date ON stepwork_sessions(step_number, date);
  `);

  // Extra tools
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS extra_tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'custom')),
      frequency_value INTEGER NOT NULL DEFAULT 1,
      reminder_enabled INTEGER NOT NULL DEFAULT 0 CHECK (reminder_enabled IN (0, 1)),
      reminder_time TEXT,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Extra tool completions
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS extra_tool_completions (
      tool_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (tool_id, date),
      FOREIGN KEY (tool_id) REFERENCES extra_tools(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_extra_tool_completions_date ON extra_tool_completions(date);
  `);

  // Gratitude entries
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS gratitude_entries (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_gratitude_entries_created_at ON gratitude_entries(created_at DESC);
  `);

  // Inventory entries (Step 10 + Step 11 from JFT)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS inventory_entries (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('morning', 'nightly', 'step10', 'fear')),
      who TEXT NOT NULL,
      what_happened TEXT NOT NULL,
      affects_json TEXT NOT NULL,
      defects_json TEXT NOT NULL,
      assets_json TEXT NOT NULL,
      seventh_step_prayer TEXT NOT NULL,
      prayed INTEGER NOT NULL DEFAULT 0 CHECK (prayed IN (0, 1)),
      amends_needed INTEGER NOT NULL DEFAULT 0 CHECK (amends_needed IN (0, 1)),
      amends_to TEXT NOT NULL DEFAULT '',
      help_who TEXT NOT NULL DEFAULT '',
      share_with TEXT NOT NULL DEFAULT '',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_inventory_entries_type ON inventory_entries(type);
    CREATE INDEX IF NOT EXISTS idx_inventory_entries_created_at ON inventory_entries(created_at DESC);
  `);

  // Reader books
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reader_books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      uri TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('url', 'local'))
    );
  `);

  // Reader bookmarks
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reader_bookmarks (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      label TEXT NOT NULL,
      page_or_position TEXT NOT NULL,
      linked_tool_id TEXT,
      FOREIGN KEY (book_id) REFERENCES reader_books(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_reader_bookmarks_book ON reader_bookmarks(book_id);
  `);

  // Reader positions (last scroll position per book)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reader_positions (
      book_id TEXT PRIMARY KEY,
      last_position TEXT NOT NULL,
      FOREIGN KEY (book_id) REFERENCES reader_books(id) ON DELETE CASCADE
    );
  `);

  // App settings
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL
    );
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS app_settings;');
  await db.execAsync('DROP TABLE IF EXISTS reader_positions;');
  await db.execAsync('DROP TABLE IF EXISTS reader_bookmarks;');
  await db.execAsync('DROP TABLE IF EXISTS reader_books;');
  await db.execAsync('DROP TABLE IF EXISTS inventory_entries;');
  await db.execAsync('DROP TABLE IF EXISTS gratitude_entries;');
  await db.execAsync('DROP TABLE IF EXISTS extra_tool_completions;');
  await db.execAsync('DROP TABLE IF EXISTS extra_tools;');
  await db.execAsync('DROP TABLE IF EXISTS stepwork_sessions;');
  await db.execAsync('DROP TABLE IF EXISTS step_modules;');
  await db.execAsync('DROP TABLE IF EXISTS daily_commitments;');
}
