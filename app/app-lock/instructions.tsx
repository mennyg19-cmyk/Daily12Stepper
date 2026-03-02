/**
 * App Lock — full setup instructions and capabilities.
 */
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AppLockInstructions } from '@/features/app-lock/instructions';

export default function AppLockInstructionsScreen() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Setup Guide" rightSlot={<ThemeToggle />} showBack />
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <AppLockInstructions />
    </ScrollView>
    </SafeAreaView>
  );
}
