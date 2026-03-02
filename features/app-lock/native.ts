/**
 * App Lock — native bridge for iOS (FamilyControls/ManagedSettings) and Android (UsageStats/overlay).
 * This module requires custom native code. Until implemented, isAvailable returns false.
 */
export interface AppInfo {
  id: string; // bundle ID or package name
  name: string;
}

/** Check if app lock native APIs are available (Family Controls on iOS, UsageStats on Android) */
export async function isAppLockAvailable(): Promise<boolean> {
  // TODO: Implement native check
  // iOS: AuthorizationCenter.requestAuthorization
  // Android: PACKAGE_USAGE_STATS permission
  return false;
}

/** Request authorization (iOS: Family Controls, Android: Usage Access) */
export async function requestAppLockAuthorization(): Promise<boolean> {
  // TODO: Implement native
  return false;
}

/** Open system screen for user to select apps to block (iOS: FamilyActivityPicker, Android: app list) */
export async function openAppPicker(
  _selectedIds: string[],
  _mode: 'block' | 'allow'
): Promise<{ selected: AppInfo[] }> {
  // TODO: Implement native
  return { selected: [] };
}

/** Apply restrictions (iOS: ManagedSettingsStore, Android: start overlay service) */
export async function applyRestrictions(_config: {
  blockAppIds: string[];
  allowAppIds: string[];
  mode: 'full' | 'tiered';
}): Promise<void> {
  // TODO: Implement native
}

/** Remove all restrictions */
export async function clearRestrictions(): Promise<void> {
  // TODO: Implement native
}
