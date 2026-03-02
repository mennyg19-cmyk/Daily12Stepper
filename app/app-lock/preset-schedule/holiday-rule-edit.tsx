/**
 * App Lock — add a Jewish holiday rule (category-based from Hebcal).
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresetScheduleConfig,
  getPresets,
  savePresetScheduleConfig,
} from '@/features/app-lock/storage';
import type { PresetHolidayRule, HolidayCategory } from '@/features/app-lock/types';

const HOLIDAY_CATEGORIES: { id: HolidayCategory; label: string; description: string }[] = [
  {
    id: 'assur_bemelacha',
    label: 'Assur b\'Melacha (Yom Tov)',
    description: 'Days when work is forbidden: Rosh Hashana, Yom Kippur, first/last days of Pesach & Sukkot, Shavuot, Shmini Atzeret, Simchat Torah',
  },
  {
    id: 'major',
    label: 'Major holidays',
    description: 'All major holidays including Erev, Chol Hamoed, and Yom Tov days',
  },
  {
    id: 'minor',
    label: 'Minor holidays',
    description: 'Tu BiShvat, Lag BaOmer, Purim, Chanukah, etc.',
  },
  {
    id: 'chol_hamoed',
    label: 'Chol Hamoed',
    description: 'Intermediate days of Pesach and Sukkot only',
  },
];

export default function HolidayRuleEditScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [schedule, setSchedule] = useState<Awaited<ReturnType<typeof getPresetScheduleConfig>> | null>(null);
  const [presets, setPresets] = useState<{ id: string; name: string }[]>([]);
  const [holidayCategory, setHolidayCategory] = useState<HolidayCategory | null>(null);
  const [action, setAction] = useState<'use_preset' | 'skip_lock'>('skip_lock');
  const [presetId, setPresetId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([getPresetScheduleConfig(), getPresets()]);
    setSchedule(s);
    setPresets(p.map((x) => ({ id: x.id, name: x.name })));
    setPresetId(p[0]?.id ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = async () => {
    if (!schedule || !holidayCategory) {
      Alert.alert('Select category', 'Choose a holiday category for this rule.');
      return;
    }
    if (action === 'use_preset' && !presetId) {
      Alert.alert('Select preset', 'Choose a preset for this holiday.');
      return;
    }

    const rule: PresetHolidayRule = {
      id: `holiday-${Date.now()}`,
      holidayCategory,
      action,
      presetId: action === 'use_preset' ? presetId ?? undefined : undefined,
    };

    const next = {
      ...schedule,
      holidayRules: [...schedule.holidayRules, rule],
    };
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
      <Text className="text-sm font-medium text-foreground mb-2">Holiday category</Text>
      <Text className="text-xs text-muted-foreground mb-3">
        Select which type of Jewish holiday this rule applies to. Data from Hebcal.com.
      </Text>
      {HOLIDAY_CATEGORIES.map((c) => (
        <TouchableOpacity
          key={c.id}
          onPress={() => setHolidayCategory(c.id)}
          className="rounded-xl p-4 bg-card border border-border mb-3"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-medium text-foreground">{c.label}</Text>
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                holidayCategory === c.id ? 'bg-primary border-primary' : 'border-muted-foreground'
              }`}
            >
              {holidayCategory === c.id && <Check size={14} color={iconColors.primaryForeground} />}
            </View>
          </View>
          <Text className="text-sm text-muted-foreground mt-1">{c.description}</Text>
        </TouchableOpacity>
      ))}

      <Text className="text-sm font-medium text-foreground mt-6 mb-2">Action</Text>
      <TouchableOpacity
        onPress={() => setAction('skip_lock')}
        className="rounded-xl p-3 bg-card border border-border mb-2 flex-row items-center justify-between"
      >
        <Text className="text-base text-foreground">Skip lock on these holidays</Text>
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            action === 'skip_lock' ? 'bg-primary border-primary' : 'border-muted-foreground'
          }`}
        >
          {action === 'skip_lock' && <Check size={14} color={iconColors.primaryForeground} />}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setAction('use_preset')}
        className="rounded-xl p-3 bg-card border border-border mb-2 flex-row items-center justify-between"
      >
        <Text className="text-base text-foreground">Use a different preset</Text>
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            action === 'use_preset' ? 'bg-primary border-primary' : 'border-muted-foreground'
          }`}
        >
          {action === 'use_preset' && <Check size={14} color={iconColors.primaryForeground} />}
        </View>
      </TouchableOpacity>

      {action === 'use_preset' && (
        <>
          <Text className="text-sm font-medium text-foreground mt-4 mb-2">Preset</Text>
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
        </>
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
