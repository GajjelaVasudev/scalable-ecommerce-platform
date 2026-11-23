import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AccountLayout } from '../../components/account/AccountLayout';
import { api } from '../../services/api';
import { ReturnRequestItem, ReturnStatus } from '../../types';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertTriangle,
  Copy,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  Building,
  ShieldAlert,
  FileCheck,
  XCircle,
  HelpCircle,
  MapPin,
  Calendar,
  Printer
} from 'lucide-react';

export const ReturnTrackingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [returnDoc, setReturnDoc] = useState<ReturnRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Dispute modal state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer changed mind');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const fetchReturnDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.returns.getById(id);
      setReturnDoc(res.returnRequest);
    } catch (err: any) {
      console.error('Failed to load return details:', err);
      setError(err.message || 'Unable to load return tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnDetails();
  }, [id]);

  const copyRma = () => {
    if (!returnDoc?.rmaNumber) return;
    navigator.clipboard.writeText(returnDoc.rmaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !disputeReason.trim()) return;

    try {
      setDisputeSubmitting(true);
      await api.returns.dispute(id, { reason: disputeReason.trim() });
      setDisputeModalOpen(false);
      setDisputeReason('');
      await fetchReturnDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to submit dispute');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const handleCancelReturn = async () => {
    if (!id) return;
    try {
      setCancelSubmitting(true);
      await api.returns.cancel(id, cancelReason);
      setCancelModalOpen(false);
      await fetchReturnDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel return');
    } finally {
      setCancelSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AccountLayout activeKey="returns">
        <div className="p-12 text-center bg-surface-container-lowest dark:bg-card-dark rounded-xl border border-surface-container animate-pulse">
          <RotateCcw className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
          <h3 className="text-base font-semibold text-on-surface">Loading RMA Logistics Tracking...</h3>
        </div>
      </AccountLayout>
    );
  }

  if (error || !returnDoc) {
    return (
      <AccountLayout activeKey="returns">
        <div className="p-8 text-center bg-surface-container-lowest dark:bg-card-dark rounded-xl border border-error/20">
          <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-lg font-bold text-on-surface mb-2">Return Record Not Found</h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">{error}</p>
          <Link
            to="/account/returns"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Returns Hub</span>
          </Link>
        </div>
      </AccountLayout>
    );
  }

  const isCancellable = ['requested', 'under_review', 'approved'].includes(returnDoc.status);
  const isRejected = returnDoc.status === 'rejected';
  const isDisputed = returnDoc.status === 'disputed' || returnDoc.disputeDetails?.isDisputed;

  return (
    <AccountLayout activeKey="returns">
      <div className="flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div>
          <div className="flex items-center gap-1 text-xs text-outline font-medium mb-1">
            <Link to="/account/returns" className="hover:underline">My Returns Hub</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>RMA #{returnDoc.rmaNumber}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary font-semibold">Live Tracking & Inspection</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-space text-on-surface tracking-tight">
                  {returnDoc.rmaNumber}
                </h1>
                <button
                  onClick={copyRma}
                  className="p-1 text-outline hover:text-primary transition-colors rounded"
                  title="Copy RMA Number"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Linked to Order #{returnDoc.order?.trackingNumber || String(returnDoc.order?._id || returnDoc.order).slice(-8)} • Merchant:{' '}
                <strong className="text-on-surface">{returnDoc.seller?.storeName || returnDoc.seller?.name || 'OMIZON Seller'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-lg bg-surface-container-low dark:bg-card-dark-secondary text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors inline-flex items-center gap-1.5 border border-surface-container"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print RMA Slip</span>
              </button>

              {isCancellable && (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-error text-xs font-semibold hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Return</span>
                </button>
              )}

              {isRejected && !isDisputed && (
                <button
                  onClick={() => setDisputeModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Dispute Decision</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dispute Status Banner if active */}
        {isDisputed && (
          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800 text-xs text-orange-900 dark:text-orange-300">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Dispute Under Platform Review</h4>
                <p className="mt-0.5">
                  Reason: <em>"{returnDoc.disputeDetails?.reason}"</em>
                </p>
                {returnDoc.disputeDetails?.adminDecision && returnDoc.disputeDetails.adminDecision !== 'pending' && (
                  <p className="mt-1 font-bold">
                    Admin Resolution: {returnDoc.disputeDetails.adminDecision.replace('_', ' ').toUpperCase()} — {returnDoc.disputeDetails.adminNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Notice if rejected */}
        {isRejected && !isDisputed && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-300">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Return Request Rejected by Merchant</h4>
                <p className="mt-0.5">
                  Reason given: <em>"{returnDoc.rejectionReason || 'Item does not meet merchant return policy criteria'}"</em>
                </p>
                <p className="mt-2 text-xs">
                  If you believe this decision is in error, you may submit a dispute for independent review by OMIZON Platform Trust & Safety.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Layout: Tracking Timeline (Left) & Logistics / Refund Info (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Chronological Audit Trail (7 cols) */}
          <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-card-dark rounded-xl shadow-sm border border-surface-container p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-outline mb-6 flex items-center justify-between">
              <span>Chronological RMA Milestones</span>
              <span className="text-xs text-primary font-mono">{returnDoc.status.toUpperCase()}</span>
            </h3>

            {/* Vertical Milestones Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container">
              {returnDoc.statusHistory.map((hist, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-on-surface capitalize">
                        {hist.status.replace('_', ' ')}
                      </h4>
                      <span className="text-[11px] text-outline">
                        {new Date(hist.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <span className="text-[11px] text-primary uppercase font-semibold">
                      Role: {hist.role}
                    </span>
                    {hist.note && (
                      <p className="text-xs text-on-surface-variant mt-1 bg-surface-container-low dark:bg-card-dark-secondary p-2.5 rounded-lg border border-surface-container/60">
                        {hist.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Reverse Logistics, Items & Refund Reconciliation (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Reverse Logistics Pickup Card */}
            <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl shadow-sm border border-surface-container p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-3 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-primary" />
                <span>Reverse Courier Pickup</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-outline shrink-0 mt-0.5" />
                  <div>
                    <span className="text-outline block">Scheduled Pickup Date:</span>
                    <span className="text-on-surface font-semibold">
                      {returnDoc.pickupDetails?.scheduledDate
                        ? new Date(returnDoc.pickupDetails.scheduledDate).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Awaiting scheduling after merchant review'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-outline shrink-0 mt-0.5" />
                  <div>
                    <span className="text-outline block">Carrier & Reverse AWB:</span>
                    <span className="text-on-surface font-semibold">
                      {returnDoc.pickupDetails?.carrier || 'OMIZON Logistics'}
                    </span>
                    {returnDoc.pickupDetails?.trackingNumber && (
                      <span className="block font-mono text-primary font-bold">
                        AWB: {returnDoc.pickupDetails.trackingNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-surface-container">
                  <MapPin className="w-4 h-4 text-outline shrink-0 mt-0.5" />
                  <div>
                    <span className="text-outline block">Pickup Address:</span>
                    <p className="text-on-surface font-medium leading-relaxed">
                      {returnDoc.pickupDetails?.address?.fullName && (
                        <strong>{returnDoc.pickupDetails.address.fullName} • {returnDoc.pickupDetails.address.phone}<br /></strong>
                      )}
                      {returnDoc.pickupDetails?.address?.addressLine}, {returnDoc.pickupDetails?.address?.city}, {returnDoc.pickupDetails?.address?.state} - {returnDoc.pickupDetails?.address?.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Reconciliation Card */}
            <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl shadow-sm border border-surface-container p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-3 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Refund Reconciliation</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-outline">Refund Amount:</span>
                  <span className="text-base font-bold font-space text-primary">
                    ₹{returnDoc.totalRefundAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-outline">Refund Status:</span>
                  <span className={`font-semibold capitalize px-2 py-0.5 rounded ${
                    returnDoc.refundDetails?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : returnDoc.refundDetails?.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {returnDoc.refundDetails?.status || 'Pending Inspection'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 pt-2 border-t border-surface-container">
                  <span className="text-outline">Settlement Target:</span>
                  <span className="font-medium text-right text-on-surface">
                    {returnDoc.refundMethod?.type === 'ORIGINAL_GATEWAY' ? (
                      'Original Payment Gateway (Razorpay)'
                    ) : (
                      `COD Bank Transfer (${returnDoc.refundMethod?.codBankDetails?.bankName || 'Direct NEFT/IMPS'})`
                    )}
                  </span>
                </div>

                {returnDoc.refundDetails?.gatewayRefundId && (
                  <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                    <span className="text-outline">Gateway Refund ID:</span>
                    <span className="font-mono font-bold text-on-surface">
                      {returnDoc.refundDetails.gatewayRefundId}
                    </span>
                  </div>
                )}

                {returnDoc.refundDetails?.bankReferenceNumber && (
                  <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                    <span className="text-outline">Bank UTR Reference:</span>
                    <span className="font-mono font-bold text-on-surface">
                      {returnDoc.refundDetails.bankReferenceNumber}
                    </span>
                  </div>
                )}

                {returnDoc.refundDetails?.completedAt && (
                  <div className="flex items-center justify-between pt-2 border-t border-surface-container text-emerald-700 dark:text-emerald-400 font-medium">
                    <span>Disbursed On:</span>
                    <span>{new Date(returnDoc.refundDetails.completedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Returned Items Inspection Summary */}
            <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl shadow-sm border border-surface-container p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-3 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-primary" />
                <span>Inspection & Disposition</span>
              </h3>

              <div className="divide-y divide-surface-container text-xs">
                {returnDoc.items.map((it, idx) => (
                  <div key={idx} className="py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-on-surface line-clamp-1">{it.name}</span>
                      <span className="text-outline shrink-0">Qty: {it.quantity}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-outline">Condition:</span>
                      <span className={`font-semibold capitalize ${
                        it.inspection?.condition === 'passed_resellable'
                          ? 'text-emerald-600'
                          : it.inspection?.condition === 'damaged_unsellable'
                          ? 'text-error'
                          : 'text-outline'
                      }`}>
                        {it.inspection?.condition ? it.inspection.condition.replace('_', ' ') : 'Pending Diagnostic'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Raise Dispute Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl max-w-md w-full p-6 shadow-xl border border-surface-container">
            <h3 className="text-lg font-bold text-on-surface mb-1">Raise Return Dispute</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Disputes are escalated directly to the OMIZON Platform Mediation Board. Our team will review photos, merchant logs, and reverse delivery scans.
            </p>

            <form onSubmit={handleRaiseDispute}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                  Detailed Reason for Dispute *
                </label>
                <textarea
                  required
                  rows={4}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why you disagree with the merchant's rejection or inspection..."
                  className="w-full p-2.5 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-xs text-on-surface border border-surface-container outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeSubmitting || !disputeReason.trim()}
                  className="px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {disputeSubmitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl max-w-md w-full p-6 shadow-xl border border-surface-container">
            <h3 className="text-lg font-bold text-on-surface mb-2">Cancel Return Request</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Are you sure you want to cancel this return? Any scheduled reverse courier pickup will be cancelled.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                Cancellation Reason
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-sm text-on-surface border border-surface-container outline-none"
              >
                <option value="Customer changed mind">Customer changed mind / keeping item</option>
                <option value="Resolved issue directly with merchant">Resolved issue directly with merchant</option>
                <option value="Submitted in error">Submitted in error</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={handleCancelReturn}
                className="px-4 py-2 bg-error text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default ReturnTrackingDetailsPage;
