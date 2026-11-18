import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../services/api';
import { Order, ShippingAddress } from '../../types';
import {
  getStableUserId,
  isDemoUser,
  getAccountAddresses,
  setAccountLastOrder,
} from '../../utils/accountStorage';

// Checkout Components
import { CheckoutStepper } from '../../components/checkout/CheckoutStepper';
import {
  DeliveryAddressSection,
  SavedAddressItem,
  INITIAL_SAVED_ADDRESSES,
} from '../../components/checkout/DeliveryAddressSection';
import {
  DeliverySpeedSection,
  DeliverySpeedOption,
} from '../../components/checkout/DeliverySpeedSection';
import {
  PaymentMethodSection,
  PaymentMethodType,
} from '../../components/checkout/PaymentMethodSection';
import {
  CheckoutOrderSummary,
  STITCH_CHECKOUT_DEMO_ITEMS,
} from '../../components/checkout/CheckoutOrderSummary';
import { OrderConfirmation } from '../../components/checkout/OrderConfirmation';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartCount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Stepper state: 1: Cart, 2: Address, 3: Delivery, 4: Payment, 5: Review
  const [currentStep, setCurrentStep] = useState<number>(2);

  const userId = getStableUserId(user);
  const isDemo = isDemoUser(user);

  // Address State:
  // - If user has account-scoped saved addresses, preselect their default (or first).
  // - If explicitly in demo environment (e.g. demo buyer), allow demo address fallback.
  // - Real authenticated customers with NO saved addresses start with null (empty address state).
  const [selectedAddress, setSelectedAddress] = useState<SavedAddressItem | null>(() => {
    const saved = getAccountAddresses(userId);
    if (saved && saved.length > 0) {
      return saved.find((a) => a.isDefault) || saved[0];
    }
    if (isDemo && user?.username === 'priya_sharma') {
      return {
        id: 'addr_demo_priya',
        fullName: 'Priya Sharma (Demo)',
        phone: '+91 98201 23456',
        addressLine: 'Flat 402, Highmont Residences, Senapati Bapat Marg, Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400013',
        country: 'India',
        tag: 'HOME',
        isDefault: true,
      };
    }
    return null;
  });

  // Synchronize address selection when the active user changes
  React.useEffect(() => {
    const saved = getAccountAddresses(userId);
    if (saved && saved.length > 0) {
      setSelectedAddress(saved.find((a) => a.isDefault) || saved[0]);
    } else if (isDemo && user?.username === 'priya_sharma') {
      setSelectedAddress({
        id: 'addr_demo_priya',
        fullName: 'Priya Sharma (Demo)',
        phone: '+91 98201 23456',
        addressLine: 'Flat 402, Highmont Residences, Senapati Bapat Marg, Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400013',
        country: 'India',
        tag: 'HOME',
        isDefault: true,
      });
    } else {
      setSelectedAddress(null);
    }
  }, [userId, isDemo]);

  // Delivery Speed State
  const [selectedSpeed, setSelectedSpeed] = useState<DeliverySpeedOption>('fastx');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Payment Method State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('upi');

  // Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>('OMIZONFESTIVE');
  const [couponDiscount, setCouponDiscount] = useState<number>(5000);

  // Execution & Submitting states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const isExplicitDemo =
    typeof window !== 'undefined' &&
    (localStorage.getItem('omizon_demo_cart') === 'true' ||
      new URLSearchParams(window.location.search).get('demo') === 'cart');

  // Calculate items total (either cart items or Stitch demo items when explicitly in demo mode)
  const activeItems =
    cart.items.length > 0
      ? cart.items.map((i) => ({
          product: typeof i.product === 'object' ? i.product._id : i.product,
          name: typeof i.product === 'object' ? i.product.name : 'Product',
          variant: i.variant || 'default',
          quantity: i.quantity,
          price: typeof i.product === 'object' ? i.product.price : i.price || 14999,
        }))
      : isExplicitDemo
      ? STITCH_CHECKOUT_DEMO_ITEMS.map((i) => ({
          product: i.id,
          name: i.name,
          variant: i.variant,
          quantity: i.quantity,
          price: i.price,
        }))
      : [];

  const itemsSubtotal = activeItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const totalPayable = Math.max(0, itemsSubtotal + deliveryFee - couponDiscount);

  // Step transitions
  const handleStepClick = (step: number) => {
    if (step === 1) {
      navigate('/cart');
    } else {
      setCurrentStep(step);
    }
  };

  const handleDeliverySpeedChange = (speed: DeliverySpeedOption, fee: number) => {
    setSelectedSpeed(speed);
    setDeliveryFee(fee);
    setCurrentStep(4);
  };

  const handleApplyCoupon = (code: string) => {
    setAppliedCoupon(code);
    if (code === 'OMIZONFESTIVE') {
      setCouponDiscount(5000);
    } else if (code === 'FESTIVAL500') {
      setCouponDiscount(500);
    } else if (code === 'WELCOME100') {
      setCouponDiscount(100);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  // Place Order & Pay Handler
  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 0. Empty cart check: fail closed if cart is genuinely empty
      if (activeItems.length === 0) {
        setErrorMessage('Your cart is empty. Please add items before checking out.');
        setIsSubmitting(false);
        return;
      }

      // 1. Validation check: fail closed if no address has been added or selected
      if (
        !selectedAddress ||
        !selectedAddress.fullName?.trim() ||
        !selectedAddress.phone?.trim() ||
        !selectedAddress.addressLine?.trim() ||
        !selectedAddress.city?.trim() ||
        !selectedAddress.state?.trim() ||
        !selectedAddress.postalCode?.trim()
      ) {
        setErrorMessage('Please add and select a delivery address before placing your order.');
        setIsSubmitting(false);
        return;
      }

      const shippingPayload: ShippingAddress = {
        fullName: selectedAddress.fullName.trim(),
        phone: selectedAddress.phone.trim(),
        addressLine: selectedAddress.addressLine.trim(),
        city: selectedAddress.city.trim(),
        state: selectedAddress.state.trim(),
        postalCode: selectedAddress.postalCode.trim(),
        country: selectedAddress.country.trim() || 'India',
      };

      let orderResult: Order;
      let guestAccessToken: string | null = null;

      // 2. Attempt real backend order creation if user is authenticated
      if (isAuthenticated && cart.items.length > 0) {
        try {
          // Pre-sync server cart if needed to ensure backend database contains current cart items
          try {
            const serverCartRes = await api.cart.get();
            if (!serverCartRes?.cart?.items || serverCartRes.cart.items.length === 0) {
              for (const item of cart.items) {
                const pId = typeof item.product === 'object' ? item.product._id : item.product;
                await api.cart.addItem({
                  product: pId,
                  quantity: item.quantity,
                  variant: item.variant || 'default',
                });
              }
            }
          } catch (syncErr) {
            console.warn('Pre-checkout server cart sync notice:', syncErr);
          }

          const createRes = await api.orders.create(shippingPayload, selectedPaymentMethod.toUpperCase());
          orderResult = createRes.order;

          // Attempt payment initiation via Razorpay endpoint if online payment
          if (selectedPaymentMethod !== 'cod') {
            try {
              const payAttempt = await api.payments.createAttempt(orderResult._id);

              // Check if Razorpay script is in window
              if (typeof (window as any).Razorpay !== 'undefined' && payAttempt.razorpayOrderId) {
                const rzp = new (window as any).Razorpay({
                  key: payAttempt.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
                  amount: Math.round(orderResult.totalAmount * 100),
                  currency: 'INR',
                  name: 'OMIZON Marketplace',
                  description: `Order #${orderResult._id.slice(-6)}`,
                  order_id: payAttempt.razorpayOrderId,
                  prefill: {
                    name: selectedAddress.fullName,
                    email: user?.email || 'customer@omizon.in',
                    contact: selectedAddress.phone,
                  },
                  theme: { color: '#762FF2' },
                  handler: async function () {
                    // Poll backend to confirm verification
                    try {
                      const updated = await api.orders.getById(orderResult._id);
                      if (updated?.order) {
                        orderResult = updated.order;
                      }
                    } catch {}
                  },
                });
                rzp.open();
              }
            } catch (payErr: any) {
              console.debug('Payment attempt logged:', payErr.message);
            }
          }
        } catch (apiErr: any) {
          if (apiErr instanceof ApiError && apiErr.status === 409) {
            setErrorMessage(
              'One or more items in your order are currently out of stock or have expired reservations. Please review your cart.'
            );
            setIsSubmitting(false);
            return;
          }
          throw apiErr;
        }
      } else {
        // Genuine guest order creation via backend API
        const guestItemsPayload = activeItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          variant: item.variant || 'default',
        }));

        try {
          const guestRes = await api.orders.createGuest({
            shippingAddress: shippingPayload,
            items: guestItemsPayload,
            paymentMethod: selectedPaymentMethod.toUpperCase(),
          });
          orderResult = guestRes.order;
          guestAccessToken = guestRes.guestAccessToken;

          // Attempt online payment via Razorpay endpoint if online payment
          if (selectedPaymentMethod !== 'cod' && guestAccessToken) {
            try {
              const payAttempt = await api.payments.createGuestAttempt(orderResult._id, guestAccessToken);

              if (typeof (window as any).Razorpay !== 'undefined' && payAttempt.razorpayOrderId) {
                const rzp = new (window as any).Razorpay({
                  key: payAttempt.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
                  amount: Math.round(orderResult.totalAmount * 100),
                  currency: 'INR',
                  name: 'OMIZON Marketplace',
                  description: `Order #${orderResult._id.slice(-6)}`,
                  order_id: payAttempt.razorpayOrderId,
                  prefill: {
                    name: selectedAddress.fullName,
                    email: user?.email || 'guest@omizon.in',
                    contact: selectedAddress.phone,
                  },
                  theme: { color: '#762FF2' },
                  handler: async function () {
                    try {
                      const updated = await api.orders.getGuestById(orderResult._id, guestAccessToken!);
                      if (updated?.order) {
                        orderResult = updated.order;
                      }
                    } catch {}
                  },
                });
                rzp.open();
              }
            } catch (payErr: any) {
              console.debug('Guest payment attempt logged:', payErr.message);
            }
          }
        } catch (guestErr: any) {
          if (guestErr instanceof ApiError && guestErr.status === 409) {
            setErrorMessage(
              'One or more items in your order are currently out of stock or have expired reservations. Please review your cart.'
            );
            setIsSubmitting(false);
            return;
          }
          throw guestErr;
        }
      }

      // 3. Clear cart, cache order, and route to order confirmation
      await clearCart();
      try {
        setAccountLastOrder(userId, orderResult);
        if (guestAccessToken) {
          sessionStorage.setItem(`omizon_guest_token_${orderResult._id}`, guestAccessToken);
          try {
            localStorage.setItem(`omizon_guest_token_${orderResult._id}`, guestAccessToken);
          } catch {}
        }
        sessionStorage.setItem(`omizon_order_${orderResult._id}`, JSON.stringify(orderResult));
      } catch {}

      const confirmUrl = `/order-confirmation/${orderResult._id}`;
      navigate(confirmUrl, {
        state: { order: orderResult, paymentMethod: selectedPaymentMethod, guestAccessToken },
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(
        err.message || 'An unexpected error occurred while placing your order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order is placed, show confirmation screen
  if (confirmedOrder) {
    return (
      <div className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-8">
        <OrderConfirmation
          order={confirmedOrder}
          paymentMethod={selectedPaymentMethod}
          onContinueShopping={() => navigate('/products')}
        />
      </div>
    );
  }

  // If cart is genuinely empty, show empty cart view and prevent checkout
  if (cart.items.length === 0 && !isExplicitDemo) {
    return (
      <div className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-12">
        <div className="max-w-xl mx-auto bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest/60 shadow-sm text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">shopping_cart_off</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Your Cart is Empty</h2>
          <p className="text-body-md text-on-surface-variant">
            You cannot proceed to checkout without items in your cart. Add items from our marketplace before checking out.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              to="/products"
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-lg hover:bg-secondary transition-colors"
            >
              Explore Products
            </Link>
            <Link
              to="/cart"
              className="px-6 py-2.5 bg-surface-container-high text-on-surface rounded-xl font-label-lg hover:bg-surface-container-highest transition-colors"
            >
              Return to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-6">
      {/* Stepper Progress Bar */}
      <CheckoutStepper currentStep={currentStep} onStepClick={handleStepClick} />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-error">error</span>
            <span className="font-body-md font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-on-error-container/70 hover:text-on-error-container"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Main 12-Column Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* LEFT COLUMN: 8 Columns */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* STEP 1: Shipping & Delivery Address */}
          <DeliveryAddressSection
            selectedAddress={selectedAddress}
            onSelectAddress={(addr) => {
              setSelectedAddress(addr);
              setCurrentStep(3);
            }}
            onAddressConfirmed={() => setCurrentStep(3)}
          />

          {/* STEP 2: Delivery & Shipping Speed */}
          <DeliverySpeedSection
            selectedSpeed={selectedSpeed}
            onSelectSpeed={handleDeliverySpeedChange}
            itemCount={activeItems.reduce((acc, curr) => acc + curr.quantity, 0)}
          />

          {/* STEP 3: Payment Method Selection */}
          <PaymentMethodSection
            selectedMethod={selectedPaymentMethod}
            onSelectMethod={(method) => {
              setSelectedPaymentMethod(method);
              setCurrentStep(4);
            }}
            totalPayable={totalPayable}
          />
        </div>

        {/* RIGHT COLUMN: 4 Columns Persistent Order Summary */}
        <CheckoutOrderSummary
          cartItems={cart.items}
          deliveryFee={deliveryFee}
          isSubmitting={isSubmitting}
          onPlaceOrder={handlePlaceOrder}
          couponDiscount={couponDiscount}
          appliedCoupon={appliedCoupon}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
        />
      </div>
    </div>
  );
};

export default CheckoutPage;
