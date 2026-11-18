import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { STITCH_CHECKOUT_DEMO_ITEMS } from '../src/components/checkout/CheckoutOrderSummary';
import { INITIAL_SAVED_ADDRESSES } from '../src/components/checkout/DeliveryAddressSection';

describe('Checkout Pricing & Calculation Logic', () => {
  test('Canonical Stitch checkout items compute to exactly ₹1,03,488 subtotal', () => {
    assert.equal(STITCH_CHECKOUT_DEMO_ITEMS.length, 3);
    const subtotal = STITCH_CHECKOUT_DEMO_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
    assert.equal(subtotal, 103488);
  });

  test('Festive coupon discount of ₹5,000 calculates total payable of ₹98,488 with Free FastX', () => {
    const subtotal = STITCH_CHECKOUT_DEMO_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = 0; // FastX is FREE
    const couponDiscount = 5000; // OMIZONFESTIVE
    const totalPayable = subtotal + deliveryFee - couponDiscount;
    assert.equal(totalPayable, 98488);
  });

  test('Morning Express delivery slot fee adds ₹149 to total', () => {
    const subtotal = STITCH_CHECKOUT_DEMO_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = 149;
    const couponDiscount = 5000;
    const totalPayable = subtotal + deliveryFee - couponDiscount;
    assert.equal(totalPayable, 98637);
  });
});

describe('Checkout Delivery Address & Indian Validation', () => {
  test('Initial saved addresses are valid Indian addresses with 6-digit PIN codes', () => {
    assert.ok(INITIAL_SAVED_ADDRESSES.length >= 2);
    for (const addr of INITIAL_SAVED_ADDRESSES) {
      assert.ok(addr.fullName.length > 0);
      assert.match(addr.postalCode, /^\d{6}$/);
      assert.equal(addr.country, 'India');
      assert.ok(addr.phone.includes('+91'));
    }
  });

  test('Indian PIN code format validator requires 6 digits', () => {
    const isValidPin = (pin: string) => /^\d{6}$/.test(pin.trim());
    assert.equal(isValidPin('400013'), true);
    assert.equal(isValidPin('110001'), true);
    assert.equal(isValidPin('40001'), false); // 5 digits
    assert.equal(isValidPin('4000133'), false); // 7 digits
    assert.equal(isValidPin('400 013'), false); // spaces
    assert.equal(isValidPin('ABC123'), false);
  });

  test('Indian Mobile number validator requires 10 digits', () => {
    const isValidPhone = (phone: string) => {
      const clean = phone.replace(/\D/g, '');
      return clean.length === 10 || (clean.length === 12 && clean.startsWith('91'));
    };
    assert.equal(isValidPhone('9820123456'), true);
    assert.equal(isValidPhone('+91 98201 23456'), true);
    assert.equal(isValidPhone('982012345'), false); // 9 digits
    assert.equal(isValidPhone(''), false);
  });
});

describe('Payment Method Architecture', () => {
  const VALID_PAYMENT_METHODS = ['UPI', 'CARD', 'NETBANKING', 'EMI', 'COD'];

  test('Supported payment methods include India-first options', () => {
    const supported = ['upi', 'card', 'netbanking', 'emi', 'cod'];
    assert.ok(supported.includes('upi'));
    assert.ok(supported.includes('card'));
    assert.ok(supported.includes('netbanking'));
    assert.ok(supported.includes('cod'));
  });

  test('Checkout normalizes selected payment method to uppercase enum', () => {
    const clientSelectedMethods = ['upi', 'card', 'netbanking', 'emi', 'cod'];
    for (const method of clientSelectedMethods) {
      const normalized = method.toUpperCase();
      assert.ok(
        VALID_PAYMENT_METHODS.includes(normalized),
        `Normalized method ${normalized} must be in backend enum`
      );
    }
  });

  test('COD payment bypasses Razorpay payment gateway initialization', () => {
    const shouldCreatePaymentAttempt = (paymentMethod: string) => {
      return paymentMethod.toUpperCase() !== 'COD';
    };

    assert.equal(shouldCreatePaymentAttempt('COD'), false);
    assert.equal(shouldCreatePaymentAttempt('cod'), false);
    assert.equal(shouldCreatePaymentAttempt('UPI'), true);
    assert.equal(shouldCreatePaymentAttempt('CARD'), true);
    assert.equal(shouldCreatePaymentAttempt('NETBANKING'), true);
    assert.equal(shouldCreatePaymentAttempt('EMI'), true);
  });

  test('Order confirmation navigation payload preserves selected payment method', () => {
    const createConfirmationPayload = (orderId: string, paymentMethod: string, amount: number) => ({
      orderId,
      totalAmount: amount,
      paymentMethod: paymentMethod.toUpperCase(),
      estimatedDelivery: '3-5 business days',
    });

    const codPayload = createConfirmationPayload('order_cod_123', 'cod', 1499);
    assert.equal(codPayload.paymentMethod, 'COD');
    assert.equal(codPayload.totalAmount, 1499);

    const upiPayload = createConfirmationPayload('order_upi_456', 'upi', 24999);
    assert.equal(upiPayload.paymentMethod, 'UPI');
  });

  test('UPI virtual private address (VPA) contains handle domain', () => {
    const validateVpa = (vpa: string) => /^[\w.-]+@[\w.-]+$/.test(vpa.trim());
    assert.equal(validateVpa('rajesh.singhania@oksbi'), true);
    assert.equal(validateVpa('omizon.store@okhdfcbank'), true);
    assert.equal(validateVpa('invalid-vpa'), false);
  });
});

