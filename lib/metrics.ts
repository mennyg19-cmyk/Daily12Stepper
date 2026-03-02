/**
 * Aggregates usage metrics for display.
 */
import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import { getStepDurationsByDateRange } from '@/features/steps/database';
import { subDays, format } from 'date-fns';
import { getTodayKey } from '@/utils/date';

export interface DayMetrics {
  date: string;
  stepworkSeconds: number;
  stepsCompleted: number;
  commitmentMade: boolean;
  gratitudeCount: number;
  extraToolsCompleted: number;
  meditationSeconds: number;
}

export interface MetricsSummary {
  today: DayMetrics | null;
  last7Days: DayMetrics[];
  totalStepworkSeconds: number;
  totalStepsCompleted: number;
  totalMeditationSeconds: number;
  stepBreakdown: { stepNumber: number; totalSeconds: number }[];
}

export async function getMetricsSummary(daysBack = 7): Promise<MetricsSummary> {
  const available = await isSQLiteAvailable();
  if (!available) {
    return {
      today: null,
      last7Days: [],
      totalStepworkSeconds: 0,
      totalStepsCompleted: 0,
      totalMeditationSeconds: 0,
      stepBreakdown: [],
    };
  }

  const db = await getDatabase();
  const today = getTodayKey();
  const startDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');

  const [stepDurations, commitmentRows, gratitudeRows, completionRows, stepCompletions] =
    await Promise.all([
      getStepDurationsByDateRange(startDate, today),
      db.getAllAsync<{ date: string }>(
        "SELECT date FROM daily_commitments WHERE date >= ? AND commitment_type != 'none'",
        [startDate]
      ),
      db.getAllAsync<{ date: string; count: number }>(
        `SELECT substr(created_at, 1, 10) as date, COUNT(*) as count
         FROM gratitude_entries
         WHERE substr(created_at, 1, 10) >= ?
         GROUP BY substr(created_at, 1, 10)`,
        [startDate]
      ),
      db.getAllAsync<{ date: string; count: number }>(
        `SELECT date, COUNT(*) as count
         FROM extra_tool_completions
         WHERE date >= ?
         GROUP BY date`,
        [startDate]
      ),
      db.getAllAsync<{ date: string; count: number }>(
        `SELECT date, COUNT(*) as count
         FROM step_completions
         WHERE date >= ?
         GROUP BY date`,
        [startDate]
      ),
    ]);

  const commitmentSet = new Set(commitmentRows.map((r) => r.date));
  const gratitudeByDate = new Map(gratitudeRows.map((r) => [r.date, r.count]));
  const completionsByDate = new Map(completionRows.map((r) => [r.date, r.count]));
  const stepsByDate = new Map(stepCompletions.map((r) => [r.date, r.count]));

  const stepworkByDate = new Map<string, number>();
  for (const row of stepDurations) {
    const cur = stepworkByDate.get(row.date) ?? 0;
    stepworkByDate.set(row.date, cur + row.totalSeconds);
  }

  const meditationByDate = new Map<string, number>();
  const meditationCols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(meditation_sessions)");
  if (meditationCols.length > 0) {
    const meditationRows = await db.getAllAsync<{ date: string; total: number }>(
      `SELECT date, SUM(duration_seconds) as total
       FROM meditation_sessions
       WHERE date >= ? AND date <= ?
       GROUP BY date`,
      [startDate, today]
    );
    for (const row of meditationRows) {
      meditationByDate.set(row.date, row.total);
    }
  }

  const dates: string[] = [];
  for (let i = 0; i <= daysBack; i++) {
    dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  dates.reverse();

  const last7Days: DayMetrics[] = dates.map((date) => ({
    date,
    stepworkSeconds: stepworkByDate.get(date) ?? 0,
    stepsCompleted: stepsByDate.get(date) ?? 0,
    commitmentMade: commitmentSet.has(date),
    gratitudeCount: gratitudeByDate.get(date) ?? 0,
    extraToolsCompleted: completionsByDate.get(date) ?? 0,
    meditationSeconds: meditationByDate.get(date) ?? 0,
  }));

  const todayMetrics = last7Days.find((d) => d.date === today) ?? null;

  const totalStepworkSeconds = last7Days.reduce((a, d) => a + d.stepworkSeconds, 0);
  const totalStepsCompleted = last7Days.reduce((a, d) => a + d.stepsCompleted, 0);
  const totalMeditationSeconds = last7Days.reduce((a, d) => a + d.meditationSeconds, 0);

  const stepBreakdownRows = await db.getAllAsync<{ step_number: number; total: number }>(
    `SELECT step_number, SUM(duration_seconds) as total
     FROM stepwork_sessions
     WHERE date >= ?
     GROUP BY step_number
     ORDER BY step_number`,
    [startDate]
  );

  const stepBreakdown = stepBreakdownRows.map((r) => ({
    stepNumber: r.step_number,
    totalSeconds: r.total,
  }));

  return {
    today: todayMetrics,
    last7Days,
    totalStepworkSeconds,
    totalStepsCompleted,
    totalMeditationSeconds,
    stepBreakdown,
  };
}
