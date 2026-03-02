/**
 * Export and import app data for backup/restore.
 * Includes all SQLite tables and AsyncStorage keys (profile, app lock, settings, etc.).
 */
import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/lib/logger';

const SQLITE_TABLES = [
  'daily_commitments',
  'step_modules',
  'stepwork_sessions',
  'extra_tools',
  'extra_tool_completions',
  'gratitude_entries',
  'inventory_entries',
  'reader_books',
  'reader_bookmarks',
  'reader_positions',
  'app_settings',
  'step_completions',
  'step_work_data',
  'step_amends',
  'step_amends_completions',
  'step1_inventory',
  'sobriety_tracking',
  'step2_data',
  'step4_people',
  'step4_resentments',
  'step5_sharings',
  'step7_episodes',
  'step12_instructions',
  'step12_sponsees',
  'step4_standalone',
  'sobriety_history',
  'meditation_sessions',
] as const;

const ASYNC_STORAGE_PREFIX = 'daily12stepper_';

export interface ExportData {
  version: number;
  exportedAt: string;
  [key: string]: unknown;
}

export async function exportData(): Promise<string> {
  const available = await isSQLiteAvailable();
  if (!available) throw new Error('SQLite not available');

  const db = await getDatabase();
  const data: Record<string, unknown> = {
    version: 2,
    exportedAt: new Date().toISOString(),
  };

  for (const table of SQLITE_TABLES) {
    try {
      const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
      data[table] = JSON.stringify(rows);
    } catch (e) {
      logger.warn(`Export: table ${table} not found or error`, e);
      data[table] = JSON.stringify([]);
    }
  }

  const keys = await AsyncStorage.getAllKeys();
  const appKeys = keys.filter((k) => k.startsWith(ASYNC_STORAGE_PREFIX));
  if (appKeys.length > 0) {
    const pairs = await AsyncStorage.multiGet(appKeys);
    const asyncStorage: Record<string, string> = {};
    for (const [k, v] of pairs) {
      if (v != null) asyncStorage[k] = v;
    }
    data.async_storage = JSON.stringify(asyncStorage);
  }

  return JSON.stringify(data, null, 2);
}

export async function exportAndShare(): Promise<void> {
  const json = await exportData();
  const filename = `daily12stepper_backup_${new Date().toISOString().slice(0, 10)}.json`;
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Export Daily 12 Stepper data',
    });
  } else {
    throw new Error('Sharing not available');
  }
}

export async function importFromFile(): Promise<{ imported: boolean; message: string }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return { imported: false, message: 'Cancelled' };

  const asset = result.assets[0];
  let raw: string;
  try {
    raw = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (e) {
    return { imported: false, message: 'Could not read file' };
  }

  let data: ExportData;
  try {
    data = JSON.parse(raw) as ExportData;
  } catch {
    return { imported: false, message: 'Invalid JSON' };
  }

  if (!data.version || typeof data.version !== 'number') {
    return { imported: false, message: 'Invalid backup format' };
  }

  const available = await isSQLiteAvailable();
  if (!available) return { imported: false, message: 'SQLite not available' };

  const db = await getDatabase();
  const rowCounts: Record<string, number> = {};
  const dataRecord = data as Record<string, string | undefined>;

  for (const table of SQLITE_TABLES) {
    const json = dataRecord[table];
    if (!json) continue;

    let rows: Record<string, unknown>[];
    try {
      rows = JSON.parse(json) as Record<string, unknown>[];
    } catch {
      continue;
    }

    if (rows.length === 0) continue;

    const cols = Object.keys(rows[0]);
    const placeholders = cols.map(() => '?').join(', ');
    const colNames = cols.join(', ');

    for (const row of rows) {
      const values = cols.map((c) => row[c]);
      try {
        await db.runAsync(
          `INSERT OR REPLACE INTO ${table} (${colNames}) VALUES (${placeholders})`,
          values
        );
        rowCounts[table] = (rowCounts[table] ?? 0) + 1;
      } catch (e) {
        logger.error(`Import failed for ${table}:`, e);
      }
    }
  }

  let asyncStorageCount = 0;
  const asyncStorageJson = dataRecord.async_storage;
  if (asyncStorageJson) {
    try {
      const asyncStorage = JSON.parse(asyncStorageJson) as Record<string, string>;
      for (const [k, v] of Object.entries(asyncStorage)) {
        if (k.startsWith(ASYNC_STORAGE_PREFIX) && typeof v === 'string') {
          await AsyncStorage.setItem(k, v);
          asyncStorageCount++;
        }
      }
    } catch (e) {
      logger.error('Import async_storage failed:', e);
    }
  }

  const total = Object.values(rowCounts).reduce((a, b) => a + b, 0) + asyncStorageCount;
  return {
    imported: total > 0,
    message: total > 0 ? `Imported ${total} records` : 'No data imported',
  };
}
