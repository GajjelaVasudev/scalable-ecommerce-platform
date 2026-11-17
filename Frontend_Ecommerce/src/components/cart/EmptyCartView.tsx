import React from 'react';
import { ShoppingBag, ArrowRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyCartViewProps {
  onRestoreSampleCart: () => void;
}

export const EmptyCartView: React.FC<EmptyCartViewProps> = ({ onRestoreSampleCart }) => {
  return (
    <div
      id="empty-cart-view"
      className="flex flex-col items-center justify-center py-16 px-4 bg-surface-container-lowest rounded-2xl shadow-sm text-center max-w-2xl mx-auto my-8 border border-surface-container-highest/50"
    >
      <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-space-md border border-surface-container-highest/40">
        <ShoppingBag className="w-12 h-12 text-primary stroke-[1.5]" />
      </div>
      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">
        Your OMIZON Cart is empty
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
        Explore today&apos;s exclusive spotlight discounts, trending electronics, and flash steals curated
        specifically for your profile.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-space-sm">
        <button
          type="button"
          onClick={onRestoreSampleCart}
          id="restore-cart-btn"
          className="bg-primary hover:bg-secondary text-on-primary px-space-lg py-2.5 rounded-lg font-title-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restore Sample Cart</span>
        </button>
        <Link
          to="/products"
          className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-space-lg py-2.5 rounded-lg font-title-sm transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Explore Trending Deals</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

