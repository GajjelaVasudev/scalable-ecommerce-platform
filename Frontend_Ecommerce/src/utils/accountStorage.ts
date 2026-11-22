import { User } from '../types';
import { SavedAddressItem } from '../components/checkout/DeliveryAddressSection';

/**
 * Returns the stable identifier for an authenticated user.
 * Prioritizes user._id, falling back safely to id if available.
 * Returns null if the user is unauthenticated or has no stable ID.
 * Never uses username or email as the identity key when a stable user ID exists.
 */
export function getStableUserId(user?: User | null): string | null {
  if (!user) return null;
  const id = user._id || (user as any).id;
  if (typeof id === 'string' && id.trim().length > 0) {
    return id.trim();
  }
  return null;
}

/**
 * Checks whether the current user is an explicitly identified demo account.
 */
export function isDemoUser(user?: User | null): boolean {
  if (!user) return false;
  const id = user._id || (user as any).id;
  return typeof id === 'string' && id.endsWith('_demo_01');
}

/**
 * Generates an account-scoped storage key.
 * If a valid userId is provided, returns `omizon_${baseKey}_${userId}`.
 * If userId is missing/null, returns `omizon_${baseKey}_guest`.
 */
export function getAccountStorageKey(baseKey: string, userId?: string | null): string {
  if (userId && typeof userId === 'string' && userId.trim().length > 0) {
    return `omizon_${baseKey}_${userId.trim()}`;
  }
  return `omizon_${baseKey}_guest`;
}

/**
 * Safely extracts a 10-digit Indian phone number for editing inputs.
 * Strips the +91 or 91 country code when exactly 12 digits.
 * If already 10 digits, preserves them intact.
 * NEVER silently truncates unexpectedly long or malformed numbers.
 */
export function extractTenDigitPhone(phoneStr?: string | null): string {
  if (!phoneStr || typeof phoneStr !== 'string') return '';
  const digits = phoneStr.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits;
}

// ---------------------------------------------------------------------------
// 1. Account Profile Storage
// ---------------------------------------------------------------------------

export function getAccountProfile(userId?: string | null): any | null {
  try {
    const key = getAccountStorageKey('user_profile', userId);
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

export function setAccountProfile(userId: string | null | undefined, profile: any): void {
  try {
    const key = getAccountStorageKey('user_profile', userId);
    // Sanitize: ensure sensitive tax identifiers like PAN are never persisted
    const sanitized = { ...profile };
    delete sanitized.panNumber;
    delete sanitized.pan;
    delete sanitized.pan_number;
    delete sanitized.aadhaar;
    delete sanitized.taxId;
    delete sanitized.taxIdentifier;
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch {}
}

// ---------------------------------------------------------------------------
// 2. Saved Addresses Storage
// ---------------------------------------------------------------------------

export function getAccountAddresses(userId?: string | null): SavedAddressItem[] | null {
  try {
    const key = getAccountStorageKey('saved_addresses', userId);
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return null;
}

export function setAccountAddresses(
  userId: string | null | undefined,
  addresses: SavedAddressItem[]
): void {
  try {
    const key = getAccountStorageKey('saved_addresses', userId);
    localStorage.setItem(key, JSON.stringify(addresses));
  } catch {}
}

// ---------------------------------------------------------------------------
// 3. Wishlist Items Storage
// ---------------------------------------------------------------------------

export function getAccountWishlist(userId?: string | null): any[] | null {
  try {
    const key = getAccountStorageKey('wishlist_items', userId);
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return null;
}

export function setAccountWishlist(userId: string | null | undefined, items: any[]): void {
  try {
    const key = getAccountStorageKey('wishlist_items', userId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

// ---------------------------------------------------------------------------
// 4. Previous Order Session Storage (Scoped & Account-Isolated)
// ---------------------------------------------------------------------------

/**
 * Extracts and normalizes the owner ID of an order record.
 * Handles diverse API/database shapes (user._id, user, customer._id, customer, userId, customerId).
 * Returns null if the owner ID is missing, malformed, or cannot be firmly established.
 */
export function getOrderOwnerId(order: any): string | null {
  if (!order || typeof order !== 'object') return null;

  const candidate =
    (typeof order.user === 'object' && order.user !== null ? order.user._id || order.user.id : null) ||
    (typeof order.user === 'string' ? order.user : null) ||
    (typeof order.customer === 'object' && order.customer !== null ? order.customer._id || order.customer.id : null) ||
    (typeof order.customer === 'string' ? order.customer : null) ||
    (typeof order.userId === 'string' ? order.userId : null) ||
    (typeof order.customerId === 'string' ? order.customerId : null);

  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }
  return null;
}

/**
 * Retrieves the most recent order safely, failing closed if ownership cannot be firmly established.
 * 
 * Rules:
 * 1. Fails closed: if userId is null, empty, or unauthenticated, returns null immediately.
 * 2. Rejects orders without ownership: if an order lacks an identifiable owner ID, returns null.
 * 3. Rejects mismatched owners: if order owner differs from active userId, returns null.
 * 4. Checks user-scoped session key first, verifying strict ownership match.
 * 5. Checks generic session key fallback, verifying strict ownership match.
 */
export function getAccountLastOrder(userId?: string | null): any | null {
  // Fail closed: anonymous / missing userId cannot claim or read cached orders
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return null;
  }
  const cleanUserId = userId.trim();

  try {
    // 1. Check user-scoped session key
    const userScopedKey = getAccountStorageKey('last_order', cleanUserId);
    const cachedScoped = sessionStorage.getItem(userScopedKey);
    if (cachedScoped) {
      const order = JSON.parse(cachedScoped);
      const ownerId = getOrderOwnerId(order);
      // Strictly verify ownership; fail closed if missing or mismatched
      if (ownerId && ownerId === cleanUserId) {
        return order;
      }
    }

    // 2. Check legacy / generic session key
    const genericCached = sessionStorage.getItem('omizon_last_order');
    if (genericCached) {
      const order = JSON.parse(genericCached);
      const ownerId = getOrderOwnerId(order);
      // Strictly verify ownership; fail closed if missing or mismatched
      if (ownerId && ownerId === cleanUserId) {
        return order;
      }
    }
  } catch {
    // Fail safely on parse errors
  }

  // Ownership cannot be established or does not match active user -> reject
  return null;
}

/**
 * Caches an order in session storage scoped to the active user.
 */
export function setAccountLastOrder(userId: string | null | undefined, order: any): void {
  try {
    const serialized = JSON.stringify(order);
    sessionStorage.setItem('omizon_last_order', serialized);
    if (userId) {
      sessionStorage.setItem(getAccountStorageKey('last_order', userId), serialized);
    }
  } catch {}
}

/**
 * Clears all cached orders on session end, logout, or account switch.
 * Ensures zero leakage of order details across sessions.
 */
export function clearAccountOrders(): void {
  try {
    sessionStorage.removeItem('omizon_last_order');
    // Clear any user-scoped keys in sessionStorage
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('omizon_last_order_') || key.startsWith('omizon_order_'))) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {}
}
