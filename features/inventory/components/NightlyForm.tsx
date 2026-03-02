import React, { useState, useMemo } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { SavedSection } from './SavedSection';
import { DoneCard } from './DoneCard';
import { emptyPayload } from '../helpers';
import { isToday } from '@/utils/date';
import { ModalLabel, ModalInput, ModalSection, ModalButton, ModalButtonRow, ModalTitle } from '@/components/ModalContent';
import { ModalSurface } from '@/components/ModalSurface';
import { addStep7Episode } from '@/features/steps/step7Database';
import type { InventoryEntry } from '@/lib/database/schema';

interface NightlyFormProps {
  nightlyEntries: InventoryEntry[];
  switchColors: { trackColor: { false: string; true: string }; thumbColor: string };
  iconColors: ReturnType<typeof import('@/lib/iconTheme').useIconColors>;
  privacyLock: { isLocked: boolean; authenticate: (r?: string) => Promise<boolean> };
  addEntry: (e: Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>, o?: { createdAt?: string }) => Promise<unknown>;
  updateEntry: (id: string, u: Partial<Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<unknown>;
  removeEntry: (id: string) => Promise<void>;
  readyDefects?: string[];
}

function parseNightlyNotes(notes: string | undefined): { notes?: string } {
  if (!notes?.trim()) return {};
  try {
    const parsed = JSON.parse(notes) as { notes?: string };
    if (typeof parsed === 'object' && parsed !== null) return { notes: parsed.notes };
  } catch {}
  return { notes };
}

export function NightlyForm({
  nightlyEntries,
  switchColors,
  privacyLock,
  addEntry,
  updateEntry,
  removeEntry,
  readyDefects = [],
}: NightlyFormProps) {
  const nightlyEntryToday = useMemo(
    () => nightlyEntries.find((e) => isToday(e.createdAt)),
    [nightlyEntries]
  );

  const [editing, setEditing] = useState(false);
  const [prayed, setPrayed] = useState(false);
  const [reflection, setReflection] = useState('');
  const [defectValues, setDefectValues] = useState<Record<string, boolean>>({});
  const [showDefectPopup, setShowDefectPopup] = useState<string | null>(null);
  const [defectSituation, setDefectSituation] = useState('');
  const [defectBetterResponse, setDefectBetterResponse] = useState('');

  const handleSave = async () => {
    const hasContent = prayed || reflection.trim();
    if (!hasContent) {
      Alert.alert('Please complete your nightly reflection');
      return;
    }
    try {
      const data: { notes?: string } = {};
      if (reflection.trim()) data.notes = reflection.trim();
      const notesStr = Object.keys(data).length > 0 ? JSON.stringify(data) : undefined;
      if (nightlyEntryToday && editing) {
        await updateEntry(nightlyEntryToday.id, { prayed, notes: notesStr });
        setEditing(false);
      } else {
        await addEntry({ ...emptyPayload('nightly'), prayed, notes: notesStr });
      }
      setPrayed(false);
      setReflection('');
    } catch {
      Alert.alert('Failed to save');
    }
  };

  const handleEdit = () => {
    setEditing(true);
    if (nightlyEntryToday) {
      setPrayed(nightlyEntryToday.prayed);
      const d = parseNightlyNotes(nightlyEntryToday.notes);
      setReflection(d.notes ?? '');
    }
  };

  const handleDefectToggle = (defect: string, value: boolean) => {
    if (value) {
      setShowDefectPopup(defect);
      setDefectSituation('');
      setDefectBetterResponse('');
    } else {
      setDefectValues((prev) => ({ ...prev, [defect]: false }));
    }
  };

  const handleDefectPopupSave = async () => {
    if (!showDefectPopup) return;
    try {
      await addStep7Episode(
        showDefectPopup,
        defectSituation.trim(),
        '',
        defectBetterResponse.trim()
      );
      setDefectValues((prev) => ({ ...prev, [showDefectPopup]: true }));
      setShowDefectPopup(null);
      setDefectSituation('');
      setDefectBetterResponse('');
    } catch {
      Alert.alert('Failed to save reflection');
    }
  };

  const handleDefectPopupCancel = () => {
    setShowDefectPopup(null);
    setDefectSituation('');
    setDefectBetterResponse('');
  };

  if (nightlyEntryToday && !editing) {
    return (
      <>
        <DoneCard
          title="Nightly reflection done"
          subtitle={`Prayed: ${nightlyEntryToday.prayed ? 'Yes' : 'No'}`}
          onEdit={handleEdit}
        />
        <SavedSection
          title="Past entries"
          emptyMessage="No nightly entries yet."
          hasEntries={nightlyEntries.length > 0}
        >
          {nightlyEntries.map((e) => (
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
          <ModalLabel>Did you pray/meditate tonight?</ModalLabel>
          <Switch
            value={prayed}
            onValueChange={setPrayed}
            trackColor={switchColors.trackColor}
            thumbColor={switchColors.thumbColor}
          />
        </View>
      </ModalSection>
      {readyDefects.length > 0 && (
        <ModalSection>
          <ModalLabel>Character defects (Step 6) — did you recognize them today?</ModalLabel>
          <Text className="text-xs text-muted-foreground mt-1 mb-2">
            Tap Yes to add a reflection — saved under Step 7.
          </Text>
          <View className="gap-2 mt-2">
            {readyDefects.map((defect) => (
              <View key={defect} className="flex-row items-center justify-between py-2 border-b border-border">
                <Text className="text-sm text-foreground flex-1">{defect}</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-muted-foreground">No</Text>
                  <Switch
                    value={(defectValues[defect] ?? false) || showDefectPopup === defect}
                    onValueChange={(v) => handleDefectToggle(defect, v)}
                    trackColor={switchColors.trackColor}
                    thumbColor={switchColors.thumbColor}
                  />
                  <Text className="text-xs text-muted-foreground">Yes</Text>
                </View>
              </View>
            ))}
          </View>
        </ModalSection>
      )}
      <ModalSurface visible={!!showDefectPopup} onRequestClose={handleDefectPopupCancel}>
        <View className="p-6">
          <ModalTitle>Reflection — {showDefectPopup}</ModalTitle>
          <Text className="text-sm text-muted-foreground mb-4">
            Did you recognize anytime throughout today that this defect came up?
          </Text>
          <ModalSection>
            <ModalLabel>What was the situation?</ModalLabel>
            <ModalInput
              value={defectSituation}
              onChangeText={setDefectSituation}
              placeholder="Describe when and where it came up..."
              multiline
            />
          </ModalSection>
          <ModalSection>
            <ModalLabel>How could you have handled it better?</ModalLabel>
            <ModalInput
              value={defectBetterResponse}
              onChangeText={setDefectBetterResponse}
              placeholder="Better response..."
              multiline
            />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={handleDefectPopupCancel} variant="secondary">Cancel</ModalButton>
            <ModalButton onPress={handleDefectPopupSave} variant="primary">Save to Step 7</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
      <ModalSection last>
        <ModalLabel>Reflection</ModalLabel>
        <ModalInput
          value={reflection}
          onChangeText={setReflection}
          placeholder="How was your day? What are you grateful for?"
          multiline
        />
      </ModalSection>
      <ModalButton onPress={handleSave} variant="primary">
        Save nightly reflection
      </ModalButton>
    </>
  );
}
