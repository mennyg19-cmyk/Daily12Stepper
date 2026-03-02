/**
 * App Lock — preset schedule: which preset runs when (day-of-week, custom ranges, holidays).
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronRight, Calendar, Star } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresetScheduleConfig,
  getPresets,
  resolvePresetForDate,
} from '@/features/app-lock/storage';
import type { PresetScheduleConfig, PresetScheduleRule } from '@/features/app-lock/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ruleSummary(rule: PresetScheduleRule): string {
  switch (rule.dayPattern) {
    case 'always':
      return 'Every day';
    case 'weekends':
      return 'Weekends';
    case 'workdays':
      return 'Weekdays';
    case 'custom':
      const days = (rule.customDays ?? []).sort().map((d) => DAY_NAMES[d]).join(', ');
      return days || 'Select days';
    default:
      return '';
  }
}

export default function PresetScheduleScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [schedule, setSchedule] = useState<PresetScheduleConfig | null>(null);
  const [presets, setPresets] = useState<{ id: string; name: string }[]>([]);
  const [todayPreset, setTodayPreset] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, p, resolved] = await Promise.all([
      getPresetScheduleConfig(),
      getPresets(),
      resolvePresetForDate(new Date()),
    ]);
    setSchedule(s);
    setPresets(p.map((x) => ({ id: x.id, name: x.name })));
    setTodayPreset(resolved?.type === 'preset' ? resolved.presetId : null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!schedule) return null;

  const defaultPreset = presets.find((p) => p.id === schedule.defaultPresetId);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Preset Schedule" rightSlot={<ThemeToggle />} showBack />
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted-foreground mb-4">
        Choose which preset runs on each day. Custom ranges (vacations) and Jewish holidays can
        override the weekly schedule.
      </Text>

      {todayPreset && (
        <View className="rounded-2xl p-4 bg-primary/20 border border-primary/40 mb-4">
          <Text className="text-sm font-medium text-foreground">Today&apos;s preset</Text>
          <Text className="text-base font-semibold text-primary mt-1">
            {presets.find((p) => p.id === todayPreset)?.name ?? todayPreset}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => router.push('/app-lock/preset-schedule/default')}
        className="rounded-2xl p-5 bg-card border border-border mb-3 flex-row items-center min-h-[72px]"
      >
        <View className="flex-1 min-w-0 mr-3">
          <Text className="text-base font-medium text-foreground">Default preset</Text>
          <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={2}>
            {defaultPreset?.name ?? 'Not set — used when no rule matches'}
          </Text>
        </View>
        <ChevronRight size={20} color={iconColors.muted} />
      </TouchableOpacity>

      <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
        Day-of-week rules
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/app-lock/preset-schedule/rules')}
        className="rounded-2xl p-5 bg-card border border-border mb-3 flex-row items-center min-h-[72px]"
      >
        <View className="flex-1 min-w-0 mr-3">
          <Text className="text-base font-medium text-foreground">Rules</Text>
          <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={2}>
            {schedule.rules.length === 0
              ? 'No rules — add rules to assign presets to weekdays, weekends, etc.'
              : `${schedule.rules.length} rule(s)`}
          </Text>
        </View>
        <ChevronRight size={20} color={iconColors.muted} />
      </TouchableOpacity>

      {schedule.rules.length > 0 && (
        <View className="rounded-2xl p-4 bg-muted/30 border border-border mb-4">
          {schedule.rules.map((r) => {
            const preset = presets.find((p) => p.id === r.presetId);
            return (
              <View key={r.id} className="flex-row justify-between py-2 border-b border-border last:border-0">
                <Text className="text-sm text-foreground">{preset?.name ?? r.presetId}</Text>
                <Text className="text-sm text-muted-foreground">{ruleSummary(r)}</Text>
              </View>
            );
          })}
        </View>
      )}

      <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
        Custom date ranges
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/app-lock/preset-schedule/custom-ranges')}
        className="rounded-2xl p-5 bg-card border border-border mb-3 flex-row items-center min-h-[72px]"
      >
        <View className="flex-1 min-w-0 mr-3 flex-row items-center">
          <Calendar size={20} color={iconColors.primary} style={{ marginRight: 12 }} />
          <View className="flex-1 min-w-0">
            <Text className="text-base font-medium text-foreground">Vacations & custom dates</Text>
            <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={2}>
              {schedule.customRanges.length === 0
                ? 'Add vacation or custom date ranges'
                : `${schedule.customRanges.length} range(s)`}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={iconColors.muted} />
      </TouchableOpacity>

      <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
        Jewish holidays
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/app-lock/preset-schedule/jewish-holidays')}
        className="rounded-2xl p-5 bg-card border border-border mb-3 flex-row items-center min-h-[72px]"
      >
        <View className="flex-1 min-w-0 mr-3 flex-row items-center">
          <Star size={20} color={iconColors.primary} style={{ marginRight: 12 }} />
          <View className="flex-1 min-w-0">
            <Text className="text-base font-medium text-foreground">Jewish holidays</Text>
            <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={2}>
              {schedule.jewishHolidaysEnabled
                ? `${schedule.holidayRules.length} rule(s) · ${schedule.jewishCalendarInIsrael ? 'Israel' : 'Diaspora'}`
                : 'Use different preset or skip lock on holidays'}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={iconColors.muted} />
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}
