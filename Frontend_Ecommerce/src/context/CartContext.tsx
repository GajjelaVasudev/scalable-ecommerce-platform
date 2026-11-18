import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, CartItem, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export const STITCH_DEFAULT_CART_ITEMS: CartItem[] = [
  {
    product: {
      _id: '2545922d18419b69f8ab9ee3',
      name: 'SoundPulse Studio Pro Wireless ANC Headphones',
      description: 'Midnight Matte Black • 40mm Beryllium Drivers • Spatial Audio',
      price: 22199,
      originalPrice: 24999,
      stock: 18,
      category: { _id: 'b4fa1458bcff238edf645aa5', name: 'Electronics', slug: 'electronics' },
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      seller: { _id: '6a7f809930f3650284ab9701', username: 'OmniAudio Direct' },
      status: 'active',
      rating: 4.9,
      reviewCount: 384,
      badge: '17% OFF',
    },
    quantity: 1,
    price: 22199,
    variant: 'Midnight Matte Black',
  },
  {
    product: {
      _id: 'eb00eef4b99985cbc0933691',
      name: 'ApexBook M3 Ultra 16-inch - Space Gray',
      description: '36GB Unified Memory • 1TB Fast NVMe SSD • Liquid Retina XDR Display',
      price: 74990,
      originalPrice: 82900,
      stock: 2,
      category: { _id: 'b4fa1458bcff238edf645aa5', name: 'Electronics', slug: 'electronics' },
      image:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
      seller: { _id: '6a7f809930f3650284ab9701', username: 'OMIZON Retail Prime' },
      status: 'active',
      rating: 4.9,
      reviewCount: 156,
      badge: 'PRIME DEAL',
    },
    quantity: 1,
    price: 74990,
    variant: '16-inch / 36GB / 1TB',
  },
  {
    product: {
      _id: '3807fe2700f4ceacb83c28de',
      name: 'Artisan Handcrafted Stoneware Dining Set (16-Piece)',
      description: 'Artisanal Matte Violet • 16-Piece Handcrafted Stoneware',
      price: 4899,
      originalPrice: 6499,
      stock: 45,
      category: { _id: '04990ca7ad918fbef87cdc10', name: 'Home & Living', slug: 'home-living' },
      image:
        'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=500&q=80',
      seller: { _id: '6a7f809930f3650284ab9701', username: 'Kala Artisan Living' },
      status: 'active',
      rating: 4.8,
      reviewCount: 92,
      badge: 'ARTISAN',
    },
    quantity: 2,
    price: 4899,
    variant: 'Matte Charcoal Violet',
  },
];

