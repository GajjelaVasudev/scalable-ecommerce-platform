import { Product, Category } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { _id: 'b4fa1458bcff238edf645aa5', name: 'Electronics', slug: 'electronics', productCount: 420 },
  { _id: '04990ca7ad918fbef87cdc10', name: 'Home & Living', slug: 'home-living', productCount: 312 },
  { _id: '6c3d5ebfc25b3d534f6f1198', name: 'Grocery & Essentials', slug: 'grocery', productCount: 185 },
  { _id: 'c1c4cda4b32fa5e508b93489', name: 'Beauty & Personal Care', slug: 'beauty', productCount: 248 },
  { _id: '5aa2ad5f3aa231db0a7a972f', name: 'Fashion & Apparel', slug: 'fashion', productCount: 512 },
  { _id: 'b1712378c92ec1b9356f7d1a', name: 'Sports & Outdoors', slug: 'sports', productCount: 96 },
  { _id: '53546fab5b1412764d4b9cd6', name: 'Books & Stationery', slug: 'books', productCount: 140 },
  { _id: '736fc9491e1126401427b328', name: 'Accessories', slug: 'accessories', productCount: 88 },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    _id: '2545922d18419b69f8ab9ee3',
    name: 'SoundPulse Studio Pro Wireless ANC Headphones',
    description:
      'Engineered with 40mm custom beryllium drivers and advanced hybrid 45dB Active Noise Cancellation. Delivers immersive spatial audio, 60-hour extended battery reserve, ultra-soft memory foam earcups, and dual low-latency multipoint Bluetooth 5.4 connectivity.',
    price: 24999,
    originalPrice: 29999,
    stock: 18,
    category: INITIAL_CATEGORIES[0],
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPXhK-ejxViMnA_YYKuRyQbqmrgM7qq8kXbo1FLDz1prk6nkcNv2BvcPk52hVmW0TreETVslB4WaiOJCKyNqKKMKZTOdWGxk6U_MOd1VAtSes3vTU3gGNc3wGLWe577mP5AX5JAaOVysmbfmcmdXsU3ToAJSLLQ2V1KJMd-AUfqWKjnXXhT71flYHKtHM3AS_XO0w_SfoDfmFd5xlYNlo0CqSLr73zFV_rpe2jKFDMaJvBb3v4F-vlPQ',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPXhK-ejxViMnA_YYKuRyQbqmrgM7qq8kXbo1FLDz1prk6nkcNv2BvcPk52hVmW0TreETVslB4WaiOJCKyNqKKMKZTOdWGxk6U_MOd1VAtSes3vTU3gGNc3wGLWe577mP5AX5JAaOVysmbfmcmdXsU3ToAJSLLQ2V1KJMd-AUfqWKjnXXhT71flYHKtHM3AS_XO0w_SfoDfmFd5xlYNlo0CqSLr73zFV_rpe2jKFDMaJvBb3v4F-vlPQ',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBsi3Q56BuqkVxQ4CPdkPVgHzdzjibGO3d1og60yJr2I6RP1NuKGqZsB3mrp54JFpHDxuNIqfme27MivqqR5FGO90HFLDsIq6A4E9jRhTcQhfdHBQehGwXmpZhkCCLeA0z-l6QDRiJAhyKuNZST8TqBAsRZDd11B7gLNEzb4EzDwyNbKII1jF1d83DK0NyKnMyWz8tV0wiGGUxxbNuCPxeLm40L6kxT6Sa3lO51VBwBoDiD9VlVZWugJw',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6qzP3zWmIFqS250onY-MHcEaqc-OSfW_7uEjx7CRgZ-Y2yHSKHihUb6g_angcT4gJKx8RYEQ6I_gMMkZlr24cdc_mD4kSk4Luya0lRWqPIpQT2uzDn03fxbI_YGbZTx5ceT3DOuijAhoPNON7htXrfAG40x52nDk9zQPabi-Jo6HQcR3f2nA9siQ3cArmB4vuivCxKfYSQGQknhlZP2DlaoATfC4bVt94Q08XjBpRooE_-f6rNXb7AQ',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCzNNe_tX-D5oF-9TPxxV0WmAAEBIc2oAsBk7To1JHkJjn_fdyWiAWDJqakkt747Abna_lCYJ_BPvByMIS76SAYLTuK9zno2zb8xRIy4eMghtmP0f_5koXQdeIfAb97C6ZUjv9IMQDq9g-Ia3jh3t5T6y3S6cJU_EAeQpIcCRpNCBUfBPJi7NzXc6VLY3ce1cXRYWxr7KPw0NIPCpwvKC-8Mh9D3YYy9s6rEeXjCuSaMikAHWWItkOSbw',
    ],
    seller: { _id: 'seller_01', username: 'OmniAudio Direct' },
    status: 'active',
    rating: 4.9,
    reviewCount: 384,
    badge: 'OMIZON Choice',
    specs: {
      Drivers: '40mm Custom Beryllium Diaphragms',
      NoiseCancellation: 'Hybrid 45dB Adaptive ANC',
      BatteryLife: '60 Hours (45h with ANC enabled)',
      FastCharge: '10 min charge = 5 hours playback',
      Connectivity: 'Bluetooth 5.4 + USB-C Lossless Audio',
      Weight: '264 grams',
    },
  },
  {
    _id: 'eb00eef4b99985cbc0933691',
    name: 'ApexBook M3 Ultra 16" Pro Workstation',
    description:
      'Liquid Retina XDR display with ProMotion 120Hz refresh, Next-Gen 16-Core CPU, 40-Core GPU, 36GB unified memory, and 1TB ultra-fast PCIe Gen 4 SSD. Designed for creative developers and machine learning researchers.',
    price: 189990,
    originalPrice: 210000,
    stock: 2,
    category: INITIAL_CATEGORIES[0],
    image:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    seller: { _id: 'seller_02', username: 'Apex Hardware Store' },
    status: 'active',
    rating: 4.9,
    reviewCount: 156,
    badge: 'Flagship',
    specs: {
      Processor: 'M3 Max 16-core CPU',
      Memory: '36GB Unified Memory',
      Storage: '1TB NVMe Solid State Drive',
      Display: '16.2-inch Liquid Retina XDR (3456 x 2234)',
      Battery: 'Up to 22 hours video playback',
    },
  },
  {
    _id: '3807fe2700f4ceacb83c28de',
    name: 'Artisan Handcrafted Stoneware Dining Set (16-Piece)',
    description:
      'Individually hand-thrown artisanal stoneware with organic reactive matte violet-charcoal glaze. Dishwasher and microwave safe. Includes 4 dinner plates, 4 salad plates, 4 pasta bowls, and 4 mugs.',
    price: 4899,
    originalPrice: 6499,
    stock: 45,
    category: INITIAL_CATEGORIES[1],
    image:
      'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&q=80',
    seller: { _id: 'seller_03', username: 'Kala Artisan Living' },
    status: 'active',
    rating: 4.8,
    reviewCount: 92,
    badge: 'Artisan Crafted',
    specs: {
      Material: 'High-fire natural earthenware clay',
      Pieces: '16 pieces (serves 4 people)',
      Finish: 'Matte reactive mineral glaze',
      Care: 'Microwave and dishwasher certified safe',
    },
  },
  {
    _id: 'e76a094353f7362b563e05e1',
    name: 'Cold-Pressed Extra Virgin Estate Olive Oil (500ml)',
    description:
      'First cold extraction from single-estate Koroneiki olives harvested by hand. Rich in polyphenols and antioxidants with an herbaceous peppery finish.',
    price: 1299,
    originalPrice: 1650,
    stock: 120,
    category: INITIAL_CATEGORIES[2],
    image:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80',
    seller: { _id: 'seller_04', username: 'Pantry Botanica' },
    status: 'active',
    rating: 4.9,
    reviewCount: 210,
    badge: 'Organic',
    specs: {
      Volume: '500 ml glass UV-protective bottle',
      Acidity: 'Less than 0.2%',
      Certification: 'FSSAI Certified Organic',
    },
  },
  {
    _id: '35696643bb8fa566e4081c59',
    name: 'Luxe Peptide Regenerating Night Crème (50g)',
    description:
      'Multi-peptide matrix infused with botanical squalane and bioactive hyaluronic acid. Stimulates cellular rejuvenation, reinforces lipid barriers, and reduces fine lines.',
    price: 3450,
    originalPrice: 4200,
    stock: 64,
    category: INITIAL_CATEGORIES[3],
    image:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
    seller: { _id: 'seller_05', username: 'Veda Cosmeceuticals' },
    status: 'active',
    rating: 4.7,
    reviewCount: 144,
    badge: 'Clean Formula',
    specs: {
      Formula: 'Dermatologist tested, fragrance-free',
      Volume: '50 grams recyclable frosted glass jar',
      Usage: 'Nightly application for all skin types',
    },
  },
  {
    _id: '5be199dbc2ce8fe65ecea9b8',
    name: 'Merino Wool Minimalist Travel Overshirt',
    description:
      'Crafted from 100% superfine 18.5-micron Australian merino wool. Naturally moisture-wicking, odor-resistant, and thermoregulating. Features concealed horn buttons and dual chest pockets.',
    price: 5999,
    originalPrice: 7999,
    stock: 28,
    category: INITIAL_CATEGORIES[4],
    image:
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80',
    seller: { _id: 'seller_06', username: 'Atelier Minimal' },
    status: 'active',
    rating: 4.6,
    reviewCount: 76,
    badge: 'Sustainable',
    specs: {
      Fabric: '100% Superfine Merino Wool (260 gsm)',
      Fit: 'Relaxed tailored overshirt',
      Care: 'Cold wool wash or dry clean',
    },
  },
  {
    _id: 'eb1140f7d019a3452db11a98',
    name: 'Ergonomic Task Chair with Adaptive Lumbar Mesh',
    description:
      'Award-winning posture engineering with 4D adjustable armrests, dynamic synchro-tilt mechanism, breathable matrix mesh backrest, and class-4 heavy-duty gas cylinder.',
    price: 18499,
    originalPrice: 24000,
    stock: 15,
    category: INITIAL_CATEGORIES[1],
    image:
      'https://images.unsplash.com/photo-1580481077111-9e79b9777264?w=800&q=80',
    seller: { _id: 'seller_07', username: 'ErgoMotion Lab' },
    status: 'active',
    rating: 4.9,
    reviewCount: 88,
    badge: 'Ergonomic',
    specs: {
      Warranty: '5 Years Manufacturer Warranty',
      WeightCapacity: 'Up to 150 kg',
      Mechanism: 'Multifunctional synchro-tilt with 3-position lock',
    },
  },
  {
    _id: 'a72eacdcfbb2a7fbd8def9ee',
    name: 'Titanium Smart Health Ring Gen 3 (Size 10)',
    description:
      'Ultra-lightweight grade 5 aerospace titanium ring. Continuously tracks continuous heart rate, SpO2, sleep staging, body temperature fluctuations, and recovery stress scores.',
    price: 19999,
    originalPrice: 25999,
    stock: 22,
    category: INITIAL_CATEGORIES[0],
    image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
    seller: { _id: 'seller_08', username: 'Aura Biometrics' },
    status: 'active',
    rating: 4.8,
    reviewCount: 167,
    badge: 'Innovation',
    specs: {
      Material: 'Grade 5 Aerospace Titanium with diamond-like carbon coating',
      Battery: 'Up to 7 days on a single 45-minute wireless charge',
      WaterResistance: '100m (10 ATM waterproof for swimming and diving)',
    },
  },
];

