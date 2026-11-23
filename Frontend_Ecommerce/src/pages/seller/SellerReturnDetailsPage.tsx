import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  RefreshCw,
  XCircle,
  FileCheck,
  User,
  MapPin,
  Calendar,
  Eye,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { ReturnRequestItem, ReturnStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../utils/format';

export const SellerReturnDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [returnRequest, setReturnRequest] = useState<ReturnRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedRma, setCopiedRma] = useState(false);

  // Review state
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('policy_violation');
  const [reviewNote, setReviewNote] = useState('');

  // Logistics state
  const [carrier, setCarrier] = useState('Delhivery Reverse Logistics');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [logisticsStatus, setLogisticsStatus] = useState<string>('pickup_scheduled');
  const [logisticsNote, setLogisticsNote] = useState('');

  // Inspection form state
  const [itemInspections, setItemInspections] = useState<
    Array<{
      orderItemId: string;
      condition: string;
      disposition: string;
      notes: string;
    }>
  >([]);
  const [generalInspectionNotes, setGeneralInspectionNotes] = useState('');

  // Lightbox preview for customer evidence
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.returns.getById(id);
      const data = res.returnRequest;
      setReturnRequest(data);

      // Initialize logistics form
      if (data.pickupDetails) {
        setCarrier(data.pickupDetails.carrier || 'Delhivery Reverse Logistics');
        setTrackingNumber(data.pickupDetails.trackingNumber || '');
        setLogisticsStatus(data.status === 'approved' ? 'pickup_scheduled' : data.status);
      }

      // Initialize inspection items
      if (data.items) {
        setItemInspections(
          data.items.map((item) => ({
            itemId: item._id || item.orderItemId || '',
            orderItemId: item.orderItemId || item._id || '',
            condition: item.inspection?.condition || 'passed_resellable',
            disposition: item.inspection?.disposition || 'restocked',
            notes: item.inspection?.notes || ''
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load seller return details:', err);
      setError(err.message || 'Return request not found or inaccessible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleCopyRma = () => {
    if (!returnRequest?.rmaNumber) return;
    navigator.clipboard.writeText(returnRequest.rmaNumber);
    setCopiedRma(true);
    setTimeout(() => setCopiedRma(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnRequest) return;
    try {
      setActionLoading(true);
      await api.returns.seller.review(returnRequest._id, {
        action: reviewAction,
        rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
        note: reviewNote
      });
      alert(
        reviewAction === 'approve'
          ? 'RMA approved successfully. Reverse pickup is now authorised.'
          : 'RMA request has been rejected.'
      );
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogisticsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnRequest) return;
    try {
      setActionLoading(true);
      await api.returns.seller.updateLogistics(returnRequest._id, {
        status: logisticsStatus,
        carrier,
        trackingNumber,
        note: logisticsNote
      });
      alert('Reverse logistics details updated.');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update logistics.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectionChange = (index: number, field: string, value: string) => {
    setItemInspections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnRequest) return;
    try {
      setActionLoading(true);
      const payload = itemInspections.map((insp, idx) => ({
        itemId: returnRequest.items[idx]?._id || insp.orderItemId,
        orderItemId: insp.orderItemId,
        condition: insp.condition,
        disposition: insp.disposition,
        notes: insp.notes
      }));
      await api.returns.seller.inspect(returnRequest._id, {
        itemsInspection: payload,
        generalNotes: generalInspectionNotes
      });
      alert(
        'Quality diagnostics submitted. Items marked for restock have been automatically returned to active inventory.'
      );
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to submit inspection.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <RefreshCw className="w-8 h-8 text-electric-violet animate-spin mb-3" />
        <p className="text-sm font-semibold text-ink dark:text-white">Loading RMA details...</p>
      </div>
    );
  }

  if (error || !returnRequest) {
    return (
      <div className="py-16 max-w-lg mx-auto text-center px-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-ink dark:text-white">Return Request Not Found</h2>
        <p className="text-xs text-ink-muted dark:text-lavender-mist/70 mt-1">
          {error || 'The requested RMA record could not be loaded.'}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/seller/returns')}
          className="mt-4 text-xs font-semibold"
        >
          Back to Returns Queue
        </Button>
      </div>
    );
  }

  const isInspected = returnRequest.status === 'inspected' || returnRequest.status === 'completed';

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-16">
      {/* 1. Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <Link
          to="/seller/returns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink dark:text-lavender-mist/70 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Returns Queue
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDetails}
          className="flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={loading ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
          Refresh RMA
        </Button>
      </div>

      {/* 2. Top Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-lavender-mist/60">
              Return Merchandise Authorisation
            </span>
            <Badge variant="neutral" className="font-mono text-xs">
              {returnRequest.rmaNumber}
            </Badge>
            <button
              type="button"
              onClick={handleCopyRma}
              className="p-1 rounded text-ink-muted hover:text-ink dark:text-lavender-mist/60 dark:hover:text-white"
              title="Copy RMA"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copiedRma && <span className="text-[11px] text-emerald-500 font-semibold">Copied!</span>}
          </div>

          <h1 className="text-2xl font-bold text-ink dark:text-white mt-1">
            RMA Details & Diagnostics
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted dark:text-lavender-mist/70 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Requested {formatDate(returnRequest.createdAt)}
            </span>
            <span>•</span>
            <span>
              Order ref: <strong className="text-ink dark:text-white">#{returnRequest.order?.orderNumber || returnRequest.order?._id || 'ORD'}</strong>
            </span>
            <span>•</span>
            <span>
              Total Return Value:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {formatCurrency(returnRequest.totalRefundAmount)}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {returnRequest.status === 'requested' && <Badge variant="warning">Awaiting Seller Review</Badge>}
          {returnRequest.status === 'approved' && <Badge variant="success">Approved / Ready for Pickup</Badge>}
          {returnRequest.status === 'pickup_scheduled' && <Badge variant="primary">Pickup Scheduled</Badge>}
          {returnRequest.status === 'in_transit' && <Badge variant="primary">Reverse Logistics In-Transit</Badge>}
          {returnRequest.status === 'received' && <Badge variant="primary">Received / Needs Inspection</Badge>}
          {returnRequest.status === 'inspected' && <Badge variant="neutral">Inspection Complete</Badge>}
          {returnRequest.status === 'completed' && <Badge variant="success">RMA Completed & Settled</Badge>}
          {returnRequest.status === 'rejected' && <Badge variant="error">Rejected by Merchant</Badge>}
          {returnRequest.status === 'disputed' && <Badge variant="error">Disputed / Escalated</Badge>}
          {returnRequest.status === 'cancelled' && <Badge variant="neutral">Cancelled by Buyer</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items, Reason, Diagnostics (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* A. Returned Items List */}
          <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm">
            <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-electric-violet" />
              Returned Items ({returnRequest.items.length})
            </h2>

            <div className="divide-y divide-lavender-mist/10">
              {returnRequest.items.map((item, idx) => (
                <div key={item._id || idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-porcelain dark:bg-white/10 flex items-center justify-center shrink-0 border border-lavender-mist/10 overflow-hidden">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-ink-muted/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-ink dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-ink-muted dark:text-lavender-mist/60 mt-0.5">
                      Variant: {item.variant || 'Standard'} • Unit: {formatCurrency(item.price)}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      <span className="font-semibold text-ink dark:text-white">
                        Qty to Return: <span className="text-electric-violet font-bold">{item.quantity}</span>
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Refund: {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Inspection results if already completed */}
                    {item.inspection && (
                      <div className="mt-3 p-3 rounded-xl bg-lavender-mist/5 border border-lavender-mist/10 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink dark:text-white">Condition:</span>
                          <span className="capitalize">{item.inspection.condition.replace(/_/g, ' ')}</span>
                          <span>•</span>
                          <span className="font-semibold text-ink dark:text-white">Disposition:</span>
                          <Badge
                            variant={item.inspection.disposition === 'restocked' ? 'success' : 'neutral'}
                            size="sm"
                          >
                            {item.inspection.disposition === 'restocked' ? 'Restocked to Stock' : item.inspection.disposition}
                          </Badge>
                        </div>
                        {item.inspection.notes && (
                          <p className="text-ink-muted dark:text-lavender-mist/70">
                            Notes: "{item.inspection.notes}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. Customer Claim, Reason & Evidence */}
          <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-electric-violet" />
              Customer Claim & Photo Evidence
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-porcelain dark:bg-white/5 border border-lavender-mist/10">
                <span className="text-[10px] font-semibold text-ink-muted dark:text-lavender-mist/60 uppercase">
                  Primary Return Reason
                </span>
                <p className="font-bold text-ink dark:text-white capitalize mt-1">
                  {returnRequest.items[0]?.reason.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-porcelain dark:bg-white/5 border border-lavender-mist/10">
                <span className="text-[10px] font-semibold text-ink-muted dark:text-lavender-mist/60 uppercase">
                  Customer Detailed Comment
                </span>
                <p className="text-ink dark:text-white mt-1 italic">
                  "{returnRequest.items[0]?.customerNotes || returnRequest.items[0]?.comment || 'No specific comment provided.'}"
                </p>
              </div>
            </div>

            {/* Photo Evidence */}
            {returnRequest.items.some((i) => (i.evidenceImages && i.evidenceImages.length > 0) || (i.evidence && i.evidence.length > 0)) ? (
              <div>
                <p className="text-xs font-semibold text-ink dark:text-white mb-2">
                  Uploaded Evidence Photographs:
                </p>
                <div className="flex flex-wrap gap-3">
                  {returnRequest.items.flatMap((i) => i.evidenceImages || i.evidence || []).map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedPhoto(imgUrl)}
                      className="w-24 h-24 rounded-xl border border-lavender-mist/20 overflow-hidden cursor-pointer hover:opacity-90 relative group"
                    >
                      <img src={imgUrl} alt="Return evidence" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-muted dark:text-lavender-mist/60 italic">
                No photo evidence uploaded by customer.
              </p>
            )}
          </div>

          {/* C. Action 1: RMA Review (When Requested) */}
          {returnRequest.status === 'requested' && (
            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-ink dark:text-white">
                  Action Required: Review RMA Request
                </h2>
              </div>
              <p className="text-xs text-ink-muted dark:text-lavender-mist/70">
                Authorise this return request to dispatch a reverse pickup courier, or reject with a documented policy reason.
              </p>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink dark:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="detailsReviewAction"
                      value="approve"
                      checked={reviewAction === 'approve'}
                      onChange={() => setReviewAction('approve')}
                      className="text-electric-violet focus:ring-electric-violet"
                    />
                    Approve Return (Authorise Pickup)
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer">
                    <input
                      type="radio"
                      name="detailsReviewAction"
                      value="reject"
                      checked={reviewAction === 'reject'}
                      onChange={() => setReviewAction('reject')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    Reject Return
                  </label>
                </div>

                {reviewAction === 'reject' && (
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
                      Mandatory Rejection Reason
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2"
                      required
                    >
                      <option value="policy_violation">Return Policy Violation (used/unsealed item)</option>
                      <option value="out_of_warranty">Warranty / 7-Day Window Expired</option>
                      <option value="customer_induced_damage">Physical damage not reported on delivery</option>
                      <option value="missing_accessories_or_tags">Missing Original Box, Tags, or Accessories</option>
                      <option value="serial_mismatch">Serial Number / IMEI Mismatch</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
                    Review Notes / Pickup Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Instructions for reverse pickup courier or explanation for buyer..."
                    className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white p-2.5"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant={reviewAction === 'approve' ? 'primary' : 'danger'}
                    size="sm"
                    disabled={actionLoading}
                    className="text-xs font-bold px-4"
                  >
                    {actionLoading ? 'Submitting...' : reviewAction === 'approve' ? 'Approve & Schedule Pickup' : 'Reject RMA'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* D. Action 2: Reverse Logistics Management */}
          {(returnRequest.status === 'approved' ||
            returnRequest.status === 'pickup_scheduled' ||
            returnRequest.status === 'in_transit') && (
            <div className="p-6 rounded-2xl bg-sky-500/5 border border-sky-500/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-500" />
                <h2 className="text-base font-bold text-ink dark:text-white">
                  Reverse Logistics Dispatch
                </h2>
              </div>
              <p className="text-xs text-ink-muted dark:text-lavender-mist/70">
                Update courier details and advance reverse parcel state from dispatch to warehouse receipt.
              </p>

              <form onSubmit={handleLogisticsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
                      Logistics Stage
                    </label>
                    <select
                      value={logisticsStatus}
                      onChange={(e) => setLogisticsStatus(e.target.value)}
                      className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2"
                    >
                      <option value="pickup_scheduled">Pickup Scheduled</option>
                      <option value="in_transit">In Transit (Picked Up)</option>
                      <option value="received">Received (Delivered to Hub)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
                      Carrier Name
                    </label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
                      Tracking / AWB #
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                    className="text-xs font-bold px-4"
                  >
                    {actionLoading ? 'Updating...' : 'Update Logistics Status'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* E. Action 3: Quality Diagnostics & Stock Replenishment */}
          {(returnRequest.status === 'received' || isInspected) && (
            <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-500" />
                  <h2 className="text-base font-bold text-ink dark:text-white">
                    Quality Diagnostics & Inventory Replenishment
                  </h2>
                </div>
                {isInspected && (
                  <Badge variant="success" size="sm">
                    Inspection Submitted
                  </Badge>
                )}
              </div>
              <p className="text-xs text-ink-muted dark:text-lavender-mist/70">
                Inspect physical returned units. Selecting{' '}
                <strong className="text-emerald-500 font-semibold">Restocked to Stock</strong> will automatically
                replenish active warehouse stock in MongoDB.
              </p>

              <form onSubmit={handleInspectionSubmit} className="space-y-4">
                {returnRequest.items.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    className="p-4 rounded-xl bg-white dark:bg-white/5 border border-lavender-mist/10 space-y-3"
                  >
                    <p className="text-xs font-bold text-ink dark:text-white">
                      Item #{idx + 1}: {item.name} (Qty: {item.quantity})
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-ink dark:text-white mb-1">
                          Diagnostic Condition
                        </label>
                        <select
                          value={itemInspections[idx]?.condition || 'passed_resellable'}
                          onChange={(e) => handleInspectionChange(idx, 'condition', e.target.value)}
                          disabled={isInspected}
                          className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2 disabled:opacity-60"
                        >
                          <option value="passed_resellable">Passed - Resellable / Pristine Condition</option>
                          <option value="damaged_unsellable">Damaged - Unsellable / Physical Damage</option>
                          <option value="wrong_item_returned">Wrong Item Returned</option>
                          <option value="counterfeit">Suspected Counterfeit / Fraud</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-ink dark:text-white mb-1">
                          Inventory Disposition
                        </label>
                        <select
                          value={itemInspections[idx]?.disposition || 'restocked'}
                          onChange={(e) => handleInspectionChange(idx, 'disposition', e.target.value)}
                          disabled={isInspected}
                          className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2 disabled:opacity-60"
                        >
                          <option value="restocked">Restock to Active Warehouse Inventory</option>
                          <option value="scrapped">Scrap / Write-off / Liquidate</option>
                          <option value="disputed">Hold & Raise Seller Dispute</option>
                          <option value="held">Hold for Quarantine / Investigation</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-ink dark:text-white mb-1">
                        Diagnostic Findings / Serial Check
                      </label>
                      <input
                        type="text"
                        value={itemInspections[idx]?.notes || ''}
                        onChange={(e) => handleInspectionChange(idx, 'notes', e.target.value)}
                        disabled={isInspected}
                        placeholder="e.g. Serial verified, sealed box unopened, packaging clean"
                        className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2 disabled:opacity-60"
                      />
                    </div>
                  </div>
                ))}

                {!isInspected && (
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
                      Overall Inspection Summary & Clearance Notes
                    </label>
                    <textarea
                      rows={2}
                      value={generalInspectionNotes}
                      onChange={(e) => setGeneralInspectionNotes(e.target.value)}
                      placeholder="Inspection sign-off notes..."
                      className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white p-2.5"
                    />
                  </div>
                )}

                {!isInspected && (
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={actionLoading}
                      className="text-xs font-bold px-5 bg-electric-violet hover:bg-electric-violet/90 text-white"
                    >
                      {actionLoading ? 'Saving...' : 'Submit Diagnostics & Complete RMA'}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* F. Dispute Notice (If Disputed) */}
          {returnRequest.disputeDetails?.isDisputed && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Dispute Escalation Active</h3>
              </div>
              <p className="text-xs text-ink dark:text-white">
                Reason: {returnRequest.disputeDetails.reason}
              </p>
              {returnRequest.disputeDetails.adminDecision && (
                <p className="text-xs text-ink-muted dark:text-lavender-mist/70">
                  Admin Resolution: <strong>{returnRequest.disputeDetails.adminDecision}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Customer Details, Pickup Address, Escrow/Refund, Audit Log (1 col) */}
        <div className="space-y-6">
          {/* 1. Buyer & Pickup Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-ink dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-electric-violet" />
              Customer & Address
            </h3>

            <div className="text-xs space-y-2">
              <div>
                <span className="text-ink-muted dark:text-lavender-mist/60 text-[11px]">Customer:</span>
                <p className="font-bold text-ink dark:text-white">
                  {returnRequest.customer?.username || 'Customer'}
                </p>
                <p className="text-ink-muted dark:text-lavender-mist/70">
                  {returnRequest.customer?.email}
                </p>
              </div>

              <div className="pt-2 border-t border-lavender-mist/10">
                <span className="text-ink-muted dark:text-lavender-mist/60 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Pickup Address:
                </span>
                <p className="font-medium text-ink dark:text-white mt-0.5">
                  {returnRequest.pickupDetails?.address?.fullName}
                </p>
                <p className="text-ink-muted dark:text-lavender-mist/70">
                  {returnRequest.pickupDetails?.address?.addressLine}
                </p>
                <p className="text-ink-muted dark:text-lavender-mist/70">
                  {returnRequest.pickupDetails?.address?.city},{' '}
                  {returnRequest.pickupDetails?.address?.state} -{' '}
                  {returnRequest.pickupDetails?.address?.postalCode}
                </p>
                <p className="text-ink-muted dark:text-lavender-mist/70">
                  Phone: {returnRequest.pickupDetails?.address?.phone}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Escrow & Refund Monitoring Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-ink dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-electric-violet" />
              Refund & Escrow Status
            </h3>

            <div className="text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-lavender-mist/60">Disbursement Status:</span>
                <Badge
                  variant={
                    returnRequest.refundDetails?.status === 'completed'
                      ? 'success'
                      : returnRequest.refundDetails?.status === 'processing'
                      ? 'primary'
                      : 'warning'
                  }
                >
                  {returnRequest.refundDetails?.status || 'Pending Review'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-lavender-mist/60">Refund Method:</span>
                <span className="font-semibold text-ink dark:text-white">
                  {returnRequest.refundMethod?.paymentMethod === 'cod'
                    ? 'COD Bank Transfer'
                    : 'Original Razorpay Gateway'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-lavender-mist/60">Total Value:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(returnRequest.totalRefundAmount)}
                </span>
              </div>

              {returnRequest.refundDetails?.gatewayRefundId && (
                <div className="pt-2 border-t border-lavender-mist/10">
                  <span className="text-[10px] text-ink-muted dark:text-lavender-mist/60 uppercase">
                    Razorpay Refund ID
                  </span>
                  <p className="font-mono text-ink dark:text-white">
                    {returnRequest.refundDetails.gatewayRefundId}
                  </p>
                </div>
              )}

              {returnRequest.refundDetails?.bankReferenceNumber && (
                <div className="pt-2 border-t border-lavender-mist/10">
                  <span className="text-[10px] text-ink-muted dark:text-lavender-mist/60 uppercase">
                    Bank UTR Reference
                  </span>
                  <p className="font-mono text-ink dark:text-white">
                    {returnRequest.refundDetails.bankReferenceNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Sequential Audit History */}
          <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-ink dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-electric-violet" />
              RMA Audit History
            </h3>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-lavender-mist/20">
              {returnRequest.statusHistory?.map((log, i) => (
                <div key={i} className="relative pl-6 text-xs">
                  <span className="absolute left-1 top-1 w-2 h-2 rounded-full bg-electric-violet -translate-x-1/2" />
                  <p className="font-semibold text-ink dark:text-white capitalize">
                    {log.status.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-ink-muted dark:text-lavender-mist/50">
                    By <span className="font-semibold capitalize">{log.role}</span> • {formatDate(log.timestamp)}
                  </p>
                  {log.note && (
                    <p className="text-[11px] text-ink-muted dark:text-lavender-mist/70 italic mt-0.5">
                      "{log.note}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative">
            <img src={selectedPhoto} alt="Zoomed evidence" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
