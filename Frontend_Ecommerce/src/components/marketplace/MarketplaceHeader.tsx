import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

interface MarketplaceHeaderProps {
  onSearch?: (query: string) => void;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ onSearch }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, cartTotal, openDrawer } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 shadow-[0_1px_8px_rgba(25,11,70,0.06)] bg-surface-container-lowest">
      {/* 1. Top Utility Strip (h-9) */}
      <div className="bg-inverse-surface text-inverse-on-surface h-9 px-margin flex items-center justify-between text-body-sm">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[16px] text-primary-fixed">location_on</span>
          <span className="font-label-md text-inverse-on-surface">
            Deliver to <strong className="font-semibold text-surface-container-lowest">Mumbai 400001</strong>
          </span>
          <span className="hidden sm:inline text-outline-variant">•</span>
          <span className="hidden sm:inline text-on-surface-variant font-body-sm">
            Fast 2-Day Delivery Guaranteed
          </span>
          <button
            className="ml-space-xs text-primary-fixed hover:text-surface-container-lowest underline font-label-sm uppercase transition-colors"
            type="button"
          >
            Change
          </button>
        </div>

        <div className="flex items-center gap-space-md">
          <Link
            to="/seller/dashboard"
            className="hidden md:inline font-body-sm text-inverse-on-surface hover:text-primary-fixed transition-colors"
          >
            Sell on OMIZON
          </Link>
          <a
            href="#support"
            className="hidden md:inline font-body-sm text-inverse-on-surface hover:text-primary-fixed transition-colors"
          >
            Customer Care
          </a>
          <Link
            to="/orders"
            className="hidden lg:inline font-body-sm text-inverse-on-surface hover:text-primary-fixed transition-colors"
          >
            Track Order
          </Link>
          <div className="flex items-center gap-1 font-label-md cursor-pointer hover:text-primary-fixed">
            <span className="material-symbols-outlined text-[15px]">language</span>
            <span>INR (₹) / EN</span>
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </div>
        </div>
      </div>

      {/* 2. Main Brand & Search Strip (h-20) */}
      <div className="bg-surface-container-lowest h-20 px-margin flex items-center justify-between gap-space-lg">
        {/* Brand Logo */}
        <div className="flex items-center gap-space-md shrink-0">
          <Link to="/" className="flex items-center gap-space-xs" data-path="home">
            <img
              alt="OMIZON Official Brand Logo"
              className="h-9 w-auto object-contain"
              src="/logo.svg"
            />
          </Link>
        </div>

        {/* Search Bar with Category Dropdown */}
        <div className="flex-1 max-w-3xl hidden md:flex items-center">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full flex items-center bg-surface-container-low rounded-lg h-11 px-space-xs focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest transition-all relative"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="flex items-center gap-1 px-space-sm py-1 rounded text-on-surface-variant hover:text-on-surface font-label-md shrink-0"
              >
                <span>{selectedCategory}</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>

              {showCategoryMenu && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-flyout border border-outline-variant py-2 z-50">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategoryMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-5 w-[1px] bg-outline-variant mx-space-xs" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands and essentials..."
              className="w-full bg-transparent border-0 outline-none px-space-xs font-body-md text-on-surface placeholder:text-outline"
            />

            <button
              type="submit"
              aria-label="Search"
              className="ml-space-xs bg-primary hover:bg-secondary text-on-primary h-9 px-space-md rounded-md flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
          </form>
        </div>

        {/* User Actions & Shortcuts */}
        <div className="flex items-center gap-space-md shrink-0">
          {/* Account / Authentication Action */}
          {isAuthenticated && user ? (
            <div className="relative group">
              <Link
                to="/account"
                className="flex items-center gap-space-xs p-1 rounded-lg hover:bg-surface-container-low transition-colors"
                data-path="account"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="font-label-sm text-outline uppercase truncate max-w-[120px]">
                    Hello, {user.username.split(/[\s_]+/)[0]}
                  </span>
                  <span className="font-title-sm text-on-surface leading-none flex items-center gap-0.5">
                    Account &amp; Lists
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                  </span>
                </div>
              </Link>
              {/* Authenticated Dropdown Menu */}
              <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block z-50">
                <div className="w-56 bg-surface-container-lowest rounded-xl shadow-modal border border-outline-variant/30 p-2 flex flex-col gap-1">
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
            <div className="relative group">
              <Link
                to="/login"
                className="flex items-center gap-space-xs p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
                data-path="account"
              >
                <div className="w-8 h-8 rounded-full bg-surface-container-high text-outline flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="font-label-sm text-outline uppercase">
                    Hello, Sign In
                  </span>
                  <span className="font-title-sm text-on-surface leading-none flex items-center gap-0.5">
                    Account &amp; Lists
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                  </span>
                </div>
              </Link>
              {/* Guest Dropdown Menu */}
              <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block z-50">
                <div className="w-60 bg-surface-container-lowest rounded-xl shadow-modal border border-outline-variant/30 p-3 flex flex-col gap-2.5">
                  <Link
                    to="/login"
                    className="w-full py-2 bg-primary hover:bg-secondary text-on-primary text-xs font-bold rounded-lg text-center transition-colors shadow-sm"
                  >
                    Sign In
                  </Link>
                  <p className="text-[11px] text-center text-outline">
                    New customer?{' '}
                    <Link to="/register" className="text-primary font-semibold hover:underline">
                      Start here.
                    </Link>
                  </p>
                  <div className="border-t border-outline-variant/20 pt-2 flex flex-col gap-1">
                    <Link
                      to="/login"
                      state={{ from: { pathname: '/account' } }}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs text-on-surface hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      <span>Your Account</span>
                    </Link>
                    <Link
                      to="/login"
                      state={{ from: { pathname: '/orders' } }}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs text-on-surface hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">package_2</span>
                      <span>Track Orders</span>
                    </Link>
                    <Link
                      to="/products"
                      className="flex items-center gap-2 px-2 py-1.5 text-xs text-on-surface hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">favorite</span>
                      <span>Your Wishlist</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            title="Wishlist"
            onClick={() => navigate('/products')}
            className="relative flex items-center justify-center p-space-xs text-on-surface-variant hover:text-primary transition-colors"
            data-path="wishlist"
          >
            <span className="material-symbols-outlined text-[24px]">favorite_border</span>
            <span className="absolute -top-1 -right-1 bg-primary text-on-primary font-label-sm text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
              4
            </span>
          </button>

          <button
            type="button"
            onClick={openDrawer}
            className="flex items-center gap-space-xs bg-surface-container-low hover:bg-surface-container px-space-sm py-1.5 rounded-lg transition-colors cursor-pointer"
            data-path="cart"
          >
            <div className="relative flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
              <span className="absolute -top-1.5 -right-2 bg-secondary text-on-secondary font-label-sm text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {cartCount > 0 ? cartCount : 3}
              </span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-label-sm text-outline uppercase">Cart</span>
              <span className="font-price-card text-[15px] leading-tight text-on-surface">
                {cartTotal > 0 ? `₹${cartTotal.toLocaleString('en-IN')}` : '₹4,899'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-space-xs text-on-surface-variant hover:text-on-surface rounded-full transition-colors"
            title="Toggle Appearance"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Category Strip (h-11) */}
      <div className="bg-surface-container-lowest h-11 px-margin flex items-center justify-between overflow-x-auto shadow-[0_1px_4px_rgba(25,11,70,0.03)] border-t border-outline-variant/20">
        <div className="flex items-center gap-space-lg shrink-0">
          <Link
            to="/products"
            className="flex items-center gap-space-xs font-title-sm text-primary hover:text-secondary py-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
            <span>All Categories</span>
          </Link>
          <nav className="flex items-center gap-space-md" data-active-classes="text-primary font-bold">
            <Link
              to="/products?category=Electronics"
              className="font-body-md text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
            >
              Electronics
            </Link>
            <Link
              to="/products?category=Home+%26+Living"
              className="font-body-md text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
            >
              Home &amp; Living
            </Link>
            <Link
              to="/products?category=Grocery+%26+Essentials"
              className="font-body-md text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
            >
              Grocery &amp; Essentials
            </Link>
            <Link
              to="/products?category=Beauty+%26+Personal+Care"
              className="font-body-md text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
            >
              Beauty &amp; Personal Care
            </Link>
            <Link
              to="/products?category=Fashion+%26+Apparel"
              className="font-body-md text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
            >
              Fashion &amp; Apparel
            </Link>
            <Link
              to="/products?category=Sports+%26+Outdoors"
              className="font-body-md text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
            >
              Sports &amp; Outdoors
            </Link>
            <Link
              to="/products?category=Books"
              className="font-body-md text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
            >
              Books
            </Link>
            <Link
              to="/products?deals=true"
              className="font-body-md text-primary font-semibold hover:text-secondary transition-colors whitespace-nowrap"
            >
              Daily Deals &amp; Offers
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
