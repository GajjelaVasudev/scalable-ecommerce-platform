import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export const HomePage: React.FC = () => {
  const { addItem } = useCart();
  const navigate = useNavigate();

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
      seller: { _id: '64a1b2c3d4e5f6789012345b', username: 'omizon_official' },
    });
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. Announcement Banner */}
      <section className="w-full bg-surface-container-high px-margin py-space-sm flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-space-xs text-center md:text-left">
          <div className="flex items-center gap-space-sm">
            <span className="bg-primary text-on-primary font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full">
              Spring Festival
            </span>
            <p className="font-body-md text-on-surface">
              Save up to <strong>50%</strong> across Tech, Living &amp; Beauty + Instant{' '}
              <span className="text-primary font-semibold">₹500 off</span> with UPI checkout.
            </p>
          </div>
          <div className="flex items-center gap-space-md shrink-0">
            <span className="font-label-sm text-outline uppercase tracking-wider hidden lg:inline">
              Code: FESTIVAL500
            </span>
            <a
              className="font-title-sm text-primary hover:text-secondary flex items-center gap-1 transition-colors"
              href="#flash-deals"
            >
              <span>Claim Offer</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Hero Section */}
      <section className="w-full px-margin py-space-xl bg-surface">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          {/* Left Editorial Pitch */}
          <div className="lg:col-span-6 flex flex-col gap-space-lg">
            <div className="inline-flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-sm uppercase text-outline">Omnichannel Commerce Platform</span>
            </div>
            <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight leading-[1.08] font-bold">
              Everything You Need, Brought Together in One Destination.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Curated electronics, artisan home living, pantry essentials, and trending beauty — delivered with precision straight to your doorstep.
            </p>
            <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
              <a
                className="bg-primary hover:bg-secondary text-on-primary h-12 px-space-xl rounded-lg font-title-sm flex items-center justify-center gap-space-xs transition-colors shadow-sm"
                href="#flash-deals"
              >
                <span>Explore Today's Deals</span>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </a>
              <Link
                to="/products"
                className="bg-surface-container-lowest hover:bg-surface-container-low text-on-surface h-12 px-space-lg rounded-lg font-title-sm flex items-center justify-center gap-space-xs transition-colors shadow-sm"
              >
                <span>Browse Multi-Category Catalog</span>
                <span className="material-symbols-outlined text-[18px]">north_east</span>
              </Link>
            </div>
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-space-md pt-space-md bg-surface-container-low p-space-md rounded-xl">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">120K+</span>
                <span className="font-body-sm text-body-sm text-outline">Verified SKUs</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">2.4 Hrs</span>
                <span className="font-body-sm text-body-sm text-outline">Metro Delivery</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">4.9/5.0</span>
                <span className="font-body-sm text-body-sm text-outline">Trustpilot Score</span>
              </div>
            </div>
          </div>

          {/* Right Visual Multi-Category Mosaic */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-space-md">
            {/* Item 1: High Tech Headphones */}
            <div className="group relative bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <span className="bg-surface-container-high text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                  Electronics
                </span>
                <span className="font-label-sm text-outline">Top Rated</span>
              </div>
              <Link to="/products/2545922d18419b69f8ab9ee3" className="h-44 w-full my-space-sm flex items-center justify-center overflow-hidden rounded-lg bg-surface-container-low">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHWWLWbJsm8PBZcrAbnoEnCLTRy8FvboW1V0It7bSRfDaNJw9_9zwiAgBG33EAik6nFFM376B55D0p2F6mASAH9cVVCPt5k9Y92aQZqh_rGJOEnhVthWT3MhF9bzL8Gymd5XDsCYBfrz7QrhdeAKGTelyM_CHyHECrN84c5gjaFPYxpsVJNI0VEuNdxdGwVYG8PJINaaPZmhWewS0gnKwXTwFlu4I8BZBwl4lOh5tHwlvXuzwCLGJl9A"
                  alt="Studio Pro ANC Headphones"
                />
              </Link>
              <div className="flex items-center justify-between z-10">
                <Link to="/products/2545922d18419b69f8ab9ee3">
                  <p className="font-title-sm text-title-sm text-on-surface hover:text-primary transition-colors">Studio Pro ANC</p>
                  <p className="font-price-card text-primary">₹14,999</p>
                </Link>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      '2545922d18419b69f8ab9ee3',
                      'Studio Pro ANC',
                      14999,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuDHWWLWbJsm8PBZcrAbnoEnCLTRy8FvboW1V0It7bSRfDaNJw9_9zwiAgBG33EAik6nFFM376B55D0p2F6mASAH9cVVCPt5k9Y92aQZqh_rGJOEnhVthWT3MhF9bzL8Gymd5XDsCYBfrz7QrhdeAKGTelyM_CHyHECrN84c5gjaFPYxpsVJNI0VEuNdxdGwVYG8PJINaaPZmhWewS0gnKwXTwFlu4I8BZBwl4lOh5tHwlvXuzwCLGJl9A',
                      'Electronics'
                    )
                  }
                  className="w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                  title="Quick Add"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            {/* Item 2: Organic Olive Oil & Pantry */}
            <div className="group relative bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden mt-6">
              <div className="flex items-center justify-between z-10">
                <span className="bg-surface-container-high text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                  Organic Pantry
                </span>
                <span className="font-label-sm text-outline">Cold-Pressed</span>
              </div>
              <Link to="/products/e76a094353f7362b563e05e1" className="h-44 w-full my-space-sm flex items-center justify-center overflow-hidden rounded-lg bg-surface-container-low">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8XNentxmPfjVo4JmJbrZtkx8H5jQ7g-yNegsPRgq9RwRqkg8fuBv_i18A8GhlcDuX4JX6WCol_tqQuz5_Fvt_1TitDg2lqW3DsIgLjx0YxAB-SdFcpgnHqL5LRA0kVAFDQjSIHXNMhLWpZKAH6dKEpNRJQCwDgVptGx96PoWSe2EUCO1ajMT3vuQwO5zf7TLDwhrzETNWhN6dI2JSkrB_JRubgXIpamN_KRn3NgqNpyOiOM_56XfcCQ"
                  alt="Estate Olive Oil 1L"
                />
              </Link>
              <div className="flex items-center justify-between z-10">
                <Link to="/products/e76a094353f7362b563e05e1">
                  <p className="font-title-sm text-title-sm text-on-surface hover:text-primary transition-colors">Estate Olive Oil 1L</p>
                  <p className="font-price-card text-primary">₹949</p>
                </Link>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      'e76a094353f7362b563e05e1',
                      'Estate Olive Oil 1L',
                      949,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuA8XNentxmPfjVo4JmJbrZtkx8H5jQ7g-yNegsPRgq9RwRqkg8fuBv_i18A8GhlcDuX4JX6WCol_tqQuz5_Fvt_1TitDg2lqW3DsIgLjx0YxAB-SdFcpgnHqL5LRA0kVAFDQjSIHXNMhLWpZKAH6dKEpNRJQCwDgVptGx96PoWSe2EUCO1ajMT3vuQwO5zf7TLDwhrzETNWhN6dI2JSkrB_JRubgXIpamN_KRn3NgqNpyOiOM_56XfcCQ',
                      'Grocery & Essentials'
                    )
                  }
                  className="w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                  title="Quick Add"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            {/* Item 3: Artisan Ceramics */}
            <div className="group relative bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden -mt-6">
              <div className="flex items-center justify-between z-10">
                <span className="bg-surface-container-high text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                  Home &amp; Living
                </span>
                <span className="font-label-sm text-outline">Handmade</span>
              </div>
              <Link to="/products/3807fe2700f4ceacb83c28de" className="h-44 w-full my-space-sm flex items-center justify-center overflow-hidden rounded-lg bg-surface-container-low">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1wstpgOXEzsIPDWrUgDD7LaLjwFqh5uyogQN5k4wcQjo9o-RngcZqbRvEL8Q_HblR8eww8oBkLor_vGhrW2tMauZvPX_DJrcN_SwHL8MwkiurcFSft3IpDiwsjLjTA8S_H1_FRpyj9-vtvkecHn9Y59eITffuDW6aGzou-VWDNoNrRdQonABYi0uwEfqa-RPe7swbRu1k3ySqdgz6qjCvjyKaPsB-Eem4Qn0e9DN6EOH3XL7WKKT5vw"
                  alt="Clay Craft Carafe"
                />
              </Link>
              <div className="flex items-center justify-between z-10">
                <Link to="/products/3807fe2700f4ceacb83c28de">
                  <p className="font-title-sm text-title-sm text-on-surface hover:text-primary transition-colors">Clay Craft Carafe</p>
                  <p className="font-price-card text-primary">₹2,190</p>
                </Link>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      '3807fe2700f4ceacb83c28de',
                      'Clay Craft Carafe',
                      2190,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuB1wstpgOXEzsIPDWrUgDD7LaLjwFqh5uyogQN5k4wcQjo9o-RngcZqbRvEL8Q_HblR8eww8oBkLor_vGhrW2tMauZvPX_DJrcN_SwHL8MwkiurcFSft3IpDiwsjLjTA8S_H1_FRpyj9-vtvkecHn9Y59eITffuDW6aGzou-VWDNoNrRdQonABYi0uwEfqa-RPe7swbRu1k3ySqdgz6qjCvjyKaPsB-Eem4Qn0e9DN6EOH3XL7WKKT5vw',
                      'Home & Living'
                    )
                  }
                  className="w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                  title="Quick Add"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            {/* Item 4: Botanical Skincare */}
            <div className="group relative bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <span className="bg-surface-container-high text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                  Skincare
                </span>
                <span className="font-label-sm text-outline">Clean Formula</span>
              </div>
              <Link to="/products/35696643bb8fa566e4081c59" className="h-44 w-full my-space-sm flex items-center justify-center overflow-hidden rounded-lg bg-surface-container-low">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8knFJAJz82iOvxBcxvRTbcRMa8v0S1lb7zS7QNGn9i5Q0U2elOjlE5xuX7Di9JI3W52A0qi5xsCo0aSU5VorzqTz7JnZc3kFWxioeop3nO3WMrusKorD0U_ALViI-9zy8t26k7Ly2Zq_1qChP96voaISqizJFSlK4MH9P1D35iHTXk2QWv87GJ1G-52aVyY_3raaYGKShaZNmv5U5wz-yO1pYV2AwAwrwpBRljMU9jnf8BIa-mcRI6w"
                  alt="Barrier Elixir 50ml"
                />
              </Link>
              <div className="flex items-center justify-between z-10">
                <Link to="/products/35696643bb8fa566e4081c59">
                  <p className="font-title-sm text-title-sm text-on-surface hover:text-primary transition-colors">Barrier Elixir 50ml</p>
                  <p className="font-price-card text-primary">₹1,850</p>
                </Link>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      '35696643bb8fa566e4081c59',
                      'Barrier Elixir 50ml',
                      1850,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8knFJAJz82iOvxBcxvRTbcRMa8v0S1lb7zS7QNGn9i5Q0U2elOjlE5xuX7Di9JI3W52A0qi5xsCo0aSU5VorzqTz7JnZc3kFWxioeop3nO3WMrusKorD0U_ALViI-9zy8t26k7Ly2Zq_1qChP96voaISqizJFSlK4MH9P1D35iHTXk2QWv87GJ1G-52aVyY_3raaYGKShaZNmv5U5wz-yO1pYV2AwAwrwpBRljMU9jnf8BIa-mcRI6w',
                      'Beauty & Personal Care'
                    )
                  }
                  className="w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                  title="Quick Add"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
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
            {/* Deal Card 1 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <Link to="/products/2545922d18419b69f8ab9ee3" className="relative block w-full h-56 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDE5yxf0nqMEhj4IBd8eLDIRYCnRHa8WrZbBcy-R4i8hNft7TowHZdTE-7VJ1EDWSDoPn185GvneUSaPkov8fv1XUXDM232GrGhaH9rrNDXH-1c8hSCoztuzeCIp5M69Z1Wkhs54rEixWaHTOOhRDXz4gSxiAvCCd_q8_JCprJZhUO0LI2tpnHPPfynCSKbpCNkldEW1OhW8HLTPdFXGUvN8g-v53dWYrrFVcIOIcjBEG860RIf__lcw"
                    alt="SoundPulse Studio Pro Wireless ANC Headphones"
                  />
                  <span className="absolute top-2 left-2 bg-primary text-on-primary font-label-sm text-[11px] px-2 py-0.5 rounded-full uppercase">
                    Lightning Deal
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
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">4.8</span>
                  <span className="font-body-sm text-body-sm text-outline">(3,420)</span>
                </div>
                <Link to="/products/2545922d18419b69f8ab9ee3">
                  <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-2 mb-2 hover:text-primary transition-colors">
                    SoundPulse Studio Pro Wireless ANC Headphones
                  </h3>
                </Link>
              </div>
              <div className="mt-space-sm flex flex-col gap-space-xs">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-price-card text-price-card text-on-surface">₹14,999</span>
                  <span className="font-body-sm text-outline line-through">₹22,999</span>
                  <span className="font-label-sm text-primary font-semibold">-35%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full w-[78%]"></div>
                </div>
                <span className="font-body-sm text-[11px] text-outline">78% claimed</span>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      '2545922d18419b69f8ab9ee3',
                      'SoundPulse Studio Pro Wireless ANC Headphones',
                      14999,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDE5yxf0nqMEhj4IBd8eLDIRYCnRHa8WrZbBcy-R4i8hNft7TowHZdTE-7VJ1EDWSDoPn185GvneUSaPkov8fv1XUXDM232GrGhaH9rrNDXH-1c8hSCoztuzeCIp5M69Z1Wkhs54rEixWaHTOOhRDXz4gSxiAvCCd_q8_JCprJZhUO0LI2tpnHPPfynCSKbpCNkldEW1OhW8HLTPdFXGUvN8g-v53dWYrrFVcIOIcjBEG860RIf__lcw',
                      'Electronics'
                    )
                  }
                  className="mt-space-xs w-full bg-primary hover:bg-secondary text-on-primary h-10 rounded-lg font-title-sm flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>

            {/* Deal Card 2 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <Link to="/products/127ce0a9817f5707919b9baa" className="relative block w-full h-56 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYS6V6luaSnqEJ_yCAye1N3dYj0p0tOonG0CrVibxs2oQo6Wyzpq3qbmgB4pdJH1qVj5lAUYEftt4WzuRRauPkfweMroEcJY-hpX7lwQ_GEl7NrnsWH-gf7XNeTCdLjnMsAnKpxwuHl1XktLoo5tEWn0C3oTuONtw-5Dsiqv17RKLhAFkJkacLFTymo8nRDzVqrkC2q2UgUvO5nvonkJ7TogzEIODSRAyGUVZ3d1kkVdxS671n12jvpQ"
                    alt="Nordic Oak Minimalist Task Lamp"
                  />
                  <span className="absolute top-2 left-2 bg-surface-container-highest text-on-surface font-label-sm text-[11px] px-2 py-0.5 rounded-full uppercase">
                    Bestseller
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
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">4.9</span>
                  <span className="font-body-sm text-body-sm text-outline">(890)</span>
                </div>
                <Link to="/products/127ce0a9817f5707919b9baa">
                  <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-2 mb-2 hover:text-primary transition-colors">
                    Nordic Oak Minimalist Task Lamp with Dimmable LED
                  </h3>
                </Link>
              </div>
              <div className="mt-space-sm flex flex-col gap-space-xs">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-price-card text-price-card text-on-surface">₹3,499</span>
                  <span className="font-body-sm text-outline line-through">₹5,299</span>
                  <span className="font-label-sm text-primary font-semibold">-34%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full w-[62%]"></div>
                </div>
                <span className="font-body-sm text-[11px] text-outline">62% claimed</span>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      '127ce0a9817f5707919b9baa',
                      'Nordic Oak Minimalist Task Lamp',
                      3499,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYS6V6luaSnqEJ_yCAye1N3dYj0p0tOonG0CrVibxs2oQo6Wyzpq3qbmgB4pdJH1qVj5lAUYEftt4WzuRRauPkfweMroEcJY-hpX7lwQ_GEl7NrnsWH-gf7XNeTCdLjnMsAnKpxwuHl1XktLoo5tEWn0C3oTuONtw-5Dsiqv17RKLhAFkJkacLFTymo8nRDzVqrkC2q2UgUvO5nvonkJ7TogzEIODSRAyGUVZ3d1kkVdxS671n12jvpQ',
                      'Home & Living'
                    )
                  }
                  className="mt-space-xs w-full bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface h-10 rounded-lg font-title-sm flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>

            {/* Deal Card 3 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <Link to="/products/9eeae17659684624e4e8cbe2" className="relative block w-full h-56 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4tIfuCnVFI90s5zDrrG0qiD-YGOknHZ0yZxqmw44f1xVWZYWf7XEWbOyM7uEqXSMBN8BgHfE8d-8BPFaJ03BiRko4GMWKHqaRKLpNvLf62uTUNb-jqw0Iq09nIRcibA1LoVU_iDp7sVQipQsrVqO_RNhJHMTuFJ5iYN_qpZa0C4fUG3E7ou3pHv3SeIG6Jp8iqsQw2CTRol4c79I_9xepK5TKHdy3jLp1uuyxgdS9LX8dHXv7TIOoVA"
                    alt="GlowBiome Barrier Repair Serum"
                  />
                  <span className="absolute top-2 left-2 bg-secondary-container text-on-secondary-container font-label-sm text-[11px] px-2 py-0.5 rounded-full uppercase">
                    Derm Tested
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
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">4.7</span>
                  <span className="font-body-sm text-body-sm text-outline">(1,620)</span>
                </div>
                <Link to="/products/9eeae17659684624e4e8cbe2">
                  <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-2 mb-2 hover:text-primary transition-colors">
                    GlowBiome Barrier Repair Serum 50ml Ceramide + HA
                  </h3>
                </Link>
              </div>
              <div className="mt-space-sm flex flex-col gap-space-xs">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-price-card text-price-card text-on-surface">₹1,850</span>
                  <span className="font-body-sm text-outline line-through">₹2,400</span>
                  <span className="font-label-sm text-primary font-semibold">-23%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full w-[91%]"></div>
                </div>
                <span className="font-body-sm text-[11px] text-outline">91% claimed • Almost Gone</span>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      '9eeae17659684624e4e8cbe2',
                      'GlowBiome Barrier Repair Serum',
                      1850,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4tIfuCnVFI90s5zDrrG0qiD-YGOknHZ0yZxqmw44f1xVWZYWf7XEWbOyM7uEqXSMBN8BgHfE8d-8BPFaJ03BiRko4GMWKHqaRKLpNvLf62uTUNb-jqw0Iq09nIRcibA1LoVU_iDp7sVQipQsrVqO_RNhJHMTuFJ5iYN_qpZa0C4fUG3E7ou3pHv3SeIG6Jp8iqsQw2CTRol4c79I_9xepK5TKHdy3jLp1uuyxgdS9LX8dHXv7TIOoVA',
                      'Beauty & Personal Care'
                    )
                  }
                  className="mt-space-xs w-full bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface h-10 rounded-lg font-title-sm flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>

            {/* Deal Card 4 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <Link to="/products/e76a094353f7362b563e05e1" className="relative block w-full h-56 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkH9W8BpvypqOlI4iJOkj35_DwPTLyMhpWxAtsJ5HwgYnL18JiidvEiIMM7oRzk_0tOm-gZNMEfMfwsWhwR_2-nVzfa7NVKtF0blrmM9RTV9NKm4W49F4zuS4ahOBQ_7HqWW0rL18VkS9Id2qRGtSMPhxIVRyui9G_54cGFxu7xH045Copyc8x3jf_gM5QwHd1PR9Wg7jbT9HadD7A47txZUmoaZlxLy-5eoC-JQ91Uaj7d1vmSYTq-Q"
                    alt="FarmFresh Cold-Pressed Extra Virgin Olive Oil"
                  />
                  <span className="absolute top-2 left-2 bg-surface-container-high text-primary font-label-sm text-[11px] px-2 py-0.5 rounded-full uppercase">
                    Organic Certified
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
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">4.9</span>
                  <span className="font-body-sm text-body-sm text-outline">(4,150)</span>
                </div>
                <Link to="/products/e76a094353f7362b563e05e1">
                  <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-2 mb-2 hover:text-primary transition-colors">
                    FarmFresh Cold-Pressed Extra Virgin Olive Oil 1L
                  </h3>
                </Link>
              </div>
              <div className="mt-space-sm flex flex-col gap-space-xs">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-price-card text-price-card text-on-surface">₹949</span>
                  <span className="font-body-sm text-outline line-through">₹1,299</span>
                  <span className="font-label-sm text-primary font-semibold">-27%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full w-[45%]"></div>
                </div>
                <span className="font-body-sm text-[11px] text-outline">45% claimed</span>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      'e76a094353f7362b563e05e1',
                      'FarmFresh Cold-Pressed Extra Virgin Olive Oil 1L',
                      949,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCkH9W8BpvypqOlI4iJOkj35_DwPTLyMhpWxAtsJ5HwgYnL18JiidvEiIMM7oRzk_0tOm-gZNMEfMfwsWhwR_2-nVzfa7NVKtF0blrmM9RTV9NKm4W49F4zuS4ahOBQ_7HqWW0rL18VkS9Id2qRGtSMPhxIVRyui9G_54cGFxu7xH045Copyc8x3jf_gM5QwHd1PR9Wg7jbT9HadD7A47txZUmoaZlxLy-5eoC-JQ91Uaj7d1vmSYTq-Q',
                      'Grocery & Essentials'
                    )
                  }
                  className="mt-space-xs w-full bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface h-10 rounded-lg font-title-sm flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
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
            {/* Grocery 1 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="relative w-full h-48 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl6QFzMa4YNzF0kkp8vh70mmqWSH_y_GvS7EIy0efI6bFIZUmkipEFtyM2z4XgB-gNrHhXZMJ5DsVGVnuIQjTQRsnNp8FJXtT4qecm_hicjbaOi7iGzmZXUL7DtI1NOZlGYGKdpReE-L1vHgP9N_2jo19JvQVLVyT3Lhz2Qg_lIV29PqtabWiWZk1XRDVEt_cBCded9oeMUmaTu5e6yxscD4CSMyJuTi913RZ7FdcIoxFuH22jAvbWTw"
                  alt="Artisan Stoneground Sourdough"
                />
                <span className="absolute top-2 left-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[11px] font-semibold text-on-surface">
                  Baked Daily
                </span>
              </div>
              <div>
                <h4 className="font-title-sm text-title-sm text-on-surface">Artisan Stoneground Sourdough</h4>
                <p className="font-body-sm text-body-sm text-outline">500g • Farm Mill</p>
              </div>
              <div className="mt-space-sm flex items-center justify-between">
                <span className="font-price-card text-price-card text-on-surface">₹220</span>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      'ab7b14f36a322390697b4261',
                      'Artisan Stoneground Sourdough',
                      220,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuAl6QFzMa4YNzF0kkp8vh70mmqWSH_y_GvS7EIy0efI6bFIZUmkipEFtyM2z4XgB-gNrHhXZMJ5DsVGVnuIQjTQRsnNp8FJXtT4qecm_hicjbaOi7iGzmZXUL7DtI1NOZlGYGKdpReE-L1vHgP9N_2jo19JvQVLVyT3Lhz2Qg_lIV29PqtabWiWZk1XRDVEt_cBCded9oeMUmaTu5e6yxscD4CSMyJuTi913RZ7FdcIoxFuH22jAvbWTw',
                      'Grocery & Essentials'
                    )
                  }
                  className="h-9 px-space-md bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface rounded-lg font-title-sm flex items-center gap-1 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Grocery 2 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="relative w-full h-48 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr8SRkRRimmSJYvt5J0ZspPlhOPyf3fZJHUKurwcHEjSj-B4c712DN3WHVO1WGEJQgEmNC9bHuXfcpQg1CLgZcgN8hPW4Enxr3Kmnq_UQicaUh3Zc-Jto4VcIp-x9kTAntjD0S0iSOJcranJxatlNuLcqVp2XOUp-TfKvETwP10aNiV3qD7VNuYRX7B0_xLOB812Rr9u-czzFIvccldFmL5wS6KIQrPZ2twTaeK25uzaw96Fc81JnNhg"
                  alt="Estate Arabica Beans 250g"
                />
                <span className="absolute top-2 left-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[11px] font-semibold text-on-surface">
                  Direct Trade
                </span>
              </div>
              <div>
                <h4 className="font-title-sm text-title-sm text-on-surface">Estate Arabica Beans 250g</h4>
                <p className="font-body-sm text-body-sm text-outline">Medium Dark • Coorg Reserve</p>
              </div>
              <div className="mt-space-sm flex items-center justify-between">
                <span className="font-price-card text-price-card text-on-surface">₹480</span>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      '87e4ee3279ce71acaaf991e3',
                      'Estate Arabica Beans 250g',
                      480,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuDr8SRkRRimmSJYvt5J0ZspPlhOPyf3fZJHUKurwcHEjSj-B4c712DN3WHVO1WGEJQgEmNC9bHuXfcpQg1CLgZcgN8hPW4Enxr3Kmnq_UQicaUh3Zc-Jto4VcIp-x9kTAntjD0S0iSOJcranJxatlNuLcqVp2XOUp-TfKvETwP10aNiV3qD7VNuYRX7B0_xLOB812Rr9u-czzFIvccldFmL5wS6KIQrPZ2twTaeK25uzaw96Fc81JnNhg',
                      'Grocery & Essentials'
                    )
                  }
                  className="h-9 px-space-md bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface rounded-lg font-title-sm flex items-center gap-1 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Grocery 3 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="relative w-full h-48 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgO5QDtBh27uuBnLBpBXuXZKfBKmxwzxGc5PQpHkJuaCMUu55xkU5boNAc6_icjhV_xmTR9eLgQHTfX8mkdbVsdwwCQ1saCc6NaFnpg9M8c_FUrwADQV4OJygRi5lRVZkaKcvhRpV1SYJraMfhyJSpsBefOehxUJmP1G3X48pZjO5xdyt5DshlVrcs8R4NMciZFaY8H3vl7HgOuBUSK5MoFPTR11d5qPKmh3NT7Rvmzeg21Ex5dLftMg"
                  alt="Himalayan Flora Honey 400g"
                />
                <span className="absolute top-2 left-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[11px] font-semibold text-on-surface">
                  100% Unprocessed
                </span>
              </div>
              <div>
                <h4 className="font-title-sm text-title-sm text-on-surface">Himalayan Flora Honey 400g</h4>
                <p className="font-body-sm text-body-sm text-outline">Wild Harvest • Zero Additives</p>
              </div>
              <div className="mt-space-sm flex items-center justify-between">
                <span className="font-price-card text-price-card text-on-surface">₹650</span>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      'ab7b14f36a322390697b4261',
                      'Himalayan Flora Honey 400g',
                      650,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBgO5QDtBh27uuBnLBpBXuXZKfBKmxwzxGc5PQpHkJuaCMUu55xkU5boNAc6_icjhV_xmTR9eLgQHTfX8mkdbVsdwwCQ1saCc6NaFnpg9M8c_FUrwADQV4OJygRi5lRVZkaKcvhRpV1SYJraMfhyJSpsBefOehxUJmP1G3X48pZjO5xdyt5DshlVrcs8R4NMciZFaY8H3vl7HgOuBUSK5MoFPTR11d5qPKmh3NT7Rvmzeg21Ex5dLftMg',
                      'Grocery & Essentials'
                    )
                  }
                  className="h-9 px-space-md bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface rounded-lg font-title-sm flex items-center gap-1 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Grocery 4 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="relative w-full h-48 rounded-lg bg-surface-container-low overflow-hidden mb-space-sm">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIbaXi7mzx6F3-v1VYNuvOXF2p5HEkDsyzluh5KngOEfFOTkHwC4hwa4UgDk20P8Vxa0wEF-Un3t0vHt9xItHmLFxzL_8QLWVY1VJijfkqUmOkujQLL8IQ8zM35_1jCisD6yZsNFJBm0w8lep8BoTCubno3Oa0999Zav90gJdc55Ihou-00ce-F6w8ZYBqSgdrRx673BTtc8ijhOq4722zt1GNQYkeAtcSrnF7j0sMfz0G969JcFAmRw"
                  alt="Barista Oat &amp; Almond Milk 1L"
                />
                <span className="absolute top-2 left-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[11px] font-semibold text-on-surface">
                  Plant Based
                </span>
              </div>
              <div>
                <h4 className="font-title-sm text-title-sm text-on-surface">Barista Oat &amp; Almond Milk 1L</h4>
                <p className="font-body-sm text-body-sm text-outline">Unsweetened • Calcium Rich</p>
              </div>
              <div className="mt-space-sm flex items-center justify-between">
                <span className="font-price-card text-price-card text-on-surface">₹295</span>
                <button
                  onClick={() =>
                    handleQuickAdd(
                      'e76a094353f7362b563e05e1',
                      'Barista Oat & Almond Milk 1L',
                      295,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBIbaXi7mzx6F3-v1VYNuvOXF2p5HEkDsyzluh5KngOEfFOTkHwC4hwa4UgDk20P8Vxa0wEF-Un3t0vHt9xItHmLFxzL_8QLWVY1VJijfkqUmOkujQLL8IQ8zM35_1jCisD6yZsNFJBm0w8lep8BoTCubno3Oa0999Zav90gJdc55Ihou-00ce-F6w8ZYBqSgdrRx673BTtc8ijhOq4722zt1GNQYkeAtcSrnF7j0sMfz0G969JcFAmRw',
                      'Grocery & Essentials'
                    )
                  }
                  className="h-9 px-space-md bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface rounded-lg font-title-sm flex items-center gap-1 transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add</span>
                </button>
              </div>
            </div>
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
