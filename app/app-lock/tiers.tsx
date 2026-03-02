/**
 * App Lock — list and manage unlock tiers.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { getAppLockConfig, saveAppLockConfig } from '@/features/app-lock/storage';
import type { AppLockConfig, AppLockTier } from '@/features/app-lock/types';

function tierLabel(tier: AppLockTier): string {
  if (tier.label) return tier.label;
  const cond = tier.unlockCondition ?? 'steps';
  if (cond === 'sponsor_work_time_half') return 'Half sponsor work time';
  if (cond === 'sponsor_work_time_full') return 'Full sponsor work time';
  const steps = tier.requiredSteps.sort((a, b) => a - b);
  return `Steps ${steps.join(', ')}`;
}

export default function AppLockTiersScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [config, setConfig] = useState<AppLockConfig | null>(null);

  const load = useCallback(async () => {
    setConfig(await getAppLockConfig());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addTier = async () => {
    if (!config) return;
    const id = `tier-${Date.now()}`;
    const tier: AppLockTier = {
      id,
      requiredSteps: [1, 2, 3],
      appIds: [],
      label: '',
    };
    const next: AppLockConfig = {
      ...config,
      tiers: [...config.tiers, tier],
    };
    setConfig(next);
    await saveAppLockConfig(next);
    router.push(`/app-lock/tier/${id}`);
  };

  const removeTier = async (id: string) => {
    if (!config) return;
    const next: AppLockConfig = {
      ...config,
      tiers: config.tiers.filter((t) => t.id !== id),
    };
    setConfig(next);
    await saveAppLockConfig(next);
  };

  if (!config) return null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Unlock Tiers" rightSlot={<ThemeToggle />} showBack />
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted-foreground mb-4">
        Define tiers: complete steps 1–3 to unlock tier 1 apps, steps 4–6 for tier 2, etc.
      </Text>

      {config.tiers.map((tier) => (
        <TouchableOpacity
          key={tier.id}
          onPress={() => router.push(`/app-lock/tier/${tier.id}`)}
          className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-base font-medium text-foreground">
              {tierLabel(tier) || 'Unnamed tier'}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {(tier.unlockCondition ?? 'steps') === 'steps'
                ? `Steps ${tier.requiredSteps.sort((a, b) => a - b).join(', ')}`
                : tier.unlockCondition === 'sponsor_work_time_half'
                  ? '50% sponsor work time'
                  : '100% sponsor work time'}
              {' → '}{tier.appIds.length} apps
            </Text>
          </View>
          <ChevronRight size={20} color={iconColors.muted} />
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={addTier}
        className="rounded-2xl p-4 border-2 border-dashed border-muted flex-row items-center justify-center mt-4"
      >
        <Plus size={20} color={iconColors.muted} />
        <Text className="text-muted-foreground font-medium ml-2">Add tier</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}
