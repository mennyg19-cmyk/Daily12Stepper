import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Trash2, Check, ChevronRight, Heart, BookOpen } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalButton,
  ModalButtonRow,
  ModalTitle,
} from '@/components/ModalContent';
import { ModalSurface } from '@/components/ModalSurface';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { useIconColors } from '@/lib/iconTheme';
import { useExtraTools } from './useExtraTools';
import type { ExtraTool } from './database';
import { getTodayKey } from '@/utils/date';
import { scheduleExtraToolReminders } from '@/lib/notifications';
import { SobrietyCountersSection } from '@/features/sobriety/SobrietyCountersSection';
import { SponsorWorkTimeCard } from '@/features/sponsor-work-time/SponsorWorkTimeCard';
import { PrivacyGate } from '@/components/PrivacyGate';

const FREQUENCY_OPTIONS: { value: 'daily' | 'weekly' | 'monthly'; label: string }[] = [
  { value: 'daily', label: 'Per day' },
  { value: 'weekly', label: 'Per week' },
  { value: 'monthly', label: 'Per month' },
];

function frequencyLabel(tool: ExtraTool): string {
  if (tool.frequencyType === 'daily') return `${tool.frequencyValue}x per day`;
  if (tool.frequencyType === 'weekly' || tool.frequencyType === 'custom') return `${tool.frequencyValue}x per week`;
  if (tool.frequencyType === 'monthly') return `${tool.frequencyValue}x per month`;
  return `${tool.frequencyValue}x per week`;
}

