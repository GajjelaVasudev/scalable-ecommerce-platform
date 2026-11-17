import React, { useState } from 'react';
import { FileCheck, CheckCircle2, XCircle, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface ModerationItem {
  id: string;
  productName: string;
  merchant: string;
  category: string;
  flagReason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const AdminModerationPage: React.FC = () => {
  const [items, setItems] = useState<ModerationItem[]>([
    {
      id: 'MOD-1082',
      productName: 'SoundPulse Studio Pro Headphones',
      merchant: 'OmniAudio Direct',
      category: 'Electronics',
      flagReason: 'New product submission - Audio hardware verification',
      status: 'approved',
    },
    {
      id: 'MOD-1085',
      productName: 'Titanium Smart Health Ring Gen 3',
      merchant: 'Aura Biometrics',
      category: 'Electronics / Wearables',
      flagReason: 'Medical device disclaimer check required',
      status: 'pending',
    },
    {
      id: 'MOD-1089',
      productName: 'Artisan Stoneware Dining Set',
      merchant: 'Kala Artisan Living',
      category: 'Home & Living',
      flagReason: 'Fragile packaging verification compliant',
      status: 'approved',
    },
  ]);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
  };

  const columns: Column<ModerationItem>[] = [
    {
      header: 'Queue Ticket',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono font-bold text-xs text-electric-violet">{row.id}</span>,
    },
    {
      header: 'Listing Name',
      accessorKey: 'productName',
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-ink dark:text-text-dark-primary">{row.productName}</p>
          <span className="text-[10px] text-ink-subtle">Category: {row.category}</span>
        </div>
      ),
    },
    {
      header: 'Merchant Owner',
      accessorKey: 'merchant',
    },
    {
      header: 'Audit Note / Policy Check',
      accessorKey: 'flagReason',
      cell: (row) => <span className="text-[11px] text-ink-muted">{row.flagReason}</span>,
    },
    {
      header: 'Governance Status',
      align: 'center',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'approved'
              ? 'success'
              : row.status === 'rejected'
              ? 'error'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Moderation Decision',
      align: 'right',
      cell: (row) =>
        row.status === 'pending' ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction(row.id, 'approved')}
              className="h-8 text-xs font-bold"
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleAction(row.id, 'rejected')}
              className="h-8 text-xs font-bold"
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-ink-muted font-semibold capitalize">{row.status}</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
          Catalog Governance & Product Moderation Queue
        </h1>
        <p className="text-xs text-ink-muted">
          Review newly submitted merchant SKUs, trademark clearances, and prohibited item scans
        </p>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};

