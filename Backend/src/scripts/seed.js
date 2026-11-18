const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const User = require('../models/user.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');

// Generate deterministic 24-character hexadecimal ObjectId
function getDeterministicId(prefix, key) {
    const hash = crypto.createHash('md5').update(`${prefix}:${key.toLowerCase().trim()}`).digest('hex').slice(0, 24);
    return new mongoose.Types.ObjectId(hash);
}

// 8 Official OMIZON Categories matching Stitch Design System
const SEED_CATEGORIES = [
    { name: 'electronics', displayName: 'Electronics' },
    { name: 'home living', displayName: 'Home Living' },
    { name: 'grocery & essentials', displayName: 'Grocery & Essentials' },
    { name: 'beauty & personal care', displayName: 'Beauty & Personal Care' },
    { name: 'fashion & apparel', displayName: 'Fashion & Apparel' },
    { name: 'sports & outdoors', displayName: 'Sports & Outdoors' },
    { name: 'books & stationery', displayName: 'Books & Stationery' },
    { name: 'accessories', displayName: 'Accessories' }
];

// OMIZON Catalog Products (19 High-Fidelity Items)
const SEED_PRODUCTS = [
    // Flagship items (INITIAL_PRODUCTS)
    {
        key: 'soundpulse-studio-pro',
        name: 'SoundPulse Studio Pro Wireless ANC Headphones',
        description: 'Engineered with 40mm custom beryllium drivers and advanced hybrid 45dB Active Noise Cancellation. Delivers immersive spatial audio, 60-hour extended battery reserve, ultra-soft memory foam earcups, and dual low-latency multipoint Bluetooth 5.4 connectivity.',
        price: 24999,
        originalPrice: 29999,
        stock: 18,
        categoryName: 'electronics',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPXhK-ejxViMnA_YYKuRyQbqmrgM7qq8kXbo1FLDz1prk6nkcNv2BvcPk52hVmW0TreETVslB4WaiOJCKyNqKKMKZTOdWGxk6U_MOd1VAtSes3vTU3gGNc3wGLWe577mP5AX5JAaOVysmbfmcmdXsU3ToAJSLLQ2V1KJMd-AUfqWKjnXXhT71flYHKtHM3AS_XO0w_SfoDfmFd5xlYNlo0CqSLr73zFV_rpe2jKFDMaJvBb3v4F-vlPQ',
        images: [
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBPXhK-ejxViMnA_YYKuRyQbqmrgM7qq8kXbo1FLDz1prk6nkcNv2BvcPk52hVmW0TreETVslB4WaiOJCKyNqKKMKZTOdWGxk6U_MOd1VAtSes3vTU3gGNc3wGLWe577mP5AX5JAaOVysmbfmcmdXsU3ToAJSLLQ2V1KJMd-AUfqWKjnXXhT71flYHKtHM3AS_XO0w_SfoDfmFd5xlYNlo0CqSLr73zFV_rpe2jKFDMaJvBb3v4F-vlPQ',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBsi3Q56BuqkVxQ4CPdkPVgHzdzjibGO3d1og60yJr2I6RP1NuKGqZsB3mrp54JFpHDxuNIqfme27MivqqR5FGO90HFLDsIq6A4E9jRhTcQhfdHBQehGwXmpZhkCCLeA0z-l6QDRiJAhyKuNZST8TqBAsRZDd11B7gLNEzb4EzDwyNbKII1jF1d83DK0NyKnMyWz8tV0wiGGUxxbNuCPxeLm40L6kxT6Sa3lO51VBwBoDiD9VlVZWugJw',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuC6qzP3zWmIFqS250onY-MHcEaqc-OSfW_7uEjx7CRgZ-Y2yHSKHihUb6g_angcT4gJKx8RYEQ6I_gMMkZlr24cdc_mD4kSk4Luya0lRWqPIpQT2uzDn03fxbI_YGbZTx5ceT3DOuijAhoPNON7htXrfAG40x52nDk9zQPabi-Jo6HQcR3f2nA9siQ3cArmB4vuivCxKfYSQGQknhlZP2DlaoATfC4bVt94Q08XjBpRooE_-f6rNXb7AQ',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCzNNe_tX-D5oF-9TPxxV0WmAAEBIc2oAsBk7To1JHkJjn_fdyWiAWDJqakkt747Abna_lCYJ_BPvByMIS76SAYLTuK9zno2zb8xRIy4eMghtmP0f_5koXQdeIfAb97C6ZUjv9IMQDq9g-Ia3jh3t5T6y3S6cJU_EAeQpIcCRpNCBUfBPJi7NzXc6VLY3ce1cXRYWxr7KPw0NIPCpwvKC-8Mh9D3YYy9s6rEeXjCuSaMikAHWWItkOSbw'
        ],
        sellerName: 'OmniAudio Direct',
        rating: 4.9,
        reviewCount: 384,
        badge: 'OMIZON Choice',
        badgeVariant: 'primary',
        brand: 'SoundPulse Studio',
        brandTag: 'Sony',
        fastPrime: true,
        twoDayDelivery: true,
        codEligible: false,
        featured: true,
        specs: {
            Drivers: '40mm Custom Beryllium Diaphragms',
            NoiseCancellation: 'Hybrid 45dB Adaptive ANC',
            BatteryLife: '60 Hours (45h with ANC enabled)',
            FastCharge: '10 min charge = 5 hours playback',
            Connectivity: 'Bluetooth 5.4 + USB-C Lossless Audio',
            Weight: '264 grams'
        }
    },
    {
        key: 'apexbook-m3-ultra',
        name: 'ApexBook M3 Ultra 16" Pro Workstation',
        description: 'Liquid Retina XDR display with ProMotion 120Hz refresh, Next-Gen 16-Core CPU, 40-Core GPU, 36GB unified memory, and 1TB ultra-fast PCIe Gen 4 SSD. Designed for creative developers and machine learning researchers.',
        price: 189990,
        originalPrice: 210000,
        stock: 12,
        categoryName: 'electronics',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
        sellerName: 'Apex Hardware Store',
        rating: 4.9,
        reviewCount: 156,
        badge: 'Flagship',
        badgeVariant: 'award-winner',
        brand: 'Apex Tech',
        brandTag: 'Apple',
        fastPrime: true,
        twoDayDelivery: true,
        codEligible: false,
        featured: true,
        specs: {
            Processor: 'M3 Max 16-core CPU',
            Memory: '36GB Unified Memory',
            Storage: '1TB NVMe Solid State Drive',
            Display: '16.2-inch Liquid Retina XDR (3456 x 2234)',
            Battery: 'Up to 22 hours video playback'
        }
    },
    {
        key: 'stoneware-dining-set',
        name: 'Artisan Handcrafted Stoneware Dining Set (16-Piece)',
        description: 'Individually hand-thrown artisanal stoneware with organic reactive matte violet-charcoal glaze. Dishwasher and microwave safe. Includes 4 dinner plates, 4 salad plates, 4 pasta bowls, and 4 mugs.',
        price: 4899,
        originalPrice: 6499,
        stock: 45,
        categoryName: 'home living',
        image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&q=80'],
        sellerName: 'Kala Artisan Living',
        rating: 4.8,
        reviewCount: 92,
        badge: 'Artisan Crafted',
        badgeVariant: 'seller-choice',
        brand: 'Kala Artisan',
        brandTag: 'Kanso Craft',
        fastPrime: false,
        twoDayDelivery: true,
        codEligible: true,
        featured: true,
        specs: {
            Material: 'High-fire natural earthenware clay',
            Pieces: '16 pieces (serves 4 people)',
            Finish: 'Matte reactive mineral glaze',
            Care: 'Microwave and dishwasher certified safe'
        }
    },
    {
        key: 'estate-olive-oil',
        name: 'Cold-Pressed Extra Virgin Estate Olive Oil (500ml)',
        description: 'First cold extraction from single-estate Koroneiki olives harvested by hand. Rich in polyphenols and antioxidants with an herbaceous peppery finish.',
        price: 1299,
        originalPrice: 1650,
        stock: 120,
        categoryName: 'grocery & essentials',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80'],
        sellerName: 'Pantry Botanica',
        rating: 4.9,
        reviewCount: 210,
        badge: 'Organic',
        badgeVariant: 'primary',
        brand: 'Estate Olive Co',
        brandTag: 'Tata Consumer',
        fastPrime: true,
        twoDayDelivery: true,
        codEligible: true,
        featured: true,
        specs: {
            Volume: '500 ml glass UV-protective bottle',
            Acidity: 'Less than 0.2%',
            Certification: 'FSSAI Certified Organic'
        }
    },
    {
        key: 'luxe-peptide-night-creme',
        name: 'Luxe Peptide Regenerating Night Crème (50g)',
        description: 'Multi-peptide matrix infused with botanical squalane and bioactive hyaluronic acid. Stimulates cellular rejuvenation, reinforces lipid barriers, and reduces fine lines.',
        price: 3450,
        originalPrice: 4200,
        stock: 64,
        categoryName: 'beauty & personal care',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80'],
        sellerName: 'Veda Cosmeceuticals',
        rating: 4.7,
        reviewCount: 144,
        badge: 'Clean Formula',
        badgeVariant: 'seller-choice',
        brand: 'Veda Cosmeceuticals',
        brandTag: 'Forest Essentials',
        fastPrime: true,
        twoDayDelivery: true,
        codEligible: true,
        featured: false,
        specs: {
            Formula: 'Dermatologist tested, fragrance-free',
            Volume: '50 grams recyclable frosted glass jar',
            Usage: 'Nightly application for all skin types'
        }
    },
    {
        key: 'merino-wool-overshirt',
        name: 'Merino Wool Minimalist Travel Overshirt',
        description: 'Crafted from 100% superfine 18.5-micron Australian merino wool. Naturally moisture-wicking, odor-resistant, and thermoregulating. Features concealed horn buttons and dual chest pockets.',
        price: 5999,
        originalPrice: 7999,
        stock: 28,
        categoryName: 'fashion & apparel',
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80'],
        sellerName: 'Atelier Minimal',
        rating: 4.6,
        reviewCount: 76,
        badge: 'Sustainable',
        badgeVariant: 'primary',
        brand: 'Atelier Minimal',
        brandTag: 'Nike',
        fastPrime: false,
        twoDayDelivery: true,
        codEligible: false,
        featured: false,
        specs: {
            Fabric: '100% Superfine Merino Wool (260 gsm)',
            Fit: 'Relaxed tailored overshirt',
            Care: 'Cold wool wash or dry clean'
        }
    },
    {
        key: 'ergonomic-task-chair',
        name: 'Ergonomic Task Chair with Adaptive Lumbar Mesh',
        description: 'Award-winning posture engineering with 4D adjustable armrests, dynamic synchro-tilt mechanism, breathable matrix mesh backrest, and class-4 heavy-duty gas cylinder.',
        price: 18499,
        originalPrice: 24000,
        stock: 15,
        categoryName: 'home living',
        image: 'https://images.unsplash.com/photo-1580481077111-9e79b9777264?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1580481077111-9e79b9777264?w=800&q=80'],
        sellerName: 'ErgoMotion Lab',
        rating: 4.9,
        reviewCount: 88,
        badge: 'Ergonomic',
        badgeVariant: 'award-winner',
        brand: 'ErgoMotion',
        brandTag: 'Dyson',
        fastPrime: false,
        twoDayDelivery: false,
        codEligible: true,
        featured: true,
        specs: {
            Warranty: '5 Years Manufacturer Warranty',
            WeightCapacity: 'Up to 150 kg',
            Mechanism: 'Multifunctional synchro-tilt with 3-position lock'
        }
    },
    {
        key: 'titanium-smart-ring',
        name: 'Titanium Smart Health Ring Gen 3 (Size 10)',
        description: 'Ultra-lightweight grade 5 aerospace titanium ring. Continuously tracks continuous heart rate, SpO2, sleep staging, body temperature fluctuations, and recovery stress scores.',
        price: 19999,
        originalPrice: 25999,
        stock: 22,
        categoryName: 'electronics',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'],
        sellerName: 'Aura Biometrics',
        rating: 4.8,
        reviewCount: 167,
        badge: 'Innovation',
        badgeVariant: 'primary',
        brand: 'Aura Biometrics',
        brandTag: 'Apple',
        fastPrime: true,
        twoDayDelivery: true,
        codEligible: false,
        featured: true,
        specs: {
            Material: 'Grade 5 Aerospace Titanium with diamond-like carbon coating',
            Battery: 'Up to 7 days on a single 45-minute wireless charge',
            WaterResistance: '100m (10 ATM waterproof for swimming and diving)'
        }
    },

    // Stitch Shop All Catalog Items
    {
        key: 'aerosound-max-studio',
        name: 'AeroSound Max Studio Wireless Headset with Active Hybrid ANC & 60h Battery',
        description: 'High-end sleek wireless over-ear noise-cancelling headphones in matte charcoal black and subtle deep purple violet accents, minimalist studio photography.',
        price: 18499,
        originalPrice: 22999,
        stock: 45,
        categoryName: 'electronics',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvkrBkTnBsB9auEAQL28ndybGOmU4NQ7xb8X2J8K9VsETOSG3GgHjREUDV83mebHHpzgW6Rn00ljV3K3ABeMUZXdH4VUz-ijt9DGDOtTIzKxmGgbIH3VSGgKSdQmYr8VFpUpII3wFn30QbEnifgvc8CHOnBUrrIwpfDK8GBnCrmIaIab9Oi75nkerSzQ-MyY2VgJaLNBb-r1g9ls9PmQO9lSYshGFCOyJAAAT3Z_cYLavg9eHiAYOzuw',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCvkrBkTnBsB9auEAQL28ndybGOmU4NQ7xb8X2J8K9VsETOSG3GgHjREUDV83mebHHpzgW6Rn00ljV3K3ABeMUZXdH4VUz-ijt9DGDOtTIzKxmGgbIH3VSGgKSdQmYr8VFpUpII3wFn30QbEnifgvc8CHOnBUrrIwpfDK8GBnCrmIaIab9Oi75nkerSzQ-MyY2VgJaLNBb-r1g9ls9PmQO9lSYshGFCOyJAAAT3Z_cYLavg9eHiAYOzuw'],
        sellerName: 'AeroSound Precision',
        rating: 4.8,
        reviewCount: 1240,
        badge: 'FastPrime',
        badgeVariant: 'primary',
        brand: 'AeroSound Precision',
        brandTag: 'Sony',
        fastPrime: true,
        twoDayDelivery: true,
        codEligible: false,
        featured: true
    },
    {
        key: 'pureair-smart-hepa',
        name: 'PureAir Smart HEPA H14 Air Purifier with Real-Time AQI Sensor & App Control',
        description: 'Modern cylindrical smart home HEPA air purifier in seamless pure white finish with modern violet LED indicator ring.',
        price: 11999,
        originalPrice: 16999,
        stock: 28,
        categoryName: 'home living',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNaHbFqqxHeQwxqTuNF_UaWxfz8Z3J0aIA997HdLbmnwqy_wLgU1nAmGBq2-f0t860NwdemyX4Z8jOA86_62BYqtFd1AXZds-R0HSOz7wYoY8LO7lL-uYgWwg6opiukbS6m15IQfmAtY-wtpjiBq3-iwOhk8HfV-EK9oHBM580xfbvtRUdHfGSxs9PWe2ct2TvaZaG9hjhVjN74iuKt4j-ZfChd9f5StEi2eu6AOUQgYmpCWr-06KPDQ',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBNaHbFqqxHeQwxqTuNF_UaWxfz8Z3J0aIA997HdLbmnwqy_wLgU1nAmGBq2-f0t860NwdemyX4Z8jOA86_62BYqtFd1AXZds-R0HSOz7wYoY8LO7lL-uYgWwg6opiukbS6m15IQfmAtY-wtpjiBq3-iwOhk8HfV-EK9oHBM580xfbvtRUdHfGSxs9PWe2ct2TvaZaG9hjhVjN74iuKt4j-ZfChd9f5StEi2eu6AOUQgYmpCWr-06KPDQ'],
        sellerName: 'PureAir Home',
        rating: 4.7,
        reviewCount: 940,
        badge: 'Save 29%',
        badgeVariant: 'error',
        brand: 'PureAir Home',
        brandTag: 'Dyson',
        fastPrime: true,
        twoDayDelivery: false,
        codEligible: true,
        featured: true
    },
    {
        key: 'artisanal-ceramic-pourover',
        name: 'Artisanal Ceramic Pour-Over Coffee Set with Heat-Resistant Borosilicate Server',
        description: 'Artisanal hand-crafted textured ceramic pour over dripper coffee carafes set in earthy speckled stone and dark charcoal violet tones.',
        price: 2199,
        originalPrice: 2799,
        stock: 64,
        categoryName: 'home living',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7tUDWdrBi2EWKylNTtdWt6VPxWR94fzjlBcjEETKfKlBkKpoPuDQTC46BVPkD6eSsn5ot83HzcaqsquYMIx-j1c93CqkdCO5LmJz3KLZEyuP5sitZJpxwAmUTQkEVPsD7pO-unuwoH4zYdapZfpRpSd7nugkmS6xZR8BYYmvdwMeY5pzUgEDullUfB0wCMLG6rlRBsK9JQb0jUP8yxbuFxXBVNHFfgDXtDOGdPxh97gbYLiH3U4CTnQ',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuA7tUDWdrBi2EWKylNTtdWt6VPxWR94fzjlBcjEETKfKlBkKpoPuDQTC46BVPkD6eSsn5ot83HzcaqsquYMIx-j1c93CqkdCO5LmJz3KLZEyuP5sitZJpxwAmUTQkEVPsD7pO-unuwoH4zYdapZfpRpSd7nugkmS6xZR8BYYmvdwMeY5pzUgEDullUfB0wCMLG6rlRBsK9JQb0jUP8yxbuFxXBVNHFfgDXtDOGdPxh97gbYLiH3U4CTnQ'],
        sellerName: 'Kanso Craft',
        rating: 4.9,
        reviewCount: 520,
        badge: 'Seller Choice',
        badgeVariant: 'seller-choice',
        brand: 'Kanso Craft',
        brandTag: 'Kanso Craft',
        fastPrime: false,
        twoDayDelivery: true,
        codEligible: true,
        featured: false
    },
    {
        key: 'himalayan-raw-honey',
        name: 'Organic Wildflower Himalayan Raw Honey 500g Glass Pot with Natural Comb',
        description: 'Luxury glass jar of golden pure raw Himalayan wildflower organic honey with wooden dipper, rich warm amber reflections.',
        price: 599,
        originalPrice: 750,
        stock: 120,
        categoryName: 'grocery & essentials',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3jwBpR4ustMBf36yEN_F1HTWqRvSk1rLqIb-Y1bOGWbU3a8BlPAVaCKadMnLIO2P-NwrNJ0lE8vGd2ALFuj2Tq71aTQTZOQfu_ViW1nRbT4UJhX0bMSoCNm0Ryk5twaWAD3hjim2Bd2yvj80h1cxlNK2Ol_9Hud1hV2ANrUIaC4Ni3iqczTpGHWiiOEiaQRSsCPvLdNAoavWefUqq2phXbhLZXx2WDpHC1qiU0Y15iHzdWBn7CdlJDg',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuB3jwBpR4ustMBf36yEN_F1HTWqRvSk1rLqIb-Y1bOGWbU3a8BlPAVaCKadMnLIO2P-NwrNJ0lE8vGd2ALFuj2Tq71aTQTZOQfu_ViW1nRbT4UJhX0bMSoCNm0Ryk5twaWAD3hjim2Bd2yvj80h1cxlNK2Ol_9Hud1hV2ANrUIaC4Ni3iqczTpGHWiiOEiaQRSsCPvLdNAoavWefUqq2phXbhLZXx2WDpHC1qiU0Y15iHzdWBn7CdlJDg'],
        sellerName: 'Nature Organics',
        rating: 4.8,
        reviewCount: 3890,
        badge: 'FastPrime',
        badgeVariant: 'primary',
        brand: 'Nature Organics',
        brandTag: 'Tata Consumer',
        fastPrime: true,
        twoDayDelivery: false,
        codEligible: true,
        featured: false
    },
    {
        key: 'merino-travel-blazer',
        name: 'UltraLight Merino Wool Wrinkle-Resistant Travel Blazer in Deep Midnight',
        description: 'Tailored luxury menswear breathable dark navy violet Merino wool travel blazer displayed on minimalist sculpted bust.',
        price: 6899,
        originalPrice: 8999,
        stock: 19,
        categoryName: 'fashion & apparel',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4BkARQuctLHDWKvbPT5h9s95TrxOWajrcRHlK-LzkpJ73zPi4BIJYg-OwCAPOqHvbZrTSelAMbZXJ3CkVJxmC-k8gpRJK5c5kmcYoy0t-JI93BrQE5rdMs6HyXK4iQquw0b08MGq45FqHflZrItx6brEBROssTe2Sa8vKPLIHh8ReIyCwzAHPTf66DSwfRvmT_19-KNEn2VT8ldbPQdfwIRWSrCX3gMKSeAnyrUDZIsAgE9-SJdYTGA',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuD4BkARQuctLHDWKvbPT5h9s95TrxOWajrcRHlK-LzkpJ73zPi4BIJYg-OwCAPOqHvbZrTSelAMbZXJ3CkVJxmC-k8gpRJK5c5kmcYoy0t-JI93BrQE5rdMs6HyXK4iQquw0b08MGq45FqHflZrItx6brEBROssTe2Sa8vKPLIHh8ReIyCwzAHPTf66DSwfRvmT_19-KNEn2VT8ldbPQdfwIRWSrCX3gMKSeAnyrUDZIsAgE9-SJdYTGA'],
        sellerName: 'Aethel Apparel',
        rating: 4.6,
        reviewCount: 410,
        badge: 'Editorial Pick',
        badgeVariant: 'primary',
        brand: 'Aethel Apparel',
        brandTag: 'Nike',
        fastPrime: false,
        twoDayDelivery: true,
        codEligible: false,
        featured: false
    },
    {
        key: 'peptide-bioactive-cream',
        name: 'Peptide Bio-Active Firming Night Cream 50ml with Multi-Molecular Hyaluronic',
        description: 'High-end skincare luxury frosted cosmetic glass jar with metallic violet lid on polished stone pedestal.',
        price: 2499,
        originalPrice: 3200,
        stock: 50,
        categoryName: 'beauty & personal care',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkMGNrcVfhrYsl6fTCrr942ZnM15zlrOcZPNs1XZtbFlxFJRNP8DNluRcksheb1vCdY3LPuaA1yvAdhR-sIMib6ySzn7uccSCtN8gW3-caa81CAZk9IpeyDKbDxeNE4yqW-3qdisg66a2kURJJAIMAnA6lUReWNLpEMYj-tY95dGKQ0CgtEE_NhG7pNWHAx2US_GP8tKFF7azZthetuD_ZUzJyOHrpO3MLysyxjw_NoBHE7ebAknznJA',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBkMGNrcVfhrYsl6fTCrr942ZnM15zlrOcZPNs1XZtbFlxFJRNP8DNluRcksheb1vCdY3LPuaA1yvAdhR-sIMib6ySzn7uccSCtN8gW3-caa81CAZk9IpeyDKbDxeNE4yqW-3qdisg66a2kURJJAIMAnA6lUReWNLpEMYj-tY95dGKQ0CgtEE_NhG7pNWHAx2US_GP8tKFF7azZthetuD_ZUzJyOHrpO3MLysyxjw_NoBHE7ebAknznJA'],
        sellerName: 'Aura Botanical',
        rating: 4.9,
        reviewCount: 1120,
        badge: 'Award Winner',
        badgeVariant: 'award-winner',
        brand: 'Aura Botanical',
        brandTag: 'Forest Essentials',
        fastPrime: true,
        twoDayDelivery: false,
        codEligible: true,
        featured: true
    },
    {
        key: 'smart-ergo-bottle',
        name: 'Smart Ergo Hydro Stainless Steel Insulated Bottle 1L with LED Temp Touch',
        description: 'Insulated thermal matte titanium and violet vacuum water bottle 1L with ergonomic smart temperature cap.',
        price: 1299,
        originalPrice: 1699,
        stock: 85,
        categoryName: 'sports & outdoors',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVLO52J8uuU2mYNii2UcH5HRX_5dQOcVZWNRshejfMWHJ3_gy14DyEqvBONHRa3smsxLxzXmzRacQZ2_O39r0CYgMjHoosFbq5tylWEZK-D_2cArsaXZ8OmLZhv7S23J-JXBjRvdpGJSwjDYkVPI18RQquMJjATv2OBqpISiRKp57QqaexLm49Bd1LPW3U_82xW2u85k-GrPQrCMvFIAJnsogdsCNGfRJ0RQG82gZfQIxrUn8OC3zkVA',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBVLO52J8uuU2mYNii2UcH5HRX_5dQOcVZWNRshejfMWHJ3_gy14DyEqvBONHRa3smsxLxzXmzRacQZ2_O39r0CYgMjHoosFbq5tylWEZK-D_2cArsaXZ8OmLZhv7S23J-JXBjRvdpGJSwjDYkVPI18RQquMJjATv2OBqpISiRKp57QqaexLm49Bd1LPW3U_82xW2u85k-GrPQrCMvFIAJnsogdsCNGfRJ0RQG82gZfQIxrUn8OC3zkVA'],
        sellerName: 'HydroErgo Sport',
        rating: 4.7,
        reviewCount: 870,
        badge: 'Fitness Essential',
        badgeVariant: 'primary',
        brand: 'HydroErgo Sport',
        brandTag: 'Philips',
        fastPrime: false,
        twoDayDelivery: true,
        codEligible: true,
        featured: false
    },
    {
        key: 'mechanical-gaming-keyboard',
        name: 'Mechanical 75% Gaming Keyboard with Hot-Swappable Switches & RGB Glow',
        description: 'Custom mechanical keyboard with premium anodized deep indigo aluminum case, illuminated per-key violet backlighting.',
        price: 4799,
        originalPrice: 6499,
        stock: 32,
        categoryName: 'electronics',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAikZ4QuItIDXlVhFrkLa1EFlIdottscU-fqPGB2I0U2AseWmDPi_iZf1bghXADQqLSLCWrCdFyeIxZ5pYo-iOlz_bb9H_2VlqKT7V58htf3vywVG4yicIKsKGzD8NTcQeX6pbxA1pzMnkglBC7viYCCbQbiSSAB-H3TLijEULI0mUekOf9n-wn-xEAb1t3FTovB7cPsS2KYlhOWkcZ4DKeyYqnfgVAn-VpBt1BmU0A89Nzph9HLLUdIQ',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAikZ4QuItIDXlVhFrkLa1EFlIdottscU-fqPGB2I0U2AseWmDPi_iZf1bghXADQqLSLCWrCdFyeIxZ5pYo-iOlz_bb9H_2VlqKT7V58htf3vywVG4yicIKsKGzD8NTcQeX6pbxA1pzMnkglBC7viYCCbQbiSSAB-H3TLijEULI0mUekOf9n-wn-xEAb1t3FTovB7cPsS2KYlhOWkcZ4DKeyYqnfgVAn-VpBt1BmU0A89Nzph9HLLUdIQ'],
        sellerName: 'Vortex Peripherals',
        rating: 4.8,
        reviewCount: 2340,
        badge: 'FastPrime',
        badgeVariant: 'primary',
        brand: 'Vortex Peripherals',
        brandTag: 'Apple',
        fastPrime: true,
        twoDayDelivery: false,
        codEligible: false,
        featured: true
    },
    {
        key: 'cold-brew-glass-pitcher',
        name: 'Cold Brew Precision Glass Pitcher 1.5L with Ultra-Fine Micromesh Filter',
        description: 'Heavy borosilicate cold brew coffee glass pitcher with precision stainless steel fine mesh filter infuser.',
        price: 1899,
        originalPrice: 2399,
        stock: 40,
        categoryName: 'home living',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8clKln-W0ggAnUNaIDulWuUWHjD1AW4Sa3AUhLxBr9o3ILR0fVzy9b7GgWzttcsLNHugv_bzsPwLr4pB6LYL6iSmwahsw9JSwH22ydswnOw8i4FWinVGUs0kMEsTeHrZ60WCLd8uOpSwMUjL54fVDPy08hL9dQz1T3IsGF_EgVpIqT6GchklYVKD0dZHEnf-ToAhjyHua8ySL6XHO8gKj9oq21p4Y1OHLnfLpX97hsKMvqp7OOOO-EQ',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuD8clKln-W0ggAnUNaIDulWuUWHjD1AW4Sa3AUhLxBr9o3ILR0fVzy9b7GgWzttcsLNHugv_bzsPwLr4pB6LYL6iSmwahsw9JSwH22ydswnOw8i4FWinVGUs0kMEsTeHrZ60WCLd8uOpSwMUjL54fVDPy08hL9dQz1T3IsGF_EgVpIqT6GchklYVKD0dZHEnf-ToAhjyHua8ySL6XHO8gKj9oq21p4Y1OHLnfLpX97hsKMvqp7OOOO-EQ'],
        sellerName: 'Kanso Craft',
        rating: 4.6,
        reviewCount: 310,
        badge: 'Artisan Crafted',
        badgeVariant: 'seller-choice',
        brand: 'Kanso Craft',
        brandTag: 'Kanso Craft',
        fastPrime: false,
        twoDayDelivery: true,
        codEligible: true,
        featured: false
    },

    // PDP Accessory Bundles
    {
        key: 'aegis-hard-travel-case',
        name: 'Aegis Hard Travel Case for Over-Ear Headphones',
        description: 'Rugged EVA waterproof protective hard travel case for over-ear studio headphones with magnetic cable pouch.',
        price: 999,
        originalPrice: 1499,
        stock: 50,
        categoryName: 'accessories',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABoMePG7clcHXZVCWijwJwf3sVgD3Gy0owe9tJRRLaCiYI37Zi86ptnXuifOi6_2pdrSml-haXNQexAPPPVIovqaFlUmL0gwY6VPawCNtmUmtYm1BaWRirSyirM6YaSEooY-xonvSR9d4JBz1E7gjSagDdkFOOETpSzNNsvcULRgULr3LvLU3LDUFOCghHwS2v-ZTuFj1wUOFaxhRYH5LR9VEzuzIFxFtfFoQN0weOTCDfYsA1AG6QXg',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuABoMePG7clcHXZVCWijwJwf3sVgD3Gy0owe9tJRRLaCiYI37Zi86ptnXuifOi6_2pdrSml-haXNQexAPPPVIovqaFlUmL0gwY6VPawCNtmUmtYm1BaWRirSyirM6YaSEooY-xonvSR9d4JBz1E7gjSagDdkFOOETpSzNNsvcULRgULr3LvLU3LDUFOCghHwS2v-ZTuFj1wUOFaxhRYH5LR9VEzuzIFxFtfFoQN0weOTCDfYsA1AG6QXg'],
        sellerName: 'OmniAudio Direct',
        rating: 4.8,
        reviewCount: 340,
        badge: 'Bundle Essential',
        badgeVariant: 'primary',
        brand: 'Aegis Gear',
        brandTag: 'Sony',
        fastPrime: true,
        twoDayDelivery: true,
        codEligible: true,
        featured: false
    },
    {
        key: 'volta-45w-gan-charger',
        name: 'Volta 45W GaN Dual USB-C Fast Charger',
        description: 'Ultra-compact 45W Dual USB-C GaN fast wall charger adapter in matte black with smart power delivery distribution.',
        price: 1199,
        originalPrice: 1799,
        stock: 45,
        categoryName: 'accessories',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBi9VnX6KOGVmPmUW5eenPj4JclS9lNE0gvazKlLapj5a9om3la3xUPX3V73NziobWEprga1IuJwOPyhoJ6RDSNJDpHHEv6SGBoLEwmGcaGSGhQBCvB_oGwQaC8gtAuTCmCj-V-JTpTA2JqvcW5AhU_qlov5KAogHdQry5IWWeWzc8M-UqqR2xxyjF-AjxsLcQFfhYYDqO5O4zWuGIJZIgeBcaRYTQBufpEr5VLUVxG5uQWdXt9WvJoA',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCBi9VnX6KOGVmPmUW5eenPj4JclS9lNE0gvazKlLapj5a9om3la3xUPX3V73NziobWEprga1IuJwOPyhoJ6RDSNJDpHHEv6SGBoLEwmGcaGSGhQBCvB_oGwQaC8gtAuTCmCj-V-JTpTA2JqvcW5AhU_qlov5KAogHdQry5IWWeWzc8M-UqqR2xxyjF-AjxsLcQFfhYYDqO5O4zWuGIJZIgeBcaRYTQBufpEr5VLUVxG5uQWdXt9WvJoA'],
        sellerName: 'OmniAudio Direct',
        rating: 4.9,
        reviewCount: 610,
        badge: 'Bundle Essential',
        badgeVariant: 'primary',
        brand: 'Volta Power',
        brandTag: 'Apple',
        fastPrime: true,
        twoDayDelivery: true,
        codEligible: true,
        featured: false
    }
];

