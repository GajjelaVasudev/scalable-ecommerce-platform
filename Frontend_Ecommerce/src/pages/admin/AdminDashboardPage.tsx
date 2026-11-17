import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  CreditCard,
  Truck,
  Users,
  ShieldAlert,
  Activity,
  ArrowRight,
  TrendingUp,
  Server,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { MetricCard } from '../../components/ui/MetricCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/format';

export const AdminDashboardPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [readinessStatus, setReadinessStatus] = useState<any>(null);

  useEffect(() => {
    api.health.get().then(setHealthStatus).catch(() => {});
    api.health.ready().then(setReadinessStatus).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Executive Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Platform Executive Operations
          </h1>
          <p className="text-xs text-ink-muted dark:text-text-dark-muted mt-0.5">
            Consolidated cross-platform gross volume, settlement health, and infrastructure telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/payments">
            <Button variant="outline" size="sm" icon={<CreditCard className="w-3.5 h-3.5" />}>
              Reconciliation Queue
            </Button>
          </Link>
          <Link to="/admin/products">
            <Button variant="primary" size="sm" icon={<Layers className="w-3.5 h-3.5" />}>
              Catalog Governance
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Executive KPI Cards (Stitch Design Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Gross Merchandise Value (GMV)"
          value="₹48.62 Cr"
          change="+18.4%"
          isPositive={true}
          subtitle="Total marketplace transactions across 7 categories"
          footerText="Prev 30d: ₹41.06 Cr"
          icon={<ShoppingBag className="w-4 h-4" />}
        />

        <MetricCard
          title="Platform Net Revenue"
          value="₹4.12 Cr"
          change="+14.2%"
          isPositive={true}
          subtitle="Commission take-rate (avg 8.47%) + FastX logistics"
          footerText="Blended Take: 8.47% (+42 bps)"
          icon={<CreditCard className="w-4 h-4" />}
        />

        <MetricCard
          title="Total Marketplace Orders"
          value="1,42,850"
          change="+11.6%"
          isPositive={true}
          subtitle="98.7% nationwide SLA compliance"
          footerText="Average fulfillment: 2.4 hrs"
          icon={<Truck className="w-4 h-4" />}
        />

        <MetricCard
          title="Active Verified Merchants"
          value="4,820"
          change="+312 MTD"
          isPositive={true}
          subtitle="100% KYC verified & tax compliant"
          footerText="Awaiting review: 14 merchants"
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      {/* 3. System Infrastructure Telemetry Strip */}
      <div className="bg-white dark:bg-obsidian-surface-1 p-5 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-electric-violet/10 text-electric-violet flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-ink dark:text-text-dark-primary uppercase tracking-wider">
              Backend Infrastructure Cluster
            </h3>
            <p className="text-[11px] text-ink-muted">
              Node v22 / Express 5 • MongoDB Replica Set `rs0` • Redis Cache Store • Razorpay Webhook Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-semantic-success">
            <CheckCircle2 className="w-4 h-4" />
            <span>Database: Connected</span>
          </div>
          <div className="flex items-center gap-1.5 text-semantic-success">
            <CheckCircle2 className="w-4 h-4" />
            <span>Redis Cache: Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-semantic-success">
            <CheckCircle2 className="w-4 h-4" />
            <span>Webhook: Verified</span>
          </div>
        </div>
      </div>

      {/* 4. Operational Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/products"
          className="group bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-muted uppercase">Catalog Governance</span>
              <Layers className="w-5 h-5 text-electric-violet" />
            </div>
            <h3 className="text-base font-bold text-ink dark:text-text-dark-primary group-hover:text-electric-violet transition-colors">
              Product & Category Controls
            </h3>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Enforce category constraints, review SKU listings, and prevent unauthorized category deletion.
            </p>
          </div>
          <span className="text-xs font-bold text-electric-violet flex items-center gap-1 mt-4">
            Manage Catalog <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/admin/payments"
          className="group bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-muted uppercase">Reconciliation Queue</span>
              <CreditCard className="w-5 h-5 text-electric-violet" />
            </div>
            <h3 className="text-base font-bold text-ink dark:text-text-dark-primary group-hover:text-electric-violet transition-colors">
              Payment & Refund Operations
            </h3>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Review idempotent Razorpay webhook deliveries, investigate payment issues, and approve audit resolutions.
            </p>
          </div>
          <span className="text-xs font-bold text-electric-violet flex items-center gap-1 mt-4">
            Inspect Queue <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/admin/orders"
          className="group bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-muted uppercase">Platform Logistics</span>
              <Truck className="w-5 h-5 text-electric-violet" />
            </div>
            <h3 className="text-base font-bold text-ink dark:text-text-dark-primary group-hover:text-electric-violet transition-colors">
              Platform-Wide Orders & Fulfilment
            </h3>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Monitor cross-merchant order statuses, update delivery milestones, and enforce cancellation protocols.
            </p>
          </div>
          <span className="text-xs font-bold text-electric-violet flex items-center gap-1 mt-4">
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
};

