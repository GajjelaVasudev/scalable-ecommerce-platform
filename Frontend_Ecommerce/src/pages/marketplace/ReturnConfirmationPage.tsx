import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AccountLayout } from '../../components/account/AccountLayout';
import { api } from '../../services/api';
import { ReturnRequestItem } from '../../types';
import {
  CheckCircle2,
  Copy,
  Truck,
  RotateCcw,
  Package,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  CreditCard,
  Building,
  Info
} from 'lucide-react';

export const ReturnConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [returnDoc, setReturnDoc] = useState<ReturnRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.returns
      .getById(id)
      .then(res => setReturnDoc(res.returnRequest))
      .catch(err => console.error('Failed to load return details:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const copyRma = () => {
    if (!returnDoc?.rmaNumber) return;
    navigator.clipboard.writeText(returnDoc.rmaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <AccountLayout activeKey="returns">
        <div className="p-12 text-center bg-surface-container-lowest dark:bg-card-dark rounded-xl border border-surface-container animate-pulse">
          <RotateCcw className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
          <h3 className="text-base font-semibold text-on-surface">Confirming RMA Reference...</h3>
        </div>
      </AccountLayout>
    );
  }

  if (!returnDoc) {
    return (
      <AccountLayout activeKey="returns">
        <div className="p-8 text-center bg-surface-container-lowest dark:bg-card-dark rounded-xl border border-surface-container">
          <h3 className="text-lg font-bold text-on-surface mb-2">Return Request Confirmed</h3>
          <p className="text-sm text-on-surface-variant mb-4">
            Your return request has been submitted. Check your returns dashboard for live tracking.
          </p>
          <Link
            to="/account/returns"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container inline-flex items-center gap-1.5"
          >
            <span>Go to My Returns Hub</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout activeKey="returns">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Success Banner */}
        <div className="bg-surface-container-lowest dark:bg-card-dark p-8 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-bold font-space text-on-surface tracking-tight">
            Return Request Submitted!
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-md mx-auto">
            Your return merchandise authorization has been issued and notified to the merchant.
          </p>

          {/* RMA Box */}
          <div className="mt-6 inline-flex items-center gap-3 bg-surface-container-low dark:bg-card-dark-secondary px-6 py-3 rounded-xl border border-surface-container">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
                Official RMA Tracking ID
              </span>
              <span className="text-lg font-bold font-mono text-primary">{returnDoc.rmaNumber}</span>
            </div>
            <button
              onClick={copyRma}
              className="p-2 text-outline hover:text-primary transition-colors rounded-lg bg-surface-container dark:bg-card-dark"
              title="Copy RMA Number"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Returned Items & Refund Preview */}
        <div className="bg-surface-container-lowest dark:bg-card-dark p-6 rounded-xl shadow-sm border border-surface-container">
          <h3 className="text-sm font-bold uppercase tracking-wider text-outline mb-4">
            Items Included in This Shipment
          </h3>

          <div className="divide-y divide-surface-container">
            {returnDoc.items.map((it, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-low dark:bg-card-dark-secondary overflow-hidden shrink-0 border border-surface-container flex items-center justify-center">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-outline" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-on-surface line-clamp-1">{it.name}</h4>
                    <span className="text-xs text-outline">
                      Qty: {it.quantity} • {it.reason}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-space text-on-surface">
                    ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-surface-container flex items-center justify-between text-sm">
            <span className="font-semibold text-on-surface">Estimated Total Reimbursement:</span>
            <span className="text-lg font-bold font-space text-primary">
              ₹{returnDoc.totalRefundAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Reverse Logistics Next Steps */}
        <div className="bg-surface-container-lowest dark:bg-card-dark p-6 rounded-xl shadow-sm border border-surface-container">
          <h3 className="text-sm font-bold uppercase tracking-wider text-outline mb-4">
            What Happens Next?
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">Merchant Review (SLA: 24 Hours)</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  The merchant reviews your claim and photo evidence. You will be notified instantly via in-app notification and email.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">Doorstep Reverse Courier Pickup</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Our courier partner will visit your address to pick up the package. Please ensure all original tags, boxes, and accessories are included.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">Inspection & Instant Refund Release</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Once received and passed quality verification, your refund is credited automatically via Razorpay or direct bank transfer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/account/returns"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors text-center"
          >
            ← Back to My Returns Hub
          </Link>
          <Link
            to={`/account/returns/${returnDoc._id}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-container transition-colors shadow-sm inline-flex items-center justify-center gap-2"
          >
            <span>Track RMA Live Status</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </AccountLayout>
  );
};

export default ReturnConfirmationPage;
