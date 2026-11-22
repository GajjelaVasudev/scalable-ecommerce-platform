import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../src/types';
import { migrateLegacyProfile } from '../src/utils/profileMigration';
import { api } from '../src/services/api';

// In-memory mock for localStorage
const memoryStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, val: string) => { memoryStorage[key] = String(val); },
    removeItem: (key: string) => { delete memoryStorage[key]; },
    clear: () => {
      Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
    },
  };
}

describe('OMIZON Customer Profile — Frontend Unit & Integration Tests', () => {
  const userId = '654321000000000000000099';
  const legacyStorageKey = `omizon_user_profile_${userId}`;

  beforeEach(() => {
    localStorage.clear();
  });

  // ---------------------------------------------------------------------------
  // 1. User Interface & Schema Conformance
  // ---------------------------------------------------------------------------
  describe('User Interface Conformance', () => {
    test('User type supports full profile fields', () => {
      const user: User = {
        _id: userId,
        id: userId,
        username: 'anita_desai',
        email: 'anita@example.in',
        role: 'buyer',
        firstName: 'Anita',
        lastName: 'Desai',
        displayName: 'Anita D.',
        phone: '+91 9820011223',
        altPhone: '+91 9820044556',
        avatarUrl: '/uploads/avatars/avatar-654321000000000000000099-12345.png',
        gender: 'female',
        dateOfBirth: '1990-08-15',
        commLang: 'en',
      };

      assert.equal(user.firstName, 'Anita');
      assert.equal(user.lastName, 'Desai');
      assert.equal(user.displayName, 'Anita D.');
      assert.equal(user.phone, '+91 9820011223');
      assert.equal(user.gender, 'female');
      assert.equal(user.commLang, 'en');
      assert.equal(user.dateOfBirth, '1990-08-15');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Legacy Profile Migration Tests
  // ---------------------------------------------------------------------------
  describe('Legacy Profile Migration (migrateLegacyProfile)', () => {
    const mockUser: User = {
      _id: userId,
      id: userId,
      username: 'testuser',
      email: 'test@omizon.in',
      role: 'buyer'
    };

    test('returns null when no legacy localStorage profile exists', async () => {
      const result = await migrateLegacyProfile(mockUser, { ...mockUser, firstName: '' });
      assert.equal(result, null);
    });

    test('migrates valid profile fields from localStorage to backend', async () => {
      const legacyData = {
        firstName: 'Vikram',
        lastName: 'Patel',
        displayName: 'Vikram P.',
        gender: 'male',
        phone: '9820012345',
        altPhone: '9820098765',
        commLang: 'hi',
        dobDay: '12',
        dobMonth: '04',
        dobYear: '1988'
      };
      localStorage.setItem(legacyStorageKey, JSON.stringify(legacyData));

      let apiCalledWithPayload: any = null;
      const originalUpdateProfile = api.auth.updateProfile;
      api.auth.updateProfile = async (payload: any) => {
        apiCalledWithPayload = payload;
        return {
          message: 'Profile updated',
          user: {
            _id: userId,
            username: 'vikram',
            email: 'vikram@example.com',
            role: 'buyer',
            ...payload
          }
        };
      };

      try {
        const migratedUser = await migrateLegacyProfile(mockUser, { ...mockUser, firstName: '' });
        assert.ok(migratedUser);
        assert.equal(apiCalledWithPayload.firstName, 'Vikram');
        assert.equal(apiCalledWithPayload.lastName, 'Patel');
        assert.equal(apiCalledWithPayload.displayName, 'Vikram P.');
        assert.equal(apiCalledWithPayload.phone, '9820012345');
        assert.equal(apiCalledWithPayload.gender, 'male');
        assert.equal(apiCalledWithPayload.commLang, 'hi');
        assert.equal(apiCalledWithPayload.dobDay, '12');

        // Confirms legacy storage is cleanly removed after success
        assert.equal(localStorage.getItem(legacyStorageKey), null);
      } finally {
        api.auth.updateProfile = originalUpdateProfile;
      }
    });

    test('strictly strips sensitive PAN and Aadhaar from legacy migration payload', async () => {
      const legacyDataWithSensitive = {
        firstName: 'Rohan',
        lastName: 'Sharma',
        panNumber: 'ABCDE1234F',      // SENSITIVE TAX IDENTIFIER
        aadhaarNumber: '123456789012', // SENSITIVE GOVERNMENT ID
        taxId: 'TAX123456',
        ssn: '000-00-0000',
        phone: '9820123456'
      };
      localStorage.setItem(legacyStorageKey, JSON.stringify(legacyDataWithSensitive));

      let sentPayload: any = null;
      const originalUpdateProfile = api.auth.updateProfile;
      api.auth.updateProfile = async (payload: any) => {
        sentPayload = payload;
        return { message: 'Updated', user: { _id: userId, ...payload } };
      };

      try {
        await migrateLegacyProfile(mockUser, { ...mockUser, firstName: '' });
        assert.ok(sentPayload);
        assert.equal(sentPayload.panNumber, undefined);
        assert.equal(sentPayload.aadhaarNumber, undefined);
        assert.equal(sentPayload.taxId, undefined);
        assert.equal(sentPayload.ssn, undefined);
      } finally {
        api.auth.updateProfile = originalUpdateProfile;
      }
    });

    test('ignores legacy base64 photoUrl during migration to prevent corrupt payload', async () => {
      const legacyDataWithBase64Photo = {
        firstName: 'Karan',
        photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        phone: '9820123456'
      };
      localStorage.setItem(legacyStorageKey, JSON.stringify(legacyDataWithBase64Photo));

      let sentPayload: any = null;
      const originalUpdateProfile = api.auth.updateProfile;
      api.auth.updateProfile = async (payload: any) => {
        sentPayload = payload;
        return { message: 'Updated', user: { _id: userId, ...payload } };
      };

      try {
        await migrateLegacyProfile(mockUser, { ...mockUser, firstName: '' });
        assert.ok(sentPayload);
        // Base64 photo should not be migrated into user profile PUT payload
        assert.equal(sentPayload.avatarUrl, undefined);
        assert.equal(sentPayload.photoUrl, undefined);
      } finally {
        api.auth.updateProfile = originalUpdateProfile;
      }
    });

    test('does NOT overwrite existing server profile data if server already has values', async () => {
      const legacyData = {
        firstName: 'OldLegacyName',
        phone: '9820000000'
      };
      localStorage.setItem(legacyStorageKey, JSON.stringify(legacyData));

      let apiCalled = false;
      const originalUpdateProfile = api.auth.updateProfile;
      api.auth.updateProfile = async () => {
        apiCalled = true;
        return { message: 'Updated', user: {} as any };
      };

      try {
        // Current user on server already has firstName and phone
        const serverUser: User = {
          ...mockUser,
          firstName: 'ExistingServerName',
          phone: '+91 9820123456'
        };

        const result = await migrateLegacyProfile(serverUser, serverUser);
        assert.equal(apiCalled, false);
        assert.equal(result, null);
        // Legacy storage removed since server already had source of truth
        assert.equal(localStorage.getItem(legacyStorageKey), null);
      } finally {
        api.auth.updateProfile = originalUpdateProfile;
      }
    });

    test('preserves localStorage data if server update API fails (safe fallback)', async () => {
      const legacyData = {
        firstName: 'SafeFallbackUser',
        phone: '9820123456'
      };
      localStorage.setItem(legacyStorageKey, JSON.stringify(legacyData));

      const originalUpdateProfile = api.auth.updateProfile;
      api.auth.updateProfile = async () => {
        throw new Error('Network failure or 500 error');
      };

      try {
        const result = await migrateLegacyProfile(mockUser, { ...mockUser, firstName: '' });
        assert.equal(result, null);
        // Crucial: localStorage data must NOT be lost on server failure!
        const retainedData = localStorage.getItem(legacyStorageKey);
        assert.ok(retainedData);
        assert.match(retainedData, /SafeFallbackUser/);
      } finally {
        api.auth.updateProfile = originalUpdateProfile;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Phone & PAN Validation Rules
  // ---------------------------------------------------------------------------
  describe('Phone & PAN Validation Rules', () => {
    test('Indian Mobile validator accepts 10-digit numbers starting with 6-9', () => {
      const validatePhone = (p: string) => {
        const digits = p.replace(/\D/g, '');
        return (
          (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) ||
          (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits))
        );
      };

      assert.equal(validatePhone('9820123456'), true);
      assert.equal(validatePhone('+91 98201 23456'), true);
      assert.equal(validatePhone('919820123456'), true);
      assert.equal(validatePhone('6123456789'), true);
      assert.equal(validatePhone('1234567890'), false); // Starts with 1
      assert.equal(validatePhone('5555555555'), false); // Starts with 5
      assert.equal(validatePhone('982012345'), false);  // 9 digits
    });

    test('PAN format validator strictly matches 5 uppercase letters, 4 digits, 1 uppercase letter', () => {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

      assert.equal(panRegex.test('ABCDE1234F'), true);
      assert.equal(panRegex.test('BNZPK8923L'), true);
      assert.equal(panRegex.test('abcde1234f'), false); // Lowercase
      assert.equal(panRegex.test('ABCD12345F'), false); // 4 letters, 5 digits
      assert.equal(panRegex.test('ABCDE12345'), false); // Ends with digit
      assert.equal(panRegex.test('12345ABCDE'), false); // Starts with digits
    });
  });
});
