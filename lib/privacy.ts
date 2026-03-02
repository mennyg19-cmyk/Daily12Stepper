/**
 * Privacy lock — Face ID / Touch ID / Password for sensitive data.
 * Protects: inventories, sobriety dates/streaks, app lock rules.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const PRIVACY_MODE_KEY = 'daily12stepper_privacy_mode';
const PRIVACY_PASSWORD_HASH_KEY = 'daily12stepper_privacy_password_hash';
const PRIVACY_UNLOCKED_UNTIL_KEY = 'daily12stepper_privacy_unlocked_until';
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export type PrivacyLockMode = 'off' | 'biometric' | 'password';

async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export async function getPrivacyLockMode(): Promise<PrivacyLockMode> {
  try {
    const v = await SecureStore.getItemAsync(PRIVACY_MODE_KEY);
    if (v === 'biometric' || v === 'password') return v;
  } catch {}
  return 'off';
}

export async function setPrivacyLockMode(mode: PrivacyLockMode): Promise<void> {
  if (mode === 'off') {
    await SecureStore.deleteItemAsync(PRIVACY_MODE_KEY);
    await SecureStore.deleteItemAsync(PRIVACY_PASSWORD_HASH_KEY);
    return;
  }
  await SecureStore.setItemAsync(PRIVACY_MODE_KEY, mode);
}

export async function setPrivacyPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  await SecureStore.setItemAsync(PRIVACY_PASSWORD_HASH_KEY, hash);
}

export async function verifyPrivacyPassword(password: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PRIVACY_PASSWORD_HASH_KEY);
  if (!stored) return false;
  const hash = await hashPassword(password);
  return hash === stored;
}

export async function hasBiometricHardware(): Promise<boolean> {
  try {
    return await LocalAuthentication.hasHardwareAsync();
  } catch {
    return false;
  }
}

export async function getBiometricType(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Touch ID';
  } catch {}
  return 'Biometric';
}

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock to view sensitive data',
      fallbackLabel: 'Use password',
    });
    return result.success;
  } catch {
    return false;
  }
}

/** Check if user is currently unlocked (within timeout). */
export async function isPrivacyUnlocked(): Promise<boolean> {
  const mode = await getPrivacyLockMode();
  if (mode === 'off') return true;
  try {
    const until = await SecureStore.getItemAsync(PRIVACY_UNLOCKED_UNTIL_KEY);
    if (!until) return false;
    const ts = parseInt(until, 10);
    return Date.now() < ts;
  } catch {
    return false;
  }
}

/** Extend unlock session. */
export async function extendUnlockSession(): Promise<void> {
  const until = Date.now() + LOCK_TIMEOUT_MS;
  await SecureStore.setItemAsync(PRIVACY_UNLOCKED_UNTIL_KEY, String(until));
}

/** Clear unlock session (lock). */
export async function lockPrivacySession(): Promise<void> {
  await SecureStore.deleteItemAsync(PRIVACY_UNLOCKED_UNTIL_KEY);
}
