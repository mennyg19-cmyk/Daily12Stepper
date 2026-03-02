/**
 * Auto backup — run scheduled backups when app opens.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { exportData } from '@/lib/exportImport';
import { Platform } from 'react-native';

const AUTO_BACKUP_ENABLED_KEY = 'daily12stepper_auto_backup_enabled';
const AUTO_BACKUP_FREQUENCY_KEY = 'daily12stepper_auto_backup_frequency';
const AUTO_BACKUP_LAST_DATE_KEY = 'daily12stepper_auto_backup_last_date';

export type AutoBackupFrequency = 'daily' | 'weekly' | 'off';

export async function getAutoBackupEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(AUTO_BACKUP_ENABLED_KEY);
    return v === 'true';
  } catch {
    return false;
  }
}

export async function setAutoBackupEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(AUTO_BACKUP_ENABLED_KEY, String(enabled));
}

export async function getAutoBackupFrequency(): Promise<AutoBackupFrequency> {
  try {
    const v = await AsyncStorage.getItem(AUTO_BACKUP_FREQUENCY_KEY);
    if (v === 'daily' || v === 'weekly' || v === 'off') return v;
  } catch {}
  return 'weekly';
}

export async function setAutoBackupFrequency(freq: AutoBackupFrequency): Promise<void> {
  await AsyncStorage.setItem(AUTO_BACKUP_FREQUENCY_KEY, freq);
}

export async function getLastAutoBackupDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTO_BACKUP_LAST_DATE_KEY);
  } catch {
    return null;
  }
}

export async function setLastAutoBackupDate(date: string): Promise<void> {
  await AsyncStorage.setItem(AUTO_BACKUP_LAST_DATE_KEY, date);
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isBackupDue(frequency: AutoBackupFrequency, lastDate: string | null): boolean {
  const today = getTodayKey();
  if (!lastDate) return true;
  if (frequency === 'daily') return lastDate !== today;
  if (frequency === 'weekly') {
    const last = new Date(lastDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays >= 7;
  }
  return false;
}

/** Save backup to device storage (documentDirectory). Returns path or null. */
export async function saveBackupToDevice(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const json = await exportData();
    const dir = FileSystem.documentDirectory;
    if (!dir) return null;
    const filename = `daily12stepper_backup_${getTodayKey()}.json`;
    const path = `${dir}${filename}`;
    await FileSystem.writeAsStringAsync(path, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await setLastAutoBackupDate(getTodayKey());
    return path;
  } catch {
    return null;
  }
}

/** Run backup if auto-backup is enabled and due. Called on app open. */
export async function runScheduledBackupIfDue(): Promise<boolean> {
  const enabled = await getAutoBackupEnabled();
  if (!enabled) return false;

  const frequency = await getAutoBackupFrequency();
  if (frequency === 'off') return false;

  const lastDate = await getLastAutoBackupDate();
  if (!isBackupDue(frequency, lastDate)) return false;

  const path = await saveBackupToDevice();
  return path !== null;
}
