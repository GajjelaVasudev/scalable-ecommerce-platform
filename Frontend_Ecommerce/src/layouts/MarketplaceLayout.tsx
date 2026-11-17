import React from 'react';
import { Outlet } from 'react-router-dom';
import { MarketplaceHeader } from '../components/marketplace/MarketplaceHeader';
import { MarketplaceFooter } from '../components/marketplace/MarketplaceFooter';
import { CartDrawer } from '../components/marketplace/CartDrawer';
import { RoleSwitcherBanner } from '../components/common/RoleSwitcherBanner';

export const MarketplaceLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased font-sans">
      <MarketplaceHeader />
      <main className="w-full pt-40 bg-surface">
        <Outlet />
      </main>
      <CartDrawer />
      <RoleSwitcherBanner />
      <MarketplaceFooter />
    </div>
  );
};
