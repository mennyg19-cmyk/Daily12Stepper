/**
 * App Lock — reusable instruction content for setup and onboarding.
 */
import React from 'react';
import { View, Text } from 'react-native';

const SECTIONS = [
  {
    title: 'What is App Lock?',
    content:
      'App Lock blocks or hides apps on your phone until you make your daily commitment. Similar to Cape, it helps you stay focused on your stepwork before distractions.',
  },
  {
    title: 'Why it works',
    content:
      'If you find yourself getting distracted by other apps before doing your daily commitment, App Lock can help. By limiting access until you commit, you create a clear boundary: stepwork first. You can turn it off at any time or customize it (weekdays only, vacations, Jewish holidays) to fit your life.',
  },
  {
    title: 'Capabilities',
    content: [
      '• Full lock: Block everything except this app and emergency apps until commitment',
      '• Tiered unlock: Unlock app groups as you complete steps (e.g. steps 1–3 → productivity apps)',
      '• Schedule: Activate lock at night (e.g. 10 PM) or morning (e.g. 6 AM)',
      '• Emergency apps: Always allow Phone, Messages, and others you choose',
      '• Presets: Save multiple setups (Weekend, Work day, Vacation) and switch between them',
    ].join('\n'),
  },
  {
    title: 'Setup steps',
    content: [
      '1. Go to Settings → App Lock',
      '2. Tap Presets and choose Light, Medium, Heavy, or Extreme',
      '3. Tap a preset to read full instructions and "Use this preset"',
      '4. Or tap "Customize & save as my preset" to create your own',
      '5. Add emergency apps (Phone, Messages)',
      '6. For tiered presets, select which apps unlock at each tier',
      '7. Enable App Lock',
    ].join('\n'),
  },
  {
    title: 'Built-in presets',
    content: [
      '• Light: Lock from 6 AM, full block until commitment',
      '• Medium: Lock from 6 AM, tiered (steps 1–3 → productivity, 4–6 → communication)',
      '• Heavy: Lock from 10 PM, full block until commitment',
      '• Extreme: Lock from 9 PM, strict tiered unlock',
    ].join('\n'),
  },
];

export function AppLockInstructions() {
  return (
    <View className="gap-6">
      {SECTIONS.map((s, i) => (
        <View key={i}>
          <Text className="text-base font-semibold text-foreground mb-2">{s.title}</Text>
          <Text className="text-sm text-muted-foreground leading-6 whitespace-pre-line">
            {s.content}
          </Text>
        </View>
      ))}
    </View>
  );
}
