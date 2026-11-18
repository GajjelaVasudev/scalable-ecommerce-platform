import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { Product } from '../../types';
import { formatCurrency, calculateDiscount } from '../../utils/format';

export const HomePage: React.FC = () => {
  const { addItem } = useCart();
  const navigate = useNavigate();

  // Live Catalog State
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [groceryProducts, setGroceryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch live products for homepage sections from MongoDB-backed public API
  const fetchHomeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [featuredRes, dealsRes, groceryRes] = await Promise.all([
        api.products.list({ featured: true, limit: 8 }),
        api.products.list({ limit: 4, sort: 'price_desc' }),
        api.products.list({ category: 'grocery & essentials', limit: 4 }),
      ]);

      if (featuredRes?.products && Array.isArray(featuredRes.products)) {
        setFeaturedProducts(featuredRes.products);
      }
      if (dealsRes?.products && Array.isArray(dealsRes.products)) {
        setDealProducts(dealsRes.products);
      }
      if (groceryRes?.products && Array.isArray(groceryRes.products)) {
        setGroceryProducts(groceryRes.products);
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

  // Countdown Timer Micro-Interaction
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 13,
    seconds: 46,
  });

  useEffect(() => {
    let totalSeconds = 4 * 3600 + 13 * 60 + 46;
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

  const [activeCategoryTab, setActiveCategoryTab] = useState<'mac' | 'displays' | 'ergonomics'>('mac');

  const handleQuickAdd = (
    id: string,
    name: string,
    price: number,
    image: string,
    category: string
  ) => {
    addItem({
      _id: id,
      name: name,
      description: name,
      price: price,
      stock: 25,
      category: category,
      image: image,
      images: [image],
      rating: 4.8,
      reviewCount: 120,
      seller: { _id: '6a7f809930f3650284ab9701', username: 'OMIZON Official Store' },
    });
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. Slim Announcement Banner */}
      <section className="w-full bg-surface-container-high/80 border-b border-outline-variant/20 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-on-primary font-bold text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wide">
              Spring Festival
            </span>
            <p className="text-on-surface">
              Save up to <strong className="font-semibold">50%</strong> across Tech, Living &amp; Beauty + Instant{' '}
              <span className="text-primary font-semibold">₹500 off</span> with UPI checkout.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-[11px] text-outline font-medium hidden md:inline">
              Code: FESTIVAL500
            </span>
            <a
              className="font-semibold text-primary hover:text-secondary flex items-center gap-0.5 transition-colors"
              href="#flash-deals"
            >
              <span>Claim Offer</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </section>

      {/* Catalog Load Error Alert */}
      {error && (
        <div className="w-full bg-error/10 border-y border-error/20 px-4 sm:px-6 lg:px-8 py-3">
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

      {/* 2. Hero Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12 bg-surface">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left Editorial Pitch */}
          <div className="lg:col-span-6 flex flex-col gap-5 lg:gap-6">
            <div className="inline-flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full w-fit border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                Omnichannel Commerce Platform
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-[1.12]">
              Everything You Need, Brought Together in One Destination.
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed">
              Curated electronics, artisan home living, pantry essentials, and trending beauty — delivered with precision straight to your doorstep.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <a
                className="bg-primary hover:bg-secondary text-on-primary h-11 sm:h-12 px-6 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary/25"
                href="#flash-deals"
              >
                <span>Explore Today's Deals</span>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </a>
              <Link
                to="/products"
                className="bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant/40 h-11 sm:h-12 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Browse Multi-Category Catalog</span>
                <span className="material-symbols-outlined text-[18px]">north_east</span>
              </Link>
            </div>
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl text-primary font-extrabold">120K+</span>
                <span className="text-xs text-outline font-medium">Verified SKUs</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl text-on-surface font-extrabold">2.4 Hrs</span>
                <span className="text-xs text-outline font-medium">Metro Delivery</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl text-on-surface font-extrabold">4.9/5.0</span>
                <span className="text-xs text-outline font-medium">Trustpilot Score</span>
              </div>
            </div>
          </div>

          {/* Right Visual Multi-Category Showcase: Balanced Even 2x2 Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-5">
            {isLoading ? (
              // 4 Shimmer Skeletons for Hero Mosaic
              [0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 flex flex-col justify-between animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-16 bg-surface-container-high rounded-full" />
                    <div className="h-3 w-12 bg-surface-container-high rounded" />
                  </div>
                  <div className="h-36 w-full my-3 rounded-lg bg-surface-container-high" />
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1 w-2/3">
                      <div className="h-4 w-full bg-surface-container-high rounded" />
                      <div className="h-4 w-16 bg-surface-container-high rounded" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0" />
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 4).map((item) => {
                const catName =
                  typeof item.category === 'object' && item.category !== null
                    ? (item.category as any).name
                    : item.category || 'Featured';
                return (
                  <div
                    key={item._id}
                    className="group bg-surface-container-lowest rounded-xl p-3.5 sm:p-4 shadow-sm hover:shadow-md border border-outline-variant/30 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="bg-surface-container-high text-primary font-medium text-[10px] uppercase px-2 py-0.5 rounded-full truncate max-w-[110px]">
                        {catName}
                      </span>
                      <span className="text-[11px] text-outline">{item.badge || 'Curated'}</span>
                    </div>
                    <Link
                      to={`/products/${item._id}`}
                      className="h-36 sm:h-40 w-full my-2 flex items-center justify-center overflow-hidden rounded-lg bg-surface-container-low"
                    >
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={item.image}
                        alt={item.name}
                      />
                    </Link>
                    <div className="flex items-center justify-between pt-1">
                      <Link to={`/products/${item._id}`} className="min-w-0 pr-2">
                        <p className="text-xs sm:text-sm font-semibold text-on-surface hover:text-primary transition-colors truncate">
                          {item.name}
                        </p>
                        <p className="text-sm sm:text-base font-bold text-primary mt-0.5">
                          {formatCurrency(item.price)}
                        </p>
                      </Link>
                      <button
                        onClick={() =>
                          handleQuickAdd(item._id, item.name, item.price, item.image, catName)
                        }
                        className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors cursor-pointer shrink-0"
                        title="Quick Add"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 bg-surface-container-lowest rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline text-[32px]">inventory_2</span>
                <p className="text-sm font-medium text-on-surface-variant">No featured products available.</p>
                <Link to="/products" className="text-xs font-bold text-primary hover:underline">
                  Browse Full Catalog
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Multi-Category Fast Navigation Strip */}
      <section className="w-full px-margin py-space-lg bg-surface-container-low" id="catalog">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <span className="font-label-sm text-outline uppercase tracking-wider">Fast Discovery</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Explore Core Departments</h2>
            </div>
            <Link
              to="/products"
              className="font-title-sm text-primary hover:text-secondary flex items-center gap-1"
            >
              <span>View All 32 Categories</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-space-md">
            {/* Category 1 */}
            <Link
              to="/products?category=Electronics"
              className="flex flex-col items-center gap-space-xs p-space-sm bg-surface-container-lowest rounded-xl hover:shadow-md transition-all text-center group"
            >
              <div className="relative w-18 h-18 rounded-full bg-surface-container-high p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">laptop_mac</span>
                <span className="absolute -top-1 -right-1 bg-primary text-on-primary font-label-sm text-[10px] px-1.5 py-0.5 rounded-full">
                  -40%
                </span>
              </div>
              <span className="font-title-sm text-title-sm text-on-surface">Electronics</span>
              <span className="font-body-sm text-body-sm text-outline">Computers &amp; Audio</span>
            </Link>

            {/* Category 2 */}
            <Link
              to="/products?category=Home+%26+Living"
              className="flex flex-col items-center gap-space-xs p-space-sm bg-surface-container-lowest rounded-xl hover:shadow-md transition-all text-center group"
            >
              <div className="relative w-18 h-18 rounded-full bg-surface-container-high p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">chair</span>
              </div>
              <span className="font-title-sm text-title-sm text-on-surface">Home &amp; Living</span>
              <span className="font-body-sm text-body-sm text-outline">Furniture &amp; Decor</span>
            </Link>

            {/* Category 3 */}
            <Link
              to="/products?category=Grocery+%26+Essentials"
              className="flex flex-col items-center gap-space-xs p-space-sm bg-surface-container-lowest rounded-xl hover:shadow-md transition-all text-center group"
            >
              <div className="relative w-18 h-18 rounded-full bg-surface-container-high p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">local_mall</span>
              </div>
              <span className="font-title-sm text-title-sm text-on-surface">Pantry &amp; Organic</span>
              <span className="font-body-sm text-body-sm text-outline">Daily Groceries</span>
            </Link>

            {/* Category 4 */}
            <Link
              to="/products?category=Beauty+%26+Personal+Care"
              className="flex flex-col items-center gap-space-xs p-space-sm bg-surface-container-lowest rounded-xl hover:shadow-md transition-all text-center group"
            >
              <div className="relative w-18 h-18 rounded-full bg-surface-container-high p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">spa</span>
              </div>
              <span className="font-title-sm text-title-sm text-on-surface">Skincare &amp; Care</span>
              <span className="font-body-sm text-body-sm text-outline">Clean Beauty</span>
            </Link>

            {/* Category 5 */}
            <Link
              to="/products?category=Fashion+%26+Apparel"
              className="flex flex-col items-center gap-space-xs p-space-sm bg-surface-container-lowest rounded-xl hover:shadow-md transition-all text-center group"
            >
              <div className="relative w-18 h-18 rounded-full bg-surface-container-high p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">checkroom</span>
              </div>
              <span className="font-title-sm text-title-sm text-on-surface">Apparel &amp; Wear</span>
              <span className="font-body-sm text-body-sm text-outline">Sustainable Line</span>
            </Link>

            {/* Category 6 */}
            <Link
              to="/products?category=Sports+%26+Outdoors"
              className="flex flex-col items-center gap-space-xs p-space-sm bg-surface-container-lowest rounded-xl hover:shadow-md transition-all text-center group"
            >
              <div className="relative w-18 h-18 rounded-full bg-surface-container-high p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">fitness_center</span>
              </div>
              <span className="font-title-sm text-title-sm text-on-surface">Outdoor &amp; Gear</span>
              <span className="font-body-sm text-body-sm text-outline">Active Lifestyle</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Flash Deals of the Day */}
      <section className="w-full px-margin py-space-xl bg-surface" id="flash-deals">
        <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
          {/* Section Header with Realtime Countdown */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm bg-surface-container-high p-space-lg rounded-2xl">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[24px]">electric_bolt</span>
                <span className="font-label-sm text-primary uppercase font-bold tracking-wider">
                  Limited Time Window
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Flash Deals of the Day</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Tier-one deals refreshed twice daily. First come, first served.
              </p>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-2 rounded-xl shadow-sm">
              <span className="font-body-sm text-outline uppercase mr-1">Ends in:</span>
              <div className="flex items-center gap-1 font-mono font-bold text-on-surface">
                <span className="bg-surface-container px-2 py-1 rounded text-primary font-headline-sm">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-primary">:</span>
                <span className="bg-surface-container px-2 py-1 rounded text-primary font-headline-sm">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-primary">:</span>
                <span className="bg-surface-container px-2 py-1 rounded text-primary font-headline-sm">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Product Cards Grid (4 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {isLoading ? (
              // 4 Shimmer Skeletons for Flash Deals
              [0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between animate-pulse"
                >
                  <div>
                    <div className="w-full h-56 rounded-lg bg-surface-container-high mb-space-sm" />
                    <div className="h-4 w-24 bg-surface-container-high rounded mb-2" />
                    <div className="h-5 w-full bg-surface-container-high rounded mb-2" />
                    <div className="h-5 w-3/4 bg-surface-container-high rounded mb-2" />
                  </div>
                  <div className="mt-space-sm flex flex-col gap-space-xs">
                    <div className="h-6 w-32 bg-surface-container-high rounded" />
                    <div className="w-full bg-surface-container rounded-full h-1.5" />
                    <div className="h-3 w-20 bg-surface-container-high rounded" />
                    <div className="w-full h-10 bg-surface-container-high rounded-lg mt-space-xs" />
                  </div>
                </div>
              ))
            ) : dealProducts.length > 0 ? (
              dealProducts.slice(0, 4).map((deal, idx) => {
                const originalPrice = deal.originalPrice || Math.round(deal.price * 1.28);
                const discount = calculateDiscount(originalPrice, deal.price);
                const claimedPct = [78, 62, 85, 45][idx % 4];
                const catName =
                  typeof deal.category === 'object' && deal.category !== null
                    ? (deal.category as any).name
                    : deal.category || 'Deals';
                const badgeText =
                  deal.badge ||
                  (idx === 0
                    ? 'Lightning Deal'
                    : idx === 1
                    ? 'Bestseller'
                    : idx === 2
                    ? 'Prime Deal'
                    : 'Exclusive Deal');

                return (
                  <div
                    key={deal._id}
                    className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <Link
                        to={`/products/${deal._id}`}
                        className="relative block w-full h-56 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm"
                      >
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          src={deal.image}
                          alt={deal.name}
                        />
                        <span className="absolute top-2 left-2 bg-primary text-on-primary font-label-sm text-[11px] px-2 py-0.5 rounded-full uppercase">
                          {badgeText}
                        </span>
                        <button
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-outline hover:text-primary flex items-center justify-center transition-colors"
                          title="Save to wishlist"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">favorite_border</span>
                        </button>
                      </Link>
                      <div className="flex items-center gap-1 mb-1">
                        <span
                          className="material-symbols-outlined text-[16px] text-amber-500 fill-current"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                          {deal.rating || 4.8}
                        </span>
                        <span className="font-body-sm text-body-sm text-outline">
                          ({deal.reviewCount || 120})
                        </span>
                      </div>
                      <Link to={`/products/${deal._id}`}>
                        <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-2 mb-2 hover:text-primary transition-colors">
                          {deal.name}
                        </h3>
                      </Link>
                    </div>
                    <div className="mt-space-sm flex flex-col gap-space-xs">
                      <div className="flex items-baseline gap-space-xs">
                        <span className="font-price-card text-price-card text-on-surface">
                          {formatCurrency(deal.price)}
                        </span>
                        {originalPrice > deal.price && (
                          <>
                            <span className="font-body-sm text-outline line-through">
                              {formatCurrency(originalPrice)}
                            </span>
                            <span className="font-label-sm text-primary font-semibold">
                              -{discount}%
                            </span>
                          </>
                        )}
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{ width: `${claimedPct}%` }}
                        />
                      </div>
                      <span className="font-body-sm text-[11px] text-outline">
                        {claimedPct}% claimed {claimedPct > 80 ? '• Almost Gone' : ''}
                      </span>
                      <button
                        onClick={() =>
                          handleQuickAdd(deal._id, deal.name, deal.price, deal.image, catName)
                        }
                        className="mt-space-xs w-full bg-primary hover:bg-secondary text-on-primary h-10 rounded-lg font-title-sm flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-surface-container-lowest rounded-xl p-space-xl text-center flex flex-col items-center justify-center gap-space-sm">
                <span className="material-symbols-outlined text-outline text-[36px]">schedule</span>
                <p className="font-headline-sm text-on-surface">No Flash Deals Active Right Now</p>
                <p className="font-body-md text-on-surface-variant">Check back soon for refreshed daily windows.</p>
                <Link
                  to="/products"
                  className="mt-space-xs px-space-md py-2 bg-primary text-on-primary rounded-lg font-title-sm hover:bg-secondary transition-colors"
                >
                  Explore All Products
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Editorial Category Spotlight: Workspace & Electronics */}
      <section className="w-full px-margin py-space-xl bg-surface-container-low">
        <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
            <div>
              <span className="font-label-sm text-outline uppercase tracking-wider">Curated Department</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                Curated Electronics &amp; Workspaces
              </h2>
            </div>
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={() => setActiveCategoryTab('mac')}
                className={`px-space-md py-1.5 rounded-lg font-title-sm transition-colors shadow-sm ${
                  activeCategoryTab === 'mac'
                    ? 'bg-surface-container-lowest text-on-surface'
                    : 'bg-transparent text-outline hover:text-on-surface'
                }`}
              >
                Mac &amp; PC
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryTab('displays')}
                className={`px-space-md py-1.5 rounded-lg font-title-sm transition-colors ${
                  activeCategoryTab === 'displays'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'bg-transparent text-outline hover:text-on-surface'
                }`}
              >
                Displays
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryTab('ergonomics')}
                className={`px-space-md py-1.5 rounded-lg font-title-sm transition-colors ${
                  activeCategoryTab === 'ergonomics'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'bg-transparent text-outline hover:text-on-surface'
                }`}
              >
                Ergonomics
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-stretch">
            {/* Spotlight Card: UltraBook (5 Columns) */}
            <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-space-xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="bg-primary text-on-primary font-label-sm uppercase px-2.5 py-1 rounded-full">
                    Flagship Release
                  </span>
                  <span className="font-label-sm text-outline">Next-Gen Architecture</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">
                  ApexBook M3 Ultra 16-inch
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                  Engineered for creative architects, machine learning workflows, and heavy render pipelines. 36-hour sustained battery efficiency.
                </p>
                <div className="flex flex-wrap gap-2 mb-space-lg">
                  <span className="bg-surface-container px-3 py-1 rounded-md text-body-sm font-semibold text-on-surface">
                    32GB Unified RAM
                  </span>
                  <span className="bg-surface-container px-3 py-1 rounded-md text-body-sm font-semibold text-on-surface">
                    1TB PCIe Gen5
                  </span>
                  <span className="bg-surface-container px-3 py-1 rounded-md text-body-sm font-semibold text-on-surface">
                    Liquid Retina XDR
                  </span>
                </div>
              </div>

              <div>
                <Link to="/products/eb00eef4b99985cbc0933691" className="block w-full h-64 rounded-xl bg-surface-container-low overflow-hidden mb-space-md group">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkyTe1LqwU0-6EHPhxaWoVcP9JkNxlH4q8RfvUazPEC-36q-iOe5WAPah4-ogyWJ4D5HVpB9CCNrkpPmUj8jiZMLDO0saAhfhgdeBV2fNCRU2KNiCj7Dt_Jmivs9xhpQvYzMr_NQg1rDGgjKWMD7u3u4GkY6IMXR9-9TEql12A-wODb6I6PK6EA201943X2GI9c-0Nbqik92jVDuXf1wLzCVqnLTFBvs1IcMWVY9EoubZsYJ5hxjZ5Ww"
                    alt="ApexBook M3 Ultra"
                  />
                </Link>
                <div className="flex items-center justify-between pt-space-xs">
                  <div>
                    <span className="font-body-sm text-outline block">Special Launch Price</span>
                    <span className="font-price-hero text-price-hero text-on-surface">₹1,89,990</span>
                  </div>
                  <button
                    onClick={() => navigate('/products/eb00eef4b99985cbc0933691')}
                    className="bg-primary hover:bg-secondary text-on-primary px-space-lg h-12 rounded-lg font-title-sm flex items-center gap-space-xs transition-colors cursor-pointer"
                    type="button"
                  >
                    <span>Configure &amp; Buy</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2x2 Companion Gear Grid (7 Columns) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              {/* Companion 1: 4K Display */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="h-40 w-full rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIvRTaMlQTWPYJRV7jT9ut2t-d_XkCs6sRmz5VD2zuow7dSQxX1omtNSWkty473ixeKSxFiB5GQezCv7m2-oKd7UjTEP970RLNOSqEOCIDzbi3LsuVIaEdBuxTIfCz2eM-VUihhahYflJyoVpAm8rTcv-7pcHzmO-U2A9y69kwzxrytDxnuO-QBt7dvQ6mxc6VjFJUoaiNLJ4Ql3DcoPPR08LdN6iSzixjlIFP1IRx07jyBcrzohrhiQ"
                    alt="UltraFine 32 inch 4K Display"
                  />
                </div>
                <div>
                  <span className="font-label-sm text-outline uppercase">Displays</span>
                  <h4 className="font-title-sm text-title-sm text-on-surface mb-1">
                    UltraFine 32" 4K Colorist Display
                  </h4>
                  <p className="font-price-card text-price-card text-primary mb-space-sm">₹48,999</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="w-full py-2 bg-surface-container hover:bg-surface-container-high rounded-md font-title-sm text-on-surface text-center transition-colors"
                >
                  Quick View
                </button>
              </div>

              {/* Companion 2: Mechanical Keyboard */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="h-40 w-full rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv7IcbhTczhddEFr6woUzXgy59KrTdGJ2TzgxTY-UbUKZcq8gR9aiQxrfVpPzDpfJhgRwYuiZJ-SlVytOsIkzkiLdPwY3DC7F97kqQKnIUVpCvLec0UEDfkJkhf6399Wx-jsnH9e-UkmLjZcW02LZdbQ8c5CIEmN-Yhh4ojx98IOQCU5RpPQEucuEZCGFOtYycyv6Ynp40Zi04P5cbZhuoGkgonf2KHIGRCxw225YAcveeBPixzRX2Nw"
                    alt="KeyForge Wireless Mechanical Keyboard"
                  />
                </div>
                <div>
                  <span className="font-label-sm text-outline uppercase">Peripherals</span>
                  <h4 className="font-title-sm text-title-sm text-on-surface mb-1">
                    KeyForge 75% Wireless Mechanical
                  </h4>
                  <p className="font-price-card text-price-card text-primary mb-space-sm">₹8,499</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="w-full py-2 bg-surface-container hover:bg-surface-container-high rounded-md font-title-sm text-on-surface text-center transition-colors"
                >
                  Quick View
                </button>
              </div>

              {/* Companion 3: Ergonomic Chair */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="h-40 w-full rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX5OZefVMZsxwIkkggeMzy6j3xrXBtcuqMJqQQiwlBW-d-nsRjKzBnw0mw2EIz7bzt7Jfcd5GDFVjEnkxv6IMOWEVPB-zr1ph60h-e85o74W9Kev9FJ3FsrfzjSZ8cfQ8GD-hLNcoNDAhACEiesWU49Ph1a5-vXkU50y8nrkiHvUney_r1A6_SnTohBYTYoh9X_CeQr9W8itleqQvgZylumuzo0Brcwa5aWesWgQwVU5R6lwM7SyE29w"
                    alt="ErgoPosture Task Chair Mesh 2.0"
                  />
                </div>
                <div>
                  <span className="font-label-sm text-outline uppercase">Furniture</span>
                  <h4 className="font-title-sm text-title-sm text-on-surface mb-1">
                    ErgoPosture Task Chair Mesh 2.0
                  </h4>
                  <p className="font-price-card text-price-card text-primary mb-space-sm">₹24,500</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="w-full py-2 bg-surface-container hover:bg-surface-container-high rounded-md font-title-sm text-on-surface text-center transition-colors"
                >
                  Quick View
                </button>
              </div>

              {/* Companion 4: GaN Fast Charger */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="h-40 w-full rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB3salbLqu7ZZBPvwaVu52eiVSQe79nijJ0ot-jRi8q_a7dLyD-c6ItFsF2rzOhskIYA4TMA-yTA8VM6UsCx3Xus4cTziAYFWCcm_BdQXa08BbAQlQsmqvvlXBtyYx0aKTkq8FPLpwe-9ikE8H2kWscI7BGQh9K6txzxZyKgLnVX5CuP9-PchGr-T58ljSBSPOIXE51H_jJvW7ZV2c2ZWT4UTEQ3bVfT8g5SPV2KPeIsyWD45qMhuNcw"
                    alt="VoltPro 140W Quad GaN Charger"
                  />
                </div>
                <div>
                  <span className="font-label-sm text-outline uppercase">Power</span>
                  <h4 className="font-title-sm text-title-sm text-on-surface mb-1">
                    VoltPro 140W Quad GaN Charger
                  </h4>
                  <p className="font-price-card text-price-card text-primary mb-space-sm">₹4,299</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="w-full py-2 bg-surface-container hover:bg-surface-container-high rounded-md font-title-sm text-on-surface text-center transition-colors"
                >
                  Quick View
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Everyday Essentials & Fresh Grocery Section */}
      <section className="w-full px-margin py-space-xl bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div>
              <div className="inline-flex items-center gap-space-xs bg-surface-container-high text-primary px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-semibold mb-1">
                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                <span>Delivery by 7:00 PM Today</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Everyday Essentials &amp; Fresh Grocery
              </h2>
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                title="Previous"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                className="w-10 h-10 rounded-full bg-primary hover:bg-secondary text-on-primary flex items-center justify-center transition-colors"
                title="Next"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter">
            {isLoading ? (
              // 4 Shimmer Skeletons for Everyday Essentials
              [0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between animate-pulse"
                >
                  <div className="w-full h-48 rounded-lg bg-surface-container-high mb-space-sm" />
                  <div className="h-5 w-3/4 bg-surface-container-high rounded mb-2" />
                  <div className="h-4 w-1/2 bg-surface-container-high rounded mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 bg-surface-container-high rounded" />
                    <div className="h-9 w-20 bg-surface-container-high rounded-lg" />
                  </div>
                </div>
              ))
            ) : groceryProducts.length > 0 ? (
              groceryProducts.slice(0, 4).map((item) => {
                const catName =
                  typeof item.category === 'object' && item.category !== null
                    ? (item.category as any).name
                    : item.category || 'Grocery & Essentials';
                return (
                  <div
                    key={item._id}
                    className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <Link
                      to={`/products/${item._id}`}
                      className="relative w-full h-48 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm block group"
                    >
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={item.image}
                        alt={item.name}
                      />
                      <span className="absolute top-2 left-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[11px] font-semibold text-on-surface">
                        {item.badge || 'Fresh Daily'}
                      </span>
                    </Link>
                    <div>
                      <Link to={`/products/${item._id}`}>
                        <h4 className="font-title-sm text-title-sm text-on-surface hover:text-primary transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                      </Link>
                      <p className="font-body-sm text-body-sm text-outline truncate">{catName}</p>
                    </div>
                    <div className="mt-space-sm flex items-center justify-between">
                      <span className="font-price-card text-price-card text-on-surface">
                        {formatCurrency(item.price)}
                      </span>
                      <button
                        onClick={() =>
                          handleQuickAdd(item._id, item.name, item.price, item.image, catName)
                        }
                        className="h-9 px-space-md bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface rounded-lg font-title-sm flex items-center gap-1 transition-colors cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-surface-container-lowest rounded-xl p-space-xl text-center flex flex-col items-center justify-center gap-space-sm">
                <span className="material-symbols-outlined text-outline text-[36px]">local_shipping</span>
                <p className="font-headline-sm text-on-surface">Everyday Essentials Loading Soon</p>
                <Link
                  to="/products?category=Grocery+%26+Essentials"
                  className="mt-space-xs px-space-md py-2 bg-primary text-on-primary rounded-lg font-title-sm hover:bg-secondary transition-colors"
                >
                  Browse Grocery Department
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. Trust & Confidence Value Proposition Bar */}
      <section className="w-full px-margin py-space-xl bg-surface-container-high">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {/* Pillar 1 */}
          <div className="flex items-start gap-space-sm">
            <div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[26px]">verified</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-title-md text-title-md text-on-surface">100% Genuine Guaranteed</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Sourced directly from certified brand houses &amp; verified distributors.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="flex items-start gap-space-sm">
            <div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[26px]">local_shipping</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-title-md text-title-md text-on-surface">Fast &amp; Tracked Delivery</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Real-time GPS routing with 2-day delivery across 19,000+ pin codes.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="flex items-start gap-space-sm">
            <div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[26px]">published_with_changes</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-title-md text-title-md text-on-surface">7-Day Hassle-Free Returns</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Instant doorstep pick-up and rapid wallet reimbursement protocol.
              </p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="flex items-start gap-space-sm">
            <div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[26px]">lock</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-title-md text-title-md text-on-surface">Bank-Grade Encryption</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                256-bit PCI-DSS secure payments via UPI, RuPay, cards, and net banking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Customer Reviews & Verified Buyer Stories */}
      <section className="w-full px-margin py-space-xl bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-label-sm text-outline uppercase tracking-wider">Social Proof</span>
            <h2 className="font-headline-md text-headline-md text-on-surface mt-1">Verified Buyer Stories</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Real purchases, honest experiences, and verified satisfaction from over 4 million buyers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Review 1 */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-1 text-amber-500">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface italic mt-2">
                  "The SoundPulse headphones arrived in under 24 hours in Mumbai. Sound isolation is comparable to pairs triple the cost. OMIZON packaging was impeccably reinforced."
                </p>
              </div>
              <div className="flex items-center gap-space-sm pt-space-md">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary">
                  RS
                </div>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-on-surface">Rahul Sharma</span>
                  <span className="font-body-sm text-body-sm text-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-green-600">verified</span>
                    Verified Electronics Buyer • Bengaluru
                  </span>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-1 text-amber-500">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface italic mt-2">
                  "I rely on OMIZON for our home pantry supplies and specialized olive oils. Freshness is genuinely uncompromised, and customer support resolves questions in minutes."
                </p>
              </div>
              <div className="flex items-center gap-space-sm pt-space-md">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary">
                  AM
                </div>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-on-surface">Ananya Mukherjee</span>
                  <span className="font-body-sm text-body-sm text-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-green-600">verified</span>
                    Verified Pantry Buyer • Kolkata
                  </span>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-1 text-amber-500">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface italic mt-2">
                  "The GlowBiome repair serum cleared my post-workout redness within four days. Finding niche, authentic clinical skincare with next-day dispatch used to be impossible."
                </p>
              </div>
              <div className="flex items-center gap-space-sm pt-space-md">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary">
                  KV
                </div>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-on-surface">Kavita Verma</span>
                  <span className="font-body-sm text-body-sm text-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-green-600">verified</span>
                    Verified Beauty Buyer • New Delhi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Newsletter VIP Access Signup */}
      <section className="w-full px-margin py-space-xl bg-surface-container-low">
        <div className="max-w-5xl mx-auto bg-surface-container-lowest rounded-2xl p-space-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-md">
            <span className="bg-primary text-on-primary font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full w-fit">
              VIP Circle
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Unlock ₹750 Off Your Next Order
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Receive exclusive flash allocations, private brand sales, and early-bird tech drops directly to your inbox.
            </p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-md flex flex-col gap-space-xs">
            <form
              className="flex flex-col sm:flex-row items-center gap-space-xs w-full"
              onSubmit={(e) => {
                e.preventDefault();
                alert('Welcome to OMIZON VIP! Your ₹750 code is VIPWELCOME');
              }}
            >
              <input
                className="w-full h-12 bg-surface-container px-space-md rounded-lg font-body-md text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Enter your business or personal email"
                required
                type="email"
              />
              <button
                className="w-full sm:w-auto shrink-0 h-12 bg-primary hover:bg-secondary text-on-primary px-space-lg rounded-lg font-title-sm transition-colors shadow-sm"
                type="submit"
              >
                Join VIP
              </button>
            </form>
            <span className="font-body-sm text-[12px] text-outline">
              Zero spam. Unsubscribe anytime with one click.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
