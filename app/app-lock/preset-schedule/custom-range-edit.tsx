/**
 * App Lock — add or edit a custom date range.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPresetScheduleConfig,
  getPresets,
  savePresetScheduleConfig,
} from '@/features/app-lock/storage';
import type { PresetCustomRange } from '@/features/app-lock/types';

export default function CustomRangeEditScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const { rangeId } = useLocalSearchParams<{ rangeId?: string }>();
  const [schedule, setSchedule] = useState<Awaited<ReturnType<typeof getPresetScheduleConfig>> | null>(null);
  const [presets, setPresets] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [presetId, setPresetId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([getPresetScheduleConfig(), getPresets()]);
    setSchedule(s);
    setPresets(p.map((x) => ({ id: x.id, name: x.name })));
    if (rangeId) {
      const range = s.customRanges.find((r) => r.id === rangeId);
      if (range) {
        setName(range.name);
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        setPresetId(range.presetId);
        setNotes(range.notes ?? '');
      }
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setName('');
      setStartDate(today);
      setEndDate(today);
      setPresetId(p[0]?.id ?? null);
      setNotes('');
    }
  }, [rangeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter a name for this date range.');
      return;
    }
    if (!presetId) {
      Alert.alert('Select preset', 'Choose a preset for this range.');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Dates required', 'Enter start and end dates (YYYY-MM-DD).');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('Invalid dates', 'Start date must be before or equal to end date.');
      return;
    }

    const range: PresetCustomRange = {
      id: rangeId ?? `range-${Date.now()}`,
      name: trimmed,
      startDate: startDate.slice(0, 10),
      endDate: endDate.slice(0, 10),
      presetId,
      notes: notes.trim() || undefined,
    };

    const existing = schedule!.customRanges.findIndex((r) => r.id === range.id);
    const customRanges =
      existing >= 0
        ? schedule!.customRanges.map((r) => (r.id === range.id ? range : r))
        : [...schedule!.customRanges, range];

    const next = { ...schedule!, customRanges };
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
      <Text className="text-sm font-medium text-foreground mb-2">Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Summer vacation"
        className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground mb-4"
      />

      <Text className="text-sm font-medium text-foreground mb-2">Start date (YYYY-MM-DD)</Text>
      <TextInput
        value={startDate}
        onChangeText={setStartDate}
        placeholder="2025-07-01"
        className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground mb-4"
      />

      <Text className="text-sm font-medium text-foreground mb-2">End date (YYYY-MM-DD)</Text>
      <TextInput
        value={endDate}
        onChangeText={setEndDate}
        placeholder="2025-07-15"
        className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground mb-4"
      />

      <Text className="text-sm font-medium text-foreground mb-2">Preset</Text>
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

      <Text className="text-sm font-medium text-foreground mt-4 mb-2">Notes (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Family trip"
        multiline
        className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground mb-4"
      />

      <TouchableOpacity
        onPress={handleSave}
        className="rounded-2xl py-4 bg-primary items-center mt-6"
      >
        <Text className="text-primary-foreground font-semibold">Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
