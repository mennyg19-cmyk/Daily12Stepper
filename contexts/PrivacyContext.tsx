/**
 * Privacy context — shared unlock state for sensitive data.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getPrivacyLockMode,
  isPrivacyUnlocked,
  extendUnlockSession,
  lockPrivacySession,
  authenticateWithBiometric,
  verifyPrivacyPassword,
  type PrivacyLockMode,
} from '@/lib/privacy';

interface PrivacyContextValue {
  isLocked: boolean;
  lockMode: PrivacyLockMode;
  authenticate: (password?: string) => Promise<boolean>;
  lock: () => Promise<void>;
  refreshLockState: () => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [lockMode, setLockMode] = useState<PrivacyLockMode>('off');

  const refreshLockState = useCallback(async () => {
    const mode = await getPrivacyLockMode();
    setLockMode(mode);
    if (mode === 'off') {
      setIsLocked(false);
      return;
    }
    const unlocked = await isPrivacyUnlocked();
    setIsLocked(!unlocked);
  }, []);

  useEffect(() => {
    refreshLockState();
  }, [refreshLockState]);

  const authenticate = useCallback(
    async (password?: string): Promise<boolean> => {
      const mode = await getPrivacyLockMode();
      if (mode === 'off') return true;

      let ok = false;
      if (mode === 'biometric') {
        ok = await authenticateWithBiometric();
        if (!ok && password) {
          ok = await verifyPrivacyPassword(password);
        }
      } else {
        if (password) {
          ok = await verifyPrivacyPassword(password);
        }
      }

      if (ok) {
        await extendUnlockSession();
        setIsLocked(false);
      }
      return ok;
    },
    []
  );

  const lock = useCallback(async () => {
    await lockPrivacySession();
    setIsLocked(true);
  }, []);

  return (
    <PrivacyContext.Provider
      value={{ isLocked, lockMode, authenticate, lock, refreshLockState }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacyContext(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    return {
      isLocked: false,
      lockMode: 'off',
      authenticate: async () => true,
      lock: async () => {},
      refreshLockState: async () => {},
    };
  }
  return ctx;
}
