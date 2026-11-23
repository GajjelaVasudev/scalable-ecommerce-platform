import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AccountLayout } from '../../components/account/AccountLayout';
import { api } from '../../services/api';
import { OrderEligibilityResponse, OrderEligibilityItem } from '../../types';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  CreditCard,
  Building,
  Truck,
  ChevronRight,
  ArrowLeft,
  Info,
  Package,
  ShieldCheck,
  Clock
} from 'lucide-react';

const RETURN_REASONS = [
  { code: 'DEFECTIVE_DAMAGED', label: 'Defective, damaged, or broken item', requiresEvidence: true },
  { code: 'WRONG_ITEM', label: 'Wrong item or size delivered', requiresEvidence: true },
  { code: 'NOT_AS_DESCRIBED', label: 'Item does not match website description or pictures', requiresEvidence: false },
  { code: 'QUALITY_UNSATISFACTORY', label: 'Quality of material/product is unsatisfactory', requiresEvidence: false },
  { code: 'SIZE_FIT_ISSUE', label: 'Size or fit does not suit me', requiresEvidence: false },
  { code: 'MISSING_PARTS', label: 'Missing accessories, parts, or manuals', requiresEvidence: true },
  { code: 'ARRIVED_LATE', label: 'Arrived too late / No longer needed', requiresEvidence: false }
];

