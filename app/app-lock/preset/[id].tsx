/**
 * App Lock — preset detail with full instructions, use, customize.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight, Check, Copy } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresets,
  getActivePresetId,
  applyPreset,
  savePreset,
  deletePreset,
} from '@/features/app-lock/storage';
import { BUILT_IN_PRESETS, getBuiltInPreset } from '@/features/app-lock/presets';
import type { AppLockPreset, BuiltInPresetId } from '@/features/app-lock/types';

export default function PresetDetailScreen() {
  const iconColors = useIconColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [preset, setPreset] = useState<AppLockPreset | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [all, active] = await Promise.all([getPresets(), getActivePresetId()]);
    const p = all.find((x) => x.id === id) ?? (id?.startsWith('builtin-') ? getBuiltInPreset(id.replace('builtin-', '') as BuiltInPresetId) : null);
    setPreset(p ?? null);
    setActiveId(active);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleUse = async () => {
    if (!preset) return;
    await applyPreset(preset);
    setActiveId(preset.id);
  };

  const handleSaveAsMine = () => {
    if (!preset) return;
    router.push({
      pathname: '/app-lock/preset-edit',
      params: { fromPresetId: preset.id },
    });
  };

  const handleCustomize = () => {
    if (!preset) return;
    router.push({
      pathname: '/app-lock/preset-edit',
      params: { editPresetId: preset.id },
    });
  };

  const handleDelete = () => {
    if (!preset || preset.isBuiltIn) return;
    const { Alert } = require('react-native');
    Alert.alert('Delete preset', `Remove "${preset.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePreset(preset.id);
          router.back();
        },
      },
    ]);
  };

  if (!preset) return null;

  const builtInInfo = preset.builtInId ? BUILT_IN_PRESETS[preset.builtInId] : null;
  const isActive = activeId === preset.id;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      {/* Header */}
      <View className="rounded-2xl p-4 bg-card border border-border mb-4">
        <Text className="text-xl font-bold text-foreground">{preset.name}</Text>
        {preset.notes ? (
          <Text className="text-sm text-muted-foreground mt-2">{preset.notes}</Text>
        ) : null}
        {isActive && (
          <View className="flex-row items-center mt-2">
            <Check size={16} color={iconColors.primary} />
            <Text className="text-sm text-primary font-medium ml-2">Currently active</Text>
          </View>
        )}
      </View>

      {/* Full instructions for built-in */}
      {builtInInfo && (
        <View className="rounded-2xl p-4 bg-card border border-border mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">Full description</Text>
          <Text className="text-sm text-muted-foreground leading-6">{builtInInfo.fullDescription}</Text>

          <Text className="text-base font-semibold text-foreground mt-4 mb-2">How it works</Text>
          <Text className="text-sm text-muted-foreground leading-6 whitespace-pre-line">
            {builtInInfo.howItWorks}
          </Text>

          <Text className="text-base font-semibold text-foreground mt-4 mb-2">How to replicate</Text>
          <Text className="text-sm text-muted-foreground leading-6 whitespace-pre-line">
            {builtInInfo.howToReplicate}
          </Text>
        </View>
      )}

      {/* Custom preset notes */}
      {!preset.isBuiltIn && preset.notes && (
        <View className="rounded-2xl p-4 bg-card border border-border mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">Notes</Text>
          <Text className="text-sm text-muted-foreground">{preset.notes}</Text>
        </View>
      )}

      {/* Config summary */}
      <View className="rounded-2xl p-4 bg-muted/30 border border-border mb-4">
        <Text className="text-sm font-medium text-foreground mb-2">Configuration summary</Text>
        <Text className="text-sm text-muted-foreground">
          • Mode: {preset.config.mode === 'full' ? 'Full lock' : 'Tiered unlock'}
        </Text>
        <Text className="text-sm text-muted-foreground">
          • Schedule: {preset.config.schedule.activateAt === 'morning'
            ? `Morning ${preset.config.schedule.morningHour ?? 6}:00`
            : preset.config.schedule.activateAt === 'night'
              ? `Night ${preset.config.schedule.nightHour ?? 22}:00`
              : 'Custom'}
        </Text>
        {preset.config.mode === 'tiered' && preset.config.tiers.length > 0 && (
          <Text className="text-sm text-muted-foreground">
            • Tiers: {preset.config.tiers.map((t) => t.label || `Steps ${t.requiredSteps.join(',')}`).join(', ')}
          </Text>
        )}
      </View>

      {/* Actions */}
      <TouchableOpacity
        onPress={handleUse}
        className="rounded-2xl py-4 bg-primary items-center mb-3"
      >
        <Text className="text-primary-foreground font-semibold">
          {isActive ? 'In use' : 'Use this preset'}
        </Text>
      </TouchableOpacity>

      {preset.isBuiltIn ? (
        <TouchableOpacity
          onPress={handleSaveAsMine}
          className="rounded-2xl py-4 border border-border flex-row items-center justify-center mb-3"
        >
          <Copy size={18} color={iconColors.primary} />
          <Text className="text-foreground font-medium ml-2">Customize & save as my preset</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleCustomize}
          className="rounded-2xl py-4 border border-border flex-row items-center justify-center mb-3"
        >
          <ChevronRight size={18} color={iconColors.primary} />
          <Text className="text-foreground font-medium ml-2">Edit this preset</Text>
        </TouchableOpacity>
      )}

      {!preset.isBuiltIn && (
        <TouchableOpacity
          onPress={handleDelete}
          className="rounded-2xl py-3 border border-destructive items-center mt-2"
        >
          <Text className="text-destructive font-medium">Delete preset</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
