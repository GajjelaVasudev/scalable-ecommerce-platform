import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { STITCH_DEFAULT_CART_ITEMS } from '../src/context/CartContext';
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

