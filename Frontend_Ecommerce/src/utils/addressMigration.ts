import { User, SavedAddressItem } from '../types';
import { api } from '../services/api';
import {
  getStableUserId,
  isDemoUser,
  getAccountAddresses,
  getAccountStorageKey,
} from './accountStorage';

/**
 * Safely migrates legacy addresses from localStorage to the backend MongoDB store.
 * - Only migrates for authenticated non-demo customers.
 * - Avoids uploading sample demo addresses.
 * - Backend sync deduplicates matching addresses.
 * - Clears local cache strictly upon confirmed backend sync.
 */
export async function migrateLegacyAddresses(user?: User | null): Promise<SavedAddressItem[] | null> {
  if (!user || isDemoUser(user)) {
    return null;
  }

  const userId = getStableUserId(user);
  if (!userId) {
    return null;
  }

  const localAddresses = getAccountAddresses(userId);
  if (!localAddresses || localAddresses.length === 0) {
    return null;
  }

  // Filter out hardcoded sample demo addresses
  const validToMigrate = localAddresses.filter(
    (addr) => addr.id !== 'addr_01' && addr.id !== 'addr_02' && !addr.id.includes('demo')
  );

  if (validToMigrate.length === 0) {
    // Only dummy addresses existed locally; clear key safely
    try {
      localStorage.removeItem(getAccountStorageKey('saved_addresses', userId));
    } catch {}
    return null;
  }

  try {
    const res = await api.addresses.sync(validToMigrate);
    // Success: safe to clear legacy localStorage
    try {
      localStorage.removeItem(getAccountStorageKey('saved_addresses', userId));
    } catch {}
    return res.addresses;
  } catch (error) {
    console.error('Legacy address migration failed (will retry on next load):', error);
    return null;
  }
}