export function ExtraToolsScreen() {
  const router = useRouter();
  const iconColors = useIconColors();
  const {
    tools,
    completions,
    date,
    loading,
    error,
    refresh,
    addTool,
    updateTool,
    removeTool,
    toggleCompletion,
    setDateFilter,
  } = useExtraTools();

  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTool, setEditingTool] = useState<ExtraTool | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftFreq, setDraftFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [draftValue, setDraftValue] = useState('3');
  const [draftReminder, setDraftReminder] = useState(false);
  const [draftReminderTime, setDraftReminderTime] = useState('09:00');
  const [submitting, setSubmitting] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openAdd = () => {
    setDraftName('');
    setDraftFreq('weekly');
    setDraftValue('3');
    setDraftReminder(false);
    setDraftReminderTime('09:00');
    setEditingTool(null);
    setShowAdd(true);
  };

  const openEdit = (tool: ExtraTool) => {
    setDraftName(tool.name);
    const freq = tool.frequencyType === 'custom' ? 'weekly' : tool.frequencyType;
    setDraftFreq(freq === 'monthly' ? 'monthly' : freq === 'daily' ? 'daily' : 'weekly');
    setDraftValue(String(tool.frequencyValue));
    setDraftReminder(tool.reminderEnabled);
    setDraftReminderTime(tool.reminderTime ?? '09:00');
    setEditingTool(tool);
    setShowAdd(true);
  };

  const handleSave = async () => {
    const name = draftName.trim();
    if (!name) return;
    const value = Math.max(1, parseInt(draftValue, 10) || 1);

    setSubmitting(true);
    try {
      if (editingTool) {
        await updateTool(editingTool.id, {
          name,
          frequencyType: draftFreq,
          frequencyValue: value,
          reminderEnabled: draftReminder,
          reminderTime: draftReminder ? draftReminderTime : null,
        });
      } else {
        await addTool(name, draftFreq, value, draftReminder, draftReminder ? draftReminderTime : null);
      }
      setShowAdd(false);
      setEditingTool(null);
      if (draftReminder) {
        scheduleExtraToolReminders().catch(() => {});
      }
    } catch {
      Alert.alert('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (tool: ExtraTool) => {
    Alert.alert('Delete tool', `Remove "${tool.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeTool(tool.id);
          scheduleExtraToolReminders().catch(() => {});
        },
      },
    ]);
  };

  const isToday = date === getTodayKey();

  if (loading) return <LoadingView />;
  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Extra Tools" rightSlot={<ThemeToggle />} showBack />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Extra Tools" rightSlot={<ThemeToggle />} showBack />
      <PrivacyGate>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={iconColors.primary} />
        }
      >
        <Text className="text-sm text-muted-foreground mb-4">
          Add custom tools like &quot;Call sponsor 3x/week&quot; with reminders. Mark them complete when done.
        </Text>

        {/* Date selector */}
        <View className="flex-row items-center gap-2 mb-4">
          <Text className="text-sm text-muted-foreground">Showing:</Text>
          <TouchableOpacity
            onPress={() => setDateFilter(getTodayKey())}
            className={`px-3 py-1.5 rounded-lg ${isToday ? 'bg-primary' : 'bg-muted'}`}
          >
            <Text className={`text-sm font-medium ${isToday ? 'text-primary-foreground' : 'text-foreground'}`}>
              Today
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sobriety counters — one per addiction from profile */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-2">Sobriety</Text>
          <SobrietyCountersSection />
        </View>

        {/* Sponsor recommended work time — compact: time left only */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-2">Sponsor work time</Text>
          <SponsorWorkTimeCard compact />
        </View>

        {/* Gratitude & Reader */}
        <View className="gap-2 mb-4">
          <TouchableOpacity
            onPress={() => router.push('/gratitude')}
            className="flex-row items-center justify-between bg-card rounded-xl p-4 border border-border"
          >
            <View className="flex-row items-center gap-2">
              <Heart size={20} color={iconColors.primary} />
              <Text className="text-base font-semibold text-foreground">Gratitude</Text>
            </View>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/reader')}
            className="flex-row items-center justify-between bg-card rounded-xl p-4 border border-border"
          >
            <View className="flex-row items-center gap-2">
              <BookOpen size={20} color={iconColors.primary} />
              <Text className="text-base font-semibold text-foreground">Reader</Text>
            </View>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>
        </View>

        {/* Tool list */}
        <View className="gap-2 mb-4">
          {tools.length === 0 ? (
            <View className="rounded-2xl p-6 bg-card border border-border">
              <Text className="text-muted-foreground text-center">
                No tools yet. Add one above.
              </Text>
            </View>
          ) : (
            tools.map((tool) => {
              const completed = completions.has(tool.id);
              return (
                <View
                  key={tool.id}
                  className="rounded-xl p-4 bg-card border border-border flex-row items-center justify-between"
                >
                  <TouchableOpacity
                    onPress={() => toggleCompletion(tool.id)}
                    className="flex-row items-center flex-1"
                    activeOpacity={0.8}
                  >
                    <View
                      className={`w-8 h-8 rounded-full border-2 items-center justify-center mr-3 ${
                        completed ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}
                    >
                      {completed && <Check size={18} color={iconColors.primaryForeground} />}
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold ${completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                      >
                        {tool.name}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {frequencyLabel(tool)}
                        {tool.reminderEnabled && tool.reminderTime && ` • Reminder ${tool.reminderTime}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => openEdit(tool)} className="p-2">
                      <ChevronRight size={20} color={iconColors.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(tool)} className="p-2">
                      <Trash2 size={18} color={iconColors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Add button — after all custom tools */}
        <TouchableOpacity
          onPress={openAdd}
          className="flex-row items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-border"
        >
          <Plus size={20} color={iconColors.primary} />
          <Text className="text-base font-semibold text-primary">Add tool</Text>
        </TouchableOpacity>
      </ScrollView>

      <ModalSurface visible={showAdd} onRequestClose={() => setShowAdd(false)}>
        <View className="p-6">
          <ModalTitle>{editingTool ? 'Edit tool' : 'Add tool'}</ModalTitle>
          <ModalSection>
            <ModalLabel>Name</ModalLabel>
            <ModalInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="e.g. Call sponsor"
            />
          </ModalSection>
          <ModalSection>
            <ModalLabel>Frequency</ModalLabel>
            <View className="flex-row flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setDraftFreq(opt.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    draftFreq === opt.value ? 'bg-primary border-primary' : 'border-border bg-muted/50'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      draftFreq === opt.value ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="mt-2 flex-row items-center gap-2">
              <ModalInput
                value={draftValue}
                onChangeText={setDraftValue}
                placeholder={draftFreq === 'daily' ? '1' : draftFreq === 'weekly' ? '3' : '15'}
                keyboardType="number-pad"
                className="w-20"
              />
              <Text className="text-sm text-muted-foreground">
                {draftFreq === 'daily' ? 'times per day' : draftFreq === 'weekly' ? 'times per week' : 'times per month'}
              </Text>
            </View>
          </ModalSection>
          <ModalSection>
            <TouchableOpacity
              onPress={() => setDraftReminder(!draftReminder)}
              className="flex-row items-center gap-2"
            >
              <View
                className={`w-5 h-5 rounded border-2 items-center justify-center ${
                  draftReminder ? 'bg-primary border-primary' : 'border-border'
                }`}
              >
                {draftReminder && <Check size={14} color={iconColors.primaryForeground} />}
              </View>
              <Text className="text-sm text-foreground">Reminder</Text>
            </TouchableOpacity>
            {draftReminder && (
              <View className="mt-2">
                <ModalInput
                  value={draftReminderTime}
                  onChangeText={setDraftReminderTime}
                  placeholder="09:00"
                />
              </View>
            )}
          </ModalSection>
          <ModalButtonRow className="mt-4">
            <ModalButton onPress={() => setShowAdd(false)} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton
              onPress={handleSave}
              variant="primary"
              disabled={!draftName.trim() || submitting}
              loading={submitting}
            >
              {editingTool ? 'Save' : 'Add'}
            </ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
      </PrivacyGate>
    </SafeAreaView>
  );
}
