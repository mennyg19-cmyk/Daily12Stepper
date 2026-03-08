/**
 * App Lock — schedule when lock activates.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Check } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { getAppLockConfig, saveAppLockConfig } from '@/features/app-lock/storage';
import type { AppLockConfig, AppLockSchedule } from '@/features/app-lock/types';

type ActivateAt = AppLockSchedule['activateAt'];

export default function AppLockScheduleScreen() {
  const iconColors = useIconColors();
  const [config, setConfig] = useState<AppLockConfig | null>(null);

  const load = useCallback(async () => {
    setConfig(await getAppLockConfig());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleActivateAt = async (activateAt: ActivateAt) => {
    if (!config) return;
    const next: AppLockConfig = {
      ...config,
      schedule: { ...config.schedule, activateAt },
    };
    setConfig(next);
    await saveAppLockConfig(next);
  };

  const handleHourChange = async (
    field: 'morningHour' | 'nightHour' | 'customActivateHour',
    value: number
  ) => {
    if (!config) return;
    const next: AppLockConfig = {
      ...config,
      schedule: { ...config.schedule, [field]: value },
    };
    setConfig(next);
    await saveAppLockConfig(next);
  };

  if (!config) return null;

  const s = config.schedule;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Schedule" rightSlot={<ThemeToggle />} showBack />
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted-foreground mb-4">
        Choose when the app lock activates each day. Lock stays active until you make your
        commitment.
      </Text>

      {(['morning', 'night', 'custom'] as const).map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => handleActivateAt(opt)}
          className="flex-row items-center justify-between py-4 border-b border-border"
        >
          <View>
            <Text className="text-base font-medium text-foreground capitalize">{opt}</Text>
            <Text className="text-sm text-muted-foreground mt-0.5">
              {opt === 'morning' && `Lock activates at ${s.morningHour ?? 6}:00 AM`}
              {opt === 'night' && `Lock activates at ${s.nightHour ?? 22}:00 (10 PM) previous day`}
              {opt === 'custom' && `Lock activates at your custom time`}
            </Text>
          </View>
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              s.activateAt === opt ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`}
          >
            {s.activateAt === opt && <Check size={14} color={iconColors.primaryForeground} />}
          </View>
        </TouchableOpacity>
      ))}

      {s.activateAt === 'morning' && (
        <View className="mt-6 rounded-2xl p-4 bg-card border border-border">
          <Text className="text-sm font-medium text-foreground mb-2">Morning hour (0–23)</Text>
          <View className="flex-row gap-2 flex-wrap">
            {[5, 6, 7, 8, 9].map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => handleHourChange('morningHour', h)}
                className={`rounded-xl py-2 px-4 ${
                  (s.morningHour ?? 6) === h ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text
                  className={(s.morningHour ?? 6) === h ? 'text-primary-foreground font-medium' : 'text-muted-foreground'}
                >
                  {h}:00
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {s.activateAt === 'night' && (
        <View className="mt-6 rounded-2xl p-4 bg-card border border-border">
          <Text className="text-sm font-medium text-foreground mb-2">Night hour (0–23)</Text>
          <View className="flex-row gap-2 flex-wrap">
            {[20, 21, 22, 23].map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => handleHourChange('nightHour', h)}
                className={`rounded-xl py-2 px-4 ${
                  (s.nightHour ?? 22) === h ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text
                  className={(s.nightHour ?? 22) === h ? 'text-primary-foreground font-medium' : 'text-muted-foreground'}
                >
                  {h}:00
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}
