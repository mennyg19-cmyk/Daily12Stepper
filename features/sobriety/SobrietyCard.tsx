/**
 * Sobriety tracker — live counter with seconds, manual date/time for start/reset, streak history.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getSobrietyStartDatetime,
  setSobrietyStartDatetime,
  archiveAndReset,
  updateSobrietyStartDatetime,
  getSobrietyHistory,
  secondsSince,
  type SobrietyStreak,
} from './database';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle, ModalSection, ModalLabel, ModalInput, ModalButton, ModalButtonRow } from '@/components/ModalContent';

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

export function SobrietyCard() {
  const router = useRouter();
  const [startDatetime, setStartDatetime] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSetModal, setShowSetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [history, setHistory] = useState<SobrietyStreak[]>([]);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const [dt, hist] = await Promise.all([
      getSobrietyStartDatetime(),
      getSobrietyHistory(),
    ]);
    setStartDatetime(dt);
    setHistory(hist);
    if (dt) setElapsedSeconds(secondsSince(dt));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (startDatetime) {
      const update = () => setElapsedSeconds(secondsSince(startDatetime));
      timerRef.current = setInterval(update, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [startDatetime]);

  const parseDatetime = (): string => {
    const datePart = dateInput.trim() || new Date().toISOString().slice(0, 10);
    const timePart = timeInput.trim() || new Date().toTimeString().slice(0, 5);
    try {
      const [y, mo, d] = datePart.split('-').map(Number);
      const [h, mi] = timePart.split(':').map(Number);
      const dt = new Date(y, (mo ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, 0, 0);
      return dt.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const handleConfirmSet = async () => {
    const iso = parseDatetime();
    if (isResetting) {
      await archiveAndReset(iso);
      setShowSetModal(false);
      setIsResetting(false);
      Alert.alert(
        'Reset sobriety',
        'Would you like to add anything to your Step 1 inventory?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: () => router.push('/steps/1') },
        ]
      );
    } else {
      await updateSobrietyStartDatetime(iso);
      setShowSetModal(false);
    }
    load();
  };

  const doResetWithStep1Prompt = () => {
    setIsResetting(true);
    setDateInput(new Date().toISOString().slice(0, 10));
    setTimeInput(new Date().toTimeString().slice(0, 5));
    setShowSetModal(true);
  };

  const handleCorrectTime = () => {
    setIsResetting(false);
    if (startDatetime) {
      const d = new Date(startDatetime);
      setDateInput(d.toISOString().slice(0, 10));
      setTimeInput(d.toTimeString().slice(0, 5));
    } else {
      setDateInput(new Date().toISOString().slice(0, 10));
      setTimeInput(new Date().toTimeString().slice(0, 5));
    }
    setShowSetModal(true);
  };

  if (!startDatetime) {
    return (
      <TouchableOpacity
        onPress={async () => {
          const now = new Date().toISOString();
          await setSobrietyStartDatetime(now);
          load();
        }}
        className="bg-card rounded-xl p-4 border border-dashed border-border"
      >
        <Text className="text-muted-foreground text-center">
          Tap to start tracking sobriety
        </Text>
      </TouchableOpacity>
    );
  }

  const startDate = new Date(startDatetime);

  return (
    <View className="bg-card rounded-xl p-4 border border-border">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-muted-foreground">Sobriety</Text>
        <TouchableOpacity
          onPress={doResetWithStep1Prompt}
          className="px-4 py-2 rounded-lg border border-destructive"
        >
          <Text className="text-destructive font-semibold">Reset</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-3xl font-bold text-foreground font-mono tabular-nums">
        {formatDuration(elapsedSeconds)}
      </Text>
      <Text className="text-xs text-muted-foreground mt-1">
        Since {startDate.toLocaleString()}
      </Text>
      <TouchableOpacity
        onPress={handleCorrectTime}
        className="mt-3 py-2 rounded-lg border border-border items-center"
      >
        <Text className="text-muted-foreground text-sm">Correct start date/time</Text>
      </TouchableOpacity>

      {history.length > 0 && (
        <View className="mt-4 pt-4 border-t border-border">
          <Text className="text-sm font-semibold text-foreground mb-2">Past streaks</Text>
          <ScrollView className="max-h-24" showsVerticalScrollIndicator>
            {history.slice(0, 10).map((s) => (
              <View key={s.id} className="flex-row justify-between py-1">
                <Text className="text-xs text-muted-foreground">
                  {s.daysCount != null ? `${s.daysCount} days` : '—'} → relapse
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {new Date(s.startDatetime).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <ModalSurface visible={showSetModal} onRequestClose={() => setShowSetModal(false)}>
        <View className="p-6">
          <ModalTitle>{isResetting ? 'Reset sobriety — when did it happen?' : 'Correct start date & time'}</ModalTitle>
          <Text className="text-sm text-muted-foreground mb-4">
            {isResetting ? 'Set when you reset (e.g. this morning). Current streak will be saved to history.' : 'Update when you actually started (e.g. this morning at 8am).'}
          </Text>
          <ModalSection>
            <ModalLabel>Date (YYYY-MM-DD)</ModalLabel>
            <ModalInput
              value={dateInput}
              onChangeText={setDateInput}
              placeholder={new Date().toISOString().slice(0, 10)}
            />
          </ModalSection>
          <ModalSection>
            <ModalLabel>Time (HH:MM)</ModalLabel>
            <ModalInput
              value={timeInput}
              onChangeText={setTimeInput}
              placeholder={new Date().toTimeString().slice(0, 5)}
            />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowSetModal(false)} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onPress={handleConfirmSet} variant="primary">
              {isResetting ? 'Reset' : 'Update'}
            </ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </View>
  );
}
