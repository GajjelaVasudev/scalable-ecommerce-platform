import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AccountLayout } from '../../components/account/AccountLayout';
import { api } from '../../services/api';
import { Order } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { getStableUserId, isDemoUser, getAccountLastOrder } from '../../utils/accountStorage';
import {
  Package,
  Search,
  X,
  Truck,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  RotateCcw,
  Zap,
  MapPin,
  ShieldCheck,
  PhoneCall,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

// Rich fallback orders matching the original Google Stitch design
const STITCH_DEMO_ORDERS: Order[] = [
  {
    _id: 'OMZ-993821-IN',
    user: 'user_priya',
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
      fullName: 'Priya Sharma (Home)',
      phone: '+91 98200 44912',
      addressLine: 'Flat 902, Tower B, Oberoi Sky City, Borivali East',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400066',
      country: 'India',
    },
    paymentStatus: 'paid',
    deliveryStatus: 'shipped',
    trackingNumber: 'FX-IN-9821820',
    createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
  },
  {
    _id: 'OMZ-884192-IN',
    user: 'user_priya',
    items: [
      {
        product: 'prod_soundpulse_01',
        name: 'SoundPulse Studio Pro Wireless ANC Headphones',
        variant: 'Midnight Violet',
        quantity: 1,
        price: 24999,
      },
      {
        product: 'prod_artisan_candle',
        name: 'AuraGlow Minimalist Architect Desk Lamp with Qi Charger',
        variant: 'Matte Titanium',
        quantity: 1,
        price: 8499,
      },
    ],
    totalAmount: 33498,
    shippingAddress: {
      fullName: 'Priya Sharma (Home)',
      phone: '+91 98200 44912',
      addressLine: 'Flat 902, Tower B, Oberoi Sky City, Borivali East',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400066',
      country: 'India',
    },
    paymentStatus: 'paid',
    deliveryStatus: 'delivered',
    trackingNumber: 'FX-IN-8841920',
    createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
  },
  {
    _id: 'OMZ-771204-IN',
    user: 'user_priya',
    items: [
      {
        product: 'prod_stoneware_03',
        name: 'Artisan Handcrafted Stoneware Dining Set (16-Piece)',
        variant: 'Nordic Slate',
        quantity: 1,
        price: 4899,
      },
    ],
    totalAmount: 4899,
    shippingAddress: {
      fullName: 'Priya Sharma (Work / Studio)',
      phone: '+91 98200 44912',
      addressLine: 'Floor 9, Creator Hub, Bandra Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400051',
      country: 'India',
    },
    paymentStatus: 'paid',
    deliveryStatus: 'delivered',
    trackingNumber: 'FX-IN-7712041',
    createdAt: new Date(Date.now() - 3600 * 1000 * 240).toISOString(),
  },
  {
    _id: 'OMZ-662910-IN',
    user: 'user_priya',
    items: [
      {
        product: 'prod_smartwatch_02',
        name: 'Titanium Smart Fitness Watch Series 9 (GPS + Cellular)',
        variant: 'Starlight Sport',
        quantity: 1,
        price: 32900,
      },
    ],
    totalAmount: 32900,
    shippingAddress: {
      fullName: 'Priya Sharma (Home)',
      phone: '+91 98200 44912',
      addressLine: 'Flat 902, Tower B, Oberoi Sky City, Borivali East',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400066',
      country: 'India',
    },
    paymentStatus: 'failed',
    deliveryStatus: 'cancelled',
    trackingNumber: 'FX-IN-6629100',
    createdAt: new Date(Date.now() - 3600 * 1000 * 720).toISOString(),
  },
];

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters with URL synchronization
  const [activeTab, setActiveTab] = useState<'all' | 'transit' | 'delivered' | 'cancelled' | 'returns'>(() => {
    if (filterParam === 'returns') return 'returns';
    if (filterParam === 'transit') return 'transit';
    if (filterParam === 'delivered') return 'delivered';
    if (filterParam === 'cancelled') return 'cancelled';
    return 'all';
  });

  useEffect(() => {
    if (filterParam === 'returns') {
      setActiveTab('returns');
    } else if (filterParam === 'transit') {
      setActiveTab('transit');
    } else if (filterParam === 'delivered') {
      setActiveTab('delivered');
    } else if (filterParam === 'cancelled') {
      setActiveTab('cancelled');
    } else if (!filterParam) {
      setActiveTab('all');
    }
  }, [filterParam]);
  const [timeframe, setTimeframe] = useState<'3months' | '6months' | '2024' | '2023' | 'archived'>('2024');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Modal / Drawer / Toast states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Accidental purchase / placed by mistake');
  const [isCancelling, setIsCancelling] = useState(false);
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('Item defective / not functioning as expected');
  const [isReturning, setIsReturning] = useState(false);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

  // Trigger toast feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    setIsLoading(true);
    const last = getAccountLastOrder(getStableUserId(user));
    const cachedPlacedOrders: Order[] = last ? [last] : [];
    const isDemo = isDemoUser(user);

    api.orders
      .list()
      .then((res) => {
        if (res?.orders && res.orders.length > 0) {
          // Merge freshly created session orders with backend orders
          const merged = [...cachedPlacedOrders];
          res.orders.forEach((bo: Order) => {
            if (!merged.some((m) => m._id === bo._id)) {
              merged.push(bo);
            }
          });
          setOrders(merged);
        } else if (cachedPlacedOrders.length > 0) {
          setOrders(cachedPlacedOrders);
        } else if (isDemo) {
          setOrders(STITCH_DEMO_ORDERS);
        } else {
          setOrders([]);
        }
      })
      .catch((err) => {
        console.warn('Orders fetch error:', err.message);
        if (cachedPlacedOrders.length > 0) {
          setOrders(cachedPlacedOrders);
        } else if (isDemo) {
          setOrders(STITCH_DEMO_ORDERS);
        } else {
          setOrders([]);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user]);

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setIsCancelling(true);
    try {
      await api.orders.cancel(cancelModalOrder._id, cancelReason);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === cancelModalOrder._id
            ? { ...o, deliveryStatus: 'cancelled', cancellationReason: cancelReason }
            : o
        )
      );
      showToast(`Order #${cancelModalOrder._id} cancelled. Reserved stock released.`);
      setCancelModalOrder(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnModalOrder) return;
    setIsReturning(true);
    try {
      await api.orders.requestReturn(returnModalOrder._id, returnReason);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === returnModalOrder._id
            ? {
                ...o,
                deliveryStatus: 'returned',
                returnReason,
                paymentStatus: 'refunded',
                refundStatus: 'completed',
                refundAmount: o.totalAmount
              }
            : o
        )
      );
      showToast(`Return requested for #${returnModalOrder._id}. Instant refund initiated.`);
      setReturnModalOrder(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit return request.');
    } finally {
      setIsReturning(false);
    }
  };

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === 'transit') {
        if (order.deliveryStatus !== 'shipped' && order.deliveryStatus !== 'pending') return false;
      } else if (activeTab === 'delivered') {
        if (order.deliveryStatus !== 'delivered') return false;
      } else if (activeTab === 'cancelled') {
        if (order.deliveryStatus !== 'cancelled') return false;
      } else if (activeTab === 'returns') {
        if (order.deliveryStatus !== 'returned') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order._id.toLowerCase().includes(q);
        const matchesItem = order.items.some((item) =>
          item.name.toLowerCase().includes(q) || (item.variant && item.variant.toLowerCase().includes(q))
        );
        const matchesAddress = order.shippingAddress.fullName.toLowerCase().includes(q);
        if (!matchesId && !matchesItem && !matchesAddress) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Tab counts
  const transitCount = orders.filter((o) => o.deliveryStatus === 'shipped' || o.deliveryStatus === 'pending').length;
  const deliveredCount = orders.filter((o) => o.deliveryStatus === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.deliveryStatus === 'cancelled').length;

  const handleBuyAgain = (item: any) => {
    addItem(
      {
        _id: item.product || 'item_repeat',
        name: item.name,
        description: '',
        price: item.price,
        originalPrice: Math.round(item.price * 1.25),
        stock: 10,
        category: { _id: 'cat_electronics', name: 'Electronics', slug: 'electronics' },
        seller: { _id: 'seller_01', username: 'OMIZON Retail' },
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        status: 'active',
        rating: 4.8,
        reviewCount: 140,
        badge: 'REPEAT BUY',
      },
      1,
      item.variant
    );
    showToast(`Added "${item.name}" to your shopping cart!`);
  };

  const handleDownloadInvoice = (order: Order) => {
    showToast(`Generating GST Tax Invoice for #${order._id}... Downloading PDF`);
    const invoiceContent = `========================================================\nOMIZON MARKETPLACE — TAX INVOICE\nOrder ID: ${order._id}\nDate: ${order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}\nStatus: ${order.paymentStatus.toUpperCase()}\nBilled to: ${order.shippingAddress.fullName}\nTotal: ₹${order.totalAmount.toLocaleString('en-IN')}\n========================================================`;
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${order._id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AccountLayout activeKey="orders">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-xl shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-body-md font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full flex flex-col">
        {/* Top Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-on-surface-variant font-body-sm text-xs mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="text-outline-variant">/</span>
          <Link to="/account" className="hover:text-primary transition-colors">Account</Link>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-semibold">Your Orders</span>
        </nav>

        {/* Header Section with Title & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-surface-container-highest/60 mb-8">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="font-headline-lg text-on-surface tracking-tight font-bold text-3xl sm:text-4xl">
                Your Orders
              </h1>
              <span className="font-body-md text-on-surface-variant font-medium text-sm">
                ({orders.length} orders placed in 2024)
              </span>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1.5 text-sm">
              Manage past purchases, monitor live shipments, and track returns or invoices.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by item, brand, or ID..."
                className="w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface font-body-md text-sm rounded-xl border border-outline-variant/30 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <Search className="w-5 h-5 text-outline absolute left-3 top-3" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-outline hover:text-on-surface"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Timeframe selector */}
            <div className="relative shrink-0">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                aria-label="Order Timeframe Filter"
                className="h-11 px-3.5 bg-surface-container-low text-on-surface font-body-md text-sm rounded-xl border border-outline-variant/20 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="3months">Past 3 months</option>
                <option value="6months">Past 6 months</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="archived">Archived Orders</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full font-title-sm text-xs font-semibold transition-all shrink-0 shadow-sm ${
              activeTab === 'all'
                ? 'bg-inverse-surface text-inverse-on-surface'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('transit')}
            className={`px-4 py-2 rounded-full font-title-sm text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 shadow-sm ${
              activeTab === 'transit'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>In Transit</span>
            {transitCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${activeTab === 'transit' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                {transitCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-4 py-2 rounded-full font-title-sm text-xs font-semibold transition-all shrink-0 shadow-sm ${
              activeTab === 'delivered'
                ? 'bg-inverse-surface text-inverse-on-surface'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            Delivered ({deliveredCount})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2 rounded-full font-title-sm text-xs font-semibold transition-all shrink-0 shadow-sm ${
              activeTab === 'cancelled'
                ? 'bg-inverse-surface text-inverse-on-surface'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-4 py-2 rounded-full font-title-sm text-xs font-semibold transition-all shrink-0 shadow-sm ${
              activeTab === 'returns'
                ? 'bg-inverse-surface text-inverse-on-surface'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            Returns & Refunds
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-on-surface-variant">Loading your order history...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-12 text-center max-w-xl mx-auto border border-outline-variant/20 shadow-sm my-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-headline-md text-on-surface font-bold text-xl">
              No orders found matching criteria
            </h3>
            <p className="font-body-md text-on-surface-variant text-sm mt-2 mb-6">
              {searchQuery
                ? `No orders matched "${searchQuery}". Check the order ID or search terms.`
                : 'You have no orders in this category yet. Explore our latest products and exclusive deals.'}
            </p>
            <div className="flex items-center gap-3">
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              ) : (
                <Button variant="primary" onClick={() => navigate('/products')}>
                  Explore Catalog
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Order Cards Grid / List */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="flex flex-col gap-6">
            {filteredOrders.map((order) => {
              const inTransit = order.deliveryStatus === 'shipped' || order.deliveryStatus === 'pending';
              const isDelivered = order.deliveryStatus === 'delivered';
              const isCancelled = order.deliveryStatus === 'cancelled';

              return (
                <article
                  key={order._id}
                  className="order-card bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden relative transition-all duration-300 hover:shadow-md"
                >
                  {/* Gradient Top Strip */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container" />

                  {/* Order Header Strip */}
                  <div className="bg-surface-container-low/70 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/15">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-outline uppercase tracking-wider text-[11px]">
                          Order Placed
                        </span>
                        <span className="font-title-sm text-on-surface font-semibold text-sm">
                          {formatDate(order.createdAt || '')}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="font-label-sm text-outline uppercase tracking-wider text-[11px]">
                          Total
                        </span>
                        <span className="font-title-sm text-on-surface font-bold text-sm">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      {/* Ship To popover */}
                      <div className="flex flex-col relative">
                        <span className="font-label-sm text-outline uppercase tracking-wider text-[11px]">
                          Ship To
                        </span>
                        <button
                          type="button"
                          onClick={() => setActivePopoverId(activePopoverId === order._id ? null : order._id)}
                          className="font-title-sm text-primary font-semibold text-sm flex items-center gap-0.5 hover:underline focus:outline-none"
                        >
                          <span>{order.shippingAddress.fullName.split(' ')[0]}</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Popover overlay */}
                        {activePopoverId === order._id && (
                          <div className="absolute left-0 top-full mt-2 z-30 w-72 p-4 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 text-on-surface text-xs flex flex-col gap-1">
                            <p className="font-bold text-sm text-on-surface">{order.shippingAddress.fullName}</p>
                            <p className="text-on-surface-variant">{order.shippingAddress.addressLine}</p>
                            <p className="text-on-surface-variant">
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                            </p>
                            <p className="text-on-surface-variant font-medium mt-1">Phone: {order.shippingAddress.phone}</p>
                            <button
                              type="button"
                              onClick={() => setActivePopoverId(null)}
                              className="mt-2 text-primary font-bold hover:underline text-right"
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Reference & Quick links */}
                    <div className="flex flex-col text-right">
                      <span className="font-label-sm text-outline uppercase tracking-wider text-[11px]">
                        Order #{order._id}
                      </span>
                      <div className="flex items-center gap-2 justify-end mt-0.5">
                        <Link
                          to={`/account/orders/${order._id}`}
                          className="font-title-sm text-xs text-primary hover:text-secondary font-semibold hover:underline"
                        >
                          View Order Details
                        </Link>
                        <span className="text-outline-variant font-body-sm text-xs">|</span>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(order)}
                          className="font-title-sm text-xs text-primary hover:text-secondary font-semibold hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Invoice</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Main Body */}
                  <div className="p-6 flex flex-col gap-6">
                    {/* Live Tracker Bar Banner */}
                    <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-4 border border-outline-variant/10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {inTransit ? (
                            <>
                              <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                              </span>
                              <span className="font-title-md text-primary font-bold text-base">
                                Arriving Today by 8:00 PM
                              </span>
                              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Out for Delivery
                              </span>
                            </>
                          ) : isDelivered ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              <span className="font-title-md text-on-surface font-bold text-base">
                                Delivered on {formatDate(order.createdAt || '')}
                              </span>
                              <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Signed & Verified
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-500" />
                              <span className="font-title-md text-on-surface font-bold text-base">
                                Order Cancelled
                              </span>
                              <span className="bg-red-500/10 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Refund Credited
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-xs">
                          <Zap className="w-4 h-4 text-primary" />
                          <span>Fulfilled by <strong className="text-on-surface">OMIZON Prime FastX</strong></span>
                        </div>
                      </div>

                      {/* 4-Step Progress Line */}
                      <div className="w-full pt-2 pb-1">
                        <div className="grid grid-cols-4 relative">
                          {/* Progress track background */}
                          <div className="absolute top-3 left-[12.5%] right-[12.5%] h-1 bg-surface-container-highest z-0" />
                          <div
                            className="absolute top-3 left-[12.5%] h-1 bg-primary z-0 transition-all duration-700"
                            style={{
                              width: inTransit ? '65%' : isDelivered ? '75%' : '0%',
                            }}
                          />

                          {/* Step 1: Placed */}
                          <div className="flex flex-col items-center text-center z-10">
                            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              ✓
                            </div>
                            <span className="font-label-sm font-semibold text-on-surface text-[11px] mt-1.5">
                              Placed
                            </span>
                          </div>

                          {/* Step 2: Confirmed */}
                          <div className="flex flex-col items-center text-center z-10">
                            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              ✓
                            </div>
                            <span className="font-label-sm font-semibold text-on-surface text-[11px] mt-1.5">
                              Packed
                            </span>
                          </div>

                          {/* Step 3: Shipped / Out for delivery */}
                          <div className="flex flex-col items-center text-center z-10">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                              inTransit || isDelivered ? 'bg-primary text-white' : 'bg-surface-container-high text-outline'
                            }`}>
                              {inTransit ? <Truck className="w-3.5 h-3.5" /> : isDelivered ? '✓' : '3'}
                            </div>
                            <span className={`font-label-sm font-semibold text-[11px] mt-1.5 ${
                              inTransit ? 'text-primary' : 'text-on-surface'
                            }`}>
                              {inTransit ? 'Out for Delivery' : 'Shipped'}
                            </span>
                          </div>

                          {/* Step 4: Delivered */}
                          <div className="flex flex-col items-center text-center z-10">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                              isDelivered ? 'bg-primary text-white' : 'bg-surface-container-high text-outline'
                            }`}>
                              {isDelivered ? '✓' : '4'}
                            </div>
                            <span className={`font-label-sm font-semibold text-[11px] mt-1.5 ${
                              isDelivered ? 'text-emerald-600' : 'text-outline'
                            }`}>
                              Delivered
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ordered items in package */}
                    <div className="flex flex-col gap-4">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/10 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                              <Package className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-title-sm text-on-surface font-semibold text-sm line-clamp-1">
                                {item.name}
                              </h4>
                              <p className="font-body-sm text-outline text-xs mt-0.5">
                                Spec: {item.variant || 'Standard'} • Qty: {item.quantity}
                              </p>
                              <span className="font-title-sm text-on-surface font-bold text-sm mt-1 block">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                          </div>

                          {/* Item quick action buttons */}
                          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                            {inTransit && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setTrackingModalOrder(order)}
                                  icon={<Truck className="w-3.5 h-3.5" />}
                                >
                                  Track Package
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCancelModalOrder(order)}
                                  className="text-rose-600 dark:text-rose-400 hover:border-rose-400"
                                >
                                  Cancel Order
                                </Button>
                              </>
                            )}
                            {isDelivered && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReturnModalOrder(order)}
                                icon={<RotateCcw className="w-3.5 h-3.5" />}
                              >
                                Return Item
                              </Button>
                            )}
                            {order.deliveryStatus === 'returned' && (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                Refund Credited ({formatCurrency(order.totalAmount)})
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBuyAgain(item)}
                              icon={<ShoppingBag className="w-3.5 h-3.5" />}
                            >
                              Buy It Again
                            </Button>
                            <Link to={`/account/orders/${order._id}`}>
                              <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Priority Concierge Help Banner */}
        <div className="mt-12 bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-title-md text-on-surface font-bold text-base">
                Facing issues with a recent shipment or payment?
              </h4>
              <p className="font-body-sm text-on-surface-variant text-sm mt-0.5">
                Our 24x7 OMIZON Priority Concierge is available for instantaneous resolution and order disputes.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Connecting to 24x7 OMIZON Priority Support...')}
            className="shrink-0"
          >
            Contact Customer Care
          </Button>
        </div>
      </div>

      {/* Live Tracking Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-white" />
                <span className="font-headline-sm text-base font-bold">
                  Live Tracking: #{trackingModalOrder._id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Delivery Route Map Simulation */}
            <div className="w-full h-52 bg-slate-900 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#762FF2_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-10 flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary flex items-center justify-center mb-2">
                  <Truck className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Van 4 stops away from delivery location</span>
                </div>
                <p className="text-white/70 text-xs mt-1">
                  Delivery Associate: Rajesh K. (+91 99872 11094)
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15">
                <div>
                  <span className="font-label-sm text-outline uppercase text-[11px] block">
                    Estimated Handover
                  </span>
                  <span className="font-title-md text-primary font-bold text-lg">
                    Today, 3:45 PM – 4:15 PM
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-label-sm text-outline uppercase text-[11px] block">
                    Delivery Verification OTP
                  </span>
                  <span className="font-mono text-2xl font-bold text-on-surface tracking-widest text-primary">
                    4 8 1 9
                  </span>
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant leading-relaxed">
                Please share the 4-digit OTP with your OMIZON delivery executive only upon physical verification of the sealed tamper-proof carton.
              </div>

              <Button
                variant="primary"
                onClick={() => setTrackingModalOrder(null)}
                className="w-full justify-center"
              >
                Close Live Tracker
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 mb-4">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                Cancel Order #{cancelModalOrder._id}
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="text-outline hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="font-body-md text-sm text-on-surface-variant mb-4">
              Are you sure you want to cancel this order? Once cancelled, reserved inventory will be released and any charged amount will be refunded.
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
                onClick={() => setCancelModalOrder(null)}
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
      {returnModalOrder && (
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
                onClick={() => setReturnModalOrder(null)}
                className="text-outline hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="font-body-md text-sm text-on-surface-variant mb-4">
              Submit a return request for Order #{returnModalOrder._id}. Our FastX logistics executive will pick up the package from your doorstep.
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
              Refund of <strong>{formatCurrency(returnModalOrder.totalAmount)}</strong> will be credited to your original payment method immediately upon courier doorstep scan.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReturnModalOrder(null)}
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
                {isReturning ? 'Processing...' : 'Submit Return Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default OrdersPage;
