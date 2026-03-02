import { useRouter } from 'expo-router';

export function useBackToAnalytics() {
  const router = useRouter();
  return () => router.back();
}
