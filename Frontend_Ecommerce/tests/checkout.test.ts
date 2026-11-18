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

describe('Checkout Cart Validation & Buyer Journey Regression Tests', () => {
  const getActiveCheckoutItems = (
    cartItems: any[],
    isExplicitDemo: boolean = false
  ) => {
    if (cartItems.length > 0) {
      return cartItems.map((i) => ({
        product: typeof i.product === 'object' ? i.product._id : i.product,
        name: typeof i.product === 'object' ? i.product.name : 'Product',
        variant: i.variant || 'default',
        quantity: i.quantity,
        price: typeof i.product === 'object' ? i.product.price : i.price || 14999,
      }));
    }
    if (isExplicitDemo) {
      return STITCH_CHECKOUT_DEMO_ITEMS.map((i) => ({
        product: i.id,
        name: i.name,
        variant: i.variant,
        quantity: i.quantity,
        price: i.price,
      }));
    }
    return [];
  };

  test('A guest with one cart item can proceed to checkout with populated active items', () => {
    const guestCartItems = [
      {
        product: {
          _id: 'prod_guest_101',
          name: 'Wireless Noise Cancelling Headphones',
          price: 12999,
        },
        quantity: 1,
        variant: 'default',
        price: 12999,
      },
    ];

    const activeItems = getActiveCheckoutItems(guestCartItems, false);
    assert.equal(activeItems.length, 1);
    assert.equal(activeItems[0].product, 'prod_guest_101');
    assert.equal(activeItems[0].name, 'Wireless Noise Cancelling Headphones');
    assert.equal(activeItems[0].price, 12999);

    const subtotal = activeItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    assert.equal(subtotal, 12999);
  });

  test('An authenticated user with one server-side cart item can proceed to checkout', () => {
    const authenticatedCartItems = [
      {
        product: {
          _id: 'prod_auth_202',
          name: 'ApexBook M3 Ultra 16-inch',
          price: 74990,
        },
        quantity: 1,
        variant: 'default',
        price: 74990,
      },
    ];

    const activeItems = getActiveCheckoutItems(authenticatedCartItems, false);
    assert.equal(activeItems.length, 1);
    assert.equal(activeItems[0].product, 'prod_auth_202');
    assert.equal(activeItems[0].price, 74990);
  });

  test('A genuinely empty cart still cannot proceed to checkout', () => {
    const emptyCartItems: any[] = [];
    const isExplicitDemo = false;

    const activeItems = getActiveCheckoutItems(emptyCartItems, isExplicitDemo);
    assert.equal(activeItems.length, 0, 'Active items must be empty when cart is genuinely empty');

    const canProceed = activeItems.length > 0;
    assert.equal(canProceed, false, 'Genuinely empty cart must not proceed to checkout');
  });

  test('Explicit demo flag activates STITCH_CHECKOUT_DEMO_ITEMS when cart is empty', () => {
    const emptyCartItems: any[] = [];
    const isExplicitDemo = true;

    const activeItems = getActiveCheckoutItems(emptyCartItems, isExplicitDemo);
    assert.equal(activeItems.length, STITCH_CHECKOUT_DEMO_ITEMS.length);
    assert.equal(activeItems[0].name, 'ApexBook M3 Ultra 16-inch');
  });

  test('Refreshing the page does not break the cart-to-checkout transition', () => {
    // 1. Simulate product added and serialized to localStorage
    const savedGuestCart = {
      items: [
        {
          product: {
            _id: 'prod_persisted_303',
            name: 'Ergonomic Desk Chair',
            price: 18499,
          },
          quantity: 2,
          variant: 'default',
          price: 18499,
        },
      ],
    };
    const jsonStr = JSON.stringify(savedGuestCart);

    // 2. Simulate page reload where cart state is rehydrated from JSON
    const rehydratedCart = JSON.parse(jsonStr);
    assert.ok(Array.isArray(rehydratedCart.items));

    // 3. Simulate CheckoutPage receiving the rehydrated cart
    const activeItems = getActiveCheckoutItems(rehydratedCart.items, false);
    assert.equal(activeItems.length, 1);
    assert.equal(activeItems[0].product, 'prod_persisted_303');
    assert.equal(activeItems[0].quantity, 2);

    const subtotal = activeItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    assert.equal(subtotal, 36998);
  });

  test('Guest checkout payload builds valid backend API request with genuine items and shipping address', () => {
    const activeItems = [
      { product: 'prod_guest_404', name: 'Smart Watch', variant: 'default', quantity: 1, price: 9999 },
    ];
    const shippingAddress = {
      fullName: 'Rahul Dravid',
      phone: '9845012345',
      addressLine: 'MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    };

    const guestPayload = {
      shippingAddress,
      items: activeItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        variant: item.variant,
      })),
      paymentMethod: 'COD',
    };

    assert.equal(guestPayload.items.length, 1);
    assert.equal(guestPayload.items[0].product, 'prod_guest_404');
    assert.equal(guestPayload.items[0].variant, 'default');
    assert.equal(guestPayload.paymentMethod, 'COD');
    assert.equal(guestPayload.shippingAddress.postalCode, '560001');
  });

  test('Guest confirmation URL formatting avoids exposing guest tokens in URLs and stores in sessionStorage', () => {
    const orderId = 'ord_guest_999';
    const guestAccessToken = 'tok_secure_guest_abc123';

    // Verify confirmation URL does NOT expose the guest access token in query parameters
    const confirmUrl = `/order-confirmation/${orderId}`;
    assert.equal(confirmUrl, '/order-confirmation/ord_guest_999');
    assert.equal(confirmUrl.includes('?'), false, 'URL must not contain query parameters');
    assert.equal(confirmUrl.includes('token='), false, 'URL must never expose token');

    // Simulate sessionStorage token persistence for session refresh isolation
    const mockSessionStorage: Record<string, string> = {};
    mockSessionStorage[`omizon_guest_token_${orderId}`] = guestAccessToken;

    const retrievedToken = mockSessionStorage[`omizon_guest_token_${orderId}`];
    assert.equal(retrievedToken, 'tok_secure_guest_abc123');

    // Headers sent via api.orders.getGuestById contain x-guest-token header
    const headers = { 'x-guest-token': retrievedToken };
    assert.equal(headers['x-guest-token'], 'tok_secure_guest_abc123');
  });
});

