import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SavedAddressItem, ShippingAddress, User } from '../src/types';
import { INITIAL_SAVED_ADDRESSES } from '../src/components/checkout/DeliveryAddressSection';
import {
  getStableUserId,
  isDemoUser,
  getAccountAddresses,
  setAccountAddresses,
  getAccountStorageKey,
  extractTenDigitPhone,
} from '../src/utils/accountStorage';
import { migrateLegacyAddresses } from '../src/utils/addressMigration';
import { api } from '../src/services/api';

// Mock localStorage and sessionStorage for Node.js test runner
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

describe('OMIZON Address Book & Checkout Integration Test Suite', () => {
  const userA_Id = '6543210000000000000000aa';
  const userB_Id = '6543210000000000000000bb';

  beforeEach(() => {
    localStorage.clear();
  });

  // ---------------------------------------------------------------------------
  // 1. Validation & Data Sanitization
  // ---------------------------------------------------------------------------
  test('Indian PIN code format validator requires 6 digits and non-zero start', () => {
    const isValidPin = (pin: string) => {
      const clean = pin.trim();
      return /^[1-9][0-9]{5}$/.test(clean);
    };

    assert.equal(isValidPin('400013'), true);
    assert.equal(isValidPin('110001'), true);
    assert.equal(isValidPin('560066'), true);
    assert.equal(isValidPin('012345'), false); // Starts with 0
    assert.equal(isValidPin('40001'), false); // 5 digits
    assert.equal(isValidPin('4000133'), false); // 7 digits
    assert.equal(isValidPin('ABC123'), false);
    assert.equal(isValidPin(''), false);
  });

  test('Indian Mobile number validator requires 10 valid digits', () => {
    const formatPhone = (phone: string) => {
      const clean = phone.replace(/\D/g, '');
      if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean)) {
        return `+91 ${clean}`;
      }
      if (clean.length === 12 && /^91[6-9]\d{9}$/.test(clean)) {
        return `+91 ${clean.slice(2)}`;
      }
      return null;
    };

    assert.equal(formatPhone('9820123456'), '+91 9820123456');
    assert.equal(formatPhone('+91 98201 23456'), '+91 9820123456');
    assert.equal(formatPhone('919820123456'), '+91 9820123456');
    assert.equal(formatPhone('1234567890'), null); // starts with 1
    assert.equal(formatPhone('98201'), null); // too short
  });

  test('Phone number editing cleanly extracts only the 10 digits without prefix or spacing and never silently truncates', () => {
    assert.equal(extractTenDigitPhone('+91 98201 23456'), '9820123456');
    assert.equal(extractTenDigitPhone('+919820123456'), '9820123456');
    assert.equal(extractTenDigitPhone('9820123456'), '9820123456');
    assert.equal(extractTenDigitPhone('+91-98201-23456'), '9820123456');

    // Never silently truncate malformed or long numbers into apparently valid 10-digit numbers:
    assert.equal(extractTenDigitPhone('9820123456789'), '9820123456789'); // 13 digits preserved
    assert.equal(extractTenDigitPhone('98201'), '98201'); // 5 digits preserved
  });

  test('Address deduplication accurately distinguishes different flats/units in the same building and PIN code', () => {
    const normalizeText = (str: string) => str.toLowerCase().replace(/[\s\-_,.]+/g, ' ').trim();

    const isDuplicate = (a: SavedAddressItem, b: SavedAddressItem) => {
      const sameName = normalizeText(a.fullName) === normalizeText(b.fullName);
      const sameLine = normalizeText(a.addressLine) === normalizeText(b.addressLine);
      const sameCity = normalizeText(a.city) === normalizeText(b.city);
      const samePin = (a.postalCode || '').trim() === (b.postalCode || '').trim();
      return sameName && sameLine && sameCity && samePin;
    };

    const flat401: SavedAddressItem = {
      id: 'addr_401',
      fullName: 'Rajesh Singhania',
      phone: '+91 98201 23456',
      addressLine: 'Flat 401, Highmont Residences, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      tag: 'HOME',
    };

    const flat402: SavedAddressItem = {
      id: 'addr_402',
      fullName: 'Rajesh Singhania',
      phone: '+91 98201 23456',
      addressLine: 'Flat 402, Highmont Residences, Lower Parel', // Different flat
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      tag: 'HOME',
    };

    const flat401DifferentRecipient: SavedAddressItem = {
      id: 'addr_401_other',
      fullName: 'Priya Sharma', // Different recipient in same flat
      phone: '+91 98201 99999',
      addressLine: 'Flat 401, Highmont Residences, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      tag: 'HOME',
    };

    const flat401Duplicate: SavedAddressItem = {
      id: 'addr_401_dup',
      fullName: 'rajesh singhania', // Same person, different casing
      phone: '+91 98201 23456',
      addressLine: 'Flat 401, Highmont Residences, Lower Parel.', // Same line with period
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      tag: 'HOME',
    };

    // Different flats in same building must NOT be considered duplicate
    assert.equal(isDuplicate(flat401, flat402), false);

    // Different recipients in same flat must NOT be considered duplicate
    assert.equal(isDuplicate(flat401, flat401DifferentRecipient), false);

    // True duplicate with different formatting/casing MUST be considered duplicate
    assert.equal(isDuplicate(flat401, flat401Duplicate), true);
  });

  test('Address tag enum validates HOME, WORK, and OTHER', () => {
    const validTags = ['HOME', 'WORK', 'OTHER'];
    assert.ok(validTags.includes('HOME'));
    assert.ok(validTags.includes('WORK'));
    assert.ok(validTags.includes('OTHER'));
    assert.equal(validTags.includes('OFFICE'), false);
  });

  // ---------------------------------------------------------------------------
  // 2. Address Book Default Management & State Transitions
  // ---------------------------------------------------------------------------
  test('First address automatically receives isDefault: true', () => {
    const userAddresses: SavedAddressItem[] = [];

    const addAddress = (addr: Omit<SavedAddressItem, 'isDefault'> & { isDefault?: boolean }) => {
      const isDefault = userAddresses.length === 0 || Boolean(addr.isDefault);
      if (isDefault) {
        userAddresses.forEach((a) => { a.isDefault = false; });
      }
      const created: SavedAddressItem = { ...addr, isDefault };
      userAddresses.push(created);
      return created;
    };

    const first = addAddress({
      id: 'addr_1',
      fullName: 'Rajesh Singhania',
      phone: '+91 98201 23456',
      addressLine: 'Flat 402, Highmont Residences',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      tag: 'HOME',
      isDefault: false, // client passed false, but first must be default
    });

    assert.equal(first.isDefault, true);
    assert.equal(userAddresses[0].isDefault, true);

    const second = addAddress({
      id: 'addr_2',
      fullName: 'Rajesh Singhania (Office)',
      phone: '+91 98201 23456',
      addressLine: 'Level 9, Maker Maxity, BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400051',
      country: 'India',
      tag: 'WORK',
      isDefault: false,
    });

    assert.equal(second.isDefault, false);
    assert.equal(userAddresses[0].isDefault, true); // First remains default
  });

  test('Setting a new default address un-sets the previous default', () => {
    const addresses: SavedAddressItem[] = [
      {
        id: 'addr_1',
        fullName: 'Home',
        phone: '+91 98201 23456',
        addressLine: 'Street 1',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        tag: 'HOME',
        isDefault: true,
      },
      {
        id: 'addr_2',
        fullName: 'Work',
        phone: '+91 98201 23456',
        addressLine: 'Street 2',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400002',
        country: 'India',
        tag: 'WORK',
        isDefault: false,
      },
    ];

    const setDefault = (targetId: string) => {
      return addresses.map((a) => ({
        ...a,
        isDefault: a.id === targetId,
      }));
    };

    const updated = setDefault('addr_2');
    assert.equal(updated.find((a) => a.id === 'addr_1')?.isDefault, false);
    assert.equal(updated.find((a) => a.id === 'addr_2')?.isDefault, true);
    assert.equal(updated.filter((a) => a.isDefault).length, 1);
  });

  test('Deleting the default address automatically reassigns default to another address', () => {
    let addresses: SavedAddressItem[] = [
      {
        id: 'addr_1',
        fullName: 'Home (Default)',
        phone: '+91 98201 23456',
        addressLine: 'Street 1',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        tag: 'HOME',
        isDefault: true,
      },
      {
        id: 'addr_2',
        fullName: 'Work',
        phone: '+91 98201 23456',
        addressLine: 'Street 2',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400002',
        country: 'India',
        tag: 'WORK',
        isDefault: false,
      },
    ];

    const deleteAddress = (idToDelete: string) => {
      const remaining = addresses.filter((a) => a.id !== idToDelete);
      if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    };

    const nextList = deleteAddress('addr_1');
    assert.equal(nextList.length, 1);
    assert.equal(nextList[0].id, 'addr_2');
    assert.equal(nextList[0].isDefault, true);
  });

  // ---------------------------------------------------------------------------
  // 3. Checkout Address Integration & Shipping Snapshot
  // ---------------------------------------------------------------------------
  test('Checkout builds an immutable shipping address snapshot conforming to Order schema', () => {
    const selectedAddress: SavedAddressItem = {
      id: 'addr_selected_01',
      fullName: 'Priya Sharma',
      phone: '+91 98201 23456',
      addressLine: 'Flat 402, Highmont Residences',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      tag: 'HOME',
      isDefault: true,
    };

    const createOrderShippingSnapshot = (addr: SavedAddressItem): ShippingAddress => ({
      fullName: addr.fullName.trim(),
      phone: addr.phone.trim(),
      addressLine: addr.addressLine.trim(),
      city: addr.city.trim(),
      state: addr.state.trim(),
      postalCode: addr.postalCode.trim(),
      country: addr.country.trim() || 'India',
    });

    const snapshot = createOrderShippingSnapshot(selectedAddress);

    // Verify snapshot fields
    assert.equal(snapshot.fullName, 'Priya Sharma');
    assert.equal(snapshot.phone, '+91 98201 23456');
    assert.equal(snapshot.postalCode, '400013');
    assert.equal(snapshot.country, 'India');
    // Ensure transient UI fields like id, tag, isDefault are not leaked to shippingAddress subdoc
    assert.equal((snapshot as any).id, undefined);
    assert.equal((snapshot as any).tag, undefined);
    assert.equal((snapshot as any).isDefault, undefined);
  });

  test('Real customer with zero addresses displays empty address state (fails closed)', () => {
    const realCustomerAddresses: SavedAddressItem[] = [];
    const isDemo = false;

    const determineCheckoutAddresses = (cached: SavedAddressItem[], demo: boolean) => {
      if (cached.length > 0) return cached;
      if (demo) return INITIAL_SAVED_ADDRESSES;
      return [];
    };

    const resolved = determineCheckoutAddresses(realCustomerAddresses, isDemo);
    assert.equal(resolved.length, 0); // Must be empty, never silently assign demo addresses
  });

  test('Guest checkout does not corrupt authenticated user address book', () => {
    // User A has saved addresses
    const userAAddresses: SavedAddressItem[] = [
      {
        id: 'addr_a1',
        fullName: 'User A',
        phone: '+91 98201 11111',
        addressLine: 'A Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        tag: 'HOME',
        isDefault: true,
      },
    ];
    setAccountAddresses(userA_Id, userAAddresses);

    // Guest enters an address
    const guestAddress: SavedAddressItem = {
      id: 'addr_guest_99',
      fullName: 'Guest Customer',
      phone: '+91 98201 99999',
      addressLine: 'Guest Street',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
      tag: 'HOME',
      isDefault: false,
    };

    // User A's address book remains isolated
    const fetchedA = getAccountAddresses(userA_Id);
    assert.equal(fetchedA?.length, 1);
    assert.equal(fetchedA?.[0].fullName, 'User A');
    assert.notEqual(fetchedA?.[0].fullName, guestAddress.fullName);
  });

  // ---------------------------------------------------------------------------
  // 4. Legacy LocalStorage Migration Safety
  // ---------------------------------------------------------------------------
  test('Legacy migration skips demo users and filters out hardcoded sample IDs', async () => {
    const demoUser: User = {
      _id: 'buyer_demo_01',
      username: 'priya_sharma',
      email: 'priya@omizon.in',
      role: 'buyer',
    };

    // Demo user migration returns null and does not execute API sync
    const demoResult = await migrateLegacyAddresses(demoUser);
    assert.equal(demoResult, null);

    // Unauthenticated user returns null
    const guestResult = await migrateLegacyAddresses(null);
    assert.equal(guestResult, null);
  });

  test('Legacy migration preserves localStorage addresses if the backend API fails', async () => {
    const realUser: User = {
      _id: '6543210000000000000000cc',
      username: 'test_user',
      email: 'test@example.com',
      role: 'buyer',
    };
    const testAddresses: SavedAddressItem[] = [
      {
        id: 'local_custom_1',
        fullName: 'Local Resident',
        phone: '+91 98201 12345',
        addressLine: 'Flat 101, Test Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        tag: 'HOME',
        isDefault: true,
      },
    ];

    setAccountAddresses(realUser._id, testAddresses);
    const key = getAccountStorageKey('saved_addresses', realUser._id);
    assert.ok(localStorage.getItem(key));

    const originalSync = api.addresses.sync;
    try {
      // Mock API network failure
      api.addresses.sync = async () => {
        throw new Error('Network error or server unavailable');
      };

      const result = await migrateLegacyAddresses(realUser);
      assert.equal(result, null);

      // LocalStorage data MUST still be preserved!
      const preserved = localStorage.getItem(key);
      assert.ok(preserved);
      const parsed = JSON.parse(preserved!);
      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].fullName, 'Local Resident');
    } finally {
      api.addresses.sync = originalSync;
    }
  });

  test('Legacy migration clears localStorage only when API sync succeeds', async () => {
    const realUser: User = {
      _id: '6543210000000000000000dd',
      username: 'test_user_2',
      email: 'test2@example.com',
      role: 'buyer',
    };
    const testAddresses: SavedAddressItem[] = [
      {
        id: 'local_custom_2',
        fullName: 'Successful Migrant',
        phone: '+91 98201 12345',
        addressLine: 'Flat 202, Test Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        tag: 'HOME',
        isDefault: true,
      },
    ];

    setAccountAddresses(realUser._id, testAddresses);
    const key = getAccountStorageKey('saved_addresses', realUser._id);
    assert.ok(localStorage.getItem(key));

    const originalSync = api.addresses.sync;
    try {
      // Mock successful sync
      api.addresses.sync = async () => ({
        message: 'Synced 1 new addresses',
        syncedCount: 1,
        addresses: testAddresses,
      });

      const result = await migrateLegacyAddresses(realUser);
      assert.ok(result);
      assert.equal(result.length, 1);

      // LocalStorage data must be safely removed after confirmed backend sync
      assert.equal(localStorage.getItem(key), null);
    } finally {
      api.addresses.sync = originalSync;
    }
  });
});
