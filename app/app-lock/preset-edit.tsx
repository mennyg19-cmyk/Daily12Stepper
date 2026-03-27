/**
 * App Lock — create or edit preset (name, notes, configure).
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronRight, Check } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresets,
  savePreset,
  applyPreset,
  getAppLockConfig,
  setActivePresetId,
} from '@/features/app-lock/storage';
import { getBuiltInPreset } from '@/features/app-lock/presets';
import type { AppLockPreset, AppLockConfig, AppLockTier, LockMode, BuiltInPresetId } from '@/features/app-lock/types';

export default function PresetEditScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const { fromPresetId, editPresetId } = useLocalSearchParams<{
    fromPresetId?: string;
    editPresetId?: string;
  }>();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(true);

  const load = useCallback(async () => {
    const { saveAppLockConfig } = await import('@/features/app-lock/storage');
    const all = await getPresets();
    if (editPresetId) {
      const p = all.find((x) => x.id === editPresetId);
      if (p && !p.isBuiltIn) {
        setName(p.name);
        setNotes(p.notes);
        setConfig(JSON.parse(JSON.stringify(p.config)));
        setPresetId(p.id);
        setIsNew(false);
        await applyPreset(p);
        return;
      }
    }
    if (fromPresetId) {
      const p = all.find((x) => x.id === fromPresetId) ?? (fromPresetId.startsWith('builtin-') ? getBuiltInPreset(fromPresetId.replace('builtin-', '') as BuiltInPresetId) : null);
      if (p) {
        setName(`${p.name} (my copy)`);
        setNotes(p.notes);
        const cfg = JSON.parse(JSON.stringify(p.config));
        setConfig(cfg);
        setPresetId(null);
        setIsNew(true);
        await setActivePresetId(null);
        await saveAppLockConfig(cfg);
        return;
      }
    }
    await setActivePresetId(null);
    const cfg = {
      enabled: true,
      mode: 'full' as const,
      emergencyAppIds: [] as string[],
      tiers: [] as AppLockTier[],
      schedule: { activateAt: 'morning' as const, morningHour: 6, nightHour: 22 },
      fullModeBlockAll: true,
    };
    setConfig(cfg);
    setName('');
    setNotes('');
    setPresetId(null);
    setIsNew(true);
    await saveAppLockConfig(cfg);
  }, [fromPresetId, editPresetId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter a name for this preset.');
      return;
    }
    const currentConfig = await getAppLockConfig();
    const id = presetId ?? `preset-${Date.now()}`;
    const preset: AppLockPreset = {
      id,
      name: trimmed,
      notes: notes.trim(),
      config: currentConfig,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };
    await savePreset(preset);
    if (isNew) await applyPreset(preset);
    Alert.alert('Saved', `Preset "${trimmed}" saved.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  if (!config) return null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Edit Preset" rightSlot={<ThemeToggle />} showBack />
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <View className="rounded-2xl p-4 bg-card border border-border mb-4">
        <Text className="text-sm font-medium text-foreground mb-2">Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Weekend blocking, Work day"
          className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground"
        />
        <Text className="text-sm font-medium text-foreground mt-4 mb-2">Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Use on Saturdays when I need focus"
          multiline
          numberOfLines={3}
          className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground"
        />
      </View>

      <Text className="text-base font-semibold text-foreground mb-2">Configuration</Text>
      <Text className="text-sm text-muted-foreground mb-4">
        Customize schedule, lock mode, tiers, and emergency apps for this preset.
      </Text>

      <View className="rounded-2xl p-4 bg-card border border-border mb-3">
        <Text className="text-sm font-medium text-foreground mb-2">Lock mode</Text>
        <Text className="text-xs text-muted-foreground mb-3">
          Full: block all apps until commitment. Tiered: unlock app groups as you complete steps.
        </Text>
        <View className="flex-row gap-2">
          {(['full', 'tiered'] as LockMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={async () => {
                if (!config) return;
                const next: AppLockConfig = {
                  ...config,
                  mode: m,
                  tiers: m === 'tiered' && config.tiers.length === 0
                    ? [{ id: `tier-${Date.now()}`, requiredSteps: [1, 2, 3], appIds: [], label: 'Tier 1' }]
                    : config.tiers,
                };
                setConfig(next);
                const { saveAppLockConfig } = await import('@/features/app-lock/storage');
                await saveAppLockConfig(next);
              }}
              className={`flex-1 py-2.5 rounded-xl border items-center flex-row justify-center gap-2 ${
                config.mode === m ? 'bg-primary border-primary' : 'border-border'
              }`}
            >
              <Text className={config.mode === m ? 'text-primary-foreground font-medium' : 'text-foreground'}>
                {m === 'full' ? 'Full' : 'Tiered'}
              </Text>
              {config.mode === m && <Check size={16} color="white" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/app-lock/schedule')}
        className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
      >
        <Text className="text-base font-medium text-foreground">Schedule</Text>
        <Text className="text-sm text-muted-foreground">
          {config.schedule.activateAt === 'morning'
            ? `${config.schedule.morningHour ?? 6}:00 AM`
            : config.schedule.activateAt === 'night'
              ? `${config.schedule.nightHour ?? 22}:00`
              : 'Custom'}
        </Text>
        <ChevronRight size={20} color={iconColors.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/app-lock/emergency-apps')}
        className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
      >
        <Text className="text-base font-medium text-foreground">Emergency apps</Text>
        <Text className="text-sm text-muted-foreground">
          {config.emergencyAppIds.length} selected
        </Text>
        <ChevronRight size={20} color={iconColors.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          if (config.mode === 'full' && config.tiers.length === 0) {
            const next: AppLockConfig = {
              ...config,
              mode: 'tiered',
              tiers: [{ id: `tier-${Date.now()}`, requiredSteps: [1, 2, 3], appIds: [], label: 'Tier 1' }],
            };
            setConfig(next);
            const { saveAppLockConfig } = await import('@/features/app-lock/storage');
            await saveAppLockConfig(next);
          }
          router.push('/app-lock/tiers');
        }}
        className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
      >
        <Text className="text-base font-medium text-foreground">Unlock tiers</Text>
        <Text className="text-sm text-muted-foreground">
          {config.mode === 'tiered' ? `${config.tiers.length} tier(s)` : 'Add tiers (tap to switch to Tiered)'}
        </Text>
        <ChevronRight size={20} color={iconColors.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSave}
        className="rounded-2xl py-4 bg-primary items-center mt-6"
      >
        <Text className="text-primary-foreground font-semibold">
          {isNew ? 'Save preset' : 'Save changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}
