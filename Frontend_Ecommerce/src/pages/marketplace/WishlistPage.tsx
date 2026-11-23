import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AccountLayout } from '../../components/account/AccountLayout';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { WishlistItem } from '../../types';
import { formatCurrency, calculateDiscount } from '../../utils/format';
import {
  Heart,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Star,
  LogIn,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const WishlistPage: React.FC = () => {
  const {
    wishlist,
    wishlistCount,
    isLoading,
    removeFromWishlist,
    clearWishlist,
    moveToCart,
  } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [movingItemId, setMovingItemId] = useState<string | null>(null);
  const [isMovingAll, setIsMovingAll] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      await removeFromWishlist(id);
      showToast(`Removed "${name}" from your wishlist.`);
    } catch {
      showToast('Could not remove item. Please try again.');
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    const itemName = item.product?.name || item.name || 'Product';
    setMovingItemId(item.id);
    try {
      await moveToCart(item);
      showToast(`Moved "${itemName}" to your shopping cart!`);
    } catch (err: any) {
      showToast(err?.message || 'Could not move item to cart. Please try again.');
    } finally {
      setMovingItemId(null);
    }
  };

  const handleMoveAllInStock = async () => {
    const inStockItems = wishlist.filter((item) => item.isAvailable);
    if (inStockItems.length === 0) return;

    setIsMovingAll(true);
    let movedCount = 0;
    let failedCount = 0;
    for (const item of inStockItems) {
      try {
        await moveToCart(item);
        movedCount++;
      } catch (err) {
        failedCount++;
        console.error('Error moving item to cart:', err);
      }
    }
    setIsMovingAll(false);
    if (failedCount > 0) {
      showToast(`Moved ${movedCount} item(s) to cart (${failedCount} failed).`);
    } else {
      showToast(`Moved ${movedCount} in-stock item(s) to your shopping cart!`);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        await clearWishlist();
        showToast('Wishlist has been cleared.');
      } catch {
        showToast('Could not clear wishlist. Please try again.');
      }
    }
  };

  const inStockCount = wishlist.filter((i) => i.isAvailable).length;

  return (
    <AccountLayout activeKey="wishlist">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Guest Banner if not authenticated */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200/60 dark:border-purple-800/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-title-sm text-sm sm:text-base font-semibold text-on-surface">
                Guest Wishlist Active
              </h2>
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
                Sign in to permanently save and sync your wishlist across all your devices.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Link
              to="/login?redirect=/account/wishlist"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-1.5 justify-center flex-1 sm:flex-none shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/register?redirect=/account/wishlist"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors flex items-center justify-center flex-1 sm:flex-none"
            >
              Register
            </Link>
          </div>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-md text-on-surface font-bold text-2xl">
              Your Wishlist &amp; Saved Items
            </h1>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
              {wishlistCount} {wishlistCount === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Track price drops, stock updates, and easily move saved products into your cart.
          </p>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {inStockCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                disabled={isMovingAll}
                onClick={handleMoveAllInStock}
                icon={<ShoppingBag className="w-4 h-4" />}
              >
                {isMovingAll ? 'Moving to Cart...' : `Move ${inStockCount} In-Stock to Cart`}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              icon={<Trash2 className="w-4 h-4 text-red-500" />}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && wishlist.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 h-64 flex flex-col justify-between">
              <div className="h-32 bg-surface-container-high rounded-xl mb-4" />
              <div className="h-4 bg-surface-container-high rounded w-3/4 mb-2" />
              <div className="h-4 bg-surface-container-high rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && wishlist.length === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center max-w-xl mx-auto border border-outline-variant/20 shadow-sm my-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-headline-md text-on-surface font-bold text-xl">
            Your Wishlist is Empty
          </h3>
          <p className="font-body-md text-on-surface-variant text-sm mt-2 mb-6">
            Explore our curated catalog, latest electronics, and top deals to save items you love.
          </p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Explore Catalog
          </Button>
        </div>
      )}

      {/* Wishlist Grid */}
      {wishlist.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wishlist.map((item) => {
            const prod = item.product || item;
            const prodId = item.id || prod._id;
            const prodName = prod.name || item.name || 'OMIZON Product';
            const prodPrice = typeof prod.price === 'number' ? prod.price : (item.price || 0);
            const prodOriginalPrice = prod.originalPrice || item.originalPrice;
            const discount = prodOriginalPrice && prodOriginalPrice > prodPrice
              ? calculateDiscount(prodOriginalPrice, prodPrice)
              : 0;
            const prodImage = prod.image || item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
            const categoryName = typeof prod.category === 'object' ? prod.category?.name : (prod.category || item.category || 'General');
            const ratingVal = prod.rating || item.rating || 4.8;
            const reviewCountVal = prod.reviewCount || item.ratingCount || 120;
            const isInStock = item.isAvailable;
            const stockQty = item.stockCount;
            const isMoving = movingItemId === item.id;

            return (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative aspect-video rounded-xl bg-surface-container-high overflow-hidden mb-4 group">
                    <Link to={`/products/${prodId}`}>
                      <img
                        src={prodImage}
                        alt={prodName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
                        }}
                      />
                    </Link>
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                        {discount}% OFF
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id, prodName)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 hover:bg-surface text-red-500 hover:text-red-700 flex items-center justify-center backdrop-blur-sm shadow transition-colors cursor-pointer"
                      title="Remove from wishlist"
                      aria-label={`Remove ${prodName} from wishlist`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Meta details */}
                  <div className="flex items-center justify-between text-xs text-outline mb-1">
                    <span className="font-semibold uppercase tracking-wider">{categoryName}</span>
                    <div className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{Number(ratingVal).toFixed(1)}</span>
                      <span className="text-outline">({reviewCountVal})</span>
                    </div>
                  </div>

                  <Link to={`/products/${prodId}`} className="group/link">
                    <h3 className="font-title-sm text-on-surface font-bold text-sm sm:text-base line-clamp-2 group-hover/link:text-primary transition-colors">
                      {prodName}
                    </h3>
                  </Link>
                  {prod.description && (
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1 line-clamp-1">
                      {prod.description}
                    </p>
                  )}

                  {/* Stock status indicator */}
                  <div className="mt-3">
                    {isInStock ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        In Stock {stockQty !== undefined ? `(${stockQty} available)` : ''}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Currently Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="mt-5 pt-4 border-t border-outline-variant/15 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-title-md text-on-surface font-bold text-lg tabular-nums">
                      {formatCurrency(prodPrice)}
                    </span>
                    {prodOriginalPrice && prodOriginalPrice > prodPrice && (
                      <span className="font-body-sm text-outline line-through text-xs tabular-nums">
                        {formatCurrency(prodOriginalPrice)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={isInStock ? 'primary' : 'outline'}
                      size="sm"
                      disabled={!isInStock || isMoving}
                      onClick={() => handleMoveToCart(item)}
                      icon={<ShoppingBag className="w-3.5 h-3.5" />}
                    >
                      {isMoving ? 'Moving...' : isInStock ? 'Move to Cart' : 'Out of Stock'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
};

export default WishlistPage;
