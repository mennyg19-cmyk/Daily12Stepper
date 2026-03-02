/**
 * App Lock settings — Stack navigator for subpages.
 * Uses custom AppHeader per screen (no Stack header) for consistent app styling.
 */
import { Stack } from 'expo-router';

export default function AppLockLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="presets" />
      <Stack.Screen name="preset/[id]" />
      <Stack.Screen name="preset-edit" />
      <Stack.Screen name="instructions" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="tiers" />
      <Stack.Screen name="tier/[id]" />
      <Stack.Screen name="emergency-apps" />
      <Stack.Screen name="preset-schedule" />
    </Stack>
  );
}
