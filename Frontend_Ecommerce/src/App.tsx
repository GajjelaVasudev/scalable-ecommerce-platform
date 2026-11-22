import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import { MarketplaceLayout } from './layouts/MarketplaceLayout';
import { SellerLayout } from './layouts/SellerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Marketplace Pages
import { HomePage } from './pages/marketplace/HomePage';
import { ShopAllPage } from './pages/marketplace/ShopAllPage';
import { ProductDetailPage } from './pages/marketplace/ProductDetailPage';
import { CartPage } from './pages/marketplace/CartPage';
import { CheckoutPage } from './pages/marketplace/CheckoutPage';
import { OrderConfirmationPage } from './pages/marketplace/OrderConfirmationPage';
import { OrdersPage } from './pages/marketplace/OrdersPage';
import { OrderDetailsPage } from './pages/marketplace/OrderDetailsPage';
import { AccountPage } from './pages/marketplace/AccountPage';
import { PersonalInfoPage } from './pages/marketplace/PersonalInfoPage';
import { WishlistPage } from './pages/marketplace/WishlistPage';
import { AddressBookPage } from './pages/marketplace/AddressBookPage';
import { AccountSettingsPage } from './pages/marketplace/AccountSettingsPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { PasswordResetSuccessPage } from './pages/auth/PasswordResetSuccessPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Seller Pages
import { SellerDashboardPage } from './pages/seller/SellerDashboardPage';
import { SellerProductsPage } from './pages/seller/SellerProductsPage';
import { SellerAddEditProductPage } from './pages/seller/SellerAddEditProductPage';
import { SellerInventoryPage } from './pages/seller/SellerInventoryPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerFulfilmentPage } from './pages/seller/SellerFulfilmentPage';
import { SellerAnalyticsPage } from './pages/seller/SellerAnalyticsPage';
import { SellerPayoutsPage } from './pages/seller/SellerPayoutsPage';
import { SellerSettingsPage } from './pages/seller/SellerSettingsPage';
import { SellerAccountPage } from './pages/seller/SellerAccountPage';
import { SellerVerificationPage } from './pages/seller/SellerVerificationPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminModerationPage } from './pages/admin/AdminModerationPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminRiskPage } from './pages/admin/AdminRiskPage';
import { AdminDisputesPage } from './pages/admin/AdminDisputesPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Common
import { NotFoundPage } from './pages/common/NotFoundPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Buyer / Public Marketplace Routes */}
              <Route path="/" element={<MarketplaceLayout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ShopAllPage />} />
                <Route path="products/:id" element={<ProductDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                <Route
                  path="orders"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="orders/:id"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <OrderDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="account"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="account/personal-info"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <PersonalInfoPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="account/orders"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="account/orders/:id"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <OrderDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="account/wishlist"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <WishlistPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="account/addresses"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <AddressBookPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="account/settings"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <AccountSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/signup" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/password-reset-success" element={<PasswordResetSuccessPage />} />

              {/* Seller Center Routes */}
              <Route
                path="/seller"
                element={
                  <ProtectedRoute allowedRoles={['seller', 'admin']}>
                    <SellerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/seller/dashboard" replace />} />
                <Route path="dashboard" element={<SellerDashboardPage />} />
                <Route path="products" element={<SellerProductsPage />} />
                <Route path="products/new" element={<SellerAddEditProductPage />} />
                <Route path="products/:id/edit" element={<SellerAddEditProductPage />} />
                <Route path="inventory" element={<SellerInventoryPage />} />
                <Route path="orders" element={<SellerOrdersPage />} />
                <Route path="fulfilment" element={<SellerFulfilmentPage />} />
                <Route path="analytics" element={<SellerAnalyticsPage />} />
                <Route path="payouts" element={<SellerPayoutsPage />} />
                <Route path="settings" element={<SellerSettingsPage />} />
                <Route path="account" element={<SellerAccountPage />} />
                <Route path="verification" element={<SellerVerificationPage />} />
              </Route>

              {/* Admin Platform Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="moderation" element={<AdminModerationPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="promotions" element={<AdminPromotionsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="risk" element={<AdminRiskPage />} />
                <Route path="disputes" element={<AdminDisputesPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

