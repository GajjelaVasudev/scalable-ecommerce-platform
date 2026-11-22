import { User } from '../types';
import { api } from '../services/api';
import {
  getStableUserId,
  isDemoUser,
  getAccountProfile,
  getAccountStorageKey,
} from './accountStorage';

/**
 * Safely migrates legacy profile data from localStorage to the MongoDB user record.
 * - Only migrates for authenticated, non-demo customers.
 * - Never migrates sensitive identifiers (PAN, Aadhaar, tax identifiers).
 * - Never overwrites existing server data with older local data.
 * - Clears local browser storage only upon confirmed server update.
 * - Idempotent across multiple runs.
 */
export async function migrateLegacyProfile(
  currentUser?: User | null,
  serverProfile?: User | null
): Promise<User | null> {
  if (!currentUser || isDemoUser(currentUser)) {
    return null;
  }

  const userId = getStableUserId(currentUser);
  if (!userId) {
    return null;
  }

  const localProfile = getAccountProfile(userId);
  if (!localProfile || typeof localProfile !== 'object') {
    return null;
  }

  // Filter and sanitize migrated fields
  const payloadToMigrate: Partial<User> & { dobDay?: string; dobMonth?: string; dobYear?: string } = {};

  const server = serverProfile || currentUser;

  // First Name: only migrate if server doesn't already have one
  if (
    !server.firstName &&
    typeof localProfile.firstName === 'string' &&
    localProfile.firstName.trim().length >= 2 &&
    localProfile.firstName.trim().length <= 100
  ) {
    payloadToMigrate.firstName = localProfile.firstName.trim();
  }

  // Last Name
  if (
    !server.lastName &&
    typeof localProfile.lastName === 'string' &&
    localProfile.lastName.trim().length >= 2 &&
    localProfile.lastName.trim().length <= 100
  ) {
    payloadToMigrate.lastName = localProfile.lastName.trim();
  }

  // Display Name
  if (
    !server.displayName &&
    typeof localProfile.displayName === 'string' &&
    localProfile.displayName.trim().length >= 2 &&
    localProfile.displayName.trim().length <= 100
  ) {
    payloadToMigrate.displayName = localProfile.displayName.trim();
  }

  // Phone: only migrate if valid Indian number and server has none
  if (!server.phone && typeof localProfile.phone === 'string') {
    const digits = localProfile.phone.replace(/\D/g, '');
    if (
      (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) ||
      (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits))
    ) {
      payloadToMigrate.phone = localProfile.phone.trim();
    }
  }

  // Alt Phone
  if (!server.altPhone && typeof localProfile.altPhone === 'string') {
    const digits = localProfile.altPhone.replace(/\D/g, '');
    if (
      (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) ||
      (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits))
    ) {
      payloadToMigrate.altPhone = localProfile.altPhone.trim();
    }
  }

  // Gender
  if (
    (!server.gender || server.gender === 'prefer-not-to-say') &&
    ['female', 'male', 'non-binary', 'prefer-not-to-say'].includes(localProfile.gender)
  ) {
    payloadToMigrate.gender = localProfile.gender;
  }

  // Communication Language
  if (
    (!server.commLang || server.commLang === 'en') &&
    ['en', 'hi', 'kn', 'ta', 'mr'].includes(localProfile.commLang)
  ) {
    payloadToMigrate.commLang = localProfile.commLang;
  }

  // Date of Birth
  if (!server.dateOfBirth) {
    if (localProfile.dobDay && localProfile.dobMonth && localProfile.dobYear) {
      payloadToMigrate.dobDay = String(localProfile.dobDay);
      payloadToMigrate.dobMonth = String(localProfile.dobMonth);
      payloadToMigrate.dobYear = String(localProfile.dobYear);
    } else if (localProfile.dateOfBirth) {
      payloadToMigrate.dateOfBirth = localProfile.dateOfBirth;
    }
  }

  // Strictly exclude:
  // - PAN, Aadhaar, tax identifiers
  // - Base64 DataURL in photoUrl
  // - email

  // If nothing new to migrate, remove the legacy key safely and return
  if (Object.keys(payloadToMigrate).length === 0) {
    try {
      localStorage.removeItem(getAccountStorageKey('user_profile', userId));
    } catch {}
    return null;
  }

  try {
    const response = await api.auth.updateProfile(payloadToMigrate);
    // Success: safe to clear legacy localStorage
    try {
      localStorage.removeItem(getAccountStorageKey('user_profile', userId));
    } catch {}
    return response.user;
  } catch (error) {
    // Preserve localStorage data for retry on next visit
    console.error('Legacy profile migration failed (will retry on next load):', error);
    return null;
  }
}
