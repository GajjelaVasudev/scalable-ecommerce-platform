import React from 'react';
import { BarChart3, TrendingUp, PieChart, MapPin, Layers } from 'lucide-react';
import { MetricCard } from '../../components/ui/MetricCard';

export const SellerAnalyticsPage: React.FC = () => {
  const categorySales = [
    { name: 'Consumer Electronics & Audio', sales: '₹28,40,000', share: 58 },
    { name: 'Artisan Home Living', sales: '₹11,20,000', share: 23 },
    { name: 'Pantry & Gourmet Essentials', sales: '₹5,40,000', share: 11 },
    { name: 'Clean Beauty & Skincare', sales: '₹3,92,450', share: 8 },
  ];

  const regionalSales = [
    { region: 'Mumbai Metro & Pune', orders: '142 orders', share: 44 },
    { region: 'Delhi NCR & Gurgaon', orders: '86 orders', share: 27 },
    { region: 'Bengaluru Tech Corridor', orders: '64 orders', share: 20 },
    { region: 'Hyderabad & Chennai', orders: '32 orders', share: 9 },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
          Sales Analytics & Business Intelligence
        </h1>
        <p className="text-xs text-ink-muted">
          Operational performance metrics, category revenue shares, and regional demand velocity
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="30-Day Gross Volume"
          value="₹48,92,450"
          change="+18.4%"
          isPositive={true}
          subtitle="Top performer in Audio"
        />
        <MetricCard
          title="Conversion Rate"
          value="4.82%"
          change="+0.6%"
          isPositive={true}
          subtitle="Industry benchmark: 3.2%"
        />
        <MetricCard
          title="Units Sold"
          value="642"
          change="+14.1%"
          isPositive={true}
          subtitle="Across 8 verified SKUs"
        />
        <MetricCard
          title="Customer Return Rate"
          value="1.2%"
          change="-0.4%"
          isPositive={true}
          subtitle="Exemplary quality score"
        />
      </div>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Share */}
        <div className="bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-lavender-mist dark:border-obsidian-border pb-3">
            <Layers className="w-4 h-4 text-electric-violet" />
            <h2 className="text-sm font-bold text-ink dark:text-text-dark-primary">
              Category Revenue Distribution
            </h2>
          </div>

          <div className="flex flex-col gap-4 pt-2">
            {categorySales.map((cat) => (
              <div key={cat.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink dark:text-text-dark-primary">{cat.name}</span>
                  <span className="font-bold tabular-nums text-electric-violet">{cat.sales} ({cat.share}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-porcelain dark:bg-obsidian-surface-2 overflow-hidden">
                  <div
                    className="h-full bg-electric-violet rounded-full transition-all duration-500"
                    style={{ width: `${cat.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-lavender-mist dark:border-obsidian-border pb-3">
            <MapPin className="w-4 h-4 text-electric-violet" />
            <h2 className="text-sm font-bold text-ink dark:text-text-dark-primary">
              Regional Demand Velocity
            </h2>
          </div>

          <div className="flex flex-col gap-4 pt-2">
            {regionalSales.map((reg) => (
              <div key={reg.region} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink dark:text-text-dark-primary">{reg.region}</span>
                  <span className="font-bold tabular-nums text-royal-purple">{reg.orders} ({reg.share}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-porcelain dark:bg-obsidian-surface-2 overflow-hidden">
                  <div
                    className="h-full bg-royal-purple rounded-full transition-all duration-500"
                    style={{ width: `${reg.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

