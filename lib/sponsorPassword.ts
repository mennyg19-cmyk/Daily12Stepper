/**
 * Sponsor password — separate password for app lock rules.
 * When set, user cannot change app lock presets without sponsor's password.
 */
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const SPONSOR_PASSWORD_HASH_KEY = 'daily12stepper_sponsor_password_hash';
const SPONSOR_VERIFIED_UNTIL_KEY = 'daily12stepper_sponsor_verified_until';
const SPONSOR_VERIFY_DURATION_MS = 15 * 60 * 1000; // 15 minutes

async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export async function hasSponsorPassword(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(SPONSOR_PASSWORD_HASH_KEY);
    return !!v;
  } catch {
    return false;
  }
}

export async function setSponsorPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  await SecureStore.setItemAsync(SPONSOR_PASSWORD_HASH_KEY, hash);
}

export async function verifySponsorPassword(password: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(SPONSOR_PASSWORD_HASH_KEY);
  if (!stored) return false;
  const hash = await hashPassword(password);
  if (hash !== stored) return false;
  const until = Date.now() + SPONSOR_VERIFY_DURATION_MS;
  await SecureStore.setItemAsync(SPONSOR_VERIFIED_UNTIL_KEY, String(until));
  return true;
}

export async function isSponsorVerified(): Promise<boolean> {
  try {
    const until = await SecureStore.getItemAsync(SPONSOR_VERIFIED_UNTIL_KEY);
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

export async function clearSponsorPassword(): Promise<void> {
  await SecureStore.deleteItemAsync(SPONSOR_PASSWORD_HASH_KEY);
  await SecureStore.deleteItemAsync(SPONSOR_VERIFIED_UNTIL_KEY);
}
