import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { emptyPayload } from '../helpers';
import { AFFECTS, DEFECTS, ASSETS, DEFECT_TO_ASSET } from '../step10Data';
import { SavedSection } from './SavedSection';
import {
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalButton,
} from '@/components/ModalContent';
import type { InventoryEntry } from '@/lib/database/schema';

interface ResentmentFormProps {
  step10Entries: InventoryEntry[];
  addEntry: (entry: Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InventoryEntry>;
  updateEntry: (id: string, updates: Partial<Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<InventoryEntry>;
  removeEntry: (id: string) => Promise<void>;
  scrollRef: React.RefObject<any>;
  privacyLock: { isLocked: boolean; authenticate: (r?: string) => Promise<boolean> };
}

const toggleSelection = (value: string, current: string[], setFn: (v: string[]) => void) => {
  if (current.includes(value)) setFn(current.filter((v) => v !== value));
  else setFn([...current, value]);
};

export function ResentmentForm({
  step10Entries,
  addEntry,
  updateEntry,
  removeEntry,
  privacyLock,
}: ResentmentFormProps) {
  const [who, setWho] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [affects, setAffects] = useState<string[]>([]);
  const [defects, setDefects] = useState<string[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [prayed, setPrayed] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [amendsNeeded, setAmendsNeeded] = useState(false);
  const [amendsTo, setAmendsTo] = useState('');
  const [helpWho, setHelpWho] = useState('');
  const [shareWith, setShareWith] = useState('');
  const [notes, setNotes] = useState('');

  const generatedPrayer = useMemo(() => {
    const d = defects.length > 0 ? defects.join(', ') : 'my defects';
    const a = assets.length > 0 ? assets.join(', ') : 'your character assets';
    return [
      "My Creator, I'm now willing that you have all of me, good and bad.",
      '',
      'I pray that you now remove from me every single defect of character which stands in the way of my usefulness to you and my fellows.',
      '',
      `Please take away my: ${d}`,
      '',
      `and replace them with: ${a}`,
      '',
      'Grant me strength, as I go out from here, to do thy bidding. Amen!',
    ].join('\n');
  }, [defects, assets]);

  const toggleDefect = (defect: string) => {
    if (defects.includes(defect)) {
      setDefects(defects.filter((d) => d !== defect));
      return;
    }
    setDefects([...defects, defect]);
    const mapped = DEFECT_TO_ASSET[defect];
    if (mapped && !assets.includes(mapped)) setAssets([...assets, mapped]);
  };

  const resetForm = () => {
    setWho('');
    setWhatHappened('');
    setAffects([]);
    setDefects([]);
    setAssets([]);
    setPrayed(false);
    setEditingEntryId(null);
    setAmendsNeeded(false);
    setAmendsTo('');
    setHelpWho('');
    setShareWith('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!who.trim()) {
      Alert.alert('Please enter who you are upset at');
      return;
    }
    if (!whatHappened.trim()) {
      Alert.alert('Please enter what happened');
      return;
    }
    try {
      const payload = {
        who: who.trim(),
        whatHappened: whatHappened.trim(),
        affects,
        defects,
        assets,
        seventhStepPrayer: generatedPrayer.trim(),
        prayed,
        amendsNeeded,
        amendsTo: amendsTo.trim(),
        helpWho: helpWho.trim(),
        shareWith: shareWith.trim(),
        notes: notes.trim() || undefined,
      };
      if (editingEntryId) {
        await updateEntry(editingEntryId, payload);
        resetForm();
      } else {
        await addEntry({ ...emptyPayload('step10'), ...payload });
        resetForm();
      }
    } catch {
      Alert.alert('Failed to save');
    }
  };

  const handleEdit = (entry: InventoryEntry) => {
    setEditingEntryId(entry.id);
    setWho(entry.who);
    setWhatHappened(entry.whatHappened);
    setAffects(entry.affects ?? []);
    setDefects(entry.defects ?? []);
    setAssets(entry.assets ?? []);
    setPrayed(entry.prayed);
    setAmendsNeeded(entry.amendsNeeded);
    setAmendsTo(entry.amendsTo ?? '');
    setHelpWho(entry.helpWho ?? '');
    setShareWith(entry.shareWith ?? '');
    setNotes(entry.notes ?? '');
  };

  const handleDelete = async (entryId: string) => {
    try {
      await removeEntry(entryId);
      if (editingEntryId === entryId) resetForm();
    } catch {
      Alert.alert('Failed to delete');
    }
  };

  return (
    <>
      <ModalSection>
        <ModalLabel>1. Who are you upset at?</ModalLabel>
        <ModalInput value={who} onChangeText={setWho} placeholder="Person, situation, yourself, etc." />
      </ModalSection>
      <ModalSection>
        <ModalLabel>2. What happened?</ModalLabel>
        <ModalInput value={whatHappened} onChangeText={setWhatHappened} placeholder="19 words or less" />
      </ModalSection>
      <ModalSection>
        <ModalLabel>3. Affects my…</ModalLabel>
        <View className="flex-row flex-wrap gap-2">
          {AFFECTS.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => toggleSelection(item, affects, setAffects)}
              className={`px-3 py-2 rounded-full border ${affects.includes(item) ? 'bg-primary border-primary' : 'border-border'}`}
            >
              <Text className={affects.includes(item) ? 'text-primary-foreground' : 'text-foreground'}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ModalSection>
      <ModalSection>
        <ModalLabel>4. My part (defects)</ModalLabel>
        <View className="flex-row flex-wrap gap-2">
          {DEFECTS.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => toggleDefect(item)}
              className={`px-3 py-2 rounded-full border ${defects.includes(item) ? 'bg-destructive border-destructive' : 'border-border'}`}
            >
              <Text className={defects.includes(item) ? 'text-destructive-foreground' : 'text-foreground'}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ModalSection>
      <ModalSection>
        <ModalLabel>5. Character assets</ModalLabel>
        <View className="flex-row flex-wrap gap-2">
          {ASSETS.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => toggleSelection(item, assets, setAssets)}
              className={`px-3 py-2 rounded-full border ${assets.includes(item) ? 'bg-primary border-primary' : 'border-border'}`}
            >
              <Text className={assets.includes(item) ? 'text-primary-foreground' : 'text-foreground'}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ModalSection>
      <ModalSection>
        <ModalLabel>6. Amends needed?</ModalLabel>
        <ModalInput value={amendsTo} onChangeText={setAmendsTo} placeholder="Who to make amends to" />
      </ModalSection>
      <ModalSection>
        <ModalLabel>7. Who can you help now?</ModalLabel>
        <ModalInput value={helpWho} onChangeText={setHelpWho} placeholder="Optional" />
      </ModalSection>
      <ModalSection last>
        <ModalLabel>Notes</ModalLabel>
        <ModalInput value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
      </ModalSection>

      <ModalButton onPress={handleSave} variant="primary">
        {editingEntryId ? 'Update Inventory' : 'Save Inventory'}
      </ModalButton>

      <SavedSection
        title="Saved entries"
        emptyMessage="No resentment inventories yet."
        hasEntries={step10Entries.length > 0}
      >
        {step10Entries.map((entry) => (
          <View key={entry.id} className="p-3 rounded-lg border border-border">
            <Text className="text-sm font-semibold text-foreground">{entry.who}</Text>
            <Text className="text-xs text-muted-foreground mt-1">{entry.whatHappened}</Text>
            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity onPress={() => handleEdit(entry)} className="px-2 py-1 bg-primary rounded">
                <Text className="text-primary-foreground text-xs">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(entry.id)} className="px-2 py-1 bg-destructive rounded">
                <Text className="text-destructive-foreground text-xs">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </SavedSection>
    </>
  );
}
