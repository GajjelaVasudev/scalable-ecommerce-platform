import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../services/api';
import { Product } from '../../types';
import { formatCurrency, calculateDiscount } from '../../utils/format';
import { getStableUserId, getAccountLastOrder } from '../../utils/accountStorage';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist: toggleWishlistContext } = useWishlist();
  const navigate = useNavigate();

  const userId = getStableUserId(user);
  const firstName = user?.username ? user.username.split(/[\s_]+/)[0] : 'Customer';
  const lastOrder = getAccountLastOrder(userId);

  // Live Catalog State from Backend
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toggleWishlist = (productId: string, productName: string, price: number, image: string, category: string) => {
    toggleWishlistContext({
      _id: productId,
      id: productId,
      name: productName,
      price,
      image,
      category,
      specs: 'Verified OMIZON SKU',
    } as any);
  };

  // Fetch live products for homepage sections from MongoDB-backed public API
  const fetchHomeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [featuredRes, dealsRes] = await Promise.all([
        api.products.list({ featured: true, limit: 8 }),
        api.products.list({ limit: 5, sort: 'price_desc' }),
      ]);

      if (featuredRes?.products && Array.isArray(featuredRes.products)) {
        setFeaturedProducts(featuredRes.products);
      }
      if (dealsRes?.products && Array.isArray(dealsRes.products)) {
        setDealProducts(dealsRes.products);
      }
    } catch (err: any) {
      console.error('Failed to load homepage catalog data:', err);
      setError(
        err?.message ||
          'Unable to connect to the OMIZON catalog service. Please check your backend connection.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Live Countdown Timer for Flash Reductions
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 36,
    seconds: 57,
  });

  useEffect(() => {
    let totalSeconds = 4 * 3600 + 36 * 60 + 57;
    const interval = setInterval(() => {
      if (totalSeconds <= 0) {
        totalSeconds = 12 * 3600;
      }
      totalSeconds--;
      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Filter tab states for Recommendations & Trending
  const [recommendationFilter, setRecommendationFilter] = useState<'all' | 'workspace' | 'sound'>('all');
  const [trendingTab, setTrendingTab] = useState<'top5' | 'electronics' | 'home' | 'coffee' | 'beauty'>('top5');

  // Quick add to cart
  const handleQuickAdd = (
    id: string,
    name: string,
    price: number,
    image: string,
    category: string,
    originalPrice?: number
  ) => {
    addItem({
      _id: id,
      name,
      description: name,
      price,
      originalPrice: originalPrice || Math.round(price * 1.25),
      stock: 25,
      category,
      image,
      images: [image],
      rating: 4.8,
      reviewCount: 120,
      seller: { _id: '6a7f809930f3650284ab9701', username: 'OMIZON Official Store' },
    });
  };

  return (
    <div className="flex flex-col w-full bg-surface">
      {/* 1. Live Order Dispatch Ticker & Personalized Welcome Ribbon */}
      <section className="w-full bg-surface-container-low py-space-sm px-margin-mobile md:px-margin border-b border-lavender-mist/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[16px]">waving_hand</span>
            </span>
            <div className="truncate">
              <span className="font-title-sm text-title-sm text-ink font-semibold">
                {isAuthenticated && user?.username ? `Welcome back, ${firstName}` : 'Welcome to OMIZON'}
              </span>
              <span className="font-body-sm text-body-sm text-ink-muted ml-1.5 hidden sm:inline">
                • Pick up where you left off in Bandra West
              </span>
            </div>
          </div>

          {/* Live Delivery Tracker Badge */}
          {lastOrder ? (
            <Link
              to={`/account/orders/${lastOrder._id}`}
              className="group flex items-center gap-space-xs bg-surface-container-lowest px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all shrink-0"
              data-path="order-history"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-semantic-success" />
              </span>
              <span className="font-label-sm text-label-sm font-semibold text-ink">
                Order #{lastOrder._id.slice(-8)} ({lastOrder.items[0]?.name || 'OMIZON Shipment'}):
              </span>
              <span className="font-label-sm text-label-sm text-semantic-success font-bold capitalize">
                {lastOrder.deliveryStatus === 'shipped' ? 'Out for Delivery by 2:00 PM' : lastOrder.deliveryStatus}
              </span>
              <span className="material-symbols-outlined text-[16px] text-ink-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all">
                chevron_right
              </span>
            </Link>
          ) : (
            <Link
              to="/account/orders"
              className="group flex items-center gap-space-xs bg-surface-container-lowest px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all shrink-0"
              data-path="order-history"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-semantic-success" />
              </span>
              <span className="font-label-sm text-label-sm font-semibold text-ink">
                FastX Express Nationwide Delivery Active:
              </span>
              <span className="font-label-sm text-label-sm text-semantic-success font-bold">
                Guaranteed 1-Day Fulfillment
              </span>
              <span className="material-symbols-outlined text-[16px] text-ink-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all">
                chevron_right
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Catalog Load Error Alert if any */}
      {error && (
        <div className="w-full bg-error/10 border-y border-error/20 px-margin-mobile md:px-margin py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-error">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <p className="font-body-md font-medium">{error}</p>
            </div>
            <button
              onClick={fetchHomeData}
              className="px-4 py-1.5 bg-primary text-on-primary rounded-lg font-title-sm hover:bg-secondary transition-colors shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/*
        CRITICAL STITCH REQUIREMENT:
        The four-widget section (Continue Shopping, Buy it Again, Wishlist Price Drops, Prime Hub)
        is completely removed. The next content moves naturally upward into Today's Featured Deals!
      */}

      {/* 2. Contextual Today's Featured Deals & Flash Reductions */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-space-md" id="flash-deals">
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-lavender-mist/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg">
            <div className="flex items-center gap-space-md flex-wrap">
              <h2 className="font-headline-sm text-headline-sm text-ink font-bold">
                Today's Featured Deals &amp; Flash Reductions
              </h2>
              {/* Live Countdown Timer */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold shadow-xs">
                <span className="material-symbols-outlined text-[16px] animate-pulse">timer</span>
                <span>
                  Ends in{' '}
                  <span className="tabular-nums font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
                    {String(timeLeft.seconds).padStart(2, '0')}s
                  </span>
                </span>
              </div>
            </div>
            <Link
              to="/products?deals=true"
              className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold hover:text-royal-purple transition-colors"
              data-path="todays-deals"
            >
              <span>Explore all 480+ deals</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {/* Horizontal 5-card responsive carousel/grid matching Stitch */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
            {/* Deal Card 1: Electronics */}
            <div className="bg-porcelain rounded-xl p-space-sm flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="relative w-full aspect-square rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEWVUdeZ9f41qlhJ-XYarUUJ9CahEO4KsyN1yT8IhCRVi3_qHhd0Nv-MrwXCAmd5qD6TpsZWaqmwj-nUQpxf83J0xM7FfNHbTr0qvUEP28UjiWOcSKwkfA7Mm3VlaZAAvntS-AVD4NwqZP9k2BWog2l3TjcVjO9Zl3tGD7Wv5L2xkCTC8u-AVdEuCT1XRYVuTPihItVZhVerxe5OS3gQ4VQXK6GSRQFd7LPfYOZCRm"
                  alt="Sony WH-1000XM5 Wireless ANC Headphones"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-semantic-error text-on-error font-label-sm text-label-sm rounded-full font-bold shadow-sm">
                  17% OFF
                </span>
                <button
                  aria-label="Add to Wishlist"
                  onClick={() =>
                    toggleWishlist(
                      'deal-01',
                      'Sony WH-1000XM5 Wireless ANC Headphones',
                      24990,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBEWVUdeZ9f41qlhJ-XYarUUJ9CahEO4KsyN1yT8IhCRVi3_qHhd0Nv-MrwXCAmd5qD6TpsZWaqmwj-nUQpxf83J0xM7FfNHbTr0qvUEP28UjiWOcSKwkfA7Mm3VlaZAAvntS-AVD4NwqZP9k2BWog2l3TjcVjO9Zl3tGD7Wv5L2xkCTC8u-AVdEuCT1XRYVuTPihItVZhVerxe5OS3gQ4VQXK6GSRQFd7LPfYOZCRm',
                      'Electronics'
                    )
                  }
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest/90 text-ink-muted hover:text-semantic-error flex items-center justify-center shadow-xs cursor-pointer"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isWishlisted('deal-01') ? 'text-semantic-error fill-current' : ''
                    }`}
                  >
                    favorite
                  </span>
                </button>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider">
                  Deal of the Day
                </span>
                <Link to="/products">
                  <h3 className="font-title-sm text-title-sm text-ink font-semibold line-clamp-2 mt-1 hover:text-primary transition-colors">
                    Sony WH-1000XM5 Wireless ANC Headphones
                  </h3>
                </Link>
                <div className="flex items-center gap-1 text-semantic-warning mt-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-ink">4.8</span>
                  <span className="font-body-sm text-body-sm text-ink-muted">(2.4k)</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-price-card text-price-card text-ink font-bold">₹24,990</span>
                  <span className="font-body-sm text-body-sm text-ink-muted line-through">₹29,990</span>
                </div>
                <p className="font-label-sm text-label-sm text-semantic-success font-semibold mt-0.5">
                  Fast 1-day delivery
                </p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'deal-01',
                    'Sony WH-1000XM5 Wireless ANC Headphones',
                    24990,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBEWVUdeZ9f41qlhJ-XYarUUJ9CahEO4KsyN1yT8IhCRVi3_qHhd0Nv-MrwXCAmd5qD6TpsZWaqmwj-nUQpxf83J0xM7FfNHbTr0qvUEP28UjiWOcSKwkfA7Mm3VlaZAAvntS-AVD4NwqZP9k2BWog2l3TjcVjO9Zl3tGD7Wv5L2xkCTC8u-AVdEuCT1XRYVuTPihItVZhVerxe5OS3gQ4VQXK6GSRQFd7LPfYOZCRm',
                    'Electronics',
                    29990
                  )
                }
                className="w-full mt-space-sm py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-md text-label-md rounded-lg shadow-xs transition-colors font-medium cursor-pointer"
                type="button"
              >
                Add to Cart
              </button>
            </div>

            {/* Deal Card 2: Home & Kitchen (Lightning Deal) */}
            <div className="bg-porcelain rounded-xl p-space-sm flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="relative w-full aspect-square rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXzkcLqnYJcQ7-WYujuWJoO4_V2sAGJcI68zYpd5ZpANAfgEJMSGsWj1eXOQPcq8g1b-J7vPzJoAM-iPdeXcQUbjNLG8qsk0tKkM73zCh2EOnOQDac8CMtiW9tLA2l7kNoLx73NhHFZ9QaTAMGkCDHt-ZUycYR_QGUKh-4OxkDytRd-Nu8bRzJn-eHwnblB0KyhJL2J9V07QvYfqfGJRDnVA04cGaYjntoQdXpbDZU"
                  alt="Aura Ceramic Pour-Over & Kettle Set"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-semantic-error text-on-error font-label-sm text-label-sm rounded-full font-bold shadow-sm">
                  24% OFF
                </span>
                <button
                  aria-label="Add to Wishlist"
                  onClick={() =>
                    toggleWishlist(
                      'deal-02',
                      'Aura Ceramic Pour-Over & Kettle Set',
                      2890,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCXzkcLqnYJcQ7-WYujuWJoO4_V2sAGJcI68zYpd5ZpANAfgEJMSGsWj1eXOQPcq8g1b-J7vPzJoAM-iPdeXcQUbjNLG8qsk0tKkM73zCh2EOnOQDac8CMtiW9tLA2l7kNoLx73NhHFZ9QaTAMGkCDHt-ZUycYR_QGUKh-4OxkDytRd-Nu8bRzJn-eHwnblB0KyhJL2J9V07QvYfqfGJRDnVA04cGaYjntoQdXpbDZU',
                      'Home & Living'
                    )
                  }
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest/90 text-ink-muted hover:text-semantic-error flex items-center justify-center shadow-xs cursor-pointer"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isWishlisted('deal-02') ? 'text-semantic-error fill-current' : ''
                    }`}
                  >
                    favorite
                  </span>
                </button>
              </div>
              <div>
                <div className="flex items-center justify-between text-semantic-warning">
                  <span className="font-label-sm text-label-sm font-bold">⚡ Lightning Deal</span>
                  <span className="font-label-sm text-label-sm text-ink-muted">72% Claimed</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-semantic-warning h-full w-[72%] rounded-full" />
                </div>
                <Link to="/products">
                  <h3 className="font-title-sm text-title-sm text-ink font-semibold line-clamp-2 mt-1.5 hover:text-primary transition-colors">
                    Aura Ceramic Pour-Over &amp; Kettle Set
                  </h3>
                </Link>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-price-card text-price-card text-ink font-bold">₹2,890</span>
                  <span className="font-body-sm text-body-sm text-ink-muted line-through">₹3,800</span>
                </div>
                <p className="font-label-sm text-label-sm text-semantic-success font-semibold mt-0.5">
                  Limited deal price
                </p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'deal-02',
                    'Aura Ceramic Pour-Over & Kettle Set',
                    2890,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuCXzkcLqnYJcQ7-WYujuWJoO4_V2sAGJcI68zYpd5ZpANAfgEJMSGsWj1eXOQPcq8g1b-J7vPzJoAM-iPdeXcQUbjNLG8qsk0tKkM73zCh2EOnOQDac8CMtiW9tLA2l7kNoLx73NhHFZ9QaTAMGkCDHt-ZUycYR_QGUKh-4OxkDytRd-Nu8bRzJn-eHwnblB0KyhJL2J9V07QvYfqfGJRDnVA04cGaYjntoQdXpbDZU',
                    'Home & Living',
                    3800
                  )
                }
                className="w-full mt-space-sm py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-md text-label-md rounded-lg shadow-xs transition-colors font-medium cursor-pointer"
                type="button"
              >
                Claim Deal
              </button>
            </div>

            {/* Deal Card 3: Personal Care & Beauty */}
            <div className="bg-porcelain rounded-xl p-space-sm flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="relative w-full aspect-square rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3qn7Dv0EOpD8jZEMCsKneJ0DB_p4l7_S7RshzTG60vlZ4_j_MKRnWVCF7NmdPyhU5H9bpRDKs00t699IHf9VIOz5iFWzwHDBz-TgzQktPM0bfX3PeNtPtuxfK51vTQ5GzO3s3G_yOh5_L_xiYdsSI8QX4kI7cJ4b99hA62Nkx0ZfUVyvzsSrNxOYzfp9S4s5PsvH9_aNKF-MIqIrEtuEHNzDhjtx-cNDtdZX7ENht"
                  alt="GlowBiome Pro-Peptide Restorative Kit"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-semantic-error text-on-error font-label-sm text-label-sm rounded-full font-bold shadow-sm">
                  30% OFF
                </span>
                <button
                  aria-label="Add to Wishlist"
                  onClick={() =>
                    toggleWishlist(
                      'deal-03',
                      'GlowBiome Pro-Peptide Restorative Kit',
                      1690,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuC3qn7Dv0EOpD8jZEMCsKneJ0DB_p4l7_S7RshzTG60vlZ4_j_MKRnWVCF7NmdPyhU5H9bpRDKs00t699IHf9VIOz5iFWzwHDBz-TgzQktPM0bfX3PeNtPtuxfK51vTQ5GzO3s3G_yOh5_L_xiYdsSI8QX4kI7cJ4b99hA62Nkx0ZfUVyvzsSrNxOYzfp9S4s5PsvH9_aNKF-MIqIrEtuEHNzDhjtx-cNDtdZX7ENht',
                      'Beauty & Personal Care'
                    )
                  }
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest/90 text-ink-muted hover:text-semantic-error flex items-center justify-center shadow-xs cursor-pointer"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isWishlisted('deal-03') ? 'text-semantic-error fill-current' : ''
                    }`}
                  >
                    favorite
                  </span>
                </button>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-ink-muted font-semibold uppercase tracking-wider">
                  Beauty &amp; Wellness
                </span>
                <Link to="/products">
                  <h3 className="font-title-sm text-title-sm text-ink font-semibold line-clamp-2 mt-1 hover:text-primary transition-colors">
                    GlowBiome Pro-Peptide Restorative Kit
                  </h3>
                </Link>
                <div className="flex items-center gap-1 text-semantic-warning mt-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-ink">4.8</span>
                  <span className="font-body-sm text-body-sm text-ink-muted">(840+)</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-price-card text-price-card text-ink font-bold">₹1,690</span>
                  <span className="font-body-sm text-body-sm text-ink-muted line-through">₹2,400</span>
                </div>
                <p className="font-label-sm text-label-sm text-semantic-success font-semibold mt-0.5">Fast Next-Day</p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'deal-03',
                    'GlowBiome Pro-Peptide Restorative Kit',
                    1690,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuC3qn7Dv0EOpD8jZEMCsKneJ0DB_p4l7_S7RshzTG60vlZ4_j_MKRnWVCF7NmdPyhU5H9bpRDKs00t699IHf9VIOz5iFWzwHDBz-TgzQktPM0bfX3PeNtPtuxfK51vTQ5GzO3s3G_yOh5_L_xiYdsSI8QX4kI7cJ4b99hA62Nkx0ZfUVyvzsSrNxOYzfp9S4s5PsvH9_aNKF-MIqIrEtuEHNzDhjtx-cNDtdZX7ENht',
                    'Beauty & Personal Care',
                    2400
                  )
                }
                className="w-full mt-space-sm py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-md text-label-md rounded-lg shadow-xs transition-colors font-medium cursor-pointer"
                type="button"
              >
                Add to Cart
              </button>
            </div>

            {/* Deal Card 4: Computing & Workspace */}
            <div className="bg-porcelain rounded-xl p-space-sm flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="relative w-full aspect-square rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjPO6uzz9ii4-y13CvXbzHi11hBZZjMCJa3UDBGnhwrWKuPaLxypXDcjapsBc18Q_BhErfWwy3Wb59Ul5NBpYVPFChRy2DCItFtohiuJG_F7j9gRXTwhFfg3mtCNuYo7MWkHvCJtKVy_l52Pv3YG9ewwt1yyVT2h38EPLzdwwJw4OGWyP-dTGcEUu4Qa5phRSw8Qv7v6yIVY_NKoNEYbV2ubxzPAmlGVoEoV0xHuhc"
                  alt="KeyForge Wireless Numpad & Wristrest"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-semantic-error text-on-error font-label-sm text-label-sm rounded-full font-bold shadow-sm">
                  27% OFF
                </span>
                <button
                  aria-label="Add to Wishlist"
                  onClick={() =>
                    toggleWishlist(
                      'deal-04',
                      'KeyForge Wireless Numpad & Wristrest',
                      2190,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBjPO6uzz9ii4-y13CvXbzHi11hBZZjMCJa3UDBGnhwrWKuPaLxypXDcjapsBc18Q_BhErfWwy3Wb59Ul5NBpYVPFChRy2DCItFtohiuJG_F7j9gRXTwhFfg3mtCNuYo7MWkHvCJtKVy_l52Pv3YG9ewwt1yyVT2h38EPLzdwwJw4OGWyP-dTGcEUu4Qa5phRSw8Qv7v6yIVY_NKoNEYbV2ubxzPAmlGVoEoV0xHuhc',
                      'Electronics'
                    )
                  }
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest/90 text-ink-muted hover:text-semantic-error flex items-center justify-center shadow-xs cursor-pointer"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isWishlisted('deal-04') ? 'text-semantic-error fill-current' : ''
                    }`}
                  >
                    favorite
                  </span>
                </button>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-ink-muted font-semibold uppercase tracking-wider">
                  Workspace Tech
                </span>
                <Link to="/products">
                  <h3 className="font-title-sm text-title-sm text-ink font-semibold line-clamp-2 mt-1 hover:text-primary transition-colors">
                    KeyForge Wireless Numpad &amp; Wristrest
                  </h3>
                </Link>
                <div className="flex items-center gap-1 text-semantic-warning mt-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-ink">4.9</span>
                  <span className="font-body-sm text-body-sm text-ink-muted">(412)</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-price-card text-price-card text-ink font-bold">₹2,190</span>
                  <span className="font-body-sm text-body-sm text-ink-muted line-through">₹2,999</span>
                </div>
                <p className="font-label-sm text-label-sm text-semantic-success font-semibold mt-0.5">
                  Fast 1-day delivery
                </p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'deal-04',
                    'KeyForge Wireless Numpad & Wristrest',
                    2190,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBjPO6uzz9ii4-y13CvXbzHi11hBZZjMCJa3UDBGnhwrWKuPaLxypXDcjapsBc18Q_BhErfWwy3Wb59Ul5NBpYVPFChRy2DCItFtohiuJG_F7j9gRXTwhFfg3mtCNuYo7MWkHvCJtKVy_l52Pv3YG9ewwt1yyVT2h38EPLzdwwJw4OGWyP-dTGcEUu4Qa5phRSw8Qv7v6yIVY_NKoNEYbV2ubxzPAmlGVoEoV0xHuhc',
                    'Electronics',
                    2999
                  )
                }
                className="w-full mt-space-sm py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-md text-label-md rounded-lg shadow-xs transition-colors font-medium cursor-pointer"
                type="button"
              >
                Add to Cart
              </button>
            </div>

            {/* Deal Card 5: Sports & Wellness */}
            <div className="bg-porcelain rounded-xl p-space-sm flex flex-col justify-between hover:shadow-md transition-all group col-span-2 sm:col-span-1 md:col-span-1">
              <div className="relative w-full aspect-square rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAU_pBpOhl8t0afLSaDPPDCUZtx4GuX-xAA-v36MAx6y_uLOZjd3fl6ELkKykfDPLb8zIDpIBczxcKNfuEh13pZqUQyuFmyVv_CB6-2EnYDTq08L7EnkmKOtSuRQdlbJ6VYrxJOwaPcPQ_jqLheLWCbGKsAvCaqkPqA3fpfaCFp0YpKuHJzbJKyWyfv-3O9wxvwj5-dvzGX_MuZi6i0fZFTU_FrFhGnS1DjUn-aM8e2"
                  alt="AeroGrip Stainless Thermal Hydro Flask 1L"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-semantic-error text-on-error font-label-sm text-label-sm rounded-full font-bold shadow-sm">
                  29% OFF
                </span>
                <button
                  aria-label="Add to Wishlist"
                  onClick={() =>
                    toggleWishlist(
                      'deal-05',
                      'AeroGrip Stainless Thermal Hydro Flask 1L',
                      1199,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuAU_pBpOhl8t0afLSaDPPDCUZtx4GuX-xAA-v36MAx6y_uLOZjd3fl6ELkKykfDPLb8zIDpIBczxcKNfuEh13pZqUQyuFmyVv_CB6-2EnYDTq08L7EnkmKOtSuRQdlbJ6VYrxJOwaPcPQ_jqLheLWCbGKsAvCaqkPqA3fpfaCFp0YpKuHJzbJKyWyfv-3O9wxvwj5-dvzGX_MuZi6i0fZFTU_FrFhGnS1DjUn-aM8e2',
                      'Sports & Outdoors'
                    )
                  }
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest/90 text-ink-muted hover:text-semantic-error flex items-center justify-center shadow-xs cursor-pointer"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isWishlisted('deal-05') ? 'text-semantic-error fill-current' : ''
                    }`}
                  >
                    favorite
                  </span>
                </button>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-semantic-warning font-semibold uppercase tracking-wider">
                  Limited Quantity
                </span>
                <Link to="/products">
                  <h3 className="font-title-sm text-title-sm text-ink font-semibold line-clamp-2 mt-1 hover:text-primary transition-colors">
                    AeroGrip Stainless Thermal Hydro Flask 1L
                  </h3>
                </Link>
                <div className="flex items-center gap-1 text-semantic-warning mt-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-ink">4.7</span>
                  <span className="font-body-sm text-body-sm text-ink-muted">(1.9k)</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-price-card text-price-card text-ink font-bold">₹1,199</span>
                  <span className="font-body-sm text-body-sm text-ink-muted line-through">₹1,699</span>
                </div>
                <p className="font-label-sm text-label-sm text-semantic-success font-semibold mt-0.5">
                  Fast 1-day delivery
                </p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'deal-05',
                    'AeroGrip Stainless Thermal Hydro Flask 1L',
                    1199,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuAU_pBpOhl8t0afLSaDPPDCUZtx4GuX-xAA-v36MAx6y_uLOZjd3fl6ELkKykfDPLb8zIDpIBczxcKNfuEh13pZqUQyuFmyVv_CB6-2EnYDTq08L7EnkmKOtSuRQdlbJ6VYrxJOwaPcPQ_jqLheLWCbGKsAvCaqkPqA3fpfaCFp0YpKuHJzbJKyWyfv-3O9wxvwj5-dvzGX_MuZi6i0fZFTU_FrFhGnS1DjUn-aM8e2',
                    'Sports & Outdoors',
                    1699
                  )
                }
                className="w-full mt-space-sm py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-md text-label-md rounded-lg shadow-xs transition-colors font-medium cursor-pointer"
                type="button"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Editorial Multi-Category Discovery Grids */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-space-md">
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-ink font-bold">
              Explore by Category &amp; Curated Edits
            </h2>
            <p className="font-body-sm text-body-sm text-ink-muted">
              Hand-selected departments with verified quality guarantees
            </p>
          </div>
          <Link
            to="/products"
            className="font-label-md text-label-md text-primary font-semibold hover:text-royal-purple hidden sm:inline-flex items-center gap-1 transition-colors"
          >
            <span>Browse full directory</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-space-md">
          {/* Category 1 */}
          <Link
            to="/products?category=Electronics"
            className="group bg-surface-container-lowest p-space-sm rounded-xl shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center border border-lavender-mist/40"
          >
            <div className="w-full aspect-square rounded-lg bg-surface-container-low overflow-hidden mb-space-xs">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoOADdHtELRxhXVetptInXIUS0GTZpAyqPi_iK_nxK5HoHrBqKj0f-vRIm5UufgvFnD23Yd_ItuUt5Uqugai7yZcQa2_N-FMcipdZRMEtZK4-B4YBBb8R06fJSr-BHrvqDlQhBZEfL2R3sZxZFhWm70AUdiScFpcnxg51o_3eAY9aVv4F_cOBwECVFRjQa3LhABoiXLTT2jnVQzol8nRge5qCUXKeQs8V3jyFLjpgA"
                alt="Tech & Precision Audio"
              />
            </div>
            <span className="font-title-sm text-title-sm text-ink font-semibold group-hover:text-primary transition-colors line-clamp-1">
              Tech &amp; Precision Audio
            </span>
            <span className="font-label-sm text-label-sm text-ink-muted mt-0.5">840+ new items</span>
          </Link>

          {/* Category 2 */}
          <Link
            to="/products?category=Home+%26+Living"
            className="group bg-surface-container-lowest p-space-sm rounded-xl shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center border border-lavender-mist/40"
          >
            <div className="w-full aspect-square rounded-lg bg-surface-container-low overflow-hidden mb-space-xs">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcL1G0fqQA6VznxTinQk2Dmw3w_dnR5dqHOpyO5IIt6B8uiXNddCwcgTf5PnIQeQDmR4qubXhrY_Kx_UX4IMFgyfidTfmI8H589s7wXCZHm_iIOHJHvSaE91JQYR2prKwbRNVkpIyt405L7tnaWOcEJ-uJGJu0X__aFuLo1KotLfL7eGQWVoMQvpbcIRv-inai10Q_8yvskY9iM5R4cW7q9M66_ZYudRffuqMcfwVT"
                alt="Scandinavian Living"
              />
            </div>
            <span className="font-title-sm text-title-sm text-ink font-semibold group-hover:text-primary transition-colors line-clamp-1">
              Scandinavian Living
            </span>
            <span className="font-label-sm text-label-sm text-ink-muted mt-0.5">1,200+ curated</span>
          </Link>

          {/* Category 3 */}
          <Link
            to="/products?category=Grocery+%26+Essentials"
            className="group bg-surface-container-lowest p-space-sm rounded-xl shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center border border-lavender-mist/40"
          >
            <div className="w-full aspect-square rounded-lg bg-surface-container-low overflow-hidden mb-space-xs">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKBRAOVkgKOrX9CBzkth3RHLlAjbk0gmpN6Tghc_pHdazjDokoU1xysseyBouzTjtJ5d_ujV7dlikbX039c38ZQNdAwVUEtGaz2xz7CiyCx9_8C_BBuuuAIY1DcMwQu6sKosSWbU4JGd5LBQD4ZK9QcLnckLxNH0s4rBHnRsFEzMVmbKXVsu_xue-iRgXb8IT8XxXXG1nogNb1wR8sRBQutzWk7TW7LaNLioQH0aV8"
                alt="Artisan Coffee & Pantry"
              />
            </div>
            <span className="font-title-sm text-title-sm text-ink font-semibold group-hover:text-primary transition-colors line-clamp-1">
              Artisan Coffee &amp; Pantry
            </span>
            <span className="font-label-sm text-label-sm text-ink-muted mt-0.5">450+ items</span>
          </Link>

          {/* Category 4 */}
          <Link
            to="/products?category=Beauty+%26+Personal+Care"
            className="group bg-surface-container-lowest p-space-sm rounded-xl shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center border border-lavender-mist/40"
          >
            <div className="w-full aspect-square rounded-lg bg-surface-container-low overflow-hidden mb-space-xs">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_dboOigaHkyR0tqomywlMx4WSHS8MA4dNol8cITAtBywMiLgyqoOhTsbgOM14UW_veQHDhPafHkCgLNKjR78ILGpJTaCndTpUrsRySzTS6_Jay0soSeTZM88xrbAzVzgDFpg6NENNj1ZopIUeSuStbnHHN8NH47EgA_mX33OI3_oWFX1cC70zMFo560_yJzWI-retFCEsuZwYsa2aBpTMBl2ficFDCUxmvJlmHtsx"
                alt="Clinical Skincare"
              />
            </div>
            <span className="font-title-sm text-title-sm text-ink font-semibold group-hover:text-primary transition-colors line-clamp-1">
              Clinical Skincare
            </span>
            <span className="font-label-sm text-label-sm text-ink-muted mt-0.5">620+ items</span>
          </Link>

          {/* Category 5 */}
          <Link
            to="/products?category=Sports+%26+Outdoors"
            className="group bg-surface-container-lowest p-space-sm rounded-xl shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center border border-lavender-mist/40"
          >
            <div className="w-full aspect-square rounded-lg bg-surface-container-low overflow-hidden mb-space-xs">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVFmw7SMZKFdT8ZN989zSSqHJOt67aXfBxrEcRVTW-acQFVmliAafPNgEPdJH7J-tZCMOGLlXSo6QcNrDEwqM1sOOzaVofxOJPv5PBXCLQV9bfLQHEykfa175ruospJBAZ55ViGcSbcw101UcjSt92Br9OCkGzLD1J7xhwqskEq8C97He44cTO3cffCFBl6Z9tLpPMlUf5AsbSDEY-KVU5lvrc5Ffturqy3A0-zt-z"
                alt="Active & Ergonomics"
              />
            </div>
            <span className="font-title-sm text-title-sm text-ink font-semibold group-hover:text-primary transition-colors line-clamp-1">
              Active &amp; Ergonomics
            </span>
            <span className="font-label-sm text-label-sm text-ink-muted mt-0.5">310+ items</span>
          </Link>

          {/* Category 6 */}
          <Link
            to="/products?category=Books"
            className="group bg-surface-container-lowest p-space-sm rounded-xl shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center border border-lavender-mist/40"
          >
            <div className="w-full aspect-square rounded-lg bg-surface-container-low overflow-hidden mb-space-xs">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAH7jJ8ysaZkRi_pS-EpEk237xeEeLunvypJFYEuFFKWiPYTk1h5_D6rmz5pf5gg6gD8MX2fkETSc7uNETorYxJvrIutLWY_O0m7Lfgct47jZDsCRARN7IzbcJNHN3Bn7jykR6bb5jktNW_h4p5MLlzNBMjD5bXr1ynut08IgOm1cjctS686GxhyF-ePldLEsjCb8FNDZabxH9yK17UaNA790Ycsm9VtaWSszytGJed"
                alt="Books & Stationery"
              />
            </div>
            <span className="font-title-sm text-title-sm text-ink font-semibold group-hover:text-primary transition-colors line-clamp-1">
              Books &amp; Stationery
            </span>
            <span className="font-label-sm text-label-sm text-ink-muted mt-0.5">180+ editions</span>
          </Link>
        </div>
      </section>

      {/* 4. Personalized Recommendations for Active Buyer */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs mb-space-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-electric-violet text-[22px]">auto_awesome</span>
              <h2 className="font-headline-sm text-headline-sm text-ink font-bold">
                Recommended for You, {firstName}
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-ink-muted mt-0.5">
              Based on your recent interest in Ergonomic Workspaces &amp; Precision Audio
            </p>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => setRecommendationFilter('all')}
              className={`px-3 py-1 rounded-full font-label-md text-label-md font-medium transition-colors cursor-pointer ${
                recommendationFilter === 'all'
                  ? 'bg-midnight-violet text-on-primary'
                  : 'bg-surface-container-low text-ink hover:bg-surface-container'
              }`}
              type="button"
            >
              All Recommendations
            </button>
            <button
              onClick={() => setRecommendationFilter('workspace')}
              className={`px-3 py-1 rounded-full font-label-md text-label-md font-medium transition-colors cursor-pointer ${
                recommendationFilter === 'workspace'
                  ? 'bg-midnight-violet text-on-primary'
                  : 'bg-surface-container-low text-ink hover:bg-surface-container'
              }`}
              type="button"
            >
              Workspace
            </button>
            <button
              onClick={() => setRecommendationFilter('sound')}
              className={`px-3 py-1 rounded-full font-label-md text-label-md font-medium transition-colors cursor-pointer ${
                recommendationFilter === 'sound'
                  ? 'bg-midnight-violet text-on-primary'
                  : 'bg-surface-container-low text-ink hover:bg-surface-container'
              }`}
              type="button"
            >
              Sound
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {/* Rec 1 */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-lavender-mist/40">
            <div>
              <div className="relative w-full aspect-square rounded-lg bg-porcelain overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj5AjiXaF76mZFXY5ROQ8zoyyRenOoeAqjOSNgP_pJFPoR8l34TTiPzj2c19jE3J8K4Y2RFloQf5gaOFg7TZ9Q2iugonsDu5PJzFyhUWvzDTXJkBO2_8fyKZhVGbZd69o4ZWPoqjP2sypSlTrbn8G3r8oKsfX9CcUGS5nLc6xSvKDPsIqBPycviTjsi1jYzz7e2YTIf2YFVNYGeNVJUF-BdnnGLeqdOaOym3GrID4K"
                  alt="UltraFine 32 inch 4K Colorist Display Stand"
                />
                <button
                  aria-label="Save to Wishlist"
                  onClick={() =>
                    toggleWishlist(
                      'rec-01',
                      'UltraFine 32" 4K Colorist Display Stand & Hub Mount',
                      12499,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBj5AjiXaF76mZFXY5ROQ8zoyyRenOoeAqjOSNgP_pJFPoR8l34TTiPzj2c19jE3J8K4Y2RFloQf5gaOFg7TZ9Q2iugonsDu5PJzFyhUWvzDTXJkBO2_8fyKZhVGbZd69o4ZWPoqjP2sypSlTrbn8G3r8oKsfX9CcUGS5nLc6xSvKDPsIqBPycviTjsi1jYzz7e2YTIf2YFVNYGeNVJUF-BdnnGLeqdOaOym3GrID4K',
                      'Electronics'
                    )
                  }
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/90 text-ink-muted hover:text-semantic-error flex items-center justify-center shadow-xs cursor-pointer"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isWishlisted('rec-01') ? 'text-semantic-error fill-current' : ''
                    }`}
                  >
                    favorite
                  </span>
                </button>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-ink font-label-sm text-label-sm font-semibold shadow-xs">
                  Top Rated
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-ink-muted">ErgoDesk Studio</p>
              <Link to="/products">
                <h3 className="font-title-sm text-title-sm text-ink font-semibold line-clamp-2 mt-1 hover:text-primary transition-colors">
                  UltraFine 32" 4K Colorist Display Stand &amp; Hub Mount
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 text-semantic-warning mt-1.5">
                <div className="flex text-[14px]">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star_half
                  </span>
                </div>
                <span className="font-label-sm text-label-sm font-bold text-ink">4.9</span>
                <span className="font-body-sm text-body-sm text-ink-muted">(1,420)</span>
              </div>
              <div className="mt-2">
                <span className="font-price-card text-price-card text-ink font-bold">₹12,499</span>
                <span className="font-body-sm text-body-sm text-ink-muted line-through ml-1.5">₹15,000</span>
              </div>
              <p className="font-label-sm text-label-sm text-semantic-success font-semibold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Fast 1-Day Delivery to 400050</span>
              </p>
            </div>
            <button
              onClick={() =>
                handleQuickAdd(
                  'rec-01',
                  'UltraFine 32" 4K Colorist Display Stand & Hub Mount',
                  12499,
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBj5AjiXaF76mZFXY5ROQ8zoyyRenOoeAqjOSNgP_pJFPoR8l34TTiPzj2c19jE3J8K4Y2RFloQf5gaOFg7TZ9Q2iugonsDu5PJzFyhUWvzDTXJkBO2_8fyKZhVGbZd69o4ZWPoqjP2sypSlTrbn8G3r8oKsfX9CcUGS5nLc6xSvKDPsIqBPycviTjsi1jYzz7e2YTIf2YFVNYGeNVJUF-BdnnGLeqdOaOym3GrID4K',
                  'Electronics',
                  15000
                )
              }
              className="w-full mt-space-md py-2 bg-electric-violet hover:bg-royal-purple text-on-primary font-title-sm text-title-sm rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              <span>Add to Cart</span>
            </button>
          </div>

          {/* Rec 2 */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-lavender-mist/40">
            <div>
              <div className="relative w-full aspect-square rounded-lg bg-porcelain overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXLmDegnf9HjirVUsmG2ZI4_4nNjmlRe8lSneJSzXvJWrlAcF3pPNilWXvoGWdemWeh7FSg-ddH6tld1VJlq4HwURlJ1wwBhl27Gi0tKRSVz7M0iNIw4mVxifxhpksMXW7CrZGGAZ8z0fn7LM3n-uhNU0SaBWkaE12OeIHwIN4muIN0DkAJIyOzbsdQi1o9p91zaub27hs_y3IgY0g4ewYx5Z5Z6IU-cJHeYGHDeBm"
                  alt="Orbit Soundbar Pro Spatial Audio with Dolby Atmos"
                />
                <button
                  aria-label="Save to Wishlist"
                  onClick={() =>
                    toggleWishlist(
                      'rec-02',
                      'Orbit Soundbar Pro Spatial Audio with Dolby Atmos',
                      14990,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCXLmDegnf9HjirVUsmG2ZI4_4nNjmlRe8lSneJSzXvJWrlAcF3pPNilWXvoGWdemWeh7FSg-ddH6tld1VJlq4HwURlJ1wwBhl27Gi0tKRSVz7M0iNIw4mVxifxhpksMXW7CrZGGAZ8z0fn7LM3n-uhNU0SaBWkaE12OeIHwIN4muIN0DkAJIyOzbsdQi1o9p91zaub27hs_y3IgY0g4ewYx5Z5Z6IU-cJHeYGHDeBm',
                      'Electronics'
                    )
                  }
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/90 text-ink-muted hover:text-semantic-error flex items-center justify-center shadow-xs cursor-pointer"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isWishlisted('rec-02') ? 'text-semantic-error fill-current' : ''
                    }`}
                  >
                    favorite
                  </span>
                </button>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-semantic-success text-on-primary font-label-sm text-label-sm font-semibold shadow-xs">
                  Save ₹1,000 Coupon
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-ink-muted">Orbit Acoustics</p>
              <Link to="/products">
                <h3 className="font-title-sm text-title-sm text-ink font-semibold line-clamp-2 mt-1 hover:text-primary transition-colors">
                  Orbit Soundbar Pro Spatial Audio with Dolby Atmos
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 text-semantic-warning mt-1.5">
                <div className="flex text-[14px]">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <span className="font-label-sm text-label-sm font-bold text-ink">5.0</span>
                <span className="font-body-sm text-body-sm text-ink-muted">(620)</span>
              </div>
              <div className="mt-2">
                <span className="font-price-card text-price-card text-ink font-bold">₹14,990</span>
                <span className="font-body-sm text-body-sm text-ink-muted line-through ml-1.5">₹18,500</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <input defaultChecked className="rounded accent-electric-violet" id="coupon-1" type="checkbox" />
                <label className="font-label-sm text-label-sm text-ink font-medium" htmlFor="coupon-1">
                  Apply ₹1,000 coupon
                </label>
              </div>
            </div>
            <button
              onClick={() =>
                handleQuickAdd(
                  'rec-02',
                  'Orbit Soundbar Pro Spatial Audio with Dolby Atmos',
                  14990,
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuCXLmDegnf9HjirVUsmG2ZI4_4nNjmlRe8lSneJSzXvJWrlAcF3pPNilWXvoGWdemWeh7FSg-ddH6tld1VJlq4HwURlJ1wwBhl27Gi0tKRSVz7M0iNIw4mVxifxhpksMXW7CrZGGAZ8z0fn7LM3n-uhNU0SaBWkaE12OeIHwIN4muIN0DkAJIyOzbsdQi1o9p91zaub27hs_y3IgY0g4ewYx5Z5Z6IU-cJHeYGHDeBm',
                  'Electronics',
                  18500
                )
              }
              className="w-full mt-space-md py-2 bg-electric-violet hover:bg-royal-purple text-on-primary font-title-sm text-title-sm rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              <span>Add to Cart</span>
            </button>
          </div>

          {/* Rec 3 */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-lavender-mist/40">
            <div>
              <div className="relative w-full aspect-square rounded-lg bg-porcelain overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm6erlXlcZ2UnzADnkxLTUXRn13_9VXJdajmnwSTkKJyq211_s5Gs1rhzcmIAqCRfoqZhGW25aQKWlA7fBccR0fBx-WhkjbeIOJ5YQO9fsjMHr1CVuntnL93TpFy7YdC7JME-UXFcmLK6XZGkSoi2rgdyUaqOJj7emdlOvz-mAkX8y0_zww6ODph9ETI2yU42EsDINt0epyIcv3-Ab6v2gbAGM659jFEJ0BfPAixcH"
                  alt="Walnut Solid Wood Dual Monitor Riser"
                />
                <button
                  aria-label="Save to Wishlist"
                  onClick={() =>
                    toggleWishlist(
                      'rec-03',
                      'Walnut Solid Wood Dual Monitor Riser with Cable Duct',
                      4890,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuAm6erlXlcZ2UnzADnkxLTUXRn13_9VXJdajmnwSTkKJyq211_s5Gs1rhzcmIAqCRfoqZhGW25aQKWlA7fBccR0fBx-WhkjbeIOJ5YQO9fsjMHr1CVuntnL93TpFy7YdC7JME-UXFcmLK6XZGkSoi2rgdyUaqOJj7emdlOvz-mAkX8y0_zww6ODph9ETI2yU42EsDINt0epyIcv3-Ab6v2gbAGM659jFEJ0BfPAixcH',
                      'Home & Living'
                    )
                  }
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/90 text-ink-muted hover:text-semantic-error flex items-center justify-center shadow-xs cursor-pointer"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isWishlisted('rec-03') ? 'text-semantic-error fill-current' : ''
                    }`}
                  >
                    favorite
                  </span>
                </button>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-ink font-label-sm text-label-sm font-semibold shadow-xs">
                  Artisan Made
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-ink-muted">Nordic Woodcrafts</p>
              <Link to="/products">
                <h3 className="font-title-sm text-title-sm text-ink font-semibold line-clamp-2 mt-1 hover:text-primary transition-colors">
                  Walnut Solid Wood Dual Monitor Riser with Cable Duct
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 text-semantic-warning mt-1.5">
                <div className="flex text-[14px]">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star_half
                  </span>
                </div>
                <span className="font-label-sm text-label-sm font-bold text-ink">4.7</span>
                <span className="font-body-sm text-body-sm text-ink-muted">(950)</span>
              </div>
              <div className="mt-2">
                <span className="font-price-card text-price-card text-ink font-bold">₹4,890</span>
                <span className="font-body-sm text-body-sm text-ink-muted line-through ml-1.5">₹6,200</span>
              </div>
              <p className="font-label-sm text-label-sm text-semantic-success font-semibold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Fast 1-Day Delivery</span>
              </p>
            </div>
            <button
              onClick={() =>
                handleQuickAdd(
                  'rec-03',
                  'Walnut Solid Wood Dual Monitor Riser with Cable Duct',
                  4890,
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuAm6erlXlcZ2UnzADnkxLTUXRn13_9VXJdajmnwSTkKJyq211_s5Gs1rhzcmIAqCRfoqZhGW25aQKWlA7fBccR0fBx-WhkjbeIOJ5YQO9fsjMHr1CVuntnL93TpFy7YdC7JME-UXFcmLK6XZGkSoi2rgdyUaqOJj7emdlOvz-mAkX8y0_zww6ODph9ETI2yU42EsDINt0epyIcv3-Ab6v2gbAGM659jFEJ0BfPAixcH',
                  'Home & Living',
                  6200
                )
              }
              className="w-full mt-space-md py-2 bg-electric-violet hover:bg-royal-purple text-on-primary font-title-sm text-title-sm rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              <span>Add to Cart</span>
            </button>
          </div>

          {/* Rec 4 */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-lavender-mist/40">
            <div>
              <div className="relative w-full aspect-square rounded-lg bg-porcelain overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWJO3jQc8Iv-RZbaCNV-pyrpnsor2wTUeMBuDm6I1fHyv4M6r0b4SK9ElXLNifygJeUq8jfMGdZwYC165kTgnNecaLQWIE9KTN00foX8oeJ1Ooz5QK_yYFLTWEuuF0GNauV4OJd4M7UuvDT8uYyAkxiWsz4CuT8AtMslzX38BMZALqbbe5T5u7PjXrPDkU0HxuEMv0bGuKydFDBN3jUMqmdPWOUGoo-mgx2qCrNrWy"
                  alt="StudioPulse Desk Mic & Boom Arm Broadcast Kit"
                />
                <button
                  aria-label="Save to Wishlist"
                  onClick={() =>
                    toggleWishlist(
                      'rec-04',
                      'StudioPulse Desk Mic & Boom Arm Broadcast Kit',
                      6290,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuDWJO3jQc8Iv-RZbaCNV-pyrpnsor2wTUeMBuDm6I1fHyv4M6r0b4SK9ElXLNifygJeUq8jfMGdZwYC165kTgnNecaLQWIE9KTN00foX8oeJ1Ooz5QK_yYFLTWEuuF0GNauV4OJd4M7UuvDT8uYyAkxiWsz4CuT8AtMslzX38BMZALqbbe5T5u7PjXrPDkU0HxuEMv0bGuKydFDBN3jUMqmdPWOUGoo-mgx2qCrNrWy',
                      'Electronics'
                    )
                  }
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/90 text-ink-muted hover:text-semantic-error flex items-center justify-center shadow-xs cursor-pointer"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isWishlisted('rec-04') ? 'text-semantic-error fill-current' : ''
                    }`}
                  >
                    favorite
                  </span>
                </button>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-semantic-warning text-on-error font-label-sm text-label-sm font-bold shadow-xs">
                  #1 Best Seller
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-ink-muted">StudioPulse Lab</p>
              <Link to="/products">
                <h3 className="font-title-sm text-title-sm text-ink font-semibold line-clamp-2 mt-1 hover:text-primary transition-colors">
                  StudioPulse Desk Mic &amp; Boom Arm Broadcast Kit
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 text-semantic-warning mt-1.5">
                <div className="flex text-[14px]">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <span className="font-label-sm text-label-sm font-bold text-ink">4.9</span>
                <span className="font-body-sm text-body-sm text-ink-muted">(2,180)</span>
              </div>
              <div className="mt-2">
                <span className="font-price-card text-price-card text-ink font-bold">₹6,290</span>
                <span className="font-body-sm text-body-sm text-ink-muted line-through ml-1.5">₹7,999</span>
              </div>
              <p className="font-label-sm text-label-sm text-semantic-success font-semibold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Fast 1-Day Delivery</span>
              </p>
            </div>
            <button
              onClick={() =>
                handleQuickAdd(
                  'rec-04',
                  'StudioPulse Desk Mic & Boom Arm Broadcast Kit',
                  6290,
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuDWJO3jQc8Iv-RZbaCNV-pyrpnsor2wTUeMBuDm6I1fHyv4M6r0b4SK9ElXLNifygJeUq8jfMGdZwYC165kTgnNecaLQWIE9KTN00foX8oeJ1Ooz5QK_yYFLTWEuuF0GNauV4OJd4M7UuvDT8uYyAkxiWsz4CuT8AtMslzX38BMZALqbbe5T5u7PjXrPDkU0HxuEMv0bGuKydFDBN3jUMqmdPWOUGoo-mgx2qCrNrWy',
                  'Electronics',
                  7999
                )
              }
              className="w-full mt-space-md py-2 bg-electric-violet hover:bg-royal-purple text-on-primary font-title-sm text-title-sm rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Trending & Best Sellers Across India */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-space-md">
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-lavender-mist/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-ink font-bold">
                Trending &amp; Best Sellers Across India
              </h2>
              <p className="font-body-sm text-body-sm text-ink-muted">
                Updated hourly based on buyer velocity and authenticated reviews
              </p>
            </div>
            {/* Category Tab Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setTrendingTab('top5')}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-semibold shrink-0 transition-colors cursor-pointer ${
                  trendingTab === 'top5'
                    ? 'bg-midnight-violet text-on-primary'
                    : 'bg-surface-container-low hover:bg-surface-container text-ink'
                }`}
                type="button"
              >
                Overall Top 5
              </button>
              <button
                onClick={() => setTrendingTab('electronics')}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-medium shrink-0 transition-colors cursor-pointer ${
                  trendingTab === 'electronics'
                    ? 'bg-midnight-violet text-on-primary'
                    : 'bg-surface-container-low hover:bg-surface-container text-ink'
                }`}
                type="button"
              >
                Electronics
              </button>
              <button
                onClick={() => setTrendingTab('home')}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-medium shrink-0 transition-colors cursor-pointer ${
                  trendingTab === 'home'
                    ? 'bg-midnight-violet text-on-primary'
                    : 'bg-surface-container-low hover:bg-surface-container text-ink'
                }`}
                type="button"
              >
                Home &amp; Living
              </button>
              <button
                onClick={() => setTrendingTab('coffee')}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-medium shrink-0 transition-colors cursor-pointer ${
                  trendingTab === 'coffee'
                    ? 'bg-midnight-violet text-on-primary'
                    : 'bg-surface-container-low hover:bg-surface-container text-ink'
                }`}
                type="button"
              >
                Gourmet Coffee
              </button>
              <button
                onClick={() => setTrendingTab('beauty')}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-medium shrink-0 transition-colors cursor-pointer ${
                  trendingTab === 'beauty'
                    ? 'bg-midnight-violet text-on-primary'
                    : 'bg-surface-container-low hover:bg-surface-container text-ink'
                }`}
                type="button"
              >
                Beauty
              </button>
            </div>
          </div>

          {/* Numbered Ranked Horizontal Strip (#1 through #5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
            {/* Rank #1 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors relative flex flex-col justify-between group">
              <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-semantic-warning text-on-error font-title-sm text-title-sm font-bold flex items-center justify-center shadow-xs">
                #1
              </span>
              <div className="aspect-square w-full rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm mt-3">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwv3B3z_CnEfsgubQe9xdgbhOwvkhvrhV7MCE5s2WSO407t7mqFMBYfK4PkhWNXtk6TciUlNQ_TcLgWjHK61yFanM8iL477270ZAm_mirk0SMMMQg1DxEnGcsXafFqU-7WhBIX6h7BBDTXvlAHwOUrhSBUugx9UlVrdqLF8fKCCIvUv7kBbs_-uNfcB3rTsF8CQV7EpeJOpr5cg3k5bq4hzaaabveW_zA_pLPWqJaN"
                  alt="ApexBook M3 Ultra 32GB"
                />
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-ink-muted">Computers</span>
                <Link to="/products">
                  <h4 className="font-title-sm text-title-sm text-ink font-bold line-clamp-1 hover:text-primary transition-colors">
                    ApexBook M3 Ultra 32GB
                  </h4>
                </Link>
                <p className="font-body-sm text-body-sm text-ink-muted">4,120 sold this week</p>
                <p className="font-title-sm text-title-sm text-ink font-bold mt-1">₹1,89,990</p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'rank-01',
                    'ApexBook M3 Ultra 32GB',
                    189990,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuAwv3B3z_CnEfsgubQe9xdgbhOwvkhvrhV7MCE5s2WSO407t7mqFMBYfK4PkhWNXtk6TciUlNQ_TcLgWjHK61yFanM8iL477270ZAm_mirk0SMMMQg1DxEnGcsXafFqU-7WhBIX6h7BBDTXvlAHwOUrhSBUugx9UlVrdqLF8fKCCIvUv7kBbs_-uNfcB3rTsF8CQV7EpeJOpr5cg3k5bq4hzaaabveW_zA_pLPWqJaN',
                    'Electronics'
                  )
                }
                className="w-full mt-2 py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-sm text-label-sm rounded font-semibold shadow-xs transition-colors cursor-pointer"
                type="button"
              >
                Add to Cart
              </button>
            </div>

            {/* Rank #2 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors relative flex flex-col justify-between group">
              <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-outline-variant text-ink font-title-sm text-title-sm font-bold flex items-center justify-center shadow-xs">
                #2
              </span>
              <div className="aspect-square w-full rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm mt-3">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBj_x2xGHLidtdJplkmGGNEO-vMgSN5H8sioq9_V1kB4drLXweuTtyY4wsHb1jTYBO7vOCMdPdhddUcpcLQzPiyRCVReftmJlQ0XbqP6rTDfBae6R-on-8vRI9nhfNBDXE6-5pDZCfn0IBUM7_qus7C4jLKTmUlODEBOGL0Z-ogQYNqhGuw9xp9exTxVdL_R6De79lPgMAQPZUurjXNaoV4vvG9BhXozh9bW-6rdMY"
                  alt="Roaster's Choice Filter 500g"
                />
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-ink-muted">Pantry</span>
                <Link to="/products">
                  <h4 className="font-title-sm text-title-sm text-ink font-bold line-clamp-1 hover:text-primary transition-colors">
                    Roaster's Choice Filter 500g
                  </h4>
                </Link>
                <p className="font-body-sm text-body-sm text-ink-muted">3,890 sold this week</p>
                <p className="font-title-sm text-title-sm text-ink font-bold mt-1">₹890</p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'rank-02',
                    "Roaster's Choice Filter 500g",
                    890,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuCBj_x2xGHLidtdJplkmGGNEO-vMgSN5H8sioq9_V1kB4drLXweuTtyY4wsHb1jTYBO7vOCMdPdhddUcpcLQzPiyRCVReftmJlQ0XbqP6rTDfBae6R-on-8vRI9nhfNBDXE6-5pDZCfn0IBUM7_qus7C4jLKTmUlODEBOGL0Z-ogQYNqhGuw9xp9exTxVdL_R6De79lPgMAQPZUurjXNaoV4vvG9BhXozh9bW-6rdMY',
                    'Grocery & Essentials'
                  )
                }
                className="w-full mt-2 py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-sm text-label-sm rounded font-semibold shadow-xs transition-colors cursor-pointer"
                type="button"
              >
                Add to Cart
              </button>
            </div>

            {/* Rank #3 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors relative flex flex-col justify-between group">
              <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-outline-variant text-ink font-title-sm text-title-sm font-bold flex items-center justify-center shadow-xs">
                #3
              </span>
              <div className="aspect-square w-full rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm mt-3">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFVl0tp-2lCRn4wfF5qudb92XFpZdtK9mMIljUcrDyFJL2k0dIBhryitVVcMQ4V3GKc3dSe4RqHr0V6jhxSYJVrDBi4-YIlQwH6M92VkLjBUvfmdZKn2IdjuJVAJ-nEMJFT0gYUo5xW20WaL7FKzFqRqW_DS7jiSS2hu4RUE3fLNzHSGv90FTwWPpOuGYNcuMFVfMS69gv1Cz6MJsJpyqySLgC1CNgOxkG9scGLIDP"
                  alt="Nordic Linen Duvet Set"
                />
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-ink-muted">Home Bedding</span>
                <Link to="/products">
                  <h4 className="font-title-sm text-title-sm text-ink font-bold line-clamp-1 hover:text-primary transition-colors">
                    Nordic Linen Duvet Set
                  </h4>
                </Link>
                <p className="font-body-sm text-body-sm text-ink-muted">2,410 sold this week</p>
                <p className="font-title-sm text-title-sm text-ink font-bold mt-1">₹4,250</p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'rank-03',
                    'Nordic Linen Duvet Set',
                    4250,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDFVl0tp-2lCRn4wfF5qudb92XFpZdtK9mMIljUcrDyFJL2k0dIBhryitVVcMQ4V3GKc3dSe4RqHr0V6jhxSYJVrDBi4-YIlQwH6M92VkLjBUvfmdZKn2IdjuJVAJ-nEMJFT0gYUo5xW20WaL7FKzFqRqW_DS7jiSS2hu4RUE3fLNzHSGv90FTwWPpOuGYNcuMFVfMS69gv1Cz6MJsJpyqySLgC1CNgOxkG9scGLIDP',
                    'Home & Living'
                  )
                }
                className="w-full mt-2 py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-sm text-label-sm rounded font-semibold shadow-xs transition-colors cursor-pointer"
                type="button"
              >
                Add to Cart
              </button>
            </div>

            {/* Rank #4 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors relative flex flex-col justify-between group">
              <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-outline-variant text-ink font-title-sm text-title-sm font-bold flex items-center justify-center shadow-xs">
                #4
              </span>
              <div className="aspect-square w-full rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm mt-3">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfNPId-85ux-tEqLj-HGc49lIPIOmODgtnFtpugMAOvQzaFyZmtALN8vCHKrs93r2JdbPTwcNEFZgr5xjHZcjIw5-ciAd9lonv0zKN3Yb2D_c0Lqc2fIitGW0fWzN8g6CHqQgeBTHQHNp7wTOCEYy8A4FOR-qwhCrPeiZQf3sjEABQI0nB4NmThLIdHjJCVFtgMthAJzux3dkO6eBQjV17gMYKGMRUwIfyeilQrfHY"
                  alt="KeyForge Retro Botanical PBT"
                />
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-ink-muted">Keyboards</span>
                <Link to="/products">
                  <h4 className="font-title-sm text-title-sm text-ink font-bold line-clamp-1 hover:text-primary transition-colors">
                    KeyForge Retro Botanical PBT
                  </h4>
                </Link>
                <p className="font-body-sm text-body-sm text-ink-muted">1,940 sold this week</p>
                <p className="font-title-sm text-title-sm text-ink font-bold mt-1">₹3,190</p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'rank-04',
                    'KeyForge Retro Botanical PBT',
                    3190,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuAfNPId-85ux-tEqLj-HGc49lIPIOmODgtnFtpugMAOvQzaFyZmtALN8vCHKrs93r2JdbPTwcNEFZgr5xjHZcjIw5-ciAd9lonv0zKN3Yb2D_c0Lqc2fIitGW0fWzN8g6CHqQgeBTHQHNp7wTOCEYy8A4FOR-qwhCrPeiZQf3sjEABQI0nB4NmThLIdHjJCVFtgMthAJzux3dkO6eBQjV17gMYKGMRUwIfyeilQrfHY',
                    'Electronics'
                  )
                }
                className="w-full mt-2 py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-sm text-label-sm rounded font-semibold shadow-xs transition-colors cursor-pointer"
                type="button"
              >
                Add to Cart
              </button>
            </div>

            {/* Rank #5 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors relative flex flex-col justify-between group">
              <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-outline-variant text-ink font-title-sm text-title-sm font-bold flex items-center justify-center shadow-xs">
                #5
              </span>
              <div className="aspect-square w-full rounded-lg bg-surface-container-lowest overflow-hidden mb-space-sm mt-3">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu3cmggXVvIL-hTjYYIfCY-t5nTpE6dK8_zNXG9xF9jzcEhR0PG7bqpytooZUI7Z4Q9ikdm5bkkH48kPAaIRwqaKAWI3Ntrkbf9JBtGhiv1E-IY-eBPqmienJtRui5PKCa6LUIvy3yXHL-QEuHSkj4W9MCVKANdQ_DMXF8ZPMXduwaD7s6uX35W6EjH5PgKRdu90uuhfBCIO8SpxJNoyc9TefszGsURXYr6EqDWhEz"
                  alt="HydraBoost Liposomal Drops"
                />
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-ink-muted">Skincare</span>
                <Link to="/products">
                  <h4 className="font-title-sm text-title-sm text-ink font-bold line-clamp-1 hover:text-primary transition-colors">
                    HydraBoost Liposomal Drops
                  </h4>
                </Link>
                <p className="font-body-sm text-body-sm text-ink-muted">1,780 sold this week</p>
                <p className="font-title-sm text-title-sm text-ink font-bold mt-1">₹1,450</p>
              </div>
              <button
                onClick={() =>
                  handleQuickAdd(
                    'rank-05',
                    'HydraBoost Liposomal Drops',
                    1450,
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuCu3cmggXVvIL-hTjYYIfCY-t5nTpE6dK8_zNXG9xF9jzcEhR0PG7bqpytooZUI7Z4Q9ikdm5bkkH48kPAaIRwqaKAWI3Ntrkbf9JBtGhiv1E-IY-eBPqmienJtRui5PKCa6LUIvy3yXHL-QEuHSkj4W9MCVKANdQ_DMXF8ZPMXduwaD7s6uX35W6EjH5PgKRdu90uuhfBCIO8SpxJNoyc9TefszGsURXYr6EqDWhEz',
                    'Beauty & Personal Care'
                  )
                }
                className="w-full mt-2 py-1.5 bg-surface-container-lowest hover:bg-electric-violet hover:text-on-primary text-ink font-label-sm text-label-sm rounded font-semibold shadow-xs transition-colors cursor-pointer"
                type="button"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Seasonal / Editorial Marketplace Spotlight (Asymmetric 2-Column Grid) */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-space-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column: The Modern Creative's Setup (7 Columns) */}
          <div className="lg:col-span-7 bg-midnight-violet text-text-dark-primary rounded-2xl p-space-lg md:p-space-xl flex flex-col justify-between relative overflow-hidden shadow-md">
            <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-royal-purple/30 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <span className="px-2.5 py-1 rounded-full bg-electric-violet/30 text-white font-label-sm text-label-sm font-bold uppercase tracking-wider">
                OMIZON Editorial Edit
              </span>
              <h3 className="font-headline-md text-headline-md text-text-dark-primary font-bold mt-space-sm max-w-lg">
                The Modern Creative's Desk: Tools Crafted for Deep Work
              </h3>
              <p className="font-body-lg text-body-lg text-text-dark-muted mt-space-xs max-w-md">
                Discover ultra-precise mechanical input, acoustic shielding, and posture-calibrated hardware assembled by our design curators.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-space-sm my-space-lg relative z-10">
              <div className="bg-obsidian-surface-1 p-2 rounded-xl border border-obsidian-border/50">
                <div className="aspect-square rounded-lg bg-obsidian-surface-2 overflow-hidden mb-1.5">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFgj2sS8d-5zMBadwAW3t4X1OaQKzD8a6tuLqxI-qQx7Jr2y8Hiu7W6-6Bsb6Bt5Lwg-70NTIRFl0lIrY7fY1p8dQw74lnXapdduHXaHBrGRhS91gkK9JfWKZ5n9cKRy_K6fhjlzKyhBQWCrO90cy8tkbelgx3bpD3igrOTrvbCimqbFD6JVQS8AMFl4tXHh7jG4UXkRZXXJKZd7nBEORIWEXxsVs7jWOQrBNDfwdw"
                    alt="KeyForge Brass Keyboard"
                  />
                </div>
                <p className="font-label-sm text-label-sm text-text-dark-primary font-semibold truncate">KeyForge Brass</p>
                <p className="font-label-sm text-label-sm text-text-dark-muted">₹8,990</p>
              </div>

              <div className="bg-obsidian-surface-1 p-2 rounded-xl border border-obsidian-border/50">
                <div className="aspect-square rounded-lg bg-obsidian-surface-2 overflow-hidden mb-1.5">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmFKmhD1YmDYGiRb-fLSb8WRN044VkuW9Yq5TqMTVYkQk40p3JIOOY44ckWJbLOV7vgiEiUWn1HlrAtHylnLZfp8CIg18cEjWgDNWNYympyEiNcIOVmu_QMPZV9u0iWBi5Tg7pijb2pTwmhrGq0dY1fFodE5wWCwcY9aGTHVULQgNuOtkEgWER3-ZUYY1bplncsrhZeIACHkyU3JvFNZe4ALISxzV2WK4MGYDoidAE"
                    alt="Lumen Task Lamp"
                  />
                </div>
                <p className="font-label-sm text-label-sm text-text-dark-primary font-semibold truncate">Lumen Task Lamp</p>
                <p className="font-label-sm text-label-sm text-text-dark-muted">₹3,450</p>
              </div>

              <div className="bg-obsidian-surface-1 p-2 rounded-xl border border-obsidian-border/50">
                <div className="aspect-square rounded-lg bg-obsidian-surface-2 overflow-hidden mb-1.5">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC72FXvPHaSoMZ9nJvoSHgnhX9rm_Ax-oiPgY5iaJBQP22qt7Iir9ceH4nzzfy4CH6l-1cZTb_kaQ7iPMFkdsqT4EnmgAC4LgHLzW7XwKWfRRCEMACy2zvyt_1eCco2NCUhyCc-V-8y_MDY0I3RKrEOgkWJt32Pm6l5l-0O2aJns1f54XCJNWKSMRk-cTnNW-XS343D2QMZOA42iubpfAFxs9fbn2AahVWzf5sNx16f"
                    alt="Felt Desk Mat"
                  />
                </div>
                <p className="font-label-sm text-label-sm text-text-dark-primary font-semibold truncate">Felt Desk Mat</p>
                <p className="font-label-sm text-label-sm text-text-dark-muted">₹1,290</p>
              </div>
            </div>

            <div className="relative z-10">
              <Link
                to="/products?category=Electronics"
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 bg-electric-violet hover:bg-royal-purple text-on-primary rounded-lg font-title-sm text-title-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <span>Explore the Guide &amp; Shop the Look</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Sustainably Sourced Home Essentials (5 Columns) */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-space-lg md:p-space-xl flex flex-col justify-between shadow-sm relative overflow-hidden border border-lavender-mist/50">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-semantic-success font-label-sm text-label-sm font-bold uppercase tracking-wider flex items-center gap-1 w-max">
                <span className="material-symbols-outlined text-[14px]">eco</span>
                <span>Sustainable Living Edit</span>
              </span>
              <h3 className="font-headline-sm text-headline-sm text-ink font-bold mt-space-sm">
                Zero-Waste Pantry &amp; Crafted Bamboo Homeware
              </h3>
              <p className="font-body-md text-body-md text-ink-muted mt-space-xs">
                Organic fair-trade staples, airtight borosilicate spice jars, and sustainably harvested bamboo tableware built for lifelong longevity.
              </p>
            </div>

            <div className="my-space-md relative rounded-xl overflow-hidden aspect-[16/9]">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuApK8sXu4x-eg7nwB9JaZtv8sVjuuy9KFPuA3UmOfWVCeo3l8pY9WasO-BzaUrOKg8OJGms3fVhVlboUlY3gVnAteCABEuZJe1l0JwmzR45WX_387_kzAtnqakXmJeHyjOFOOAPROdIDHSU5GIBjtk03tUSGGaOZBnWlQenXQSO-Clpn2VFyS-kTd0midNN4xQEf9Z_1iOg6l3qPiNWE4avYRoN4Cu67NEsm7cq6GW9"
                alt="Zero-Waste Pantry & Crafted Bamboo Homeware"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-violet/70 via-transparent to-transparent flex items-end p-space-md">
                <p className="font-title-sm text-title-sm text-white font-semibold">
                  100% Plastic-Free Packaging Certified
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-body-sm text-body-sm text-ink-muted">Over 450+ verified eco-brands</span>
                <p className="font-title-sm text-title-sm text-ink font-bold">From ₹450</p>
              </div>
              <Link
                to="/products?category=Home+%26+Living"
                className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold hover:text-royal-purple transition-colors cursor-pointer"
                data-path="home-and-living"
              >
                <span>Discover Pantry Collection</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Recently Viewed & Browsing Suggestions Dock */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-space-md mb-space-lg">
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-lavender-mist/50">
          <div className="flex items-center justify-between mb-space-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-ink-muted text-[20px]">history</span>
              <h3 className="font-title-sm text-title-sm text-ink font-bold">Your Browsing History</h3>
            </div>
            <div className="flex items-center gap-space-md">
              <Link to="/products" className="font-label-sm text-label-sm text-primary hover:text-royal-purple font-semibold">
                View or edit history
              </Link>
            </div>
          </div>

          {/* 6 Horizontal Recently Viewed Items matching Stitch */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-space-sm">
            <Link to="/products" className="group p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="w-full aspect-square rounded bg-surface-container-lowest overflow-hidden mb-1.5">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuByAAwUAwg6A5yCvVxLA8SO5jiogmkS_UcwStv9EAnKy0zpEFRWnYE3p28UuasRkCplfYgt8H9Z4C4_yafrwKd1kZVXTCPs2d8fAPazLC6Oi2AO_ICzfmsXEg-bVOt5_Mwyx-lWmBDb31AUramOpWkD0J4tDulzaFyKqxwx1bb5qYEy1HeaQWqAlpJueQtW7YHf9VjQDkwIbZtVwgWwZTvgBK2ox0NOklmR4T6tEFop"
                  alt="ErgoPro Mouse"
                />
              </div>
              <p className="font-label-sm text-label-sm text-ink truncate font-medium">ErgoPro Mouse</p>
              <p className="font-label-md text-label-md text-ink font-bold">₹3,499</p>
            </Link>

            <Link to="/products" className="group p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="w-full aspect-square rounded bg-surface-container-lowest overflow-hidden mb-1.5">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJQmMafbie8xL82jPc3aUAJ-4tGCMO6vW8_BibjqcUBOvWDDA9RvtpvCVgPCSy-5vjGNFUlxol1zVSX1NHhaTDDfJn9kZnU308GYTrpPRANjrHmO9mUUj-XwA6vR54XyhHK7sYFdTCLsXZl8gLSTlZecCywI-gofb3U5I-gDwlPwJ7Lk9sdrVA7t81REJi0Ot8OpE0LkNPk2ggSewFM8eRwRTk_V_k0HECGYWv-wQ3"
                  alt="Solid Brass Pen"
                />
              </div>
              <p className="font-label-sm text-label-sm text-ink truncate font-medium">Solid Brass Pen</p>
              <p className="font-label-md text-label-md text-ink font-bold">₹1,150</p>
            </Link>

            <Link to="/products" className="group p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="w-full aspect-square rounded bg-surface-container-lowest overflow-hidden mb-1.5">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGSPLpIIb9vuOJcL1oIBRvkVBRAKyWpdaKyp38loaUPzrLo3IvHUMlKltdMHPa-GU-ZPGgLniHuvAbUQnfdDKxGkoZkapCpJgDigb6BAEmjAHhLZ4pqML957d2f0DlkqVs16jOuBn3XC1N08xb5qn-P33zuejsA5yuJRnsLF0C1YdhXWHJM9eXknGHSS4_-sJ5s-YbruTSu5G4nI-wm7YjfvR9inN_ZX7oXdlYEZRu"
                  alt="Lumbar Support Pro"
                />
              </div>
              <p className="font-label-sm text-label-sm text-ink truncate font-medium">Lumbar Support Pro</p>
              <p className="font-label-md text-label-md text-ink font-bold">₹1,890</p>
            </Link>

            <Link to="/products" className="group p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="w-full aspect-square rounded bg-surface-container-lowest overflow-hidden mb-1.5">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdekPoNRdmfnvrfp6q8sQpWPl4N9MNs5zEOV_bg8KKOLbr7EYGhH0HWtWFBIdsHJGJq7tE4glHqq6DVKnfMvIRS-iLb56qN-RBmoDnoo58UwDY9B_VWDn2GYnmNiWnVeShkng12QOgYKcvDWkHTs-CLZfGLBxe2yCdmyPp9wYgexJMENSQazuo1ABP1jvNdHzfkCCTyLJnLE_lQODOIcgP3dPQlZOmI99DuRP2DXYf"
                  alt="Cedar & Bergamot Candle"
                />
              </div>
              <p className="font-label-sm text-label-sm text-ink truncate font-medium">Cedar &amp; Bergamot Candle</p>
              <p className="font-label-md text-label-md text-ink font-bold">₹980</p>
            </Link>

            <Link to="/products" className="group p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="w-full aspect-square rounded bg-surface-container-lowest overflow-hidden mb-1.5">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGd9a_AYhU-vcDEdQLBQO-d9bl5kz2RGdEhf0aUTzX_pfyo7Icc7ZG8KMiaLfQjgdg6SNZ6zH7WgnAXuK85ueNFYSmeZDFhBUeS4Rxz3QxN21O7TF3XO1XHbK1BVLY8RhQWx_u_-CeUyv9nhXNjsiSV0NkTTmRkksDzveW0di-5tc0tFbMA9IeAv33tU118_xejXpLx5jViUFv9JiZuX_j3jT0FcwcJQUxI04jI6bv"
                  alt="100W Braided Cable"
                />
              </div>
              <p className="font-label-sm text-label-sm text-ink truncate font-medium">100W Braided Cable</p>
              <p className="font-label-md text-label-md text-ink font-bold">₹699</p>
            </Link>

            <Link to="/products" className="group p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="w-full aspect-square rounded bg-surface-container-lowest overflow-hidden mb-1.5">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL-KkNhYl22KKk98O4CHBML75gBb28JGrWp3EDOwUSbVSzuGraQZI3RzyPrBoHpkZi7GODRzdIKjZghONJIOVFx4Fb98jGX5i-ZZr9LOZ7yrz0Oj2N39SQLg88KwFsWJAm1Ck1tJhbP3nKMvnrz327oKt7xLqtkIsg0qZiyD87DhOvFuKnTiZoy2qPWOnQ8uin8cf8abmWYDzFqlUKCubGQnfhrFXkuidoCKkUehnF"
                  alt="Ceremonial Matcha 50g"
                />
              </div>
              <p className="font-label-sm text-label-sm text-ink truncate font-medium">Ceremonial Matcha 50g</p>
              <p className="font-label-md text-label-md text-ink font-bold">₹1,420</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
