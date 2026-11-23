import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product, WishlistItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import {
  getStableUserId,
  getAccountWishlist,
  setAccountWishlist,
} from '../utils/accountStorage';

export const GUEST_WISHLIST_STORAGE_KEY = 'omizon_guest_wishlist';

interface WishlistContextType {
  wishlist: WishlistItem[];
  wishlistCount: number;
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  addToWishlist: (product: Product | WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (product: Product | WishlistItem) => Promise<void>;
  clearWishlist: () => Promise<void>;
  moveToCart: (item: WishlistItem) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

/**
 * Normalizes any Product or partial WishlistItem into a consistent frontend WishlistItem
 */
function normalizeToWishlistItem(item: Product | WishlistItem | any): WishlistItem {
  const prod = item.product ? item.product : item;
  const id = (prod._id || prod.id || item.id || item._id || '').toString();
  const stock = typeof prod.stock === 'number' ? prod.stock : (typeof item.stockCount === 'number' ? item.stockCount : 10);
  const isAvailable = prod.status ? prod.status === 'active' && stock > 0 : stock > 0;

  return {
    _id: item._id || id,
    id,
    product: {
      _id: id,
      name: prod.name || item.name || 'OMIZON Product',
      description: prod.description || item.specs || '',
      price: typeof prod.price === 'number' ? prod.price : item.price || 0,
      originalPrice: prod.originalPrice || item.originalPrice || undefined,
      stock,
      category: prod.category || item.category || 'General',
      image: prod.image || item.image || '',
      images: prod.images || (item.image ? [item.image] : []),
      brand: prod.brand || item.brand || undefined,
      rating: prod.rating || item.rating || 4.8,
      reviewCount: prod.reviewCount || item.ratingCount || 100,
      status: prod.status || (isAvailable ? 'active' : 'out_of_stock'),
    },
    addedAt: item.addedAt || new Date().toISOString(),
    isAvailable,
    inStock: isAvailable,
    stockCount: stock,
    name: prod.name || item.name || 'OMIZON Product',
    price: typeof prod.price === 'number' ? prod.price : item.price || 0,
    originalPrice: prod.originalPrice || item.originalPrice || undefined,
    image: prod.image || item.image || '',
    category: typeof prod.category === 'string' ? prod.category : prod.category?.name || item.category || 'General',
    specs: prod.description || item.specs || '',
    rating: prod.rating || item.rating || 4.8,
    ratingCount: prod.reviewCount || item.ratingCount || 100,
  };
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const userId = getStableUserId(user);

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    // Initial synchronous load from scoped storage
    try {
      if (typeof window !== 'undefined') {
        if (userId) {
          const cached = getAccountWishlist(userId);
          if (cached && Array.isArray(cached)) {
            return cached.map(normalizeToWishlistItem);
          }
        } else {
          const guestRaw = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
          if (guestRaw) {
            const parsed = JSON.parse(guestRaw);
            if (Array.isArray(parsed)) {
              return parsed.map(normalizeToWishlistItem);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Initial wishlist load error:', e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mergeInProgressRef = useRef<boolean>(false);
  const prevUserIdRef = useRef<string | null>(userId);

  // Synchronize state when the active user identity changes (login, logout, switch)
  useEffect(() => {
    const prevId = prevUserIdRef.current;
    if (prevId !== userId) {
      prevUserIdRef.current = userId;
      if (!userId) {
        // Logged out: immediately restore genuine guest storage or empty array.
        // Critically, do NOT leak the logged-out user's wishlist into guest storage.
        try {
          const guestRaw = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
          if (guestRaw) {
            const parsed = JSON.parse(guestRaw);
            if (Array.isArray(parsed)) {
              setWishlist(parsed.map(normalizeToWishlistItem));
              return;
            }
          }
        } catch {}
        setWishlist([]);
      } else {
        // Switched or logged in: immediately clear stale state and load user cache
        try {
          const cached = getAccountWishlist(userId);
          if (cached && Array.isArray(cached)) {
            setWishlist(cached.map(normalizeToWishlistItem));
          } else {
            setWishlist([]);
          }
        } catch {
          setWishlist([]);
        }
      }
    }
  }, [userId]);

  // Sync to accountStorage utility whenever wishlist changes
  useEffect(() => {
    try {
      if (userId) {
        setAccountWishlist(userId, wishlist);
      } else if (prevUserIdRef.current === null) {
        // ONLY sync to guest storage if we are legitimately in guest mode (not transitioning during logout)
        localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
        setAccountWishlist(null, wishlist);
      }
    } catch {}
  }, [wishlist, userId]);

  /**
   * Refreshes the wishlist from the backend (or guest storage)
   * Automatically merges guest items upon login/registration.
   */
  const refreshWishlist = useCallback(async () => {
    if (!user || user.role !== 'buyer') {
      // Guest mode: load from guest storage
      try {
        const guestRaw = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
        if (guestRaw) {
          const parsed = JSON.parse(guestRaw);
          if (Array.isArray(parsed)) {
            setWishlist(parsed.map(normalizeToWishlistItem));
            return;
          }
        }
      } catch {}
      setWishlist([]);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Check if there are guest items that need to be merged into this account
      const guestRaw = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
      let guestItems: any[] = [];
      if (guestRaw) {
        try {
          const parsed = JSON.parse(guestRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            guestItems = parsed;
          }
        } catch {}
      }

      if (guestItems.length > 0 && !mergeInProgressRef.current) {
        mergeInProgressRef.current = true;
        try {
          const candidateProductIds = guestItems.map((item) => {
            if (typeof item === 'string') return item;
            return item.id || item._id || (item.product && (item.product._id || (item.product as any).id));
          }).filter(Boolean);

          const mergeRes = await api.wishlist.merge(candidateProductIds);
          // Safe cleanup: only delete guest storage once backend merge is confirmed
          localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);

          if (mergeRes && mergeRes.wishlist && Array.isArray(mergeRes.wishlist.items)) {
            const normalized = mergeRes.wishlist.items.map(normalizeToWishlistItem);
            setWishlist(normalized);
            setAccountWishlist(userId, normalized);
            return;
          }
        } catch (mergeErr) {
          console.warn('Guest wishlist merge error (will retain guest items for retry):', mergeErr);
        } finally {
          mergeInProgressRef.current = false;
        }
      }

      // 2. Fetch authenticated wishlist from server
      const res = await api.wishlist.get();
      if (res && res.wishlist && Array.isArray(res.wishlist.items)) {
        const normalized = res.wishlist.items.map(normalizeToWishlistItem);
        setWishlist(normalized);
        setAccountWishlist(userId, normalized);
      }
    } catch (err) {
      console.warn('Failed to fetch wishlist from server:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, userId]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  /**
   * Fast O(1) check if a product is saved in the current wishlist
   */
  const isWishlisted = useCallback(
    (productId: string): boolean => {
      if (!productId) return false;
      const target = productId.toString();
      return wishlist.some((item) => {
        const itemId = item.id || item._id || (item.product && (item.product._id || (item.product as any).id));
        return itemId && itemId.toString() === target;
      });
    },
    [wishlist]
  );

  /**
   * Adds a product to the wishlist
   */
  const addToWishlist = async (product: Product | WishlistItem) => {
    const normalized = normalizeToWishlistItem(product);
    const prodId = normalized.id;

    if (!prodId) return;

    // Check if already in state
    if (isWishlisted(prodId)) return;

    // Optimistic local state update
    setWishlist((prev) => [normalized, ...prev]);

    // Backend sync if authenticated
    if (user && user.role === 'buyer') {
      try {
        const res = await api.wishlist.addItem(prodId);
        if (res && res.wishlist && Array.isArray(res.wishlist.items)) {
          setWishlist(res.wishlist.items.map(normalizeToWishlistItem));
        }
      } catch (err) {
        console.error('Failed to add product to backend wishlist:', err);
        // Revert on failure
        setWishlist((prev) => prev.filter((i) => i.id !== prodId));
        throw err;
      }
    }
  };

  /**
   * Removes a product from the wishlist
   */
  const removeFromWishlist = async (productId: string) => {
    if (!productId) return;
    const targetId = productId.toString();

    const previousWishlist = [...wishlist];

    // Optimistic local update
    setWishlist((prev) => prev.filter((i) => (i.id || i._id) !== targetId));

    // Backend sync if authenticated
    if (user && user.role === 'buyer') {
      try {
        const res = await api.wishlist.removeItem(targetId);
        if (res && res.wishlist && Array.isArray(res.wishlist.items)) {
          setWishlist(res.wishlist.items.map(normalizeToWishlistItem));
        }
      } catch (err) {
        console.error('Failed to remove product from backend wishlist:', err);
        // Revert on failure
        setWishlist(previousWishlist);
        throw err;
      }
    }
  };

  /**
   * Toggles product in/out of the wishlist
   */
  const toggleWishlist = async (product: Product | WishlistItem) => {
    const prod = (product as any).product || product;
    const prodId = (prod._id || prod.id || '').toString();
    if (!prodId) return;

    if (isWishlisted(prodId)) {
      await removeFromWishlist(prodId);
    } else {
      await addToWishlist(product);
    }
  };

  /**
   * Clears the entire wishlist
   */
  const clearWishlist = async () => {
    const previousWishlist = [...wishlist];
    setWishlist([]);

    if (user && user.role === 'buyer') {
      try {
        await api.wishlist.clear();
      } catch (err) {
        console.error('Failed to clear backend wishlist:', err);
        setWishlist(previousWishlist);
        throw err;
      }
    }
  };

  /**
   * Moves a wishlisted product into the shopping cart and removes it from wishlist
   */
  const moveToCart = async (item: WishlistItem) => {
    if (!item) {
      throw new Error('No wishlist item provided');
    }
    if (!item.isAvailable) {
      throw new Error(`"${item.product?.name || item.name || 'This item'}" is currently out of stock or unavailable`);
    }

    const productToAdd = item.product || {
      _id: item.id,
      name: item.name,
      description: item.specs || '',
      price: item.price,
      originalPrice: item.originalPrice,
      stock: item.stockCount || 10,
      category: item.category || 'General',
      image: item.image,
      status: 'active',
      rating: item.rating || 4.8,
      reviewCount: item.ratingCount || 100,
    };

    // 1. Add to cart
    await addItem(productToAdd as Product, 1);

    // 2. Remove from wishlist only after successful addition
    await removeFromWishlist(item.id);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isLoading,
        isWishlisted,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        moveToCart,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
