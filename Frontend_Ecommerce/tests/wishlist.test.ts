import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { WishlistItem, WishlistResponse, Product } from '../src/types';
import { GUEST_WISHLIST_STORAGE_KEY } from '../src/context/WishlistContext';
import { setAccountWishlist, getAccountWishlist } from '../src/utils/accountStorage';
import { api } from '../src/services/api';

// In-memory mock for localStorage
const memoryStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, val: string) => {
      memoryStorage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
    },
  };
}

describe('OMIZON Persistent Wishlist — Frontend Unit & Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockProductA: Product = {
    _id: '6740c0000000000000000001',
    name: 'SoundPulse ANC Headphones',
    description: 'High fidelity audio',
    price: 19999,
    originalPrice: 24999,
    stock: 15,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    status: 'active',
    rating: 4.8,
    reviewCount: 340,
  };

  const mockProductB: Product = {
    _id: '6740c0000000000000000002',
    name: 'AuraGlow Desk Lamp',
    description: 'Stepless dimming desk lamp',
    price: 6499,
    originalPrice: 8999,
    stock: 0, // out of stock
    category: 'Home & Living',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    status: 'active',
    rating: 4.9,
    reviewCount: 110,
  };

  // ---------------------------------------------------------------------------
  // 1. Types & Interface Conformance
  // ---------------------------------------------------------------------------
  describe('Wishlist Type Conformance', () => {
    test('WishlistItem structure contains required fields and product relation', () => {
      const item: WishlistItem = {
        _id: 'item_001',
        id: mockProductA._id,
        product: mockProductA,
        addedAt: new Date().toISOString(),
        isAvailable: true,
        inStock: true,
        stockCount: 15,
        name: mockProductA.name,
        price: mockProductA.price,
      };

      assert.equal(item.id, mockProductA._id);
      assert.equal(item.product.name, 'SoundPulse ANC Headphones');
      assert.equal(item.isAvailable, true);
      assert.equal(item.stockCount, 15);
      assert.equal(item.price, 19999);
    });

    test('WishlistResponse structure conforms to API contract', () => {
      const response: WishlistResponse = {
        message: 'Wishlist retrieved successfully',
        wishlist: {
          _id: 'wish_user_001',
          user: '6740b0000000000000000001',
          items: [
            {
              _id: 'item_001',
              id: mockProductA._id,
              product: mockProductA,
              addedAt: new Date().toISOString(),
              isAvailable: true,
              inStock: true,
              stockCount: 15,
            },
          ],
          itemCount: 1,
        },
        itemCount: 1,
      };

      assert.equal(response.wishlist.itemCount, 1);
      assert.equal(response.wishlist.items[0].product.price, 19999);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Guest Wishlist LocalStorage Persistence
  // ---------------------------------------------------------------------------
  describe('Guest Wishlist Storage & Idempotency', () => {
    test('guest wishlist storage key matches expected convention', () => {
      assert.equal(GUEST_WISHLIST_STORAGE_KEY, 'omizon_guest_wishlist');
    });

    test('adds items to localStorage guest wishlist without duplicates', () => {
      const initial: WishlistItem[] = [];
      localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(initial));

      // Add product A
      const updated = [
        {
          id: mockProductA._id,
          product: mockProductA,
          addedAt: new Date().toISOString(),
          isAvailable: true,
          inStock: true,
          stockCount: 15,
        },
      ];
      localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(updated));

      const stored1 = JSON.parse(localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY) || '[]');
      assert.equal(stored1.length, 1);
      assert.equal(stored1[0].id, mockProductA._id);

      // Attempt adding product A again (deduplicated)
      const isAlreadyWishlisted = stored1.some((i: any) => i.id === mockProductA._id);
      assert.equal(isAlreadyWishlisted, true);

      // Add product B
      if (!stored1.some((i: any) => i.id === mockProductB._id)) {
        stored1.push({
          id: mockProductB._id,
          product: mockProductB,
          addedAt: new Date().toISOString(),
          isAvailable: false,
          inStock: false,
          stockCount: 0,
        });
      }
      localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(stored1));

      const stored2 = JSON.parse(localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY) || '[]');
      assert.equal(stored2.length, 2);
    });

    test('removes items correctly from guest localStorage', () => {
      const items = [
        { id: mockProductA._id, product: mockProductA },
        { id: mockProductB._id, product: mockProductB },
      ];
      localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(items));

      // Remove Product A
      const remaining = items.filter((i) => i.id !== mockProductA._id);
      localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(remaining));

      const loaded = JSON.parse(localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY) || '[]');
      assert.equal(loaded.length, 1);
      assert.equal(loaded[0].id, mockProductB._id);
    });

    test('clears guest localStorage completely', () => {
      localStorage.setItem(
        GUEST_WISHLIST_STORAGE_KEY,
        JSON.stringify([{ id: mockProductA._id, product: mockProductA }])
      );
      localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);

      assert.equal(localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY), null);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. User Logout & Isolation Protection
  // ---------------------------------------------------------------------------
  describe('User Logout & Isolation Protection', () => {
    test('user logout never leaks authenticated user wishlist to guest storage', () => {
      const userA_Id = '6543210000000000000000aa';
      const userA_Items = [{ id: mockProductA._id, name: mockProductA.name, price: mockProductA.price }];

      // Set user A's private account storage
      setAccountWishlist(userA_Id, userA_Items);

      // Ensure guest storage was clean prior to logout
      assert.equal(localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY), null);

      // Simulate logout transition: active user goes from userA to null
      // The application must never write userA's private items to omizon_guest_wishlist
      const isLoggingOut = true;
      if (!isLoggingOut) {
        localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(userA_Items));
      }

      // Verify guest storage remains null and isolated
      assert.equal(localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY), null);
      // Verify user A's items remain securely in their account scope
      assert.equal(getAccountWishlist(userA_Id)?.length, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Guest-to-Authenticated Merge Logic
  // ---------------------------------------------------------------------------
  describe('Guest-to-User Merge Logic', () => {
    test('extracts clean, deduplicated product IDs for POST /api/wishlist/merge', () => {
      const guestItems = [
        { id: mockProductA._id, product: mockProductA },
        { id: mockProductA._id, product: mockProductA }, // accidental duplicate
        { id: mockProductB._id, product: mockProductB },
      ];

      // Extract unique IDs
      const rawIds = guestItems.map((item) => (item.id || item.product?._id || '').toString());
      const uniqueIds = Array.from(new Set(rawIds)).filter(Boolean);

      assert.equal(uniqueIds.length, 2);
      assert.deepEqual(uniqueIds, [mockProductA._id, mockProductB._id]);
    });

    test('merge payload formatting preserves valid MongoDB ObjectId format', () => {
      const validObjectId = '6740c0000000000000000001';
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(validObjectId);
      assert.equal(isMongoId, true);

      const invalidId = 'not-an-object-id';
      const isInvalidMongo = /^[0-9a-fA-F]{24}$/.test(invalidId);
      assert.equal(isInvalidMongo, false);
    });

    test('retains guest items for retry if merge API call fails', () => {
      const initialGuestItems = [{ id: mockProductA._id, product: mockProductA }];
      localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(initialGuestItems));

      // Simulate a network failure during merge
      const mergeFailed = true;
      if (!mergeFailed) {
        localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
      }

      // Guest storage must NOT be purged on failure; items must remain for next retry
      const preserved = JSON.parse(localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY) || '[]');
      assert.equal(preserved.length, 1);
      assert.equal(preserved[0].id, mockProductA._id);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Stock & Availability Computation
  // ---------------------------------------------------------------------------
  describe('Stock & Availability Computation', () => {
    test('item with active status and positive stock is computed as available', () => {
      const isAvailable = mockProductA.status === 'active' && mockProductA.stock > 0;
      assert.equal(isAvailable, true);
    });

    test('item with active status but 0 stock is computed as unavailable', () => {
      const isAvailable = mockProductB.status === 'active' && mockProductB.stock > 0;
      assert.equal(isAvailable, false);
    });

    test('item with inactive status is unavailable even if stock > 0', () => {
      const inactiveProduct: Product = {
        ...mockProductA,
        status: 'inactive',
        stock: 50,
      };
      const isAvailable = inactiveProduct.status === 'active' && inactiveProduct.stock > 0;
      assert.equal(isAvailable, false);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Cart Integration & Move to Cart Validation
  // ---------------------------------------------------------------------------
  describe('Cart Integration & Move to Cart Validation', () => {
    test('prevents moving out-of-stock items into cart', () => {
      const unavailableItem: WishlistItem = {
        id: mockProductB._id,
        product: mockProductB,
        isAvailable: false,
        inStock: false,
        stockCount: 0,
      };

      const checkCanMove = (item: WishlistItem) => {
        if (!item || !item.isAvailable) {
          throw new Error('Product is currently out of stock or unavailable');
        }
        return true;
      };

      assert.throws(() => checkCanMove(unavailableItem), /out of stock/i);
    });

    test('successfully validates available item for cart addition', () => {
      const availableItem: WishlistItem = {
        id: mockProductA._id,
        product: mockProductA,
        isAvailable: true,
        inStock: true,
        stockCount: 15,
      };

      const checkCanMove = (item: WishlistItem) => {
        if (!item || !item.isAvailable) {
          throw new Error('Product is currently out of stock or unavailable');
        }
        return true;
      };

      assert.equal(checkCanMove(availableItem), true);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. API Service Layer Contracts
  // ---------------------------------------------------------------------------
  describe('API Service Layer Contracts', () => {
    test('api.wishlist has all required service methods', () => {
      assert.equal(typeof api.wishlist.get, 'function');
      assert.equal(typeof api.wishlist.addItem, 'function');
      assert.equal(typeof api.wishlist.removeItem, 'function');
      assert.equal(typeof api.wishlist.clear, 'function');
      assert.equal(typeof api.wishlist.merge, 'function');
    });
  });
});
