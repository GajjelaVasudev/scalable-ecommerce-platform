import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export type AccountNavKey =
  | 'overview'
  | 'personal-info'
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'settings';

interface AccountLayoutProps {
  children: React.ReactNode;
  activeKey: AccountNavKey;
}

interface NavItem {
  key: AccountNavKey;
  label: string;
  path: string;
  symbol: string;
  dataPath: string;
}

const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    path: '/account',
    symbol: 'dashboard',
    dataPath: 'account-overview',
  },
  {
    key: 'personal-info',
    label: 'Personal Information',
    path: '/account/personal-info',
    symbol: 'person',
    dataPath: 'personal-information',
  },
  {
    key: 'orders',
    label: 'My Orders',
    path: '/account/orders',
    symbol: 'package_2',
    dataPath: 'my-orders',
  },
  {
    key: 'wishlist',
    label: 'My Wishlist',
    path: '/account/wishlist',
    symbol: 'favorite',
    dataPath: 'my-wishlist',
  },
  {
    key: 'addresses',
    label: 'Saved Addresses',
    path: '/account/addresses',
    symbol: 'home_pin',
    dataPath: 'saved-addresses',
  },
  {
    key: 'settings',
    label: 'Account Settings',
    path: '/account/settings',
    symbol: 'settings',
    dataPath: 'account-settings',
  },
];

interface SupportItem {
  label: string;
  path: string;
  symbol: string;
  dataPath: string;
}

const SUPPORT_NAV_ITEMS: SupportItem[] = [
  {
    label: 'Help Centre',
    path: '#help',
    symbol: 'help',
    dataPath: 'help-centre',
  },
  {
    label: 'Contact Support',
    path: '#support',
    symbol: 'support_agent',
    dataPath: 'contact-support',
  },
  {
    label: 'Returns & Refunds',
    path: '/account/orders?filter=returns',
    symbol: 'replay',
    dataPath: 'returns-and-refunds',
  },
];

