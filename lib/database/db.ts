import { Platform } from 'react-native';
import { runMigrations } from './migrations';

const DB_NAME = 'daily12stepper.db';

let dbInstance: import('expo-sqlite').SQLiteDatabase | null = null;
let sqliteAvailable: boolean | null = null;
let migrationsVerified = false;
let initPromise: Promise<import('expo-sqlite').SQLiteDatabase> | null = null;

export async function isSQLiteAvailable(): Promise<boolean> {
  if (sqliteAvailable !== null) return sqliteAvailable;
  // expo-sqlite web has known issues (sqlite3_open_v2, "cannot create file") in Chrome/Edge/Brave
  if (Platform.OS === 'web') {
    sqliteAvailable = false;
    return false;
  }
  try {
    const SQLite = await import('expo-sqlite');
    const testDb = await SQLite.openDatabaseAsync('_probe_');
    await testDb.closeAsync();
    sqliteAvailable = true;
  } catch {
    sqliteAvailable = false;
  }
  return sqliteAvailable;
}

async function initializeDatabase(): Promise<import('expo-sqlite').SQLiteDatabase> {
  const available = await isSQLiteAvailable();
  if (!available) throw new Error('EXPO_GO_NO_SQLITE');

  if (!dbInstance) {
    const SQLite = await import('expo-sqlite');
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }

  await runMigrations(dbInstance);
  migrationsVerified = true;
  return dbInstance;
}

export function getDatabase(): Promise<import('expo-sqlite').SQLiteDatabase> {
  if (migrationsVerified && dbInstance) return Promise.resolve(dbInstance);
  if (!initPromise) {
    initPromise = initializeDatabase().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export function getDatabaseName(): string {
  return DB_NAME;
}
