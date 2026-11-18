import React, { useState } from 'react';
import { CartItem } from '../../types';
import { CheckCircle2, Lock, Headphones, RotateCcw, ShieldCheck } from 'lucide-react';

export interface CheckoutSummaryProduct {
  id: string;
  name: string;
  variant: string;
  quantity: number;
  price: number;
  image: string;
}

export const STITCH_CHECKOUT_DEMO_ITEMS: CheckoutSummaryProduct[] = [
  {
    id: 'prod_apex_01',
    name: 'ApexBook M3 Ultra 16-inch',
    variant: 'Space Gray',
    quantity: 1,
    price: 74990,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDD39AJ7FnRj1TkSDuoTWDIBISwF8lHrIVTaJD96T-iTiHUVveTPO-1Eg009kHyMkGEERc-rJPSGTZsBckGYWhcpl_bLOuypungBfp53L9MPHlmIF7FvfR_CgNcvXv9n8O0zVEhifQ0v5Fkj33huvNZZQq1RL6X010y8XfFhFjHl9KC3ZyU9H7bFpPIfUwyQudOiFet-b-U3Edr1fp-9-FhW3Se_UHS-n2dpPSkOjX-4huc3PxTiWvv6w',
  },
  {
    id: 'prod_soundpulse_01',
    name: 'SoundPulse Studio Pro ANC',
    variant: 'Midnight',
    quantity: 1,
    price: 24999,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAH_XmeuMSi-EZAKm3kZ9oAD9GYOlLI62RKHVuqi_EX5vL7DWxZIAE9k4WvyIoXk3z8xZWI2dXabwoIUAPHDZxTwlw5Rrh4odIbnWTMbdNa3O-J99u-j-A-GxW68CePb3s5YHKD6-R-cPJpgcsFQglxDKvWByt_RDfoOgiNlkxqTs9b_UotQF2i-ATsgB0xKjYq9g4hPQa1G_M0Xnzf3mXGM0Jb5F5PgjAI0NNxS5W091TOJGUV8iu6w',
  },
  {
    id: 'prod_auraglow_01',
    name: 'AuraGlow Smart Desk Lamp',
    variant: 'Matte Silver',
    quantity: 1,
    price: 3499,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAQJyFTPNL7NmovqVOv7nJisOJc7hRmTzqBMhoUmtwxAQMILfKDJgX_ZCXYIPrIA6Gm2mOyhJwgtpJXBcmlLxpBs8gSI4391gKiTPpWmipcjwYlhHiRrKWEYsSm3AeGy6LcUHMelHoC8yQtz5h3q3vSDG3D_00wyVt1tN9MA04YvX35W_1ZGuX4bOMjupOg_tQWWea2IIjuSv2y3ZYK_Qck5WeShEWb1kdpO67FcmeKvKV8b-QUoALkDw',
  },
];

interface CheckoutOrderSummaryProps {
  cartItems: CartItem[];
  deliveryFee: number;
  isSubmitting: boolean;
  onPlaceOrder: () => void;
  couponDiscount: number;
  appliedCoupon: string | null;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  cartItems,
  deliveryFee,
  isSubmitting,
  onPlaceOrder,
  couponDiscount,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const isExplicitDemo =
    typeof window !== 'undefined' &&
    (localStorage.getItem('omizon_demo_cart') === 'true' ||
      new URLSearchParams(window.location.search).get('demo') === 'cart');

  // Use real cart items if available, or fall back to canonical Stitch preview items only when explicitly in demo mode
  const displayItems: CheckoutSummaryProduct[] =
    cartItems.length > 0
      ? cartItems.map((item, idx) => {
          const product = item.product;
          const pId = typeof product === 'object' ? product._id : product;
          const pName = typeof product === 'object' ? product.name : `Product ${idx + 1}`;
          const pImg =
            typeof product === 'object' && product.image
              ? product.image
              : STITCH_CHECKOUT_DEMO_ITEMS[idx % STITCH_CHECKOUT_DEMO_ITEMS.length].image;
          const pPrice = typeof product === 'object' ? product.price : item.price || 14999;

          return {
            id: pId || `cart_${idx}`,
            name: pName,
            variant: item.variant || 'Standard',
            quantity: item.quantity,
            price: pPrice,
            image: pImg,
          };
        })
      : isExplicitDemo
      ? STITCH_CHECKOUT_DEMO_ITEMS
      : [];

