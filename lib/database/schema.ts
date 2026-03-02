/**
 * Database schema definitions for Daily 12 Stepper
 */

export type CommitmentType = '24h' | 'custom' | 'none';

export interface DailyCommitmentRow {
  date: string; // YYYY-MM-DD PRIMARY KEY
  commitment_type: CommitmentType;
  custom_duration_minutes: number | null; // for 'custom' type
  created_at: string;
}

export interface StepModuleRow {
  step_number: number; // 1-12
  sponsor_instructions: string | null;
  base_content_json: string | null;
}

export interface StepworkSessionRow {
  id: string;
  step_number: number;
  date: string; // YYYY-MM-DD
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

export interface ExtraToolRow {
  id: string;
  name: string;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency_value: number; // e.g. 3 for 3x/week
  reminder_enabled: number; // 0 or 1
  reminder_time: string | null; // HH:mm
  order_index: number;
}

export interface ExtraToolCompletionRow {
  tool_id: string;
  date: string; // YYYY-MM-DD
  completed_at: string;
}

export interface GratitudeEntryRow {
  id: string;
  text: string;
  created_at: string;
}

export interface InventoryEntryRow {
  id: string;
  type: 'morning' | 'nightly' | 'step10' | 'fear';
  who: string;
  what_happened: string;
  affects_json: string;
  defects_json: string;
  assets_json: string;
  seventh_step_prayer: string;
  prayed: number;
  amends_needed: number;
  amends_to: string;
  help_who: string;
  share_with: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReaderBookRow {
  id: string;
  title: string;
  uri: string;
  type: 'url' | 'local';
}

export interface ReaderBookmarkRow {
  id: string;
  book_id: string;
  label: string;
  page_or_position: string;
  linked_tool_id: string | null;
}

export interface ReaderPositionRow {
  book_id: string;
  last_position: string;
}

export interface AppSettingRow {
  key: string;
  value_json: string;
}

// Domain types
export interface DailyCommitment {
  date: string;
  commitmentType: CommitmentType;
  customDurationMinutes: number | null;
  createdAt: string;
}

export interface GratitudeEntry {
  id: string;
  text: string;
  createdAt: string;
}

export type InventoryEntryType = 'morning' | 'nightly' | 'step10' | 'fear';

export interface Step10InventoryEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  who: string;
  whatHappened: string;
  affects: string[];
  defects: string[];
  assets: string[];
  seventhStepPrayer: string;
  prayed: boolean;
  amendsNeeded: boolean;
  amendsTo: string;
  helpWho: string;
  shareWith: string;
  notes?: string;
}

export interface InventoryEntry extends Step10InventoryEntry {
  type: InventoryEntryType;
}
