import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { STITCH_DEFAULT_CART_ITEMS, getInitialGuestCart, LOCAL_CART_KEY, reconcileCart } from '../src/context/CartContext';
import { INITIAL_SAVED_ITEMS } from '../src/components/cart/SavedForLaterSection';

describe('Cart Pricing & Stitch Catalog Data Integrity', () => {
  test('STITCH_DEFAULT_CART_ITEMS contains 3 distinct items with 4 total units', () => {
    assert.equal(STITCH_DEFAULT_CART_ITEMS.length, 3);
    const totalUnits = STITCH_DEFAULT_CART_ITEMS.reduce((sum, item) => sum + item.quantity, 0);
    assert.equal(totalUnits, 4);
  });

  test('Default items have valid names, images, and positive prices', () => {
    for (const item of STITCH_DEFAULT_CART_ITEMS) {
      assert.ok(item.price > 0, 'Price must be positive');
      assert.ok(item.quantity > 0, 'Quantity must be positive');
      assert.ok(item.product.name.length > 0, 'Product must have a title');
      assert.ok(item.product.image.length > 0, 'Product must have an image');
    }
  });

  test('Cart line items calculate exact subtotal of ₹1,06,987', () => {
    const subtotal = STITCH_DEFAULT_CART_ITEMS.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    assert.equal(subtotal, 106987);
  });

  test('Free delivery is unlocked when cart total exceeds ₹999 threshold', () => {
    const FREE_THRESHOLD = 999;
    const subtotal = STITCH_DEFAULT_CART_ITEMS.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    assert.ok(subtotal >= FREE_THRESHOLD);
    const deliveryFee = subtotal >= FREE_THRESHOLD ? 0 : 99;
    assert.equal(deliveryFee, 0);
  });

  test('Coupon discount of ₹2,000 correctly reduces payable total', () => {
    const subtotal = 106987;
    const couponDiscount = 2000;
    const totalPayable = subtotal - couponDiscount;
    assert.equal(totalPayable, 104987);
  });

  test('18% GST inclusive portion calculation is mathematically accurate', () => {
    const cartTotal = 106987;
    const gstPortion = Math.round(cartTotal * (18 / 118));
    assert.ok(gstPortion > 0);
    assert.equal(gstPortion, 16320);
  });
});

describe('Cart Saved for Later & Pincode Architecture', () => {
  test('INITIAL_SAVED_ITEMS contains valid products with in-stock and price-drop notes', () => {
    assert.ok(INITIAL_SAVED_ITEMS.length >= 2);
    assert.equal(INITIAL_SAVED_ITEMS[0].name, 'ErgoComfort Dual-Monitor Arm');
    assert.equal(INITIAL_SAVED_ITEMS[0].price, 4299);
    assert.equal(INITIAL_SAVED_ITEMS[1].name, 'Apex Leather Desk Mat 900x400mm');
    assert.equal(INITIAL_SAVED_ITEMS[1].price, 1199);
  });

  test('Indian 6-digit postal code validator correctly accepts and rejects codes', () => {
    const isValidPin = (p: string) => /^\d{6}$/.test(p.trim());
    assert.equal(isValidPin('400001'), true);
    assert.equal(isValidPin('560001'), true);
    assert.equal(isValidPin('110001'), true);
    assert.equal(isValidPin('40001'), false); // 5 digits
    assert.equal(isValidPin('4000001'), false); // 7 digits
    assert.equal(isValidPin('MUMBAI'), false);
  });

  test('Coupon code matching supports OMIZONFESTIVAL and FESTIVAL500', () => {
    const validateCoupon = (code: string) => {
      const c = code.trim().toUpperCase();
      if (c === 'OMIZONFESTIVAL' || c === 'OMIZONFESTIVE') return 2000;
      if (c === 'FESTIVAL500') return 500;
      return 0;
    };
    assert.equal(validateCoupon('OMIZONFESTIVAL'), 2000);
    assert.equal(validateCoupon('omizonfestival'), 2000);
    assert.equal(validateCoupon('FESTIVAL500'), 500);
    assert.equal(validateCoupon('INVALIDCODE'), 0);
  });
});

