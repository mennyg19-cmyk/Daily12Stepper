/**
 * Sobriety counters — one per addiction from profile.
 * Shows all addictions with their sobriety timers.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getAddictions, updateAddiction } from '@/lib/profile';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle, ModalSection, ModalLabel, ModalInput, ModalButton, ModalButtonRow } from '@/components/ModalContent';
import type { Addiction } from '@/lib/profile';

function secondsSince(datetimeStr: string): number {
  const start = new Date(datetimeStr).getTime();
  return Math.floor((Date.now() - start) / 1000);
}

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export function SobrietyCountersSection() {
  const router = useRouter();
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const [editingAddiction, setEditingAddiction] = useState<Addiction | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  const load = async () => {
    const list = await getAddictions();
    setAddictions(list);
    const init: Record<string, number> = {};
    for (const a of list) {
      if (a.startDatetime) init[a.id] = secondsSince(a.startDatetime);
    }
    setElapsed(init);
  };

  useFocusEffect(React.useCallback(() => { load(); }, []));

  useEffect(() => {
    if (addictions.length === 0) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = { ...prev };
        for (const a of addictions) {
          if (a.startDatetime) next[a.id] = secondsSince(a.startDatetime);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [addictions]);

  const openEdit = (a: Addiction) => {
    setEditingAddiction(a);
    if (a.startDatetime) {
      const d = new Date(a.startDatetime);
      setDateInput(d.toISOString().slice(0, 10));
      setTimeInput(d.toTimeString().slice(0, 5));
    } else {
      setDateInput(new Date().toISOString().slice(0, 10));
      setTimeInput(new Date().toTimeString().slice(0, 5));
    }
  };

  const handleSave = async () => {
    if (!editingAddiction) return;
    const [y, mo, d] = (dateInput || new Date().toISOString().slice(0, 10)).split('-').map(Number);
    const [h, mi] = (timeInput || '00:00').split(':').map(Number);
    const dt = new Date(y ?? 2020, (mo ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, 0, 0);
    await updateAddiction(editingAddiction.id, { startDatetime: dt.toISOString() });
    setEditingAddiction(null);
    load();
  };

  if (addictions.length === 0) {
    return (
      <TouchableOpacity
        onPress={() => router.push('/profile')}
        className="bg-card rounded-xl p-4 border border-dashed border-border"
      >
        <Text className="text-muted-foreground text-center">
          Add addictions in Profile to track sobriety
        </Text>
        <Text className="text-primary text-sm text-center mt-1">Go to Profile</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <View className="gap-2">
        {addictions.map((a) => (
          <View key={a.id} className="bg-card rounded-xl p-4 border border-border">
            <Text className="text-sm font-semibold text-muted-foreground mb-1">{a.name}</Text>
            {a.startDatetime ? (
              <>
                <Text className="text-2xl font-bold text-foreground font-mono tabular-nums">
                  {formatDuration(elapsed[a.id] ?? 0)}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Since {new Date(a.startDatetime).toLocaleString()}
                </Text>
                <TouchableOpacity
                  onPress={() => openEdit(a)}
                  className="mt-2 py-2 rounded-lg border border-border items-center"
                >
                  <Text className="text-muted-foreground text-sm">Edit / Reset</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => openEdit(a)}
                className="py-3 rounded-lg border border-dashed border-border items-center"
              >
                <Text className="text-muted-foreground text-sm">Tap to set start date</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <ModalSurface visible={!!editingAddiction} onRequestClose={() => setEditingAddiction(null)}>
        <View className="p-6">
          <ModalTitle>{editingAddiction?.name} — Start date</ModalTitle>
          <ModalSection>
            <ModalLabel>Date (YYYY-MM-DD)</ModalLabel>
            <ModalInput value={dateInput} onChangeText={setDateInput} placeholder="2025-01-01" />
          </ModalSection>
          <ModalSection>
            <ModalLabel>Time (HH:MM)</ModalLabel>
            <ModalInput value={timeInput} onChangeText={setTimeInput} placeholder="08:00" />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setEditingAddiction(null)} variant="secondary">Cancel</ModalButton>
            <ModalButton onPress={handleSave} variant="primary">Save</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </>
  );
}
