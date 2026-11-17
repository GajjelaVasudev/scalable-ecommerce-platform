import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Shield, Store, User as UserIcon, LogOut, ChevronUp, ChevronDown } from 'lucide-react';

export const RoleSwitcherBanner: React.FC = () => {
  // Only display in development mode; remove from customer-facing production experience
  if (import.meta.env.PROD) {
    return null;
  }

  const { user, isAuthenticated, switchRoleDemo, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      <div className="bg-midnight-violet text-white rounded-2xl shadow-modal border border-white/20 overflow-hidden flex flex-col">
        {/* Trigger Pill */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/10 transition-colors text-left"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] text-lavender-mist uppercase tracking-wider font-semibold">
              Live Role Mode
            </span>
            <span className="text-xs font-bold text-white capitalize flex items-center gap-1.5">
              {isAuthenticated ? `${user?.role} (${user?.username})` : 'Guest / Visitor'}
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-lavender-mist ml-2" />
          ) : (
            <ChevronUp className="w-4 h-4 text-lavender-mist ml-2" />
          )}
        </button>

        {/* Expandable Switcher Panel */}
        {isExpanded && (
          <div className="p-3 border-t border-white/10 flex flex-col gap-2 bg-midnight-violet/95 backdrop-blur-md">
            <span className="text-[10px] text-lavender-mist/70 uppercase tracking-wider px-1 font-semibold">
              Quick Role Simulation:
            </span>

            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  switchRoleDemo('buyer');
                  setIsExpanded(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                  user?.role === 'buyer'
                    ? 'bg-electric-violet text-white font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-lavender-mist'
                }`}
              >
                <UserIcon className="w-4 h-4 text-primary-fixed" />
                <div className="flex flex-col">
                  <span>Buyer: Priya Sharma</span>
                  <span className="text-[10px] opacity-75">Customer Account & Orders</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  switchRoleDemo('seller');
                  setIsExpanded(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                  user?.role === 'seller'
                    ? 'bg-electric-violet text-white font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-lavender-mist'
                }`}
              >
                <Store className="w-4 h-4 text-emerald-300" />
                <div className="flex flex-col">
                  <span>Seller: Apex Tech Hub</span>
                  <span className="text-[10px] opacity-75">Merchant Hub & Inventory</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  switchRoleDemo('admin');
                  setIsExpanded(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                  user?.role === 'admin'
                    ? 'bg-electric-violet text-white font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-lavender-mist'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-300" />
                <div className="flex flex-col">
                  <span>Admin: Platform Superadmin</span>
                  <span className="text-[10px] opacity-75">Governance & Reconciliation</span>
                </div>
              </button>
            </div>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsExpanded(false);
                }}
                className="mt-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Reset to Guest</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