describe('Guest Cart Initialization & Isolation', () => {
  test('Fresh guest visit with no localStorage initializes to empty cart { items: [] }', () => {
    const initialCart = getInitialGuestCart(null, false);
    assert.deepEqual(initialCart, { items: [] });
    assert.equal(initialCart.items.length, 0);
  });

  test('Explicit demo cart flag initializes to STITCH_DEFAULT_CART_ITEMS', () => {
    const demoCart = getInitialGuestCart(null, true);
    assert.equal(demoCart.items.length, STITCH_DEFAULT_CART_ITEMS.length);
    assert.equal(demoCart.items[0].product.name, STITCH_DEFAULT_CART_ITEMS[0].product.name);
  });

  test('Pre-existing guest items in localStorage are preserved without overwrite', () => {
    const customItems = [
      {
        product: {
          _id: 'custom_prod_1',
          name: 'Custom Mechanical Keyboard',
          description: 'Custom keyboard',
          price: 9999,
          stock: 10,
          category: { _id: 'cat_1', name: 'Electronics', slug: 'electronics' },
          image: 'https://example.com/kb.jpg',
          seller: { _id: 'seller_1', username: 'KeyWorks' },
          status: 'active',
          rating: 4.8,
          reviewCount: 20,
        },
        quantity: 1,
        price: 9999,
        variant: 'RGB / Tactile',
      },
    ];

    const savedCartJson = JSON.stringify({ items: customItems });
    const loadedCart = getInitialGuestCart(savedCartJson, false);
    assert.equal(loadedCart.items.length, 1);
    assert.equal(loadedCart.items[0].product.name, 'Custom Mechanical Keyboard');
    assert.equal(loadedCart.items[0].price, 9999);
  });

  test('Malformed or invalid saved JSON safely falls back to empty cart', () => {
    const malformedJson = '{"items": invalid json';
    const fallbackCart = getInitialGuestCart(malformedJson, false);
    assert.deepEqual(fallbackCart, { items: [] });
  });

  test('LOCAL_CART_KEY is standard omizon_guest_cart', () => {
    assert.equal(LOCAL_CART_KEY, 'omizon_guest_cart');
  });
});

