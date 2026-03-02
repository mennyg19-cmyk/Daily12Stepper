import type { InventoryEntry as SchemaInventoryEntry } from '@/lib/database/schema';

export type InventoryEntry = SchemaInventoryEntry;

export interface MorningInventoryData {
  plans?: string;
  askFor?: string;
}

export interface NightlyInventoryData {
  resentful?: boolean | null;
  selfish?: boolean | null;
  dishonest?: boolean | null;
  kindLoving?: boolean | null;
  notes?: string;
}
