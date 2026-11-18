import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AccountLayout } from '../../components/account/AccountLayout';
import { api } from '../../services/api';
import { Order, Product } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { SavedAddressItem } from '../../components/checkout/DeliveryAddressSection';
import {
  getStableUserId,
  getAccountProfile,
  getAccountAddresses,
  getAccountWishlist,
  setAccountWishlist,
  getAccountLastOrder,
} from '../../utils/accountStorage';

export const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const userId = getStableUserId(user);

  // Dynamic user data
  const rawUsername = user?.username || '';
  const parsedName = rawUsername
    ? rawUsername
        .split(/[_\s-]/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ')
    : 'Valued Customer';
  const firstName = parsedName.split(' ')[0] || 'Valued';

  // Read saved profile enhancements scoped to the active account
  const [profileData, setProfileData] = useState(() => getAccountProfile(userId));

  const displayFirstName = profileData?.firstName || firstName;
  const displayEmail = profileData?.email || user?.email || null;
  const displayPhone = profileData?.phone || null;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  // Orders state (fetched from real backend API)
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderFetchError, setOrderFetchError] = useState<string | null>(null);

  // Address state: dynamically loads from account-scoped storage, or null if none saved
  const [defaultAddress, setDefaultAddress] = useState<SavedAddressItem | null>(() => {
    const saved = getAccountAddresses(userId);
    if (saved && saved.length > 0) {
      return saved.find((a: SavedAddressItem) => a.isDefault) || saved[0];
    }
    return null;
  });
  const [addressCount, setAddressCount] = useState<number>(() => {
    const saved = getAccountAddresses(userId);
    return saved ? saved.length : 0;
  });

  // Wishlist preview state: dynamically loads saved items scoped to account, or empty array if none saved
  const [wishlistItems, setWishlistItems] = useState<any[]>(() => {
    const saved = getAccountWishlist(userId);
    if (saved && saved.length > 0) return saved.slice(0, 2);
    return [];
  });
  const [totalWishlistCount, setTotalWishlistCount] = useState<number>(() => {
    const saved = getAccountWishlist(userId);
    return saved ? saved.length : 0;
  });

  // Synchronize account-scoped state whenever the active user changes
  useEffect(() => {
    const p = getAccountProfile(userId);
    setProfileData(p);

    const addr = getAccountAddresses(userId);
    if (addr && addr.length > 0) {
      setDefaultAddress(addr.find((a: SavedAddressItem) => a.isDefault) || addr[0]);
      setAddressCount(addr.length);
    } else {
      setDefaultAddress(null);
      setAddressCount(0);
    }

    const wish = getAccountWishlist(userId);
    if (wish && wish.length > 0) {
      setWishlistItems(wish.slice(0, 2));
      setTotalWishlistCount(wish.length);
    } else {
      setWishlistItems([]);
      setTotalWishlistCount(0);
    }
  }, [userId]);

  // Toast feedback state
  const [toast, setToast] = useState<{
    message: string;
    isError?: boolean;
    actionLabel?: string;
    actionPath?: string;
  } | null>(null);

  const showToast = (message: string, isError = false, actionLabel?: string, actionPath?: string) => {
    setToast({ message, isError, actionLabel, actionPath });
    setTimeout(() => setToast(null), 4500);
  };

  // Fetch real orders from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchUserOrders() {
      setIsLoadingOrders(true);
      setOrderFetchError(null);
      try {
        const res = await api.orders.list({ limit: 10 });
        if (isMounted) {
          if (res && Array.isArray(res.orders)) {
            setOrders(res.orders);
          } else {
            setOrders([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          try {
            const cached = getAccountLastOrder(userId);
            if (cached) {
              setOrders([cached]);
            } else {
              setOrders([]);
            }
          } catch {
            setOrders([]);
          }
        }
      } finally {
        if (isMounted) setIsLoadingOrders(false);
      }
    }
    fetchUserOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Buy Again action: never fabricate fake product objects
  const handleBuyAgain = async (item: any) => {
    try {
      const productId = typeof item.product === 'object' ? item.product?._id : item.product;
      let targetProduct: Product | null = null;

      // Check if item.product is already a complete, valid product
      if (
        typeof item.product === 'object' &&
        item.product?._id &&
        item.product?.name &&
        typeof item.product?.price === 'number' &&
        item.product.price > 0 &&
        item.product?.image
      ) {
        targetProduct = item.product;
      } else if (productId && /^[0-9a-fA-F]{24}$/.test(productId)) {
        // Retrieve actual product data through the existing API
        try {
          const res = await api.products.getById(productId);
          if (res?.product && res.product._id && typeof res.product.price === 'number' && res.product.price > 0) {
            targetProduct = res.product;
          }
        } catch {
          // If offline or not found, targetProduct remains null
        }
      }

      // If a real product cannot be retrieved or validated, display honest feedback
      if (!targetProduct) {
        showToast(
          `"${item?.name || 'This item'}" is currently unavailable or could not be found in the catalog.`,
          true,
          'Browse Catalog',
          '/products'
        );
        return;
      }

      await addItem(targetProduct, 1, item.variant || 'default');
      showToast(`Added "${targetProduct.name}" to your cart!`);
    } catch {
      showToast('Could not add item to cart. Please try again.', true, 'Browse Catalog', '/products');
    }
  };

  // Handle Move to Cart from Wishlist: validates real data and never injects fake IDs
  const handleMoveToCart = async (item: any) => {
    try {
      const productId = item.id || item._id || item.product;
      let targetProduct: Product | null = null;

      if (
        (item._id || item.id) &&
        item.name &&
        typeof item.price === 'number' &&
        item.price > 0 &&
        item.image &&
        item.category
      ) {
        targetProduct = {
          _id: item._id || item.id,
          name: item.name,
          description: item.description || item.specs || '',
          price: item.price,
          originalPrice: item.originalPrice,
          stock: typeof item.stock === 'number' ? item.stock : 10,
          category: item.category,
          image: item.image,
          status: item.status || 'active',
        };
      } else if (productId && /^[0-9a-fA-F]{24}$/.test(productId)) {
        try {
          const res = await api.products.getById(productId);
          if (res?.product && res.product._id && typeof res.product.price === 'number' && res.product.price > 0) {
            targetProduct = res.product;
          }
        } catch {}
      }

      if (!targetProduct) {
        showToast(
          `"${item?.name || 'This saved item'}" is currently unavailable in the catalog.`,
          true,
          'Browse Products',
          '/products'
        );
        return;
      }

      await addItem(targetProduct, 1);

      // Remove from account-scoped wishlist
      try {
        const saved = getAccountWishlist(userId);
        if (saved && Array.isArray(saved)) {
          const updated = saved.filter((w: any) => (w.id || w._id) !== productId);
          setAccountWishlist(userId, updated);
          setWishlistItems(updated.slice(0, 2));
          setTotalWishlistCount(updated.length);
        }
      } catch {}

      showToast(`Moved "${targetProduct.name}" to your cart!`);
    } catch {
      showToast('Could not move item to cart. Please try again.', true, 'Browse Products', '/products');
    }
  };

  return (
    <AccountLayout activeKey="overview">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 animate-fade-in max-w-md">
          <div className="bg-ink text-text-dark-primary px-space-md py-space-sm rounded-lg shadow-xl flex items-center justify-between gap-space-sm font-label-md text-label-md border border-lavender-mist/20">
            <div className="flex items-center gap-space-sm">
              <span className={`material-symbols-outlined text-[18px] ${toast.isError ? 'text-semantic-error' : 'text-semantic-success'}`}>
                {toast.isError ? 'error' : 'check_circle'}
              </span>
              <span>{toast.message}</span>
            </div>
            {toast.actionLabel && toast.actionPath && (
              <Link
                to={toast.actionPath}
                className="underline text-tertiary-fixed hover:text-white font-semibold text-xs ml-2 shrink-0"
              >
                {toast.actionLabel}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col w-full">
        {/* Top Profile Welcome & Meta Header */}
        <section className="mb-space-lg pb-space-lg border-b border-lavender-mist">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-space-md">
            <div className="space-y-1">
              <h1 className="font-headline-md text-headline-md text-ink tracking-tight font-semibold">
                Welcome back, {displayFirstName}
              </h1>
              <p className="font-body-md text-body-md text-ink-muted">
                Manage your purchases, delivery addresses, and personal details from your OMIZON account.
              </p>
            </div>
            <Link
              to="/account/personal-info"
              className="inline-flex items-center gap-1.5 text-primary hover:text-royal-purple font-label-md text-label-md transition-colors self-start lg:self-center font-semibold"
            >
              <span>Edit Personal Details</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {/* Inline Meta String */}
          <div className="mt-space-md pt-space-sm flex flex-wrap items-center gap-y-2 gap-x-4 text-ink-subtle font-body-sm text-body-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-ink-muted">schedule</span>
              <span>
                {memberSince ? (
                  <>Member since <strong className="font-semibold text-ink">{memberSince}</strong></>
                ) : (
                  <strong className="font-semibold text-ink">Active Customer</strong>
                )}
              </span>
            </div>
            {displayPhone && (
              <>
                <span className="text-lavender-mist">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">smartphone</span>
                  <span className="text-ink font-body-sm">{displayPhone}</span>
                </div>
              </>
            )}
            {displayEmail && (
              <>
                <span className="text-lavender-mist">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">alternate_email</span>
                  <span className="text-ink font-body-sm">{displayEmail}</span>
                </div>
              </>
            )}
            <span className="text-lavender-mist">•</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-low text-ink font-label-sm text-label-sm font-medium">
              Buyer Account
            </span>
          </div>
        </section>

        {/* Local Browser Storage Notice */}
        <div className="mb-space-lg p-space-sm px-space-md bg-surface-container-low border border-lavender-mist/60 rounded-lg flex items-center gap-2 text-ink-muted font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-[18px] text-ink-subtle">sync_disabled</span>
          <span>
            <strong>Local Browser Storage:</strong> Your profile preferences, saved addresses, and wishlist are stored locally in this browser per account until cleared. They are not synchronized across devices.
          </span>
        </div>

        {/* Recent Purchases Section */}
        <section className="mb-space-xl">
          <div className="flex items-baseline justify-between mb-space-md">
            <div>
              <h2 className="font-title-lg text-title-lg text-ink font-semibold">Recent Purchases</h2>
              <p className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                Track live parcel movements, download GST tax receipts, or repurchase.
              </p>
            </div>
            <Link
              to="/account/orders"
              className="inline-flex items-center gap-1 text-primary hover:text-royal-purple font-label-md text-label-md transition-colors font-medium"
            >
              <span>View All Orders ({orders.length})</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {/* Order Rows Container */}
          <div className="bg-surface-container-lowest border border-lavender-mist rounded-lg overflow-hidden divide-y divide-lavender-mist">
            {isLoadingOrders ? (
              // Skeleton loading state
              <div className="p-space-lg flex flex-col gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-surface-container-low rounded-lg" />
                      <div className="flex flex-col gap-2">
                        <div className="w-32 h-4 bg-surface-container-low rounded" />
                        <div className="w-48 h-3 bg-surface-container-low rounded" />
                      </div>
                    </div>
                    <div className="w-24 h-8 bg-surface-container-low rounded" />
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              // Real Orders List (Top 3)
              orders.slice(0, 3).map((order) => {
                const firstItem = order.items?.[0];
                const itemName = firstItem?.name || 'OMIZON Marketplace Order';
                const formattedDate = order.createdAt ? formatDate(order.createdAt) : 'Recent';
                const isDelivered = order.deliveryStatus === 'delivered';
                const isShipped = order.deliveryStatus === 'shipped';

                return (
                  <article
                    key={order._id}
                    className="p-space-md hover:bg-porcelain/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-space-md"
                  >
                    <div className="flex items-center gap-space-md min-w-0">
                      <div className="w-20 h-20 flex-shrink-0 bg-porcelain rounded-lg overflow-hidden border border-lavender-mist flex items-center justify-center p-1.5">
                        <img
                          alt={itemName}
                          className="w-full h-full object-contain"
                          src={
                            (firstItem?.product as any)?.image ||
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
                          }
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                              isDelivered
                                ? 'bg-[#EBF7F2] text-[#00875A]'
                                : isShipped
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDelivered ? 'bg-[#00875A]' : isShipped ? 'bg-blue-600' : 'bg-amber-500'
                              }`}
                            />
                            {isDelivered
                              ? `Delivered on ${formattedDate}`
                              : isShipped
                              ? 'Shipped / In Transit'
                              : 'Processing'}
                          </span>
                          <span className="text-ink-subtle font-label-sm text-label-sm">
                            • #{order._id.length > 14 ? `OMZ-${order._id.slice(-6).toUpperCase()}` : order._id}
                          </span>
                        </div>
                        <h3 className="font-title-sm text-title-sm text-ink font-semibold truncate">
                          {itemName}
                        </h3>
                        <p className="font-body-sm text-body-sm text-ink-muted mt-0.5">
                          Ordered on {formattedDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-space-lg flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-lavender-mist">
                      <div className="text-left md:text-right">
                        <span className="block font-label-sm text-label-sm text-ink-subtle">Amount Paid</span>
                        <span className="font-price-card text-price-card text-ink tabular-nums">
                          {formatCurrency(order.totalAmount || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/account/orders/${order._id}`}
                          className="px-3 py-1.5 rounded-lg border border-lavender-mist bg-surface-container-lowest text-ink hover:border-primary hover:text-primary font-label-md text-label-md transition-all inline-block"
                        >
                          Order Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleBuyAgain(firstItem)}
                          className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-royal-purple text-on-primary font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">replay</span>
                          <span>Buy Again</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              // Clean Empty State when 0 orders exist
              <div className="p-space-xl text-center flex flex-col items-center justify-center gap-2">
                <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-ink-subtle mb-1">
                  <span className="material-symbols-outlined text-[28px]">package_2</span>
                </div>
                <h3 className="font-title-md text-title-md text-ink font-semibold">No purchases yet</h3>
                <p className="font-body-sm text-body-sm text-ink-muted max-w-sm">
                  When you place orders on OMIZON, your live parcel movements, GST tax receipts, and order tracking will appear here.
                </p>
                <Link
                  to="/products"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-royal-purple text-on-primary font-label-md text-label-md transition-colors shadow-sm"
                >
                  <span>Explore Catalog</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Two-Column Lower Utility Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-space-xl">
          {/* Left Column: Default Delivery Address (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-space-lg bg-surface-container-lowest border border-lavender-mist rounded-lg shadow-sm">
            {defaultAddress ? (
              <>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-space-md">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-ink text-[20px]">location_on</span>
                      <h2 className="font-title-md text-title-md text-ink font-semibold">Delivery Address</h2>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                      Primary Default
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-title-sm text-title-sm text-ink font-semibold">
                      {defaultAddress.fullName}
                    </div>
                    <p className="font-body-md text-body-md text-ink-muted leading-relaxed">
                      {defaultAddress.addressLine}
                      <br />
                      {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
                    </p>
                    {defaultAddress.phone && (
                      <div className="pt-2 flex items-center gap-1.5 text-ink-muted font-body-sm text-body-sm">
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>{defaultAddress.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-space-lg mt-space-md border-t border-lavender-mist flex items-center justify-between text-body-sm font-label-md">
                  <Link to="/account/addresses" className="text-ink hover:text-primary transition-colors font-medium">
                    Edit Address
                  </Link>
                  <Link
                    to="/account/addresses"
                    className="text-primary hover:text-royal-purple inline-flex items-center gap-1 transition-colors font-medium"
                  >
                    <span>Manage Saved Addresses ({addressCount})</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center my-auto">
                <span className="material-symbols-outlined text-ink-subtle text-[32px] mb-2">location_off</span>
                <h3 className="font-title-sm text-title-sm text-ink font-semibold">No Delivery Address Saved</h3>
                <p className="font-body-sm text-body-sm text-ink-muted mt-1 max-w-xs">
                  Save your home or delivery address for faster one-click checkout.
                </p>
                <Link
                  to="/account/addresses"
                  className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink font-label-md text-label-md transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add Delivery Address</span>
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Wishlist Preview (7 cols) */}
          <div className="lg:col-span-7 p-space-lg bg-surface-container-lowest border border-lavender-mist rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-space-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-ink text-[20px]">favorite</span>
                  <h2 className="font-title-md text-title-md text-ink font-semibold">Saved for Later</h2>
                </div>
                <Link
                  to="/account/wishlist"
                  className="inline-flex items-center gap-1 text-primary hover:text-royal-purple font-label-md text-label-md transition-colors font-medium"
                >
                  <span>View Full Wishlist ({totalWishlistCount})</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              </div>

              {/* Wishlist Items List or Clean Empty State */}
              {wishlistItems.length > 0 ? (
                <div className="space-y-3">
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id || item._id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-lavender-mist hover:border-primary/40 transition-colors gap-3 bg-porcelain/40"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 bg-surface-container-lowest rounded border border-lavender-mist flex-shrink-0 flex items-center justify-center p-1">
                          <img alt={item.name} className="w-full h-full object-contain" src={item.image} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-title-sm text-title-sm text-ink font-semibold truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-body-md text-body-md text-ink font-bold tabular-nums">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="text-ink-subtle text-[11px]">•</span>
                            <span className="font-label-sm text-label-sm text-[#00875A] font-semibold">
                              {item.inStock !== false ? 'In Stock' : 'Low Stock'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(item)}
                        className="flex-shrink-0 px-3 py-1.5 rounded bg-surface-container-lowest border border-lavender-mist hover:border-primary hover:text-primary text-ink font-label-md text-label-md transition-all flex items-center gap-1 shadow-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                        <span>Move to Cart</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center my-auto">
                  <span className="material-symbols-outlined text-ink-subtle text-[32px] mb-2">favorite_border</span>
                  <h3 className="font-title-sm text-title-sm text-ink font-semibold">Your Wishlist is Empty</h3>
                  <p className="font-body-sm text-body-sm text-ink-muted mt-1 max-w-xs">
                    Save products to your wishlist while browsing to track prices and availability.
                  </p>
                  <Link
                    to="/shop"
                    className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink font-label-md text-label-md transition-colors font-medium"
                  >
                    <span>Browse Products</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </Link>
                </div>
              )}
            </div>
            {wishlistItems.length > 0 && (
              <div className="pt-3 text-right">
                <span className="font-body-sm text-body-sm text-ink-subtle">
                  Items saved in your wishlist remain reserved at current prices for 48 hours.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Quick Account Shortcuts Strip */}
        <section className="border-t border-lavender-mist pt-space-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm text-ink-muted">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-ink-subtle text-[20px]">help_outline</span>
              <span className="font-title-sm text-title-sm text-ink font-medium">
                Need immediate assistance with an order?
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-space-md gap-y-2 font-label-md text-label-md">
              <a
                href="#help"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('OMIZON 24x7 Priority Support: support@omizon.in or 1800-266-4966');
                }}
                className="text-ink hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>Visit OMIZON Help Centre</span>
                <span className="material-symbols-outlined text-[14px]">north_east</span>
              </a>
              <span className="text-lavender-mist hidden sm:inline">•</span>
              <Link
                to="/account/orders?filter=returns"
                className="text-ink hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>Track a Return or Replacement</span>
                <span className="material-symbols-outlined text-[14px]">north_east</span>
              </Link>
              <span className="text-lavender-mist hidden sm:inline">•</span>
              <Link
                to="/account/orders"
                className="text-ink hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>Download Tax Invoices</span>
                <span className="material-symbols-outlined text-[14px]">north_east</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AccountLayout>
  );
};

export default AccountPage;
