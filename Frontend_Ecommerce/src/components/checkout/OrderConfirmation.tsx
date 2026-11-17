import React from 'react';
import { Link } from 'react-router-dom';
import { Order, ShippingAddress } from '../../types';
import { CheckCircle2, Zap, Package, ShieldCheck } from 'lucide-react';

interface OrderConfirmationProps {
  order: Order;
  paymentMethod: string;
  onContinueShopping?: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  paymentMethod,
}) => {
  const formatInr = (num: number) => `₹${num.toLocaleString('en-IN')}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const address = order.shippingAddress as ShippingAddress;

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'upi':
        return 'UPI (Instant FastX Prepay)';
      case 'card':
        return 'Credit / Debit Card';
      case 'netbanking':
        return 'Net Banking';
      case 'emi':
        return 'EMI / Pay Later';
      case 'cod':
        return 'Cash on Delivery (OTP on Arrival)';
      default:
        return 'Razorpay Secure Checkout';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Animated Success Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4 animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="text-center mb-8">
        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          {order.paymentStatus === 'paid' ? 'Payment Verified & Reserved' : 'Order Placed Successfully'}
        </span>
        <h1 className="font-headline-md text-on-surface font-bold text-3xl sm:text-4xl mt-3 tracking-tight">
          Thank you for your order!
        </h1>
        <p className="font-body-md text-on-surface-variant mt-2 max-w-lg mx-auto">
          We’ve received your order and reserved your items. A confirmation email and tracking link have
          been dispatched.
        </p>
      </div>

      {/* Main Confirmation Card */}
      <div className="w-full bg-surface-container-lowest rounded-2xl shadow-md border border-outline-variant/20 overflow-hidden mb-8">
        {/* Order Meta Bar */}
        <div className="p-6 bg-surface-container-low border-b border-outline-variant/15 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-label-sm text-outline uppercase tracking-wider block text-[11px]">
              Order ID
            </span>
            <span className="font-title-md text-on-surface font-mono font-bold">
              {order._id}
            </span>
          </div>

          <div>
            <span className="font-label-sm text-outline uppercase tracking-wider block text-[11px]">
              Order Date
            </span>
            <span className="font-title-sm text-on-surface font-medium">{orderDate}</span>
          </div>

          <div>
            <span className="font-label-sm text-outline uppercase tracking-wider block text-[11px]">
              Payment Method
            </span>
            <span className="font-title-sm text-primary font-semibold">
              {getMethodLabel(paymentMethod)}
            </span>
          </div>

          <div>
            <span className="font-label-sm text-outline uppercase tracking-wider block text-[11px]">
              Estimated Delivery
            </span>
            <span className="font-title-sm text-emerald-700 font-semibold flex items-center gap-1">
              <Zap className="w-4 h-4 text-emerald-600" />
              Tomorrow by 2:00 PM
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Products List (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <h3 className="font-title-sm text-on-surface font-bold uppercase tracking-wider text-xs">
              Ordered Items ({order.items.length})
            </h3>
            <div className="flex flex-col gap-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center p-1 overflow-hidden shrink-0">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-title-sm text-on-surface font-semibold line-clamp-1">
                        {item.name}
                      </p>
                      <span className="font-body-sm text-outline text-[12px]">
                        Qty: {item.quantity} • {item.variant}
                      </span>
                    </div>
                  </div>
                  <span className="font-title-sm text-on-surface font-bold shrink-0">
                    {formatInr(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Billing Summary (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-5 border-t md:border-t-0 md:border-l border-outline-variant/15 md:pl-6 pt-4 md:pt-0">
            <div>
              <h3 className="font-title-sm text-on-surface font-bold uppercase tracking-wider text-xs mb-2">
                Shipping Address
              </h3>
              <div className="p-3.5 bg-surface-container-low rounded-xl text-body-sm text-on-surface-variant flex flex-col gap-1">
                <span className="font-title-sm text-on-surface font-semibold">
                  {address.fullName}
                </span>
                <span>{address.phone}</span>
                <span>{address.addressLine}</span>
                <span>
                  {address.city}, {address.state} — {address.postalCode}
                </span>
                <span className="font-medium text-on-surface">{address.country}</span>
              </div>
            </div>

            <div className="border-t border-outline-variant/15 pt-3 flex flex-col gap-2">
              <div className="flex justify-between font-body-sm text-on-surface-variant">
                <span>Total Paid</span>
                <span className="font-headline-sm text-on-surface font-bold text-xl">
                  {formatInr(order.totalAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-body-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Safe 256-Bit SSL Encrypted Transaction</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-surface-container-low border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/products"
            className="px-5 py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/5 font-title-sm font-semibold transition-colors"
          >
            ← Continue Shopping
          </Link>

          <Link
            to="/orders"
            className="px-6 py-2.5 rounded-lg bg-primary hover:bg-secondary text-on-primary font-title-sm font-bold shadow-md shadow-primary/20 transition-colors"
          >
            View My Orders &amp; Track Delivery →
          </Link>
        </div>
      </div>
    </div>
  );
};