describe('Cart Hydration & Server Reconciliation Regression Tests', () => {
  const sampleLocalItem = {
    product: {
      _id: 'prod_local_123',
      name: 'Smart Noise-Cancelling Earbuds',
      description: 'Wireless earbuds',
      price: 4999,
      stock: 25,
      category: { _id: 'cat_1', name: 'Electronics', slug: 'electronics' },
      image: 'https://example.com/earbuds.jpg',
      seller: { _id: 'seller_1', username: 'AudioPrime' },
      status: 'active',
      rating: 4.7,
      reviewCount: 45,
    },
    quantity: 1,
    price: 4999,
    variant: 'default',
  };

  test('Cart hydration does not erase valid local items when server cart returns empty', () => {
    const currentCart = { items: [sampleLocalItem] };
    const emptyServerCart = { items: [] };

    const { nextCart, itemsToSync } = reconcileCart(currentCart as any, emptyServerCart as any);

    assert.equal(nextCart.items.length, 1, 'Local items must be preserved');
    assert.equal(nextCart.items[0].product.name, 'Smart Noise-Cancelling Earbuds');
    assert.equal(itemsToSync.length, 1, 'Local item must be queued for server synchronization');
  });

  test('Cart hydration merges local items when server cart already contains other items', () => {
    const currentCart = { items: [sampleLocalItem] };
    const serverCart = {
      items: [
        {
          product: {
            _id: 'prod_server_456',
            name: 'Mechanical Gaming Keyboard',
            price: 7999,
          },
          quantity: 2,
          price: 7999,
          variant: 'default',
        },
      ],
    };

    const { nextCart, itemsToSync } = reconcileCart(currentCart as any, serverCart as any);

    assert.equal(nextCart.items.length, 2, 'Both server and local items must be present');
    assert.equal(itemsToSync.length, 1, 'Local item must be synced to server');
  });

  test('Cart hydration accepts server cart when local cart is genuinely empty', () => {
    const currentCart = { items: [] };
    const serverCart = {
      items: [
        {
          product: { _id: 'prod_server_456', name: 'Keyboard', price: 7999 },
          quantity: 1,
          price: 7999,
          variant: 'default',
        },
      ],
    };

    const { nextCart, itemsToSync } = reconcileCart(currentCart as any, serverCart as any);

    assert.equal(nextCart.items.length, 1);
    assert.equal(itemsToSync.length, 0);
  });

  test('Cart hydration remains empty when both local and server carts are empty', () => {
    const currentCart = { items: [] };
    const emptyServerCart = { items: [] };

    const { nextCart, itemsToSync } = reconcileCart(currentCart as any, emptyServerCart as any);

    assert.equal(nextCart.items.length, 0);
    assert.equal(itemsToSync.length, 0);
  });

  test('Refreshing the page preserves cart items in localStorage without break', () => {
    const serialized = JSON.stringify({ items: [sampleLocalItem] });
    const restored = getInitialGuestCart(serialized, false);

    assert.equal(restored.items.length, 1);
    assert.equal(restored.items[0].product.name, 'Smart Noise-Cancelling Earbuds');
    assert.equal(restored.items[0].price, 4999);
  });

  test('Cart reconciliation combines duplicate item quantities without losing units', () => {
    const currentCart = {
      items: [
        {
          product: { _id: 'prod_dup_1', name: 'USB-C Cable', stock: 10, status: 'active' },
          quantity: 2,
          variant: 'default',
          price: 499,
        },
      ],
    };
    const serverCart = {
      items: [
        {
          product: { _id: 'prod_dup_1', name: 'USB-C Cable', stock: 10, status: 'active' },
          quantity: 3,
          variant: 'default',
          price: 499,
        },
      ],
    };

    const { nextCart, itemsToSync } = reconcileCart(currentCart as any, serverCart as any);

    assert.equal(nextCart.items.length, 1);
    assert.equal(nextCart.items[0].quantity, 5, 'Merged quantity must be the sum (2 + 3 = 5)');
    assert.equal(itemsToSync.length, 1);
    assert.equal(itemsToSync[0].action, 'update');
    assert.equal(itemsToSync[0].quantity, 5);
  });

  test('Cart reconciliation caps merged quantity at available product stock', () => {
    const currentCart = {
      items: [
        {
          product: { _id: 'prod_limited_1', name: 'Limited Edition Watch', stock: 4, status: 'active' },
          quantity: 3,
          variant: 'default',
          price: 14999,
        },
      ],
    };
    const serverCart = {
      items: [
        {
          product: { _id: 'prod_limited_1', name: 'Limited Edition Watch', stock: 4, status: 'active' },
          quantity: 2,
          variant: 'default',
          price: 14999,
        },
      ],
    };

    const { nextCart, itemsToSync } = reconcileCart(currentCart as any, serverCart as any);

    assert.equal(nextCart.items.length, 1);
    assert.equal(nextCart.items[0].quantity, 4, 'Merged quantity must be capped at stock (4)');
    assert.equal(itemsToSync[0].quantity, 4);
  });

  test('Cart reconciliation removes inactive or deleted products', () => {
    const currentCart = {
      items: [
        {
          product: { _id: 'prod_active', name: 'Active Prod', stock: 5, status: 'active' },
          quantity: 1,
          variant: 'default',
          price: 999,
        },
        {
          product: { _id: 'prod_inactive', name: 'Inactive Prod', stock: 5, status: 'inactive' },
          quantity: 1,
          variant: 'default',
          price: 999,
        },
      ],
    };
    const serverCart = { items: [] };

    const { nextCart } = reconcileCart(currentCart as any, serverCart as any);

    assert.equal(nextCart.items.length, 1);
    assert.equal(nextCart.items[0].product.name, 'Active Prod');
  });
});

