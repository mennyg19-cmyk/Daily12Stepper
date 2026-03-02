import { SQLiteDatabase } from 'expo-sqlite';
import * as migration001 from './001_initial';
import * as migration002 from './002_step_completions';
import * as migration003 from './003_step_work';
import * as migration004 from './004_step_bookmarks';
import * as migration005 from './005_step1_inventory';
import * as migration006 from './006_sobriety_sponsor_work';
import * as migration007 from './007_step2_data';
import * as migration008 from './008_step4_inventory';
import * as migration009 from './009_step5_sharings';
import * as migration010 from './010_step7_episodes';
import * as migration011 from './011_amends_notes';
import * as migration012 from './012_step12_data';
import * as migration013 from './013_step4_standalone';
import * as migration014 from './014_sobriety_datetime';
import * as migration015 from './015_meditation_sessions';
import * as migration016 from './016_reader_auto_bookmark';
import { logger } from '../../logger';

export interface Migration {
  up: (db: SQLiteDatabase) => Promise<void>;
  down: (db: SQLiteDatabase) => Promise<void>;
}

export const migrations: Migration[] = [migration001, migration002, migration003, migration004, migration005, migration006, migration007, migration008, migration009, migration010, migration011, migration012, migration013, migration014, migration015, migration016];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'"
  );

  if (!result) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
  }

  const appliedVersions = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM _migrations ORDER BY version'
  );
  const appliedSet = new Set(appliedVersions.map((m) => m.version));

  for (let i = 0; i < migrations.length; i++) {
    if (!appliedSet.has(i + 1)) {
      logger.info(`Running migration ${i + 1}...`);
      await migrations[i].up(db);
      await db.runAsync(
        'INSERT OR IGNORE INTO _migrations (version, applied_at) VALUES (?, ?)',
        [i + 1, new Date().toISOString()]
      );
      logger.info(`Migration ${i + 1} completed`);
    }
  }
}
