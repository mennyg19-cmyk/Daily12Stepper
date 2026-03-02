/**
 * Export and import app data for backup/restore.
 */
import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { logger } from '@/lib/logger';

export interface ExportData {
  version: number;
  exportedAt: string;
  daily_commitments: string;
  step_modules: string;
  stepwork_sessions: string;
  extra_tools: string;
  extra_tool_completions: string;
  gratitude_entries: string;
  inventory_entries: string;
  reader_books: string;
  reader_bookmarks: string;
  reader_positions: string;
  app_settings: string;
}

export async function exportData(): Promise<string> {
  const available = await isSQLiteAvailable();
  if (!available) throw new Error('SQLite not available');

  const db = await getDatabase();

  const tables = [
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
  ] as const;

  const data: Record<string, unknown> = {
    version: 1,
    exportedAt: new Date().toISOString(),
  };

  for (const table of tables) {
    const rows = await db.getAllAsync<any>(`SELECT * FROM ${table}`);
    data[table] = JSON.stringify(rows);
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

  const tables = [
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
  ] as const;

  const rowCounts: Record<string, number> = {};

  for (const table of tables) {
    const json = (data as Record<string, string>)[table];
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

  const total = Object.values(rowCounts).reduce((a, b) => a + b, 0);
  return {
    imported: total > 0,
    message: total > 0 ? `Imported ${total} records` : 'No data imported',
  };
}
