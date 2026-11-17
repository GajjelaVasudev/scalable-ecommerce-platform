import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Layers,
  ShoppingBag,
  CreditCard,
  Tag,
  FileText,
  AlertTriangle,
  FileCheck,
  Sliders,
  RotateCcw,
  Activity,
  ArrowLeft,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { RoleSwitcherBanner } from '../components/common/RoleSwitcherBanner';
import { cn } from '../utils/cn';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'checking' | 'degraded'>('checking');

  useEffect(() => {
    api.health
      .get()
      .then(() => setSystemHealth('healthy'))
      .catch(() => setSystemHealth('degraded'));
  }, []);

  const navigation = [
    { name: 'Platform Executive', href: '/admin/dashboard', icon: Activity },
    { name: 'Product Catalog', href: '/admin/products', icon: Layers },
    { name: 'Category Governance', href: '/admin/categories', icon: Tag },
    { name: 'Product Moderation', href: '/admin/moderation', icon: FileCheck },
    { name: 'All Orders & Fulfilment', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Reconciliation & Refunds', href: '/admin/payments', icon: CreditCard },
    { name: 'Promotions & Campaigns', href: '/admin/promotions', icon: Tag },
    { name: 'Audit Logs & Reports', href: '/admin/reports', icon: FileText },
    { name: 'Risk, Fraud & Trust', href: '/admin/risk', icon: AlertTriangle },
    { name: 'Returns & Disputes', href: '/admin/disputes', icon: RotateCcw },
    { name: 'Access Control & RBAC', href: '/admin/settings', icon: Sliders },
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

      {/* 1. ADMIN SIDEBAR */}
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
            <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
              PLATFORM
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-lavender-mist hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Health Status Badge */}
        <div className="p-3 mx-3 my-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                systemHealth === 'healthy'
                  ? 'bg-emerald-400 animate-pulse'
                  : systemHealth === 'degraded'
                  ? 'bg-amber-400'
                  : 'bg-white/40'
              )}
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-lavender-mist/60 uppercase tracking-wider font-semibold">Backend Cluster</span>
              <span className="text-xs font-bold text-white capitalize">{systemHealth}</span>
            </div>
          </div>
          <span className="text-[10px] text-lavender-mist/50">Node v22 / Express 5</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
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
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-obsidian-surface-1 border-b border-lavender-mist dark:border-obsidian-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-ink dark:text-text-dark-primary lg:hidden rounded-lg hover:bg-porcelain dark:hover:bg-obsidian-surface-2"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h1 className="text-base font-bold text-ink dark:text-text-dark-primary">
                Platform Operations & Governance
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-semantic-success border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Audit Mode: Active</span>
            </div>

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