  const totalItemsCount = displayItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const itemsSubtotal = displayItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const gstAmount = Math.round(itemsSubtotal * 0.18);
  const totalAmount = Math.max(0, itemsSubtotal + deliveryFee - couponDiscount);
  const totalSavings = couponDiscount + (deliveryFee === 0 ? 99 : 0);

  const formatInr = (num: number) => `₹${num.toLocaleString('en-IN')}`;

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    if (
      couponInput.trim().toUpperCase() === 'OMIZONFESTIVE' ||
      couponInput.trim().toUpperCase() === 'FESTIVAL500' ||
      couponInput.trim().toUpperCase() === 'WELCOME100'
    ) {
      onApplyCoupon(couponInput.trim().toUpperCase());
      setCouponInput('');
      setCouponError('');
    } else {
      setCouponError('Invalid coupon. Try OMIZONFESTIVE for -₹5,000 off!');
    }
  };

  return (
    <div className="lg:col-span-4 flex flex-col gap-4 sticky top-24">
      {/* Summary Box */}
      <div className="bg-surface-container-lowest rounded-xl shadow-md p-5 sm:p-6 flex flex-col gap-5 border border-outline-variant/15">
        <div className="flex items-center justify-between">
          <h3 className="font-title-lg text-on-surface font-bold">Order Summary</h3>
          <span className="bg-surface-container-high text-primary px-2.5 py-0.5 rounded-full font-label-sm font-semibold">
            {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* Products Preview */}
        <div className="flex flex-col gap-3 py-1 max-h-72 overflow-y-auto pr-1">
          {displayItems.length > 0 ? (
            displayItems.map((prod) => (
              <div key={prod.id} className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-surface-container-low flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                  <img
                    className="w-full h-full object-cover rounded-md"
                    alt={prod.name}
                    src={prod.image}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-title-sm text-on-surface truncate font-semibold">
                    {prod.name}
                  </p>
                  <div className="flex items-center justify-between text-body-sm text-on-surface-variant mt-0.5">
                    <span>
                      Qty: {prod.quantity} • {prod.variant}
                    </span>
                    <span className="font-title-sm text-on-surface font-semibold">
                      {formatInr(prod.price * prod.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-body-sm text-outline py-4 text-center">Your checkout cart is empty</p>
          )}
        </div>

        {/* Promo Code Module */}
        {appliedCoupon ? (
          <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-outline uppercase tracking-wider text-[11px]">
                Coupon Applied
              </span>
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="text-error font-label-sm hover:underline cursor-pointer font-medium"
              >
                Remove
              </button>
            </div>
            <div className="flex items-center justify-between bg-surface-container-lowest px-3 py-2 rounded-md shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                <div>
                  <span className="font-title-sm text-on-surface font-bold">{appliedCoupon}</span>
                  <span className="text-secondary font-body-sm block text-[11px]">
                    -{formatInr(couponDiscount)} festival bonus applied
                  </span>
                </div>
              </div>
              <span className="bg-surface-container-highest text-secondary font-label-sm font-bold px-2 py-0.5 rounded text-[11px]">
                SAVED
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCouponSubmit} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter promo coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 h-10 px-3 bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary uppercase font-medium placeholder:normal-case"
              />
              <button
                type="submit"
                className="h-10 px-4 bg-primary text-on-primary font-label-md rounded-lg hover:bg-secondary transition-colors cursor-pointer font-semibold"
              >
                Apply
              </button>
            </div>
            {couponError && <span className="text-error text-body-sm text-[12px]">{couponError}</span>}
          </form>
        )}

        {/* Price Calculation Rows */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-outline-variant/15">
          <div className="flex justify-between font-body-md text-on-surface-variant">
            <span>Items Subtotal</span>
            <span className="font-medium text-on-surface">{formatInr(itemsSubtotal)}</span>
          </div>

          <div className="flex justify-between font-body-md text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span>FastX Next-Day Delivery</span>
              <span className="bg-surface-container-high text-primary text-[10px] font-bold px-1.5 py-0.2 rounded">
                PRIME
              </span>
            </div>
            <div className="flex items-center gap-1">
              {deliveryFee === 0 ? (
                <>
                  <span className="text-outline line-through text-body-sm">₹99</span>
                  <span className="text-secondary font-semibold">FREE</span>
                </>
              ) : (
                <span className="text-on-surface font-semibold">{formatInr(deliveryFee)}</span>
              )}
            </div>
          </div>

          <div className="flex justify-between font-body-md text-on-surface-variant">
            <span>GST Included (18%)</span>
            <span className="font-medium text-on-surface">{formatInr(gstAmount)}</span>
          </div>

          {couponDiscount > 0 && (
            <div className="flex justify-between font-body-md text-secondary font-medium">
              <span>Festive Mega Discount</span>
              <span className="font-semibold">-{formatInr(couponDiscount)}</span>
            </div>
          )}
        </div>

        <div className="h-0.5 bg-surface-container-highest w-full my-1" />

        {/* Total Payable */}
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="font-title-lg text-on-surface font-bold">Total Amount</span>
            {totalSavings > 0 && (
              <span className="text-secondary font-body-sm text-[12px] font-semibold">
                You save {formatInr(totalSavings)} on this order
              </span>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className="font-headline-md text-on-surface font-extrabold text-[28px] tracking-tight">
              {formatInr(totalAmount)}
            </span>
            <span className="font-body-sm text-outline text-[11px]">All inclusive of taxes</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          id="place-order-btn"
          type="button"
          onClick={onPlaceOrder}
          disabled={isSubmitting || displayItems.length === 0}
          className="w-full h-12 bg-primary hover:bg-secondary active:scale-[0.99] text-on-primary font-title-md rounded-lg font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying &amp; Placing Order...</span>
            </div>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Place Order &amp; Pay {formatInr(totalAmount)}</span>
            </>
          )}
        </button>

        {/* Disclaimer / Legal microcopy */}
        <p className="font-body-sm text-outline text-[11px] text-center leading-normal">
          By placing your order, you agree to OMIZON's{' '}
          <a className="text-primary hover:underline" href="#">
            Conditions of Use &amp; Sale
          </a>{' '}
          and{' '}
          <a className="text-primary hover:underline" href="#">
            Privacy Notice
          </a>
          .
        </p>
      </div>

      {/* Support / Help Callout Card */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center gap-3.5 border border-outline-variant/15">
        <div className="w-10 h-10 rounded-full bg-surface-container-low text-primary flex items-center justify-center shrink-0">
          <Headphones className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-title-sm text-on-surface font-semibold">Need Help with Checkout?</h4>
          <p className="font-body-sm text-on-surface-variant text-[12px]">
            24/7 Priority Support hotline: 1800-420-OMIZON
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('OMIZON 24/7 Priority Support hotline: 1800-420-OMIZON is available.')}
          className="text-primary hover:text-secondary font-label-md cursor-pointer font-semibold"
        >
          Call
        </button>
      </div>

      {/* Assurances Card */}
      <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-body-sm text-on-surface">
          <RotateCcw className="w-4 h-4 text-primary shrink-0" />
          <span>7-Day Hassle-Free Returns &amp; Replacement</span>
        </div>
        <div className="flex items-center gap-2 text-body-sm text-on-surface">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>100% Genuine Certified Merchandise</span>
        </div>
      </div>
    </div>
  );
};
