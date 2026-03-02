import type { InventoryEntry, InventoryEntryType } from '@/lib/database/schema';
import type { MorningInventoryData } from './types';

export const emptyPayload = (
  type: InventoryEntryType
): Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  type,
  who: '',
  whatHappened: '',
  affects: [],
  defects: [],
  assets: [],
  seventhStepPrayer: '',
  prayed: false,
  amendsNeeded: false,
  amendsTo: '',
  helpWho: '',
  shareWith: '',
  notes: undefined,
});

export function parseMorningNotes(notes: string | undefined): MorningInventoryData {
  if (!notes?.trim()) return {};
  try {
    const parsed = JSON.parse(notes) as MorningInventoryData;
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {}
  return { askFor: notes };
}
