import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  CreditCard,
  ShieldCheck,
  Headphones,
  LogOut,
  Sparkles,
  ChevronRight,
  Crown,
  Check,
} from 'lucide-react';

interface AccountLayoutProps {
  children: React.ReactNode;
  activeKey: 'overview' | 'orders' | 'wishlist' | 'addresses' | 'settings';
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({ children, activeKey }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.username === 'priya_sharma' ? 'Priya Sharma' : user?.username || 'Priya Sharma';
  const displayEmail = user?.email || 'priya.sharma@example.com';

  const navItems = [
    {
      key: 'overview',
      label: 'Overview & Dashboard',
      path: '/account',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: null,
    },
    {
      key: 'orders',
      label: 'Your Orders & Buys',
      path: '/account/orders',
      icon: <Package className="w-5 h-5" />,
      badge: '2 Active',
    },
    {
      key: 'wishlist',
      label: 'Wishlist & Collections',
      path: '/account/wishlist',
      icon: <Heart className="w-5 h-5" />,
      badge: '14 items',
    },
    {
      key: 'addresses',
      label: 'Saved Addresses',
      path: '/account/addresses',
      icon: <MapPin className="w-5 h-5" />,
      badge: '3 saved',
    },
    {
      key: 'settings',
      label: 'Login & Security',
      path: '/account/settings',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: null,
    },
  ];

  return (
    <div className="w-full bg-surface min-h-[calc(100vh-160px)] py-8 px-margin-mobile md:px-margin">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        {/* Top Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-on-surface-variant font-body-sm text-xs">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-semibold">Account Hub</span>
        </nav>

        {/* 12-Column Account Hub Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDEBAR: 4 cols on lg, 3 cols on xl */}
          <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 sticky top-24">
            {/* Member Profile Hero Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3.5 mb-4 relative">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full ring-2 ring-primary/20 bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-sm">
                    {displayName[0]?.toUpperCase() || 'P'}
                  </div>
                  <span className="absolute bottom-0 right-0 bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow">
                    ✓
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <h3 className="font-title-md text-on-surface font-bold text-base truncate">
                    {displayName}
                  </h3>
                  <span className="font-body-sm text-outline text-xs truncate">
                    {displayEmail}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      VIP Elite
                    </span>
                    <span className="font-body-sm text-outline text-[11px]">Since 2023</span>
                  </div>
                </div>
              </div>

              {/* VIP Perks Micro Gauge */}
              <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between border border-outline-variant/10">
                <div className="flex flex-col">
                  <span className="font-label-sm text-outline uppercase tracking-wider text-[10px] font-bold">
                    OMIZON Prime+
                  </span>
                  <span className="font-title-sm text-on-surface font-semibold text-xs">
                    Auto-renews Oct 2025
                  </span>
                </div>
                <Crown className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* Account Hub Navigation Deck */}
            <nav className="bg-surface-container-lowest rounded-2xl p-2 border border-outline-variant/20 shadow-sm flex flex-col gap-1 font-title-sm">
              {navItems.map((item) => {
                const isActive = activeKey === item.key;
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </Link>
                );
              })}

              <div className="h-px bg-outline-variant/15 my-1" />

              {/* Sign Out Action */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </div>
              </button>
            </nav>
          </aside>

          {/* MAIN CONTENT AREA: 8 cols on lg, 9 cols on xl */}
          <main className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;