export interface StitchCatalogProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  stock: number;
  category: string;
  brand: string;
  brandTag: string;
  badge?: string;
  badgeVariant?: 'primary' | 'error' | 'seller-choice' | 'award-winner';
  fastPrime?: boolean;
  twoDayDelivery?: boolean;
  codEligible?: boolean;
  rating: number;
  reviewCount: number;
  image: string;
  seller: { _id: string; username: string };
  status: 'active';
}

export const STITCH_SHOP_ALL_PRODUCTS: StitchCatalogProduct[] = [
  {
    _id: '33d3cc8494560e1a998a2273',
    name: 'AeroSound Max Studio Wireless Headset with Active Hybrid ANC & 60h Battery',
    description:
      'High-end sleek wireless over-ear noise-cancelling headphones in matte charcoal black and subtle deep purple violet accents, minimalist studio photography.',
    price: 18499,
    originalPrice: 22999,
    stock: 45,
    category: 'Electronics',
    brand: 'AeroSound Precision',
    brandTag: 'Sony',
    badge: 'FastPrime',
    badgeVariant: 'primary',
    fastPrime: true,
    twoDayDelivery: true,
    codEligible: false,
    rating: 4.8,
    reviewCount: 1240,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvkrBkTnBsB9auEAQL28ndybGOmU4NQ7xb8X2J8K9VsETOSG3GgHjREUDV83mebHHpzgW6Rn00ljV3K3ABeMUZXdH4VUz-ijt9DGDOtTIzKxmGgbIH3VSGgKSdQmYr8VFpUpII3wFn30QbEnifgvc8CHOnBUrrIwpfDK8GBnCrmIaIab9Oi75nkerSzQ-MyY2VgJaLNBb-r1g9ls9PmQO9lSYshGFCOyJAAAT3Z_cYLavg9eHiAYOzuw',
    seller: { _id: 'seller_aerosound', username: 'AeroSound Precision' },
    status: 'active',
  },
  {
    _id: '127ce0a9817f5707919b9baa',
    name: 'PureAir Smart HEPA H14 Air Purifier with Real-Time AQI Sensor & App Control',
    description:
      'Modern cylindrical smart home HEPA air purifier in seamless pure white finish with modern violet LED indicator ring.',
    price: 11999,
    originalPrice: 16999,
    stock: 28,
    category: 'Home Living',
    brand: 'PureAir Home',
    brandTag: 'Dyson',
    badge: 'Save 29%',
    badgeVariant: 'error',
    fastPrime: true,
    twoDayDelivery: false,
    codEligible: true,
    rating: 4.7,
    reviewCount: 940,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBNaHbFqqxHeQwxqTuNF_UaWxfz8Z3J0aIA997HdLbmnwqy_wLgU1nAmGBq2-f0t860NwdemyX4Z8jOA86_62BYqtFd1AXZds-R0HSOz7wYoY8LO7lL-uYgWwg6opiukbS6m15IQfmAtY-wtpjiBq3-iwOhk8HfV-EK9oHBM580xfbvtRUdHfGSxs9PWe2ct2TvaZaG9hjhVjN74iuKt4j-ZfChd9f5StEi2eu6AOUQgYmpCWr-06KPDQ',
    seller: { _id: 'seller_pureair', username: 'PureAir Home' },
    status: 'active',
  },
  {
    _id: '1ea7b39cbffc0e1fa70087d0',
    name: 'Artisanal Ceramic Pour-Over Coffee Set with Heat-Resistant Borosilicate Server',
    description:
      'Artisanal hand-crafted textured ceramic pour over dripper coffee carafes set in earthy speckled stone and dark charcoal violet tones.',
    price: 2199,
    originalPrice: 2799,
    stock: 64,
    category: 'Home Living',
    brand: 'Kanso Craft',
    brandTag: 'Kanso Craft',
    badge: 'Seller Choice',
    badgeVariant: 'seller-choice',
    fastPrime: false,
    twoDayDelivery: true,
    codEligible: true,
    rating: 4.9,
    reviewCount: 520,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7tUDWdrBi2EWKylNTtdWt6VPxWR94fzjlBcjEETKfKlBkKpoPuDQTC46BVPkD6eSsn5ot83HzcaqsquYMIx-j1c93CqkdCO5LmJz3KLZEyuP5sitZJpxwAmUTQkEVPsD7pO-unuwoH4zYdapZfpRpSd7nugkmS6xZR8BYYmvdwMeY5pzUgEDullUfB0wCMLG6rlRBsK9JQb0jUP8yxbuFxXBVNHFfgDXtDOGdPxh97gbYLiH3U4CTnQ',
    seller: { _id: 'seller_kanso', username: 'Kanso Craft' },
    status: 'active',
  },
  {
    _id: 'ab7b14f36a322390697b4261',
    name: 'Organic Wildflower Himalayan Raw Honey 500g Glass Pot with Natural Comb',
    description:
      'Luxury glass jar of golden pure raw Himalayan wildflower organic honey with wooden dipper, rich warm amber reflections.',
    price: 599,
    originalPrice: 750,
    stock: 120,
    category: 'Grocery & Essentials',
    brand: 'Nature Organics',
    brandTag: 'Tata Consumer',
    badge: 'FastPrime',
    badgeVariant: 'primary',
    fastPrime: true,
    twoDayDelivery: false,
    codEligible: true,
    rating: 4.8,
    reviewCount: 3890,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3jwBpR4ustMBf36yEN_F1HTWqRvSk1rLqIb-Y1bOGWbU3a8BlPAVaCKadMnLIO2P-NwrNJ0lE8vGd2ALFuj2Tq71aTQTZOQfu_ViW1nRbT4UJhX0bMSoCNm0Ryk5twaWAD3hjim2Bd2yvj80h1cxlNK2Ol_9Hud1hV2ANrUIaC4Ni3iqczTpGHWiiOEiaQRSsCPvLdNAoavWefUqq2phXbhLZXx2WDpHC1qiU0Y15iHzdWBn7CdlJDg',
    seller: { _id: 'seller_nature', username: 'Nature Organics' },
    status: 'active',
  },
  {
    _id: '9b975b594e13d7115488b7f6',
    name: 'UltraLight Merino Wool Wrinkle-Resistant Travel Blazer in Deep Midnight',
    description:
      'Tailored luxury menswear breathable dark navy violet Merino wool travel blazer displayed on minimalist sculpted bust.',
    price: 6899,
    originalPrice: 8999,
    stock: 19,
    category: 'Fashion & Apparel',
    brand: 'Aethel Apparel',
    brandTag: 'Nike',
    badge: undefined,
    fastPrime: false,
    twoDayDelivery: true,
    codEligible: false,
    rating: 4.6,
    reviewCount: 410,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD4BkARQuctLHDWKvbPT5h9s95TrxOWajrcRHlK-LzkpJ73zPi4BIJYg-OwCAPOqHvbZrTSelAMbZXJ3CkVJxmC-k8gpRJK5c5kmcYoy0t-JI93BrQE5rdMs6HyXK4iQquw0b08MGq45FqHflZrItx6brEBROssTe2Sa8vKPLIHh8ReIyCwzAHPTf66DSwfRvmT_19-KNEn2VT8ldbPQdfwIRWSrCX3gMKSeAnyrUDZIsAgE9-SJdYTGA',
    seller: { _id: 'seller_aethel', username: 'Aethel Apparel' },
    status: 'active',
  },
  {
    _id: '9eeae17659684624e4e8cbe2',
    name: 'Peptide Bio-Active Firming Night Cream 50ml with Multi-Molecular Hyaluronic',
    description:
      'High-end skincare luxury frosted cosmetic glass jar with metallic violet lid on polished stone pedestal.',
    price: 2499,
    originalPrice: 3200,
    stock: 50,
    category: 'Beauty & Care',
    brand: 'Aura Botanical',
    brandTag: 'Forest Essentials',
    badge: 'Award Winner',
    badgeVariant: 'award-winner',
    fastPrime: true,
    twoDayDelivery: false,
    codEligible: true,
    rating: 4.9,
    reviewCount: 1120,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBkMGNrcVfhrYsl6fTCrr942ZnM15zlrOcZPNs1XZtbFlxFJRNP8DNluRcksheb1vCdY3LPuaA1yvAdhR-sIMib6ySzn7uccSCtN8gW3-caa81CAZk9IpeyDKbDxeNE4yqW-3qdisg66a2kURJJAIMAnA6lUReWNLpEMYj-tY95dGKQ0CgtEE_NhG7pNWHAx2US_GP8tKFF7azZthetuD_ZUzJyOHrpO3MLysyxjw_NoBHE7ebAknznJA',
    seller: { _id: 'seller_aura', username: 'Aura Botanical' },
    status: 'active',
  },
  {
    _id: 'd60bbaf7a8e51eece4afaf88',
    name: 'Smart Ergo Hydro Stainless Steel Insulated Bottle 1L with LED Temp Touch',
    description:
      'Insulated thermal matte titanium and violet vacuum water bottle 1L with ergonomic smart temperature cap.',
    price: 1299,
    originalPrice: 1699,
    stock: 85,
    category: 'Sports & Outdoors',
    brand: 'HydroErgo Sport',
    brandTag: 'Philips',
    badge: undefined,
    fastPrime: false,
    twoDayDelivery: true,
    codEligible: true,
    rating: 4.7,
    reviewCount: 870,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBVLO52J8uuU2mYNii2UcH5HRX_5dQOcVZWNRshejfMWHJ3_gy14DyEqvBONHRa3smsxLxzXmzRacQZ2_O39r0CYgMjHoosFbq5tylWEZK-D_2cArsaXZ8OmLZhv7S23J-JXBjRvdpGJSwjDYkVPI18RQquMJjATv2OBqpISiRKp57QqaexLm49Bd1LPW3U_82xW2u85k-GrPQrCMvFIAJnsogdsCNGfRJ0RQG82gZfQIxrUn8OC3zkVA',
    seller: { _id: 'seller_hydroergo', username: 'HydroErgo Sport' },
    status: 'active',
  },
  {
    _id: 'cf3444b72e8818b8639be75e',
    name: 'Mechanical 75% Gaming Keyboard with Hot-Swappable Switches & RGB Glow',
    description:
      'Custom mechanical keyboard with premium anodized deep indigo aluminum case, illuminated per-key violet backlighting.',
    price: 4799,
    originalPrice: 6499,
    stock: 32,
    category: 'Electronics',
    brand: 'Vortex Peripherals',
    brandTag: 'Apple',
    badge: 'FastPrime',
    badgeVariant: 'primary',
    fastPrime: true,
    twoDayDelivery: false,
    codEligible: false,
    rating: 4.8,
    reviewCount: 2340,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAikZ4QuItIDXlVhFrkLa1EFlIdottscU-fqPGB2I0U2AseWmDPi_iZf1bghXADQqLSLCWrCdFyeIxZ5pYo-iOlz_bb9H_2VlqKT7V58htf3vywVG4yicIKsKGzD8NTcQeX6pbxA1pzMnkglBC7viYCCbQbiSSAB-H3TLijEULI0mUekOf9n-wn-xEAb1t3FTovB7cPsS2KYlhOWkcZ4DKeyYqnfgVAn-VpBt1BmU0A89Nzph9HLLUdIQ',
    seller: { _id: 'seller_vortex', username: 'Vortex Peripherals' },
    status: 'active',
  },
  {
    _id: '87e4ee3279ce71acaaf991e3',
    name: 'Cold Brew Precision Glass Pitcher 1.5L with Ultra-Fine Micromesh Filter',
    description:
      'Heavy borosilicate cold brew coffee glass pitcher with precision stainless steel fine mesh filter infuser.',
    price: 1899,
    originalPrice: 2399,
    stock: 40,
    category: 'Home Living',
    brand: 'Kanso Craft',
    brandTag: 'Kanso Craft',
    badge: undefined,
    fastPrime: false,
    twoDayDelivery: true,
    codEligible: true,
    rating: 4.6,
    reviewCount: 310,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8clKln-W0ggAnUNaIDulWuUWHjD1AW4Sa3AUhLxBr9o3ILR0fVzy9b7GgWzttcsLNHugv_bzsPwLr4pB6LYL6iSmwahsw9JSwH22ydswnOw8i4FWinVGUs0kMEsTeHrZ60WCLd8uOpSwMUjL54fVDPy08hL9dQz1T3IsGF_EgVpIqT6GchklYVKD0dZHEnf-ToAhjyHua8ySL6XHO8gKj9oq21p4Y1OHLnfLpX97hsKMvqp7OOOO-EQ',
    seller: { _id: 'seller_kanso', username: 'Kanso Craft' },
    status: 'active',
  },
];


