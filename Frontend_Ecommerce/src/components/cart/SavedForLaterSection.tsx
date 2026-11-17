import React from 'react';
import { Bookmark, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/format';

export interface SavedItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  note?: string;
  productRef?: Product;
}

export const INITIAL_SAVED_ITEMS: SavedItem[] = [
  {
    id: 'saved_01',
    name: 'ErgoComfort Dual-Monitor Arm',
    price: 4299,
    originalPrice: 5499,
    image:
      'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=500&q=80',
    note: 'In Stock',
  },
  {
    id: 'saved_02',
    name: 'Apex Leather Desk Mat 900x400mm',
    price: 1199,
    originalPrice: 1499,
    image:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    note: 'Price dropped by ₹300',
  },
];

interface SavedForLaterSectionProps {
  items: SavedItem[];
  onMoveToCart: (item: SavedItem) => void;
  onRemoveSaved: (id: string) => void;
}

export const SavedForLaterSection: React.FC<SavedForLaterSectionProps> = ({
  items,
  onMoveToCart,
  onRemoveSaved,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-space-lg pt-space-lg border-t border-surface-container-highest/80 flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          <h3 className="font-title-lg text-title-lg text-on-surface">Saved for Later</h3>
          <span className="bg-surface-container-high px-2 py-0.5 rounded-full font-label-sm text-label-sm text-on-surface-variant">
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        <Link
          to="/products"
          className="text-primary hover:text-secondary font-label-md text-label-md transition-colors flex items-center gap-1"
        >
          <span>See all in Wishlist</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex gap-space-sm items-center border border-surface-container-highest/40"
          >
            <div className="w-20 h-20 bg-surface-container-low rounded-lg shrink-0 overflow-hidden border border-surface-container-highest/40 flex items-center justify-center">
              <img
                src={item.image}
                alt={item.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=300&q=80';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
              <div>
                <h4 className="font-title-sm text-title-sm text-on-surface truncate" title={item.name}>
                  {item.name}
                </h4>
                <p className="font-price-card text-[15px] text-on-surface mt-0.5">
                  {formatCurrency(item.price)}
                </p>
                {item.note && (
                  <span className="text-[11px] text-emerald-700 font-medium block">
                    {item.note}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onMoveToCart(item)}
                  className="bg-primary/10 hover:bg-primary text-primary hover:text-on-primary text-[12px] font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  Move to Cart
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveSaved(item.id)}
                  className="text-on-surface-variant hover:text-error text-[12px] transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
