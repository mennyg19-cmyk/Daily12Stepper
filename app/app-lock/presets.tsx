/**
 * App Lock — list presets (built-in + custom), select active.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresets,
  getActivePresetId,
} from '@/features/app-lock/storage';
import { isAppLockAvailable } from '@/features/app-lock/native';
import type { AppLockPreset } from '@/features/app-lock/types';
import { BUILT_IN_PRESETS } from '@/features/app-lock/presets';

export default function AppLockPresetsScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [presets, setPresets] = useState<AppLockPreset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);

  const load = useCallback(async () => {
    const [p, a, avail] = await Promise.all([
      getPresets(),
      getActivePresetId(),
      isAppLockAvailable(),
    ]);
    setPresets(p);
    setActiveId(a);
    setAvailable(avail);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted-foreground mb-4">
        Choose a preset or create your own. Examples: Weekend blocking, Work day, Vacation.
      </Text>

      <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Built-in presets
      </Text>
      {(['light', 'medium', 'heavy', 'extreme'] as const).map((id) => {
        const info = BUILT_IN_PRESETS[id];
        const preset = presets.find((p) => p.builtInId === id);
        const isActive = activeId === preset?.id;
        return (
          <TouchableOpacity
            key={id}
            onPress={() => router.push(`/app-lock/preset/${preset?.id ?? `builtin-${id}`}`)}
            className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
          >
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-semibold text-foreground">{info.name}</Text>
                {isActive && (
                  <View className="bg-primary rounded-full px-2 py-0.5">
                    <Text className="text-primary-foreground text-xs font-medium">Active</Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-muted-foreground mt-1">{info.shortDescription}</Text>
            </View>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>
        );
      })}

      {presets.filter((p) => !p.isBuiltIn).length > 0 && (
        <>
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2">
            Your presets
          </Text>
          {presets
            .filter((p) => !p.isBuiltIn)
            .map((preset) => (
              <TouchableOpacity
                key={preset.id}
                onPress={() => router.push(`/app-lock/preset/${preset.id}`)}
                className="rounded-2xl p-4 bg-card border border-border mb-3 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-foreground">{preset.name}</Text>
                    {activeId === preset.id && (
                      <View className="bg-primary rounded-full px-2 py-0.5">
                        <Text className="text-primary-foreground text-xs font-medium">Active</Text>
                      </View>
                    )}
                  </View>
                  {preset.notes ? (
                    <Text className="text-sm text-muted-foreground mt-1">{preset.notes}</Text>
                  ) : null}
                </View>
                <ChevronRight size={20} color={iconColors.muted} />
              </TouchableOpacity>
            ))}
        </>
      )}

      <TouchableOpacity
        onPress={() => router.push('/app-lock/preset-edit')}
        className="rounded-2xl p-4 border-2 border-dashed border-muted flex-row items-center justify-center mt-4"
      >
        <Text className="text-muted-foreground font-medium">+ Create new preset</Text>
      </TouchableOpacity>

      {!available && (
        <View className="mt-6 rounded-2xl p-4 bg-muted/50 border border-border">
          <Text className="text-sm text-muted-foreground">
            Native support required for blocking. Configure presets now; they will apply when the
            native module is implemented.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
