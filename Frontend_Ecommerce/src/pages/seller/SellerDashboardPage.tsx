import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  RotateCcw,
  ArrowRight,
  Plus,
  Package,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Warehouse,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { INITIAL_PRODUCTS } from '../../services/mockData';
import { MetricCard } from '../../components/ui/MetricCard';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/format';

export const SellerDashboardPage: React.FC = () => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  useEffect(() => {
    api.products.list({ limit: 8 }).then((res) => {
      if (res?.products && res.products.length > 0) {
        setProducts(res.products);
      }
    }).catch(() => {});
  }, []);

  const orders = [
    {
      id: 'ORD-99120',
      product: 'SoundPulse Studio Pro Headphones',
      buyer: 'Arjun Mehta',
      amount: 24999,
      status: 'pending',
      slaTime: '3:45 PM Today',
    },
    {
      id: 'ORD-99118',
      product: 'ApexBook M3 Ultra 16"',
      buyer: 'Kavita Sen',
      amount: 189990,
      status: 'shipped',
      slaTime: 'Dispatched',
    },
    {
      id: 'ORD-99115',
      product: 'Artisan Stoneware Dining Set',
      buyer: 'Vikram Patel',
      amount: 4899,
      status: 'delivered',
      slaTime: 'Completed',
    },
  ];

  const columns: Column<any>[] = [
    {
      header: 'Order ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono font-bold text-xs text-electric-violet">#{row.id}</span>,
    },
    {
      header: 'Product',
      accessorKey: 'product',
      cell: (row) => <span className="font-bold text-xs text-ink dark:text-text-dark-primary">{row.product}</span>,
    },
    {
      header: 'Buyer',
      accessorKey: 'buyer',
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      align: 'right',
      cell: (row) => <span className="font-extrabold tabular-nums">{formatCurrency(row.amount)}</span>,
    },
    {
      header: 'Fulfillment SLA',
      accessorKey: 'slaTime',
      cell: (row) => (
        <span className={row.status === 'pending' ? 'text-semantic-warning font-bold' : 'text-ink-muted'}>
          {row.slaTime}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      cell: (row) => (
        <Badge
          variant={row.status === 'delivered' ? 'success' : row.status === 'shipped' ? 'primary' : 'warning'}
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Merchant Center Overview
          </h1>
          <p className="text-xs text-ink-muted dark:text-text-dark-muted mt-0.5">
            Real-time sales telemetry, dispatch deadlines, and critical stock warnings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/seller/products/new">
            <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
              Add Product
            </Button>
          </Link>
          <Link to="/seller/inventory">
            <Button variant="secondary" size="md" icon={<Warehouse className="w-4 h-4" />}>
              Stock Control
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Urgent Attention Ticker (Stitch Pattern) */}
      <div className="bg-white dark:bg-obsidian-surface-1 p-4 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-semantic-error flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-ink dark:text-text-dark-primary uppercase tracking-wider">
              Urgent SLA & Warehouse Alerts
            </h3>
            <p className="text-[11px] text-ink-muted">3 critical action items require immediate vendor response</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 xl:px-4">
          <Link
            to="/seller/inventory"
            className="p-3 rounded-xl bg-porcelain dark:bg-obsidian-surface-2 hover:bg-lavender-mist/40 transition-colors flex items-center gap-2.5"
          >
            <Package className="w-4 h-4 text-error shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink dark:text-text-dark-primary truncate">ApexBook M3 Ultra 16"</p>
              <p className="text-[10px] text-error font-semibold">2 units left • Critical Stockout</p>
            </div>
          </Link>

          <Link
            to="/seller/orders"
            className="p-3 rounded-xl bg-porcelain dark:bg-obsidian-surface-2 hover:bg-lavender-mist/40 transition-colors flex items-center gap-2.5"
          >
            <Clock className="w-4 h-4 text-semantic-warning shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink dark:text-text-dark-primary truncate">8 Orders Cut-off by 4:00 PM</p>
              <p className="text-[10px] text-ink-muted">Protect OMIZON Prime SLA badge</p>
            </div>
          </Link>

          <Link
            to="/seller/fulfilment"
            className="p-3 rounded-xl bg-porcelain dark:bg-obsidian-surface-2 hover:bg-lavender-mist/40 transition-colors flex items-center gap-2.5"
          >
            <RotateCcw className="w-4 h-4 text-royal-purple shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink dark:text-text-dark-primary truncate">2 Return Inspections</p>
              <p className="text-[10px] text-ink-muted">Awaiting depot verification</p>
            </div>
          </Link>
        </div>

        <Link to="/seller/orders" className="shrink-0">
          <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
            Resolve All
          </Button>
        </Link>
      </div>

      {/* 3. KPI Metric Cards (Grid of 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Gross Revenue"
          value="₹48,92,450"
          change="+18.4%"
          isPositive={true}
          subtitle="vs prior 30-day billing cycle"
          footerText="Net Payout: ₹43,05,350"
          icon={<CreditCard className="w-4 h-4" />}
        />

        <MetricCard
          title="Orders Fulfilled"
          value="324"
          change="+12.2%"
          isPositive={true}
          subtitle="99.4% SLA adherence rate"
          footerText="Average Dispatch: 2.8 hrs"
          icon={<ShoppingBag className="w-4 h-4" />}
        />

        <MetricCard
          title="Average Order Value"
          value="₹15,100"
          change="+5.1%"
          isPositive={true}
          subtitle="Electronics bundle uplift"
          footerText="Top Category: Tech Hardware"
          icon={<TrendingUp className="w-4 h-4" />}
        />

        <MetricCard
          title="Active Inventory SKUs"
          value="1,480"
          change="-2 Low Stock"
          isPositive={false}
          subtitle="98.1% Warehouse Fill Rate"
          footerText="Warehouse: Mumbai Bhiwandi"
          icon={<Warehouse className="w-4 h-4" />}
        />
      </div>

      {/* 4. Active Orders Pipeline Table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
              Recent Orders Requiring Dispatch
            </h2>
            <p className="text-xs text-ink-muted">Orders awaiting manifest packing and FastX pickup</p>
          </div>
          <Link to="/seller/orders" className="text-xs font-bold text-electric-violet hover:underline flex items-center gap-1">
            <span>View All Orders</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
};

