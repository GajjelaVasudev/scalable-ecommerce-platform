import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Bookmark, Trash2, Zap, Hourglass, CheckCircle2 } from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/format';

interface CartItemCardProps {
  item: CartItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSaveForLater: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  pincode?: string;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onSaveForLater,
  onUpdateQuantity,
  onRemove,
  pincode = '400001',
}) => {
  const [warrantyChecked, setWarrantyChecked] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    const prod = item.product;
    return typeof prod === 'object' && prod.image
      ? prod.image
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
  });

  const product = item.product;
  const productId = typeof product === 'object' ? product._id : product;
  const productName = typeof product === 'object' ? product.name : 'Product';
  const productDesc = typeof product === 'object' ? product.description : '';
  const price = item.price;
  const originalPrice =
    typeof product === 'object' && product.originalPrice
      ? product.originalPrice
      : Math.round(price * 1.18);
  const saveAmount = originalPrice > price ? originalPrice - price : 0;
  const discountPercent =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Seller info
  const sellerName =
    typeof product === 'object' && product.seller
      ? typeof product.seller === 'object'
        ? product.seller.username
        : 'OMIZON Retail Prime'
      : 'OMIZON Retail Prime';

  // Category name
  const categoryName =
    typeof product === 'object' && product.category
      ? typeof product.category === 'object'
        ? product.category.name
        : product.category
      : 'Omni Category';

  // Deal badge
  const dealBadge =
    typeof product === 'object' && product.badge
      ? product.badge
      : discountPercent > 0
      ? `${discountPercent}% OFF`
      : 'PRIME DEAL';

  const badgeBg =
    dealBadge.includes('OFF') || discountPercent > 0
      ? 'bg-emerald-600'
      : dealBadge.includes('PRIME')
      ? 'bg-secondary'
      : 'bg-primary';

  // Stock status
  const stock = typeof product === 'object' ? product.stock ?? 10 : 10;
  const isLowStock = stock <= 3;

  return (
    <article className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md transition-all hover:shadow-md border border-surface-container-highest/40">
      <div className="flex flex-col sm:flex-row gap-space-md items-start">
        {/* Checkbox and Thumbnail */}
        <div className="flex items-start gap-3 shrink-0">
          <input
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-2 w-4 h-4 rounded accent-primary cursor-pointer text-primary focus:ring-primary"
            type="checkbox"
            aria-label={`Select ${productName} for checkout`}
          />
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-surface-container-low relative overflow-hidden flex items-center justify-center shrink-0 border border-surface-container-highest/50">
            <img
              src={imgSrc}
              alt={productName}
              onError={() =>
                setImgSrc('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80')
              }
              className="w-full h-full object-cover rounded-lg"
            />
            {dealBadge && (
              <span
                className={`absolute top-1.5 left-1.5 ${badgeBg} text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wide`}
              >
                {dealBadge}
              </span>
            )}
          </div>
        </div>

        {/* Item Details */}
        <div className="flex-1 flex flex-col justify-between h-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-xs">
            <div className="flex-1 pr-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-primary block">
                {categoryName}
              </span>
              <Link to={`/products/${productId}`}>
                <h2 className="font-title-md text-title-md text-on-surface hover:text-primary cursor-pointer transition-colors line-clamp-2">
                  {productName}
                </h2>
              </Link>
              {productDesc && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">
                  {productDesc}
                </p>
              )}
              {item.variant && item.variant !== 'default' && (
                <span className="text-[11px] text-on-surface-variant font-medium block mt-0.5">
                  Specification: {item.variant}
                </span>
              )}

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[12px] text-on-surface-variant flex items-center gap-1">
                  Sold by <strong className="text-on-surface font-semibold">{sellerName}</strong>
                </span>
                <span className="inline-flex items-center text-[11px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-medium">
                  4.9 ★ Official Store
                </span>
                <span className="inline-flex items-center text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                  Fulfilled by OMIZON
                </span>
              </div>
            </div>

            {/* Price Readout */}
            <div className="text-right shrink-0 mt-2 sm:mt-0">
              <div className="font-price-card text-price-card text-on-surface">
                {formatCurrency(price)}
              </div>
              {originalPrice > price && (
                <div className="text-body-sm text-outline line-through">
                  {formatCurrency(originalPrice)}
                </div>
              )}
              {saveAmount > 0 && (
                <span className="text-[11px] font-semibold text-emerald-700 block">
                  Save {formatCurrency(saveAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Stock / Delivery info */}
          <div className="mt-2.5 flex items-center gap-1.5 text-body-sm flex-wrap">
            {isLowStock ? (
              <span className="text-amber-700 flex items-center gap-1 font-medium">
                <Hourglass className="w-4 h-4" />
                Only {stock} left in stock
              </span>
            ) : (
              <span className="text-emerald-800 flex items-center gap-1 font-medium">
                <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                In Stock
              </span>
            )}
            <span className="text-on-surface-variant">
              • Order within 3 hrs for Tomorrow Delivery to {pincode}
            </span>
          </div>

          {/* Optional Warranty Add-on Module */}
          <div className="mt-3 p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between gap-space-sm text-body-sm">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={warrantyChecked}
                onChange={(e) => setWarrantyChecked(e.target.checked)}
                className="w-4 h-4 rounded accent-primary cursor-pointer text-primary focus:ring-primary"
              />
              <span className="text-on-surface font-medium text-[13px]">
                Add 2-Year Comprehensive Accidental Damage Cover
              </span>
            </label>
            <span className="font-semibold text-on-surface shrink-0 text-[13px]">+₹1,899</span>
          </div>

          {/* Stepper and Actions Footer */}
          <div className="mt-space-md pt-space-sm border-t border-surface-container-highest/60 flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs">
              {/* Segmented Stepper */}
              <div className="inline-flex items-center bg-surface-container-low rounded-lg p-0.5 border border-surface-container-highest/40">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.quantity - 1)}
                  className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container-lowest transition-colors cursor-pointer"
                  title="Decrease quantity"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-on-surface text-[14px] tabular-nums">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.quantity + 1)}
                  className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container-lowest transition-colors cursor-pointer"
                  title="Increase quantity"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[12px] text-outline ml-1">
                {item.quantity > 1 ? `${formatCurrency(price * item.quantity)} for ${item.quantity} units` : 'Max 5 per order'}
              </span>
            </div>

            <div className="flex items-center gap-space-md text-body-sm">
              <button
                type="button"
                onClick={onSaveForLater}
                className="text-primary hover:text-secondary font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save for Later</span>
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="text-on-surface-variant hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

