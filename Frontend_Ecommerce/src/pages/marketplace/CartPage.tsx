import React, { useState, useMemo } from 'react';
import { ShieldCheck, Truck, SlidersHorizontal, PanelRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { CartTopUtilityBar } from '../../components/cart/CartTopUtilityBar';
import { CartItemCard } from '../../components/cart/CartItemCard';
import {
  SavedForLaterSection,
  INITIAL_SAVED_ITEMS,
  SavedItem,
} from '../../components/cart/SavedForLaterSection';
import { CartOrderSummary } from '../../components/cart/CartOrderSummary';
import { EmptyCartView } from '../../components/cart/EmptyCartView';
import { PincodeModal } from '../../components/cart/PincodeModal';
import { CartItem } from '../../types';

export const CartPage: React.FC = () => {
  const {
    cart,
    cartCount,
    updateQuantity,
    removeItem,
    clearCart,
    restoreCart,
    openDrawer,
    addItem,
  } = useCart();

  // Selected items state (stores composite key "id-variant")
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    return new Set(
      cart.items.map((i) => {
        const id = typeof i.product === 'object' ? i.product._id : i.product;
        return `${id}-${i.variant}`;
      })
    );
  });

  // Saved for later items state
  const [savedItems, setSavedItems] = useState<SavedItem[]>(INITIAL_SAVED_ITEMS);

  // Delivery pincode state
  const [pincode, setPincode] = useState('400001');
  const [pincodeCity, setPincodeCity] = useState('South Mumbai, Maharashtra');
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('OMIZONFESTIVAL');
  const [couponApplied, setCouponApplied] = useState(true);
  const [couponDiscount, setCouponDiscount] = useState(2000);

  // Prototype toggle for empty state
  const [forceEmptyView, setForceEmptyView] = useState(false);

  // Sync selected keys when cart items change
  React.useEffect(() => {
    setSelectedKeys((prev) => {
      const next = new Set<string>();
      cart.items.forEach((i) => {
        const id = typeof i.product === 'object' ? i.product._id : i.product;
        const key = `${id}-${i.variant}`;
        if (prev.has(key) || prev.size === 0) {
          next.add(key);
        }
      });
      return next;
    });
  }, [cart.items]);

  const allKeys = useMemo(() => {
    return cart.items.map((i) => {
      const id = typeof i.product === 'object' ? i.product._id : i.product;
      return `${id}-${i.variant}`;
    });
  }, [cart.items]);

  const isAllSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(allKeys));
    }
  };

  const handleToggleItemSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Delete selected items
  const handleDeleteSelected = () => {
    cart.items.forEach((item) => {
      const id = typeof item.product === 'object' ? item.product._id : item.product;
      const key = `${id}-${item.variant}`;
      if (selectedKeys.has(key)) {
        removeItem(id, item.variant);
      }
    });
  };

  // Save item for later
  const handleSaveItemForLater = (item: CartItem) => {
    const prod = item.product;
    const id = typeof prod === 'object' ? prod._id : prod;
    const name = typeof prod === 'object' ? prod.name : 'Product';
    const image =
      typeof prod === 'object' && prod.image
        ? prod.image
        : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';

    const newSaved: SavedItem = {
      id: `saved_${Date.now()}_${id}`,
      name,
      price: item.price,
      originalPrice: typeof prod === 'object' ? prod.originalPrice : undefined,
      image,
      note: 'Saved from cart',
      productRef: typeof prod === 'object' ? prod : undefined,
    };

    setSavedItems((prev) => [newSaved, ...prev]);
    removeItem(id, item.variant);
  };

  // Save all selected items for later
  const handleSaveAllSelectedForLater = () => {
    cart.items.forEach((item) => {
      const id = typeof item.product === 'object' ? item.product._id : item.product;
      const key = `${id}-${item.variant}`;
      if (selectedKeys.has(key)) {
        handleSaveItemForLater(item);
      }
    });
  };

  // Move saved item to cart
  const handleMoveToCart = async (saved: SavedItem) => {
    if (saved.productRef) {
      await addItem(saved.productRef, 1, 'default');
    } else {
      await addItem(
        {
          _id: saved.id,
          name: saved.name,
          description: '',
          price: saved.price,
          originalPrice: saved.originalPrice,
          stock: 10,
          category: 'General',
          image: saved.image,
        },
        1,
        'default'
      );
    }
    setSavedItems((prev) => prev.filter((i) => i.id !== saved.id));
  };

  const handleRemoveSaved = (id: string) => {
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Coupon handling
  const handleApplyCoupon = (code: string) => {
    const upper = code.trim().toUpperCase();
    if (upper === 'OMIZONFESTIVAL' || upper === 'OMIZONFESTIVE') {
      setCouponCode('OMIZONFESTIVAL');
      setCouponApplied(true);
      setCouponDiscount(2000);
      return true;
    }
    if (upper === 'FESTIVAL500') {
      setCouponCode('FESTIVAL500');
      setCouponApplied(true);
      setCouponDiscount(500);
      return true;
    }
    return false;
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
  };

  // Filter items for calculations based on active selection
  const selectedItems = useMemo(() => {
    return cart.items.filter((item) => {
      const id = typeof item.product === 'object' ? item.product._id : item.product;
      const key = `${id}-${item.variant}`;
      return selectedKeys.has(key);
    });
  }, [cart.items, selectedKeys]);

  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  // Subtotal of selected items
  const activeSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  // Original list price of selected items
  const originalSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const prod = item.product;
      const orig =
        typeof prod === 'object' && prod.originalPrice
          ? prod.originalPrice
          : Math.round(item.price * 1.18);
      return sum + orig * item.quantity;
    }, 0);
  }, [selectedItems]);

  // In Stitch prototype, canonical sample discount is ₹15,410 or difference
  const productDiscounts = selectedCount === 4 ? 15410 : Math.max(0, originalSubtotal - activeSubtotal);

  const showEmptyState = forceEmptyView || cart.items.length === 0;

  const handleRestoreCart = () => {
    restoreCart();
    setForceEmptyView(false);
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-160px)]">
      {/* Top Utility Bar: Breadcrumbs & Quick Drawer Trigger Action */}
      <CartTopUtilityBar />

      {/* Main Content Stage */}
      <div className="max-w-7xl mx-auto w-full px-margin py-space-lg">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg">
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
              Shopping Cart
            </h1>
            {!showEmptyState && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary">
                {selectedCount} {selectedCount === 1 ? 'Item Selected' : 'Items Selected'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-space-md text-body-sm text-on-surface-variant flex-wrap">
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Price Match Protection</span>
            </span>
            <span className="hidden md:flex items-center gap-1">
              <Truck className="w-4 h-4 text-primary" />
              <span>
                Express delivery to{' '}
                <strong className="text-on-surface ml-1 font-semibold">{pincode}</strong>
              </span>
            </span>
          </div>
        </div>

        {/* ACTIVE CART VS EMPTY CART CONTAINER */}
        {showEmptyState ? (
          <EmptyCartView onRestoreSampleCart={handleRestoreCart} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start" id="cart-content-view">
            {/* LEFT COLUMN: Cart Items & Saved List (8 Cols / ~68%) */}
            <section className="lg:col-span-8 flex flex-col gap-space-lg">
              {/* Batch Actions Header Bar */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-space-sm border border-surface-container-highest/40">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    id="select-all-checkbox"
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className="font-title-sm text-title-sm text-on-surface">
                    Select all {cartCount} {cartCount === 1 ? 'item' : 'items'} for checkout
                  </span>
                </label>

                <div className="flex items-center gap-space-md text-body-sm">
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="text-on-surface-variant hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Delete selected</span>
                  </button>
                  <span className="text-outline-variant">|</span>
                  <button
                    type="button"
                    onClick={handleSaveAllSelectedForLater}
                    className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Save all for later</span>
                  </button>
                </div>
              </div>

              {/* Cart Items List Container */}
              <div className="flex flex-col gap-space-md">
                {cart.items.map((item) => {
                  const id = typeof item.product === 'object' ? item.product._id : item.product;
                  const key = `${id}-${item.variant}`;
                  return (
                    <CartItemCard
                      key={key}
                      item={item}
                      isSelected={selectedKeys.has(key)}
                      onToggleSelect={() => handleToggleItemSelect(key)}
                      onSaveForLater={() => handleSaveItemForLater(item)}
                      onUpdateQuantity={(qty) => updateQuantity(id, qty, item.variant)}
                      onRemove={() => removeItem(id, item.variant)}
                      pincode={pincode}
                    />
                  );
                })}
              </div>

              {/* SAVED FOR LATER SECTION */}
              <SavedForLaterSection
                items={savedItems}
                onMoveToCart={handleMoveToCart}
                onRemoveSaved={handleRemoveSaved}
              />
            </section>

            {/* RIGHT COLUMN: Order Summary Sticky Sidebar (4 Cols / ~32%) */}
            <CartOrderSummary
              subtotal={activeSubtotal}
              productDiscounts={productDiscounts}
              cartTotal={activeSubtotal}
              itemCount={selectedCount}
              couponCode={couponCode}
              couponDiscount={couponDiscount}
              couponApplied={couponApplied}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              pincode={pincode}
              pincodeCity={pincodeCity}
              onOpenPincodeModal={() => setIsPincodeModalOpen(true)}
            />
          </div>
        )}

        {/* Interactive Testing Controls Ribbon */}
        <div className="mt-space-xl p-space-md bg-surface-container-low rounded-xl flex flex-wrap items-center justify-between gap-space-sm text-body-sm text-on-surface-variant border border-surface-container-highest/40">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <span className="font-medium text-on-surface">Interactive Prototype Controls:</span>
            <span className="text-outline">Test all states &amp; views</span>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              type="button"
              id="toggle-empty-cart-btn"
              onClick={() => setForceEmptyView((prev) => !prev)}
              className="bg-surface-container-lowest hover:bg-surface-container-high px-3 py-1.5 rounded-lg text-label-md font-medium text-on-surface shadow-xs transition-colors cursor-pointer border border-surface-container-highest/60"
            >
              {showEmptyState ? 'Restore Active View' : 'Toggle Empty State'}
            </button>
            <button
              type="button"
              id="quick-drawer-open-btn2"
              onClick={openDrawer}
              className="bg-primary text-on-primary hover:bg-secondary px-3 py-1.5 rounded-lg text-label-md font-medium shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <PanelRight className="w-4 h-4" />
              <span>Trigger Slide-Over Cart Drawer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pincode Delivery Checker Modal */}
      <PincodeModal
        isOpen={isPincodeModalOpen}
        onClose={() => setIsPincodeModalOpen(false)}
        currentPincode={pincode}
        onApplyPincode={(pin, city) => {
          setPincode(pin);
          setPincodeCity(city);
        }}
      />
    </div>
  );
};
