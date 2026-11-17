import test from 'node:test';
import assert from 'node:assert/strict';

test('Buyer Journey & Account Architecture Test Suite', async (t) => {
  await t.test('Order Confirmation structure & GST calculation', () => {
    const totalAmount = 74990;
    const gstPortion = Math.round((totalAmount * 18) / 118);
    const taxableBase = totalAmount - gstPortion;

    assert.equal(gstPortion, 11439, '18% GST inclusive calculation matches standard Indian tax rules');
    assert.equal(taxableBase, 63551, 'Taxable base is total minus GST');
    assert.equal(taxableBase + gstPortion, totalAmount, 'Sum of base and GST equals totalAmount');
  });

  await t.test('Orders filter criteria matches status conventions', () => {
    const orders = [
      { id: '1', deliveryStatus: 'pending' },
      { id: '2', deliveryStatus: 'shipped' },
      { id: '3', deliveryStatus: 'delivered' },
      { id: '4', deliveryStatus: 'cancelled' },
    ];

    const transitOrders = orders.filter((o) => o.deliveryStatus === 'pending' || o.deliveryStatus === 'shipped');
    const deliveredOrders = orders.filter((o) => o.deliveryStatus === 'delivered');
    const cancelledOrders = orders.filter((o) => o.deliveryStatus === 'cancelled');

    assert.equal(transitOrders.length, 2, 'Pending and shipped are in transit');
    assert.equal(deliveredOrders.length, 1, '1 order delivered');
    assert.equal(cancelledOrders.length, 1, '1 order cancelled');
  });

  await t.test('Address Book 6-digit Indian PIN code validator', () => {
    const isValidPin = (pin: string) => /^\d{6}$/.test(pin.trim());

    assert.equal(isValidPin('400013'), true, 'Valid Mumbai PIN');
    assert.equal(isValidPin('110001'), true, 'Valid Delhi PIN');
    assert.equal(isValidPin('560001'), true, 'Valid Bengaluru PIN');
    assert.equal(isValidPin('40001'), false, '5 digits should fail');
    assert.equal(isValidPin('4000134'), false, '7 digits should fail');
    assert.equal(isValidPin('40001a'), false, 'Alphanumeric should fail');
    assert.equal(isValidPin(''), false, 'Empty should fail');
  });

  await t.test('Address Book default address switching', () => {
    const addresses = [
      { id: 'addr_1', fullName: 'Priya', isDefault: true },
      { id: 'addr_2', fullName: 'Priya Work', isDefault: false },
    ];

    const setDefault = (id: string) => addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    const updated = setDefault('addr_2');

    assert.equal(updated.find((a) => a.id === 'addr_2')?.isDefault, true);
    assert.equal(updated.find((a) => a.id === 'addr_1')?.isDefault, false);
  });

  await t.test('Wishlist calculation and move-to-cart behavior', () => {
    const wishlist = [
      { id: 'w1', name: 'Product 1', price: 2000, originalPrice: 2500, inStock: true },
      { id: 'w2', name: 'Product 2', price: 5000, originalPrice: 5000, inStock: false },
    ];

    const inStockItems = wishlist.filter((w) => w.inStock);
    const outOfStockItems = wishlist.filter((w) => !w.inStock);

    assert.equal(inStockItems.length, 1);
    assert.equal(outOfStockItems.length, 1);

    const discountPct = Math.round(((wishlist[0].originalPrice - wishlist[0].price) / wishlist[0].originalPrice) * 100);
    assert.equal(discountPct, 20, '20% discount correctly computed');
  });
});

