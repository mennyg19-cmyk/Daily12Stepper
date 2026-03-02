/**
 * App Lock — emergency apps always allowed (Phone, Messages, etc.).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useIconColors } from '@/lib/iconTheme';
import { getAppLockConfig, saveAppLockConfig } from '@/features/app-lock/storage';
import { openAppPicker } from '@/features/app-lock/native';
import type { AppLockConfig } from '@/features/app-lock/types';

export default function AppLockEmergencyAppsScreen() {
  const iconColors = useIconColors();
  const [config, setConfig] = useState<AppLockConfig | null>(null);

  const load = useCallback(async () => {
    setConfig(await getAppLockConfig());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePickApps = async () => {
    try {
      const { selected } = await openAppPicker(config?.emergencyAppIds ?? [], 'allow');
      if (!config) return;
      const next: AppLockConfig = {
        ...config,
        emergencyAppIds: selected.map((a) => a.id),
      };
      setConfig(next);
      await saveAppLockConfig(next);
    } catch {
      Alert.alert(
        'App picker',
        'Native app picker is not yet implemented. Add FamilyActivityPicker (iOS) or app list (Android) to enable selecting emergency apps.'
      );
    }
  };

  if (!config) return null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted-foreground mb-4">
        These apps stay accessible even when the lock is active. Add Phone, Messages, and any
        emergency or essential apps.
      </Text>

      <TouchableOpacity
        onPress={handlePickApps}
        className="rounded-2xl p-4 bg-card border border-border"
      >
        <Text className="text-base font-medium text-foreground">
          {config.emergencyAppIds.length > 0
            ? `Edit emergency apps (${config.emergencyAppIds.length})`
            : 'Select emergency apps'}
        </Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Opens system app picker when native module is implemented
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
