/**
 * Privacy lock hook — gates access to sensitive data.
 * When locked, authenticate() triggers Face ID / password.
 */
import { usePrivacyContext } from '@/contexts/PrivacyContext';

export function usePrivacyLock() {
  const { isLocked, lockMode, authenticate, refreshLockState } = usePrivacyContext();
  return {
    isLocked,
    lockMode,
    authenticate: async (password?: string) => {
      const ok = await authenticate(password);
      return ok;
    },
    refreshLockState,
  };
}
