import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { ResentmentForm } from '@/features/inventory/components/ResentmentForm';
import { FearForm } from '@/features/inventory/components/FearForm';
import { useBackToAnalytics } from '@/hooks/useBackToAnalytics';
import { usePrivacyLock } from '@/hooks/usePrivacyLock';
import { PrivacyGate } from '@/components/PrivacyGate';

type Tab = 'resentment' | 'fear';

export default function InventoryScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const backToAnalytics = useBackToAnalytics();
  const scrollRef = useRef<ScrollView | null>(null);
  const privacyLock = usePrivacyLock();
  const {
    step10Entries,
    fearEntries,
    loading,
    error,
    refresh,
    addEntry,
    updateEntry,
    removeEntry,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<Tab>('resentment');

  useEffect(() => {
    if (params.tab === 'fear' || params.tab === 'resentment') {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Step 10" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Step 10" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
      <PrivacyGate onCancel={backToAnalytics}>
      <View className="flex-row border-b border-border px-6">
        {(['resentment', 'fear'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === tab ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text
              className={`font-semibold ${
                activeTab === tab ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab === 'resentment' ? 'Resentment' : 'Fear'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 24, paddingBottom: 96 }}>
        {activeTab === 'resentment' && (
          <ResentmentForm
            step10Entries={step10Entries}
            addEntry={addEntry}
            updateEntry={updateEntry}
            removeEntry={removeEntry}
            scrollRef={scrollRef}
            privacyLock={privacyLock}
          />
        )}

        {activeTab === 'fear' && (
          <FearForm
            fearEntries={fearEntries}
            addEntry={addEntry}
            updateEntry={updateEntry}
            removeEntry={removeEntry}
            scrollRef={scrollRef}
            privacyLock={privacyLock}
          />
        )}
      </ScrollView>
      </PrivacyGate>
    </SafeAreaView>
  );
}
