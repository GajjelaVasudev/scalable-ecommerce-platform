import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, CartItem, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export const STITCH_DEFAULT_CART_ITEMS: CartItem[] = [
  {
    product: {
      _id: 'prod_soundpulse_01',
      name: 'SoundPulse Studio Pro Wireless ANC Headphones',
      description: 'Midnight Matte Black • 40mm Beryllium Drivers • Spatial Audio',
      price: 24999,
      originalPrice: 29999,
      stock: 18,
      category: { _id: 'cat_electronics', name: 'Audio Engineering', slug: 'audio' },
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      seller: { _id: 'seller_01', username: 'OmniAudio Direct' },
      status: 'active',
      rating: 4.9,
      reviewCount: 384,
      badge: '17% OFF',
    },
    quantity: 1,
    price: 24999,
    variant: 'Midnight Matte Black',
  },
  {
    product: {
      _id: 'prod_apexbook_02',
      name: 'ApexBook M3 Ultra 16-inch - Space Gray',
      description: '36GB Unified Memory • 1TB Fast NVMe SSD • Liquid Retina XDR Display',
      price: 74990,
      originalPrice: 82900,
      stock: 2,
      category: { _id: 'cat_electronics', name: 'High-Performance Computing', slug: 'laptops' },
      image:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
      seller: { _id: 'seller_02', username: 'OMIZON Retail Prime' },
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
      _id: 'prod_auraglow_03',
      name: 'AuraGlow Minimalist Smart Desk Lamp',
      description: 'Anodized Silver • Wireless Fast Charging Base • App-Controlled Dimmable',
      price: 3499,
      originalPrice: 4999,
      stock: 15,
      category: { _id: 'cat_home', name: 'Smart Workspace', slug: 'smart-home' },
      image:
        'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=500&q=80',
      seller: { _id: 'seller_03', username: 'Lumina Labs India' },
      status: 'active',
      rating: 4.8,
      reviewCount: 88,
      badge: 'HOT DEAL',
    },
    quantity: 2,
    price: 3499,
    variant: 'Anodized Silver',
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

const LOCAL_CART_KEY = 'omizon_guest_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(() => {
    const saved = localStorage.getItem(LOCAL_CART_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items)) {
          return parsed;
        }
      } catch {
        // Fallback to default
      }
    }
    return { items: STITCH_DEFAULT_CART_ITEMS };
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // Fetch from backend when user logs in
  const refreshCart = useCallback(async () => {
    if (!user || user.role !== 'buyer') return;
    try {
      setIsLoading(true);
      const res = await api.cart.get();
      if (res?.cart) {
        setCart(res.cart);
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
