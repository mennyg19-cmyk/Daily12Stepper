import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import { getTotalStepworkSecondsForDateRange } from '@/features/steps/database';
import { getCompletionsForDate } from '@/features/extra-tools/database';
import { getSponsorWorkTimeMinutes } from '@/lib/profile';

export interface SponsorWorkTimeGoal {
  toolId: string;
  targetMinutes: number;
}

/** Get sponsor work time goal: from extra_tools DB first, else from profile. */
export async function getSponsorWorkTimeGoal(): Promise<SponsorWorkTimeGoal | null> {
  if (await isSQLiteAvailable()) {
    const db = await getDatabase();
    const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(extra_tools)");
    const hasToolType = cols.some((c) => c.name === 'tool_type');
    if (hasToolType) {
      const row = await db.getFirstAsync<any>(
        "SELECT id, special_config_json FROM extra_tools WHERE tool_type = 'sponsor_work_time' LIMIT 1"
      );
      if (row) {
        let targetMinutes = 30;
        if (row.special_config_json) {
          try {
            const cfg = JSON.parse(row.special_config_json) as { targetMinutes?: number };
            if (typeof cfg.targetMinutes === 'number') targetMinutes = cfg.targetMinutes;
          } catch {
            // Ignore
          }
        }
        return { toolId: row.id, targetMinutes };
      }
    }
  }
  const profileMinutes = await getSponsorWorkTimeMinutes();
  if (profileMinutes != null && profileMinutes > 0) {
    return { toolId: 'profile_sponsor_work_time', targetMinutes: profileMinutes };
  }
  return null;
}

export async function getSponsorWorkTimeProgress(date: string): Promise<{
  totalMinutes: number;
  targetMinutes: number;
  stepworkMinutes: number;
  toolMinutes: number;
  completed: boolean;
}> {
  const goal = await getSponsorWorkTimeGoal();
  if (!goal) {
    return { totalMinutes: 0, targetMinutes: 0, stepworkMinutes: 0, toolMinutes: 0, completed: false };
  }

  const stepworkSeconds = await getTotalStepworkSecondsForDateRange(date, date);
  const stepworkMinutes = Math.floor(stepworkSeconds / 60);

  const completions = await getCompletionsForDate(date);
  let toolMinutes = 0;
  const db = await getDatabase();
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(extra_tools)");
  const names = new Set(cols.map((c) => c.name));
  if (names.has('counts_toward_sponsor_time') && names.has('sponsor_time_minutes')) {
    for (const toolId of completions) {
      const row = await db.getFirstAsync<any>(
        'SELECT counts_toward_sponsor_time, sponsor_time_minutes FROM extra_tools WHERE id = ?',
        [toolId]
      );
      if (row?.counts_toward_sponsor_time === 1) {
        toolMinutes += row.sponsor_time_minutes ?? 5;
      }
    }
  }

  const totalMinutes = stepworkMinutes + toolMinutes;
  const completed = totalMinutes >= goal.targetMinutes;

  return {
    totalMinutes,
    targetMinutes: goal.targetMinutes,
    stepworkMinutes,
    toolMinutes,
    completed,
  };
}

export async function updateSponsorWorkTimeGoal(targetMinutes: number): Promise<void> {
  const goal = await getSponsorWorkTimeGoal();
  if (!goal) return;
  if (goal.toolId === 'profile_sponsor_work_time') {
    const { setSponsorWorkTimeMinutes } = await import('@/lib/profile');
    await setSponsorWorkTimeMinutes(targetMinutes);
    return;
  }
  const db = await getDatabase();
  const config = JSON.stringify({ targetMinutes });
  await db.runAsync(
    'UPDATE extra_tools SET special_config_json = ? WHERE id = ?',
    [config, goal.toolId]
  );
}

export async function createSponsorWorkTimeTool(targetMinutes: number): Promise<string> {
  const db = await getDatabase();
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(extra_tools)");
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('tool_type')) {
    throw new Error('Sponsor work time not supported—run migrations');
  }

  const id = `tool_swt_${Date.now()}`;
  const config = JSON.stringify({ targetMinutes });
  await db.runAsync(
    `INSERT INTO extra_tools (id, name, frequency_type, frequency_value, reminder_enabled, reminder_time, order_index, tool_type, special_config_json, counts_toward_sponsor_time, sponsor_time_minutes)
     VALUES (?, ?, 'daily', 1, 0, NULL, -1, 'sponsor_work_time', ?, 0, 0)`,
    [id, 'Sponsor recommended work time', config]
  );
  return id;
}
