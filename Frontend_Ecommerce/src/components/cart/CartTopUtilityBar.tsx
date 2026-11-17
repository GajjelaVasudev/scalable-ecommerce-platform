import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, PanelRight, Share2, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartTopUtilityBar: React.FC = () => {
  const { openDrawer } = useCart();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-surface-container-low/70 py-space-sm px-margin border-b border-surface-container-highest/60">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm">
        <nav className="flex items-center gap-2 font-body-sm text-on-surface-variant">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary transition-colors">
            Electronics
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">Shopping Cart</span>
        </nav>

        <div className="flex items-center gap-space-sm">
          <button
            id="open-drawer-btn"
            type="button"
            onClick={openDrawer}
            className="inline-flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container-high text-primary px-3 py-1.5 rounded-lg text-label-md font-label-md shadow-sm transition-all duration-200 cursor-pointer"
          >
            <PanelRight className="w-4 h-4" />
            <span>Preview Slide-Over Cart Drawer</span>
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold ml-1">
              Live Demo
            </span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary px-2.5 py-1.5 rounded-lg text-label-md transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

