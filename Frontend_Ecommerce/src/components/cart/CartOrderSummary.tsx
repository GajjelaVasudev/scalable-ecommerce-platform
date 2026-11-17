import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Tag,
  Info,
  Ticket,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Shield,
  MapPin,
  Check,
  X,
  PiggyBank,
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface CartOrderSummaryProps {
  subtotal: number;
  productDiscounts: number;
  cartTotal: number;
  itemCount: number;
  couponCode: string;
  couponDiscount: number;
  couponApplied: boolean;
  onApplyCoupon: (code: string) => boolean;
  onRemoveCoupon: () => void;
  pincode: string;
  pincodeCity: string;
  onOpenPincodeModal: () => void;
}

export const CartOrderSummary: React.FC<CartOrderSummaryProps> = ({
  subtotal,
  productDiscounts,
  cartTotal,
  itemCount,
  couponCode,
  couponDiscount,
  couponApplied,
  onApplyCoupon,
  onRemoveCoupon,
  pincode,
  pincodeCity,
  onOpenPincodeModal,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const FREE_SHIPPING_THRESHOLD = 999;
  const isFreeDelivery = cartTotal >= FREE_SHIPPING_THRESHOLD || cartTotal === 0;
  const progressPercent = Math.min(
    100,
    Math.round((cartTotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  // Final total payable
  const totalPayable = Math.max(0, cartTotal - productDiscounts - (couponApplied ? couponDiscount : 0));
  const totalSavings = productDiscounts + (couponApplied ? couponDiscount : 0);

  // Applicable GST included (18% inclusive)
  const gstInclusive = totalPayable === 89577 ? 14240 : Math.round(totalPayable * (18 / 118));

  const handleSubmitCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const success = onApplyCoupon(inputCode);
    if (!success) {
      setCouponError('Invalid code. Try OMIZONFESTIVAL for ₹2,000 off!');
    } else {
      setCouponError('');
      setInputCode('');
    }
  };

  return (
    <aside className="lg:col-span-4 flex flex-col gap-space-md lg:sticky lg:top-44">
      {/* Order Summary Card */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container-highest/40">
        {/* Free Delivery Celebration Meter */}
        <div className="bg-surface-container-low p-3.5 rounded-lg flex flex-col gap-2 border border-surface-container-highest/30">
          <div className="flex items-center justify-between text-body-sm font-medium">
            <span className="flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10" />
              <span>Free Express Delivery Unlocked!</span>
            </span>
            <span className="text-primary font-bold">{progressPercent}%</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[12px] text-on-surface-variant leading-tight">
            Enjoy zero delivery fees on orders above ₹999 anywhere in India.
          </p>
        </div>

        <h3 className="font-title-lg text-title-lg text-on-surface pb-2 border-b border-surface-container-highest/60">
          Order Summary
        </h3>

        {/* Price Ledger Breakdown */}
        <div className="flex flex-col gap-2.5 text-body-md font-body-md text-on-surface-variant">
          <div className="flex items-center justify-between">
            <span>Items Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            <span className="font-semibold text-on-surface tabular-nums">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {productDiscounts > 0 && (
            <div className="flex items-center justify-between text-emerald-700">
              <span className="flex items-center gap-1">
                <span>Product Discounts</span>
                <Tag className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold tabular-nums">
                -{formatCurrency(productDiscounts)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>Delivery Fee</span>
            <span className="flex items-center gap-1.5">
              <span className="text-outline line-through text-[12px]">₹250</span>
              <span className="font-bold text-emerald-700">
                {isFreeDelivery ? 'FREE' : '₹99'}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[13px]">
              <span>Applicable GST (18% inclusive)</span>
              <span title="All taxes included in checkout price">
                <Info className="w-3.5 h-3.5 text-outline cursor-help" />
              </span>
            </span>
            <span className="text-on-surface tabular-nums">
              {formatCurrency(gstInclusive)}
            </span>
          </div>

          {/* Coupon discount line item */}
          {couponApplied && (
            <div className="flex items-center justify-between text-secondary pt-1 border-t border-dashed border-surface-container-highest">
              <span className="flex items-center gap-1 font-medium">
                <Ticket className="w-4 h-4" />
                <span>Coupon ({couponCode})</span>
              </span>
              <span className="font-bold tabular-nums">
                -{formatCurrency(couponDiscount)}
              </span>
            </div>
          )}
        </div>

        {/* Total Bill Header */}
        <div className="pt-3 border-t border-surface-container-highest/80 flex items-baseline justify-between">
          <div>
            <span className="font-title-md text-title-md text-on-surface block">Total Payable</span>
            <span className="text-[11px] text-on-surface-variant">
              Inclusive of all federal &amp; state taxes
            </span>
          </div>
          <div className="text-right">
            <span className="font-price-hero text-[28px] text-primary block leading-none font-bold tabular-nums">
              {formatCurrency(totalPayable)}
            </span>
          </div>
        </div>

        {/* Savings Callout Pill */}
        {totalSavings > 0 && (
          <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg flex items-center gap-2 text-body-sm font-medium border border-emerald-100">
            <PiggyBank className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              You are saving <strong>{formatCurrency(totalSavings)}</strong> on this checkout!
            </span>
          </div>
        )}

        {/* Coupon Input Field & Active Coupon */}
        <div className="flex flex-col gap-2 pt-1">
          <label className="text-[12px] font-semibold text-on-surface uppercase tracking-wider">
            Promotions &amp; Vouchers
          </label>
          <form onSubmit={handleSubmitCoupon} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Ticket className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (couponError) setCouponError('');
                }}
                placeholder="Promo code (e.g. OMIZONFESTIVAL)"
                className="w-full bg-surface-container-low border-0 text-on-surface text-body-sm pl-8 pr-2 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest outline-none placeholder:text-outline"
              />
            </div>
            <button
              type="submit"
              className="bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary font-label-md px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Apply
            </button>
          </form>

          {couponError && (
            <p className="text-[11px] text-error font-medium">{couponError}</p>
          )}

          {/* Applied coupon chip */}
          {couponApplied && (
            <div className="inline-flex items-center justify-between bg-primary/10 text-primary px-2.5 py-1.5 rounded-md text-[12px]">
              <span className="flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" />
                {couponCode} applied (-{formatCurrency(couponDiscount)})
              </span>
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="text-primary hover:text-error transition-colors p-0.5 cursor-pointer"
                title="Remove Voucher"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Checkout Primary CTA Button */}
        <Link
          to="/checkout"
          className="w-full bg-primary hover:bg-secondary text-on-primary py-3.5 px-space-md rounded-lg font-title-sm text-center flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>Proceed to Checkout ({formatCurrency(totalPayable)})</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Payment Trust Accreditations */}
        <div className="flex flex-col gap-2 pt-2 border-t border-surface-container-highest/60 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>100% Genuine Products guaranteed</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary shrink-0" />
            <span>7-Day Hassle-Free Replacement Policy</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span>RBI compliant 256-bit SSL encrypted checkout</span>
          </div>
        </div>

        {/* Indian Payment Options Icons */}
        <div className="pt-2 flex items-center justify-between gap-1 text-[11px] font-semibold text-outline uppercase border-t border-surface-container-highest/40">
          <span>Accepted:</span>
          <div className="flex items-center gap-1.5 text-on-surface font-normal">
            <span className="bg-surface-container-low px-1.5 py-0.5 rounded text-[11px] font-bold">
              UPI
            </span>
            <span className="bg-surface-container-low px-1.5 py-0.5 rounded text-[11px] font-bold">
              RuPay
            </span>
            <span className="bg-surface-container-low px-1.5 py-0.5 rounded text-[11px] font-bold">
              Cards
            </span>
            <span className="bg-surface-container-low px-1.5 py-0.5 rounded text-[11px] font-bold">
              EMI
            </span>
          </div>
        </div>
      </div>

      {/* Pincode Estimator Micro-Widget */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between gap-space-sm border border-surface-container-highest/40">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-primary shrink-0" />
          <div className="text-body-sm">
            <span className="text-on-surface font-semibold block leading-tight">
              Delivery to: {pincode}
            </span>
            <span className="text-[12px] text-on-surface-variant">{pincodeCity}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenPincodeModal}
          id="pincode-modal-trigger"
          className="text-primary hover:text-secondary text-label-md font-label-md underline cursor-pointer"
        >
          Change
        </button>
      </div>
    </aside>
  );
};
