import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Order, ShippingAddress } from '../../types';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { getStableUserId, getAccountLastOrder, isDemoUser } from '../../utils/accountStorage';
import {
  CheckCircle2,
  Package,
  Truck,
  Download,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Clock,
  Printer,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(() => {
    // 1. Check router state
    if (location.state?.order) {
      return location.state.order as Order;
    }
    // 2. Check safe account last order
    if (orderId) {
      const lastOrder = getAccountLastOrder(getStableUserId(user));
      if (lastOrder && lastOrder._id === orderId) {
        return lastOrder;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(!order);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const paymentMethod = location.state?.paymentMethod || 'upi';

  useEffect(() => {
    if (order || !orderId) return;

    setIsLoading(true);
    api.orders
      .getById(orderId)
      .then((res) => {
        if (res?.order) {
          setOrder(res.order);
        } else {
          setOrder(null);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch order from backend:', err.message);
        if (isDemoUser(user)) {
          setOrder({
            _id: orderId,
            user: user?._id || 'demo_user',
            items: [
              {
                product: 'prod_soundpulse_01',
                name: 'SoundPulse Studio Pro Wireless ANC Headphones',
                variant: 'Midnight Violet',
                quantity: 1,
                price: 24999,
              },
            ],
            totalAmount: 24999,
            shippingAddress: {
              fullName: user?.username ? `${user.username} (Demo)` : 'Customer (Demo)',
              phone: '+91 98201 23456',
              addressLine: 'Flat 402, Highmont Residences, Lower Parel',
              city: 'Mumbai',
              state: 'Maharashtra',
              postalCode: '400013',
              country: 'India',
            },
            paymentStatus: 'paid',
            deliveryStatus: 'pending',
            trackingNumber: `FX-IN-${orderId.slice(-8)}`,
            createdAt: new Date().toISOString(),
          });
        } else {
          setOrder(null);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orderId, user]);

  const handleDownloadInvoice = () => {
    if (!order) return;
    const invoiceContent = `========================================================
OMIZON MARKETPLACE — TAX INVOICE / CASH MEMO
========================================================
Order ID: ${order._id}
Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
Payment Status: ${order.paymentStatus.toUpperCase()}
Tracking ID: ${order.trackingNumber || 'Pending Assignment'}

SHIPPED TO:
${order.shippingAddress.fullName}
${order.shippingAddress.addressLine}
${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}
Contact: ${order.shippingAddress.phone}

ITEMS ORDERED:
${order.items
  .map(
    (item, i) =>
      `${i + 1}. ${item.name} (${item.variant || 'Standard'}) x ${item.quantity} = ₹${(
        item.price * item.quantity
      ).toLocaleString('en-IN')}`
  )
  .join('\n')}

--------------------------------------------------------
Subtotal: ₹${order.totalAmount.toLocaleString('en-IN')}
Delivery (FastX Express): FREE
GST (18% inclusive): ₹${Math.round((order.totalAmount * 18) / 118).toLocaleString('en-IN')}
Total Amount Paid: ₹${order.totalAmount.toLocaleString('en-IN')}
========================================================
Thank you for shopping with OMIZON!
Authorized Digital Signature
========================================================`;

    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${order._id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-body-md text-on-surface-variant font-medium">
          Retrieving order confirmation...
        </span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-container-high mx-auto flex items-center justify-center text-outline mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="font-headline-sm text-on-surface font-bold">Order Not Found</h2>
        <p className="font-body-md text-on-surface-variant mt-2 mb-6">
          We could not find the details for order #{orderId}. If you just placed this order, please check your orders page.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/products')}>
            Shop All Products
          </Button>
          <Button variant="primary" onClick={() => navigate('/account/orders')}>
            View My Orders
          </Button>
        </div>
      </div>
    );
  }

  const address = order.shippingAddress as ShippingAddress;
  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="w-full bg-surface py-10 px-margin-mobile md:px-margin">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Animated Celebration Badge */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-5">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Header confirmation */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-label-sm font-bold uppercase tracking-wider px-3.5 py-1 rounded-full mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isPaid ? 'Payment Confirmed & Verified' : 'Order Placed Successfully'}
          </span>
          <h1 className="font-headline-lg text-on-surface tracking-tight font-bold">
            Thank you for your order!
          </h1>
          <p className="font-body-md text-on-surface-variant mt-2 max-w-lg mx-auto">
            Order <span className="font-mono font-bold text-on-surface">#{order._id}</span> has been confirmed.
            A confirmation receipt and live tracking updates will be sent to your registered contact.
          </p>
        </div>

        {/* Notification Toast for Invoice Download */}
        {downloadSuccess && (
          <div className="mb-6 px-4 py-2.5 bg-inverse-surface text-inverse-on-surface rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-body-sm font-medium">Tax invoice downloaded successfully</span>
          </div>
        )}

        {/* Master Confirmation Card */}
        <div className="w-full bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden mb-8">
          {/* Top Meta Bar */}
          <div className="p-6 bg-surface-container-low border-b border-outline-variant/15 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-label-sm text-outline uppercase tracking-wider block text-[11px]">
                Order Reference
              </span>
              <span className="font-title-sm text-on-surface font-mono font-bold">
                #{order._id}
              </span>
            </div>

            <div>
              <span className="font-label-sm text-outline uppercase tracking-wider block text-[11px]">
                Order Date
              </span>
              <span className="font-title-sm text-on-surface font-medium">
                {formatDate(order.createdAt)}
              </span>
            </div>

            <div>
              <span className="font-label-sm text-outline uppercase tracking-wider block text-[11px]">
                Payment Status
              </span>
              <span className={`font-title-sm font-semibold ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                {isPaid ? 'Paid via Online Transfer' : 'Cash on Delivery (Pending)'}
              </span>
            </div>

            <div>
              <span className="font-label-sm text-outline uppercase tracking-wider block text-[11px]">
                Estimated Delivery
              </span>
              <span className="font-title-sm text-primary font-semibold flex items-center gap-1">
                <Truck className="w-4 h-4" />
                Tomorrow by 8:00 PM
              </span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Col: Ordered Items (7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-title-sm text-on-surface font-bold uppercase tracking-wider text-xs">
                  Items in this Order ({order.items.length})
                </h3>
                <span className="font-body-sm text-outline text-xs">FastX Priority Delivery</span>
              </div>

              <div className="flex flex-col gap-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-title-sm text-on-surface font-semibold line-clamp-1">
                          {item.name}
                        </p>
                        <span className="font-body-sm text-outline text-[12px]">
                          Qty: {item.quantity} {item.variant ? `• ${item.variant}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="font-title-sm text-on-surface font-bold shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery ETA info box */}
              <div className="mt-2 p-3.5 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-title-sm text-on-surface font-semibold text-xs">
                    Guaranteed Delivery Slot
                  </h4>
                  <p className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">
                    Your package is queued for priority dispatch from our Mumbai Fulfillment Center. You will receive SMS alerts with the live delivery agent's contact before arrival.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: Delivery Address & Summary (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-outline-variant/15 md:pl-8 pt-6 md:pt-0">
              {/* Shipping Address */}
              <div>
                <h3 className="font-title-sm text-on-surface font-bold uppercase tracking-wider text-xs mb-2.5">
                  Delivery Address
                </h3>
                <div className="p-4 bg-surface-container-low rounded-xl font-body-sm text-on-surface-variant flex flex-col gap-1">
                  <span className="font-title-sm text-on-surface font-semibold">
                    {address?.fullName}
                  </span>
                  <span>{address?.phone}</span>
                  <span>{address?.addressLine}</span>
                  <span>
                    {address?.city}, {address?.state} — {address?.postalCode}
                  </span>
                  <span className="text-outline text-xs mt-1">{address?.country || 'India'}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div>
                <h3 className="font-title-sm text-on-surface font-bold uppercase tracking-wider text-xs mb-2.5">
                  Payment Summary
                </h3>
                <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-2 font-body-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Items Subtotal</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Delivery Fee</span>
                    <span className="text-emerald-600 font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-outline text-xs">
                    <span>GST (18% inclusive)</span>
                    <span>{formatCurrency(Math.round((order.totalAmount * 18) / 118))}</span>
                  </div>
                  <div className="h-px bg-outline-variant/20 my-1" />
                  <div className="flex justify-between items-baseline">
                    <span className="font-title-sm text-on-surface font-bold">Total Paid</span>
                    <span className="font-title-md text-primary font-bold">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadInvoice}
                  icon={<Download className="w-4 h-4" />}
                  className="w-full justify-center"
                >
                  Download Tax Invoice
                </Button>
                <Link to={`/account/orders/${order._id}`} className="w-full">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ExternalLink className="w-4 h-4" />}
                    className="w-full justify-center"
                  >
                    View Order & Live Tracking
                  </Button>
                </Link>
                <Link to="/products" className="w-full">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ShoppingBag className="w-4 h-4" />}
                    className="w-full justify-center"
                  >
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-on-surface-variant text-body-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>OMIZON Buyer Protection & Authenticity Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <span>FastX Carbon-Neutral Express Shipping</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
