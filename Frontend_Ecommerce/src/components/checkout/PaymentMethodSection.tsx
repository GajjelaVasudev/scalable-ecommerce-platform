import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, Info, CreditCard, ShieldCheck } from 'lucide-react';

export type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'emi' | 'cod';

interface PaymentMethodSectionProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
  totalPayable: number;
}

export const PaymentMethodSection: React.FC<PaymentMethodSectionProps> = ({
  selectedMethod,
  onSelectMethod,
  totalPayable,
}) => {
  // UPI State
  const [upiId, setUpiId] = useState('rajesh.singhania@oksbi');
  const [upiVerified, setUpiVerified] = useState(true);
  const [qrCountdown, setQrCountdown] = useState(298); // 4m 58s

  // Card State
  const [savedCardCvv, setSavedCardCvv] = useState('');
  const [useNewCard, setUseNewCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // EMI State
  const [selectedEmiTenure, setSelectedEmiTenure] = useState('24');

  // Dynamic QR countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setQrCountdown((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFastTagClick = (tag: string) => {
    const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId;
    setUpiId(`${prefix}${tag}`);
    setUpiVerified(true);
  };

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(totalPayable);

  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden" id="step-payment">
      {/* Header */}
      <div className="p-5 md:p-6 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-title-sm">
            3
          </span>
          <h2 className="font-headline-sm text-on-surface">Select Payment Method</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm bg-surface-container px-2.5 py-1 rounded-md">
            <Lock className="w-3.5 h-3.5 text-secondary" />
            <span className="font-label-sm uppercase font-semibold text-[11px]">256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 flex flex-col gap-4">
        {/* 1. UPI Tab */}
        <div
          className={`rounded-xl overflow-hidden shadow-sm transition-all ${
            selectedMethod === 'upi'
              ? 'bg-surface-container-low ring-2 ring-primary/40'
              : 'bg-surface-container-low hover:bg-surface-container cursor-pointer'
          }`}
        >
          <div
            onClick={() => onSelectMethod('upi')}
            className="p-4 flex items-center justify-between cursor-pointer bg-surface-container-high/60"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedMethod === 'upi' ? 'border-primary' : 'border-outline-variant'
                }`}
              >
                {selectedMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-title-md text-on-surface font-bold">UPI</span>
                <span className="text-outline text-body-sm">•</span>
                <span className="font-body-sm text-on-surface-variant">Instant 0% Fee Payment</span>
              </div>
            </div>

            {/* App Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm font-semibold shadow-sm text-[11px]">
                Google Pay
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm font-semibold shadow-sm text-[11px]">
                PhonePe
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm font-semibold shadow-sm text-[11px]">
                Paytm
              </span>
            </div>
          </div>

          {/* Expanded UPI Container */}
          {selectedMethod === 'upi' && (
            <div className="p-5 flex flex-col md:flex-row gap-6 bg-surface-container-lowest border-t border-outline-variant/15">
              {/* VPA Input Sub-column */}
              <div className="flex-1 flex flex-col gap-3">
                <span className="font-title-sm text-on-surface font-semibold">
                  Enter your UPI Virtual ID (VPA)
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => {
                        setUpiId(e.target.value);
                        setUpiVerified(e.target.value.includes('@'));
                      }}
                      placeholder="yourname@bank"
                      className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-lg font-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm border border-outline-variant/30 focus:border-primary"
                    />
                    {upiVerified && (
                      <span className="absolute right-3 top-3 text-primary">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setUpiVerified(true)}
                    className="h-11 px-4 rounded-lg bg-surface-container-high text-on-surface font-label-md font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer shrink-0"
                  >
                    Verified
                  </button>
                </div>

                <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <span>A collect request of {formattedTotal} will be sent to your UPI app.</span>
                </div>

                {/* Quick UPI Handles */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-label-sm text-outline uppercase tracking-wider text-[11px]">
                    Fast Tags:
                  </span>
                  {['@okaxis', '@okhdfcbank', '@paytm', '@ybl'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleFastTagClick(tag)}
                      className="text-body-sm bg-surface-container-low px-2.5 py-0.5 rounded hover:bg-surface-container font-medium text-on-surface transition-colors cursor-pointer text-[12px]"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Option Splitter */}
              <div className="flex md:flex-col items-center justify-center gap-2 text-outline font-label-sm uppercase">
                <div className="w-full md:w-px h-px md:h-12 bg-surface-container-highest" />
                <span className="text-[12px] font-bold">OR</span>
                <div className="w-full md:w-px h-px md:h-12 bg-surface-container-highest" />
              </div>

              {/* UPI QR Scan Area */}
              <div className="w-full md:w-48 bg-surface-container-low p-3.5 rounded-xl flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-surface-container-lowest rounded-lg p-2 flex items-center justify-center shadow-sm">
                  {/* Inline SVG QR Blueprint matching Stitch */}
                  <svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 100 100">
                    <rect fill="#190B46" height="30" rx="3" width="30" x="0" y="0" />
                    <rect fill="#FFFFFF" height="18" rx="2" width="18" x="6" y="6" />
                    <rect fill="#190B46" height="10" width="10" x="10" y="10" />
                    <rect fill="#190B46" height="30" rx="3" width="30" x="70" y="0" />
                    <rect fill="#FFFFFF" height="18" rx="2" width="18" x="76" y="6" />
                    <rect fill="#190B46" height="10" width="10" x="80" y="10" />
                    <rect fill="#190B46" height="30" rx="3" width="30" x="0" y="70" />
                    <rect fill="#FFFFFF" height="18" rx="2" width="18" x="6" y="76" />
                    <rect fill="#190B46" height="10" width="10" x="10" y="80" />
                    <rect fill="#762FF2" height="8" width="20" x="40" y="10" />
                    <rect fill="#190B46" height="30" width="8" x="40" y="30" />
                    <rect fill="#762FF2" height="10" width="25" x="60" y="45" />
                    <rect fill="#190B46" height="15" width="15" x="45" y="70" />
                    <rect fill="#190B46" height="18" width="20" x="75" y="75" />
                  </svg>
                </div>
                <span className="font-label-sm text-on-surface font-semibold mt-2">
                  Scan &amp; Pay via Any UPI
                </span>
                <span className="font-body-sm text-outline text-[11px]">
                  Dynamic QR refreshes in {formatTimer(qrCountdown)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Credit / Debit Cards */}
        <div
          className={`rounded-xl overflow-hidden transition-all ${
            selectedMethod === 'card'
              ? 'bg-surface-container-low ring-2 ring-primary/40'
              : 'bg-surface-container-low hover:bg-surface-container cursor-pointer'
          }`}
        >
          <div
            onClick={() => onSelectMethod('card')}
            className="p-4 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedMethod === 'card' ? 'border-primary' : 'border-outline-variant'
                }`}
              >
                {selectedMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div>
                <span className="font-title-md text-on-surface font-semibold">Credit / Debit Card</span>
                <span className="text-outline text-body-sm ml-2 hidden sm:inline">
                  Visa, MasterCard, RuPay, Amex
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="bg-surface-container-lowest px-2 py-0.5 rounded text-[11px] font-bold text-on-surface shadow-sm">
                VISA
              </span>
              <span className="bg-surface-container-lowest px-2 py-0.5 rounded text-[11px] font-bold text-on-surface shadow-sm">
                Mastercard
              </span>
              <span className="bg-surface-container-lowest px-2 py-0.5 rounded text-[11px] font-bold text-on-surface shadow-sm">
                RuPay
              </span>
            </div>
          </div>

          {selectedMethod === 'card' && (
            <div className="px-5 pb-5 pt-2 flex flex-col gap-4 bg-surface-container-lowest border-t border-outline-variant/15">
              {!useNewCard ? (
                /* Saved Card Subrow */
                <div className="flex flex-wrap items-center justify-between gap-3 text-body-sm text-on-surface-variant p-3 bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      Saved Card: <strong>HDFC Regalia</strong> ending in <strong>•••• 4821</strong> (Exp: 09/27)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      maxLength={3}
                      value={savedCardCvv}
                      onChange={(e) => setSavedCardCvv(e.target.value)}
                      placeholder="CVV"
                      className="w-16 h-8 text-center bg-surface-container-lowest rounded px-1.5 font-label-md outline-none focus:ring-1 focus:ring-primary shadow-sm border border-outline-variant/40"
                    />
                    <span className="text-[11px] text-outline">3 digits on card back</span>
                  </div>
                </div>
              ) : (
                /* New Card Form */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-container-low rounded-lg">
                  <div className="sm:col-span-2">
                    <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 •••• •••• 8821"
                      className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md border border-outline-variant/40 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                      Valid Thru (MM/YY)
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md border border-outline-variant/40 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="3 or 4 digits"
                      className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md border border-outline-variant/40 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Full Name as printed on card"
                      className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md border border-outline-variant/40 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setUseNewCard(!useNewCard)}
                className="text-primary hover:text-secondary text-body-sm font-semibold text-left self-start cursor-pointer"
              >
                {useNewCard ? '← Use Saved Card' : '+ Use Another Credit or Debit Card'}
              </button>
            </div>
          )}
        </div>

        {/* 3. Net Banking */}
        <div
          className={`rounded-xl transition-all ${
            selectedMethod === 'netbanking'
              ? 'bg-surface-container-low ring-2 ring-primary/40'
              : 'bg-surface-container-low hover:bg-surface-container cursor-pointer'
          }`}
        >
          <div
            onClick={() => onSelectMethod('netbanking')}
            className="p-4 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedMethod === 'netbanking' ? 'border-primary' : 'border-outline-variant'
                }`}
              >
                {selectedMethod === 'netbanking' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className="font-title-md text-on-surface font-semibold">Net Banking</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant font-medium">
              <span>HDFC</span> • <span>ICICI</span> • <span>SBI</span> • <span>Axis</span> • <span>Kotak</span>
            </div>
          </div>

          {selectedMethod === 'netbanking' && (
            <div className="px-5 pb-5 pt-2 flex flex-col gap-3 bg-surface-container-lowest border-t border-outline-variant/15">
              <span className="font-title-sm text-on-surface font-semibold">Select Popular Bank</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`py-2 px-3 rounded-lg text-body-sm font-semibold transition-all cursor-pointer ${
                      selectedBank === bank
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <label className="block text-body-sm text-on-surface-variant mb-1 font-medium">
                  Or choose from all other Indian banks:
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
                >
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="SBI">State Bank of India</option>
                  <option value="Axis">Axis Bank</option>
                  <option value="Kotak">Kotak Mahindra Bank</option>
                  <option value="PNB">Punjab National Bank</option>
                  <option value="BOB">Bank of Baroda</option>
                  <option value="IDFC">IDFC FIRST Bank</option>
                  <option value="Yes">Yes Bank</option>
                  <option value="IndusInd">IndusInd Bank</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 4. EMI / Pay Later */}
        <div
          className={`rounded-xl transition-all ${
            selectedMethod === 'emi'
              ? 'bg-surface-container-low ring-2 ring-primary/40'
              : 'bg-surface-container-low hover:bg-surface-container cursor-pointer'
          }`}
        >
          <div
            onClick={() => onSelectMethod('emi')}
            className="p-4 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedMethod === 'emi' ? 'border-primary' : 'border-outline-variant'
                }`}
              >
                {selectedMethod === 'emi' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div>
                <span className="font-title-md text-on-surface font-semibold">EMI &amp; Pay Later</span>
                <span className="ml-2 bg-surface-container-highest text-secondary text-[11px] font-semibold px-2 py-0.5 rounded">
                  0% No Cost EMI
                </span>
              </div>
            </div>
            <span className="font-body-sm text-primary font-semibold">From ₹4,166/mo</span>
          </div>

          {selectedMethod === 'emi' && (
            <div className="px-5 pb-5 pt-2 flex flex-col gap-3 bg-surface-container-lowest border-t border-outline-variant/15">
              <span className="font-title-sm text-on-surface font-semibold">Choose EMI Duration</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { tenure: '6', monthly: Math.round(totalPayable / 6), interest: '0% No Cost' },
                  { tenure: '12', monthly: Math.round(totalPayable / 12), interest: '0% No Cost' },
                  { tenure: '24', monthly: Math.round(totalPayable / 24), interest: 'Standard EMI' },
                ].map((plan) => (
                  <label
                    key={plan.tenure}
                    onClick={() => setSelectedEmiTenure(plan.tenure)}
                    className={`p-3 rounded-lg cursor-pointer flex flex-col justify-between transition-all ${
                      selectedEmiTenure === plan.tenure
                        ? 'bg-surface-container-low ring-2 ring-primary'
                        : 'bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-title-sm font-bold text-on-surface">
                        {plan.tenure} Months
                      </span>
                      <span className="text-[10px] font-bold text-secondary bg-surface-container-highest px-1.5 py-0.5 rounded">
                        {plan.interest}
                      </span>
                    </div>
                    <span className="font-price-card text-[15px] text-primary font-bold mt-2">
                      ₹{plan.monthly.toLocaleString('en-IN')}/mo
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Cash on Delivery (COD) */}
        <div
          onClick={() => onSelectMethod('cod')}
          className={`rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
            selectedMethod === 'cod'
              ? 'bg-surface-container-low ring-2 ring-primary/40'
              : 'bg-surface-container-low hover:bg-surface-container'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selectedMethod === 'cod' ? 'border-primary' : 'border-outline-variant'
              }`}
            >
              {selectedMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <span className="font-title-md text-on-surface font-semibold">Cash on Delivery (COD)</span>
          </div>
          <span className="text-body-sm text-outline font-medium">SMS OTP verification at delivery</span>
        </div>
      </div>

      {/* Bottom Security Bar */}
      <div className="px-5 md:px-6 py-3.5 bg-surface-container flex flex-wrap items-center justify-between gap-3 text-body-sm text-on-surface-variant border-t border-outline-variant/15">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
          <span>RBI PCI-DSS Level 1 Compliant Transaction</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
          <span>100% OMIZON Purchase Protection Guarantee</span>
        </div>
      </div>
    </section>
  );
};
