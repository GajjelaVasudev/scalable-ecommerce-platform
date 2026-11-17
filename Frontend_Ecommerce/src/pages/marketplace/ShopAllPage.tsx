import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { STITCH_SHOP_ALL_PRODUCTS, StitchCatalogProduct } from '../../services/mockData';
import { ProductCard } from '../../components/marketplace/ProductCard';

export const ShopAllPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // View state: 'grid' (3 columns) vs 'compact' (4 columns)
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Products per page
  const [productsPerPage, setProductsPerPage] = useState<number>(24);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Discovery Accordion state
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);

  // Sidebar collapsible sections
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);

  // Filters (Initialized to match Stitch's curated default reference state)
  const initialCategoryParam = searchParams.get('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategoryParam ? [initialCategoryParam] : ['Electronics', 'Home Living']
  );

  const [minPriceInput, setMinPriceInput] = useState('499');
  const [maxPriceInput, setMaxPriceInput] = useState('15,000');
  const [appliedMinPrice, setAppliedMinPrice] = useState<number>(499);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number>(15000);

  const [brandSearch, setBrandSearch] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['Sony', 'Dyson']);

  const [selectedRating, setSelectedRating] = useState<number>(4); // 4★ & Up by default

  const [fastPrimeOnly, setFastPrimeOnly] = useState<boolean>(true);
  const [twoDayOnly, setTwoDayOnly] = useState<boolean>(false);
  const [codOnly, setCodOnly] = useState<boolean>(false);

  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([30]); // 30% off or higher by default

  const [inStockOnly, setInStockOnly] = useState<boolean>(true);

  const [sortBy, setSortBy] = useState<string>('featured');

  // Search query from URL or state
  const searchParam = searchParams.get('search') || '';

  // Synchronize category searchParam if passed externally
  useEffect(() => {
    if (initialCategoryParam && !selectedCategories.includes(initialCategoryParam)) {
      setSelectedCategories([initialCategoryParam]);
    }
  }, [initialCategoryParam]);

  // Handle category toggle
  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setCurrentPage(1);
  };

  // Handle brand toggle
  const handleToggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setCurrentPage(1);
  };

  // Handle price apply
  const handleApplyPrice = () => {
    const min = parseInt(minPriceInput.replace(/[^0-9]/g, ''), 10) || 0;
    const max = parseInt(maxPriceInput.replace(/[^0-9]/g, ''), 10) || 100000;
    setAppliedMinPrice(min);
    setAppliedMaxPrice(max);
    setCurrentPage(1);
  };

  // Handle discount toggle
  const handleToggleDiscount = (disc: number) => {
    setSelectedDiscounts((prev) =>
      prev.includes(disc) ? prev.filter((d) => d !== disc) : [...prev, disc]
    );
    setCurrentPage(1);
  };

  // Reset all filters to default Stitch baseline
  const handleResetFilters = () => {
    setSelectedCategories(['Electronics', 'Home Living']);
    setMinPriceInput('499');
    setMaxPriceInput('15,000');
    setAppliedMinPrice(499);
    setAppliedMaxPrice(15000);
    setBrandSearch('');
    setSelectedBrands(['Sony', 'Dyson']);
    setSelectedRating(4);
    setFastPrimeOnly(true);
    setTwoDayOnly(false);
    setCodOnly(false);
    setSelectedDiscounts([30]);
    setInStockOnly(true);
    setSortBy('featured');
    setSearchParams({});
    setCurrentPage(1);
  };

  // Clear all filters completely
  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setMinPriceInput('');
    setMaxPriceInput('');
    setAppliedMinPrice(0);
    setAppliedMaxPrice(999999);
    setSelectedBrands([]);
    setSelectedRating(0);
    setFastPrimeOnly(false);
    setTwoDayOnly(false);
    setCodOnly(false);
    setSelectedDiscounts([]);
    setInStockOnly(false);
    setSortBy('featured');
    setSearchParams({});
    setCurrentPage(1);
  };

  // Master product filtering & sorting logic
  const filteredProducts = useMemo(() => {
    return STITCH_SHOP_ALL_PRODUCTS.filter((prod) => {
      // 1. Search Query
      if (searchParam) {
        const q = searchParam.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesBrand = prod.brand.toLowerCase().includes(q);
        const matchesDesc = prod.description.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesDesc) return false;
      }

      // 2. Category Filter
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(prod.category)) {
          // Check for subcategory / partial match
          const matches = selectedCategories.some((cat) =>
            prod.category.toLowerCase().includes(cat.toLowerCase())
          );
          if (!matches) return false;
        }
      }

      // 3. Price Filter (Applied)
      if (appliedMinPrice > 0 && prod.price < appliedMinPrice) return false;
      if (appliedMaxPrice > 0 && prod.price > appliedMaxPrice) return false;

      // 4. Brand Filter
      if (selectedBrands.length > 0) {
        const matchesBrand =
          selectedBrands.includes(prod.brandTag) ||
          selectedBrands.some((b) => prod.brand.toLowerCase().includes(b.toLowerCase()));
        if (!matchesBrand) return false;
      }

      // 5. Rating Filter
      if (selectedRating > 0 && prod.rating < selectedRating) return false;

      // 6. Fulfillment & Speed Filter
      if (fastPrimeOnly && !prod.fastPrime) return false;
      if (twoDayOnly && !prod.twoDayDelivery) return false;
      if (codOnly && !prod.codEligible) return false;

      // 7. Discount Filter
      if (selectedDiscounts.length > 0) {
        const minDisc = Math.min(...selectedDiscounts);
        const prodDisc = prod.originalPrice
          ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
          : 0;
        if (prodDisc < minDisc) return false;
      }

      // 8. In Stock Filter
      if (inStockOnly && prod.stock <= 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return b._id.localeCompare(a._id);
      return 0; // 'featured' retains Stitch's original curated order
    });
  }, [
    searchParam,
    selectedCategories,
    appliedMinPrice,
    appliedMaxPrice,
    selectedBrands,
    selectedRating,
    fastPrimeOnly,
    twoDayOnly,
    codOnly,
    selectedDiscounts,
    inStockOnly,
    sortBy,
  ]);

  // If strict filtering produces zero results, fallback gracefully to the 9 Stitch curated items
  const displayProducts = filteredProducts.length > 0 ? filteredProducts : STITCH_SHOP_ALL_PRODUCTS;

  // Category counts
  const categoryTree = [
    { name: 'Electronics', count: 420 },
    { name: 'Home Living', count: 312 },
    { name: 'Grocery & Essentials', count: 280 },
    { name: 'Beauty & Care', count: 215 },
    { name: 'Fashion & Apparel', count: 195 },
    { name: 'Sports & Outdoors', count: 60 },
  ];

  // Brand facet list
  const brandList = [
    'Sony',
    'Apple',
    'Dyson',
    'Philips',
    'Forest Essentials',
    'Tata Consumer',
    'Nike',
  ];

  const visibleBrands = brandSearch
    ? brandList.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()))
    : brandList;

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1440px] w-full mx-auto px-margin-mobile md:px-margin py-space-md flex flex-col gap-space-lg">
        {/* 1. BREADCRUMB & METADATA */}
        <div className="flex flex-wrap items-center justify-between gap-space-xs text-body-sm text-outline">
          <nav className="flex items-center gap-space-xs" aria-label="Breadcrumb">
            <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors">
              Home
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link to="/products" className="text-on-surface-variant hover:text-primary transition-colors">
              Multi-Category Catalog
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-title-sm text-on-surface">All Products</span>
          </nav>
          <div className="flex items-center gap-space-xs text-label-md font-label-md bg-surface-container px-space-sm py-1 rounded-full text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>
              Catalog Synchronized: <strong className="text-on-surface font-semibold">1,482 verified items</strong>
            </span>
          </div>
        </div>

        {/* 2. PAGE HEADER & ACTIVE FILTER CHIPS */}
        <div className="flex flex-col gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
            <div>
              <span className="font-label-sm text-primary uppercase tracking-wider font-semibold">
                Curated Marketplace
              </span>
              <h1 className="font-headline-lg text-headline-lg font-['Space_Grotesk'] text-on-surface tracking-tight mt-0.5">
                Explore All Products
              </h1>
            </div>
            <p className="font-body-md text-on-surface-variant text-right hidden md:block">
              Displaying premium inventory across 6 global retail sectors
            </p>
          </div>

          {/* Active Filter Chips / Facet Pills */}
          <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
            <span className="font-label-sm text-outline uppercase tracking-wider mr-1">
              Active Facets:
            </span>

            {/* In Stock Pill */}
            {inStockOnly && (
              <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-label-md font-label-md text-on-surface group">
                <span>In Stock</span>
                <button
                  type="button"
                  onClick={() => setInStockOnly(false)}
                  className="text-outline hover:text-primary flex items-center justify-center"
                  aria-label="Remove In Stock facet"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Rating Pill */}
            {selectedRating > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-label-md font-label-md text-on-surface group">
                <span className="text-[#E27300] font-bold">{selectedRating}★ &amp; Above</span>
                <button
                  type="button"
                  onClick={() => setSelectedRating(0)}
                  className="text-outline hover:text-primary flex items-center justify-center"
                  aria-label="Remove rating facet"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Price Pill */}
            {appliedMaxPrice < 999999 && (
              <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-label-md font-label-md text-on-surface group">
                <span>Under ₹{appliedMaxPrice.toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedMaxPrice(999999);
                    setMaxPriceInput('');
                  }}
                  className="text-outline hover:text-primary flex items-center justify-center"
                  aria-label="Remove price facet"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Category Pill */}
            {selectedCategories.length > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-label-md font-label-md text-on-surface group">
                <span>
                  {selectedCategories.length === 2 &&
                  selectedCategories.includes('Electronics') &&
                  selectedCategories.includes('Home Living')
                    ? 'Electronics & Home'
                    : selectedCategories.join(', ')}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  className="text-outline hover:text-primary flex items-center justify-center"
                  aria-label="Remove category facet"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Brand Pills if any other selected */}
            {selectedBrands.length > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-label-md font-label-md text-on-surface group">
                <span>Brands: {selectedBrands.join(', ')}</span>
                <button
                  type="button"
                  onClick={() => setSelectedBrands([])}
                  className="text-outline hover:text-primary flex items-center justify-center"
                  aria-label="Remove brand facet"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-primary hover:text-secondary font-label-md text-label-md underline ml-2 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* 3. TOOLBAR (COUNTS, LAYOUT TOGGLE, SORTING) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg">
          <div className="flex items-center gap-space-md">
            <span className="font-body-md text-body-md text-on-surface">
              Showing <span className="font-semibold text-primary">1–{displayProducts.length}</span> of{' '}
              <span className="font-semibold text-on-surface">1,482 items</span>
            </span>
            <div className="hidden sm:flex items-center bg-surface-container-lowest p-0.5 rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
                id="viewGridBtn"
                title="Comfortable Grid View"
                aria-label="Comfortable Grid View"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
                id="viewCompactBtn"
                title="Dense Compact List"
                aria-label="Dense Compact List"
              >
                <span className="material-symbols-outlined text-[18px]">view_agenda</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-space-sm">
            <label
              className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap"
              htmlFor="sortDropdown"
            >
              Sort by:
            </label>
            <div className="relative min-w-[210px]">
              <select
                id="sortDropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-surface-container-lowest text-on-surface font-title-sm text-title-sm px-space-sm py-2 rounded-lg pr-9 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="featured">Featured &amp; Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Average Customer Review</option>
                <option value="newest">Newest Arrivals</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* 4. MAIN TWO-COLUMN CONTENT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* LEFT STICKY FILTER SIDEBAR (Desktop) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-44 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-lg">
              {/* Header with Reset */}
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">filter_list</span>
                  <h2 className="font-title-md text-title-md text-on-surface">Filter Products</h2>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-label-sm text-outline hover:text-primary uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* SECTION: CATEGORIES TREE */}
              <div className="flex flex-col gap-space-sm">
                <button
                  type="button"
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  className="flex items-center justify-between text-left w-full cursor-pointer"
                >
                  <span className="font-title-sm text-title-sm text-on-surface">Categories</span>
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    {isCategoriesExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isCategoriesExpanded && (
                  <div className="flex flex-col gap-2 pt-1 font-body-md text-body-md text-on-surface-variant">
                    {categoryTree.map((cat) => {
                      const isChecked = selectedCategories.includes(cat.name);
                      return (
                        <label
                          key={cat.name}
                          className="flex items-center justify-between cursor-pointer group"
                        >
                          <span className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCategory(cat.name)}
                              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                            />
                            <span
                              className={`transition-colors ${
                                isChecked
                                  ? 'text-on-surface font-semibold group-hover:text-primary'
                                  : 'group-hover:text-primary'
                              }`}
                            >
                              {cat.name}
                            </span>
                          </span>
                          <span className="text-label-sm font-label-sm text-outline tabular-nums">
                            {cat.count}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="h-px bg-surface-container" />

              {/* SECTION: PRICE RANGE SLIDER */}
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-title-sm text-title-sm text-on-surface">Price Range</span>
                  <span className="text-label-sm font-label-sm text-primary font-medium">INR (₹)</span>
                </div>

                {/* Graphic Track Representation */}
                <div className="relative w-full py-2 select-none">
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden relative">
                    <div className="absolute left-[5%] right-[25%] h-full bg-primary rounded-full" />
                  </div>
                  <div className="absolute left-[5%] top-1/2 -translate-y-1/2 w-4 h-4 bg-surface-container-lowest rounded-full shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="absolute right-[25%] top-1/2 -translate-y-1/2 w-4 h-4 bg-surface-container-lowest rounded-full shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                </div>

                {/* Manual Numeric Entry Inputs */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 bg-surface-container px-2 py-1.5 rounded-lg flex items-center gap-1">
                    <span className="font-body-sm text-outline">₹</span>
                    <input
                      type="text"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
                      className="w-full bg-transparent font-title-sm text-title-sm text-on-surface outline-none tabular-nums"
                    />
                  </div>
                  <span className="text-outline font-label-sm">–</span>
                  <div className="flex-1 bg-surface-container px-2 py-1.5 rounded-lg flex items-center gap-1">
                    <span className="font-body-sm text-outline">₹</span>
                    <input
                      type="text"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
                      className="w-full bg-transparent font-title-sm text-title-sm text-on-surface outline-none tabular-nums"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPrice}
                    className="bg-primary hover:bg-secondary text-on-primary px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    Go
                  </button>
                </div>
              </div>

              <div className="h-px bg-surface-container" />

              {/* SECTION: BRAND SEARCH & FACETS */}
              <div className="flex flex-col gap-space-sm">
                <span className="font-title-sm text-title-sm text-on-surface">Popular Brands</span>
                <div className="relative">
                  <input
                    type="text"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    placeholder="Search brands..."
                    className="w-full bg-surface-container px-3 py-1.5 pl-8 rounded-lg font-body-sm text-body-sm outline-none text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary"
                  />
                  <span className="material-symbols-outlined text-[16px] text-outline absolute left-2 top-1/2 -translate-y-1/2">
                    search
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto flex flex-col gap-2 pt-1 font-body-md text-body-md text-on-surface-variant pr-1">
                  {visibleBrands.map((brand) => {
                    const isChecked = selectedBrands.includes(brand);
                    return (
                      <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleBrand(brand)}
                          className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                        />
                        <span
                          className={`transition-colors ${
                            isChecked
                              ? 'text-on-surface font-semibold group-hover:text-primary'
                              : 'group-hover:text-primary'
                          }`}
                        >
                          {brand}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-surface-container" />

              {/* SECTION: CUSTOMER REVIEWS */}
              <div className="flex flex-col gap-space-sm">
                <span className="font-title-sm text-title-sm text-on-surface">Customer Rating</span>
                <div className="flex flex-col gap-2 font-body-sm text-body-sm">
                  {/* 4 Star Option */}
                  <label className="flex items-center justify-between cursor-pointer group py-1 px-1 rounded hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rating-filter"
                        checked={selectedRating === 4}
                        onChange={() => setSelectedRating(4)}
                        className="w-4 h-4 text-primary accent-primary cursor-pointer"
                      />
                      <div className="flex items-center gap-0.5 text-[#E27300]">
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
                        <span className="material-symbols-outlined text-[18px]">star_outline</span>
                      </div>
                    </div>
                    <span className="font-title-sm text-title-sm text-on-surface group-hover:text-primary whitespace-nowrap">
                      &amp; Up
                    </span>
                  </label>

                  {/* 3 Star Option */}
                  <label className="flex items-center justify-between cursor-pointer group py-1 px-1 rounded hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rating-filter"
                        checked={selectedRating === 3}
                        onChange={() => setSelectedRating(3)}
                        className="w-4 h-4 text-primary accent-primary cursor-pointer"
                      />
                      <div className="flex items-center gap-0.5 text-[#E27300]">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span className="material-symbols-outlined text-[18px]">star_outline</span>
                        <span className="material-symbols-outlined text-[18px]">star_outline</span>
                      </div>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-primary whitespace-nowrap">
                      &amp; Up
                    </span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-surface-container" />

              {/* SECTION: FULFILLMENT & SPEED */}
              <div className="flex flex-col gap-space-sm">
                <span className="font-title-sm text-title-sm text-on-surface">Fulfillment &amp; Speed</span>
                <div className="flex flex-col gap-2.5 font-body-md text-body-md text-on-surface-variant">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fastPrimeOnly}
                      onChange={(e) => setFastPrimeOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <span className="material-symbols-outlined text-[18px]">bolt</span>
                      OMIZON FastPrime
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoDayOnly}
                      onChange={(e) => setTwoDayOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    <span>2-Day Delivery Guaranteed</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={codOnly}
                      onChange={(e) => setCodOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    <span>Cash on Delivery Eligible</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-surface-container" />

              {/* SECTION: DISCOUNT TIERS */}
              <div className="flex flex-col gap-space-sm">
                <span className="font-title-sm text-title-sm text-on-surface">Discount Offers</span>
                <div className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedDiscounts.includes(50)}
                      onChange={() => handleToggleDiscount(50)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    <span className="group-hover:text-primary">50% off or higher</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedDiscounts.includes(30)}
                      onChange={() => handleToggleDiscount(30)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    <span className="group-hover:text-primary text-on-surface font-semibold">
                      30% off or higher
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedDiscounts.includes(10)}
                      onChange={() => handleToggleDiscount(10)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    <span className="group-hover:text-primary">10% off or higher</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT PRODUCT GRID SECTION */}
          <section className="lg:col-span-9 flex flex-col gap-space-xl">
            {/* Dynamic Product Grid */}
            <div
              id="productListingGrid"
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm'
              }
            >
              {displayProducts.map((prod) => (
                <ProductCard key={prod._id} product={prod} viewMode={viewMode} />
              ))}
            </div>

            {/* PAGINATION & PAGE-SIZE SELECTOR */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md">
              {/* Products per page */}
              <div className="flex items-center gap-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Products per page:</span>
                <div className="flex items-center bg-surface-container rounded-lg p-0.5">
                  {[24, 48, 96].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setProductsPerPage(size)}
                      className={`px-2.5 py-1 text-label-sm font-label-sm rounded-md transition-all ${
                        productsPerPage === size
                          ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Navigation Items */}
              <div className="flex items-center gap-1.5 font-label-md text-label-md">
                <button
                  type="button"
                  aria-label="Previous Page"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline disabled:opacity-40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg font-bold flex items-center justify-center transition-all ${
                      currentPage === page
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <span className="px-1.5 text-outline font-bold flex items-center justify-center select-none">
                  …
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(42)}
                  className={`w-9 h-9 rounded-lg font-bold flex items-center justify-center transition-all ${
                    currentPage === 42
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  42
                </button>

                <button
                  type="button"
                  aria-label="Next Page"
                  onClick={() => setCurrentPage((p) => Math.min(42, p + 1))}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              <span className="font-body-sm text-body-sm text-outline tabular-nums">
                Page {currentPage} of 42
              </span>
            </div>

            {/* NO-RESULTS FALLBACK & SMART DISCOVERY ACCORDION */}
            <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-md">
              <div
                id="discoveryAccordionToggle"
                onClick={() => setIsDiscoveryOpen(!isDiscoveryOpen)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                  </div>
                  <div>
                    <h4 className="font-title-sm text-title-sm text-on-surface">
                      Looking for something specific?
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      OMIZON predictive matching engine suggestions for frequent catalog searches
                    </p>
                  </div>
                </div>
                <span
                  id="discoveryAccordionIcon"
                  className="material-symbols-outlined text-outline transition-transform duration-200"
                  style={{ transform: isDiscoveryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  expand_more
                </span>
              </div>

              {isDiscoveryOpen && (
                <div
                  id="discoveryAccordionContent"
                  className="flex flex-col gap-space-md pt-space-xs"
                >
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    If your current filter combination ever returns zero items, our algorithm automatically relaxes strict brand limitations and suggests the closest in-stock alternatives:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                    <div
                      onClick={() => {
                        setSelectedCategories(['Electronics']);
                        setSelectedBrands(['Sony']);
                      }}
                      className="bg-surface-container-lowest p-space-sm rounded-lg flex items-center gap-space-xs hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        search_check
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">
                        Explore All Wireless ANC
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedCategories(['Home Living']);
                      }}
                      className="bg-surface-container-lowest p-space-sm rounded-lg flex items-center gap-space-xs hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        local_fire_department
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">
                        Trending Home Essentials
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedDiscounts([50]);
                      }}
                      className="bg-surface-container-lowest p-space-sm rounded-lg flex items-center gap-space-xs hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        percent
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">
                        Flash Sales Above 40% Off
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
