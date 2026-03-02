import type { DailyCommitment, CommitmentType } from '@/lib/database/schema';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/** Duration in ms for commitment type, or null for 'none'. */
export function commitmentDurationMs(
  type: CommitmentType,
  customMinutes?: number | null
): number | null {
  switch (type) {
    case '24h':
      return TWENTY_FOUR_HOURS_MS;
    case 'custom':
      if (customMinutes != null && customMinutes > 0) {
        return customMinutes * 60 * 1000;
      }
      return null;
    case 'none':
      return null;
  }
}

export function getCommitmentRemainingMs(commitment: DailyCommitment): number | null {
  const durationMs = commitmentDurationMs(
    commitment.commitmentType,
    commitment.customDurationMinutes
  );
  if (durationMs == null) return null;
  const startMs = new Date(commitment.createdAt).getTime();
  const endMs = startMs + durationMs;
  return Math.max(0, endMs - Date.now());
}

export function isCommitmentActive(commitment: DailyCommitment): boolean {
  const remaining = getCommitmentRemainingMs(commitment);
  if (remaining == null) return false;
  return remaining > 0;
}

export function commitmentLabel(
  type: CommitmentType,
  customMinutes?: number | null
): string {
  switch (type) {
    case '24h':
      return '24-hour commitment';
    case 'custom':
      if (customMinutes != null && customMinutes > 0) {
        const h = Math.floor(customMinutes / 60);
        const m = customMinutes % 60;
        if (m > 0) return `${h}h ${m}m commitment`;
        return `${h}-hour commitment`;
      }
      return 'Custom commitment';
    case 'none':
      return 'No commitment';
  }
}
