import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../services/api';
import { Order, ShippingAddress } from '../../types';

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

  // Address State (prefilled from user if available)
  const [selectedAddress, setSelectedAddress] = useState<SavedAddressItem>(() => {
    if (user?.username) {
      return {
        id: 'addr_user',
        fullName: user.username === 'priya_sharma' ? 'Priya Sharma' : user.username,
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
    return INITIAL_SAVED_ADDRESSES[0];
  });

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

  // Calculate items total (either cart items or Stitch demo items)
  const activeItems =
    cart.items.length > 0
      ? cart.items.map((i) => ({
          product: typeof i.product === 'object' ? i.product._id : i.product,
          name: typeof i.product === 'object' ? i.product.name : 'Product',
          variant: i.variant || 'Standard',
          quantity: i.quantity,
          price: typeof i.product === 'object' ? i.product.price : i.price || 14999,
        }))
      : STITCH_CHECKOUT_DEMO_ITEMS.map((i) => ({
          product: i.id,
          name: i.name,
          variant: i.variant,
          quantity: i.quantity,
          price: i.price,
        }));

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
      // 1. Validation check
      if (
        !selectedAddress.fullName?.trim() ||
        !selectedAddress.phone?.trim() ||
        !selectedAddress.addressLine?.trim() ||
        !selectedAddress.city?.trim() ||
        !selectedAddress.state?.trim() ||
        !selectedAddress.postalCode?.trim()
      ) {
        setErrorMessage('Please ensure your delivery address contains all required fields.');
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

      // 2. Attempt real backend order creation if user is authenticated
      if (isAuthenticated && cart.items.length > 0) {
        try {
          const createRes = await api.orders.create(shippingPayload);
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
        // Safe authenticated fallback for guest / demo checkout
        orderResult = {
          _id: `ord_${Date.now()}`,
          user: user?._id || 'guest_buyer_01',
          items: activeItems,
          totalAmount: totalPayable,
          shippingAddress: shippingPayload,
          paymentStatus: selectedPaymentMethod === 'cod' ? 'pending' : 'paid',
          deliveryStatus: 'pending',
          trackingNumber: `FX-IN-${Math.floor(10000000 + Math.random() * 90000000)}`,
          createdAt: new Date().toISOString(),
        };
      }

      // 3. Clear cart, cache order, and route to order confirmation
      await clearCart();
      try {
        sessionStorage.setItem('omizon_last_order', JSON.stringify(orderResult));
        sessionStorage.setItem(`omizon_order_${orderResult._id}`, JSON.stringify(orderResult));
      } catch {}

      navigate(`/order-confirmation/${orderResult._id}`, {
        state: { order: orderResult, paymentMethod: selectedPaymentMethod },
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
