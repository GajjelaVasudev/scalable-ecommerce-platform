import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AccountLayout } from '../../components/account/AccountLayout';
import { api } from '../../services/api';
import { ReturnRequestItem, ReturnStatus } from '../../types';
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
  FileCheck
} from 'lucide-react';

export const MyReturnsPage: React.FC = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<ReturnRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReturnForCancel, setSelectedReturnForCancel] = useState<ReturnRequestItem | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of mind / keeping product');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedRma, setCopiedRma] = useState<string | null>(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.returns.getMyReturns({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        limit: 50
      });
      setReturns(res.returns || []);
    } catch (err: any) {
      console.error('Failed to load customer returns:', err);
      setError(err.message || 'Unable to load returns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReturns();
  };

  const copyToClipboard = (rma: string) => {
    navigator.clipboard.writeText(rma);
    setCopiedRma(rma);
    setTimeout(() => setCopiedRma(null), 2000);
  };

  const handleCancelReturn = async () => {
    if (!selectedReturnForCancel) return;
    try {
      setActionLoading(true);
      await api.returns.cancel(selectedReturnForCancel._id, cancelReason);
      setCancelModalOpen(false);
      setSelectedReturnForCancel(null);
      await fetchReturns();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel return request');
    } finally {
      setActionLoading(false);
    }
  };

  // Metric aggregates
  const totalCount = returns.length;
  const awaitingCount = returns.filter(r => ['requested', 'under_review'].includes(r.status)).length;
  const inProgressCount = returns.filter(r => ['approved', 'pickup_scheduled', 'in_transit', 'received', 'inspected'].includes(r.status)).length;
  const completedCount = returns.filter(r => r.status === 'completed' || r.refundDetails?.status === 'completed').length;
  const totalRefundAmount = returns
    .filter(r => r.status === 'completed' || r.refundDetails?.status === 'completed')
    .reduce((sum, r) => sum + (r.refundDetails?.amount || r.totalRefundAmount || 0), 0);

  // Status mapping helper
  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case 'requested':
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
            Awaiting Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            Seller Approved
          </span>
        );
      case 'pickup_scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-fixed">
            <Truck className="w-3.5 h-3.5" />
            Pickup Scheduled
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300">
            <Truck className="w-3.5 h-3.5 animate-bounce" />
            In Transit
          </span>
        );
      case 'received':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300">
            <Package className="w-3.5 h-3.5" />
            Warehouse Received
          </span>
        );
      case 'inspected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-900 dark:bg-teal-900/30 dark:text-teal-300">
            <FileCheck className="w-3.5 h-3.5" />
            Inspection Completed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Refund Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="w-3.5 h-3.5" />
            Return Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Cancelled
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Under Admin Dispute
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // 5-step stepper calculation
  const getStepProgress = (status: ReturnStatus) => {
    switch (status) {
      case 'requested':
      case 'under_review':
        return 1;
      case 'approved':
        return 2;
      case 'pickup_scheduled':
      case 'in_transit':
        return 3;
      case 'received':
      case 'inspected':
        return 4;
      case 'completed':
        return 5;
      default:
        return 1;
    }
  };

  return (
    <AccountLayout activeKey="returns">
      <div className="flex flex-col gap-6">
        {/* Header Title & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-outline font-medium mb-1">
              <span>Account</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Orders & Fulfillment</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-primary font-semibold">My Returns & RMAs</span>
            </div>
            <h1 className="text-2xl font-bold font-space text-on-surface tracking-tight">
              My Returns Hub
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Track, inspect, and manage return requests, reverse courier logistics, and refund reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/account/orders"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Initiate New Return</span>
            </Link>
          </div>
        </div>

        {/* 4-Up Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest dark:bg-card-dark p-5 rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-outline">
                Total Requests
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-container-low dark:bg-card-dark-secondary flex items-center justify-center text-primary">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-on-surface">{totalCount} Returns</div>
              <p className="text-xs text-on-surface-variant mt-1">Lifetime historical RMA volume</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest dark:bg-card-dark p-5 rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-outline">
                Awaiting Approval
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-on-surface flex items-center gap-2">
                <span>{awaitingCount} Requests</span>
                {awaitingCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
                Merchant SLA under review
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-lowest dark:bg-card-dark p-5 rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-outline">
                In Reverse Logistics
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-on-surface">{inProgressCount} Packages</div>
              <p className="text-xs text-on-surface-variant mt-1">Scheduled or in courier transit</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-surface-container-lowest dark:bg-card-dark p-5 rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-outline">
                Refunds Completed
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-on-surface">{completedCount} Completed</div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                ₹{totalRefundAmount.toLocaleString('en-IN')} disbursed
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-surface-container-lowest dark:bg-card-dark p-4 rounded-xl shadow-sm border border-surface-container flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Search by RMA Number, Product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 border border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchReturns();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-xs"
              >
                Clear
              </button>
            )}
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'requested', label: 'Requested' },
              { id: 'approved', label: 'Approved' },
              { id: 'in_transit', label: 'In Transit' },
              { id: 'inspected', label: 'Inspected' },
              { id: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-card-dark-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Returns List View */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-surface-container-lowest dark:bg-card-dark p-6 rounded-xl border border-surface-container animate-pulse space-y-4">
                <div className="h-6 bg-surface-container-low dark:bg-card-dark-secondary rounded w-1/3"></div>
                <div className="h-24 bg-surface-container-low dark:bg-card-dark-secondary rounded"></div>
                <div className="h-10 bg-surface-container-low dark:bg-card-dark-secondary rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-surface-container-lowest dark:bg-card-dark rounded-xl border border-error/20">
            <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3" />
            <h3 className="text-base font-semibold text-on-surface mb-1">Failed to load returns</h3>
            <p className="text-sm text-on-surface-variant mb-4">{error}</p>
            <button
              onClick={fetchReturns}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest dark:bg-card-dark rounded-xl border border-surface-container">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-1">No return requests found</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'No returns match your current filter criteria. Try adjusting your search query or status.'
                : 'You have not submitted any return requests. All eligible orders can be returned within 15 days of delivery.'}
            </p>
            <Link
              to="/account/orders"
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container inline-flex items-center gap-1.5 shadow-sm"
            >
              <span>View My Orders</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {returns.map(ret => {
              const currentStep = getStepProgress(ret.status);
              const isCancellable = ['requested', 'under_review', 'approved'].includes(ret.status);

              return (
                <div
                  key={ret._id}
                  className="bg-surface-container-lowest dark:bg-card-dark rounded-xl shadow-sm border border-surface-container overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card Header Bar */}
                  <div className="bg-surface-container-low dark:bg-card-dark-secondary px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-surface-container">
                    <div className="flex items-center flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="uppercase tracking-wider font-semibold text-outline">RMA:</span>
                        <span className="font-mono font-bold text-on-surface">{ret.rmaNumber}</span>
                        <button
                          onClick={() => copyToClipboard(ret.rmaNumber)}
                          className="text-outline hover:text-primary transition-colors p-0.5 rounded"
                          title="Copy RMA Number"
                        >
                          {copiedRma === ret.rmaNumber ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <span className="text-outline">•</span>

                      <div>
                        <span className="text-outline">Order: </span>
                        <Link
                          to={`/account/orders/${ret.order?._id || ret.order}`}
                          className="font-medium text-primary hover:underline"
                        >
                          #{ret.order?.trackingNumber || String(ret.order?._id || ret.order).slice(-8)}
                        </Link>
                      </div>

                      <span className="text-outline">•</span>

                      <div className="text-on-surface-variant">
                        Requested on <span className="font-medium text-on-surface">{new Date(ret.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div>{getStatusBadge(ret.status)}</div>
                  </div>

                  {/* Card Content Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Products List (5 cols) */}
                      <div className="lg:col-span-5 space-y-4">
                        {ret.items.map((it, idx) => (
                          <div key={idx} className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-lg bg-surface-container-low dark:bg-card-dark-secondary overflow-hidden shrink-0 border border-surface-container flex items-center justify-center relative">
                              {it.image ? (
                                <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-8 h-8 text-outline" />
                              )}
                              <span className="absolute bottom-1 right-1 bg-surface/90 text-on-surface text-[10px] font-mono px-1 py-0.2 rounded font-semibold">
                                Qty: {it.quantity}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                                  {ret.seller?.storeName || ret.seller?.name || 'Verified Merchant'}
                                </span>
                                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <h4 className="text-sm font-semibold text-on-surface line-clamp-1">{it.name}</h4>
                              <p className="text-xs text-outline mt-0.5">Variant: {it.variant || 'Standard'}</p>

                              <div className="mt-2 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg p-2 text-xs">
                                <span className="text-[10px] uppercase font-semibold text-outline block mb-0.5">
                                  Return Reason
                                </span>
                                <span className="text-error font-medium flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span className="line-clamp-1">{it.reason}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Refund Value & Method (3 cols) */}
                      <div className="lg:col-span-3 bg-surface-container-low/60 dark:bg-card-dark-secondary/40 rounded-xl p-4 flex flex-col justify-between border border-surface-container">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-outline block mb-1">
                            Refund Amount
                          </span>
                          <div className="text-2xl font-bold font-space text-on-surface">
                            ₹{ret.totalRefundAmount.toLocaleString('en-IN')}
                          </div>
                          <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            ret.refundDetails?.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-fixed'
                          }`}>
                            {ret.refundDetails?.status === 'completed'
                              ? 'Refund Disbursed'
                              : '100% Refund Approved'}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-surface-container text-xs text-on-surface-variant flex items-start gap-2">
                          <CreditCard className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>
                            {ret.refundMethod?.type === 'ORIGINAL_GATEWAY' ? (
                              <>Crediting to <strong className="text-on-surface font-medium">Original Payment Method</strong></>
                            ) : (
                              <>Transferring to <strong className="text-on-surface font-medium">Bank Account ({ret.refundMethod?.codBankDetails?.accountNumberMasked || 'Provided'})</strong></>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Reverse Logistics Slot (4 cols) */}
                      <div className="lg:col-span-4 bg-surface-container-high/30 dark:bg-card-dark-secondary/60 rounded-xl p-4 flex flex-col justify-between border border-surface-container">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-secondary">
                              Reverse Pickup Window
                            </span>
                            <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded">
                              {ret.pickupDetails?.trackingNumber ? 'Active AWB' : 'Pending'}
                            </span>
                          </div>

                          <div className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>
                              {ret.pickupDetails?.scheduledDate
                                ? new Date(ret.pickupDetails.scheduledDate).toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })
                                : 'Awaiting courier dispatch slot'}
                            </span>
                          </div>

                          <div className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-outline" />
                            <span>
                              Carrier: <strong className="text-on-surface">{ret.pickupDetails?.carrier || 'OMIZON Logistics'}</strong>
                            </span>
                          </div>

                          {ret.pickupDetails?.trackingNumber && (
                            <div className="text-xs text-outline mt-1 font-mono">
                              AWB: <strong className="text-on-surface">{ret.pickupDetails.trackingNumber}</strong>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <Link
                            to={`/account/returns/${ret._id}`}
                            className="flex-1 bg-primary text-white hover:bg-primary-container px-4 py-2 rounded-lg text-xs font-semibold text-center transition-colors inline-flex items-center justify-center gap-1"
                          >
                            <span>Live RMA Tracking</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* 5-Step Stepper */}
                    <div className="mt-6 pt-5 border-t border-surface-container">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-4">
                        <span className="text-outline">RMA Lifecycle Milestones</span>
                        <span className="text-primary">Step {currentStep} of 5</span>
                      </div>

                      <div className="relative flex items-center justify-between">
                        {/* Connecting track */}
                        <div className="absolute left-6 right-6 top-3.5 h-1 bg-surface-container dark:bg-card-dark-secondary -z-0"></div>
                        <div
                          className="absolute left-6 top-3.5 h-1 bg-primary -z-0 transition-all duration-500"
                          style={{ width: `${Math.min(100, ((currentStep - 1) / 4) * 100)}%` }}
                        ></div>

                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                            currentStep >= 1 ? 'bg-primary text-white' : 'bg-surface-container text-outline'
                          }`}>
                            ✓
                          </div>
                          <span className="text-xs font-medium text-on-surface mt-1.5">Requested</span>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                            currentStep >= 2 ? 'bg-primary text-white' : 'bg-surface-container text-outline'
                          }`}>
                            {currentStep >= 2 ? '✓' : '2'}
                          </div>
                          <span className="text-xs font-medium text-on-surface mt-1.5">Approved</span>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                            currentStep >= 3 ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-surface-container text-outline'
                          }`}>
                            {currentStep >= 3 ? <Truck className="w-3.5 h-3.5" /> : '3'}
                          </div>
                          <span className="text-xs font-medium text-on-surface mt-1.5">Pickup</span>
                        </div>

                        {/* Step 4 */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                            currentStep >= 4 ? 'bg-primary text-white' : 'bg-surface-container text-outline'
                          }`}>
                            {currentStep >= 4 ? '✓' : '4'}
                          </div>
                          <span className="text-xs font-medium text-on-surface mt-1.5">Inspection</span>
                        </div>

                        {/* Step 5 */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                            currentStep === 5 ? 'bg-emerald-600 text-white' : 'bg-surface-container text-outline'
                          }`}>
                            {currentStep === 5 ? '✓' : '5'}
                          </div>
                          <span className="text-xs font-medium text-on-surface mt-1.5">Refund</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-5 pt-4 border-t border-surface-container flex items-center justify-between flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-4">
                        <Link
                          to={`/account/returns/${ret._id}`}
                          className="font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>View Inspection Details & Full History</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {isCancellable && (
                        <button
                          onClick={() => {
                            setSelectedReturnForCancel(ret);
                            setCancelModalOpen(true);
                          }}
                          className="text-error hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Return</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && selectedReturnForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest dark:bg-card-dark rounded-xl max-w-md w-full p-6 shadow-xl border border-surface-container">
            <h3 className="text-lg font-bold text-on-surface mb-2">Cancel Return Request</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Are you sure you want to cancel return <strong className="text-on-surface">{selectedReturnForCancel.rmaNumber}</strong>? Once cancelled, courier reverse pickup will be revoked.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low dark:bg-card-dark-secondary rounded-lg text-sm text-on-surface border border-surface-container outline-none"
              >
                <option value="Change of mind / keeping product">Change of mind / keeping product</option>
                <option value="Resolved issue directly with seller">Resolved issue directly with seller</option>
                <option value="Placed replacement order instead">Placed replacement order instead</option>
                <option value="Initiated in error">Initiated in error</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
              >
                Keep Return Active
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancelReturn}
                className="px-4 py-2 bg-error text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default MyReturnsPage;
