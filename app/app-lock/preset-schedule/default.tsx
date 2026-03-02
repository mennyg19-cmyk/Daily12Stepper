/**
 * App Lock — set default preset for preset schedule.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresetScheduleConfig,
  getPresets,
  savePresetScheduleConfig,
} from '@/features/app-lock/storage';

export default function DefaultPresetScreen() {
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

  const handleSelect = async (presetId: string | null) => {
    if (!schedule) return;
    const next = { ...schedule, defaultPresetId: presetId };
    setSchedule(next);
    await savePresetScheduleConfig(next);
  };

  if (!schedule) return null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted-foreground mb-4">
        The default preset is used when no day-of-week rule or custom range matches. For example, if
        you only have rules for weekdays and weekends, the default is never used.
      </Text>

      <TouchableOpacity
        onPress={() => handleSelect(null)}
        className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
      >
        <Text className="text-base font-medium text-foreground">None</Text>
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            schedule.defaultPresetId === null ? 'bg-primary border-primary' : 'border-muted-foreground'
          }`}
        >
          {schedule.defaultPresetId === null && <Check size={14} color={iconColors.primaryForeground} />}
        </View>
      </TouchableOpacity>

      {presets.map((p) => (
        <TouchableOpacity
          key={p.id}
          onPress={() => handleSelect(p.id)}
          className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
        >
          <Text className="text-base font-medium text-foreground">{p.name}</Text>
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              schedule.defaultPresetId === p.id ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`}
          >
            {schedule.defaultPresetId === p.id && <Check size={14} color={iconColors.primaryForeground} />}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
