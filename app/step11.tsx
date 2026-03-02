import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { useIconColors, useSwitchColors } from '@/lib/iconTheme';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { MorningForm } from '@/features/inventory/components/MorningForm';
import { NightlyForm } from '@/features/inventory/components/NightlyForm';
import { MeditationTimer } from '@/features/meditation/MeditationTimer';
import { useBackToAnalytics } from '@/hooks/useBackToAnalytics';
import { usePrivacyLock } from '@/hooks/usePrivacyLock';
import { getStep6DefectsOrdered } from '@/features/steps/stepWorkDatabase';
import { getTodayKey } from '@/utils/date';

export default function Step11Screen() {
  const router = useRouter();
  const backToAnalytics = useBackToAnalytics();
  const scrollRef = useRef<ScrollView | null>(null);
  const privacyLock = usePrivacyLock();
  const today = getTodayKey();
  const {
    morningEntries,
    nightlyEntries,
    loading,
    error,
    refresh,
    addEntry,
    updateEntry,
    removeEntry,
  } = useInventory();
  const iconColors = useIconColors();
  const switchColors = useSwitchColors();

  const [showMeditation, setShowMeditation] = useState(false);
  const [showMorning, setShowMorning] = useState(false);
  const [showNightly, setShowNightly] = useState(false);
  const [readyDefects, setReadyDefects] = useState<string[]>([]);

  const loadDefects = useCallback(async () => {
    const { readyDefects: rd } = await getStep6DefectsOrdered(today);
    setReadyDefects(rd);
  }, [today]);

  useEffect(() => {
    loadDefects();
  }, [loadDefects]);

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Step 11" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Step 11" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 24, paddingBottom: 96 }}>
        {/* Meditation */}
        <View className="mb-6">
          {!showMeditation ? (
            <TouchableOpacity
              onPress={() => setShowMeditation(true)}
              className="bg-primary py-4 px-6 rounded-xl items-center"
            >
              <Text className="text-primary-foreground font-bold text-lg">Start meditating</Text>
            </TouchableOpacity>
          ) : (
            <View className="mb-4">
              <MeditationTimer />
              <TouchableOpacity
                onPress={() => setShowMeditation(false)}
                className="mt-4 py-2 items-center"
              >
                <Text className="text-muted-foreground text-sm">Hide meditation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Morning inventory */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setShowMorning(!showMorning)}
            className="flex-row items-center justify-between py-4 px-4 rounded-xl border border-border bg-card"
          >
            <Text className="text-base font-semibold text-foreground">Morning inventory</Text>
            <Text className="text-muted-foreground text-sm">{showMorning ? 'Hide' : 'Add'}</Text>
          </TouchableOpacity>
          {showMorning && (
            <View className="mt-3 p-4 rounded-xl border border-border bg-card">
              <MorningForm
                morningEntries={morningEntries}
                switchColors={switchColors}
                iconColors={iconColors}
                privacyLock={privacyLock}
                addEntry={addEntry}
                updateEntry={updateEntry}
                removeEntry={removeEntry}
              />
            </View>
          )}
        </View>

        {/* Nightly inventory */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setShowNightly(!showNightly)}
            className="flex-row items-center justify-between py-4 px-4 rounded-xl border border-border bg-card"
          >
            <Text className="text-base font-semibold text-foreground">Nightly inventory</Text>
            <Text className="text-muted-foreground text-sm">{showNightly ? 'Hide' : 'Add'}</Text>
          </TouchableOpacity>
          {showNightly && (
            <View className="mt-3 p-4 rounded-xl border border-border bg-card">
              <NightlyForm
                nightlyEntries={nightlyEntries}
                switchColors={switchColors}
                iconColors={iconColors}
                privacyLock={privacyLock}
                addEntry={addEntry}
                updateEntry={updateEntry}
                removeEntry={removeEntry}
                readyDefects={readyDefects}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
