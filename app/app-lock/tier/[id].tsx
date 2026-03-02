/**
 * App Lock — edit a single tier (steps, sponsor work time, apps to unlock).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIconColors } from '@/lib/iconTheme';
import { getAppLockConfig, saveAppLockConfig } from '@/features/app-lock/storage';
import { openAppPicker } from '@/features/app-lock/native';
import type { AppLockConfig, AppLockTier, TierUnlockCondition } from '@/features/app-lock/types';

const ALL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const UNLOCK_OPTIONS: { value: TierUnlockCondition; label: string }[] = [
  { value: 'steps', label: 'Steps completed' },
  { value: 'sponsor_work_time_half', label: 'Half sponsor work time' },
  { value: 'sponsor_work_time_full', label: 'Full sponsor work time' },
];

export default function AppLockTierEditScreen() {
  const iconColors = useIconColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [label, setLabel] = useState('');

  const tier = config?.tiers.find((t) => t.id === id);
  const unlockCondition = (tier?.unlockCondition ?? 'steps') as TierUnlockCondition;

  const load = useCallback(async () => {
    const c = await getAppLockConfig();
    setConfig(c);
    const t = c.tiers.find((x) => x.id === id);
    if (t) setLabel(t.label);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetUnlockCondition = async (cond: TierUnlockCondition) => {
    if (!config || !tier) return;
    const nextTiers = config.tiers.map((t) =>
      t.id === id ? { ...t, unlockCondition: cond } : t
    );
    const next: AppLockConfig = { ...config, tiers: nextTiers };
    setConfig(next);
    await saveAppLockConfig(next);
  };

  const handleToggleStep = async (step: number) => {
    if (!config || !tier) return;
    const has = tier.requiredSteps.includes(step);
    const nextSteps = has
      ? tier.requiredSteps.filter((s) => s !== step)
      : [...tier.requiredSteps, step].sort((a, b) => a - b);
    const nextTiers = config.tiers.map((t) =>
      t.id === id ? { ...t, requiredSteps: nextSteps } : t
    );
    const next: AppLockConfig = { ...config, tiers: nextTiers };
    setConfig(next);
    await saveAppLockConfig(next);
  };

  const handleLabelSave = async () => {
    if (!config || !tier) return;
    const nextTiers = config.tiers.map((t) =>
      t.id === id ? { ...t, label } : t
    );
    const next: AppLockConfig = { ...config, tiers: nextTiers };
    setConfig(next);
    await saveAppLockConfig(next);
  };

  const handlePickApps = async () => {
    try {
      const { selected } = await openAppPicker(tier?.appIds ?? [], 'allow');
      if (!config || !tier || selected.length === 0) return;
      const nextTiers = config.tiers.map((t) =>
        t.id === id ? { ...t, appIds: selected.map((a) => a.id) } : t
      );
      const next: AppLockConfig = { ...config, tiers: nextTiers };
      setConfig(next);
      await saveAppLockConfig(next);
    } catch {
      Alert.alert(
        'App picker',
        'Native app picker is not yet implemented. Add FamilyActivityPicker (iOS) or app list (Android) to enable.'
      );
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete tier', 'Remove this tier?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!config) return;
          const next: AppLockConfig = {
            ...config,
            tiers: config.tiers.filter((t) => t.id !== id),
          };
          setConfig(next);
          await saveAppLockConfig(next);
          router.back();
        },
      },
    ]);
  };

  if (!config || !tier) return null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Edit Tier" rightSlot={<ThemeToggle />} showBack />
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <View className="rounded-2xl p-4 bg-card border border-border mb-4">
        <Text className="text-sm font-medium text-foreground mb-2">Label</Text>
        <TextInput
          value={label}
          onChangeText={setLabel}
          onBlur={handleLabelSave}
          placeholder="e.g. Social media"
          className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground"
        />
      </View>

      <View className="rounded-2xl p-4 bg-card border border-border mb-4">
        <Text className="text-sm font-medium text-foreground mb-2">Unlock condition</Text>
        <View className="gap-2 mb-3">
          {UNLOCK_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleSetUnlockCondition(opt.value)}
              className={`rounded-xl py-2 px-4 ${
                unlockCondition === opt.value ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <Text
                className={unlockCondition === opt.value ? 'text-primary-foreground font-medium' : 'text-muted-foreground'}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-xs text-muted-foreground mb-2">
          {unlockCondition === 'steps'
            ? 'Select steps required to unlock this tier.'
            : unlockCondition === 'sponsor_work_time_half'
              ? 'Unlock when 50% of daily sponsor work time is done (from Profile).'
              : 'Unlock when 100% of daily sponsor work time is done (from Profile).'}
        </Text>
      </View>

      {unlockCondition === 'steps' && (
      <View className="rounded-2xl p-4 bg-card border border-border mb-4">
        <Text className="text-sm font-medium text-foreground mb-2">Steps required to unlock</Text>
        <Text className="text-xs text-muted-foreground mb-3">
          User must complete these steps before apps in this tier are unlocked.
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {ALL_STEPS.map((step) => {
            const selected = tier.requiredSteps.includes(step);
            return (
              <TouchableOpacity
                key={step}
                onPress={() => handleToggleStep(step)}
                className={`rounded-xl py-2 px-4 ${
                  selected ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text
                  className={selected ? 'text-primary-foreground font-medium' : 'text-muted-foreground'}
                >
                  Step {step}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      )}

      <View className="rounded-2xl p-4 bg-card border border-border mb-4">
        <Text className="text-sm font-medium text-foreground mb-2">Apps in this tier</Text>
        <Text className="text-xs text-muted-foreground mb-3">
          These apps unlock when the unlock condition is met.
        </Text>
        <TouchableOpacity
          onPress={handlePickApps}
          className="rounded-xl py-3 border border-border items-center"
        >
          <Text className="text-foreground font-medium">
            {tier.appIds.length > 0 ? `Edit (${tier.appIds.length} apps)` : 'Select apps'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleDelete}
        className="rounded-xl py-3 border border-destructive items-center mt-4"
      >
        <Text className="text-destructive font-medium">Delete tier</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}
