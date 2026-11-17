import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Warehouse,
  ShoppingBag,
  BarChart3,
  CreditCard,
  Settings,
  UserCheck,
  FileCheck2,
  Truck,
  ArrowLeft,
  Moon,
  Sun,
  Menu,
  X,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RoleSwitcherBanner } from '../components/common/RoleSwitcherBanner';
import { cn } from '../utils/cn';

export const SellerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
    { name: 'My Products', href: '/seller/products', icon: Package },
    { name: 'Add Product', href: '/seller/products/new', icon: PlusCircle },
    { name: 'Warehouse & Stock', href: '/seller/inventory', icon: Warehouse },
    { name: 'Orders & Fulfilment', href: '/seller/orders', icon: ShoppingBag },
    { name: 'Dispatch Operations', href: '/seller/fulfilment', icon: Truck },
    { name: 'Sales BI & Analytics', href: '/seller/analytics', icon: BarChart3 },
    { name: 'Payouts & Ledger', href: '/seller/payouts', icon: CreditCard },
    { name: 'Store Configurations', href: '/seller/settings', icon: Settings },
    { name: 'Account & Banking', href: '/seller/account', icon: UserCheck },
    { name: 'KYC & Verification', href: '/seller/verification', icon: FileCheck2 },
  ];

  return (
    <div className="min-h-screen flex bg-porcelain dark:bg-obsidian-violet text-ink dark:text-text-dark-primary font-sans">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-midnight-violet/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. SELLER SIDEBAR */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-midnight-violet text-lavender-mist flex flex-col border-r border-lavender-mist/10 transition-transform duration-300 lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-dark.svg" alt="OMIZON" className="h-7 w-auto" />
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              SELLER
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-lavender-mist hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Identifier Card */}
        <div className="p-4 mx-3 my-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-[10px] text-lavender-mist/60 uppercase tracking-wider font-semibold">Active Merchant</p>
          <p className="text-xs font-bold text-white truncate mt-0.5">{user?.username || 'Apex Tech Hub'}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-emerald-300 font-medium">OMIZON Prime Seller</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all',
                    isActive
                      ? 'bg-electric-violet text-white font-bold shadow-md shadow-electric-violet/20'
                      : 'text-lavender-mist/80 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/10 flex flex-col gap-1.5">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-lavender-mist hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Buyer Marketplace</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Operational Header */}
        <header className="h-16 bg-white dark:bg-obsidian-surface-1 border-b border-lavender-mist dark:border-obsidian-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-ink dark:text-text-dark-primary lg:hidden rounded-lg hover:bg-porcelain dark:hover:bg-obsidian-surface-2"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-ink dark:text-text-dark-primary">
              Merchant Operations Hub
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* SLA Alert Chip */}
            <div className="hidden sm:flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-semantic-warning border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-semantic-warning animate-ping" />
              <span>SLA Cutoff: 4:00 PM</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 text-ink-muted hover:text-ink dark:text-text-dark-muted dark:hover:text-white rounded-xl hover:bg-porcelain dark:hover:bg-obsidian-surface-2 relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-electric-violet" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-ink-muted hover:text-ink dark:text-text-dark-muted dark:hover:text-white rounded-xl hover:bg-porcelain dark:hover:bg-obsidian-surface-2"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <RoleSwitcherBanner />
    </div>
  );
};

