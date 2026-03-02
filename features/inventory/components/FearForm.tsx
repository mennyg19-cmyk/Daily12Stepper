import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Plus, X } from 'lucide-react-native';
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

interface FearFormProps {
  fearEntries: InventoryEntry[];
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

export function FearForm({
  fearEntries,
  addEntry,
  updateEntry,
  removeEntry,
}: FearFormProps) {
  const [fearWhat, setFearWhat] = useState('');
  const [fearLayers, setFearLayers] = useState<string[]>(['']);
  const [fearAffects, setFearAffects] = useState<string[]>([]);
  const [fearDefects, setFearDefects] = useState<string[]>([]);
  const [fearAssets, setFearAssets] = useState<string[]>([]);
  const [fearEditingEntryId, setFearEditingEntryId] = useState<string | null>(null);
  const [fearHelpWho, setFearHelpWho] = useState('');
  const [fearShareWith, setFearShareWith] = useState('');
  const [fearNotes, setFearNotes] = useState('');

  const generatedPrayer = useMemo(() => {
    const d = fearDefects.length > 0 ? fearDefects.join(', ') : 'my defects';
    const a = fearAssets.length > 0 ? fearAssets.join(', ') : 'your character assets';
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
  }, [fearDefects, fearAssets]);

  const toggleDefect = (defect: string) => {
    if (fearDefects.includes(defect)) {
      setFearDefects(fearDefects.filter((d) => d !== defect));
      return;
    }
    setFearDefects([...fearDefects, defect]);
    const mapped = DEFECT_TO_ASSET[defect];
    if (mapped && !fearAssets.includes(mapped)) setFearAssets([...fearAssets, mapped]);
  };

  const updateLayer = (index: number, value: string) => {
    setFearLayers((prev) => prev.map((l, i) => (i === index ? value : l)));
  };

  const addLayer = () => setFearLayers((prev) => [...prev, '']);
  const removeLayer = (index: number) => setFearLayers((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setFearWhat('');
    setFearLayers(['']);
    setFearAffects([]);
    setFearDefects([]);
    setFearAssets([]);
    setFearEditingEntryId(null);
    setFearHelpWho('');
    setFearShareWith('');
    setFearNotes('');
  };

  const handleSave = async () => {
    if (!fearWhat.trim()) {
      Alert.alert('Please enter what you are afraid of');
      return;
    }
    const nonEmpty = fearLayers.filter((l) => l.trim());
    if (nonEmpty.length === 0) {
      Alert.alert('Please enter at least one underlying fear');
      return;
    }
    try {
      const payload = {
        who: fearWhat.trim(),
        whatHappened: JSON.stringify(nonEmpty),
        affects: fearAffects,
        defects: fearDefects,
        assets: fearAssets,
        seventhStepPrayer: generatedPrayer.trim(),
        prayed: false,
        amendsNeeded: false,
        amendsTo: '',
        helpWho: fearHelpWho.trim(),
        shareWith: fearShareWith.trim(),
        notes: fearNotes.trim() || undefined,
      };
      if (fearEditingEntryId) {
        await updateEntry(fearEditingEntryId, payload);
        resetForm();
      } else {
        await addEntry({ ...emptyPayload('fear'), ...payload });
        resetForm();
      }
    } catch {
      Alert.alert('Failed to save');
    }
  };

  const parseLayers = (entry: InventoryEntry): string[] => {
    try {
      const p = JSON.parse(entry.whatHappened);
      return Array.isArray(p) ? p : [entry.whatHappened];
    } catch {
      return [entry.whatHappened];
    }
  };

  const handleEdit = (entry: InventoryEntry) => {
    setFearEditingEntryId(entry.id);
    setFearWhat(entry.who);
    setFearLayers(parseLayers(entry));
    setFearAffects(entry.affects ?? []);
    setFearDefects(entry.defects ?? []);
    setFearAssets(entry.assets ?? []);
    setFearHelpWho(entry.helpWho ?? '');
    setFearShareWith(entry.shareWith ?? '');
    setFearNotes(entry.notes ?? '');
  };

  const handleDelete = async (entryId: string) => {
    try {
      await removeEntry(entryId);
      if (fearEditingEntryId === entryId) resetForm();
    } catch {
      Alert.alert('Failed to delete');
    }
  };

  return (
    <>
      <ModalSection>
        <ModalLabel>1. What am I afraid of?</ModalLabel>
        <ModalInput value={fearWhat} onChangeText={setFearWhat} placeholder="e.g. losing my job" />
      </ModalSection>
      <ModalSection>
        <ModalLabel>2. Underlying fears (and then what?)</ModalLabel>
        {fearLayers.map((layer, i) => (
          <View key={i} className="flex-row gap-2 mb-2">
            <ModalInput
              value={layer}
              onChangeText={(v) => updateLayer(i, v)}
              placeholder={i === 0 ? 'Underlying fear' : 'And then what?'}
              className="flex-1"
            />
            {fearLayers.length > 1 && (
              <TouchableOpacity onPress={() => removeLayer(i)} className="p-2">
                <X size={20} color="#C83232" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addLayer} className="flex-row items-center gap-2 py-2">
          <Plus size={18} color="#B48C3C" />
          <Text className="text-primary text-sm">Add layer</Text>
        </TouchableOpacity>
      </ModalSection>
      <ModalSection>
        <ModalLabel>3. Affects my…</ModalLabel>
        <View className="flex-row flex-wrap gap-2">
          {AFFECTS.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => toggleSelection(item, fearAffects, setFearAffects)}
              className={`px-3 py-2 rounded-full border ${fearAffects.includes(item) ? 'bg-primary border-primary' : 'border-border'}`}
            >
              <Text className={fearAffects.includes(item) ? 'text-primary-foreground' : 'text-foreground'}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ModalSection>
      <ModalSection>
        <ModalLabel>4. Character defects</ModalLabel>
        <View className="flex-row flex-wrap gap-2">
          {DEFECTS.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => toggleDefect(item)}
              className={`px-3 py-2 rounded-full border ${fearDefects.includes(item) ? 'bg-destructive border-destructive' : 'border-border'}`}
            >
              <Text className={fearDefects.includes(item) ? 'text-destructive-foreground' : 'text-foreground'}>{item}</Text>
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
              onPress={() => toggleSelection(item, fearAssets, setFearAssets)}
              className={`px-3 py-2 rounded-full border ${fearAssets.includes(item) ? 'bg-primary border-primary' : 'border-border'}`}
            >
              <Text className={fearAssets.includes(item) ? 'text-primary-foreground' : 'text-foreground'}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ModalSection>
      <ModalSection last>
        <ModalLabel>Notes</ModalLabel>
        <ModalInput value={fearNotes} onChangeText={setFearNotes} placeholder="Optional" multiline />
      </ModalSection>

      <ModalButton onPress={handleSave} variant="primary">
        {fearEditingEntryId ? 'Update Fear Inventory' : 'Save Fear Inventory'}
      </ModalButton>

      <SavedSection
        title="Saved fear inventories"
        emptyMessage="No fear inventories yet."
        hasEntries={fearEntries.length > 0}
      >
        {fearEntries.map((entry) => (
          <View key={entry.id} className="p-3 rounded-lg border border-border">
            <Text className="text-sm font-semibold text-foreground">{entry.who}</Text>
            <Text className="text-xs text-muted-foreground mt-1">
              {parseLayers(entry).join(' → ')}
            </Text>
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
