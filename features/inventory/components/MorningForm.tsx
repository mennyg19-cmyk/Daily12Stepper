import React, { useState, useMemo } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { SavedSection } from './SavedSection';
import { DoneCard } from './DoneCard';
import { emptyPayload, parseMorningNotes } from '../helpers';
import { isToday } from '@/utils/date';
import { ModalLabel, ModalInput, ModalSection, ModalButton } from '@/components/ModalContent';
import { useSwitchColors } from '@/lib/iconTheme';
import type { InventoryEntry } from '@/lib/database/schema';

interface MorningFormProps {
  morningEntries: InventoryEntry[];
  switchColors: { trackColor: { false: string; true: string }; thumbColor: string };
  iconColors: ReturnType<typeof import('@/lib/iconTheme').useIconColors>;
  privacyLock: { isLocked: boolean; authenticate: (r?: string) => Promise<boolean> };
  addEntry: (e: Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>, o?: { createdAt?: string }) => Promise<unknown>;
  updateEntry: (id: string, u: Partial<Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<unknown>;
  removeEntry: (id: string) => Promise<void>;
}

export function MorningForm({
  morningEntries,
  switchColors,
  privacyLock,
  addEntry,
  updateEntry,
  removeEntry,
}: MorningFormProps) {
  const morningEntryToday = useMemo(
    () => morningEntries.find((e) => isToday(e.createdAt)),
    [morningEntries]
  );

  const [editing, setEditing] = useState(false);
  const [prayed, setPrayed] = useState(false);
  const [plans, setPlans] = useState('');
  const [notes, setNotes] = useState('');

  const existing = morningEntryToday ? parseMorningNotes(morningEntryToday.notes) : {};

  const handleSave = async () => {
    const hasContent = prayed || plans.trim() || notes.trim();
    if (!hasContent) {
      Alert.alert('Please complete your morning inventory');
      return;
    }
    try {
      const morningData = { plans: plans.trim() || undefined, askFor: notes.trim() || undefined };
      const noteStr = plans.trim() || notes.trim() ? JSON.stringify(morningData) : undefined;
      if (morningEntryToday && editing) {
        await updateEntry(morningEntryToday.id, { prayed, notes: noteStr });
        setEditing(false);
      } else {
        await addEntry({ ...emptyPayload('morning'), prayed, notes: noteStr });
      }
      setPrayed(false);
      setPlans('');
      setNotes('');
    } catch {
      Alert.alert('Failed to save');
    }
  };

  const handleEdit = () => {
    setEditing(true);
    if (morningEntryToday) {
      setPrayed(morningEntryToday.prayed);
      const d = parseMorningNotes(morningEntryToday.notes);
      setPlans(d.plans ?? '');
      setNotes(d.askFor ?? '');
    }
  };

  if (morningEntryToday && !editing) {
    return (
      <>
        <DoneCard
          title="Morning reflection done"
          subtitle={`Prayed: ${morningEntryToday.prayed ? 'Yes' : 'No'}`}
          onEdit={handleEdit}
        />
        <SavedSection
          title="Past entries"
          emptyMessage="No morning entries yet."
          hasEntries={morningEntries.length > 0}
        >
          {morningEntries.map((e) => (
            <View key={e.id} className="p-3 rounded-lg border border-border">
              <Text className="text-xs text-muted-foreground">
                {new Date(e.createdAt).toLocaleDateString()}
              </Text>
              <Text className="text-sm text-foreground">
                Prayed: {e.prayed ? 'Yes' : 'No'}
              </Text>
            </View>
          ))}
        </SavedSection>
      </>
    );
  }

  return (
    <>
      <ModalSection>
        <View className="flex-row items-center justify-between">
          <ModalLabel>Did you pray/meditate this morning?</ModalLabel>
          <Switch
            value={prayed}
            onValueChange={setPrayed}
            trackColor={switchColors.trackColor}
            thumbColor={switchColors.thumbColor}
          />
        </View>
      </ModalSection>
      <ModalSection>
        <ModalLabel>Plans for today</ModalLabel>
        <ModalInput value={plans} onChangeText={setPlans} placeholder="Optional" multiline />
      </ModalSection>
      <ModalSection last>
        <ModalLabel>What do you ask for?</ModalLabel>
        <ModalInput value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
      </ModalSection>
      <ModalButton onPress={handleSave} variant="primary">
        Save morning reflection
      </ModalButton>
    </>
  );
}