export const AccountLayout: React.FC<AccountLayoutProps> = ({ children, activeKey }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [supportToast, setSupportToast] = useState<string | null>(null);

  const isReturnsActive = location.pathname.includes('/orders') && location.search.includes('filter=returns');

  // Compute dynamic user name from authenticated state without hardcoded demo customer data
  const rawUsername = user?.username || '';
  const formattedName = rawUsername
    ? rawUsername
        .split(/[_\s-]/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ')
    : 'Account User';

  const userInitial = (formattedName.charAt(0) || 'U').toUpperCase();
  const userEmail = user?.email || 'buyer@omizon.in';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSupportClick = (item: SupportItem, e: React.MouseEvent) => {
    if (item.path.startsWith('#')) {
      e.preventDefault();
      setSupportToast(`${item.label}: 24/7 concierge support is available via support@omizon.in or 1800-266-4966.`);
      setTimeout(() => setSupportToast(null), 4000);
    }
  };

  return (
    <div className="w-full bg-surface min-h-[calc(100vh-160px)] pb-16 px-margin-mobile md:px-margin">
      {/* Toast Feedback for Support Links */}
      {supportToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-fade-in max-w-md">
          <div className="bg-ink text-text-dark-primary px-space-md py-space-sm rounded-lg shadow-xl flex items-center gap-space-sm font-label-md text-label-md">
            <span className="material-symbols-outlined text-primary text-[20px]">support_agent</span>
            <span>{supportToast}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1320px] mx-auto">
        {/* Mobile Navigation Strip (< md) */}
        <div className="md:hidden w-full overflow-x-auto no-scrollbar pb-3 mb-6 -mx-margin-mobile px-margin-mobile border-b border-lavender-mist">
          <div className="flex items-center gap-1.5 min-w-max px-1">
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const isActive = activeKey === item.key && !(item.key === 'orders' && isReturnsActive);
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  data-path={item.dataPath}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-surface-container text-ink shadow-sm'
                      : 'text-ink-muted bg-surface-container-lowest hover:text-ink hover:bg-surface-container-low border border-lavender-mist/60'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isActive ? 'text-primary' : 'text-ink-muted'
                    }`}
                  >
                    {item.symbol}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {/* Returns & Refunds Mobile Quick Access */}
            <Link
              to="/account/orders?filter=returns"
              data-path="returns-and-refunds"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isReturnsActive
                  ? 'bg-surface-container text-ink shadow-sm'
                  : 'text-ink-muted bg-surface-container-lowest hover:text-ink hover:bg-surface-container-low border border-lavender-mist/60'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isReturnsActive ? 'text-primary' : 'text-ink-muted'}`}>
                replay
              </span>
              <span>Returns &amp; Refunds</span>
            </Link>
          </div>
        </div>

        {/* Main 2-Column Responsive Layout Matching Google Stitch */}
        <div className="flex flex-col md:flex-row gap-gutter py-space-md">
          {/* Desktop Left Sticky Aside Navigation (260px) */}
          <aside className="w-full md:w-[260px] flex-shrink-0">
            <div className="sticky top-20 flex flex-col gap-1">
              {/* Authenticated User Micro Pill */}
              <div className="bg-surface-container-lowest border border-lavender-mist rounded-xl p-space-sm mb-space-sm flex items-center gap-space-sm shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-royal-purple text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  {userInitial}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-title-sm text-title-sm text-ink font-semibold truncate">
                    {formattedName}
                  </span>
                  <span className="font-label-sm text-label-sm text-ink-subtle truncate">
                    {userEmail}
                  </span>
                </div>
              </div>

              {/* Section 1: My Account */}
              <div className="px-space-sm pb-space-sm pt-space-xs">
                <h2 className="font-title-sm text-title-sm text-ink-subtle uppercase tracking-wider font-semibold">
                  My Account
                </h2>
              </div>
              <nav className="flex flex-col gap-1" data-active-classes="bg-surface-container text-ink font-semibold rounded-lg">
                {ACCOUNT_NAV_ITEMS.map((item) => {
                  const isActive = activeKey === item.key && !(item.key === 'orders' && isReturnsActive);
                  return (
                    <Link
                      key={item.key}
                      to={item.path}
                      data-path={item.dataPath}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors font-body-md text-body-md ${
                        isActive
                          ? 'bg-surface-container text-ink font-semibold'
                          : 'text-ink-muted hover:text-ink hover:bg-surface-container-low'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] transition-colors ${
                          isActive ? 'text-primary' : 'text-ink-muted'
                        }`}
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {item.symbol}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Lavender Mist Divider */}
              <div className="my-space-md h-px bg-lavender-mist mx-space-sm" />

              {/* Section 2: Support */}
              <div className="px-space-sm pb-space-sm">
                <h2 className="font-title-sm text-title-sm text-ink-subtle uppercase tracking-wider font-semibold">
                  Support
                </h2>
              </div>
              <nav className="flex flex-col gap-1" data-active-classes="bg-surface-container text-ink font-semibold rounded-lg">
                {SUPPORT_NAV_ITEMS.map((item) => {
                  const isItemActive = item.dataPath === 'returns-and-refunds' && isReturnsActive;
                  return (
                    <Link
                      key={item.dataPath}
                      to={item.path}
                      data-path={item.dataPath}
                      onClick={(e) => handleSupportClick(item, e)}
                      aria-current={isItemActive ? 'page' : undefined}
                      className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors font-body-md text-body-md ${
                        isItemActive
                          ? 'bg-surface-container text-ink font-semibold'
                          : 'text-ink-muted hover:text-ink hover:bg-surface-container-low'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] transition-colors ${
                          isItemActive ? 'text-primary' : 'text-ink-muted'
                        }`}
                        style={isItemActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {item.symbol}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Lavender Mist Divider */}
              <div className="my-space-md h-px bg-lavender-mist mx-space-sm" />

              {/* Sign Out Action */}
              <div className="px-space-sm">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-semantic-error hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-body-md text-body-md text-left font-medium"
                >
                  <span className="material-symbols-outlined text-[18px] text-semantic-error">
                    logout
                  </span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Account View Content Area */}
          <main className="flex-1 min-w-0 bg-surface">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