export const NewReturnRequestPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderEligibility, setOrderEligibility] = useState<OrderEligibilityResponse | null>(null);

  // Form selections: key `${productId}:${variant}`
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: {
      selected: boolean;
      quantity: number;
      reason: string;
      customerNotes: string;
      evidenceImages: string[];
    };
  }>({});

  // Pickup Details
  const [pickupAddress, setPickupAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  const [pickupInstructions, setPickupInstructions] = useState('');

  // COD Bank Details
  const [codBankDetails, setCodBankDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    upiId: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchEligibility = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.returns.getEligibility(orderId);
        setOrderEligibility(data);

        // Initialize selections
        const initialSelections: Record<string, any> = {};
        for (const item of data.eligibility.items) {
          const prodId = item.product?._id || item.product;
          const key = `${prodId}:${item.variant}`;
          initialSelections[key] = {
            selected: item.isEligible && item.eligibleQuantity > 0,
            quantity: Math.min(1, item.eligibleQuantity),
            reason: RETURN_REASONS[0].code,
            customerNotes: '',
            evidenceImages: []
          };
        }
        setSelectedItems(initialSelections);
      } catch (err: any) {
        console.error('Failed to load order return eligibility:', err);
        setError(err.message || 'Unable to check return eligibility for this order.');
      } finally {
        setLoading(false);
      }
    };

    fetchEligibility();
  }, [orderId]);

  const handleItemSelectToggle = (key: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        selected: !prev[key]?.selected
      }
    }));
  };

  const handleQuantityChange = (key: string, qty: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantity: qty
      }
    }));
  };

  const handleReasonChange = (key: string, reason: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        reason
      }
    }));
  };

  const handleNotesChange = (key: string, notes: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        customerNotes: notes
      }
    }));
  };

  // Image Upload handler
  const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await api.returns.uploadEvidence(base64Data, file.type);
          setSelectedItems(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              evidenceImages: [...(prev[key]?.evidenceImages || []), res.url]
            }
          }));
        } catch (uploadErr: any) {
          alert(uploadErr.message || 'Failed to upload photo');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Image read error:', err);
    }
  };

  const handleRemoveImage = (key: string, imgUrl: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        evidenceImages: (prev[key]?.evidenceImages || []).filter(url => url !== imgUrl)
      }
    }));
  };

  // Calculate estimated refund
  const isCOD = orderEligibility?.paymentMethod === 'COD';
  const selectedEntries = Object.entries(selectedItems).filter(([_, val]) => val.selected);

  let totalRefundEstimate = 0;
  if (orderEligibility) {
    for (const [key, val] of selectedEntries) {
      const item = orderEligibility.eligibility.items.find(
        it => `${it.product?._id || it.product}:${it.variant}` === key
      );
      if (item) {
        totalRefundEstimate += item.price * val.quantity;
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedEntries.length === 0) {
      setFormError('Please select at least one item to return');
      return;
    }

    // Validate evidence requirements
    for (const [key, val] of selectedEntries) {
      const reasonObj = RETURN_REASONS.find(r => r.code === val.reason);
      if (reasonObj?.requiresEvidence && (!val.evidenceImages || val.evidenceImages.length === 0)) {
        setFormError(`Photo evidence is required when returning item for reason: "${reasonObj.label}"`);
        return;
      }
    }

    // COD validation
    if (isCOD) {
      if (!codBankDetails.accountHolderName.trim() && !codBankDetails.upiId.trim()) {
        setFormError('Please provide Bank Account Details or UPI ID to receive your COD refund');
        return;
      }
      if (codBankDetails.accountNumber && codBankDetails.accountNumber !== codBankDetails.confirmAccountNumber) {
        setFormError('Bank Account Number and Confirmation Account Number do not match');
        return;
      }
    }

    try {
      setSubmitting(true);
      const itemsPayload = selectedEntries.map(([key, val]) => {
        const item = orderEligibility?.eligibility.items.find(
          it => `${it.product?._id || it.product}:${it.variant}` === key
        );
        return {
          product: item?.product?._id || item?.product,
          variant: item?.variant || 'default',
          quantity: val.quantity,
          reason: val.reason,
          customerNotes: val.customerNotes,
          evidenceImages: val.evidenceImages
        };
      });

      const res = await api.returns.create({
        orderId,
        items: itemsPayload,
        pickupAddress: pickupAddress.fullName ? pickupAddress : undefined,
        pickupInstructions,
        refundMethod: isCOD ? (codBankDetails.upiId ? 'COD_UPI' : 'COD_BANK_TRANSFER') : 'ORIGINAL_GATEWAY',
        codBankDetails: isCOD ? codBankDetails : undefined
      });

      // Redirect to confirmation page of the first created return
      if (res.returns && res.returns.length > 0) {
        navigate(`/account/returns/confirmation/${res.returns[0]._id}`);
      } else {
        navigate('/account/returns');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setFormError(err.message || 'Failed to submit return request. Please review your selections.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AccountLayout activeKey="returns">
        <div className="p-8 text-center bg-surface-container-lowest dark:bg-card-dark rounded-xl border border-surface-container animate-pulse">
          <RotateCcw className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
          <h3 className="text-base font-semibold text-on-surface">Inspecting Order Return Eligibility...</h3>
        </div>
      </AccountLayout>
    );
  }

  if (error || !orderEligibility) {
    return (
      <AccountLayout activeKey="returns">
        <div className="p-8 text-center bg-surface-container-lowest dark:bg-card-dark rounded-xl border border-error/20">
          <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-lg font-bold text-on-surface mb-2">Order Not Eligible for Return</h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">{error}</p>
          <Link
            to="/account/orders"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Orders</span>
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout activeKey="returns">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header Title & Breadcrumb */}
        <div>
          <div className="flex items-center gap-1 text-xs text-outline font-medium mb-1">
            <Link to="/account/returns" className="hover:underline">My Returns</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Order #{orderId?.slice(-8)}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary font-semibold">Initiate Return</span>
          </div>
          <h1 className="text-2xl font-bold font-space text-on-surface tracking-tight">
            Select Items to Return
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Choose which items and quantities you want to return. Return window expires on{' '}
            <strong className="text-on-surface font-semibold">
              {new Date(orderEligibility.eligibility.returnDeadline).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </strong>.
          </p>
        </div>

        {formError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-error rounded-xl border border-red-200 dark:border-red-800 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Action Required</h4>
              <p className="text-xs mt-0.5">{formError}</p>
            </div>
          </div>
        )}

        {/* 1. Item Selection Checklist */}
        <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl shadow-sm border border-surface-container overflow-hidden">
          <div className="p-5 border-b border-surface-container flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">1. Choose Items & Quantities</h3>
            <span className="text-xs text-outline font-medium">
              {selectedEntries.length} of {orderEligibility.eligibility.items.length} item(s) selected
            </span>
          </div>

          <div className="divide-y divide-surface-container">
            {orderEligibility.eligibility.items.map((item, idx) => {
              const prodId = item.product?._id || item.product;
              const key = `${prodId}:${item.variant}`;
              const selection = selectedItems[key] || {
                selected: false,
                quantity: 1,
                reason: RETURN_REASONS[0].code,
                customerNotes: '',
                evidenceImages: []
              };
              const isReasonEvidenceRequired = RETURN_REASONS.find(r => r.code === selection.reason)?.requiresEvidence;

              return (
                <div key={idx} className={`p-6 transition-colors ${selection.selected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id={`chk-${key}`}
                      checked={selection.selected}
                      disabled={!item.isEligible}
                      onChange={() => handleItemSelectToggle(key)}
                      className="mt-1.5 w-4 h-4 text-primary rounded border-outline focus:ring-primary cursor-pointer disabled:opacity-30"
                    />

                    <div className="w-20 h-20 rounded-lg bg-surface-container-low dark:bg-card-dark-secondary overflow-hidden shrink-0 border border-surface-container flex items-center justify-center">
                      {item.product?.image ? (
                        <img src={item.product.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-outline" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <label htmlFor={`chk-${key}`} className="font-semibold text-sm text-on-surface cursor-pointer line-clamp-1">
                          {item.name}
                        </label>
                        <span className="text-base font-bold font-space text-on-surface shrink-0">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-outline mt-1">
                        <span>Variant: <strong className="text-on-surface font-medium">{item.variant || 'Standard'}</strong></span>
                        <span>•</span>
                        <span>Purchased: {item.purchasedQuantity} unit(s)</span>
                        <span>•</span>
                        <span>Eligible: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{item.eligibleQuantity} unit(s)</strong></span>
                      </div>

                      {!item.isEligible && (
                        <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{item.reason || 'This item cannot be returned'}</span>
                        </div>
                      )}

                      {/* Detail inputs when selected */}
                      {selection.selected && (
                        <div className="mt-4 pt-4 border-t border-surface-container/60 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Quantity Selector */}
                            <div>
                              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                                Return Quantity
                              </label>
                              <select
                                value={selection.quantity}
                                onChange={(e) => handleQuantityChange(key, parseInt(e.target.value, 10))}
                                className="w-full p-2 bg-surface-container-lowest dark:bg-card-dark rounded-lg text-sm text-on-surface border border-surface-container outline-none"
                              >
                                {Array.from({ length: item.eligibleQuantity }, (_, i) => i + 1).map(num => (
                                  <option key={num} value={num}>
                                    {num} unit{num > 1 ? 's' : ''} (₹{(item.price * num).toLocaleString('en-IN')})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Return Reason Dropdown */}
                            <div>
                              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                                Reason for Return
                              </label>
                              <select
                                value={selection.reason}
                                onChange={(e) => handleReasonChange(key, e.target.value)}
                                className="w-full p-2 bg-surface-container-lowest dark:bg-card-dark rounded-lg text-sm text-on-surface border border-surface-container outline-none"
                              >
                                {RETURN_REASONS.map(r => (
                                  <option key={r.code} value={r.code}>
                                    {r.label} {r.requiresEvidence ? '*(Photo Required)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Customer Notes */}
                          <div>
                            <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                              Detailed Description / Fault Description
                            </label>
                            <textarea
                              rows={2}
                              value={selection.customerNotes}
                              onChange={(e) => handleNotesChange(key, e.target.value)}
                              placeholder="Please describe any defects, wrong items sent, or specifics..."
                              className="w-full p-2.5 bg-surface-container-lowest dark:bg-card-dark rounded-lg text-xs text-on-surface border border-surface-container outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>

                          {/* Photo Evidence Upload */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                                Photo Evidence {isReasonEvidenceRequired && <span className="text-error">*Required</span>}
                              </label>
                              <span className="text-[11px] text-outline">Max 5 photos (up to 5MB each)</span>
                            </div>

                            <div className="flex items-center flex-wrap gap-3">
                              {/* Uploaded Thumbnails */}
                              {(selection.evidenceImages || []).map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="w-16 h-16 rounded-lg border border-surface-container relative overflow-hidden group">
                                  <img src={imgUrl} alt="Evidence" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(key, imgUrl)}
                                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}

                              {/* Upload Button */}
                              {(selection.evidenceImages || []).length < 5 && (
                                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-surface-container flex flex-col items-center justify-center text-outline hover:text-primary hover:border-primary transition-colors cursor-pointer">
                                  <Upload className="w-5 h-5 mb-0.5" />
                                  <span className="text-[9px] font-semibold">Upload</span>
                                  <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(key, e)}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Reverse Pickup Details */}
        <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl shadow-sm border border-surface-container p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-on-surface">2. Reverse Courier Pickup Location</h3>
          </div>

          <div className="bg-surface-container-low dark:bg-card-dark-secondary rounded-lg p-4 text-xs text-on-surface-variant flex items-start gap-3 mb-4">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>
              Our reverse courier partner will pick up the package from this address within 1 to 2 business days after seller approval. Please keep items in their original packaging with all tags attached.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
              Pickup Instructions (Optional)
            </label>
            <input
              type="text"
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
              placeholder="e.g. Call 10 mins before arrival, deliver to security reception"
              className="w-full p-2.5 bg-surface-container-lowest dark:bg-card-dark rounded-lg text-xs text-on-surface border border-surface-container outline-none"
            />
          </div>
        </div>

        {/* 3. Refund Method & Settlement */}
        <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl shadow-sm border border-surface-container p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-on-surface">3. Refund Reimbursement Method</h3>
          </div>

          {!isCOD ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Original Payment Method Reimbursement</h4>
                <p className="mt-0.5">
                  Your payment was completed online ({orderEligibility.paymentMethod}). Once returned items pass physical quality inspection, your refund of{' '}
                  <strong>₹{totalRefundEstimate.toLocaleString('en-IN')}</strong> will be reversed directly to your source account/card via Razorpay within 3–5 banking days.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
                <Building className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Cash on Delivery (COD) Bank Settlement</h4>
                  <p className="mt-0.5">
                    For Cash on Delivery orders, refunds are disbursed directly to your verified bank account via IMPS/NEFT or UPI after items pass quality inspection.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={codBankDetails.accountHolderName}
                    onChange={(e) => setCodBankDetails({ ...codBankDetails, accountHolderName: e.target.value })}
                    placeholder="Full name as per bank records"
                    className="w-full p-2.5 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-xs text-on-surface border border-surface-container outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={codBankDetails.bankName}
                    onChange={(e) => setCodBankDetails({ ...codBankDetails, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank, State Bank of India"
                    className="w-full p-2.5 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-xs text-on-surface border border-surface-container outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={codBankDetails.accountNumber}
                    onChange={(e) => setCodBankDetails({ ...codBankDetails, accountNumber: e.target.value })}
                    placeholder="Bank Account Number"
                    className="w-full p-2.5 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-xs text-on-surface border border-surface-container outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={codBankDetails.confirmAccountNumber}
                    onChange={(e) => setCodBankDetails({ ...codBankDetails, confirmAccountNumber: e.target.value })}
                    placeholder="Re-enter Bank Account Number"
                    className="w-full p-2.5 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-xs text-on-surface border border-surface-container outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={codBankDetails.ifsc}
                    onChange={(e) => setCodBankDetails({ ...codBankDetails, ifsc: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    className="w-full p-2.5 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-xs text-on-surface border border-surface-container outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                    Or Instant UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={codBankDetails.upiId}
                    onChange={(e) => setCodBankDetails({ ...codBankDetails, upiId: e.target.value })}
                    placeholder="username@bank"
                    className="w-full p-2.5 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-xs text-on-surface border border-surface-container outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Final Review & Submission Bar */}
        <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl shadow-sm border border-surface-container p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-outline uppercase font-semibold tracking-wider block">
              Estimated Total Reimbursement
            </span>
            <div className="text-3xl font-bold font-space text-primary mt-0.5">
              ₹{totalRefundEstimate.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-on-surface-variant">
              Across {selectedEntries.length} selected item(s)
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/account/orders"
              className="px-5 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || selectedEntries.length === 0}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Submitting RMA Request...</span>
                </>
              ) : (
                <>
                  <span>Submit Return Request</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </AccountLayout>
  );
};

export default NewReturnRequestPage;
