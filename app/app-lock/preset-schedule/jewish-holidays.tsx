/**
 * App Lock — Jewish holiday rules (Hebcal API).
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight, Plus, Trash2, Check } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresetScheduleConfig,
  getPresets,
  savePresetScheduleConfig,
} from '@/features/app-lock/storage';
import type { PresetHolidayRule, HolidayCategory } from '@/features/app-lock/types';

const CATEGORY_LABELS: Record<HolidayCategory, string> = {
  assur_bemelacha: "Assur b'Melacha",
  major: 'Major holidays',
  minor: 'Minor holidays',
  chol_hamoed: 'Chol Hamoed',
};

export default function JewishHolidaysScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [schedule, setSchedule] = useState<Awaited<ReturnType<typeof getPresetScheduleConfig>> | null>(null);
  const [presets, setPresets] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([getPresetScheduleConfig(), getPresets()]);
    setSchedule(s);
    setPresets(p.map((x) => ({ id: x.id, name: x.name })));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleToggleEnabled = async () => {
    if (!schedule) return;
    const next = { ...schedule, jewishHolidaysEnabled: !schedule.jewishHolidaysEnabled };
    setSchedule(next);
    await savePresetScheduleConfig(next);
  };

  const handleToggleIsrael = async () => {
    if (!schedule) return;
    const next = { ...schedule, jewishCalendarInIsrael: !schedule.jewishCalendarInIsrael };
    setSchedule(next);
    await savePresetScheduleConfig(next);
  };

  const handleAdd = () => {
    router.push('/app-lock/preset-schedule/holiday-rule-edit');
  };

  const handleDelete = (rule: PresetHolidayRule) => {
    const label = rule.holidayCategory
      ? CATEGORY_LABELS[rule.holidayCategory]
      : rule.holidayId?.replace(/-/g, ' ') ?? 'holiday';
    Alert.alert('Delete rule', `Remove rule for "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!schedule) return;
          const next = {
            ...schedule,
            holidayRules: schedule.holidayRules.filter((r) => r.id !== rule.id),
          };
          setSchedule(next);
          await savePresetScheduleConfig(next);
        },
      },
    ]);
  };

  if (!schedule) return null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted-foreground mb-4">
        Jewish holidays are fetched from Hebcal.com. Choose which preset to use or skip the lock on
        specific holidays.
      </Text>

      <TouchableOpacity
        onPress={handleToggleEnabled}
        className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
      >
        <Text className="text-base font-medium text-foreground">Enable Jewish holidays</Text>
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            schedule.jewishHolidaysEnabled ? 'bg-primary border-primary' : 'border-muted-foreground'
          }`}
        >
          {schedule.jewishHolidaysEnabled && <Check size={14} color={iconColors.primaryForeground} />}
        </View>
      </TouchableOpacity>

      {schedule.jewishHolidaysEnabled && (
        <>
          <TouchableOpacity
            onPress={handleToggleIsrael}
            className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-base font-medium text-foreground">Calendar</Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                {schedule.jewishCalendarInIsrael ? 'Israel' : 'Diaspora'} — holiday dates
              </Text>
            </View>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>

          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
            Holiday rules
          </Text>
          {schedule.holidayRules.map((rule) => {
            const preset = rule.presetId ? presets.find((p) => p.id === rule.presetId) : null;
            const actionText =
              rule.action === 'skip_lock' ? 'Skip lock' : `Use ${preset?.name ?? rule.presetId}`;
            const categoryLabel = rule.holidayCategory
              ? CATEGORY_LABELS[rule.holidayCategory]
              : rule.holidayId?.replace(/-/g, ' ') ?? '—';
            return (
              <View
                key={rule.id}
                className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">{categoryLabel}</Text>
                  <Text className="text-sm text-muted-foreground mt-0.5">{actionText}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(rule)} className="p-2">
                  <Trash2 size={20} color={iconColors.destructive} />
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity
            onPress={handleAdd}
            className="rounded-2xl p-4 border-2 border-dashed border-muted flex-row items-center justify-center mt-4"
          >
            <Plus size={20} color={iconColors.primary} />
            <Text className="text-primary font-medium ml-2">Add holiday rule</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
