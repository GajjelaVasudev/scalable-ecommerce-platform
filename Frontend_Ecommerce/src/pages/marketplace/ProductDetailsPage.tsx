import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatCurrency, calculateDiscount } from '../../utils/format';
import { api } from '../../services/api';
import { Product } from '../../types';

interface Colorway {
  id: string;
  name: string;
  colorClass: string;
  image: string;
}

interface ModelEdition {
  id: string;
  name: string;
  subtitle: string;
  price: number;
}

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  // Colorways
  const colorways: Colorway[] = [
    {
      id: 'violet',
      name: 'Midnight Violet',
      colorClass: 'bg-primary',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBPXhK-ejxViMnA_YYKuRyQbqmrgM7qq8kXbo1FLDz1prk6nkcNv2BvcPk52hVmW0TreETVslB4WaiOJCKyNqKKMKZTOdWGxk6U_MOd1VAtSes3vTU3gGNc3wGLWe577mP5AX5JAaOVysmbfmcmdXsU3ToAJSLLQ2V1KJMd-AUfqWKjnXXhT71flYHKtHM3AS_XO0w_SfoDfmFd5xlYNlo0CqSLr73zFV_rpe2jKFDMaJvBb3v4F-vlPQ',
    },
    {
      id: 'black',
      name: 'Matte Black',
      colorClass: 'bg-inverse-surface',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBsi3Q56BuqkVxQ4CPdkPVgHzdzjibGO3d1og60yJr2I6RP1NuKGqZsB3mrp54JFpHDxuNIqfme27MivqqR5FGO90HFLDsIq6A4E9jRhTcQhfdHBQehGwXmpZhkCCLeA0z-l6QDRiJAhyKuNZST8TqBAsRZDd11B7gLNEzb4EzDwyNbKII1jF1d83DK0NyKnMyWz8tV0wiGGUxxbNuCPxeLm40L6kxT6Sa3lO51VBwBoDiD9VlVZWugJw',
    },
    {
      id: 'silver',
      name: 'Platinum Silver',
      colorClass: 'bg-slate-300',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC6qzP3zWmIFqS250onY-MHcEaqc-OSfW_7uEjx7CRgZ-Y2yHSKHihUb6g_angcT4gJKx8RYEQ6I_gMMkZlr24cdc_mD4kSk4Luya0lRWqPIpQT2uzDn03fxbI_YGbZTx5ceT3DOuijAhoPNON7htXrfAG40x52nDk9zQPabi-Jo6HQcR3f2nA9siQ3cArmB4vuivCxKfYSQGQknhlZP2DlaoATfC4bVt94Q08XjBpRooE_-f6rNXb7AQ',
    },
    {
      id: 'beige',
      name: 'Sandstone Beige',
      colorClass: 'bg-amber-100',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCzNNe_tX-D5oF-9TPxxV0WmAAEBIc2oAsBk7To1JHkJjn_fdyWiAWDJqakkt747Abna_lCYJ_BPvByMIS76SAYLTuK9zno2zb8xRIy4eMghtmP0f_5koXQdeIfAb97C6ZUjv9IMQDq9g-Ia3jh3t5T6y3S6cJU_EAeQpIcCRpNCBUfBPJi7NzXc6VLY3ce1cXRYWxr7KPw0NIPCpwvKC-8Mh9D3YYy9s6rEeXjCuSaMikAHWWItkOSbw',
    },
  ];

  // Gallery Thumbnails (Default SoundPulse)
  const DEFAULT_HEADPHONE_THUMBNAILS = [
    {
      id: 0,
      alt: 'SoundPulse Studio Pro Wireless ANC Headphones in Midnight Violet front studio frontal view',
      src: colorways[0].image,
    },
    {
      id: 1,
      alt: 'SoundPulse Studio Pro foldable mechanism detail angled hinge view on clean violet pedestal',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6qzP3zWmIFqS250onY-MHcEaqc-OSfW_7uEjx7CRgZ-Y2yHSKHihUb6g_angcT4gJKx8RYEQ6I_gMMkZlr24cdc_mD4kSk4Luya0lRWqPIpQT2uzDn03fxbI_YGbZTx5ceT3DOuijAhoPNON7htXrfAG40x52nDk9zQPabi-Jo6HQcR3f2nA9siQ3cArmB4vuivCxKfYSQGQknhlZP2DlaoATfC4bVt94Q08XjBpRooE_-f6rNXb7AQ',
    },
    {
      id: 2,
      alt: 'Modern stylish female music producer wearing SoundPulse Studio Pro headphones in audio studio',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzNNe_tX-D5oF-9TPxxV0WmAAEBIc2oAsBk7To1JHkJjn_fdyWiAWDJqakkt747Abna_lCYJ_BPvByMIS76SAYLTuK9zno2zb8xRIy4eMghtmP0f_5koXQdeIfAb97C6ZUjv9IMQDq9g-Ia3jh3t5T6y3S6cJU_EAeQpIcCRpNCBUfBPJi7NzXc6VLY3ce1cXRYWxr7KPw0NIPCpwvKC-8Mh9D3YYy9s6rEeXjCuSaMikAHWWItkOSbw',
    },
    {
      id: 3,
      alt: 'Macro close-up shot of plush memory foam ear cup texture with custom acoustic mesh knit fabric',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzZdzes8rtkFZQlMSiDWANcUCbm4xmv14R2OfwASf1Q8ZBAedLtgTwkg_wBKERILcNcWQXRhORZZc8AJYJGORl4COSSTqHacLNbS4z5oFthQADDGzS5w84IX19DJkoWtWYPiH3l-fxSIBKfAzx2ZdyPN6-BkriJ4YIkpFfqkCFOCrsz5pEtBu96-shPa-A0AIrdyne2eX-h3KkNmpcTy3MMZBxmyOMoH00mUNA8Gti16X9S4HzQPnufA',
    },
    {
      id: 4,
      alt: 'SoundPulse hard-shell carrying case with magnetic cable accessories pack on oak desk',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2PcAHvh1Md_ZDzeNLhyXMXCnkFC0CJFdyG0fE-Fz_3WfZ7QQvW6xO_bvyjRWO3gC9LF4Y91eUytK-wDg9cZO3R0Y_U1Xtf0Q0WBjEhJb7DZG7LdatTnAv4gNhAOAyR_dLp1SdPioBnv8FAgu1V5dtNl8DTy1khxkCPDFverd4wrYJ4Ij4yzmvUcfDq52T8Qi307lVJBCt8z_y86_Lha1TTuJiWtADCCwR29I3eemZEN8s7LHE83wvOA',
    },
  ];

  // Model Editions
  const modelEditions: ModelEdition[] = [
    {
      id: 'standard',
      name: 'Standard ANC Edition',
      subtitle: 'Wireless Bluetooth 5.3 + Aux Cable',
      price: 14999,
    },
    {
      id: 'lossless',
      name: 'Studio Pro + Lossless DAC Cable',
      subtitle: 'Includes 32-bit Audiophile USB-C DAC',
      price: 17499,
    },
  ];

  // State
  const [selectedColor, setSelectedColor] = useState<Colorway>(colorways[0]);
  const [activeThumbIndex, setActiveThumbIndex] = useState<number>(0);
  const [selectedEdition, setSelectedEdition] = useState<ModelEdition>(modelEditions[0]);
  const [selectedVariant, setSelectedVariant] = useState<string>('Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'techspecs' | 'box' | 'reviews' | 'qa'>('overview');
  const [deliveryPincode, setDeliveryPincode] = useState<string>('400001 - Mumbai');
  const [showStickyBar, setShowStickyBar] = useState<boolean>(false);
  const [cartBtnText, setCartBtnText] = useState<'Add to Cart' | 'Added to Basket'>('Add to Cart');
  const [bundleBtnText, setBundleBtnText] = useState<'Add all 3 to Cart' | 'Added 3 Items to Bag'>('Add all 3 to Cart');

  // Live Database Product State
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api.products.getById(id)
      .then((res) => {
        if (!isMounted) return;
        setProduct(res.product);
        if (res.product?.variants && Array.isArray(res.product.variants) && res.product.variants.length > 0) {
          const firstNonDefault = res.product.variants.find((v: any) => v.name && v.name !== 'default');
          if (firstNonDefault) {
            setSelectedVariant(firstNonDefault.name);
          }
        }
        setActiveThumbIndex(0);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Product not found or failed to load');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Dynamic Product Resolution
  const displayProduct: Product = product || {
    _id: '2545922d18419b69f8ab9ee3',
    name:
      'SoundPulse Studio Pro Wireless Over-Ear Active Noise-Cancelling Headphones with Spatial Audio & 60h Battery',
    description:
      'Crafted for pristine transparency, the SoundPulse Studio Pro features ultra-stiff Beryllium-coated diaphragm drivers delivering zero harmonic distortion.',
    price: selectedEdition.price,
    originalPrice: 22999,
    stock: 14,
    category: 'Electronics',
    image: selectedColor.image,
    seller: { _id: 'seller_soundpulse', username: 'SoundPulse Official Flagship Store' },
    status: 'active',
    rating: 4.8,
    reviewCount: 4829,
  };

  const isSoundPulseHeadphones = Boolean(
    displayProduct.name.toLowerCase().includes('soundpulse') ||
    displayProduct.name.toLowerCase().includes('headphone')
  );

  const realVariants = React.useMemo(() => {
    if (product?.variants && Array.isArray(product.variants)) {
      return product.variants.filter((v: any) => v.name && v.name !== 'default');
    }
    return [];
  }, [product]);

  const productImages: string[] = React.useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    if (product?.image) {
      return [product.image];
    }
    if (isSoundPulseHeadphones) {
      return colorways.map((c) => c.image);
    }
    return [displayProduct.image || colorways[0].image];
  }, [product, isSoundPulseHeadphones, displayProduct.image]);

  const galleryThumbnails = React.useMemo(() => {
    if (isSoundPulseHeadphones && (!product?.images || product.images.length === 0)) {
      return DEFAULT_HEADPHONE_THUMBNAILS;
    }
    return productImages.map((src, idx) => ({
      id: idx,
      alt: `${displayProduct.name} - View ${idx + 1}`,
      src,
    }));
  }, [productImages, displayProduct.name, isSoundPulseHeadphones, product?.images]);

  const activeMainImage =
    galleryThumbnails[activeThumbIndex]?.src ||
    (isSoundPulseHeadphones && activeThumbIndex === 0 ? selectedColor.image : displayProduct.image) ||
    colorways[0].image;

  const currentPrice = isSoundPulseHeadphones
    ? selectedEdition.id === 'standard'
      ? displayProduct.price
      : (selectedEdition.price || Math.round(displayProduct.price * 1.15))
    : displayProduct.price;

  const originalPrice = displayProduct.originalPrice || Math.round(displayProduct.price * 1.25);
  const discountPercent = calculateDiscount(originalPrice, currentPrice);
  const storeName =
    displayProduct.brand ||
    (typeof displayProduct.seller === 'object'
      ? displayProduct.seller.username
      : 'OMIZON Official Flagship Store');
  const categoryName =
    typeof displayProduct.category === 'object'
      ? displayProduct.category.name
      : (displayProduct.category || 'Audio & Headphones');

  // Sticky Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Thumbnail swap
  const handleSwapImage = (index: number) => {
    setActiveThumbIndex(index);
  };

  // Colorway swap
  const handleSelectColor = (color: Colorway) => {
    setSelectedColor(color);
    setActiveThumbIndex(0);
  };

  // Quantity handlers
  const handleQtyChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  const variantName = realVariants.length > 0
    ? selectedVariant
    : isSoundPulseHeadphones
    ? `${selectedColor.name} • ${selectedEdition.name}`
    : 'default';

  // Add to cart
  const handleAddToCart = () => {
    addItem(displayProduct, quantity, variantName);
    setCartBtnText('Added to Basket');
    setTimeout(() => setCartBtnText('Add to Cart'), 1800);
  };

  // Buy Now
  const handleBuyNow = () => {
    addItem(displayProduct, quantity, variantName);
    navigate('/checkout');
  };

  // Add bundle items
  const handleAddBundle = () => {
    addItem(displayProduct, 1, `${selectedColor.name} • Standard ANC`);
    addItem(
      {
        _id: '0f3d1539a06a6ca823451b60',
        name: 'Aegis Hard Travel Case',
        description: 'Rugged EVA waterproof protective hard travel case for over-ear headphones.',
        price: 999,
        stock: 50,
        category: 'Accessories',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuABoMePG7clcHXZVCWijwJwf3sVgD3Gy0owe9tJRRLaCiYI37Zi86ptnXuifOi6_2pdrSml-haXNQexAPPPVIovqaFlUmL0gwY6VPawCNtmUmtYm1BaWRirSyirM6YaSEooY-xonvSR9d4JBz1E7gjSagDdkFOOETpSzNNsvcULRgULr3LvLU3LDUFOCghHwS2v-ZTuFj1wUOFaxhRYH5LR9VEzuzIFxFtfFoQN0weOTCDfYsA1AG6QXg',
      },
      1
    );
    addItem(
      {
        _id: 'ef3aed50ee5fcff014bb21f8',
        name: 'Volta 45W GaN Dual Charger',
        description: 'Ultra-compact 45W Dual USB-C GaN fast wall charger adapter in matte black.',
        price: 1199,
        stock: 45,
        category: 'Accessories',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCBi9VnX6KOGVmPmUW5eenPj4JclS9lNE0gvazKlLapj5a9om3la3xUPX3V73NziobWEprga1IuJwOPyhoJ6RDSNJDpHHEv6SGBoLEwmGcaGSGhQBCvB_oGwQaC8gtAuTCmCj-V-JTpTA2JqvcW5AhU_qlov5KAogHdQry5IWWeWzc8M-UqqR2xxyjF-AjxsLcQFfhYYDqO5O4zWuGIJZIgeBcaRYTQBufpEr5VLUVxG5uQWdXt9WvJoA',
      },
      1
    );
    setBundleBtnText('Added 3 Items to Bag');
    setTimeout(() => setBundleBtnText('Add all 3 to Cart'), 2000);
  };

  // Edit PinCode
  const handleEditPincode = () => {
    const pin = window.prompt('Enter your 6-digit delivery pincode:', '400001');
    if (pin && pin.trim().length === 6) {
      setDeliveryPincode(`${pin} - Verified City`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full py-space-xl">
        <div className="max-w-7xl mx-auto w-full px-margin">
          <div className="h-6 bg-surface-container rounded w-64 mb-space-lg animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
            <div className="lg:col-span-5 flex flex-col gap-4 animate-pulse">
              <div className="w-full aspect-square bg-surface-container rounded-xl" />
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-16 h-16 bg-surface-container rounded-lg" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-7 flex flex-col gap-4 animate-pulse">
              <div className="h-5 bg-surface-container rounded w-1/3" />
              <div className="h-9 bg-surface-container rounded w-full" />
              <div className="h-6 bg-surface-container rounded w-1/4" />
              <div className="h-28 bg-surface-container rounded-xl mt-4" />
              <div className="h-12 bg-surface-container rounded-lg w-full mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="max-w-4xl mx-auto my-16 p-8 bg-surface-container-lowest rounded-2xl text-center flex flex-col items-center justify-center gap-space-md border border-outline-variant/30">
        <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">error_outline</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Unable to Load Product</h2>
        <p className="font-body-md text-on-surface-variant max-w-md">{error}</p>
        <div className="flex items-center gap-space-sm pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-secondary text-on-primary px-space-lg py-2.5 rounded-lg font-title-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Retry</span>
          </button>
          <Link
            to="/products"
            className="bg-surface-container hover:bg-surface-container-high text-on-surface px-space-lg py-2.5 rounded-lg font-title-sm flex items-center gap-2 transition-colors"
          >
            <span>Browse All Products</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Sticky Quick-Buy Header Bar (Appears on Scroll) */}
      <div
        id="sticky-pdp-bar"
        className={`fixed top-20 left-0 w-full z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-md transition-transform duration-300 px-margin py-space-sm hidden md:flex items-center justify-between ${
          showStickyBar ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm min-w-0">
            <img
              className="w-11 h-11 rounded-lg object-cover shrink-0 shadow-sm"
              alt="SoundPulse Studio Pro Thumbnail"
              src={selectedColor.image}
            />
            <div className="flex flex-col min-w-0">
              <span className="font-title-sm text-on-surface truncate">
                {displayProduct.name}
              </span>
              <span className="font-body-sm text-on-surface-variant flex items-center gap-2">
                <span className="text-primary font-semibold">{selectedColor.name}</span> •{' '}
                {selectedEdition.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-md shrink-0">
            <div className="flex flex-col text-right">
              <span className="font-price-card text-on-surface">
                {formatCurrency(currentPrice)}
              </span>
              <span className="font-body-sm text-outline line-through text-[12px]">
                M.R.P. {formatCurrency(originalPrice)}
              </span>
            </div>
            <button
              className="bg-primary hover:bg-secondary active:scale-[0.985] text-on-primary font-title-sm px-space-lg py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              onClick={handleAddToCart}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              <span>{cartBtnText}</span>
            </button>
            <button
              className="bg-inverse-surface hover:bg-on-surface text-inverse-on-surface font-title-sm px-space-md py-2.5 rounded-lg shadow-sm transition-all hidden lg:block cursor-pointer"
              onClick={handleBuyNow}
              type="button"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Main PDP Container */}
      <div className="max-w-7xl mx-auto w-full px-margin pb-space-xl">
        {/* Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumb" className="py-space-md">
          <ol className="flex items-center flex-wrap gap-2 text-on-surface-variant font-body-sm">
            <li>
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
            </li>
            <li>
              <Link to="/products" className="hover:text-primary transition-colors">
                Products
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
            </li>
            <li>
              <Link to={`/products?category=${encodeURIComponent(categoryName)}`} className="hover:text-primary transition-colors">
                {categoryName}
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
            </li>
            <li className="font-semibold text-on-surface truncate max-w-xs md:max-w-md">
              {displayProduct.name}
            </li>
          </ol>
        </nav>

        {/* Hybrid Two-Column PDP Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl mb-space-xl">
          {/* LEFT COLUMN: Product Visual Studio (Gallery) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col-reverse md:flex-row gap-space-md">
            {/* Vertical Thumbnails Rail */}
            <div className="flex md:flex-col gap-space-xs overflow-x-auto md:overflow-visible shrink-0 pb-2 md:pb-0" id="gallery-thumbs">
              {galleryThumbnails.map((thumb, idx) => (
                <button
                  key={thumb.id}
                  type="button"
                  onClick={() => handleSwapImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden bg-surface-container-low transition-all relative shrink-0 shadow-sm cursor-pointer ${
                    activeThumbIndex === idx
                      ? 'ring-2 ring-primary'
                      : 'hover:opacity-90 opacity-80'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    className="w-full h-full object-cover"
                    alt={thumb.alt}
                    src={idx === 0 ? selectedColor.image : thumb.src}
                  />
                </button>
              ))}
            </div>

            {/* Primary High-Resolution Viewport */}
            <div className="flex-1 flex flex-col relative">
              <div className="relative w-full aspect-square bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex items-center justify-center group cursor-crosshair">
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
                  <span className="bg-primary text-on-primary font-label-sm uppercase px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    OMIZON Choice
                  </span>
                  <span className="bg-surface-container-highest text-on-surface font-label-sm px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">360</span>
                    360° Interactive View
                  </span>
                </div>

                {/* Wishlist Heart Toggle */}
                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isWishlisted ? 'text-red-500' : 'text-outline hover:text-red-500'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  aria-label="Wishlist toggle"
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {isWishlisted ? 'favorite' : 'favorite_border'}
                  </span>
                </button>

                {/* Main Dynamic Image Display */}
                <img
                  id="main-product-img"
                  className="w-full h-full object-contain p-6 transition-all duration-300 group-hover:scale-105"
                  alt={displayProduct.name}
                  src={activeMainImage}
                />

                {/* Zoom Hint Overlay */}
                <div className="absolute bottom-4 right-4 bg-inverse-surface/80 text-inverse-on-surface text-label-sm font-label-sm px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                  <span>Roll over image to inspect</span>
                </div>
              </div>

              {/* Feature Pills Under Gallery */}
              <div className="grid grid-cols-2 gap-space-xs mt-space-md">
                {isSoundPulseHeadphones ? (
                  <>
                    <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">hearing</span>
                      <div className="flex flex-col">
                        <span className="font-title-sm text-on-surface text-[13px] leading-tight">
                          Hybrid ANC 45dB
                        </span>
                        <span className="font-body-sm text-on-surface-variant text-[11px]">
                          Dynamic adaptive isolation
                        </span>
                      </div>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">battery_charging_full</span>
                      <div className="flex flex-col">
                        <span className="font-title-sm text-on-surface text-[13px] leading-tight">
                          60h Extended Battery
                        </span>
                        <span className="font-body-sm text-on-surface-variant text-[11px]">
                          10 min quick charge = 5h
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">local_shipping</span>
                      <div className="flex flex-col">
                        <span className="font-title-sm text-on-surface text-[13px] leading-tight">
                          FastX Prime Delivery
                        </span>
                        <span className="font-body-sm text-on-surface-variant text-[11px]">
                          Dispatched in 24 hours
                        </span>
                      </div>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">verified</span>
                      <div className="flex flex-col">
                        <span className="font-title-sm text-on-surface text-[13px] leading-tight">
                          100% Genuine Quality
                        </span>
                        <span className="font-body-sm text-on-surface-variant text-[11px]">
                          Verified authentic seller
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Intelligence & Checkout Config */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col">
            {/* Store / Brand Verified Header */}
            <div className="flex items-center justify-between gap-space-xs mb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-md text-primary font-semibold hover:underline cursor-pointer">
                  {storeName}
                </span>
                <span className="bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>{' '}
                  {displayProduct.rating ? Number(displayProduct.rating).toFixed(1) : '4.8'}★
                </span>
              </div>
              <span className="text-body-sm font-body-sm text-outline hidden sm:inline">
                98% Positive Feedback
              </span>
            </div>

            {/* Product Title */}
            <h1 className="font-headline-md text-on-surface tracking-tight mb-space-xs font-bold font-['Space_Grotesk'] leading-tight">
              {displayProduct.name}
            </h1>

            {/* Ratings & QA Meta Line */}
            <div className="flex items-center flex-wrap gap-space-sm pb-space-sm mb-space-md">
              <div className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-md">
                <span className="font-title-sm text-on-surface text-[13px]">
                  {displayProduct.rating ? Number(displayProduct.rating).toFixed(1) : '4.8'}
                </span>
                <div className="flex text-amber-500">
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
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="font-body-sm text-primary hover:underline cursor-pointer"
              >
                {isSoundPulseHeadphones
                  ? '4,829 verified ratings'
                  : displayProduct.reviewCount
                  ? `${displayProduct.reviewCount.toLocaleString()} verified ratings`
                  : 'Customer ratings'}
              </button>
              <span className="text-outline-variant">•</span>
              <button
                type="button"
                onClick={() => setActiveTab('qa')}
                className="font-body-sm text-on-surface-variant hover:text-primary cursor-pointer"
              >
                {isSoundPulseHeadphones ? '840 answered questions' : 'Q&A'}
              </button>
            </div>

            {/* Pricing Banner Box */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-md relative overflow-hidden border-surface-container-highest/20">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-baseline gap-space-sm flex-wrap">
                <span className="font-price-hero text-on-surface tabular-nums">
                  {formatCurrency(currentPrice)}
                </span>
                <span className="font-body-lg text-outline line-through tabular-nums">
                  {formatCurrency(originalPrice)}
                </span>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-title-sm px-2.5 py-0.5 rounded-full font-bold">
                  Save {formatCurrency(originalPrice - currentPrice)} ({discountPercent}% OFF)
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs mt-space-xs pt-space-xs">
                <p className="font-body-sm text-on-surface-variant">
                  Inclusive of all taxes. EMI starts at <strong>₹727/month</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => alert('OMIZON No-Cost EMI available on all major credit cards.')}
                  className="text-primary hover:underline font-label-md text-left sm:text-right cursor-pointer"
                >
                  View EMI &amp; Bank Offers
                </button>
              </div>
              {/* Highlight Bank Promo Tag */}
              <div className="mt-space-sm p-space-xs bg-surface-container-low rounded-lg flex items-center gap-space-xs text-on-surface-variant font-body-sm">
                <span className="material-symbols-outlined text-primary text-[18px]">credit_card</span>
                <span>Flat ₹1,500 Instant Discount on HDFC &amp; ICICI Bank Credit Cards.</span>
              </div>
            </div>

            {/* Variant / Configuration Selector */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-md flex flex-col gap-space-md">
              {isSoundPulseHeadphones ? (
                <>
                  {/* Color Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-space-xs">
                      <span className="font-title-sm text-on-surface">
                        Colorway:{' '}
                        <span className="text-primary font-semibold" id="color-label">
                          {selectedColor.name}
                        </span>
                      </span>
                      <span className="font-label-sm text-outline uppercase tracking-wider">
                        4 Available
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs" id="color-options">
                      {colorways.map((cw) => {
                        const isSelected = selectedColor.id === cw.id;
                        return (
                          <button
                            key={cw.id}
                            type="button"
                            onClick={() => handleSelectColor(cw)}
                            className={`p-2 rounded-lg bg-surface-container-low flex items-center gap-2 text-left shadow-sm transition-all cursor-pointer ${
                              isSelected ? 'ring-2 ring-primary' : 'hover:bg-surface-container'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full ${cw.colorClass} shrink-0 shadow-inner border border-black/10`} />
                            <span
                              className={`font-body-sm text-on-surface text-[13px] truncate ${
                                isSelected ? 'font-semibold' : 'font-medium'
                              }`}
                            >
                              {cw.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Model Edition Selector */}
                  <div>
                    <span className="font-title-sm text-on-surface block mb-space-xs">
                      Model Configuration:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                      {modelEditions.map((edition) => {
                        const isSelected = selectedEdition.id === edition.id;
                        return (
                          <label
                            key={edition.id}
                            className={`cursor-pointer p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-xs transition-all ${
                              isSelected ? 'ring-2 ring-primary' : 'hover:bg-surface-container'
                            }`}
                          >
                            <input
                              type="radio"
                              name="edition"
                              checked={isSelected}
                              onChange={() => setSelectedEdition(edition)}
                              className="mt-1 accent-primary"
                            />
                            <div className="flex flex-col">
                              <span className="font-title-sm text-on-surface text-[14px]">
                                {edition.name}
                              </span>
                              <span className="font-body-sm text-outline text-[12px]">
                                {edition.subtitle}
                              </span>
                              <span
                                className={`font-price-card text-[15px] mt-1 tabular-nums ${
                                  isSelected ? 'text-primary font-bold' : 'text-on-surface'
                                }`}
                              >
                                {formatCurrency(edition.price)}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : realVariants.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-title-sm text-on-surface">
                      Configuration / Variant:{' '}
                      <span className="text-primary font-semibold">{selectedVariant}</span>
                    </span>
                    <span className="font-label-sm text-outline uppercase tracking-wider">
                      {realVariants.length} Option{realVariants.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                    {realVariants.map((v: any) => {
                      const isSelected = selectedVariant === v.name;
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => setSelectedVariant(v.name)}
                          className={`cursor-pointer p-space-sm rounded-lg bg-surface-container-low flex flex-col text-left transition-all ${
                            isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-surface-container'
                          }`}
                        >
                          <span className="font-title-sm text-on-surface text-[14px] font-semibold">{v.name}</span>
                          <span className="font-body-sm text-outline text-[12px]">{v.availableStock > 0 ? `${v.availableStock} in stock` : 'Available'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-xs text-body-sm">
                  <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col">
                    <span className="text-outline text-[11px] uppercase font-semibold">Department</span>
                    <span className="text-on-surface font-medium truncate">{categoryName}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col">
                    <span className="text-outline text-[11px] uppercase font-semibold">Brand Flagship</span>
                    <span className="text-on-surface font-medium truncate">{storeName}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col">
                    <span className="text-outline text-[11px] uppercase font-semibold">Authenticity</span>
                    <span className="text-emerald-700 font-semibold truncate flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">verified</span> 100% Genuine
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Status & Delivery Estimator */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-title-sm text-emerald-800 text-[14px]">
                    In Stock: Only {displayProduct.stock || 14} units remaining
                  </span>
                </div>
                <span className="font-body-sm text-outline text-[12px]">
                  Order within <strong>3 hrs 24 mins</strong>
                </span>
              </div>

              {/* Postal Code Check */}
              <div className="p-space-xs bg-surface-container-low rounded-lg flex items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                    location_on
                  </span>
                  <span className="font-body-md text-on-surface font-medium truncate">
                    Deliver to: <strong>{deliveryPincode}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-label-md text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold shrink-0">
                    FREE Delivery
                  </span>
                  <button
                    type="button"
                    onClick={handleEditPincode}
                    className="text-primary hover:text-secondary font-label-sm uppercase font-semibold shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

              <p className="font-body-sm text-on-surface-variant flex items-center gap-1.5 text-[13px]">
                <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                <span>
                  Fast Delivery guaranteed by <strong>Tomorrow 2:00 PM</strong> with OMIZON Priority.
                </span>
              </p>
            </div>

            {/* Quantity & Primary CTA Strip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm mb-space-md">
              {/* Quantity Stepper */}
              <div className="h-12 bg-surface-container-low rounded-lg px-2 flex items-center justify-between gap-3 shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => handleQtyChange(-1)}
                  className="w-8 h-8 rounded-md hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors cursor-pointer"
                  title="Decrease"
                  aria-label="Decrease quantity"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="font-price-card text-[16px] text-on-surface w-6 text-center tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQtyChange(1)}
                  className="w-8 h-8 rounded-md hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors cursor-pointer"
                  title="Increase"
                  aria-label="Increase quantity"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>

              {/* Add to Cart (Electric Violet) */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-primary hover:bg-secondary active:scale-[0.985] text-on-primary font-title-md rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {cartBtnText === 'Add to Cart' ? 'shopping_bag' : 'done'}
                </span>
                <span>{cartBtnText}</span>
              </button>

              {/* Buy Now (Midnight Violet / Inverse Surface) */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 h-12 bg-inverse-surface hover:bg-on-surface active:scale-[0.985] text-inverse-on-surface font-title-md rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                <span>Buy Now with 1-Click</span>
              </button>
            </div>

            {/* Trust Badges Strip */}
            <div className="grid grid-cols-3 gap-space-xs p-space-sm bg-surface-container-lowest rounded-xl shadow-sm">
              <div className="flex flex-col items-center text-center p-1">
                <span className="material-symbols-outlined text-primary text-[24px] mb-1">sync</span>
                <span className="font-title-sm text-on-surface text-[12px] leading-tight">
                  7 Days Replacement
                </span>
                <span className="font-body-sm text-outline text-[11px]">
                  Hassle-free reverse pickup
                </span>
              </div>
              <div className="flex flex-col items-center text-center p-1">
                <span className="material-symbols-outlined text-primary text-[24px] mb-1">verified_user</span>
                <span className="font-title-sm text-on-surface text-[12px] leading-tight">
                  1 Year Warranty
                </span>
                <span className="font-body-sm text-outline text-[11px]">Direct brand coverage</span>
              </div>
              <div className="flex flex-col items-center text-center p-1">
                <span className="material-symbols-outlined text-primary text-[24px] mb-1">local_shipping</span>
                <span className="font-title-sm text-on-surface text-[12px] leading-tight">
                  Fulfilled by OMIZON
                </span>
                <span className="font-body-sm text-outline text-[11px]">Quality audited &amp; secured</span>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together Bundle Module (Rendered when viewing SoundPulse ecosystem products) */}
        {isSoundPulseHeadphones && (
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-xl">
            <div className="flex items-center gap-space-xs mb-space-md">
              <span className="material-symbols-outlined text-primary text-[24px]">dataset</span>
              <h2 className="font-headline-sm text-on-surface font-['Space_Grotesk'] font-bold">
                Frequently Bought Together
              </h2>
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-space-lg">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-space-md flex-1">
                {/* Item 1: Primary Headphone */}
                <div className="flex flex-col items-center text-center w-36">
                  <div className="w-24 h-24 rounded-lg bg-surface-container-low p-2 shadow-sm relative mb-2 flex items-center justify-center">
                    <img
                      className="w-full h-full object-contain"
                      alt="SoundPulse Studio Pro Headphones miniature icon"
                      src={selectedColor.image}
                    />
                    <span className="absolute top-1 left-1 bg-primary text-on-primary text-[9px] font-bold px-1 rounded">
                      THIS ITEM
                    </span>
                  </div>
                  <span className="font-title-sm text-on-surface text-[12px] line-clamp-2">
                    SoundPulse Studio Pro
                  </span>
                  <span className="font-price-card text-[14px] text-primary tabular-nums">
                    {formatCurrency(selectedEdition.price)}
                  </span>
                </div>

                <span className="material-symbols-outlined text-[24px] text-outline font-bold">
                  add
                </span>

                {/* Item 2: Hard Shell Travel Case */}
                <div className="flex flex-col items-center text-center w-36">
                  <div className="w-24 h-24 rounded-lg bg-surface-container-low p-2 shadow-sm relative mb-2 flex items-center justify-center">
                    <img
                      className="w-full h-full object-cover rounded"
                      alt="Aegis Hard Travel Case"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuABoMePG7clcHXZVCWijwJwf3sVgD3Gy0owe9tJRRLaCiYI37Zi86ptnXuifOi6_2pdrSml-haXNQexAPPPVIovqaFlUmL0gwY6VPawCNtmUmtYm1BaWRirSyirM6YaSEooY-xonvSR9d4JBz1E7gjSagDdkFOOETpSzNNsvcULRgULr3LvLU3LDUFOCghHwS2v-ZTuFj1wUOFaxhRYH5LR9VEzuzIFxFtfFoQN0weOTCDfYsA1AG6QXg"
                    />
                  </div>
                  <span className="font-title-sm text-on-surface text-[12px] line-clamp-2">
                    Aegis Hard Travel Case
                  </span>
                  <span className="font-price-card text-[14px] text-on-surface tabular-nums">
                    ₹999
                  </span>
                </div>

                <span className="material-symbols-outlined text-[24px] text-outline font-bold">
                  add
                </span>

                {/* Item 3: Fast GaN Charger */}
                <div className="flex flex-col items-center text-center w-36">
                  <div className="w-24 h-24 rounded-lg bg-surface-container-low p-2 shadow-sm relative mb-2 flex items-center justify-center">
                    <img
                      className="w-full h-full object-cover rounded"
                      alt="Volta 45W GaN Dual Charger"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBi9VnX6KOGVmPmUW5eenPj4JclS9lNE0gvazKlLapj5a9om3la3xUPX3V73NziobWEprga1IuJwOPyhoJ6RDSNJDpHHEv6SGBoLEwmGcaGSGhQBCvB_oGwQaC8gtAuTCmCj-V-JTpTA2JqvcW5AhU_qlov5KAogHdQry5IWWeWzc8M-UqqR2xxyjF-AjxsLcQFfhYYDqO5O4zWuGIJZIgeBcaRYTQBufpEr5VLUVxG5uQWdXt9WvJoA"
                    />
                  </div>
                  <span className="font-title-sm text-on-surface text-[12px] line-clamp-2">
                    Volta 45W GaN Dual Charger
                  </span>
                  <span className="font-price-card text-[14px] text-on-surface tabular-nums">
                    ₹1,199
                  </span>
                </div>
              </div>

              {/* Bundle Pricing & Action */}
              <div className="flex flex-col items-center lg:items-end text-center lg:text-right bg-surface-container-low p-space-md rounded-xl w-full lg:w-72 shrink-0">
                <span className="font-body-sm text-outline">Bundle Price for all 3:</span>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-price-hero text-[26px] text-on-surface tabular-nums">
                    ₹16,499
                  </span>
                  <span className="font-body-sm text-outline line-through tabular-nums">
                    ₹17,197
                  </span>
                </div>
                <span className="font-label-sm text-secondary font-semibold bg-secondary-fixed px-2 py-0.5 rounded-full mb-space-sm">
                  Extra ₹698 Bundle Savings
                </span>
                <button
                  type="button"
                  onClick={handleAddBundle}
                  className="w-full bg-primary hover:bg-secondary active:scale-[0.985] text-on-primary font-title-sm py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  <span>{bundleBtnText}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comprehensive Tabbed Specifications Section */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm mb-space-xl overflow-hidden">
          {/* Tab Headers Rail */}
          <div className="flex items-center gap-space-xs overflow-x-auto bg-surface-container-low px-space-md pt-space-xs scrollbar-none" id="specs-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`spec-tab px-space-md py-3 font-title-sm relative whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Overview &amp; Features</span>
              {activeTab === 'overview' && (
                <span className="tab-indicator absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('techspecs')}
              className={`spec-tab px-space-md py-3 font-title-sm relative whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'techspecs' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Technical Specifications</span>
              {activeTab === 'techspecs' && (
                <span className="tab-indicator absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('box')}
              className={`spec-tab px-space-md py-3 font-title-sm relative whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'box' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>What's in the Box</span>
              {activeTab === 'box' && (
                <span className="tab-indicator absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`spec-tab px-space-md py-3 font-title-sm relative whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'reviews' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Customer Reviews &amp; Ratings ({isSoundPulseHeadphones ? '4,829' : (displayProduct.reviewCount ? displayProduct.reviewCount.toLocaleString() : '0')})</span>
              {activeTab === 'reviews' && (
                <span className="tab-indicator absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qa')}
              className={`spec-tab px-space-md py-3 font-title-sm relative whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'qa' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Q&amp;A ({isSoundPulseHeadphones ? '840' : '0'})</span>
              {activeTab === 'qa' && (
                <span className="tab-indicator absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="p-space-lg">
            {/* TAB 1: Overview & Features */}
            {activeTab === 'overview' && (
              <div className="tab-panel flex flex-col gap-space-lg">
                {isSoundPulseHeadphones ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg items-center">
                      <div className="flex flex-col gap-space-sm">
                        <span className="font-label-sm uppercase tracking-wider text-primary font-bold">
                          Acoustic Architecture
                        </span>
                        <h3 className="font-headline-sm text-on-surface font-['Space_Grotesk'] font-bold">
                          Precision Master Tuning with Custom 40mm Beryllium Drivers
                        </h3>
                        <p className="font-body-md text-on-surface-variant">
                          Crafted for pristine transparency, the SoundPulse Studio Pro features ultra-stiff
                          Beryllium-coated diaphragm drivers delivering zero harmonic distortion across
                          frequencies from 10Hz to 40,000Hz. Experience punchy sub-bass, transparent mids,
                          and airy highs engineered in partnership with top German audio engineers.
                        </p>
                        <div className="flex items-center gap-space-md mt-space-xs">
                          <div className="flex flex-col">
                            <span className="font-headline-sm text-primary font-bold">0.05%</span>
                            <span className="font-body-sm text-outline">Total Harmonic Distortion</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-headline-sm text-primary font-bold">40kHz</span>
                            <span className="font-body-sm text-outline">Hi-Res Certified Ceiling</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl overflow-hidden shadow-sm bg-surface-container-low h-64 md:h-72 flex items-center justify-center">
                        <img
                          className="w-full h-full object-cover"
                          alt="Technical exploded diagram visualization of 40mm Beryllium headphone driver"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpn9W7cD6LdLmxoiFSeY-DlZ7_eDx8BRLnK1LtLYJE_SwLNEvPwwrOyt9r_-ytDtv4JzDVQIF4fxBDODcbUELkccnmaAkK001GWZtHZEJzhup9DFTR6QpZ0Hm9QI8Lw-gjLtOAsNSI_qh0IfLjICFc-fX1hTQZV7G13eix5zwqdU1_pPWMEPxXaVJ5jKn8yRGlnmu0w03TaDc-kFWAHE1hL9azO1RyhM7ZBuRRlCRfN0dyJAffd_kT1g"
                        />
                      </div>
                    </div>

                    {/* Feature Grid 3 Bento */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-md">
                      <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                        <span className="material-symbols-outlined text-primary text-[28px]">
                          graphic_eq
                        </span>
                        <h4 className="font-title-sm text-on-surface font-semibold">
                          Spatial Audio &amp; Head Tracking
                        </h4>
                        <p className="font-body-sm text-on-surface-variant">
                          Dynamic gyroscope-powered orientation anchors instruments around you, providing a
                          cinema-like soundfield for Dolby Atmos and lossless music.
                        </p>
                      </div>
                      <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                        <span className="material-symbols-outlined text-primary text-[28px]">
                          network_intelligence
                        </span>
                        <h4 className="font-title-sm text-on-surface font-semibold">
                          Multipoint Connectivity
                        </h4>
                        <p className="font-body-sm text-on-surface-variant">
                          Pair simultaneously with your MacBook and smartphone. Seamlessly answer incoming
                          calls without manual bluetooth swapping.
                        </p>
                      </div>
                      <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                        <span className="material-symbols-outlined text-primary text-[28px]">
                          mic_double
                        </span>
                        <h4 className="font-title-sm text-on-surface font-semibold">
                          AI Beamforming Clear Calls
                        </h4>
                        <p className="font-body-sm text-on-surface-variant">
                          6 discrete MEMS microphones isolate your vocal cord frequency while canceling heavy
                          cafe ambiance, wind noise, and traffic.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-space-sm">
                      <span className="font-label-sm uppercase tracking-wider text-primary font-bold">
                        {categoryName} • Official Verified Flagship
                      </span>
                      <h3 className="font-headline-sm text-on-surface font-['Space_Grotesk'] font-bold">
                        {displayProduct.name}
                      </h3>
                      <p className="font-body-md text-on-surface-variant leading-relaxed max-w-4xl">
                        {displayProduct.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-sm">
                      <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                        <span className="material-symbols-outlined text-primary text-[28px]">verified_user</span>
                        <h4 className="font-title-sm text-on-surface font-semibold">Genuine Guarantee</h4>
                        <p className="font-body-sm text-on-surface-variant">
                          100% authentic product sourced directly from verified flagship partner {storeName}.
                        </p>
                      </div>
                      <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                        <span className="material-symbols-outlined text-primary text-[28px]">local_shipping</span>
                        <h4 className="font-title-sm text-on-surface font-semibold">FastX Prime Fulfillment</h4>
                        <p className="font-body-sm text-on-surface-variant">
                          Fast, reliable express shipping with end-to-end tracking and secure handling.
                        </p>
                      </div>
                      <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                        <span className="material-symbols-outlined text-primary text-[28px]">published_with_changes</span>
                        <h4 className="font-title-sm text-on-surface font-semibold">Hassle-Free Returns</h4>
                        <p className="font-body-sm text-on-surface-variant">
                          Protected by OMIZON buyer guarantee with doorstep pickup and instant refund.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: Technical Specifications */}
            {activeTab === 'techspecs' && (
              <div className="tab-panel">
                {displayProduct.specs && Object.keys(displayProduct.specs).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-space-xl gap-y-space-xs font-body-md">
                    {Object.entries(displayProduct.specs).map(([key, val]) => (
                      <div key={key} className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                        <span className="text-on-surface-variant font-medium">{key}</span>
                        <span className="font-semibold text-on-surface text-right">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                ) : isSoundPulseHeadphones ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-space-xl gap-y-space-xs font-body-md">
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Driver Size &amp; Type</span>
                      <span className="font-semibold text-on-surface">40mm Custom Beryllium Dynamic</span>
                    </div>
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Frequency Response</span>
                      <span className="font-semibold text-on-surface">10 Hz – 40,000 Hz</span>
                    </div>
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Bluetooth Standard</span>
                      <span className="font-semibold text-on-surface">v5.3 with LE Audio Support</span>
                    </div>
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Supported Codecs</span>
                      <span className="font-semibold text-on-surface">LDAC, aptX Adaptive, AAC, SBC</span>
                    </div>
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Noise Cancellation Depth</span>
                      <span className="font-semibold text-on-surface">Up to 45dB Hybrid ANC</span>
                    </div>
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Battery Playtime (ANC ON)</span>
                      <span className="font-semibold text-on-surface">45 Hours (Continuous)</span>
                    </div>
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Battery Playtime (ANC OFF)</span>
                      <span className="font-semibold text-on-surface">60 Hours</span>
                    </div>
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Weight</span>
                      <span className="font-semibold text-on-surface">248 grams (Ultra-lightweight)</span>
                    </div>
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Charging Connector</span>
                      <span className="font-semibold text-on-surface">USB Type-C (5V / 2A)</span>
                    </div>
                    <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                      <span className="text-on-surface-variant">Water &amp; Sweat Resistance</span>
                      <span className="font-semibold text-on-surface">IPX4 Splashproof Rating</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-space-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-space-xl gap-y-space-xs font-body-md">
                      <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                        <span className="text-on-surface-variant">Product Title</span>
                        <span className="font-semibold text-on-surface text-right">{displayProduct.name}</span>
                      </div>
                      <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                        <span className="text-on-surface-variant">Category / Department</span>
                        <span className="font-semibold text-on-surface text-right">{categoryName}</span>
                      </div>
                      <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                        <span className="text-on-surface-variant">Brand / Seller</span>
                        <span className="font-semibold text-on-surface text-right">{storeName}</span>
                      </div>
                      <div className="flex justify-between py-3 bg-surface-container-low/50 px-3 rounded-lg mb-1">
                        <span className="text-on-surface-variant">Stock Availability</span>
                        <span className="font-semibold text-on-surface text-right">In Stock ({displayProduct.stock || 10} units)</span>
                      </div>
                    </div>
                    <div className="p-space-md bg-surface-container-low/40 rounded-xl text-body-md text-on-surface-variant">
                      <p className="font-semibold text-on-surface mb-1">Product Description</p>
                      <p>{displayProduct.description || 'Verified OMIZON catalog item with standard warranty coverage.'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: What's in the Box */}
            {activeTab === 'box' && (
              <div className="tab-panel">
                {isSoundPulseHeadphones ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
                    <div className="flex flex-col items-center text-center p-space-md bg-surface-container-low rounded-xl">
                      <span className="material-symbols-outlined text-[40px] text-primary mb-2">
                        headphones
                      </span>
                      <span className="font-title-sm text-on-surface font-semibold">SoundPulse Studio Pro</span>
                      <span className="font-body-sm text-outline">Main unit in Midnight Violet</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-space-md bg-surface-container-low rounded-xl">
                      <span className="material-symbols-outlined text-[40px] text-primary mb-2">cases</span>
                      <span className="font-title-sm text-on-surface font-semibold">Ballistic Nylon Case</span>
                      <span className="font-body-sm text-outline">With internal cable organizer</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-space-md bg-surface-container-low rounded-xl">
                      <span className="material-symbols-outlined text-[40px] text-primary mb-2">cable</span>
                      <span className="font-title-sm text-on-surface font-semibold">Braided Audio Cables</span>
                      <span className="font-body-sm text-outline">3.5mm Aux + USB-C Quick Charge</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-space-md bg-surface-container-low rounded-xl">
                      <span className="material-symbols-outlined text-[40px] text-primary mb-2">flight</span>
                      <span className="font-title-sm text-on-surface font-semibold">Airplane Adapter &amp; Manual</span>
                      <span className="font-body-sm text-outline">2-Prong Flight Plug + Warranty</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
                    <div className="flex flex-col items-center text-center p-space-md bg-surface-container-low rounded-xl">
                      <span className="material-symbols-outlined text-[40px] text-primary mb-2">inventory_2</span>
                      <span className="font-title-sm text-on-surface font-semibold">Primary Unit</span>
                      <span className="font-body-sm text-outline">1x {displayProduct.name}</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-space-md bg-surface-container-low rounded-xl">
                      <span className="material-symbols-outlined text-[40px] text-primary mb-2">package_2</span>
                      <span className="font-title-sm text-on-surface font-semibold">Original Packaging</span>
                      <span className="font-body-sm text-outline">Factory-sealed protective retail box</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-space-md bg-surface-container-low rounded-xl">
                      <span className="material-symbols-outlined text-[40px] text-primary mb-2">description</span>
                      <span className="font-title-sm text-on-surface font-semibold">User Manual</span>
                      <span className="font-body-sm text-outline">Quick start guide &amp; warranty card</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-space-md bg-surface-container-low rounded-xl">
                      <span className="material-symbols-outlined text-[40px] text-primary mb-2">verified</span>
                      <span className="font-title-sm text-on-surface font-semibold">OMIZON Guarantee</span>
                      <span className="font-body-sm text-outline">Certificate of authenticity</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Customer Reviews & Ratings */}
            {activeTab === 'reviews' && (
              <div className="tab-panel">
                {isSoundPulseHeadphones ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
                    {/* Review Summary Breakdown */}
                    <div className="lg:col-span-4 flex flex-col gap-space-md">
                      <div className="flex items-center gap-space-md">
                        <div className="flex flex-col">
                          <span className="font-display-hero text-on-surface leading-none font-bold">
                            4.8
                          </span>
                          <div className="flex text-amber-500 my-1">
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star_half
                            </span>
                          </div>
                          <span className="font-body-sm text-outline">4,829 Global Customer Ratings</span>
                        </div>
                      </div>

                      {/* Bar distributions */}
                      <div className="flex flex-col gap-2">
                        {[
                          { star: '5 Star', pct: '78%' },
                          { star: '4 Star', pct: '15%' },
                          { star: '3 Star', pct: '4%' },
                          { star: '2 Star', pct: '2%' },
                          { star: '1 Star', pct: '1%' },
                        ].map((bar) => (
                          <div key={bar.star} className="flex items-center gap-2 text-body-sm">
                            <span className="w-12 text-on-surface font-medium">{bar.star}</span>
                            <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: bar.pct }} />
                            </div>
                            <span className="w-10 text-right text-outline">{bar.pct}</span>
                          </div>
                        ))}
                      </div>

                      {/* Customer Photos Reel */}
                      <div className="mt-space-sm">
                        <span className="font-title-sm text-on-surface block mb-2 font-semibold">
                          Customer Photos (342)
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="aspect-square rounded-lg bg-surface-container-low overflow-hidden">
                            <img
                              className="w-full h-full object-cover"
                              alt="Customer unboxing photo"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVlsUqJYoXAM7DDEHdlmV8GqFinfkdswXagBzFLPP2b4OsFsn1rtFDfMQEkzAkgBmr0cZzTqxzGkMHhV3iLVU_7762BmuKNCUIS0Gw1KgC2DEonEFq2hv7YrEcPAMwwNbaAJsUsiY-7NHEa3X9hJvdi9VrOCClU577_ZeTiNW5rkdWsx5zoZrfp60N0reobzL0V_rPYaX6FZACWfdhjNqIp9MLX0yYnmp_bVNu2Fg-0zgoQNLpJ0rdJg"
                            />
                          </div>
                          <div className="aspect-square rounded-lg bg-surface-container-low overflow-hidden">
                            <img
                              className="w-full h-full object-cover"
                              alt="User desk setup with headphones"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAva9_smw0Qrs_bSgmugXtIWoi8WMNM6E7-Jf-ldxrqIbJ1DyJU4eTeMHzg-noX96aQQhIavy9ukVMbqOfeKJN307ZoChQHluvz0tCdfD3Rtvm9iwsqfhMw1SA6kr8YKBqVQHqQiGiFkthYjh2V2zutgfsdy3aif97e6scsrHihiakth9mZ00T-fHVvy6sRmII3lxOP5JdWRpCNhYn35UbKf4N1d4ONTbrHW4D2pV1CrUJUcB1b2pEMag"
                            />
                          </div>
                          <div className="aspect-square rounded-lg bg-surface-container-low overflow-hidden">
                            <img
                              className="w-full h-full object-cover"
                              alt="Studio headphones connected to laptop DAW"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDo4NuMi1tfxKX0R625t9vs4Jj8_IlV57uu0BDcWUZA_-T5NiGaCVTNb6TionZLdcUuBj6cynxXjc6htPxaJxBpavG9KJgOpm5KVEfCi7vN14szHmcFhiuQv1lMFqM_h0KfVLjLRUZ2eoW5M1hOb7KBPtWTH08yqYhmo_GU06LH5ndauVDwGvjhyJjbQ8hWVBJPAE9MAHWvt9vO1oKF6P5_LIXz6B9uOjwe5u1lvtDTAF9GGVL0d0OFjQ"
                            />
                          </div>
                          <div className="aspect-square rounded-lg bg-surface-container-high flex items-center justify-center font-label-md text-primary font-bold cursor-pointer hover:bg-surface-container-highest">
                            +339
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verified Reviews List */}
                    <div className="lg:col-span-8 flex flex-col gap-space-md">
                      {/* Review Item 1 */}
                      <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-sm">
                              AK
                            </div>
                            <div className="flex flex-col">
                              <span className="font-title-sm text-on-surface font-semibold">Arun K.</span>
                              <span className="font-body-sm text-emerald-700 flex items-center gap-1 text-[11px]">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>{' '}
                                Verified Buyer • Mumbai
                              </span>
                            </div>
                          </div>
                          <span className="font-body-sm text-outline text-[12px]">2 days ago</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
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
                          <span className="font-title-sm text-on-surface text-[14px] ml-1 font-bold">
                            ANC punches way above its price point
                          </span>
                        </div>
                        <p className="font-body-md text-on-surface-variant">
                          I commute daily on Mumbai local trains. The 45dB active noise canceling completely
                          eliminates the heavy railway engine roar. The memory foam is extremely breathable,
                          zero ear-fatigue after a full 4-hour editing session.
                        </p>
                        <div className="flex items-center gap-4 text-outline font-body-sm text-[12px] pt-1">
                          <span>Color: Midnight Violet</span>
                          <span>•</span>
                          <span>142 people found this helpful</span>
                        </div>
                      </div>

                      {/* Review Item 2 */}
                      <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm">
                              RM
                            </div>
                            <div className="flex flex-col">
                              <span className="font-title-sm text-on-surface font-semibold">Rhea Menon</span>
                              <span className="font-body-sm text-emerald-700 flex items-center gap-1 text-[11px]">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>{' '}
                                Verified Buyer • Bengaluru
                              </span>
                            </div>
                          </div>
                          <span className="font-body-sm text-outline text-[12px]">1 week ago</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
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
                          <span className="font-title-sm text-on-surface text-[14px] ml-1 font-bold">
                            Sublime instrument separation
                          </span>
                        </div>
                        <p className="font-body-md text-on-surface-variant">
                          Listening to lossless jazz with LDAC codec enabled via Android gave me
                          goosebumps. The Midnight Violet tone has a very subtle anodized sheen that looks
                          ultra-luxury in person. Battery hasn't dropped past 50% after a week.
                        </p>
                        <div className="flex items-center gap-4 text-outline font-body-sm text-[12px] pt-1">
                          <span>Color: Midnight Violet</span>
                          <span>•</span>
                          <span>89 people found this helpful</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-space-md bg-surface-container-low/50 rounded-xl">
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[32px]">rate_review</span>
                    </div>
                    <h4 className="font-title-lg font-bold text-on-surface mb-1">No Customer Reviews Yet</h4>
                    <p className="font-body-md text-on-surface-variant max-w-md mb-4">
                      Be the first customer to share your thoughts and review the {displayProduct.name}.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full text-label-md font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span>Catalog Score: {displayProduct.rating ? Number(displayProduct.rating).toFixed(1) : '4.8'} / 5.0</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Q&A */}
            {activeTab === 'qa' && (
              <div className="tab-panel flex flex-col gap-space-md">
                {isSoundPulseHeadphones ? (
                  <>
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-outline text-[20px]">search</span>
                      <input
                        className="bg-transparent border-0 outline-none font-body-md text-on-surface placeholder:text-outline w-full"
                        placeholder="Have a question? Search answers, specs, topics..."
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-space-md">
                      <div className="flex flex-col gap-1">
                        <span className="font-title-sm text-on-surface flex items-start gap-2">
                          <span className="font-bold text-primary">Q:</span> Does it support simultaneous
                          connection to both an iPhone and a Windows PC?
                        </span>
                        <p className="font-body-md text-on-surface-variant pl-6">
                          <strong className="text-on-surface">A:</strong> Yes! The SoundPulse Studio Pro
                          supports Bluetooth 5.3 Multipoint. It can remain paired with two devices at the
                          same time and intelligently pauses audio on your laptop when a call comes in on
                          your smartphone.
                          <span className="block text-body-sm text-outline mt-1">
                            — SoundPulse Official Seller, 3 weeks ago
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-title-sm text-on-surface flex items-start gap-2">
                          <span className="font-bold text-primary">Q:</span> Can I use active noise
                          cancellation while using the 3.5mm wired audio cable?
                        </span>
                        <p className="font-body-md text-on-surface-variant pl-6">
                          <strong className="text-on-surface">A:</strong> Yes, as long as the internal
                          battery has power, you can toggle ANC and Spatial Audio on even in wired AUX mode
                          for latency-free gaming and monitoring.
                          <span className="block text-body-sm text-outline mt-1">
                            — Verified Buyer Support, 1 month ago
                          </span>
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-space-md bg-surface-container-low/50 rounded-xl">
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[32px]">help_outline</span>
                    </div>
                    <h4 className="font-title-lg font-bold text-on-surface mb-1">Have a question about this product?</h4>
                    <p className="font-body-md text-on-surface-variant max-w-md mb-4">
                      No questions have been asked yet for {displayProduct.name}. Verified sellers and customer support will respond here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* "Customers Also Viewed" Recommendations Carousel */}
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm uppercase tracking-wider text-primary font-bold">
                RECOMMENDED FOR YOU
              </span>
              <h2 className="font-headline-sm text-on-surface font-bold tracking-tight font-['Space_Grotesk']">
                Customers Also Viewed
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Next"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
            {/* Rec Card 1 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="aspect-square bg-surface-container-low rounded-lg mb-space-xs overflow-hidden relative flex items-center justify-center">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  alt="Bose SoundLink Pro"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-D60utsDbDpBsw8sZMhJPQQtiNtTYy21Xp2TBQQpznlSM25qqIi1n_pN_AfQQJARfquOpkHWvgk2lzJ2CvLGxvd6PY22HqivilixI2JihCCeeG1SR_P_mN-37Q1MzEE8dDxKgABQtoZoJFmge0S5ksKICLTEz7w_Zglzy_F_VbBLaKgN9XuHhRTgnxfpnbHRbI_usRjsSo8suYrOJWxuUgROMia-ypCJ9ZSQtxeGhP7Np9vx0vzWgKA"
                />
                <span className="absolute top-2 left-2 bg-surface-container-highest text-on-surface text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Top Seller
                </span>
              </div>
              <span className="font-body-sm text-outline text-[12px]">Bose SoundLink Pro</span>
              <h4 className="font-title-sm text-on-surface text-[13px] line-clamp-2 mb-1 font-semibold group-hover:text-primary transition-colors">
                QuietComfort Ultra Wireless Noise Cancelling
              </h4>
              <div className="flex items-center gap-1 text-amber-500 text-[12px] mb-2">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="font-semibold text-on-surface">4.7</span>
                <span className="text-outline">(3.1k)</span>
              </div>
              <div className="mt-auto flex items-baseline justify-between">
                <span className="font-price-card text-[16px] text-on-surface tabular-nums">
                  ₹24,900
                </span>
                <button
                  type="button"
                  onClick={() =>
                    addItem(
                      {
                        _id: 'rec_bose_01',
                        name: 'Bose SoundLink Pro QuietComfort Ultra',
                        description: 'QuietComfort Ultra Wireless Noise Cancelling',
                        price: 24900,
                        stock: 20,
                        category: 'Audio',
                        image:
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuC-D60utsDbDpBsw8sZMhJPQQtiNtTYy21Xp2TBQQpznlSM25qqIi1n_pN_AfQQJARfquOpkHWvgk2lzJ2CvLGxvd6PY22HqivilixI2JihCCeeG1SR_P_mN-37Q1MzEE8dDxKgABQtoZoJFmge0S5ksKICLTEz7w_Zglzy_F_VbBLaKgN9XuHhRTgnxfpnbHRbI_usRjsSo8suYrOJWxuUgROMia-ypCJ9ZSQtxeGhP7Np9vx0vzWgKA',
                      },
                      1
                    )
                  }
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-primary hover:text-on-primary text-primary flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Add to Cart"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Rec Card 2 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="aspect-square bg-surface-container-low rounded-lg mb-space-xs overflow-hidden relative flex items-center justify-center">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  alt="Sony WH-1000XM5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdKBKpKxhYl_TU2hqUYyTFNAwOOMAaccuebxJkkbd-h6nIF57NeHHaTzdJdgzpl8vnkCX52XTZ7LCbMuB6AuUqrReboWrkIebNcFnwWB_J2eWpCGNSGzvk7P6lbyoSLXpeieVCz-8MTLiZspyhmgbXDOwh8_hmwxvqsvLJ3yRuADw84DHpLLz0KKAQL_lsrMv_q6WBTXtp623H4TgZzfMTE6vYxrV49iKq0KH34_PwK3ohPkPQRBWUtg"
                />
                <span className="absolute top-2 left-2 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded-full">
                  22% OFF
                </span>
              </div>
              <span className="font-body-sm text-outline text-[12px]">Sony</span>
              <h4 className="font-title-sm text-on-surface text-[13px] line-clamp-2 mb-1 font-semibold group-hover:text-primary transition-colors">
                WH-1000XM5 Wireless Industry Leading ANC
              </h4>
              <div className="flex items-center gap-1 text-amber-500 text-[12px] mb-2">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="font-semibold text-on-surface">4.9</span>
                <span className="text-outline">(12.8k)</span>
              </div>
              <div className="mt-auto flex items-baseline justify-between">
                <span className="font-price-card text-[16px] text-on-surface tabular-nums">
                  ₹26,990
                </span>
                <button
                  type="button"
                  onClick={() =>
                    addItem(
                      {
                        _id: 'rec_sony_02',
                        name: 'Sony WH-1000XM5 Wireless ANC',
                        description: 'WH-1000XM5 Wireless Industry Leading ANC',
                        price: 26990,
                        stock: 15,
                        category: 'Audio',
                        image:
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuAdKBKpKxhYl_TU2hqUYyTFNAwOOMAaccuebxJkkbd-h6nIF57NeHHaTzdJdgzpl8vnkCX52XTZ7LCbMuB6AuUqrReboWrkIebNcFnwWB_J2eWpCGNSGzvk7P6lbyoSLXpeieVCz-8MTLiZspyhmgbXDOwh8_hmwxvqsvLJ3yRuADw84DHpLLz0KKAQL_lsrMv_q6WBTXtp623H4TgZzfMTE6vYxrV49iKq0KH34_PwK3ohPkPQRBWUtg',
                      },
                      1
                    )
                  }
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-primary hover:text-on-primary text-primary flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Add to Cart"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Rec Card 3 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="aspect-square bg-surface-container-low rounded-lg mb-space-xs overflow-hidden relative flex items-center justify-center">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  alt="Sennheiser Momentum 4"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD92viOk12UP5xLvEoFNz5kqN-Xg27kcwzoBt3pJG-oc6k6NNllqK_J3RGotlecXf70xVodUheBCO9vJlpgvFwP5fIng6bLFeItuv-TLz9Hbf052d1sRoUycLuCB1nww9ufhb5s2I0m0LmaCgRlToVFEHRJlNz4mLc83mSU5mRWIr1UcAqWpO4ZWUcUs34cawnNuELH_hXFB_4MQaQfZVzoPD7DbPFWwZYQSgMjNaYYDbty6MlagqM1EA"
                />
                <span className="absolute top-2 left-2 bg-surface-container-highest text-on-surface text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Audiophile Choice
                </span>
              </div>
              <span className="font-body-sm text-outline text-[12px]">Sennheiser</span>
              <h4 className="font-title-sm text-on-surface text-[13px] line-clamp-2 mb-1 font-semibold group-hover:text-primary transition-colors">
                Momentum 4 Wireless Audiophile Over-Ear
              </h4>
              <div className="flex items-center gap-1 text-amber-500 text-[12px] mb-2">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="font-semibold text-on-surface">4.6</span>
                <span className="text-outline">(2.4k)</span>
              </div>
              <div className="mt-auto flex items-baseline justify-between">
                <span className="font-price-card text-[16px] text-on-surface tabular-nums">
                  ₹18,990
                </span>
                <button
                  type="button"
                  onClick={() =>
                    addItem(
                      {
                        _id: 'rec_sennheiser_03',
                        name: 'Sennheiser Momentum 4 Wireless',
                        description: 'Momentum 4 Wireless Audiophile Over-Ear',
                        price: 18990,
                        stock: 12,
                        category: 'Audio',
                        image:
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuD92viOk12UP5xLvEoFNz5kqN-Xg27kcwzoBt3pJG-oc6k6NNllqK_J3RGotlecXf70xVodUheBCO9vJlpgvFwP5fIng6bLFeItuv-TLz9Hbf052d1sRoUycLuCB1nww9ufhb5s2I0m0LmaCgRlToVFEHRJlNz4mLc83mSU5mRWIr1UcAqWpO4ZWUcUs34cawnNuELH_hXFB_4MQaQfZVzoPD7DbPFWwZYQSgMjNaYYDbty6MlagqM1EA',
                      },
                      1
                    )
                  }
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-primary hover:text-on-primary text-primary flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Add to Cart"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Rec Card 4 */}
            <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="aspect-square bg-surface-container-low rounded-lg mb-space-xs overflow-hidden relative flex items-center justify-center">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  alt="SoundPulse AeroWave"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnrEbDXGIk8yDSTIlxAR5XVcraQ32ARXns70nKKEe-6ts9QPMnKAgeEiJG9bXeTrDlBGItrLTPPYZY7rgM8KdmgpTRBzZIISawXvUq-pSPUNcT79XwPKrAAepvgLTK-UTdBgcegZl5zu4cZceYJgpjXzdLzDlMhPzdhkuFHlDoaeGnSDVdmvlL7_V6EQ-So9Np8okgdV3fMUF-MZxOTFGg2F34GDD7EXsz2e_aQDPzINQ6cDOePog1oA"
                />
                <span className="absolute top-2 left-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  New Launch
                </span>
              </div>
              <span className="font-body-sm text-outline text-[12px]">SoundPulse</span>
              <h4 className="font-title-sm text-on-surface text-[13px] line-clamp-2 mb-1 font-semibold group-hover:text-primary transition-colors">
                AeroWave Wireless Open-Fit Ergonomic
              </h4>
              <div className="flex items-center gap-1 text-amber-500 text-[12px] mb-2">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="font-semibold text-on-surface">4.8</span>
                <span className="text-outline">(520)</span>
              </div>
              <div className="mt-auto flex items-baseline justify-between">
                <span className="font-price-card text-[16px] text-on-surface tabular-nums">
                  ₹9,999
                </span>
                <button
                  type="button"
                  onClick={() =>
                    addItem(
                      {
                        _id: 'rec_aerowave_04',
                        name: 'SoundPulse AeroWave Wireless Open-Fit',
                        description: 'AeroWave Wireless Open-Fit Ergonomic',
                        price: 9999,
                        stock: 35,
                        category: 'Audio',
                        image:
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuAnrEbDXGIk8yDSTIlxAR5XVcraQ32ARXns70nKKEe-6ts9QPMnKAgeEiJG9bXeTrDlBGItrLTPPYZY7rgM8KdmgpTRBzZIISawXvUq-pSPUNcT79XwPKrAAepvgLTK-UTdBgcegZl5zu4cZceYJgpjXzdLzDlMhPzdhkuFHlDoaeGnSDVdmvlL7_V6EQ-So9Np8okgdV3fMUF-MZxOTFGg2F34GDD7EXsz2e_aQDPzINQ6cDOePog1oA',
                      },
                      1
                    )
                  }
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-primary hover:text-on-primary text-primary flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Add to Cart"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

