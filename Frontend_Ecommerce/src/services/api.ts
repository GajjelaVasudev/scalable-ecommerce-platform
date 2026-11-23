import {
  User,
  Category,
  Product,
  ProductListResponse,
  Cart,
  Order,
  OrderListResponse,
  Inventory,
  PaymentIssue,
  ShippingAddress,
  SavedAddressItem,
  WishlistResponse,
} from '../types';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | string[] | undefined>;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...fetchOptions } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('omizon_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // sends HTTP-only cookies
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = typeof data === 'object' && data?.message ? data.message : `HTTP ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network request failed', 0);
  }
}

export const api = {
  // Auth
  auth: {
    register: (body: { username: string; email: string; password: string }) =>
      request<{ message: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: { username?: string; email?: string; password: string }) =>
      request<{ message: string; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
      }),
    getMe: () =>
      request<{ user: User }>('/auth/me', {
        method: 'GET',
      }),
    getProfile: () =>
      request<{ message?: string; user: User; profile: User }>('/auth/profile', {
        method: 'GET',
      }),
    updateProfile: (body: Partial<User> & { currentPassword?: string; newPassword?: string; dobDay?: string; dobMonth?: string; dobYear?: string }) =>
      request<{ message: string; user: User; profile: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    uploadAvatar: (body: { image: string; mimeType?: string }) =>
      request<{ message: string; avatarUrl: string; user: User }>('/auth/profile/avatar', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    removeAvatar: () =>
      request<{ message: string; user: User }>('/auth/profile/avatar', {
        method: 'DELETE',
      }),
    getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
      request<{ message: string; users: User[]; pagination: any }>('/auth/users', {
        method: 'GET',
        params,
      }),
    updateUserRole: (id: string, role: string) =>
      request<{ message: string; user: User }>(`/auth/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    forgotPassword: (body: { email: string }) =>
      request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    resetPassword: (body: { resetToken: string; newPassword: string; revokeSessions?: boolean }) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // Products
  products: {
    list: (params?: {
      page?: number;
      limit?: number;
      category?: string | string[];
      brand?: string | string[];
      minprice?: number;
      maxprice?: number;
      minRating?: number;
      minDiscount?: number;
      sort?: string;
      search?: string;
      featured?: boolean;
      inStock?: boolean;
      fastPrime?: boolean;
      twoDayDelivery?: boolean;
      codEligible?: boolean;
    }) =>
      request<ProductListResponse>('/products', {
        method: 'GET',
        params,
      }),
    getById: (id: string) =>
      request<{ message: string; product: Product }>(`/products/${id}`, {
        method: 'GET',
      }),
    create: (body: {
      name: string;
      description: string;
      price: number;
      stock: number;
      category: string;
      image: string;
    }) =>
      request<{ message: string; product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<Product>) =>
      request<{ message: string; product: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ message: string; deletedProduct: Product }>(`/products/${id}`, {
        method: 'DELETE',
      }),
  },

  // Categories
  categories: {
    list: () =>
      request<{ message: string; categories: Category[] }>('/categories', {
        method: 'GET',
      }),
    getById: (id: string) =>
      request<{ message: string; category: Category }>(`/categories/${id}`, {
        method: 'GET',
      }),
    create: (name: string) =>
      request<{ message: string; category: Category }>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    update: (id: string, name: string) =>
      request<{ message: string; category: Category }>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  // Cart
  cart: {
    get: () =>
      request<{ message: string; cart: Cart }>('/cart', {
        method: 'GET',
      }),
    addItem: (body: { product: string; quantity: number; variant?: string }) =>
      request<{ message: string; cart: Cart }>('/cart/items', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateItem: (productId: string, body: { quantity: number; variant?: string }) =>
      request<{ message: string; cart: Cart }>(`/cart/items/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    removeItem: (productId: string, variant: string = 'default') =>
      request<{ message: string; cart: Cart }>(`/cart/items/${productId}`, {
        method: 'DELETE',
        body: JSON.stringify({ variant }),
      }),
    clear: () =>
      request<{ message: string }>('/cart', {
        method: 'DELETE',
      }),
  },

  // Orders
  orders: {
    create: (shippingAddress: ShippingAddress, paymentMethod?: string) =>
      request<{ message: string; order: Order }>('/order/create', {
        method: 'POST',
        body: JSON.stringify({ shippingAddress, paymentMethod }),
      }),
    createGuest: (body: {
      shippingAddress: ShippingAddress;
      items: Array<{ product: string; quantity: number; variant?: string }>;
      paymentMethod?: string;
    }) =>
      request<{ message: string; order: Order; guestAccessToken: string }>('/order/guest', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getGuestById: (id: string, guestToken: string) =>
      request<{ message: string; order: Order }>(`/order/guest/${id}`, {
        method: 'GET',
        headers: { 'x-guest-token': guestToken },
      }),
    cancelGuest: (id: string, guestToken: string, reason?: string) =>
      request<{ message: string; order: Order }>(`/order/guest/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'x-guest-token': guestToken },
        body: JSON.stringify({ reason }),
      }),
    list: (params?: { page?: number; limit?: number; all?: boolean; status?: string; search?: string; scope?: string }) =>
      request<OrderListResponse>('/order', {
        method: 'GET',
        params,
      }),
    getById: (id: string) =>
      request<{ message: string; order: Order }>(`/order/${id}`, {
        method: 'GET',
      }),
    cancel: (id: string, reason?: string) =>
      request<{ message: string; order: Order }>(`/order/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    requestReturn: (id: string, reason?: string) =>
      request<{ message: string; order: Order }>(`/order/${id}/return`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    updateStatus: (id: string, deliveryStatus: string, trackingNumber?: string) =>
      request<{ message: string; order: Order }>(`/order/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ deliveryStatus, trackingNumber }),
      }),
  },

  // Inventory
  inventory: {
    get: (productId: string) =>
      request<{ message: string; inventory: Inventory }>(`/inventory/${productId}`, {
        method: 'GET',
      }),
    create: (body: { productId: string; variants: Array<{ name: string; totalStock: number }> }) =>
      request<{ message: string; inventory: Inventory }>('/inventory', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (productId: string, body: { variants: Array<{ name: string; totalStock: number }> }) =>
      request<{ message: string; inventory: Inventory }>(`/inventory/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },

  // Payments
  payments: {
    createAttempt: (orderId: string) =>
      request<{
        message: string;
        payment: any;
        razorpayOrderId: string;
        keyId: string;
      }>(`/payments/${orderId}`, {
        method: 'POST',
      }),
    createGuestAttempt: (orderId: string, guestToken: string) =>
      request<{
        message: string;
        payment: any;
        razorpayOrderId: string;
        keyId: string;
      }>(`/payments/guest/${orderId}`, {
        method: 'POST',
        headers: { 'x-guest-token': guestToken },
      }),
    getReconciliation: () =>
      request<{ message: string; issues: PaymentIssue[] }>('/payments/reconciliation', {
        method: 'GET',
      }),
    resolveIssue: (issueId: string, note: string) =>
      request<{ message: string; issue: PaymentIssue }>(`/payments/reconciliation/${issueId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      }),
  },

  // Addresses
  addresses: {
    list: () => request<SavedAddressItem[]>('/addresses', { method: 'GET' }),
    create: (data: Omit<SavedAddressItem, 'id' | '_id'>) =>
      request<SavedAddressItem>('/addresses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<SavedAddressItem>) =>
      request<SavedAddressItem>(`/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string; reassignedDefaultId?: string }>(`/addresses/${id}`, {
        method: 'DELETE',
      }),
    setDefault: (id: string) =>
      request<SavedAddressItem>(`/addresses/${id}/default`, {
        method: 'PATCH',
      }),
    sync: (addresses: SavedAddressItem[]) =>
      request<{ message: string; syncedCount: number; addresses: SavedAddressItem[] }>('/addresses/sync', {
        method: 'POST',
        body: JSON.stringify({ addresses }),
      }),
  },

  // Wishlist
  wishlist: {
    get: () => request<WishlistResponse>('/wishlist', { method: 'GET' }),
    addItem: (productId: string) =>
      request<WishlistResponse>('/wishlist/items', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      }),
    removeItem: (productId: string) =>
      request<WishlistResponse>(`/wishlist/items/${productId}`, {
        method: 'DELETE',
      }),
    clear: () =>
      request<WishlistResponse>('/wishlist', {
        method: 'DELETE',
      }),
    merge: (items: any[]) =>
      request<WishlistResponse>('/wishlist/merge', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },

  // Health
  health: {
    get: () => request<{ status: string; uptime: number; timestamp: string }>('/health', { method: 'GET' }),
    ready: () => request<{ status: string; database: string; redis: string }>('/ready', { method: 'GET' }),
  },
};

export { ApiError };

