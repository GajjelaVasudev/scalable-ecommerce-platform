import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { cn } from '../../utils/cn';
import { formatCurrency, calculateDiscount } from '../../utils/format';

export interface ExtendedProduct extends Product {
  brand?: string;
  brandTag?: string;
  badgeVariant?: 'primary' | 'error' | 'seller-choice' | 'award-winner';
  fastPrime?: boolean;
  twoDayDelivery?: boolean;
  codEligible?: boolean;
}

interface ProductCardProps {
  product: ExtendedProduct;
  className?: string;
  viewMode?: 'grid' | 'compact';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  viewMode = 'grid',
}) => {
  const { addItem } = useCart();
  const { isWishlisted: checkWishlisted, toggleWishlist } = useWishlist();
  const isWishlisted = checkWishlisted(product._id);
  const [isAdded, setIsAdded] = useState(false);

  const discount = product.originalPrice && product.originalPrice > product.price
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const brandText =
    product.brand ||
    (typeof product.seller === 'object' ? product.seller.username : 'OMIZON Collection');

  const badgeText = product.badge;
  const badgeVariant = product.badgeVariant || (
    badgeText?.toLowerCase().includes('fastprime') ? 'primary' :
    badgeText?.toLowerCase().includes('save') ? 'error' :
    badgeText?.toLowerCase().includes('choice') ? 'seller-choice' :
    badgeText?.toLowerCase().includes('award') ? 'award-winner' : 'primary'
  );

  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'error':
        return 'bg-error text-on-error font-bold';
      case 'seller-choice':
        return 'bg-inverse-surface text-inverse-on-surface font-semibold';
      case 'award-winner':
        return 'bg-secondary-container text-on-secondary-container font-semibold';
      case 'primary':
      default:
        return 'bg-primary text-on-primary';
    }
  };

  return (
    <article
      className={cn(
        'group bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between',
        viewMode === 'compact' ? 'p-3' : 'p-space-md',
        className
      )}
    >
      <div>
        {/* Product Media Image Container */}
        <div className="relative w-full aspect-square bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center mb-space-sm">
          <Link
            to={`/products/${product._id}`}
            className="w-full h-full flex items-center justify-center"
            title={product.name}
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>

          {/* Badge Tag */}
          {badgeText && (
            <span
              className={cn(
                'absolute top-2.5 left-2.5 font-label-sm text-label-sm px-2 py-0.5 rounded-full uppercase tracking-wider',
                getBadgeStyle()
              )}
            >
              {badgeText}
            </span>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className="absolute top-2.5 right-2.5 bg-surface-container-lowest/80 backdrop-blur text-outline hover:text-primary w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <span
              className={cn(
                'material-symbols-outlined text-[18px]',
                isWishlisted ? 'text-primary' : 'text-outline hover:text-primary'
              )}
              style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}
            >
              {isWishlisted ? 'favorite' : 'favorite_border'}
            </span>
          </button>
        </div>

        {/* Product Meta */}
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-outline uppercase tracking-wider">
            {brandText}
          </span>
          <Link to={`/products/${product._id}`}>
            <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Review Stars */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex items-center text-[#E27300]">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              <span className="font-title-sm text-title-sm ml-0.5 text-on-surface">
                {product.rating ? Number(product.rating).toFixed(1) : '4.8'}
              </span>
            </div>
            <span className="text-body-sm font-body-sm text-outline">
              ({(product.reviewCount || 120).toLocaleString()} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Add to Cart Footer */}
      <div className="mt-space-md pt-space-xs flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-price-card text-price-card text-on-surface tabular-nums">
            {formatCurrency(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="font-body-sm text-body-sm text-outline line-through tabular-nums">
                {formatCurrency(product.originalPrice)}
              </span>
              <span className="font-label-sm text-label-sm text-primary font-bold">
                -{discount}%
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className={cn(
            'w-full bg-primary hover:bg-secondary text-on-primary font-label-md text-label-md py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs',
            isAdded ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
          )}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isAdded ? 'check' : 'shopping_cart'}
          </span>
          <span>{isAdded ? 'Added to Bag' : 'Add to Cart'}</span>
        </button>
      </div>
    </article>
  );
};
