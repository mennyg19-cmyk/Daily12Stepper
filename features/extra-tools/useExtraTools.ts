import { useState, useCallback, useEffect } from 'react';
import type { ExtraTool } from './database';
import {
  getExtraTools,
  createExtraTool,
  updateExtraTool,
  deleteExtraTool,
  getCompletionsForDate,
  recordCompletion,
  removeCompletion,
} from './database';
import { getTodayKey } from '@/utils/date';
import { logger } from '@/lib/logger';

export function useExtraTools() {
  const [tools, setTools] = useState<ExtraTool[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayKey);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [toolsList, comps] = await Promise.all([
        getExtraTools(),
        getCompletionsForDate(date),
      ]);
      setTools(toolsList);
      setCompletions(comps);
    } catch (err) {
      logger.error('Failed to load extra tools:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTool = useCallback(
    async (
      name: string,
      frequencyType: import('./database').ExtraToolFrequencyType,
      frequencyValue: number,
      reminderEnabled: boolean,
      reminderTime: string | null
    ) => {
      const created = await createExtraTool(
        name,
        frequencyType,
        frequencyValue,
        reminderEnabled,
        reminderTime
      );
      setTools((prev) => [...prev, created].sort((a, b) => a.orderIndex - b.orderIndex));
      return created;
    },
    []
  );

  const updateTool = useCallback(
    async (
      id: string,
      updates: Partial<Pick<ExtraTool, 'name' | 'frequencyType' | 'frequencyValue' | 'reminderEnabled' | 'reminderTime' | 'orderIndex'>>
    ) => {
      const updated = await updateExtraTool(id, updates);
      setTools((prev) =>
        prev.map((t) => (t.id === id ? updated : t)).sort((a, b) => a.orderIndex - b.orderIndex)
      );
      return updated;
    },
    []
  );

  const removeTool = useCallback(async (id: string) => {
    await deleteExtraTool(id);
    setTools((prev) => prev.filter((t) => t.id !== id));
    setCompletions((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleCompletion = useCallback(
    async (toolId: string) => {
      const isCompleted = completions.has(toolId);
      if (isCompleted) {
        await removeCompletion(toolId, date);
        setCompletions((prev) => {
          const next = new Set(prev);
          next.delete(toolId);
          return next;
        });
      } else {
        await recordCompletion(toolId, date);
        setCompletions((prev) => new Set([...prev, toolId]));
      }
    },
    [date, completions]
  );

  const setDateFilter = useCallback((d: string) => {
    setDate(d);
  }, []);

  return {
    tools,
    completions,
    date,
    loading,
    error,
    refresh,
    addTool,
    updateTool,
    removeTool,
    toggleCompletion,
    setDateFilter,
  };
}
