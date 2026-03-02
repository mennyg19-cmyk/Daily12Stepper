/**
 * Preset schedule — stack for nested screens.
 */
import { TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useIconColors } from '@/lib/iconTheme';
import { themeColors } from '@/theme';

function HeaderBackButton() {
  const router = useRouter();
  const iconColors = useIconColors();
  return (
    <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginLeft: 8 }}>
      <ArrowLeft size={24} color={iconColors.primary} />
    </TouchableOpacity>
  );
}

export default function PresetScheduleLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Preset Schedule' }} />
      <Stack.Screen name="default" options={{ title: 'Default Preset' }} />
      <Stack.Screen name="rules" options={{ title: 'Day Rules' }} />
      <Stack.Screen name="rule-edit" options={{ title: 'Edit Rule' }} />
      <Stack.Screen name="custom-ranges" options={{ title: 'Custom Ranges' }} />
      <Stack.Screen name="custom-range-edit" options={{ title: 'Date Range' }} />
      <Stack.Screen name="jewish-holidays" options={{ title: 'Jewish Holidays' }} />
      <Stack.Screen name="holiday-rule-edit" options={{ title: 'Holiday Rule' }} />
    </Stack>
  );
}
