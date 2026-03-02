/**
 * Sponsor recommended work time — progress bar, check off when goal reached.
 * Counts: stepwork time + completed tools that opt-in.
 * Editable target (e.g. 1 hour = 60 min).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useIconColors } from '@/lib/iconTheme';
import { getSponsorWorkTimeGoal, getSponsorWorkTimeProgress, createSponsorWorkTimeTool, updateSponsorWorkTimeGoal } from './database';
import { getTodayKey } from '@/utils/date';
import { Check, Pencil } from 'lucide-react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle, ModalSection, ModalLabel, ModalInput, ModalButton, ModalButtonRow } from '@/components/ModalContent';

interface SponsorWorkTimeCardProps {
  /** When true, show only time left (compact for extra tools) */
  compact?: boolean;
}

export function SponsorWorkTimeCard({ compact }: SponsorWorkTimeCardProps) {
  const iconColors = useIconColors();
  const [goal, setGoal] = useState<Awaited<ReturnType<typeof getSponsorWorkTimeGoal>>>(null);
  const [progress, setProgress] = useState<Awaited<ReturnType<typeof getSponsorWorkTimeProgress>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editMinutes, setEditMinutes] = useState('');

  const load = useCallback(async () => {
    const g = await getSponsorWorkTimeGoal();
    setGoal(g);
    if (g) {
      const today = getTodayKey();
      const p = await getSponsorWorkTimeProgress(today);
      setProgress(p);
    } else {
      setProgress(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    setLoading(true);
    try {
      try {
        await createSponsorWorkTimeTool(30);
      } catch {
        const { setSponsorWorkTimeMinutes } = await import('@/lib/profile');
        await setSponsorWorkTimeMinutes(30);
      }
      load();
    } catch {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    const mins = parseInt(editMinutes, 10);
    if (isNaN(mins) || mins < 1) return;
    await updateSponsorWorkTimeGoal(mins);
    setShowEdit(false);
    load();
  };

  if (loading) return null;
  if (!goal) {
    return (
      <TouchableOpacity
        onPress={handleAdd}
        className="bg-card rounded-xl p-4 border border-dashed border-border"
      >
        <Text className="text-muted-foreground text-center">
          Tap to add Sponsor recommended work time
        </Text>
      </TouchableOpacity>
    );
  }

  if (!progress) return null;

  const pct = Math.min(100, (progress.totalMinutes / progress.targetMinutes) * 100);
  const remaining = Math.max(0, progress.targetMinutes - progress.totalMinutes);

  if (compact) {
    return (
      <>
        <TouchableOpacity
          onPress={() => { setEditMinutes(String(goal.targetMinutes)); setShowEdit(true); }}
          className="bg-card rounded-xl p-3 border border-border flex-row items-center justify-between"
        >
          <Text className="text-sm font-semibold text-foreground">Sponsor work time</Text>
          {progress.completed ? (
            <View className="flex-row items-center gap-1">
              <Check size={16} color={iconColors.success} />
              <Text className="text-success text-sm font-medium">Done</Text>
            </View>
          ) : (
            <Text className="text-sm font-medium text-foreground">{remaining} min left</Text>
          )}
        </TouchableOpacity>
        <ModalSurface visible={showEdit} onRequestClose={() => setShowEdit(false)}>
          <View className="p-6">
            <ModalTitle>Edit sponsor work time</ModalTitle>
            <ModalSection>
              <ModalLabel>Target minutes per day</ModalLabel>
              <ModalInput
                value={editMinutes}
                onChangeText={setEditMinutes}
                placeholder="e.g. 60 for 1 hour"
                keyboardType="number-pad"
              />
            </ModalSection>
            <ModalButtonRow>
              <ModalButton onPress={() => setShowEdit(false)} variant="secondary">Cancel</ModalButton>
              <ModalButton onPress={handleSaveEdit} variant="primary" disabled={!editMinutes.trim()}>Save</ModalButton>
            </ModalButtonRow>
          </View>
        </ModalSurface>
      </>
    );
  }

  return (
    <View className="bg-card rounded-xl p-4 border border-border">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-foreground">Sponsor work time</Text>
        <View className="flex-row items-center gap-2">
          {progress.completed && (
            <View className="flex-row items-center gap-1">
              <Check size={18} color={iconColors.success} />
              <Text className="text-success text-sm font-medium">Done</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => { setEditMinutes(String(goal.targetMinutes)); setShowEdit(true); }} className="p-2">
            <Pencil size={18} color={iconColors.muted} />
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex-row items-baseline gap-2 mb-2">
        <Text className="text-2xl font-bold text-foreground">{progress.totalMinutes}</Text>
        <Text className="text-muted-foreground text-sm">/ {progress.targetMinutes} min</Text>
      </View>
      <View className="h-2 rounded-full bg-muted overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
      <Text className="text-xs text-muted-foreground mt-1">
        Stepwork: {progress.stepworkMinutes} min • Tools: {progress.toolMinutes} min
      </Text>

      <ModalSurface visible={showEdit} onRequestClose={() => setShowEdit(false)}>
        <View className="p-6">
          <ModalTitle>Edit sponsor work time</ModalTitle>
          <ModalSection>
            <ModalLabel>Target minutes per day</ModalLabel>
            <ModalInput
              value={editMinutes}
              onChangeText={setEditMinutes}
              placeholder="e.g. 60 for 1 hour"
              keyboardType="number-pad"
            />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowEdit(false)} variant="secondary">Cancel</ModalButton>
            <ModalButton onPress={handleSaveEdit} variant="primary" disabled={!editMinutes.trim()}>Save</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </View>
  );
}
