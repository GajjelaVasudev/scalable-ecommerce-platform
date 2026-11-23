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

export type NotificationCategory =
  | 'all'
  | 'orders'
  | 'payments'
  | 'delivery'
  | 'returns'
  | 'offers'
  | 'account'
  | 'system';

export interface NotificationItem {
  _id: string;
  user: string;
  category: 'orders' | 'payments' | 'delivery' | 'returns' | 'offers' | 'account' | 'system';
  title: string;
  message: string;
  icon: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string;
  actionLabel: string;
  dedupeKey?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  _id?: string;
  user?: string;
  orderConfirmation: boolean;
  paymentUpdates: boolean;
  shippingUpdates: boolean;
  deliveryUpdates: boolean;
  cancellationUpdates: boolean;
  returnStatus: boolean;
  refundStatus: boolean;
  priceDropAlerts: boolean;
  backInStockAlerts: boolean;
  promotionalOffers: boolean;
  profileChanges: boolean;
  securityAlerts: boolean;
  inApp: boolean;
  email: boolean;
  push: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationListResponse {
  message: string;
  notifications: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    totalNotifications: number;
    totalPages: number;
    unreadCount: number;
  };
}

export type ReturnStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'pickup_scheduled'
  | 'in_transit'
  | 'received'
  | 'inspected'
  | 'disputed'
  | 'completed'
  | 'cancelled';

export type RefundStatus = 'none' | 'pending' | 'processing' | 'completed' | 'failed';

export type InspectionCondition =
  | 'uninspected'
  | 'passed_resellable'
  | 'damaged_unsellable'
  | 'wrong_item_returned'
  | 'counterfeit';

export type InventoryDisposition = 'pending' | 'restocked' | 'scrapped' | 'disputed' | 'held';

export interface ReturnInspection {
  condition: InspectionCondition;
  disposition: InventoryDisposition;
  notes?: string;
  inspectedAt?: string;
  inspectedBy?: string;
}

export interface ReturnItem {
  _id?: string;
  orderItemId?: string;
  product: any;
  name: string;
  variant: string;
  image?: string;
  price: number;
  quantity: number;
  reason: string;
  comment?: string;
  customerNotes?: string;
  evidence?: string[];
  evidenceImages?: string[];
  inspection?: ReturnInspection;
}

export interface ReturnRequestItem {
  _id: string;
  rmaNumber: string;
  order: any;
  customer: any;
  seller: any;
  items: ReturnItem[];
  totalRefundAmount: number;
  status: ReturnStatus;
  rejectionReason?: string;
  pickupDetails: {
    address: ShippingAddress;
    scheduledDate?: string;
    carrier?: string;
    trackingNumber?: string;
    pickupInstructions?: string;
  };
  refundMethod: {
    type: 'ORIGINAL_GATEWAY' | 'COD_BANK_TRANSFER' | 'COD_UPI';
    paymentMethod: string;
    codBankDetails?: {
      accountHolderName?: string;
      accountNumberMasked?: string;
      ifsc?: string;
      bankName?: string;
      upiId?: string;
    };
  };
  refundDetails: {
    status: RefundStatus;
    amount: number;
    gatewayRefundId?: string;
    providerPaymentId?: string;
    bankReferenceNumber?: string;
    failureReason?: string;
    initiatedAt?: string;
    completedAt?: string;
  };
  disputeDetails?: {
    isDisputed: boolean;
    disputedBy?: any;
    reason?: string;
    evidence?: string[];
    adminDecision?: 'pending' | 'upheld_seller' | 'upheld_buyer' | 'settled_split';
    adminNotes?: string;
    resolvedAt?: string;
    resolvedBy?: any;
  };
  statusHistory: Array<{
    status: string;
    changedBy?: any;
    role: 'buyer' | 'seller' | 'admin' | 'system';
    note?: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderEligibilityItem {
  product: any;
  name: string;
  variant: string;
  price: number;
  purchasedQuantity: number;
  alreadyReturnedQuantity: number;
  eligibleQuantity: number;
  isEligible: boolean;
  reason?: string;
}

export interface OrderEligibilityResponse {
  orderId: string;
  deliveryStatus: string;
  paymentMethod: string;
  totalAmount: number;
  eligibility: {
    isEligible: boolean;
    reason: string;
    deliveryDate: string;
    returnDeadline: string;
    windowDays: number;
    items: OrderEligibilityItem[];
  };
}

export interface ReturnListResponse {
  returns: ReturnRequestItem[];
  counts?: Record<string, number>;
  stats?: {
    totalReturns: number;
    pendingReviews: number;
    inTransit: number;
    awaitingInspection: number;
    disputes: number;
    refundPendingAmount: number;
    completedRefundsAmount: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

