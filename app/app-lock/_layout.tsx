/**
 * App Lock settings — Stack navigator for subpages.
 */
import { TouchableOpacity } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useIconColors } from '@/lib/iconTheme';
import { themeColors } from '@/theme';

function HeaderBackButton() {
  const router = useRouter();
  const segments = useSegments();
  const iconColors = useIconColors();
  const isAppLockRoot = segments.length === 1 && segments[0] === 'app-lock';

  const handleBack = () => {
    if (isAppLockRoot) {
      router.replace('/settings');
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity onPress={handleBack} hitSlop={8} style={{ marginLeft: 8 }}>
      <ArrowLeft size={24} color={iconColors.primary} />
    </TouchableOpacity>
  );
}

export default function AppLockLayout() {
  const { colorScheme } = useColorScheme();
  const iconColors = useIconColors();
  const colors = themeColors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: iconColors.foreground,
        headerTitleStyle: { color: iconColors.foreground, fontWeight: '600' },
        headerLeft: () => <HeaderBackButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'App Lock' }} />
      <Stack.Screen name="presets" options={{ title: 'Presets' }} />
      <Stack.Screen name="preset/[id]" options={{ title: 'Preset' }} />
      <Stack.Screen name="preset-edit" options={{ title: 'Edit Preset' }} />
      <Stack.Screen name="instructions" options={{ title: 'Setup Guide' }} />
      <Stack.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Stack.Screen name="tiers" options={{ title: 'Unlock Tiers' }} />
      <Stack.Screen name="tier/[id]" options={{ title: 'Edit Tier' }} />
      <Stack.Screen name="emergency-apps" options={{ title: 'Emergency Apps' }} />
      <Stack.Screen
        name="preset-schedule"
        options={{ title: 'Preset Schedule', headerShown: false }}
      />
    </Stack>
  );
}
