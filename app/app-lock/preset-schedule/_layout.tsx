/**
 * Preset schedule — stack for nested screens.
 * Uses custom AppHeader per screen for consistent app styling.
 */
import { Stack } from 'expo-router';

export default function PresetScheduleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="default" />
      <Stack.Screen name="rules" />
      <Stack.Screen name="rule-edit" />
      <Stack.Screen name="custom-ranges" />
      <Stack.Screen name="custom-range-edit" />
      <Stack.Screen name="jewish-holidays" />
      <Stack.Screen name="holiday-rule-edit" />
    </Stack>
  );
}
