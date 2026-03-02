/**
 * App Lock — add or edit a day-of-week rule.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresetScheduleConfig,
  getPresets,
  savePresetScheduleConfig,
} from '@/features/app-lock/storage';
import type { PresetScheduleRule, PresetDayPattern } from '@/features/app-lock/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RuleEditScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const { ruleId } = useLocalSearchParams<{ ruleId?: string }>();
  const [schedule, setSchedule] = useState<Awaited<ReturnType<typeof getPresetScheduleConfig>> | null>(null);
  const [presets, setPresets] = useState<{ id: string; name: string }[]>([]);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [dayPattern, setDayPattern] = useState<PresetDayPattern>('workdays');
  const [customDays, setCustomDays] = useState<number[]>([]);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([getPresetScheduleConfig(), getPresets()]);
    setSchedule(s);
    setPresets(p.map((x) => ({ id: x.id, name: x.name })));
    if (ruleId) {
      const rule = s.rules.find((r) => r.id === ruleId);
      if (rule) {
        setPresetId(rule.presetId);
        setDayPattern(rule.dayPattern);
        setCustomDays(rule.customDays ?? []);
      }
    } else {
      setPresetId(p[0]?.id ?? null);
      setDayPattern('workdays');
      setCustomDays([]);
    }
  }, [ruleId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleCustomDay = (d: number) => {
    setCustomDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  };

  const handleSave = async () => {
    if (!schedule || !presetId) {
      Alert.alert('Select preset', 'Choose a preset for this rule.');
      return;
    }
    if (dayPattern === 'custom' && customDays.length === 0) {
      Alert.alert('Select days', 'Choose at least one day for custom days.');
      return;
    }

    const rule: PresetScheduleRule = {
      id: ruleId ?? `rule-${Date.now()}`,
      presetId,
      dayPattern,
      customDays: dayPattern === 'custom' ? customDays : undefined,
    };

    const existing = schedule.rules.findIndex((r) => r.id === rule.id);
    const rules =
      existing >= 0
        ? schedule.rules.map((r) => (r.id === rule.id ? rule : r))
        : [...schedule.rules, rule];

    const next = { ...schedule, rules };
    setSchedule(next);
    await savePresetScheduleConfig(next);
    router.back();
  };

  if (!schedule) return null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm font-medium text-foreground mb-2">Preset</Text>
      {presets.map((p) => (
        <TouchableOpacity
          key={p.id}
          onPress={() => setPresetId(p.id)}
          className="rounded-xl p-3 bg-card border border-border mb-2 flex-row items-center justify-between"
        >
          <Text className="text-base text-foreground">{p.name}</Text>
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              presetId === p.id ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`}
          >
            {presetId === p.id && <Check size={14} color={iconColors.primaryForeground} />}
          </View>
        </TouchableOpacity>
      ))}

      <Text className="text-sm font-medium text-foreground mt-4 mb-2">When</Text>
      {(['always', 'workdays', 'weekends', 'custom'] as const).map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => setDayPattern(opt)}
          className="rounded-xl p-3 bg-card border border-border mb-2 flex-row items-center justify-between"
        >
          <Text className="text-base text-foreground capitalize">{opt}</Text>
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              dayPattern === opt ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`}
          >
            {dayPattern === opt && <Check size={14} color={iconColors.primaryForeground} />}
          </View>
        </TouchableOpacity>
      ))}

      {dayPattern === 'custom' && (
        <View className="mt-4 rounded-2xl p-4 bg-muted/30 border border-border">
          <Text className="text-sm font-medium text-foreground mb-2">Select days</Text>
          <View className="flex-row flex-wrap gap-2">
            {DAY_NAMES.map((name, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => toggleCustomDay(i)}
                className={`rounded-xl py-2 px-4 ${
                  customDays.includes(i) ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text
                  className={
                    customDays.includes(i) ? 'text-primary-foreground font-medium' : 'text-muted-foreground'
                  }
                >
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSave}
        className="rounded-2xl py-4 bg-primary items-center mt-8"
      >
        <Text className="text-primary-foreground font-semibold">Save rule</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