interface CartContextType {
  cart: Cart;
  cartCount: number;
  cartTotal: number;
  isDrawerOpen: boolean;
  isLoading: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (product: Product, quantity?: number, variant?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variant?: string) => Promise<void>;
  removeItem: (productId: string, variant?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  restoreCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const LOCAL_CART_KEY = 'omizon_guest_cart';

export interface ReconcileResult {
  nextCart: Cart;
  itemsToSync: Array<{ product: string; quantity: number; variant: string; action: 'add' | 'update' }>;
}

export function reconcileCart(
  currentCart: Cart,
  serverCart: Cart | null | undefined
): ReconcileResult {
  const localItems = (currentCart?.items || []).filter((item) => {
    // Filter deleted / missing products or zero quantities
    if (!item || !item.product || item.quantity <= 0) return false;
    if (typeof item.product === 'object' && item.product.status && item.product.status !== 'active') return false;
    return true;
  });

  const serverItems = (serverCart?.items || []).filter((item) => {
    if (!item || !item.product || item.quantity <= 0) return false;
    if (typeof item.product === 'object' && item.product.status && item.product.status !== 'active') return false;
    return true;
  });

  const itemsToSync: Array<{ product: string; quantity: number; variant: string; action: 'add' | 'update' }> = [];
  const mergedMap = new Map<string, CartItem>();

  // 1. Populate map with valid server items
  for (const sItem of serverItems) {
    const sId = typeof sItem.product === 'object' ? sItem.product._id : sItem.product;
    const variant = sItem.variant || 'default';
    const key = `${sId}:::${variant}`;
    const stock = typeof sItem.product === 'object' && Number.isFinite(sItem.product.stock) ? sItem.product.stock : Infinity;
    const cappedQty = Math.max(1, Math.min(stock, sItem.quantity));

    mergedMap.set(key, {
      ...sItem,
      variant,
      quantity: cappedQty,
    });
  }

  // 2. Merge local guest items with duplicate quantity preservation and stock validation
  for (const lItem of localItems) {
    const lId = typeof lItem.product === 'object' ? lItem.product._id : lItem.product;
    const variant = lItem.variant || 'default';
    const key = `${lId}:::${variant}`;
    const localStock = typeof lItem.product === 'object' && Number.isFinite(lItem.product.stock) ? lItem.product.stock : Infinity;

    if (mergedMap.has(key)) {
      // Duplicate item in both carts: combine quantities up to available stock
      const existing = mergedMap.get(key)!;
      const combinedStock = typeof existing.product === 'object' && Number.isFinite(existing.product.stock)
        ? existing.product.stock
        : localStock;

      const combinedQuantity = Math.min(combinedStock, existing.quantity + lItem.quantity);
      if (combinedQuantity !== existing.quantity) {
        mergedMap.set(key, {
          ...existing,
          quantity: combinedQuantity,
        });
        itemsToSync.push({
          product: lId,
          quantity: combinedQuantity,
          variant,
          action: 'update',
        });
      }
    } else {
      // Local item not present on server: validate stock and append
      if (localStock <= 0) continue; // Skip out of stock items
      const validQty = Math.max(1, Math.min(localStock, lItem.quantity));
      const newItem: CartItem = {
        ...lItem,
        variant,
        quantity: validQty,
      };
      mergedMap.set(key, newItem);
      itemsToSync.push({
        product: lId,
        quantity: validQty,
        variant,
        action: 'add',
      });
    }
  }

  return {
    nextCart: { items: Array.from(mergedMap.values()) },
    itemsToSync,
  };
}

export function getInitialGuestCart(
  savedCartJson: string | null,
  isExplicitDemo: boolean = false
): Cart {
  if (savedCartJson) {
    try {
      const parsed = JSON.parse(savedCartJson);
      if (parsed && Array.isArray(parsed.items)) {
        return parsed;
      }
    } catch {
      // Fallback to empty on malformed JSON
    }
  }

  // Explicit demo cart flag enabled only when deliberately requested
  if (isExplicitDemo) {
    return { items: STITCH_DEFAULT_CART_ITEMS };
  }

  return { items: [] };
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const cartVersionRef = React.useRef(0);
  const [cart, setCart] = useState<Cart>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CART_KEY) : null;
    const isExplicitDemo =
      typeof window !== 'undefined' &&
      (localStorage.getItem('omizon_demo_cart') === 'true' ||
        new URLSearchParams(window.location.search).get('demo') === 'cart');

    return getInitialGuestCart(saved, isExplicitDemo);
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // Fetch from backend when user logs in and reconcile with local items
  const refreshCart = useCallback(async () => {
    if (!user || user.role !== 'buyer') return;
    const versionAtStart = cartVersionRef.current;
    try {
      setIsLoading(true);
      const res = await api.cart.get();
      if (cartVersionRef.current !== versionAtStart) return;

      if (res?.cart) {
        let itemsToSync: ReconcileResult['itemsToSync'] = [];
        setCart((currentCart) => {
          if (cartVersionRef.current !== versionAtStart) return currentCart;
          const result = reconcileCart(currentCart, res.cart);
          itemsToSync = result.itemsToSync;
          return result.nextCart;
        });

        // Asynchronously sync any un-synced local items or merged updates to the server
        if (itemsToSync.length > 0) {
          for (const item of itemsToSync) {
            try {
              if (item.action === 'update') {
                await api.cart.updateItem(item.product, {
                  quantity: item.quantity,
                  variant: item.variant,
                });
              } else {
                await api.cart.addItem({
                  product: item.product,
                  quantity: item.quantity,
                  variant: item.variant,
                });
              }
            } catch (err) {
              console.warn('Sync item to backend cart notice:', err);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch user cart from backend:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const addItem = async (product: Product, quantity: number = 1, variant: string = 'default') => {
    cartVersionRef.current++;
    // Optimistic local update
    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (i) => (typeof i.product === 'object' ? i.product._id : i.product) === product._id && i.variant === variant
      );
      if (existingIndex > -1) {
        const updated = [...prev.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return { ...prev, items: updated };
      }
      return {
        ...prev,
        items: [...prev.items, { product, quantity, variant, price: product.price }],
      };
    });

    openDrawer();

    // Backend sync if user is logged in
    if (user && user.role === 'buyer') {
      try {
        await api.cart.addItem({
          product: product._id,
          quantity,
          variant,
        });
        await refreshCart();
      } catch (err) {
        console.warn('Backend cart addItem error:', err);
      }
    }
  };

  const updateQuantity = async (productId: string, quantity: number, variant: string = 'default') => {
    cartVersionRef.current++;
    if (quantity <= 0) {
      await removeItem(productId, variant);
      return;
    }

    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        const id = typeof item.product === 'object' ? item.product._id : item.product;
        if (id === productId && item.variant === variant) {
          return { ...item, quantity };
        }
        return item;
      }),
    }));

    if (user && user.role === 'buyer') {
      try {
        await api.cart.updateItem(productId, { quantity, variant });
      } catch (err) {
        console.warn('Backend cart updateItem error:', err);
      }
    }
  };

  const removeItem = async (productId: string, variant: string = 'default') => {
    cartVersionRef.current++;
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((item) => {
        const id = typeof item.product === 'object' ? item.product._id : item.product;
        return !(id === productId && item.variant === variant);
      }),
    }));

    if (user && user.role === 'buyer') {
      try {
        await api.cart.removeItem(productId, variant);
      } catch (err) {
        console.warn('Backend cart removeItem error:', err);
      }
    }
  };

  const clearCart = async () => {
    cartVersionRef.current++;
    setCart({ items: [] });
    if (user && user.role === 'buyer') {
      try {
        await api.cart.clear();
      } catch (err) {
        console.warn('Backend clear cart error:', err);
      }
    }
  };

  const restoreCart = () => {
    setCart({ items: STITCH_DEFAULT_CART_ITEMS });
  };

  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        isDrawerOpen,
        isLoading,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        restoreCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
