export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
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
  seller?: string | { _id: string; username: string };
  status?: 'active' | 'inactive';
  rating?: number;
  reviewCount?: number;
  badge?: string;
  specs?: Record<string, string>;
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
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryStatus: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
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

