import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';
import { getStableUserId } from '../../utils/accountStorage';
import { formatCurrency } from '../../utils/format';

interface MarketplaceHeaderProps {
  onSearch?: (query: string) => void;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ onSearch }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, cartTotal, openDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isAccountSection = location.pathname.startsWith('/account') || location.pathname.startsWith('/orders');

  const userId = getStableUserId(user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('drawer') === 'true';
  });

  const categories = [
    'All Categories',
    'Electronics',
    'Home & Living',
    'Grocery & Essentials',
    'Beauty & Personal Care',
    'Fashion & Apparel',
    'Sports & Outdoors',
    'Books',
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const firstName = user?.username ? user.username.split(/[\s_]+/)[0] : 'Customer';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 shadow-[0_1px_8px_rgba(25,11,70,0.06)]">
        <div className="w-full flex flex-col">
          {/* 1. Primary Header (Midnight Violet #190B46, h-16) */}
          <div className="h-16 w-full bg-midnight-violet text-text-dark-primary px-margin-mobile md:px-margin flex items-center justify-between gap-3 md:gap-gutter">
            {/* Left: Brand Logo & Deliver To */}
            <div className="flex items-center gap-2 sm:gap-space-md shrink-0">
              <Link to="/" className="flex items-center" data-path="home">
                <img
                  alt="OMIZON"
                  className="h-8 sm:h-9 w-auto object-contain"
                  src="/logo-dark.svg"
                />
              </Link>

              <button
                className="hidden sm:flex items-center gap-space-xs px-2 py-1 rounded-lg hover:bg-obsidian-surface-1 transition-colors text-left cursor-pointer"
                type="button"
                onClick={() => navigate('/account/addresses')}
              >
                <span className="material-symbols-outlined text-electric-violet text-[20px]">location_on</span>
                <div className="flex flex-col leading-tight">
                  <span className="font-label-sm text-[11px] text-text-dark-muted font-normal">
                    Deliver to {user?.username ? firstName : 'You'}
                  </span>
                  <span className="font-label-md text-xs text-text-dark-primary font-semibold flex items-center gap-0.5">
                    Mumbai 400050{' '}
                    <span className="material-symbols-outlined text-[14px] text-text-dark-muted">expand_more</span>
                  </span>
                </div>
              </button>
            </div>

            {/* Center: Search Bar with Category Dropdown */}
            <div className="flex-1 max-w-2xl hidden md:flex items-center relative">
              <form
                onSubmit={handleSearchSubmit}
                className="flex w-full rounded-lg bg-surface-container-lowest p-1 shadow-sm focus-within:ring-2 focus-within:ring-electric-violet transition-all"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-low text-ink hover:bg-surface-container font-label-md text-xs rounded-md transition-colors border-r border-lavender-mist shrink-0 cursor-pointer"
                  >
                    <span className="max-w-[110px] truncate">{selectedCategory}</span>
                    <span className="material-symbols-outlined text-[14px] text-ink-muted">expand_more</span>
                  </button>

                  {showCategoryMenu && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-outline-variant py-2 z-50">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowCategoryMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors cursor-pointer"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center px-3 gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 2,000,000+ products, tech, home, beauty..."
                    className="w-full bg-transparent border-0 outline-none text-ink font-body-md text-xs placeholder:text-ink-subtle"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-ink-subtle hover:text-ink p-0.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  aria-label="Search"
                  className="h-9 px-4 bg-primary hover:bg-royal-purple text-on-primary rounded-md flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </button>
              </form>
            </div>

            {/* Right: Actions, Account, Orders, Wishlist, Cart & Theme */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-space-md shrink-0">
              {/* Currency Selector */}
              <button
                className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-obsidian-surface-1 transition-colors text-text-dark-primary"
                type="button"
              >
                <span className="font-label-sm text-[11px] font-semibold tracking-wide flex items-center gap-1">
                  🇮🇳 IND · ₹ INR
                </span>
                <span className="material-symbols-outlined text-[14px] text-text-dark-muted">expand_more</span>
              </button>

              {/* Account & Lists */}
              {isAuthenticated && user ? (
                <div className="relative group">
                  <Link
                    to="/account"
                    className="flex flex-col text-left px-2 py-1 rounded-lg hover:bg-obsidian-surface-1 transition-colors text-text-dark-primary"
                    data-path="account"
                  >
                    <span className="font-label-sm text-[11px] text-text-dark-muted font-normal">
                      Hello, {firstName}
                    </span>
                    <span className="font-label-md text-xs text-text-dark-primary font-semibold flex items-center gap-0.5">
                      Account &amp; Lists{' '}
                      <span className="material-symbols-outlined text-[14px] text-text-dark-muted">expand_more</span>
                    </span>
                  </Link>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block z-50">
                    <div className="w-56 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 p-2 flex flex-col gap-1">
                      <div className="px-3 py-2 border-b border-outline-variant/20">
                        <p className="text-xs font-bold text-on-surface truncate">{user.username}</p>
                        <p className="text-[11px] text-outline truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          {user.role} mode
                        </span>
                      </div>
                      <Link
                        to="/account"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        <span>Your Account</span>
                      </Link>
                      <Link
                        to="/account/orders"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">package_2</span>
                        <span>Your Orders</span>
                      </Link>
                      <Link
                        to="/account/wishlist"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">favorite</span>
                        <span>Wishlist</span>
                      </Link>
                      <Link
                        to="/account/addresses"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                        <span>Addresses</span>
                      </Link>
                      <div className="border-t border-outline-variant/20 my-1" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-error hover:bg-error/10 rounded-lg transition-colors w-full text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex flex-col text-left px-2 py-1 rounded-lg hover:bg-obsidian-surface-1 transition-colors text-text-dark-primary"
                  data-path="account"
                >
                  <span className="font-label-sm text-[11px] text-text-dark-muted font-normal">Hello, Sign In</span>
                  <span className="font-label-md text-xs text-text-dark-primary font-semibold flex items-center gap-0.5">
                    Account &amp; Lists{' '}
                    <span className="material-symbols-outlined text-[14px] text-text-dark-muted">expand_more</span>
                  </span>
                </Link>
              )}

              {/* Returns & Orders */}
              <Link
                to="/account/orders"
                className="hidden lg:flex flex-col text-left px-2 py-1 rounded-lg hover:bg-obsidian-surface-1 transition-colors text-text-dark-primary"
                data-path="orders"
              >
                <span className="font-label-sm text-[11px] text-text-dark-muted font-normal">Returns</span>
                <span className="font-label-md text-xs text-text-dark-primary font-semibold">&amp; Orders</span>
              </Link>

              {/* Wishlist */}
              <Link
                to="/account/wishlist"
                className="relative p-2 rounded-lg hover:bg-obsidian-surface-1 text-text-dark-primary transition-colors flex items-center"
                data-path="wishlist"
                title="Wishlist"
              >
                <span className="material-symbols-outlined text-[22px]">favorite</span>
                <span className="absolute -top-1 -right-1 bg-electric-violet text-on-primary font-label-sm text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              </Link>

              {/* Total Cart */}
              <button
                type="button"
                onClick={openDrawer}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-obsidian-surface-1 hover:bg-obsidian-surface-2 rounded-lg border border-obsidian-border text-text-dark-primary transition-colors cursor-pointer"
                data-path="cart"
              >
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-[22px] text-electric-violet">shopping_bag</span>
                  <span className="absolute -top-1.5 -right-2 bg-semantic-warning text-white font-label-sm text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-label-sm text-[10px] text-text-dark-muted leading-tight">Total Cart</span>
                  <span className="font-title-sm text-xs text-text-dark-primary font-bold leading-tight">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  id="notification-bell-btn"
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg hover:bg-obsidian-surface-1 text-text-dark-primary transition-colors flex items-center justify-center cursor-pointer"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={unreadCount > 0 ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      id="notification-badge"
                      className="absolute -top-1 -right-1 bg-primary-container text-white font-label-sm text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-sm"
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>
            </div>
          </div>

          {/* 2. Secondary Navigation Bar (PURE WHITE #FFFFFF in light mode, h-12) */}
          {!isAccountSection && (
            <div
              className="h-12 w-full border-b border-[#E8E6F0] dark:border-obsidian-border px-margin-mobile md:px-margin flex items-center justify-between text-[#211D31] dark:text-text-dark-primary transition-colors !bg-white dark:!bg-[#1D1537]"
              style={{ backgroundColor: theme === 'dark' ? '#1D1537' : '#FFFFFF' }}
            >
              <div className="flex items-center gap-4 sm:gap-space-lg overflow-x-auto no-scrollbar py-1">
                {/* Hamburger menu & All Categories */}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-1.5 font-title-sm text-xs sm:text-sm text-[#211D31] dark:text-text-dark-primary hover:text-[#762FF2] transition-colors shrink-0 font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">menu</span>
                  <span>All Categories</span>
                </button>

                {/* Approved Shopping Shortcuts */}
                <nav className="flex items-center gap-4 sm:gap-space-lg shrink-0">
                  <Link
                    to="/products?deals=true"
                    className="font-label-md text-xs sm:text-sm text-[#211D31] dark:text-text-dark-primary font-medium hover:text-[#762FF2] transition-colors whitespace-nowrap"
                  >
                    Today's Deals
                  </Link>
                  <Link
                    to="/products?sort=popular"
                    className="font-label-md text-xs sm:text-sm text-[#211D31] dark:text-text-dark-primary font-medium hover:text-[#762FF2] transition-colors whitespace-nowrap"
                  >
                    Best Sellers
                  </Link>
                  <Link
                    to="/products"
                    className="font-label-md text-xs sm:text-sm text-[#211D31] dark:text-text-dark-primary font-medium hover:text-[#762FF2] transition-colors whitespace-nowrap"
                  >
                    Continue Shopping
                  </Link>
                  <Link
                    to="/products?sort=newest"
                    className="font-label-md text-xs sm:text-sm text-[#211D31] dark:text-text-dark-primary font-medium hover:text-[#762FF2] transition-colors whitespace-nowrap"
                  >
                    New Arrivals
                  </Link>
                  <Link
                    to="/products?category=Electronics"
                    className="font-label-md text-xs sm:text-sm text-[#211D31] dark:text-text-dark-primary font-medium hover:text-[#762FF2] transition-colors whitespace-nowrap"
                  >
                    Electronics &amp; Audio
                  </Link>
                  <Link
                    to="/products?category=Home+%26+Living"
                    className="font-label-md text-xs sm:text-sm text-[#211D31] dark:text-text-dark-primary font-medium hover:text-[#762FF2] transition-colors whitespace-nowrap"
                  >
                    Home &amp; Living
                  </Link>
                  <a
                    href="#support"
                    className="font-label-md text-xs sm:text-sm text-[#211D31] dark:text-text-dark-primary font-medium hover:text-[#762FF2] transition-colors whitespace-nowrap"
                  >
                    Customer Service
                  </a>
                </nav>
              </div>

              {/* Right: Verified Delivery Benefit Pill (Backed by implemented free delivery on orders >= ₹999) */}
              <div className="hidden xl:flex items-center gap-1.5 text-semantic-success bg-[#F7F7FB] dark:bg-obsidian-surface-2 px-3 py-1 rounded-full border border-[#E8E6F0] dark:border-obsidian-border font-label-md text-xs font-semibold shrink-0">
                <span className="material-symbols-outlined text-[16px] text-semantic-success">verified</span>
                <span>Free Delivery Active on orders ₹999+ • 1-Day Dispatch</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hamburger Category Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 transition-opacity">
          <div
            className="fixed inset-0 bg-midnight-violet/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-surface-container-lowest shadow-2xl flex flex-col z-10 animate-slide-in">
            {/* Drawer Header */}
            <div className="h-16 bg-midnight-violet text-text-dark-primary px-space-lg flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[24px]">account_circle</span>
                <span className="font-title-md text-title-md font-bold text-white">
                  Hello, {user?.username ? firstName : (isAuthenticated ? 'Customer' : 'Sign In')}
                </span>
              </div>
              <button
                className="text-text-dark-muted hover:text-white cursor-pointer p-1"
                type="button"
                onClick={() => setIsDrawerOpen(false)}
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-space-lg space-y-space-md">
              <div className="font-title-sm text-xs text-ink-muted uppercase font-bold tracking-wider">
                Shop By Department
              </div>
              <div className="flex flex-col space-y-1">
                <Link
                  to="/products?category=Electronics"
                  onClick={() => setIsDrawerOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-sm text-ink hover:bg-surface-container-low transition-colors flex justify-between items-center font-medium"
                >
                  <span>Electronics &amp; Audio</span>
                  <span className="material-symbols-outlined text-[18px] text-ink-subtle">chevron_right</span>
                </Link>
                <Link
                  to="/products?category=Home+%26+Living"
                  onClick={() => setIsDrawerOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-sm text-ink hover:bg-surface-container-low transition-colors flex justify-between items-center font-medium"
                >
                  <span>Home, Kitchen &amp; Living</span>
                  <span className="material-symbols-outlined text-[18px] text-ink-subtle">chevron_right</span>
                </Link>
                <Link
                  to="/products?category=Beauty+%26+Personal+Care"
                  onClick={() => setIsDrawerOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-sm text-ink hover:bg-surface-container-low transition-colors flex justify-between items-center font-medium"
                >
                  <span>Beauty &amp; Personal Care</span>
                  <span className="material-symbols-outlined text-[18px] text-ink-subtle">chevron_right</span>
                </Link>
                <Link
                  to="/products?category=Fashion+%26+Apparel"
                  onClick={() => setIsDrawerOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-sm text-ink hover:bg-surface-container-low transition-colors flex justify-between items-center font-medium"
                >
                  <span>Fashion &amp; Luxury Goods</span>
                  <span className="material-symbols-outlined text-[18px] text-ink-subtle">chevron_right</span>
                </Link>
                <Link
                  to="/products?category=Grocery+%26+Essentials"
                  onClick={() => setIsDrawerOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-sm text-ink hover:bg-surface-container-low transition-colors flex justify-between items-center font-medium"
                >
                  <span>Grocery &amp; Pantry</span>
                  <span className="material-symbols-outlined text-[18px] text-ink-subtle">chevron_right</span>
                </Link>
                <Link
                  to="/products?category=Sports+%26+Outdoors"
                  onClick={() => setIsDrawerOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-sm text-ink hover:bg-surface-container-low transition-colors flex justify-between items-center font-medium"
                >
                  <span>Sports &amp; Outdoors</span>
                  <span className="material-symbols-outlined text-[18px] text-ink-subtle">chevron_right</span>
                </Link>
              </div>

              <div className="pt-4 border-t border-lavender-mist">
                <div className="font-title-sm text-xs text-ink-muted uppercase font-bold tracking-wider mb-2">
                  Help &amp; Settings
                </div>
                <div className="flex flex-col space-y-1">
                  <Link
                    to="/account"
                    onClick={() => setIsDrawerOpen(false)}
                    className="py-2 px-3 rounded-lg text-xs text-ink hover:bg-surface-container-low transition-colors"
                  >
                    Your Account
                  </Link>
                  <Link
                    to="/account/orders"
                    onClick={() => setIsDrawerOpen(false)}
                    className="py-2 px-3 rounded-lg text-xs text-ink hover:bg-surface-container-low transition-colors"
                  >
                    Your Orders
                  </Link>
                  <a
                    href="#support"
                    onClick={() => setIsDrawerOpen(false)}
                    className="py-2 px-3 rounded-lg text-xs text-ink hover:bg-surface-container-low transition-colors"
                  >
                    Customer Service
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
