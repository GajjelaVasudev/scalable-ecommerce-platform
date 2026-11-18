import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AccountLayout } from '../../components/account/AccountLayout';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  getStableUserId,
  isDemoUser,
  getAccountWishlist,
  setAccountWishlist,
} from '../../utils/accountStorage';
import { formatCurrency, calculateDiscount } from '../../utils/format';
import {
  Heart,
  ShoppingBag,
  Trash2,
  Package,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface WishlistItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  ratingCount: number;
  image: string;
  inStock: boolean;
  stockCount: number;
  specs: string;
}

const INITIAL_WISHLIST: WishlistItem[] = [
  {
    id: 'prod_soundpulse_01',
    name: 'SoundPulse Studio Pro Wireless ANC Headphones',
    category: 'Electronics',
    price: 24999,
    originalPrice: 32999,
    rating: 4.8,
    ratingCount: 342,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    inStock: true,
    stockCount: 12,
    specs: 'Active Noise Cancellation • 40hr Battery',
  },
  {
    id: 'prod_artisan_candle',
    name: 'AuraGlow Minimalist Architect Desk Lamp with Qi Charger',
    category: 'Home & Living',
    price: 8499,
    originalPrice: 11999,
    rating: 4.9,
    ratingCount: 128,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    inStock: true,
    stockCount: 4,
    specs: 'Wireless Fast Charging Base • Stepless Dimming',
  },
  {
    id: 'prod_stoneware_03',
    name: 'Artisan Handcrafted Stoneware Dining Set (16-Piece)',
    category: 'Kitchen & Dining',
    price: 4899,
    originalPrice: 6499,
    rating: 4.7,
    ratingCount: 88,
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80',
    inStock: true,
    stockCount: 2,
    specs: 'Matte Glaze Finish • Microwave & Dishwasher Safe',
  },
  {
    id: 'prod_leather_bag',
    name: 'Heritage Full-Grain Italian Leather Weekender Duffle',
    category: 'Accessories',
    price: 18499,
    originalPrice: 24999,
    rating: 4.9,
    ratingCount: 94,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    inStock: false,
    stockCount: 0,
    specs: 'Vegetable Tanned • Solid Brass Hardware',
  },
];

export const WishlistPage: React.FC = () => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const userId = getStableUserId(user);
  const isDemo = isDemoUser(user);
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const saved = getAccountWishlist(userId);
    if (saved && saved.length > 0) return saved;
    if (isDemo) return INITIAL_WISHLIST;
    return [];
  });

  useEffect(() => {
    const saved = getAccountWishlist(userId);
    if (saved && saved.length > 0) {
      setWishlist(saved);
    } else if (isDemo) {
      setWishlist(INITIAL_WISHLIST);
    } else {
      setWishlist([]);
    }
  }, [userId, isDemo]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRemove = (id: string, name: string) => {
    const updated = wishlist.filter((w) => w.id !== id);
    setWishlist(updated);
    setAccountWishlist(userId, updated);
    showToast(`Removed "${name}" from your wishlist.`);
  };

  const handleMoveToCart = (item: WishlistItem) => {
    addItem(
      {
        _id: item.id,
        name: item.name,
        description: item.specs,
        price: item.price,
        originalPrice: item.originalPrice,
        stock: item.stockCount,
        category: { _id: 'cat_wishlist', name: item.category, slug: item.category.toLowerCase().replace(/\s+/g, '-') },
        seller: { _id: 'seller_01', username: 'OMIZON Retail' },
        image: item.image,
        status: 'active',
        rating: item.rating,
        reviewCount: item.ratingCount,
      },
      1
    );
    const updated = wishlist.filter((w) => w.id !== item.id);
    setWishlist(updated);
    setAccountWishlist(userId, updated);
    showToast(`Moved "${item.name}" to shopping cart!`);
  };

  return (
    <AccountLayout activeKey="wishlist">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-md text-on-surface font-bold text-2xl">
              Your Wishlist & Collections
            </h1>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
              {wishlist.length} Items
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Curated products you have saved for future purchases and price-drop notifications.
          </p>
        </div>

        {wishlist.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              wishlist.forEach((item) => {
                if (item.inStock) {
                  addItem(
                    {
                      _id: item.id,
                      name: item.name,
                      description: item.specs,
                      price: item.price,
                      originalPrice: item.originalPrice,
                      stock: item.stockCount,
                      category: { _id: 'cat_wishlist', name: item.category, slug: item.category.toLowerCase().replace(/\s+/g, '-') },
                      seller: { _id: 'seller_01', username: 'OMIZON Retail' },
                      image: item.image,
                      status: 'active',
                      rating: item.rating,
                      reviewCount: item.ratingCount,
                    },
                    1
                  );
                }
              });
              setWishlist(wishlist.filter((w) => !w.inStock));
              showToast('Moved all in-stock items to your shopping cart!');
            }}
            icon={<ShoppingBag className="w-4 h-4" />}
          >
            Move All In-Stock to Cart
          </Button>
        )}
      </div>

      {/* Empty State */}
      {wishlist.length === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center max-w-xl mx-auto border border-outline-variant/20 shadow-sm my-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-headline-md text-on-surface font-bold text-xl">
            Your Wishlist is Empty
          </h3>
          <p className="font-body-md text-on-surface-variant text-sm mt-2 mb-6">
            Explore our curated collections, luxury tech, and artisanal essentials to save items here.
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
            const discount = calculateDiscount(item.originalPrice, item.price);

            return (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative aspect-video rounded-xl bg-surface-container-high overflow-hidden mb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                        {discount}% OFF
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id, item.name)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 hover:bg-surface text-red-500 flex items-center justify-center backdrop-blur-sm shadow transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Meta details */}
                  <div className="flex items-center justify-between text-xs text-outline mb-1">
                    <span>{item.category}</span>
                    <div className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{item.rating}</span>
                      <span className="text-outline">({item.ratingCount})</span>
                    </div>
                  </div>

                  <h3 className="font-title-sm text-on-surface font-bold text-sm line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                    {item.specs}
                  </p>

                  {/* Stock status indicator */}
                  <div className="mt-3">
                    {item.inStock ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        In Stock ({item.stockCount} available)
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Currently Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="mt-5 pt-4 border-t border-outline-variant/15 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-title-md text-on-surface font-bold text-base">
                      {formatCurrency(item.price)}
                    </span>
                    {item.originalPrice > item.price && (
                      <span className="font-body-sm text-outline line-through text-xs">
                        {formatCurrency(item.originalPrice)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={item.inStock ? 'primary' : 'outline'}
                      size="sm"
                      disabled={!item.inStock}
                      onClick={() => handleMoveToCart(item)}
                      icon={<ShoppingBag className="w-3.5 h-3.5" />}
                    >
                      {item.inStock ? 'Move to Cart' : 'Notify Me'}
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
