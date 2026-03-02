/**
 * Blocks app content until user commits or bypasses.
 * Uses a modal for commitment — no navigation.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, AppState, type AppStateStatus } from 'react-native';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CommitmentModal } from '@/components/CommitmentModal';
import { getTodayKey } from '@/utils/date';
import { getCommitmentForDate } from '@/features/commitment/database';
import { isCommitmentActive } from '@/lib/commitment';
import { getCommitmentBypassedForDate, setCommitmentBypassed } from '@/lib/settings';
import { themeColors } from '@/theme';
import { useColorScheme } from 'nativewind';
import type { DailyCommitment } from '@/lib/database/schema';

interface CommitmentGateProps {
  children: React.ReactNode;
}

export function CommitmentGate({ children }: CommitmentGateProps) {
  const { colorScheme } = useColorScheme();
  const colors = themeColors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [commitment, setCommitment] = useState<DailyCommitment | null>(null);
  const [bypassed, setBypassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);

  const check = useCallback(async () => {
    const today = getTodayKey();
    try {
      const [c, b] = await Promise.all([
        getCommitmentForDate(today),
        getCommitmentBypassedForDate(today),
      ]);
      setCommitment(c ?? null);
      setBypassed(b);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  const handleBypass = async () => {
    const today = getTodayKey();
    await setCommitmentBypassed(today);
    setBypassed(true);
  };

  const hasAccess =
    commitment && commitment.commitmentType !== 'none' && isCommitmentActive(commitment);
  const showGate = !loading && !hasAccess && !bypassed;

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      {children}
      {showGate && (
        <View
          className="absolute inset-0 bg-background z-50"
          style={{ elevation: 999 }}
        >
          <View className="flex-row justify-end p-4">
            <ThemeToggle />
          </View>
          <View className="flex-1 justify-center px-8">
            <Text className="text-2xl font-bold text-foreground text-center mb-4">
              Daily commitment
            </Text>
            <Text className="text-muted-foreground text-center mb-8">
              Make a commitment before using the app today.
            </Text>
            <TouchableOpacity
              onPress={() => setShowCommitmentModal(true)}
              className="bg-primary py-4 px-6 rounded-xl items-center mb-4"
            >
              <Text className="text-primary-foreground font-bold text-lg">Commit now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBypass}
              className="py-3 items-center"
            >
              <Text className="text-muted-foreground underline text-sm">Bypass for today</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <CommitmentModal
        visible={showCommitmentModal}
        onClose={() => setShowCommitmentModal(false)}
        onSaved={check}
      />
    </>
  );
}