/**
 * Seed or update the database idempotently.
 * Safe to run multiple times without duplicating or overwriting unrelated data.
 */
async function seedDatabase(options = {}) {
    const logger = options.silent ? () => {} : console.log;
    logger('[Seeder] Starting idempotent OMIZON catalog seeding...');

    // 1. Ensure Default Official Merchant exists
    const defaultSellerId = getDeterministicId('seller', 'omizon_official_seller');
    let seller = await User.findById(defaultSellerId);
    if (!seller) {
        const hashedPassword = await bcrypt.hash('OmizonSeller@2026', 10);
        seller = await User.create({
            _id: defaultSellerId,
            username: 'omizon_official',
            email: 'seller@omizon.com',
            password: hashedPassword,
            role: 'seller'
        });
        logger(`[Seeder] Created default merchant seller: ${seller.username} (${seller._id})`);
    } else {
        logger(`[Seeder] Default merchant seller verified: ${seller.username} (${seller._id})`);
    }

    // 2. Ensure Default Demo Buyer exists for development/testing environments (not in production)
    if (process.env.NODE_ENV !== 'production') {
        const defaultBuyerId = getDeterministicId('buyer', 'omizon_official_buyer');
        let buyer = await User.findById(defaultBuyerId);
        if (!buyer) {
            const hashedBuyerPassword = await bcrypt.hash('password123', 10);
            buyer = await User.create({
                _id: defaultBuyerId,
                username: 'priya_sharma',
                email: 'priya@omizon.in',
                password: hashedBuyerPassword,
                role: 'buyer'
            });
            logger(`[Seeder] Created default demo buyer: ${buyer.username} (${buyer._id})`);
        } else {
            logger(`[Seeder] Default demo buyer verified: ${buyer.username} (${buyer._id})`);
        }
    }

    // 3. Ensure Categories exist with deterministic IDs
    const categoryMap = new Map();
    let seededCategoriesCount = 0;

    for (const cat of SEED_CATEGORIES) {
        const catId = getDeterministicId('category', cat.name);
        const categoryDoc = await Category.findOneAndUpdate(
            { _id: catId },
            {
                $setOnInsert: { _id: catId },
                $set: { name: cat.name.toLowerCase().trim() }
            },
            { upsert: true, new: true, runValidators: true }
        );
        categoryMap.set(cat.name.toLowerCase().trim(), categoryDoc);
        seededCategoriesCount++;
    }
    logger(`[Seeder] Verified/seeded ${seededCategoriesCount} official product categories.`);

    // 3. Seed Products and synchronize Inventory
    let seededProductsCount = 0;
    let seededInventoryCount = 0;

    for (const item of SEED_PRODUCTS) {
        const prodId = getDeterministicId('product', item.key);
        const categoryDoc = categoryMap.get(item.categoryName.toLowerCase().trim());
        if (!categoryDoc) {
            throw new Error(`Category not found for product: ${item.name} (${item.categoryName})`);
        }

        const productData = {
            name: item.name,
            description: item.description,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            stock: item.stock,
            category: categoryDoc._id,
            seller: seller._id,
            image: item.image,
            images: item.images && item.images.length > 0 ? item.images : [item.image],
            brand: item.brand || 'OMIZON Collection',
            brandTag: item.brandTag || '',
            rating: item.rating || 4.8,
            reviewCount: item.reviewCount || 100,
            badge: item.badge || '',
            badgeVariant: item.badgeVariant || 'primary',
            fastPrime: Boolean(item.fastPrime),
            twoDayDelivery: Boolean(item.twoDayDelivery),
            codEligible: Boolean(item.codEligible),
            specs: item.specs || {},
            featured: Boolean(item.featured),
            status: item.stock > 0 ? 'active' : 'out_of_stock'
        };

        const product = await Product.findOneAndUpdate(
            { _id: prodId },
            {
                $setOnInsert: { _id: prodId },
                $set: productData
            },
            { upsert: true, new: true, runValidators: true }
        );
        seededProductsCount++;

        // Synchronize linked authoritative Inventory record
        await Inventory.findOneAndUpdate(
            { product: product._id },
            {
                $setOnInsert: { product: product._id },
                $set: {
                    variants: [
                        {
                            name: 'default',
                            totalStock: item.stock,
                            availableStock: item.stock,
                            reservedStock: 0
                        }
                    ]
                }
            },
            { upsert: true, new: true, runValidators: true }
        );
        seededInventoryCount++;
    }

    logger(`[Seeder] Verified/seeded ${seededProductsCount} products with linked inventory records.`);
    logger('[Seeder] Catalog database seeding completed successfully.');

    return {
        sellerCount: 1,
        categoryCount: seededCategoriesCount,
        productCount: seededProductsCount,
        inventoryCount: seededInventoryCount
    };
}

// Standalone execution entrypoint
if (require.main === module) {
    require('dotenv').config();
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce?replicaSet=rs0';

    mongoose.connect(uri)
        .then(async () => {
            console.log(`[Seeder] Connected to MongoDB at ${uri}`);
            const result = await seedDatabase();
            console.log('[Seeder] Summary Result:', result);
            await mongoose.disconnect();
            console.log('[Seeder] Disconnected from MongoDB.');
            process.exit(0);
        })
        .catch((err) => {
            console.error('[Seeder] Seeding failed:', err.message);
            process.exit(1);
        });
}

module.exports = {
    seedDatabase,
    getDeterministicId,
    SEED_CATEGORIES,
    SEED_PRODUCTS
};

