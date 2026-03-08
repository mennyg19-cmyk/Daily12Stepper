/**
 * App Lock — custom date ranges (vacations, etc.).
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
import type { PresetCustomRange } from '@/features/app-lock/types';

export default function CustomRangesScreen() {
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
    router.push('/app-lock/preset-schedule/custom-range-edit');
  };

  const handleEdit = (range: PresetCustomRange) => {
    router.push({
      pathname: '/app-lock/preset-schedule/custom-range-edit',
      params: { rangeId: range.id },
    });
  };

  const handleDelete = (range: PresetCustomRange) => {
    Alert.alert('Delete range', `Remove "${range.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!schedule) return;
          const next = {
            ...schedule,
            customRanges: schedule.customRanges.filter((r) => r.id !== range.id),
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
      <AppHeader title="Custom Ranges" rightSlot={<ThemeToggle />} showBack />
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted-foreground mb-4">
        Add date ranges (e.g. vacation) when a specific preset should run. These override day-of-week
        rules.
      </Text>

      {schedule.customRanges.map((range) => {
        const preset = presets.find((p) => p.id === range.presetId);
        return (
          <View
            key={range.id}
            className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
          >
            <TouchableOpacity onPress={() => handleEdit(range)} className="flex-1">
              <Text className="text-base font-medium text-foreground">{range.name}</Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                {range.startDate} – {range.endDate} · {preset?.name ?? range.presetId}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(range)} className="p-2">
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
        <Text className="text-primary font-medium ml-2">Add date range</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}
