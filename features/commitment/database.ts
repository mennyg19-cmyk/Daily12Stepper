import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import {
  getCommitmentForDateWeb,
  saveCommitmentWeb,
} from '@/lib/settings';
import type { DailyCommitment, CommitmentType } from '@/lib/database/schema';

export async function getCommitmentForDate(date: string): Promise<DailyCommitment | null> {
  const available = await isSQLiteAvailable();
  if (!available) {
    const row = await getCommitmentForDateWeb(date);
    if (!row) return null;
    return {
      date: row.date,
      commitmentType: row.commitmentType as CommitmentType,
      customDurationMinutes: row.customDurationMinutes,
      createdAt: row.createdAt,
    };
  }
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    date: string;
    commitment_type: string;
    custom_duration_minutes: number | null;
    created_at: string;
  }>('SELECT * FROM daily_commitments WHERE date = ?', [date]);

  if (!row) return null;
  return {
    date: row.date,
    commitmentType: row.commitment_type as CommitmentType,
    customDurationMinutes: row.custom_duration_minutes,
    createdAt: row.created_at,
  };
}

export async function saveCommitment(
  date: string,
  commitmentType: CommitmentType,
  customDurationMinutes: number | null = null
): Promise<void> {
  const available = await isSQLiteAvailable();
  if (!available) {
    await saveCommitmentWeb(date, commitmentType, customDurationMinutes);
    return;
  }
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO daily_commitments (date, commitment_type, custom_duration_minutes, created_at)
     VALUES (?, ?, ?, ?)`,
    [date, commitmentType, customDurationMinutes, now]
  );
}
