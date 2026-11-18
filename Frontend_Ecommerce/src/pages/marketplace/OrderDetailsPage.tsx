import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccountLayout } from '../../components/account/AccountLayout';
import { Order, ShippingAddress } from '../../types';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { getStableUserId, getAccountLastOrder, isDemoUser } from '../../utils/accountStorage';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  Download,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ShieldCheck,
  Zap,
  PhoneCall,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Accidental purchase / placed by mistake');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Item defective / not functioning as expected');
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    // 1. Try checking account last order for active user
    const last = getAccountLastOrder(getStableUserId(user));
    if (last && last._id === id) {
      setOrder(last);
      setIsLoading(false);
      return;
    }

    // 2. Fetch from backend API
    api.orders
      .getById(id)
      .then((res) => {
        if (res?.order) {
          setOrder(res.order);
        } else {
          setOrder(null);
        }
      })
      .catch((err) => {
        console.warn('Backend getOrderById error:', err.message);
        if (isDemoUser(user)) {
          // Fallback matching Stitch PDP & Order Details for demo user
          setOrder({
            _id: id,
            user: user?._id || 'demo_user',
            items: [
              {
                product: 'prod_apexbook_01',
                name: 'ApexBook M3 Ultra 16-inch (Space Gray, 36GB RAM, 1TB SSD)',
                variant: 'Space Gray / 36GB / 1TB',
                quantity: 1,
                price: 74990,
              },
            ],
            totalAmount: 74990,
            shippingAddress: {
              fullName: user?.username ? `${user.username} (Home)` : 'Customer (Home)',
              phone: '+91 98200 44912',
              addressLine: 'Flat 902, Tower B, Oberoi Sky City, Borivali East',
              city: 'Mumbai',
              state: 'Maharashtra',
              postalCode: '400066',
              country: 'India',
            },
            paymentStatus: 'paid',
            deliveryStatus: 'shipped',
            trackingNumber: `FX-IN-${id.slice(-7)}`,
            createdAt: new Date(Date.now() - 3600 * 1000 * 16).toISOString(),
          });
        } else {
          setOrder(null);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, user]);

  const handleConfirmCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await api.orders.cancel(order._id, cancelReason);
      setOrder({ ...order, deliveryStatus: 'cancelled', cancellationReason: cancelReason });
      setCancelFeedback('Order successfully cancelled. Reserved inventory released and refund initiated.');
      setCancelModalOpen(false);
    } catch (err: any) {
      setCancelFeedback(err.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!order) return;
    setIsReturning(true);
    try {
      await api.orders.requestReturn(order._id, returnReason);
      setOrder({
        ...order,
        deliveryStatus: 'returned',
        returnReason,
        paymentStatus: 'refunded',
        refundStatus: 'completed',
        refundAmount: order.totalAmount,
      });
      setCancelFeedback('Return request approved. Instant refund credited to your original payment method.');
      setReturnModalOpen(false);
    } catch (err: any) {
      setCancelFeedback(err.message || 'Failed to submit return request.');
    } finally {
      setIsReturning(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    const invoiceContent = `========================================================
OMIZON MARKETPLACE — OFFICIAL TAX INVOICE
========================================================
Order Reference: ${order._id}
Date of Order: ${order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
Invoice Number: INV-${order._id}-2024
GSTIN: 27AABCO1234F1Z8 (Maharashtra)

SHIPPING & BILLING ADDRESS:
${order.shippingAddress.fullName}
${order.shippingAddress.addressLine}
${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}
Contact: ${order.shippingAddress.phone}

ITEMIZED ORDER PARTICULARS:
${order.items
  .map(
    (item, i) =>
      `${i + 1}. ${item.name}
   HSN: 84713010 | Qty: ${item.quantity} | Rate: ₹${item.price.toLocaleString('en-IN')}
   Total: ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
  )
  .join('\n\n')}

--------------------------------------------------------
Subtotal (Taxable): ₹${Math.round((order.totalAmount * 100) / 118).toLocaleString('en-IN')}
CGST @ 9%: ₹${Math.round((order.totalAmount * 9) / 118).toLocaleString('en-IN')}
SGST @ 9%: ₹${Math.round((order.totalAmount * 9) / 118).toLocaleString('en-IN')}
Total Tax: ₹${Math.round((order.totalAmount * 18) / 118).toLocaleString('en-IN')}
Delivery Fee (OMIZON Prime FastX): FREE
Total Amount: ₹${order.totalAmount.toLocaleString('en-IN')}
Payment Status: ${order.paymentStatus.toUpperCase()}
========================================================
This is a computer generated tax invoice. No signature required.
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
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-body-md text-on-surface-variant font-medium text-sm">
          Loading order details...
        </span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <Package className="w-12 h-12 text-outline mx-auto mb-4" />
        <h2 className="font-headline-sm text-on-surface font-bold">Order Details Unavailable</h2>
        <p className="font-body-md text-on-surface-variant mt-2 mb-6">
          We couldn't retrieve the details for order #{id}.
        </p>
        <Button variant="primary" onClick={() => navigate('/account/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const isDelivered = order.deliveryStatus === 'delivered';
  const isCancelled = order.deliveryStatus === 'cancelled';
  const isShipped = order.deliveryStatus === 'shipped';
  const canCancel = !isDelivered && !isCancelled;

  // Timeline events
  const placedTime = order.createdAt ? new Date(order.createdAt) : new Date();
  const confirmedTime = new Date(placedTime.getTime() + 1000 * 60 * 15);
  const packedTime = new Date(placedTime.getTime() + 1000 * 60 * 90);
  const shippedTime = new Date(placedTime.getTime() + 1000 * 60 * 360);

  return (
    <AccountLayout activeKey="orders">
      <div className="w-full flex flex-col gap-6">
        {/* Top Breadcrumb & Back navigation */}
        <div className="flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-on-surface-variant font-body-sm text-xs">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="text-outline-variant">/</span>
            <Link to="/account/orders" className="hover:text-primary transition-colors">Your Orders</Link>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-semibold">#{order._id}</span>
          </nav>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/account/orders')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Orders
          </Button>
        </div>

        {/* Global Feedback Banner */}
        {cancelFeedback && (
          <div className="p-4 bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-body-md text-sm font-semibold">{cancelFeedback}</span>
          </div>
        )}

        {/* Header Strip with Order Details & Actions */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-headline-md text-on-surface font-bold text-2xl">
                Order #{order._id}
              </h1>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  order.deliveryStatus === 'returned'
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                    : isDelivered
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : isCancelled
                    ? 'bg-red-500/10 text-red-600'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                {order.deliveryStatus === 'returned'
                  ? 'Returned & Refunded'
                  : isDelivered
                  ? 'Delivered'
                  : isCancelled
                  ? 'Cancelled'
                  : 'In Transit'}
              </span>
            </div>
            <p className="font-body-md text-on-surface-variant text-sm mt-1">
              Placed on {formatDate(order.createdAt)} • FastX Priority Dispatch
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadInvoice}
              icon={<Download className="w-4 h-4" />}
            >
              Download Invoice
            </Button>
            {isDelivered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnModalOpen(true)}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Return & Refund
              </Button>
            )}
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Refund Status Card if Cancelled or Returned */}
        {(isCancelled || order.deliveryStatus === 'returned') && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-title-sm text-on-surface font-bold text-sm">
                  {order.deliveryStatus === 'returned'
                    ? 'Return Request Approved • Refund Completed'
                    : 'Order Cancelled • Refund Completed'}
                </h4>
                <p className="font-body-sm text-on-surface-variant text-xs mt-0.5">
                  Refund of <strong>{formatCurrency(order.totalAmount)}</strong> credited back to source account. Reference: REF-{order._id.slice(-6)}.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1 rounded-full">
              Status: Refund Processed
            </span>
          </div>
        )}

        {/* 12-Column Main Order Tracking & Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 8 Columns - Live Tracking & Package Items */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Live Shipment Tracking Timeline Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-title-md text-on-surface font-bold text-base">
                      Shipment Tracking
                    </h3>
                    <span className="font-body-sm text-outline text-xs">
                      Carrier: OMIZON FastX Express • Tracking ID: {order.trackingNumber || 'FX-IN-9821820'}
                    </span>
                  </div>
                </div>

                <span className="font-title-sm text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full">
                  {isDelivered ? 'Delivered' : isCancelled ? 'Void' : 'Estimated: Today, 8:00 PM'}
                </span>
              </div>

              {/* Vertical Step Timeline */}
              <div className="relative pl-6 border-l-2 border-primary/20 flex flex-col gap-8 ml-3">
                {/* Milestone 1: Order Placed */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-title-sm text-on-surface font-semibold text-sm">
                      Order Placed & Payment Verified
                    </h4>
                    <span className="font-body-sm text-outline text-xs block">
                      {placedTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • OMIZON Central Gateway
                    </span>
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                      Payment secured and catalog inventory reservation confirmed.
                    </p>
                  </div>
                </div>

                {/* Milestone 2: Packed */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-title-sm text-on-surface font-semibold text-sm">
                      Packed at Mumbai Fulfillment Hub
                    </h4>
                    <span className="font-body-sm text-outline text-xs block">
                      {packedTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • Hub #BOM-04
                    </span>
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                      Package sealed in tamper-evident security carton with serial barcoding.
                    </p>
                  </div>
                </div>

                {/* Milestone 3: Shipped / Out for delivery */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                    isShipped || isDelivered ? 'bg-primary text-white' : 'bg-surface-container-high text-outline'
                  }`}>
                    {isShipped ? <Truck className="w-3.5 h-3.5" /> : '✓'}
                  </div>
                  <div>
                    <h4 className={`font-title-sm font-semibold text-sm ${isShipped ? 'text-primary' : 'text-on-surface'}`}>
                      {isShipped ? 'Out for Delivery — Van 4 stops away' : 'Shipped with FastX Express'}
                    </h4>
                    <span className="font-body-sm text-outline text-xs block">
                      {shippedTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • Associate: Rajesh K.
                    </span>
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                      Executive dispatched for doorstep verification and OTP handover.
                    </p>
                  </div>
                </div>

                {/* Milestone 4: Delivered */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                    isDelivered ? 'bg-emerald-600 text-white' : 'bg-surface-container-high text-outline'
                  }`}>
                    {isDelivered ? '✓' : '4'}
                  </div>
                  <div>
                    <h4 className={`font-title-sm font-semibold text-sm ${isDelivered ? 'text-emerald-600' : 'text-outline'}`}>
                      Delivered to Resident
                    </h4>
                    <span className="font-body-sm text-outline text-xs block">
                      {isDelivered ? 'Recipient verified via OTP' : 'Expected by 8:00 PM'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Items Breakdown Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-4">
              <h3 className="font-title-md text-on-surface font-bold text-base">
                Items in this Package ({order.items.length})
              </h3>

              <div className="flex flex-col gap-4">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/15"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                        <Package className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-title-sm text-on-surface font-semibold text-sm">
                          {item.name}
                        </h4>
                        <p className="font-body-sm text-outline text-xs mt-0.5">
                          HSN: 84713010 • GST @ 18% Included • Qty: {item.quantity}
                        </p>
                        <span className="font-title-sm text-on-surface font-bold text-sm mt-1 block">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                      <Link to="/products">
                        <Button variant="outline" size="sm">
                          Buy Again
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: 4 Columns - Address & Financial Summary */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Delivery Address & Contact Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-outline uppercase tracking-wider text-[11px]">
                  Shipping Address
                </span>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Home
                </span>
              </div>

              <div className="font-body-md text-sm text-on-surface-variant flex flex-col gap-1">
                <span className="font-title-sm text-on-surface font-bold text-sm">
                  {order.shippingAddress.fullName}
                </span>
                <span>{order.shippingAddress.addressLine}</span>
                <span>
                  {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.postalCode}
                </span>
                <span className="font-semibold text-on-surface text-xs mt-1">
                  Contact: {order.shippingAddress.phone}
                </span>
              </div>
            </div>

            {/* Payment & Tax Summary Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-3">
              <span className="font-label-sm text-outline uppercase tracking-wider text-[11px]">
                Payment & Tax Summary
              </span>

              <div className="flex flex-col gap-2 font-body-md text-sm text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>FastX Express Shipping</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-outline text-xs">
                  <span>GST (18% inclusive)</span>
                  <span>{formatCurrency(Math.round((order.totalAmount * 18) / 118))}</span>
                </div>

                <div className="h-px bg-outline-variant/20 my-1" />

                <div className="flex justify-between items-baseline">
                  <span className="font-title-sm text-on-surface font-bold">Grand Total</span>
                  <span className="font-title-md text-primary font-bold text-lg">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>

                <div className="mt-2 p-2.5 bg-surface-container-low rounded-xl flex items-center justify-between text-xs">
                  <span className="text-outline">Payment Method:</span>
                  <span className="font-semibold text-on-surface capitalize">
                    {order.paymentStatus === 'paid' ? 'Prepaid (UPI / Card)' : 'Cash on Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Priority Concierge Card */}
            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>OMIZON Buyer Guarantee</span>
              </div>
              <p className="font-body-sm text-on-surface-variant text-xs leading-relaxed">
                Eligible for 7-day hassle-free return or replacement. Contact our priority concierge if your shipment requires rescheduling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 mb-4">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                Cancel Order #{order._id}
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <p className="font-body-md text-sm text-on-surface-variant mb-4">
              Are you sure you want to cancel this order? Reserved catalog inventory will be released immediately.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-11 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Accidental purchase / placed by mistake">Accidental purchase / placed by mistake</option>
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Delivery timeframe is too long">Delivery timeframe is too long</option>
                <option value="Need to change delivery address or phone">Need to change delivery address or phone</option>
                <option value="Other / changed my mind">Other / changed my mind</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
              >
                Keep Order
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  Request Return & Refund
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <p className="font-body-md text-sm text-on-surface-variant mb-4">
              Submit a return request for Order #{order._id}. A courier pick-up will be scheduled at your delivery address.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5">
                Reason for Return
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full h-11 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Item defective / not functioning as expected">Item defective / not functioning as expected</option>
                <option value="Received damaged outer carton or product">Received damaged outer carton or product</option>
                <option value="Item different from catalog description">Item different from catalog description</option>
                <option value="Size, fit, or color not as expected">Size, fit, or color not as expected</option>
                <option value="Missing parts or accessories in box">Missing parts or accessories in box</option>
              </select>
            </div>

            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary mb-4">
              Refund of <strong>{formatCurrency(order.totalAmount)}</strong> will be credited directly to your original payment method.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReturnModalOpen(false)}
                disabled={isReturning}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReturn}
                disabled={isReturning}
              >
                {isReturning ? 'Submitting...' : 'Submit Return Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default OrderDetailsPage;
