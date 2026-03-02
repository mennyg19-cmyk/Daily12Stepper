/**
 * Root layout — tab navigator for Daily 12 Stepper.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Tabs } from 'expo-router';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PrivacyProvider } from '@/contexts/PrivacyContext';
import { CommitmentGate } from '@/components/CommitmentGate';
import { Home, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useIconColors } from '@/lib/iconTheme';
import { themeColors } from '@/theme';
import { isSQLiteAvailable } from '@/lib/database/db';
import { logger } from '@/lib/logger';
import '@/global.css';

function TabNavigator() {
  const { colorScheme } = useColorScheme();
  const iconColors = useIconColors();
  const colors = themeColors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: iconColors.primary,
        tabBarInactiveTintColor: iconColors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          color: iconColors.muted,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="steps/[stepNumber]" options={{ href: null }} />
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="step11" options={{ href: null }} />
      <Tabs.Screen name="extra-tools" options={{ href: null }} />
      <Tabs.Screen name="metrics" options={{ href: null }} />
      <Tabs.Screen name="gratitude" options={{ href: null }} />
      <Tabs.Screen name="reader/index" options={{ href: null }} />
      <Tabs.Screen name="reader/[bookId]" options={{ href: null }} />
      <Tabs.Screen name="app-lock" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [ready, setReady] = useState(false);
  const colors = themeColors[colorScheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    isSQLiteAvailable()
      .then((ok) => {
        if (!ok) logger.warn('SQLite not available (Expo Go?) — some features may not work');
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <View style={{ flex: 1, backgroundColor: colors.background }} />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <PrivacyProvider>
          <StatusBar style="auto" />
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <CommitmentGate>
              <TabNavigator />
            </CommitmentGate>
          </View>
        </PrivacyProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
