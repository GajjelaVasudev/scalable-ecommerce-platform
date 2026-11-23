import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  Filter,
  Eye,
  Sliders,
  DollarSign,
  Send,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api';
import { ReturnRequestItem, ReturnStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../utils/format';

export const AdminReturnsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'all' | 'disputes' | 'refunds' | 'audit') || 'all';

  const [activeTab, setActiveTab] = useState<'all' | 'disputes' | 'refunds' | 'audit'>(initialTab);
  const [returns, setReturns] = useState<ReturnRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedRma, setCopiedRma] = useState<string | null>(null);

  // Modals
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequestItem | null>(null);

  // Dispute resolution modal state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeDecision, setDisputeDecision] = useState<'upheld_buyer' | 'upheld_seller' | 'settled_split'>('upheld_buyer');
  const [disputeAdminNotes, setDisputeAdminNotes] = useState('');

  // COD confirmation modal state
  const [codModalOpen, setCodModalOpen] = useState(false);
  const [codBankReference, setCodBankReference] = useState('');
  const [codNotes, setCodNotes] = useState('');

  // Gateway refund trigger state
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);

  // Evidence preview lightbox
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Sync tab with URL
  const handleTabChange = (tab: 'all' | 'disputes' | 'refunds' | 'audit') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchPlatformReturns = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        limit: 100,
        search: search.trim() || undefined
      };

      if (activeTab === 'disputes') {
        params.disputeOnly = true;
      } else if (activeTab === 'refunds') {
        // Look for returns awaiting refund or with refund details
        params.status = statusFilter !== 'all' ? statusFilter : undefined;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await api.returns.admin.getList(params);
      setReturns(res.returns || []);
    } catch (err: any) {
      console.error('Failed to load platform returns:', err);
      setError(err.message || 'Unable to retrieve returns. Please check platform health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformReturns();
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlatformReturns();
  };

  const handleCopyRma = (rma: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rma);
    setCopiedRma(rma);
    setTimeout(() => setCopiedRma(null), 2000);
  };

  // Open Dispute Resolution Modal
  const openDisputeModal = (ret: ReturnRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReturn(ret);
    setDisputeDecision('upheld_buyer');
    setDisputeAdminNotes('');
    setDisputeModalOpen(true);
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    try {
      setActionLoading(true);
      await api.returns.admin.resolveDispute(selectedReturn._id, {
        decision: disputeDecision,
        adminNotes: disputeAdminNotes,
        action: disputeDecision === 'upheld_buyer' ? 'approve' : 'reject'
      });
      alert('Dispute adjudicated successfully. Notifications dispatched to buyer and seller.');
      setDisputeModalOpen(false);
      await fetchPlatformReturns();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open COD confirmation modal
  const openCodModal = (ret: ReturnRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReturn(ret);
    setCodBankReference('');
    setCodNotes('');
    setCodModalOpen(true);
  };

  const handleCodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    try {
      setActionLoading(true);
      await api.returns.admin.confirmCODTransfer(selectedReturn._id, {
        bankReferenceNumber: codBankReference,
        notes: codNotes
      });
      alert('COD Bank Transfer confirmed. Refund state transitioned to completed.');
      setCodModalOpen(false);
      await fetchPlatformReturns();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm COD bank transfer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Gateway refund trigger
  const openGatewayModal = (ret: ReturnRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReturn(ret);
    setGatewayModalOpen(true);
  };

  const handleGatewayRefundSubmit = async () => {
    if (!selectedReturn) return;
    try {
      setActionLoading(true);
      await api.returns.admin.triggerGatewayRefund(selectedReturn._id);
      alert('Online refund instruction sent to payment gateway.');
      setGatewayModalOpen(false);
      await fetchPlatformReturns();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger gateway refund.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter calculations
  const totalCount = returns.length;
  const disputeCount = returns.filter((r) => r.disputeDetails?.isDisputed).length;
  const pendingCodCount = returns.filter(
    (r) => r.refundMethod?.paymentMethod === 'cod' && r.refundDetails?.status !== 'completed'
  ).length;
  const totalRefundVolume = returns.reduce((acc, curr) => acc + (curr.totalRefundAmount || 0), 0);

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
        return <Badge variant="primary">Received / Inspecting</Badge>;
      case 'inspected':
        return <Badge variant="neutral">Inspection Complete</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'disputed':
        return <Badge variant="error">Disputed / Escalated</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-lavender-mist/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-electric-violet/10 dark:bg-electric-violet/20 text-electric-violet border border-electric-violet/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">
                Platform Returns & RMA Governance
              </h1>
              <p className="text-xs text-ink-muted dark:text-lavender-mist/70 mt-0.5">
                Supervise cross-merchant reverse logistics, adjudicate buyer disputes, and audit refund disbursements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlatformReturns}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={loading ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Platform KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm">
          <p className="text-[11px] font-semibold text-ink-muted dark:text-lavender-mist/60 uppercase tracking-wider">
            Active Returns
          </p>
          <p className="text-2xl font-bold text-ink dark:text-white mt-1">{totalCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Disputes Pending
            </p>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">{disputeCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              COD Payout Queue
            </p>
            <Building className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{pendingCodCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Refund Volume
            </p>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {formatCurrency(totalRefundVolume)}
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-lavender-mist/10 pb-1">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-electric-violet text-white shadow-sm'
              : 'text-ink-muted hover:text-ink dark:text-lavender-mist/70 dark:hover:text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> All RMAs Master Queue
        </button>

        <button
          onClick={() => handleTabChange('disputes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'disputes'
              ? 'bg-electric-violet text-white shadow-sm'
              : 'text-ink-muted hover:text-ink dark:text-lavender-mist/70 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Dispute Resolution Hub
          {disputeCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
              {disputeCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('refunds')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'refunds'
              ? 'bg-electric-violet text-white shadow-sm'
              : 'text-ink-muted hover:text-ink dark:text-lavender-mist/70 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Refund Ledger & COD Payouts
        </button>
      </div>

      {/* 4. Search and Status Filter Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm">
        {activeTab !== 'disputes' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'requested', label: 'Requested' },
              { id: 'in_transit', label: 'In Transit' },
              { id: 'received', label: 'Received' },
              { id: 'inspected', label: 'Inspected' },
              { id: 'completed', label: 'Completed' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'disputed', label: 'Disputed' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-electric-violet text-white'
                    : 'text-ink-muted hover:text-ink dark:text-lavender-mist/70 hover:bg-lavender-mist/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="relative min-w-[260px] ml-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-lavender-mist/50" />
          <input
            type="text"
            placeholder="Search RMA, Order, Seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white focus:outline-none focus:ring-1 focus:ring-electric-violet"
          />
        </form>
      </div>

      {/* 5. Main Table Content */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-lavender-mist/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-electric-violet animate-spin mb-3" />
            <p className="text-sm font-semibold text-ink dark:text-white">Retrieving platform RMA logs...</p>
          </div>
        ) : error ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-sm font-semibold text-ink dark:text-white">{error}</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <Package className="w-12 h-12 text-ink-muted/40 dark:text-lavender-mist/30 mb-3" />
            <h3 className="text-base font-bold text-ink dark:text-white">No records found</h3>
            <p className="text-xs text-ink-muted dark:text-lavender-mist/60 max-w-sm mt-1">
              There are no return requests matching this view criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-lavender-mist/10 bg-lavender-mist/5 text-ink-muted dark:text-lavender-mist/60 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">RMA & Date</th>
                  <th className="py-3.5 px-4">Seller Merchant</th>
                  <th className="py-3.5 px-4">Buyer & Order</th>
                  <th className="py-3.5 px-4">Items Claimed</th>
                  <th className="py-3.5 px-4">Refund Amount & Method</th>
                  <th className="py-3.5 px-4 text-center">RMA Status</th>
                  <th className="py-3.5 px-4 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender-mist/10">
                {returns.map((ret) => {
                  const firstItem = ret.items[0];
                  const totalItems = ret.items.reduce((acc, curr) => acc + curr.quantity, 0);
                  const isCOD = ret.refundMethod?.paymentMethod === 'cod';
                  const isOnline = !isCOD;

                  return (
                    <tr key={ret._id} className="hover:bg-lavender-mist/5 transition-colors">
                      {/* RMA */}
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
                      </td>

                      {/* Seller */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-ink dark:text-white">
                          {ret.seller?.username || ret.seller?.storeName || 'Merchant'}
                        </span>
                        <p className="text-[10px] text-ink-muted dark:text-lavender-mist/60">
                          ID: {ret.seller?._id ? ret.seller._id.slice(-6) : 'MERCH'}
                        </p>
                      </td>

                      {/* Buyer & Order */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-semibold text-ink dark:text-white">
                          #{ret.order?.orderNumber || ret.order?._id || 'ORD'}
                        </p>
                        <p className="text-[11px] text-ink-muted dark:text-lavender-mist/60 mt-0.5">
                          {ret.customer?.username || ret.customer?.email || 'Buyer'}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <p className="font-medium text-ink dark:text-white truncate">{firstItem?.name}</p>
                        <p className="text-[11px] text-ink-muted dark:text-lavender-mist/60">
                          {totalItems} item{totalItems > 1 ? 's' : ''} • Reason: {firstItem?.reason.replace(/_/g, ' ')}
                        </p>
                      </td>

                      {/* Refund Amount & Method */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(ret.totalRefundAmount)}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-ink-muted dark:text-lavender-mist/60">
                          {isCOD ? (
                            <>
                              <Building className="w-3 h-3" /> COD Bank Transfer
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3 h-3" /> Razorpay Online
                            </>
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(ret.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dispute mediation action */}
                          {ret.disputeDetails?.isDisputed && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={(e) => openDisputeModal(ret, e)}
                              className="h-7 text-xs font-bold px-2.5"
                            >
                              Adjudicate
                            </Button>
                          )}

                          {/* COD Bank Payout confirmation */}
                          {isCOD && ret.refundDetails?.status !== 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => openCodModal(ret, e)}
                              className="h-7 text-xs font-bold px-2.5 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                            >
                              Confirm UTR
                            </Button>
                          )}

                          {/* Online Gateway Refund trigger */}
                          {isOnline &&
                            ret.refundDetails?.status !== 'completed' &&
                            ret.status === 'inspected' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => openGatewayModal(ret, e)}
                                className="h-7 text-xs font-bold px-2.5 text-electric-violet border-electric-violet/40 hover:bg-electric-violet/10"
                              >
                                Trigger Gateway
                              </Button>
                            )}

                          {/* Lightbox / Evidence inspection if photos exist */}
                          {ret.items.some((i) => (i.evidenceImages && i.evidenceImages.length > 0) || (i.evidence && i.evidence.length > 0)) && (
                            <button
                              type="button"
                              onClick={() => setSelectedEvidence(ret.items.flatMap((i) => i.evidenceImages || i.evidence || [])[0])}
                              className="p-1.5 rounded-lg text-ink-muted hover:text-ink dark:text-lavender-mist/60 dark:hover:text-white"
                              title="Inspect Customer Evidence Photo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
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

      {/* 6. Dispute Resolution Modal */}
      <Modal
        isOpen={disputeModalOpen}
        onClose={() => !actionLoading && setDisputeModalOpen(false)}
        title="Adjudicate Customer Dispute"
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4">
          <p className="text-xs text-ink-muted dark:text-lavender-mist/70">
            Adjudicating dispute for RMA{' '}
            <strong className="text-ink dark:text-white font-mono">{selectedReturn?.rmaNumber}</strong>.
          </p>

          <div className="p-3 rounded-xl bg-lavender-mist/5 border border-lavender-mist/10 text-xs space-y-1">
            <p>
              <strong className="text-ink dark:text-white">Customer Claim:</strong>{' '}
              {selectedReturn?.disputeDetails?.reason || 'Merchant rejected claim unfairly'}
            </p>
            {selectedReturn?.rejectionReason && (
              <p>
                <strong className="text-rose-500">Merchant Rejection Reason:</strong>{' '}
                {selectedReturn.rejectionReason}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
              Arbitration Decision
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="upheld_buyer"
                  checked={disputeDecision === 'upheld_buyer'}
                  onChange={() => setDisputeDecision('upheld_buyer')}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                Uphold Buyer Claim (Overrule Merchant, Authorise Return / Refund)
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="upheld_seller"
                  checked={disputeDecision === 'upheld_seller'}
                  onChange={() => setDisputeDecision('upheld_seller')}
                  className="text-rose-500 focus:ring-rose-500"
                />
                Uphold Merchant Defense (Deny Claim, Close Dispute)
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="settled_split"
                  checked={disputeDecision === 'settled_split'}
                  onChange={() => setDisputeDecision('settled_split')}
                  className="text-sky-500 focus:ring-sky-500"
                />
                Settled Split (OMIZON Platform Goodwill Concession)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
              Mandatory Arbitration Findings / Rationale
            </label>
            <textarea
              rows={3}
              value={disputeAdminNotes}
              onChange={(e) => setDisputeAdminNotes(e.target.value)}
              placeholder="State the regulatory / policy grounds for this determination..."
              className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white p-2.5"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-lavender-mist/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDisputeModalOpen(false)}
              disabled={actionLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={actionLoading}
              className="text-xs font-bold bg-electric-violet text-white"
            >
              {actionLoading ? 'Adjudicating...' : 'Submit Final Resolution'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. COD Bank Transfer Confirmation Modal */}
      <Modal
        isOpen={codModalOpen}
        onClose={() => !actionLoading && setCodModalOpen(false)}
        title="Confirm COD Bank Payout (NEFT / IMPS / UPI)"
      >
        <form onSubmit={handleCodSubmit} className="space-y-4">
          <p className="text-xs text-ink-muted dark:text-lavender-mist/70">
            Record manual bank transfer / UPI disbursement for RMA{' '}
            <strong className="text-ink dark:text-white font-mono">{selectedReturn?.rmaNumber}</strong>.
          </p>

          {/* Masked Bank Details */}
          <div className="p-3 rounded-xl bg-porcelain dark:bg-white/5 border border-lavender-mist/10 text-xs space-y-1.5">
            <p className="font-bold text-ink dark:text-white">Customer Destination Coordinates:</p>
            {selectedReturn?.refundMethod?.codBankDetails?.accountNumberMasked ? (
              <>
                <p>
                  <span className="text-ink-muted dark:text-lavender-mist/60">Account Holder:</span>{' '}
                  <strong className="text-ink dark:text-white">
                    {selectedReturn.refundMethod.codBankDetails.accountHolderName}
                  </strong>
                </p>
                <p>
                  <span className="text-ink-muted dark:text-lavender-mist/60">Account Number:</span>{' '}
                  <strong className="font-mono text-ink dark:text-white">
                    {selectedReturn.refundMethod.codBankDetails.accountNumberMasked}
                  </strong>
                </p>
                <p>
                  <span className="text-ink-muted dark:text-lavender-mist/60">IFSC Code:</span>{' '}
                  <strong className="font-mono text-ink dark:text-white">
                    {selectedReturn.refundMethod.codBankDetails.ifsc}
                  </strong>{' '}
                  ({selectedReturn.refundMethod.codBankDetails.bankName || 'Verified Bank'})
                </p>
              </>
            ) : selectedReturn?.refundMethod?.codBankDetails?.upiId ? (
              <p>
                <span className="text-ink-muted dark:text-lavender-mist/60">UPI VPA:</span>{' '}
                <strong className="font-mono text-ink dark:text-white">
                  {selectedReturn.refundMethod.codBankDetails.upiId}
                </strong>
              </p>
            ) : (
              <p className="text-amber-500 italic">No bank coordinates provided by customer.</p>
            )}

            <div className="pt-2 border-t border-lavender-mist/10 flex items-center justify-between font-bold">
              <span>Disbursement Amount:</span>
              <span className="text-emerald-500 font-extrabold text-sm">
                {formatCurrency(selectedReturn?.totalRefundAmount || 0)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
              Bank Reference / UTR Number (Mandatory)
            </label>
            <input
              type="text"
              value={codBankReference}
              onChange={(e) => setCodBankReference(e.target.value)}
              placeholder="e.g. UTR-9821410491 or IMPS reference"
              className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-white mb-1">
              Internal Payout Audit Notes
            </label>
            <input
              type="text"
              value={codNotes}
              onChange={(e) => setCodNotes(e.target.value)}
              placeholder="e.g. Approved via HDFC Corporate Banking portal"
              className="w-full text-xs rounded-lg border border-lavender-mist/20 bg-porcelain dark:bg-white/5 text-ink dark:text-white px-3 py-2"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-lavender-mist/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCodModalOpen(false)}
              disabled={actionLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={actionLoading}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {actionLoading ? 'Recording...' : 'Confirm Bank Payout'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Trigger Gateway Refund Modal */}
      <Modal
        isOpen={gatewayModalOpen}
        onClose={() => !actionLoading && setGatewayModalOpen(false)}
        title="Trigger Online Gateway Refund"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-muted dark:text-lavender-mist/70">
            Issue genuine Razorpay refund instruction for RMA{' '}
            <strong className="text-ink dark:text-white font-mono">{selectedReturn?.rmaNumber}</strong> for{' '}
            <strong className="text-emerald-500 font-bold">
              {formatCurrency(selectedReturn?.totalRefundAmount || 0)}
            </strong>.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-lavender-mist/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGatewayModalOpen(false)}
              disabled={actionLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleGatewayRefundSubmit}
              disabled={actionLoading}
              className="text-xs font-bold bg-electric-violet text-white"
            >
              {actionLoading ? 'Transmitting...' : 'Dispatch Gateway Instruction'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Evidence Lightbox */}
      {selectedEvidence && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedEvidence(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative">
            <img src={selectedEvidence} alt="Evidence photo" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            <button
              onClick={() => setSelectedEvidence(null)}
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
