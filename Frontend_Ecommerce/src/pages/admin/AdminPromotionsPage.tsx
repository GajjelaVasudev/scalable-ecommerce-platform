import React, { useState } from 'react';
import { Tag, Plus, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface PromoCampaign {
  id: string;
  code: string;
  title: string;
  discountType: string;
  value: string;
  minOrder: string;
  status: 'active' | 'scheduled' | 'expired';
}

export const AdminPromotionsPage: React.FC = () => {
  const [promos, setPromos] = useState<PromoCampaign[]>([
    {
      id: 'CAM-01',
      code: 'FESTIVAL500',
      title: 'Spring Festival UPI Instant Discount',
      discountType: 'Flat Rupee Discount',
      value: '₹500 OFF',
      minOrder: '₹2,500',
      status: 'active',
    },
    {
      id: 'CAM-02',
      code: 'FASTXFREE',
      title: 'Free Metro Express Shipping Promo',
      discountType: 'Free Freight',
      value: '100% Delivery Waiver',
      minOrder: '₹999',
      status: 'active',
    },
    {
      id: 'CAM-03',
      code: 'TECH10',
      title: 'Audio & Computing Weekend Boost',
      discountType: 'Percentage Discount',
      value: '10% OFF',
      minOrder: '₹10,000',
      status: 'scheduled',
    },
  ]);

  const columns: Column<PromoCampaign>[] = [
    {
      header: 'Promo Code',
      accessorKey: 'code',
      cell: (row) => <span className="font-mono font-bold text-xs text-electric-violet">#{row.code}</span>,
    },
    {
      header: 'Campaign Title',
      accessorKey: 'title',
      cell: (row) => <span className="font-bold text-xs text-ink dark:text-text-dark-primary">{row.title}</span>,
    },
    {
      header: 'Benefit Value',
      accessorKey: 'value',
      cell: (row) => <span className="font-extrabold text-xs text-semantic-success">{row.value}</span>,
    },
    {
      header: 'Min Cart Requirement',
      accessorKey: 'minOrder',
      cell: (row) => <span className="text-xs text-ink-muted">{row.minOrder}</span>,
    },
    {
      header: 'Campaign State',
      align: 'center',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Marketplace Campaigns & Promotional Engine
          </h1>
          <p className="text-xs text-ink-muted">
            Configure platform coupons, seasonal flash discount rules, and payment gateway co-promotions
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={promos}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};

