import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

interface MarketplaceHeaderProps {
  onSearch?: (query: string) => void;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ onSearch }) => {
  const { user } = useAuth();
  const { cartCount, cartTotal, openDrawer } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
          <Link
            to="/account"
            className="flex items-center gap-space-xs p-1 rounded-lg hover:bg-surface-container-low transition-colors"
            data-path="account"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSLDoLVV-esICWgftOC8qO_vu3IxcA9LuYrzkLPmY6pIyycTxZSkn6D0CnPNNROeivapYvHG1QcniYbRnkRyZ2VlFNdh46Yzit3OoH7WnVB8jUU2y_t4hJZRRKypu9H0RhxMKXaS4iMLrLhaIkXN7wr_v6Hh9PYDt2t57QTWua5kfD-cDL-FPAtj95ysmYTGh4Z6q46Hu5aqriN7DKlAqveDT_OAY5P9iHXZVD3ZIONLZM5sVE6U9bww"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="font-label-sm text-outline uppercase">
                Hello, {user?.username?.split(' ')[0] || 'Priya'}
              </span>
              <span className="font-title-sm text-on-surface leading-none">Account &amp; Lists</span>
            </div>
          </Link>

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
