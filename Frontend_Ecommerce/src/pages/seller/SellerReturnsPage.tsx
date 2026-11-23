import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  RefreshCw,
  XCircle,
  FileCheck,
  Eye,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { ReturnRequestItem, ReturnStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../utils/format';

export const SellerReturnsPage: React.FC = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<ReturnRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    requested: 0,
    inTransit: 0,
    received: 0,
    completed: 0,
    disputed: 0
  });

  // Modal states for quick actions
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequestItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('policy_violation');
  const [reviewNote, setReviewNote] = useState('');

  const [logisticsModalOpen, setLogisticsModalOpen] = useState(false);
  const [logisticsCarrier, setLogisticsCarrier] = useState('Delhivery Reverse Logistics');
  const [logisticsTracking, setLogisticsTracking] = useState('');
  const [logisticsStatus, setLogisticsStatus] = useState<string>('pickup_scheduled');
  const [logisticsNote, setLogisticsNote] = useState('');

  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [copiedRma, setCopiedRma] = useState<string | null>(null);

  const fetchSellerReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.returns.seller.getList({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
        limit: 50
      });
      const list = res.returns || [];
      setReturns(list);

      // Compute stats
      setStats({
        total: res.pagination?.total || list.length,
        requested: list.filter((r) => r.status === 'requested').length,
        inTransit: list.filter((r) => r.status === 'in_transit' || r.status === 'pickup_scheduled').length,
        received: list.filter((r) => r.status === 'received').length,
        completed: list.filter((r) => r.status === 'completed').length,
        disputed: list.filter((r) => r.disputeDetails?.isDisputed || r.status === 'disputed').length
      });
    } catch (err: any) {
      console.error('Failed to load seller returns:', err);
      setError(err.message || 'Failed to retrieve returns. Please check your network or try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerReturns();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSellerReturns();
  };

  const handleCopyRma = (rma: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rma);
    setCopiedRma(rma);
    setTimeout(() => setCopiedRma(null), 2000);
  };

  const openReviewModal = (ret: ReturnRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReturn(ret);
    setReviewAction('approve');
    setRejectionReason('policy_violation');
    setReviewNote('');
    setReviewModalOpen(true);
  };

  const openLogisticsModal = (ret: ReturnRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReturn(ret);
    setLogisticsCarrier(ret.pickupDetails?.carrier || 'Delhivery Reverse Logistics');
    setLogisticsTracking(ret.pickupDetails?.trackingNumber || '');
    setLogisticsStatus(ret.status === 'approved' ? 'pickup_scheduled' : 'in_transit');
    setLogisticsNote('');
    setLogisticsModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    try {
      setActionSubmitting(true);
      await api.returns.seller.review(selectedReturn._id, {
        action: reviewAction,
        rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
        note: reviewNote
      });
      setReviewModalOpen(false);
      await fetchSellerReturns();
    } catch (err: any) {
      alert(err.message || 'Failed to update review status.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleLogisticsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    try {
      setActionSubmitting(true);
      await api.returns.seller.updateLogistics(selectedReturn._id, {
        status: logisticsStatus,
        carrier: logisticsCarrier,
        trackingNumber: logisticsTracking,
        note: logisticsNote
      });
      setLogisticsModalOpen(false);
      await fetchSellerReturns();
    } catch (err: any) {
      alert(err.message || 'Failed to update logistics status.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case 'requested':
        return <Badge variant="warning">Awaiting Review</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pickup_scheduled':
        return <Badge variant="primary">Pickup Scheduled</Badge>;
      case 'in_transit':
        return <Badge variant="primary">In Transit</Badge>;
      case 'received':
        return <Badge variant="primary">Received / Quality Inspection</Badge>;
      case 'inspected':
        return <Badge variant="neutral">Inspection Complete</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'disputed':
        return <Badge variant="error">Disputed / Under Mediation</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-lavender-mist/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-electric-violet/10 dark:bg-electric-violet/20 text-electric-violet border border-electric-violet/20">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">
                Returns & RMA Operations
              </h1>
              <p className="text-xs text-ink-muted dark:text-lavender-mist/70 mt-0.5">
                Process customer returns, dispatch reverse pickups, perform quality inspections, and oversee restocks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSellerReturns}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={loading ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm">
          <p className="text-[11px] font-semibold text-ink-muted dark:text-lavender-mist/60 uppercase tracking-wider">
            Total RMAs
          </p>
          <p className="text-2xl font-bold text-ink dark:text-white mt-1">{stats.total}</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Pending Review
            </p>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{stats.requested}</p>
        </div>

        <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
              Reverse In-Transit
            </p>
            <Truck className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-sky-700 dark:text-sky-300 mt-1">{stats.inTransit}</p>
        </div>

        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Needs Inspection
            </p>
            <FileCheck className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{stats.received}</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Completed
            </p>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{stats.completed}</p>
        </div>

        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Disputed
            </p>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">{stats.disputed}</p>
        </div>
      </div>

      {/* 3. Search & Status Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {[
            { id: 'all', label: 'All RMAs' },
            { id: 'requested', label: 'Awaiting Review' },
            { id: 'in_transit', label: 'In Transit' },
            { id: 'received', label: 'Needs Inspection' },
            { id: 'completed', label: 'Completed' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'disputed', label: 'Disputed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-electric-violet text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink dark:text-lavender-mist/70 dark:hover:text-white hover:bg-lavender-mist/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-lavender-mist/50" />
          <input
            type="text"
            placeholder="Search RMA # or Order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white focus:outline-none focus:ring-1 focus:ring-electric-violet"
          />
        </form>
      </div>

      {/* 4. RMA Data Table */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-electric-violet animate-spin mb-3" />
            <p className="text-sm font-semibold text-ink dark:text-white">Loading returns queue...</p>
          </div>
        ) : error ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-sm font-semibold text-ink dark:text-white">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSellerReturns} className="mt-3 text-xs">
              Retry
            </Button>
          </div>
        ) : returns.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <Package className="w-12 h-12 text-ink-muted/40 dark:text-lavender-mist/30 mb-3" />
            <h3 className="text-base font-bold text-ink dark:text-white">No return requests found</h3>
            <p className="text-xs text-ink-muted dark:text-lavender-mist/60 max-w-sm mt-1">
              There are currently no return requests matching your selected filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-lavender-mist/10 bg-lavender-mist/5 text-ink-muted dark:text-lavender-mist/60 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">RMA & Date</th>
                  <th className="py-3.5 px-4">Order & Buyer</th>
                  <th className="py-3.5 px-4">Returned Items</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Logistics</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender-mist/10">
                {returns.map((ret) => {
                  const firstItem = ret.items[0];
                  const totalItems = ret.items.reduce((acc, curr) => acc + curr.quantity, 0);

                  return (
                    <tr
                      key={ret._id}
                      onClick={() => navigate(`/seller/returns/${ret._id}`)}
                      className="hover:bg-lavender-mist/5 transition-colors cursor-pointer"
                    >
                      {/* RMA & Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-electric-violet">{ret.rmaNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyRma(ret.rmaNumber, e)}
                            className="p-1 rounded text-ink-muted hover:text-ink dark:text-lavender-mist/50 dark:hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[11px] text-ink-muted dark:text-lavender-mist/50 mt-0.5">
                          {formatDate(ret.createdAt)}
                        </p>
                        {ret.status === 'requested' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                            <Clock className="w-3 h-3" /> SLA: 48h to review
                          </span>
                        )}
                      </td>

                      {/* Order & Buyer */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-semibold text-ink dark:text-white">
                          #{ret.order?.orderNumber || ret.order?._id || 'ORD'}
                        </p>
                        <p className="text-[11px] text-ink-muted dark:text-lavender-mist/60 mt-0.5">
                          {ret.customer?.username || ret.customer?.email || 'Customer'}
                        </p>
                      </td>

                      {/* Returned Items */}
                      <td className="py-4 px-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-ink dark:text-white truncate">
                            {firstItem?.name || 'Item'}
                          </p>
                          <p className="text-[11px] text-ink-muted dark:text-lavender-mist/60">
                            {totalItems} item{totalItems > 1 ? 's' : ''} • {formatCurrency(ret.totalRefundAmount)}
                          </p>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <p className="font-medium text-ink dark:text-white truncate">
                          {ret.items[0]?.reason.replace(/_/g, ' ')}
                        </p>
                        {(ret.items[0]?.customerNotes || ret.items[0]?.comment) && (
                          <p className="text-[11px] text-ink-muted dark:text-lavender-mist/60 truncate mt-0.5">
                            "{ret.items[0].customerNotes || ret.items[0].comment}"
                          </p>
                        )}
                      </td>

                      {/* Logistics */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {ret.pickupDetails?.trackingNumber ? (
                          <div>
                            <p className="font-mono text-ink dark:text-white">
                              {ret.pickupDetails.trackingNumber}
                            </p>
                            <p className="text-[10px] text-ink-muted dark:text-lavender-mist/60">
                              {ret.pickupDetails.carrier || 'Logistics'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-ink-muted/50 dark:text-lavender-mist/40 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(ret.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {ret.status === 'requested' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => openReviewModal(ret, e)}
                              className="h-7 text-xs font-semibold px-2.5"
                            >
                              Review RMA
                            </Button>
                          )}

                          {(ret.status === 'approved' || ret.status === 'pickup_scheduled') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => openLogisticsModal(ret, e)}
                              className="h-7 text-xs font-semibold px-2.5"
                            >
                              Logistics
                            </Button>
                          )}

                          {ret.status === 'received' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/seller/returns/${ret._id}`)}
                              className="h-7 text-xs font-semibold px-2.5 bg-electric-violet hover:bg-electric-violet/90 text-white"
                            >
                              Inspect & Restock
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/seller/returns/${ret._id}`)}
                            className="h-7 w-7 p-0 text-ink-muted hover:text-ink dark:text-lavender-mist/60 dark:hover:text-white"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Review RMA Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => !actionSubmitting && setReviewModalOpen(false)}
        title="Review RMA Request"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <p className="text-xs text-ink-muted dark:text-lavender-mist/70">
            Authorise or reject customer return request for RMA{' '}
            <strong className="text-ink dark:text-white font-mono">{selectedReturn?.rmaNumber}</strong>.
          </p>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink dark:text-white cursor-pointer">
              <input
                type="radio"
                name="action"
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
                name="action"
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
                Rejection Reason (Mandatory)
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2"
                required
              >
                <option value="policy_violation">Return Policy Violation (e.g. used/unsealed)</option>
                <option value="out_of_warranty">Warranty / Return Window Expired</option>
                <option value="customer_induced_damage">Physical damage not reported on delivery</option>
                <option value="missing_accessories_or_tags">Missing Original Box, Tags, or Accessories</option>
                <option value="serial_mismatch">Serial Number / IMEI Mismatch</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
              Internal & Customer Notes
            </label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Provide context or instructions for pickup/rejection..."
              className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white p-2.5 focus:ring-1 focus:ring-electric-violet"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-lavender-mist/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
              disabled={actionSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              size="sm"
              disabled={actionSubmitting}
              className="text-xs font-bold"
            >
              {actionSubmitting ? 'Updating...' : reviewAction === 'approve' ? 'Approve & Schedule' : 'Reject RMA'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Logistics Dispatch Modal */}
      <Modal
        isOpen={logisticsModalOpen}
        onClose={() => !actionSubmitting && setLogisticsModalOpen(false)}
        title="Reverse Logistics Dispatch"
      >
        <form onSubmit={handleLogisticsSubmit} className="space-y-4">
          <p className="text-xs text-ink-muted dark:text-lavender-mist/70">
            Assign logistics carrier and update shipment status for{' '}
            <strong className="text-ink dark:text-white font-mono">{selectedReturn?.rmaNumber}</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
              Logistics Status
            </label>
            <select
              value={logisticsStatus}
              onChange={(e) => setLogisticsStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2"
            >
              <option value="pickup_scheduled">Pickup Scheduled (Courier Dispatched)</option>
              <option value="in_transit">In Transit (Courier Picked Up Parcel)</option>
              <option value="received">Received (Delivered to Merchant Warehouse)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
              Reverse Courier Carrier
            </label>
            <input
              type="text"
              value={logisticsCarrier}
              onChange={(e) => setLogisticsCarrier(e.target.value)}
              className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2"
              placeholder="e.g. Delhivery Reverse, BlueDart Surface, Shadowfax"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
              Tracking / AWB Number
            </label>
            <input
              type="text"
              value={logisticsTracking}
              onChange={(e) => setLogisticsTracking(e.target.value)}
              className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2 font-mono"
              placeholder="AWB tracking number"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
              Dispatch Note
            </label>
            <input
              type="text"
              value={logisticsNote}
              onChange={(e) => setLogisticsNote(e.target.value)}
              className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2"
              placeholder="Optional notes for fulfillment crew"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-lavender-mist/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLogisticsModalOpen(false)}
              disabled={actionSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={actionSubmitting}
              className="text-xs font-bold"
            >
              {actionSubmitting ? 'Saving...' : 'Update Logistics'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
