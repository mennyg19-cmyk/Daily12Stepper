/**
 * App Lock — day-of-week rules: which preset runs when.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Plus, Trash2 } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresetScheduleConfig,
  getPresets,
  savePresetScheduleConfig,
} from '@/features/app-lock/storage';
import type { PresetScheduleRule } from '@/features/app-lock/types';

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

export default function PresetRulesScreen() {
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

  const handleAdd = () => {
    router.push('/app-lock/preset-schedule/rule-edit');
  };

  const handleEdit = (rule: PresetScheduleRule) => {
    router.push({ pathname: '/app-lock/preset-schedule/rule-edit', params: { ruleId: rule.id } });
  };

  const handleDelete = (rule: PresetScheduleRule) => {
    Alert.alert('Delete rule', `Remove "${presets.find((p) => p.id === rule.presetId)?.name ?? rule.presetId}" on ${ruleSummary(rule)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!schedule) return;
          const next = {
            ...schedule,
            rules: schedule.rules.filter((r) => r.id !== rule.id),
          };
          setSchedule(next);
          await savePresetScheduleConfig(next);
        },
      },
    ]);
  };

  if (!schedule) return null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Day Rules" rightSlot={<ThemeToggle />} showBack />
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted-foreground mb-4">
        Add rules to assign a preset to specific days. Weekends and workdays are common. For custom
        days, pick Mon, Tue, etc.
      </Text>

      {schedule.rules.map((rule) => {
        const preset = presets.find((p) => p.id === rule.presetId);
        return (
          <View
            key={rule.id}
            className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
          >
            <TouchableOpacity onPress={() => handleEdit(rule)} className="flex-1">
              <Text className="text-base font-medium text-foreground">{preset?.name ?? rule.presetId}</Text>
              <Text className="text-sm text-muted-foreground mt-0.5">{ruleSummary(rule)}</Text>
            </TouchableOpacity>
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
        <Text className="text-primary font-medium ml-2">Add rule</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}
