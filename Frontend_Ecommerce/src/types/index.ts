export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string | null;
  altPhone?: string | null;
  avatarUrl?: string | null;
  gender?: 'female' | 'male' | 'non-binary' | 'prefer-not-to-say';
  dateOfBirth?: string | null;
  commLang?: 'en' | 'hi' | 'kn' | 'ta' | 'mr';
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryVariant {
  name: string;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
}

export interface Inventory {
  _id: string;
  product: string;
  variants: InventoryVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string | Category;
  image: string;
  images?: string[];
  brand?: string;
  brandTag?: string;
  seller?: string | { _id: string; username: string };
  status?: 'active' | 'inactive' | 'out_of_stock';
  rating?: number;
  reviewCount?: number;
  badge?: string;
  badgeVariant?: 'primary' | 'error' | 'seller-choice' | 'award-winner';
  fastPrime?: boolean;
  twoDayDelivery?: boolean;
  codEligible?: boolean;
  featured?: boolean;
  specs?: Record<string, string>;
  availableStock?: number;
  variants?: InventoryVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant: string;
  price: number;
}

export interface Cart {
  _id?: string;
  user?: string;
  items: CartItem[];
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SavedAddressItem extends ShippingAddress {
  id: string;
  _id?: string;
  tag: 'HOME' | 'WORK' | 'OTHER';
  isDefault?: boolean;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  variant: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  user: string | User;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'unpaid';
  deliveryStatus: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber?: string;
  paymentMethod?: string;
  cancellationReason?: string;
  returnReason?: string;
  refundStatus?: 'none' | 'pending' | 'completed' | 'failed';
  refundAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentIssue {
  _id: string;
  payment: string;
  order: string;
  providerPaymentId: string;
  providerOrderId: string;
  type: string;
  reason: string;
  amountMinor: number;
  currency: string;
  status: 'pending' | 'resolved';
  resolutionNote?: string;
  createdAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalProducts?: number;
  totalOrders?: number;
  totalPages: number;
}

export interface ProductListResponse {
  message: string;
  products: Product[];
  pagination: Pagination;
}

export interface OrderListResponse {
  message: string;
  orders: Order[];
  pagination: Pagination;
}

export interface WishlistItem {
  _id?: string;
  id: string;
  product: Product;
  addedAt?: string;
  isAvailable?: boolean;
  inStock?: boolean;
  stockCount?: number;
  name?: string;
  price?: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  specs?: string;
  rating?: number;
  ratingCount?: number;
}

export interface WishlistResponse {
  message: string;
  wishlist: {
    _id?: string;
    user?: string;
    items: WishlistItem[];
    itemCount: number;
    updatedAt?: string;
    createdAt?: string;
  };
  itemCount: number;
}

