import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Set up lightweight WebStorage mock for Node.js test environment
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

// Polyfill globals for storage utilities if not present in Node
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new MockStorage();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = new MockStorage();
}

import {
  getStableUserId,
  isDemoUser,
  getAccountStorageKey,
  getAccountProfile,
  setAccountProfile,
  getAccountAddresses,
  setAccountAddresses,
  getAccountWishlist,
  setAccountWishlist,
  getOrderOwnerId,
  getAccountLastOrder,
  setAccountLastOrder,
  clearAccountOrders,
} from '../src/utils/accountStorage';

describe('OMIZON Account Isolation & Privacy Test Suite', () => {
  const userA_Id = '6543210000000000000000aa';
  const userB_Id = '6543210000000000000000bb';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('Stable user identifier extraction', () => {
    assert.equal(getStableUserId({ _id: userA_Id, username: 'user_a', email: 'a@omizon.in', role: 'buyer' }), userA_Id);
    assert.equal(getStableUserId({ id: userB_Id, username: 'user_b', email: 'b@omizon.in', role: 'buyer' } as any), userB_Id);
    assert.equal(getStableUserId(null), null);
    assert.equal(getStableUserId(undefined), null);
    assert.equal(getStableUserId({} as any), null);
  });

  test('Demo user detection distinguishes demo environment from real customers', () => {
    assert.equal(isDemoUser({ _id: 'buyer_demo_01', username: 'priya_sharma', email: 'priya@omizon.in', role: 'buyer' }), true);
    assert.equal(isDemoUser({ _id: userA_Id, username: 'real_customer', email: 'cust@omizon.in', role: 'buyer' }), false);
    assert.equal(isDemoUser(null), false);
  });

  test('User A and User B profile isolation', () => {
    const profileA = {
      firstName: 'Aarav',
      lastName: 'Patel',
      displayName: 'Aarav P.',
      email: 'aarav@domain.in',
      phone: '+91 98200 11111',
    };
    const profileB = {
      firstName: 'Bhavna',
      lastName: 'Mehta',
      displayName: 'Bhavna M.',
      email: 'bhavna@domain.in',
      phone: '+91 98200 22222',
    };

    setAccountProfile(userA_Id, profileA);
    setAccountProfile(userB_Id, profileB);

    const retrievedA = getAccountProfile(userA_Id);
    const retrievedB = getAccountProfile(userB_Id);

    assert.equal(retrievedA.firstName, 'Aarav');
    assert.equal(retrievedA.email, 'aarav@domain.in');
    assert.equal(retrievedB.firstName, 'Bhavna');
    assert.equal(retrievedB.email, 'bhavna@domain.in');

    // Ensure User A never sees User B's profile
    assert.notEqual(retrievedA.email, retrievedB.email);
  });

  test('User A and User B address isolation', () => {
    const addressesA = [
      {
        id: 'addr_a1',
        fullName: 'Aarav Patel',
        phone: '+91 98200 11111',
        addressLine: 'Flat 101, Palm Court, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
        country: 'India',
        tag: 'HOME' as const,
        isDefault: true,
      },
    ];

    const addressesB = [
      {
        id: 'addr_b1',
        fullName: 'Bhavna Mehta',
        phone: '+91 98200 22222',
        addressLine: 'Villa 12, Whitefield Boulevard',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560066',
        country: 'India',
        tag: 'WORK' as const,
        isDefault: true,
      },
    ];

    setAccountAddresses(userA_Id, addressesA);
    setAccountAddresses(userB_Id, addressesB);

    const retrievedA = getAccountAddresses(userA_Id);
    const retrievedB = getAccountAddresses(userB_Id);

    assert.equal(retrievedA?.length, 1);
    assert.equal(retrievedA?.[0].city, 'Mumbai');
    assert.equal(retrievedB?.length, 1);
    assert.equal(retrievedB?.[0].city, 'Bengaluru');

    // Ensure a third new user gets null (empty state) and never sees User A or User B
    const uninitializedUser = getAccountAddresses('6543210000000000000000cc');
    assert.equal(uninitializedUser, null);
  });

  test('User A and User B wishlist isolation', () => {
    const wishlistA = [{ id: 'prod_electronics_01', name: 'Studio Headphones', price: 24999 }];
    const wishlistB = [{ id: 'prod_home_02', name: 'Desk Lamp', price: 8499 }];

    setAccountWishlist(userA_Id, wishlistA);
    setAccountWishlist(userB_Id, wishlistB);

    const retrievedA = getAccountWishlist(userA_Id);
    const retrievedB = getAccountWishlist(userB_Id);

    assert.equal(retrievedA?.length, 1);
    assert.equal(retrievedA?.[0].id, 'prod_electronics_01');
    assert.equal(retrievedB?.length, 1);
    assert.equal(retrievedB?.[0].id, 'prod_home_02');

    // Verify uninitialized customer starts empty
    assert.equal(getAccountWishlist('6543210000000000000000cc'), null);
  });

  test('Account switching refreshes displayed data per user scope', () => {
    setAccountProfile(userA_Id, { firstName: 'UserA' });
    setAccountProfile(userB_Id, { firstName: 'UserB' });

    let activeUserId = userA_Id;
    assert.equal(getAccountProfile(activeUserId)?.firstName, 'UserA');

    // Simulate account switch
    activeUserId = userB_Id;
    assert.equal(getAccountProfile(activeUserId)?.firstName, 'UserB');
  });

  test('Logout and subsequent login cannot expose another user cached order', () => {
    const orderA = {
      _id: 'ord_user_a_999',
      user: { _id: userA_Id, username: 'user_a' },
      totalAmount: 49999,
      deliveryStatus: 'delivered',
    };

    // User A places order
    setAccountLastOrder(userA_Id, orderA);
    assert.ok(getAccountLastOrder(userA_Id));
    assert.equal(getAccountLastOrder(userA_Id)?._id, 'ord_user_a_999');

    // User A logs out
    clearAccountOrders();

    // User B logs in immediately on same browser
    const orderForB = getAccountLastOrder(userB_Id);
    assert.equal(orderForB, null, 'User B must not see User A cached order after logout');
  });

  test('Missing or invalid ownership information fails closed', () => {
    // 1. Order with completely missing user / customer
    const anonymousOrder = {
      _id: 'ord_anon_01',
      totalAmount: 12000,
    };
    sessionStorage.setItem('omizon_last_order', JSON.stringify(anonymousOrder));
    assert.equal(getAccountLastOrder(userA_Id), null, 'Must reject order without owner ID');

    // 2. Order owned by User A queried by User B fails closed even if in generic session storage
    const orderA = {
      _id: 'ord_owner_a',
      user: userA_Id,
      totalAmount: 5000,
    };
    sessionStorage.setItem('omizon_last_order', JSON.stringify(orderA));
    assert.equal(getAccountLastOrder(userB_Id), null, 'Must reject order owned by another customer');

    // 3. Query with null / missing userId returns null
    assert.equal(getAccountLastOrder(null), null);
    assert.equal(getAccountLastOrder(''), null);
  });

  test('Order owner extraction handles diverse backend contracts', () => {
    assert.equal(getOrderOwnerId({ user: { _id: 'u1' } }), 'u1');
    assert.equal(getOrderOwnerId({ user: 'u2' }), 'u2');
    assert.equal(getOrderOwnerId({ customer: { _id: 'u3' } }), 'u3');
    assert.equal(getOrderOwnerId({ customer: 'u4' }), 'u4');
    assert.equal(getOrderOwnerId({ userId: 'u5' }), 'u5');
    assert.equal(getOrderOwnerId({ customerId: 'u6' }), 'u6');
    assert.equal(getOrderOwnerId({}), null);
    assert.equal(getOrderOwnerId(null), null);
  });

  test('PAN is strictly excluded from persistent profile serialization', () => {
    const profileWithSensitiveData = {
      firstName: 'Secure',
      lastName: 'Customer',
      email: 'secure@omizon.in',
      panNumber: 'ABCDE1234F',
      pan: 'ABCDE1234F',
      pan_number: 'ABCDE1234F',
      aadhaar: '999988887777',
      taxId: 'TAX12345',
      taxIdentifier: 'ID999',
    };

    setAccountProfile(userA_Id, profileWithSensitiveData);

    const rawStorageValue = localStorage.getItem(getAccountStorageKey('user_profile', userA_Id));
    assert.ok(rawStorageValue, 'Profile must be serialized in localStorage');

    // Parse raw stored string to guarantee omission
    const storedObject = JSON.parse(rawStorageValue!);
    assert.equal(storedObject.firstName, 'Secure');
    assert.equal(storedObject.email, 'secure@omizon.in');

    assert.equal(storedObject.panNumber, undefined, 'panNumber must NOT exist in persistent storage');
    assert.equal(storedObject.pan, undefined, 'pan must NOT exist in persistent storage');
    assert.equal(storedObject.pan_number, undefined, 'pan_number must NOT exist in persistent storage');
    assert.equal(storedObject.aadhaar, undefined, 'aadhaar must NOT exist in persistent storage');
    assert.equal(storedObject.taxId, undefined, 'taxId must NOT exist in persistent storage');
    assert.equal(storedObject.taxIdentifier, undefined, 'taxIdentifier must NOT exist in persistent storage');

    // String search on raw JSON string to be 100% sure
    assert.ok(!rawStorageValue!.includes('ABCDE1234F'), 'Sensitive PAN string must not appear in raw storage');
    assert.ok(!rawStorageValue!.includes('999988887777'), 'Sensitive Aadhaar string must not appear in raw storage');
  });
});
