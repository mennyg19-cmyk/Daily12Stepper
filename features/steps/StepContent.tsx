/**
 * Step-specific content and input forms.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  STEP_CHECKOFF_LABELS,
  STEP1_INTRO,
  STEP3_QUESTION,
  STEP3_PRAYER,
  STEP3_PRAYER_MODERN,
  STEP7_PRAYER,
} from '@/lib/stepContent';
import { getPrayerLanguage, setPrayerLanguage } from '@/lib/settings';
import {
  getStepWorkData,
  saveStepWorkData,
  getStep6DefectsOrdered,
  getStep1Inventory,
  saveStep1Inventory,
  getStep2Data,
  saveStep2Data,
  getAmendsList,
  addAmends,
  deleteAmends,
  getAmendsDoneForDate,
  getAmendsNotesForDate,
  updateAmendsCompletionNotes,
  toggleAmendsDone,
} from './stepWorkDatabase';
import { StepBookmarkPicker } from './StepBookmarkPicker';
import {
  getStep4People,
  addStep4Person,
  deleteStep4Person,
  getStep4Resentments,
  addStep4Resentment,
  updateStep4Resentment,
  getStep4Standalone,
  addStep4Standalone,
  updateStep4Standalone,
  deleteStep4Standalone,
  getStep4DefectsInOrder,
} from './step4Database';
import type { Step4Person, Step4Resentment, Step4Standalone } from './step4Database';
import {
  getStep5SharingsForDate,
  addStep5Sharing,
  updateStep5Sharing,
  deleteStep5Sharing,
} from './step5Database';
import type { Step5Sharing } from './step5Database';
import {
  getStep7EpisodesForDefect,
  addStep7Episode,
  updateStep7Episode,
  deleteStep7Episode,
} from './step7Database';
import type { Step7Episode } from './step7Database';
import {
  getStep12Instructions,
  updateStep12Instruction,
  getStep12Sponsees,
  addStep12Sponsee,
  updateStep12Sponsee,
  deleteStep12Sponsee,
  copyInstructionToClipboard,
} from './step12Database';
import type { Step12Instruction, Step12Sponsee } from './step12Database';
import { ModalLabel, ModalInput, ModalSection, ModalButton, ModalButtonRow, ModalTitle } from '@/components/ModalContent';
import { ModalSurface } from '@/components/ModalSurface';

interface StepContentProps {
  stepNumber: number;
  today: string;
  onStartTimer?: () => void;
}

export function Step1Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const iconColors = useIconColors();
  const [inventory, setInventory] = useState('');
  const [checked, setChecked] = useState(false);

  const load = useCallback(async () => {
    const [inv, data] = await Promise.all([
      getStep1Inventory(),
      getStepWorkData(stepNumber, today),
    ]);
    setInventory(inv);
    setChecked((data?.checked as boolean) ?? false);
  }, [stepNumber, today]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveInventory = useCallback(async () => {
    await saveStep1Inventory(inventory);
  }, [inventory]);

  const handleCheckoff = async () => {
    const newVal = !checked;
    setChecked(newVal);
    await saveStepWorkData(stepNumber, today, { checked: newVal });
  };

  const checkoffLabel = STEP_CHECKOFF_LABELS[stepNumber] ?? '';

  return (
    <View className="mb-4">
      <Text className="text-base text-foreground leading-6 mb-2">{STEP1_INTRO}</Text>
      <Text className="text-sm text-muted-foreground mb-2">
        Write your powerless inventory below. Save and edit anytime—especially after a relapse.
      </Text>
      <TextInput
        value={inventory}
        onChangeText={setInventory}
        onFocus={onStartTimer}
        onBlur={handleSaveInventory}
        placeholder="How I tried to stop, how using affected me, how I failed..."
        placeholderTextColor={iconColors.muted}
        multiline
        numberOfLines={6}
        className="rounded-xl px-4 py-3 text-base bg-input border border-border text-foreground min-h-[120px] mb-4"
      />
      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />
      <TouchableOpacity
        onPress={handleCheckoff}
        onFocus={onStartTimer}
        className="flex-row items-center gap-3 p-4 rounded-xl border-2 border-border bg-card mt-4"
      >
        <View
          className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
            checked ? 'bg-primary border-primary' : 'border-muted-foreground'
          }`}
        >
          {checked && <Check size={18} color={iconColors.primaryForeground} />}
        </View>
        <Text className="flex-1 text-foreground text-sm">{checkoffLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function Step2Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const iconColors = useIconColors();
  const [ready, setReady] = useState(false);
  const [powerDescription, setPowerDescription] = useState('');
  const [checked, setChecked] = useState(false);

  const load = useCallback(async () => {
    const [step2, data] = await Promise.all([
      getStep2Data(),
      getStepWorkData(stepNumber, today),
    ]);
    setReady(step2.ready);
    setPowerDescription(step2.powerDescription);
    setChecked((data?.checked as boolean) ?? false);
  }, [stepNumber, today]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSavePower = useCallback(async () => {
    await saveStep2Data(ready, powerDescription);
  }, [ready, powerDescription]);

  const handleCheckoff = async () => {
    const newVal = !checked;
    setChecked(newVal);
    await saveStepWorkData(stepNumber, today, { checked: newVal });
  };

  const checkoffLabel = STEP_CHECKOFF_LABELS[stepNumber] ?? '';

  return (
    <View className="mb-4">
      <View className="gap-4 mb-4">
        <Text className="text-sm font-semibold text-foreground">
          Are you ready to believe that there is a power greater than you?
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => { setReady(true); saveStep2Data(true, powerDescription); }}
            onFocus={onStartTimer}
            className={`flex-1 py-3 rounded-xl border-2 items-center ${
              ready ? 'bg-primary border-primary' : 'border-border'
            }`}
          >
            <Text className={ready ? 'text-primary-foreground font-semibold' : 'text-foreground'}>
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setReady(false); saveStep2Data(false, powerDescription); }}
            onFocus={onStartTimer}
            className={`flex-1 py-3 rounded-xl border-2 items-center ${
              !ready ? 'bg-primary border-primary' : 'border-border'
            }`}
          >
            <Text className={!ready ? 'text-primary-foreground font-semibold' : 'text-foreground'}>
              No
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="mb-4">
        <Text className="text-sm font-semibold text-foreground mb-2">
          What would that power look like?
        </Text>
        <Text className="text-xs text-muted-foreground mb-2">
          Save and edit every day as your understanding grows.
        </Text>
        <TextInput
          value={powerDescription}
          onChangeText={setPowerDescription}
          onFocus={onStartTimer}
          onBlur={handleSavePower}
          placeholder="Describe the power greater than yourself..."
          placeholderTextColor={iconColors.muted}
          multiline
          numberOfLines={4}
          className="rounded-xl px-4 py-3 text-base bg-input border border-border text-foreground min-h-[100px]"
        />
      </View>
      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />
      <TouchableOpacity
        onPress={handleCheckoff}
        onFocus={onStartTimer}
        className="flex-row items-center gap-3 p-4 rounded-xl border-2 border-border bg-card mt-4"
      >
        <View
          className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
            checked ? 'bg-primary border-primary' : 'border-muted-foreground'
          }`}
        >
          {checked && <Check size={18} color={iconColors.primaryForeground} />}
        </View>
        <Text className="flex-1 text-foreground text-sm">{checkoffLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function Step3Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const iconColors = useIconColors();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [prayerModern, setPrayerModern] = useState(false);

  const load = useCallback(async () => {
    const [data, prayerLang] = await Promise.all([
      getStepWorkData(stepNumber, today),
      getPrayerLanguage(),
    ]);
    setReady((data?.ready as boolean) ?? false);
    setChecked((data?.checked as boolean) ?? false);
    setPrayerModern(prayerLang === 'modern');
  }, [stepNumber, today]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrayerToggle = async () => {
    const next = !prayerModern;
    setPrayerModern(next);
    await setPrayerLanguage(next ? 'modern' : 'traditional');
  };

  const handleReady = async (val: boolean) => {
    setReady(val);
    const existing = await getStepWorkData(stepNumber, today);
    await saveStepWorkData(stepNumber, today, { ...existing, ready: val });
  };

  const handleCheckoff = async () => {
    const newVal = !checked;
    setChecked(newVal);
    const existing = await getStepWorkData(stepNumber, today);
    await saveStepWorkData(stepNumber, today, { ...existing, checked: newVal });
  };

  const checkoffLabel = STEP_CHECKOFF_LABELS[stepNumber] ?? '';

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-foreground mb-3">{STEP3_QUESTION}</Text>
      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity
          onPress={() => handleReady(true)}
          onFocus={onStartTimer}
          className={`flex-1 py-3 rounded-xl border-2 items-center ${
            ready ? 'bg-primary border-primary' : 'border-border'
          }`}
        >
          <Text className={ready ? 'text-primary-foreground font-semibold' : 'text-foreground'}>
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleReady(false)}
          onFocus={onStartTimer}
          className={`flex-1 py-3 rounded-xl border-2 items-center ${
            !ready ? 'bg-primary border-primary' : 'border-border'
          }`}
        >
          <Text className={!ready ? 'text-primary-foreground font-semibold' : 'text-foreground'}>
            No
          </Text>
        </TouchableOpacity>
      </View>
      {ready && (
        <View className="p-4 rounded-xl bg-card border border-border mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-muted-foreground">Step 3 Prayer</Text>
            <TouchableOpacity
              onPress={handlePrayerToggle}
              onFocus={onStartTimer}
              className="px-3 py-1.5 rounded-lg border border-border"
            >
              <Text className="text-xs text-muted-foreground">
                {prayerModern ? 'Traditional' : 'Everyday English'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-base text-foreground leading-6 italic">
            {prayerModern ? STEP3_PRAYER_MODERN : STEP3_PRAYER}
          </Text>
        </View>
      )}
      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />
      <TouchableOpacity
        onPress={handleCheckoff}
        onFocus={onStartTimer}
        className="flex-row items-center gap-3 p-4 rounded-xl border-2 border-border bg-card mt-4"
      >
        <View
          className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
            checked ? 'bg-primary border-primary' : 'border-muted-foreground'
          }`}
        >
          {checked && <Check size={18} color={iconColors.primaryForeground} />}
        </View>
        <Text className="flex-1 text-foreground text-sm">{checkoffLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function Step4Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const [people, setPeople] = useState<Step4Person[]>([]);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [personName, setPersonName] = useState('');
  const [showAddResentment, setShowAddResentment] = useState<string | null>(null);
  const [resentmentDesc, setResentmentDesc] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [standaloneEntries, setStandaloneEntries] = useState<Step4Standalone[]>([]);
  const [showAddStandalone, setShowAddStandalone] = useState(false);
  const [standaloneType, setStandaloneType] = useState<'resentment' | 'fear' | 'harm'>('resentment');
  const [standaloneWho, setStandaloneWho] = useState('');
  const [standaloneWhy, setStandaloneWhy] = useState('');
  const [standaloneAffects, setStandaloneAffects] = useState('');
  const [standaloneMyPart, setStandaloneMyPart] = useState('');

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([getStep4People(), getStep4Standalone()]);
    setPeople(p);
    setStandaloneEntries(s);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddPerson = async () => {
    if (!personName.trim()) return;
    await addStep4Person(personName.trim());
    setPersonName('');
    setShowAddPerson(false);
    load();
  };

  const handleAddResentment = async (personId: string) => {
    await addStep4Resentment(personId, resentmentDesc.trim());
    setResentmentDesc('');
    setShowAddResentment(null);
    load();
    setRefreshTrigger((t) => t + 1);
  };

  return (
    <View className="mb-4">
      <Text className="text-sm text-muted-foreground mb-4">
        Add people, then resentments for each. Work through column 3 (how it affects me) and column 4 (my part).
      </Text>
      <TouchableOpacity
        onPress={() => setShowAddStandalone(true)}
        onFocus={onStartTimer}
        className="py-3 rounded-xl border border-dashed border-primary/50 items-center mb-4"
      >
        <Text className="text-primary font-semibold">+ Quick add (resentment, fear, or harm)</Text>
        <Text className="text-xs text-muted-foreground mt-1">Who, why, what it affects, my part</Text>
      </TouchableOpacity>
      {standaloneEntries.length > 0 && (
        <View className="mb-4 gap-2">
          <Text className="text-sm font-semibold text-foreground">Quick entries</Text>
          {standaloneEntries.map((e) => (
            <Step4StandaloneRow
              key={e.id}
              entry={e}
              onStartTimer={onStartTimer}
              onUpdate={load}
            />
          ))}
        </View>
      )}
      <TouchableOpacity
        onPress={() => setShowAddPerson(true)}
        onFocus={onStartTimer}
        className="py-3 rounded-xl border border-dashed border-border items-center mb-4"
      >
        <Text className="text-primary font-semibold">+ Add person (full inventory)</Text>
      </TouchableOpacity>
      {people.map((person) => (
        <Step4PersonBlock
          key={person.id}
          person={person}
          refreshTrigger={refreshTrigger}
          onStartTimer={onStartTimer}
          onReload={load}
          onAddResentment={() => setShowAddResentment(person.id)}
        />
      ))}
      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />

      <ModalSurface visible={showAddPerson} onRequestClose={() => setShowAddPerson(false)}>
        <View className="p-6">
          <ModalTitle>Add person</ModalTitle>
          <ModalSection>
            <ModalLabel>Who are you resentful at?</ModalLabel>
            <ModalInput
              value={personName}
              onChangeText={setPersonName}
              placeholder="Name or role"
            />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowAddPerson(false)} variant="secondary">Cancel</ModalButton>
            <ModalButton onPress={handleAddPerson} variant="primary" disabled={!personName.trim()}>Add</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>

      <ModalSurface visible={showAddStandalone} onRequestClose={() => setShowAddStandalone(false)}>
        <View className="p-6">
          <ModalTitle>Quick add</ModalTitle>
          <ModalSection>
            <ModalLabel>Type</ModalLabel>
            <View className="flex-row gap-2 mt-2">
              {(['resentment', 'fear', 'harm'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setStandaloneType(t)}
                  className={`px-3 py-2 rounded-lg border ${standaloneType === t ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  <Text className={standaloneType === t ? 'text-primary font-semibold' : 'text-muted-foreground'}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ModalSection>
          <ModalSection>
            <ModalLabel>Who?</ModalLabel>
            <ModalInput value={standaloneWho} onChangeText={setStandaloneWho} placeholder="Person or situation" />
          </ModalSection>
          <ModalSection>
            <ModalLabel>Why? (What happened)</ModalLabel>
            <ModalInput value={standaloneWhy} onChangeText={setStandaloneWhy} placeholder="Describe what happened..." multiline />
          </ModalSection>
          <ModalSection>
            <ModalLabel>What does it affect?</ModalLabel>
            <ModalInput value={standaloneAffects} onChangeText={setStandaloneAffects} placeholder="Self-esteem, security, ambitions..." multiline />
          </ModalSection>
          <ModalSection>
            <ModalLabel>My part</ModalLabel>
            <ModalInput value={standaloneMyPart} onChangeText={setStandaloneMyPart} placeholder="What was my part?" multiline />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowAddStandalone(false)} variant="secondary">Cancel</ModalButton>
            <ModalButton
              onPress={async () => {
                await addStep4Standalone(standaloneType, standaloneWho, standaloneWhy, standaloneAffects, standaloneMyPart);
                setStandaloneWho('');
                setStandaloneWhy('');
                setStandaloneAffects('');
                setStandaloneMyPart('');
                setShowAddStandalone(false);
                load();
              }}
              variant="primary"
              disabled={!standaloneWho.trim()}
            >
              Add
            </ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>

      <ModalSurface visible={!!showAddResentment} onRequestClose={() => setShowAddResentment(null)}>
        <View className="p-6">
          <ModalTitle>Add resentment</ModalTitle>
          <ModalSection>
            <ModalLabel>What happened? (Column 2)</ModalLabel>
            <ModalInput
              value={resentmentDesc}
              onChangeText={setResentmentDesc}
              placeholder="Describe the resentment..."
              multiline
            />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowAddResentment(null)} variant="secondary">Cancel</ModalButton>
            <ModalButton
              onPress={() => showAddResentment && handleAddResentment(showAddResentment)}
              variant="primary"
              disabled={!resentmentDesc.trim()}
            >
              Add
            </ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </View>
  );
}

function Step4StandaloneRow({
  entry,
  onStartTimer,
  onUpdate,
}: {
  entry: Step4Standalone;
  onStartTimer?: () => void;
  onUpdate: () => void;
}) {
  const iconColors = useIconColors();
  const [who, setWho] = useState(entry.who);
  const [why, setWhy] = useState(entry.why);
  const [affects, setAffects] = useState(entry.affects);
  const [myPart, setMyPart] = useState(entry.myPart);

  // Initialize form fields when entry changes; intentionally depends only on entry.id
  // to avoid resetting user edits on each keystroke.
  useEffect(() => {
    setWho(entry.who);
    setWhy(entry.why);
    setAffects(entry.affects);
    setMyPart(entry.myPart);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  const save = useCallback(async () => {
    await updateStep4Standalone(entry.id, { who, why, affects, myPart });
    onUpdate();
  }, [entry.id, who, why, affects, myPart, onUpdate]);

  const handleDelete = () => {
    Alert.alert('Remove', `Remove this ${entry.type} entry?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await deleteStep4Standalone(entry.id);
        onUpdate();
      }},
    ]);
  };

  return (
    <View className="p-4 rounded-xl border border-border bg-card">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-xs font-semibold text-primary uppercase">{entry.type}</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Trash2 size={18} color={iconColors.destructive} />
        </TouchableOpacity>
      </View>
      <TextInput value={who} onChangeText={setWho} onBlur={save} onFocus={onStartTimer} placeholder="Who" className="text-sm text-foreground mb-2" />
      <TextInput value={why} onChangeText={setWhy} onBlur={save} onFocus={onStartTimer} placeholder="Why" placeholderTextColor={iconColors.muted} multiline className="text-sm text-foreground mb-2" />
      <TextInput value={affects} onChangeText={setAffects} onBlur={save} onFocus={onStartTimer} placeholder="What it affects" placeholderTextColor={iconColors.muted} multiline className="text-sm text-foreground mb-2" />
      <TextInput value={myPart} onChangeText={setMyPart} onBlur={save} onFocus={onStartTimer} placeholder="My part" placeholderTextColor={iconColors.muted} multiline className="text-sm text-foreground" />
    </View>
  );
}

function Step4PersonBlock({
  person,
  refreshTrigger,
  onStartTimer,
  onReload,
  onAddResentment,
}: {
  person: Step4Person;
  refreshTrigger: number;
  onStartTimer?: () => void;
  onReload: () => void;
  onAddResentment: () => void;
}) {
  const iconColors = useIconColors();
  const [resentments, setResentments] = useState<Step4Resentment[]>([]);
  const [expanded, setExpanded] = useState(true);

  const refreshResentments = useCallback(() => {
    getStep4Resentments(person.id).then(setResentments);
  }, [person.id]);

  useEffect(() => {
    refreshResentments();
  }, [refreshResentments, refreshTrigger]);

  const handleDeletePerson = () => {
    Alert.alert('Remove person', `Remove "${person.personName}" and all their resentments?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await deleteStep4Person(person.id);
        onReload();
      }},
    ]);
  };

  return (
    <View className="mb-4 rounded-xl border border-border bg-card overflow-hidden">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        onFocus={onStartTimer}
        className="flex-row items-center justify-between p-4"
      >
        <Text className="text-base font-semibold text-foreground">{person.personName}</Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={onAddResentment} className="px-3 py-1.5 rounded-lg bg-primary">
            <Text className="text-primary-foreground text-sm font-medium">+ Resentment</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeletePerson} className="p-2">
            <Trash2 size={18} color={iconColors.destructive} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {expanded && (
        <View className="px-4 pb-4 gap-2">
          {resentments.map((r) => (
            <Step4ResentmentRow key={r.id} resentment={r} onStartTimer={onStartTimer} onUpdate={refreshResentments} />
          ))}
        </View>
      )}
    </View>
  );
}

function Step4ResentmentRow({
  resentment,
  onStartTimer,
  onUpdate,
}: {
  resentment: Step4Resentment;
  onStartTimer?: () => void;
  onUpdate: () => void;
}) {
  const iconColors = useIconColors();
  const [desc, setDesc] = useState(resentment.description);
  const [col3, setCol3] = useState(resentment.column3Text);
  const [col4, setCol4] = useState(resentment.column4Text);

  useEffect(() => {
    setDesc(resentment.description);
    setCol3(resentment.column3Text);
    setCol4(resentment.column4Text);
  }, [resentment.id, resentment.description, resentment.column3Text, resentment.column4Text]);

  const save = useCallback(async () => {
    await updateStep4Resentment(resentment.id, {
      description: desc,
      column3Text: col3,
      column4Text: col4,
    });
    onUpdate();
  }, [resentment.id, desc, col3, col4, onUpdate]);

  const toggleCol3 = async () => {
    await updateStep4Resentment(resentment.id, { column3Done: !resentment.column3Done });
    onUpdate();
  };
  const toggleCol4 = async () => {
    await updateStep4Resentment(resentment.id, { column4Done: !resentment.column4Done });
    onUpdate();
  };

  return (
    <View className="p-3 rounded-lg bg-muted/30 border border-border">
      <TextInput
        value={desc}
        onChangeText={setDesc}
        onBlur={save}
        onFocus={onStartTimer}
        placeholder="What happened? (Column 2)"
        placeholderTextColor={iconColors.muted}
        className="text-sm text-foreground mb-2"
      />
      <View className="flex-row items-center gap-2 mb-2">
        <TouchableOpacity onPress={toggleCol3} className="flex-row items-center gap-2">
          <View className={`w-6 h-6 rounded border-2 items-center justify-center ${resentment.column3Done ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
            {resentment.column3Done && <Check size={14} color={iconColors.primaryForeground} />}
          </View>
          <Text className="text-xs text-muted-foreground">Col 3: How it affects me</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        value={col3}
        onChangeText={setCol3}
        onBlur={save}
        onFocus={onStartTimer}
        placeholder="How does it affect me?"
        placeholderTextColor={iconColors.muted}
        className="text-sm text-foreground mb-2"
      />
      <View className="flex-row items-center gap-2 mb-2">
        <TouchableOpacity onPress={toggleCol4} className="flex-row items-center gap-2">
          <View className={`w-6 h-6 rounded border-2 items-center justify-center ${resentment.column4Done ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
            {resentment.column4Done && <Check size={14} color={iconColors.primaryForeground} />}
          </View>
          <Text className="text-xs text-muted-foreground">Col 4: My part</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        value={col4}
        onChangeText={setCol4}
        onBlur={save}
        onFocus={onStartTimer}
        placeholder="What was my part?"
        placeholderTextColor={iconColors.muted}
        className="text-sm text-foreground"
      />
    </View>
  );
}

export function Step5Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const [sharings, setSharings] = useState<Step5Sharing[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [personName, setPersonName] = useState('');
  const [whatShared, setWhatShared] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    const s = await getStep5SharingsForDate(today);
    setSharings(s);
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!personName.trim()) return;
    await addStep5Sharing(today, personName.trim(), whatShared.trim(), notes.trim());
    setPersonName('');
    setWhatShared('');
    setNotes('');
    setShowAdd(false);
    load();
  };

  return (
    <View className="mb-4">
      <Text className="text-sm text-muted-foreground mb-4">
        Some sponsors tell their sponsees to share with multiple people. Add each person and what you learned from them.
      </Text>
      <TouchableOpacity
        onPress={() => setShowAdd(true)}
        onFocus={onStartTimer}
        className="py-3 rounded-xl border border-dashed border-border items-center mb-4"
      >
        <Text className="text-primary font-semibold">+ Add person shared with</Text>
      </TouchableOpacity>
      {sharings.map((s) => (
        <Step5SharingRow key={s.id} sharing={s} onStartTimer={onStartTimer} onUpdate={load} />
      ))}
      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />

      <ModalSurface visible={showAdd} onRequestClose={() => setShowAdd(false)}>
        <View className="p-6">
          <ModalTitle>Add person shared with</ModalTitle>
          <ModalSection>
            <ModalLabel>Who did you share with?</ModalLabel>
            <ModalInput value={personName} onChangeText={setPersonName} placeholder="e.g. Sponsor, therapist..." />
          </ModalSection>
          <ModalSection>
            <ModalLabel>What did you share?</ModalLabel>
            <ModalInput value={whatShared} onChangeText={setWhatShared} placeholder="The exact nature of your wrongs..." multiline />
          </ModalSection>
          <ModalSection>
            <ModalLabel>Notes (what they came away with, what you learned)</ModalLabel>
            <ModalInput value={notes} onChangeText={setNotes} placeholder="Their feedback, your insights..." multiline />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowAdd(false)} variant="secondary">Cancel</ModalButton>
            <ModalButton onPress={handleAdd} variant="primary" disabled={!personName.trim()}>Add</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </View>
  );
}

function Step5SharingRow({
  sharing,
  onStartTimer,
  onUpdate,
}: {
  sharing: Step5Sharing;
  onStartTimer?: () => void;
  onUpdate: () => void;
}) {
  const iconColors = useIconColors();
  const [personName, setPersonName] = useState(sharing.personName);
  const [whatShared, setWhatShared] = useState(sharing.whatShared);
  const [notes, setNotes] = useState(sharing.notes);

  useEffect(() => {
    setPersonName(sharing.personName);
    setWhatShared(sharing.whatShared);
    setNotes(sharing.notes);
  }, [sharing.id, sharing.personName, sharing.whatShared, sharing.notes]);

  const save = useCallback(async () => {
    await updateStep5Sharing(sharing.id, { personName, whatShared, notes });
    onUpdate();
  }, [sharing.id, personName, whatShared, notes, onUpdate]);

  const handleDelete = () => {
    Alert.alert('Remove', `Remove "${sharing.personName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await deleteStep5Sharing(sharing.id);
        onUpdate();
      }},
    ]);
  };

  return (
    <View className="p-4 rounded-xl border border-border bg-card mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <TextInput
          value={personName}
          onChangeText={setPersonName}
          onBlur={save}
          onFocus={onStartTimer}
          className="text-base font-semibold text-foreground flex-1"
          placeholder="Person name"
        />
        <TouchableOpacity onPress={handleDelete}>
          <Trash2 size={18} color={iconColors.destructive} />
        </TouchableOpacity>
      </View>
      <TextInput
        value={whatShared}
        onChangeText={setWhatShared}
        onBlur={save}
        onFocus={onStartTimer}
        placeholder="What did you share?"
        placeholderTextColor={iconColors.muted}
        multiline
        className="text-sm text-foreground mb-2"
      />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        onBlur={save}
        onFocus={onStartTimer}
        placeholder="Notes from them, what you learned..."
        placeholderTextColor={iconColors.muted}
        multiline
        className="text-sm text-foreground"
      />
    </View>
  );
}

export function Step6Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const iconColors = useIconColors();
  const [defects, setDefects] = useState<string[]>([]);
  const [readySet, setReadySet] = useState<Set<string>>(new Set());
  const [showAddDefect, setShowAddDefect] = useState(false);
  const [manualDefectName, setManualDefectName] = useState('');

  const [step4DefectSet, setStep4DefectSet] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const { defects: merged, readyDefects } = await getStep6DefectsOrdered(today);
    const step4Defects = await getStep4DefectsInOrder();
    setStep4DefectSet(new Set(step4Defects));
    setDefects(merged);
    setReadySet(new Set(readyDefects));
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddManualDefect = async () => {
    const name = manualDefectName.trim();
    if (!name) return;
    const existing = await getStepWorkData(stepNumber, today);
    const manual = (existing?.manualDefects as string[]) ?? [];
    if (manual.includes(name) || defects.includes(name)) {
      setManualDefectName('');
      setShowAddDefect(false);
      return;
    }
    const newManual = [...manual, name];
    await saveStepWorkData(stepNumber, today, {
      ...existing,
      readyDefects: Array.from(readySet),
      manualDefects: newManual,
    });
    setManualDefectName('');
    setShowAddDefect(false);
    load();
  };

  const handleRemoveManualDefect = async (defect: string) => {
    const step4Defects = await getStep4DefectsInOrder();
    if (step4Defects.includes(defect)) return;
    const existing = await getStepWorkData(stepNumber, today);
    const manual = ((existing?.manualDefects as string[]) ?? []).filter((d) => d !== defect);
    const ready = Array.from(readySet).filter((d) => d !== defect);
    await saveStepWorkData(stepNumber, today, {
      ...existing,
      readyDefects: ready,
      manualDefects: manual,
    });
    load();
  };

  const handleToggle = async (defect: string) => {
    const next = new Set(readySet);
    if (next.has(defect)) next.delete(defect);
    else next.add(defect);
    setReadySet(next);
    const existing = await getStepWorkData(stepNumber, today);
    const step4Defects = await getStep4DefectsInOrder();
    const manual = defects.filter((d) => !step4Defects.includes(d));
    await saveStepWorkData(stepNumber, today, {
      ...(existing ?? {}),
      readyDefects: Array.from(next),
      manualDefects: manual,
    });
  };

  return (
    <View className="mb-4">
      <Text className="text-sm text-muted-foreground mb-4">
        Defects from your Step 4 inventory, in order of appearance. Are you ready to work on any of them? You can also add defects manually if you started mid-stepwork.
      </Text>
      <TouchableOpacity
        onPress={() => setShowAddDefect(true)}
        onFocus={onStartTimer}
        className="py-3 rounded-xl border border-dashed border-border items-center mb-4"
      >
        <Text className="text-primary font-semibold">+ Add defect manually</Text>
      </TouchableOpacity>
      {defects.length === 0 ? (
        <Text className="text-muted-foreground py-4">
          No defects yet. Add from Step 4 or add manually above.
        </Text>
      ) : (
        <View className="gap-2">
          {defects.map((defect) => {
            const ready = readySet.has(defect);
            const isManual = !step4DefectSet.has(defect);
            return (
              <View key={defect} className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => handleToggle(defect)}
                  onFocus={onStartTimer}
                  className="flex-1 flex-row items-center gap-3 p-4 rounded-xl border border-border bg-card"
                >
                  <View
                    className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                      ready ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {ready && <Check size={18} color={iconColors.primaryForeground} />}
                  </View>
                  <Text className={`flex-1 text-foreground ${ready ? 'font-semibold' : ''}`}>
                    {defect}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {ready ? 'Ready' : 'Tap when ready'}
                  </Text>
                </TouchableOpacity>
                {isManual && (
                  <TouchableOpacity
                    onPress={() => handleRemoveManualDefect(defect)}
                    className="p-2"
                  >
                    <Trash2 size={18} color={iconColors.destructive} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />

      <ModalSurface visible={showAddDefect} onRequestClose={() => setShowAddDefect(false)}>
        <View className="p-6">
          <ModalTitle>Add defect manually</ModalTitle>
          <ModalSection>
            <ModalLabel>Character defect</ModalLabel>
            <ModalInput
              value={manualDefectName}
              onChangeText={setManualDefectName}
              placeholder="e.g. Pride, anger, fear..."
            />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowAddDefect(false)} variant="secondary">Cancel</ModalButton>
            <ModalButton onPress={handleAddManualDefect} variant="primary" disabled={!manualDefectName.trim()}>Add</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </View>
  );
}

export function Step7Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const [defects, setDefects] = useState<string[]>([]);
  const [defectCounts, setDefectCounts] = useState<Record<string, number>>({});
  const [expandedDefect, setExpandedDefect] = useState<string | null>(null);
  const [showAddEpisode, setShowAddEpisode] = useState<string | null>(null);
  const [whenText, setWhenText] = useState('');
  const [whyText, setWhyText] = useState('');
  const [betterResponse, setBetterResponse] = useState('');
  const [prayerDefect, setPrayerDefect] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { defects: allDefects, readyDefects } = await getStep6DefectsOrdered(today);
    const readySet = new Set(readyDefects);
    const sorted = [...allDefects].sort((a, b) => {
      const aReady = readySet.has(a);
      const bReady = readySet.has(b);
      if (aReady && !bReady) return -1;
      if (!aReady && bReady) return 1;
      return 0;
    });
    setDefects(sorted);
    const data = await getStepWorkData(stepNumber, today);
    setDefectCounts((data?.defectCounts as Record<string, number>) ?? {});
  }, [stepNumber, today]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClicker = async (defectName: string) => {
    const count = (defectCounts[defectName] ?? 0) + 1;
    const newCounts = { ...defectCounts, [defectName]: count };
    setDefectCounts(newCounts);
    setPrayerDefect(defectName);
    const data = await getStepWorkData(stepNumber, today);
    await saveStepWorkData(stepNumber, today, {
      ...(data ?? {}),
      defectCounts: newCounts,
    });
  };

  const handleAddEpisode = async (defectName: string) => {
    await addStep7Episode(defectName, whenText.trim(), whyText.trim(), betterResponse.trim());
    setWhenText('');
    setWhyText('');
    setBetterResponse('');
    setShowAddEpisode(null);
    load();
  };

  return (
    <View className="mb-4">
      <Text className="text-sm text-muted-foreground mb-4">
        For each defect, tap the counter when it comes up. Add episodes for context. Each tap expands the 7th step prayer below.
      </Text>
      {defects.length === 0 ? (
        <Text className="text-muted-foreground py-4">
          No defects yet. Complete Step 4 and Step 6 first.
        </Text>
      ) : (
        <View className="gap-2">
          {defects.map((defect) => (
            <Step7DefectBlock
              key={defect}
              defectName={defect}
              count={defectCounts[defect] ?? 0}
              onCountPress={() => handleClicker(defect)}
              expanded={expandedDefect === defect}
              onToggle={() => setExpandedDefect(expandedDefect === defect ? null : defect)}
              onAddEpisode={() => setShowAddEpisode(defect)}
              onStartTimer={onStartTimer}
            />
          ))}
        </View>
      )}
      {prayerDefect && (
        <View className="mt-6 p-4 rounded-xl bg-card border border-primary">
          <Text className="text-sm font-semibold text-muted-foreground mb-2">
            Step 7 Prayer — {prayerDefect}
          </Text>
          <Text className="text-base text-foreground leading-6 italic">{STEP7_PRAYER}</Text>
        </View>
      )}
      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />

      <ModalSurface visible={!!showAddEpisode} onRequestClose={() => setShowAddEpisode(null)}>
        <View className="p-6">
          <ModalTitle>Add episode for {showAddEpisode}</ModalTitle>
          <ModalSection>
            <ModalLabel>When did it come up?</ModalLabel>
            <ModalInput value={whenText} onChangeText={setWhenText} placeholder="When..." />
          </ModalSection>
          <ModalSection>
            <ModalLabel>Why?</ModalLabel>
            <ModalInput value={whyText} onChangeText={setWhyText} placeholder="Why did it come up?" multiline />
          </ModalSection>
          <ModalSection>
            <ModalLabel>How could you have responded better?</ModalLabel>
            <ModalInput value={betterResponse} onChangeText={setBetterResponse} placeholder="Better response..." multiline />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowAddEpisode(null)} variant="secondary">Cancel</ModalButton>
            <ModalButton onPress={() => showAddEpisode && handleAddEpisode(showAddEpisode)} variant="primary">Add</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </View>
  );
}

function Step7DefectBlock({
  defectName,
  count,
  onCountPress,
  expanded,
  onToggle,
  onAddEpisode,
  onStartTimer,
}: {
  defectName: string;
  count: number;
  onCountPress: () => void;
  expanded: boolean;
  onToggle: () => void;
  onAddEpisode: () => void;
  onStartTimer?: () => void;
}) {
  const [episodes, setEpisodes] = useState<Step7Episode[]>([]);

  useEffect(() => {
    getStep7EpisodesForDefect(defectName).then(setEpisodes);
  }, [defectName]);

  return (
    <View className="rounded-xl border border-border bg-card overflow-hidden">
      <View className="p-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={onToggle} onFocus={onStartTimer} className="flex-1">
          <Text className="text-base font-semibold text-foreground">{defectName}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">{episodes.length} episodes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCountPress}
          onFocus={onStartTimer}
          className="w-12 h-12 rounded-full bg-primary items-center justify-center"
        >
          <Text className="text-primary-foreground font-bold text-lg">{count}</Text>
        </TouchableOpacity>
      </View>
      {expanded && (
        <View className="px-4 pb-4 gap-2">
          <TouchableOpacity onPress={onAddEpisode} className="py-2 rounded-lg border border-dashed border-border items-center">
            <Text className="text-primary text-sm font-medium">+ Add episode</Text>
          </TouchableOpacity>
          {episodes.map((ep) => (
            <Step7EpisodeRow key={ep.id} episode={ep} onStartTimer={onStartTimer} onUpdate={() => getStep7EpisodesForDefect(defectName).then(setEpisodes)} />
          ))}
        </View>
      )}
    </View>
  );
}

function Step7EpisodeRow({
  episode,
  onStartTimer,
  onUpdate,
}: {
  episode: Step7Episode;
  onStartTimer?: () => void;
  onUpdate: () => void;
}) {
  const iconColors = useIconColors();
  const [whenText, setWhenText] = useState(episode.whenText);
  const [whyText, setWhyText] = useState(episode.whyText);
  const [betterResponse, setBetterResponse] = useState(episode.betterResponse);

  // Initialize form fields when episode changes; intentionally depends only on episode.id.
  useEffect(() => {
    setWhenText(episode.whenText);
    setWhyText(episode.whyText);
    setBetterResponse(episode.betterResponse);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.id]);

  const save = useCallback(async () => {
    await updateStep7Episode(episode.id, { whenText, whyText, betterResponse });
    onUpdate();
  }, [episode.id, whenText, whyText, betterResponse, onUpdate]);

  const handleDelete = () => {
    Alert.alert('Remove episode', 'Remove this episode?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await deleteStep7Episode(episode.id);
        onUpdate();
      }},
    ]);
  };

  return (
    <View className="p-3 rounded-lg bg-muted/30 border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <TextInput value={whenText} onChangeText={setWhenText} onBlur={save} onFocus={onStartTimer} placeholder="When" className="text-sm text-foreground flex-1" />
        <TouchableOpacity onPress={handleDelete}>
          <Trash2 size={16} color={iconColors.destructive} />
        </TouchableOpacity>
      </View>
      <TextInput value={whyText} onChangeText={setWhyText} onBlur={save} onFocus={onStartTimer} placeholder="Why?" placeholderTextColor={iconColors.muted} multiline className="text-sm text-foreground mb-2" />
      <TextInput value={betterResponse} onChangeText={setBetterResponse} onBlur={save} onFocus={onStartTimer} placeholder="How could you have responded better?" placeholderTextColor={iconColors.muted} multiline className="text-sm text-foreground" />
    </View>
  );
}

export function Step12Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const [instructions, setInstructions] = useState<Step12Instruction[]>([]);
  const [sponsees, setSponsees] = useState<Step12Sponsee[]>([]);
  const [showAddSponsee, setShowAddSponsee] = useState(false);
  const [sponseeName, setSponseeName] = useState('');

  const load = useCallback(async () => {
    const [inst, sp] = await Promise.all([
      getStep12Instructions(),
      getStep12Sponsees(),
    ]);
    setInstructions(inst);
    setSponsees(sp);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveInstruction = async (id: string, text: string) => {
    await updateStep12Instruction(id, text);
    load();
  };

  const handleCopy = async (text: string) => {
    await copyInstructionToClipboard(text);
    Alert.alert('Copied', 'Instructions copied to clipboard. Paste to send to your sponsee.');
  };

  const handleAddSponsee = async () => {
    if (!sponseeName.trim()) return;
    await addStep12Sponsee(sponseeName.trim());
    setSponseeName('');
    setShowAddSponsee(false);
    load();
  };

  return (
    <View className="mb-4">
      <Text className="text-sm text-muted-foreground mb-4">
        Step-by-step instructions to copy/paste for sponsees. Refer to these when your sponsee calls.
      </Text>

      <Text className="text-sm font-semibold text-foreground mb-2">Instructions</Text>
      {instructions.map((inst) => (
        <Step12InstructionEditor
          key={inst.id}
          instruction={inst}
          onSave={(text) => handleSaveInstruction(inst.id, text)}
          onCopy={handleCopy}
          onStartTimer={onStartTimer}
        />
      ))}

      <Text className="text-sm font-semibold text-foreground mt-6 mb-2">Sponsees</Text>
      <TouchableOpacity
        onPress={() => setShowAddSponsee(true)}
        onFocus={onStartTimer}
        className="py-3 rounded-xl border border-dashed border-border items-center mb-4"
      >
        <Text className="text-primary font-semibold">+ Add sponsee</Text>
      </TouchableOpacity>
      {sponsees.map((s) => (
        <Step12SponseeRow key={s.id} sponsee={s} onUpdate={load} onStartTimer={onStartTimer} />
      ))}

      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />

      <ModalSurface visible={showAddSponsee} onRequestClose={() => setShowAddSponsee(false)}>
        <View className="p-6">
          <ModalTitle>Add sponsee</ModalTitle>
          <ModalSection>
            <ModalLabel>Name</ModalLabel>
            <ModalInput value={sponseeName} onChangeText={setSponseeName} placeholder="Sponsee name" />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowAddSponsee(false)} variant="secondary">Cancel</ModalButton>
            <ModalButton onPress={handleAddSponsee} variant="primary" disabled={!sponseeName.trim()}>Add</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </View>
  );
}

function Step12InstructionEditor({
  instruction,
  onSave,
  onCopy,
  onStartTimer,
}: {
  instruction: Step12Instruction;
  onSave: (text: string) => void;
  onCopy: (text: string) => void;
  onStartTimer?: () => void;
}) {
  const iconColors = useIconColors();
  const [text, setText] = useState(instruction.instructionText);
  useEffect(() => {
    setText(instruction.instructionText);
  }, [instruction.id, instruction.instructionText]);
  return (
    <View className="mb-4 p-4 rounded-xl border border-border bg-card">
      <Text className="text-xs font-semibold text-muted-foreground mb-2">Step {instruction.stepNumber}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={() => onSave(text)}
        onFocus={onStartTimer}
        placeholder={`Step ${instruction.stepNumber} instructions...`}
        placeholderTextColor={iconColors.muted}
        multiline
        className="text-sm text-foreground min-h-[60px]"
      />
      <TouchableOpacity onPress={() => onCopy(text)} className="mt-2 py-2 rounded-lg bg-primary self-start px-4">
        <Text className="text-primary-foreground text-sm font-medium">Copy</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step12SponseeRow({
  sponsee,
  onUpdate,
  onStartTimer,
}: {
  sponsee: Step12Sponsee;
  onUpdate: () => void;
  onStartTimer?: () => void;
}) {
  const iconColors = useIconColors();
  const [currentStep, setCurrentStep] = useState(sponsee.currentStepNumber);
  const [notes, setNotes] = useState(sponsee.notes);

  // Initialize form fields when sponsee changes; intentionally depends only on sponsee.id.
  useEffect(() => {
    setCurrentStep(sponsee.currentStepNumber);
    setNotes(sponsee.notes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sponsee.id]);

  const handleDelete = () => {
    Alert.alert('Remove sponsee', `Remove "${sponsee.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await deleteStep12Sponsee(sponsee.id);
        onUpdate();
      }},
    ]);
  };

  return (
    <View className="p-4 rounded-xl border border-border bg-card mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-foreground">{sponsee.name}</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Trash2 size={18} color={iconColors.destructive} />
        </TouchableOpacity>
      </View>
      <View className="flex-row flex-wrap gap-1 mb-2">
        <Text className="text-xs text-muted-foreground w-full">Current step:</Text>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => { setCurrentStep(n); updateStep12Sponsee(sponsee.id, { currentStepNumber: n }); onUpdate(); }}
            onFocus={onStartTimer}
            className={`px-2 py-1 rounded ${currentStep === n ? 'bg-primary' : 'bg-muted'}`}
          >
            <Text className={`text-xs font-medium ${currentStep === n ? 'text-primary-foreground' : 'text-foreground'}`}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        value={notes}
        onChangeText={(t) => { setNotes(t); updateStep12Sponsee(sponsee.id, { notes: t }); onUpdate(); }}
        onFocus={onStartTimer}
        placeholder="Notes (where they are, call notes...)"
        placeholderTextColor={iconColors.muted}
        multiline
        className="text-sm text-foreground"
      />
    </View>
  );
}

export function Step8Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const iconColors = useIconColors();
  const [amends, setAmends] = useState<Awaited<ReturnType<typeof getAmendsList>>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [personName, setPersonName] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    const list = await getAmendsList();
    setAmends(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!personName.trim()) return;
    await addAmends(personName.trim(), notes.trim());
    setPersonName('');
    setNotes('');
    setShowAdd(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteAmends(id);
    load();
  };

  return (
    <View className="mb-4">
      <Text className="text-sm text-muted-foreground mb-3">
        List people you have harmed (with your sponsor&apos;s help—this is separate from Step 4, where we tend to take too much blame).
      </Text>
      <TouchableOpacity
        onPress={() => setShowAdd(true)}
        onFocus={onStartTimer}
        className="py-4 rounded-xl border border-dashed border-border items-center mb-4"
      >
        <Text className="text-primary font-semibold">+ Add to amends list</Text>
      </TouchableOpacity>
      <View className="gap-2">
        {amends.map((a) => (
          <View
            key={a.id}
            className="flex-row items-center justify-between p-3 rounded-lg bg-card border border-border"
          >
            <View className="flex-1">
              <Text className="text-foreground font-medium">{a.personName}</Text>
              {a.notes ? (
                <Text className="text-muted-foreground text-sm mt-1">{a.notes}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => handleDelete(a.id)} className="p-2">
              <Trash2 size={18} color={iconColors.destructive} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />

      <ModalSurface visible={showAdd} onRequestClose={() => setShowAdd(false)}>
        <View className="p-6">
          <ModalTitle>Add to amends list</ModalTitle>
          <ModalSection>
            <ModalLabel>Person</ModalLabel>
            <ModalInput
              value={personName}
              onChangeText={setPersonName}
              placeholder="Name of person you harmed"
            />
          </ModalSection>
          <ModalSection>
            <ModalLabel>Notes (optional)</ModalLabel>
            <ModalInput
              value={notes}
              onChangeText={setNotes}
              placeholder="What happened, context..."
              multiline
            />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowAdd(false)} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton
              onPress={handleAdd}
              variant="primary"
              disabled={!personName.trim()}
            >
              Add
            </ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </View>
  );
}

export function Step9Content({ stepNumber, today, onStartTimer }: StepContentProps) {
  const iconColors = useIconColors();
  const [amends, setAmends] = useState<Awaited<ReturnType<typeof getAmendsList>>>([]);
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [list, done, notes] = await Promise.all([
      getAmendsList(),
      getAmendsDoneForDate(today),
      getAmendsNotesForDate(today),
    ]);
    setAmends(list);
    setDoneSet(done);
    setNotesMap(notes);
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (id: string) => {
    await toggleAmendsDone(id, today);
    setDoneSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    load();
  };

  const handleNotesChange = async (id: string, notes: string) => {
    setNotesMap((prev) => ({ ...prev, [id]: notes }));
    await updateAmendsCompletionNotes(id, today, notes);
  };

  return (
    <View className="mb-4">
      <Text className="text-sm text-muted-foreground mb-3">
        Check off amends you made today. Add notes if the person had any input.
      </Text>
      {amends.length === 0 ? (
        <Text className="text-muted-foreground py-4">
          No one on your amends list yet. Add people in Step 8 first.
        </Text>
      ) : (
        <View className="gap-2">
          {amends.map((a) => {
            const done = doneSet.has(a.id);
            const notes = notesMap[a.id] ?? '';
            return (
              <View key={a.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <TouchableOpacity
                  onPress={() => handleToggle(a.id)}
                  onFocus={onStartTimer}
                  className="flex-row items-center gap-3 p-4"
                >
                  <View
                    className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                      done ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {done && <Check size={18} color={iconColors.primaryForeground} />}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                    >
                      {a.personName}
                    </Text>
                    {a.notes ? (
                      <Text className="text-muted-foreground text-sm mt-0.5">{a.notes}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
                {done && (
                  <View className="px-4 pb-4">
                    <TextInput
                      value={notes}
                      onChangeText={(t) => handleNotesChange(a.id, t)}
                      onFocus={onStartTimer}
                      placeholder="Notes from this person (their input, feedback...)"
                      placeholderTextColor={iconColors.muted}
                      multiline
                      className="text-sm text-foreground rounded-lg px-3 py-2 bg-muted/50 border border-border"
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
      <StepBookmarkPicker stepNumber={stepNumber} onStartTimer={onStartTimer} />
    </View>
  );
}
