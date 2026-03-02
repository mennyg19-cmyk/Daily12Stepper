/**
 * App Lock — full setup instructions and capabilities.
 */
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AppLockInstructions } from '@/features/app-lock/instructions';

export default function AppLockInstructionsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <AppLockInstructions />
    </ScrollView>
  );
}
