import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MarketplaceHeader } from '../components/marketplace/MarketplaceHeader';
import { MarketplaceFooter } from '../components/marketplace/MarketplaceFooter';
import { CartDrawer } from '../components/marketplace/CartDrawer';

export const MarketplaceLayout: React.FC = () => {
  const location = useLocation();
  const isAccountSection = location.pathname.startsWith('/account') || location.pathname.startsWith('/orders');

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased font-sans">
      <MarketplaceHeader />
      <main className={`w-full ${isAccountSection ? 'pt-16' : 'pt-28'} bg-surface`}>
        <Outlet />
      </main>
      <CartDrawer />
      <MarketplaceFooter />
    </div>
  );
};
