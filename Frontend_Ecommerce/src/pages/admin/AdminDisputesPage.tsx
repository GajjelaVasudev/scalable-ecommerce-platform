import React, { useState } from 'react';
import { RotateCcw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';

interface DisputeCase {
  id: string;
  orderId: string;
  buyerName: string;
  issueType: string;
  amount: number;
  status: 'under_review' | 'refund_approved' | 'closed';
}

export const AdminDisputesPage: React.FC = () => {
  const [cases, setCases] = useState<DisputeCase[]>([
    {
      id: 'DSP-4410',
      orderId: 'ORD-98201-IN',
      buyerName: 'Sneha Kapur',
      issueType: 'Transit Packaging Damaged - Verified by Courier Photo',
      amount: 4899,
      status: 'refund_approved',
    },
    {
      id: 'DSP-4412',
      orderId: 'ORD-98199-IN',
      buyerName: 'Rohan Varma',
      issueType: 'Missing Audio Accessory in Box',
      amount: 2499,
      status: 'under_review',
    },
  ]);

  const handleApproveRefund = (id: string) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'refund_approved' } : c))
    );
    alert('Doorstep reverse pickup & refund approved.');
  };

  const columns: Column<DisputeCase>[] = [
    {
      header: 'Dispute Reference',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono font-bold text-xs text-electric-violet">#{row.id}</span>,
    },
    {
      header: 'Order Reference',
      accessorKey: 'orderId',
      cell: (row) => <span className="font-mono text-xs text-ink-muted">#{row.orderId}</span>,
    },
    {
      header: 'Buyer Claimant',
      accessorKey: 'buyerName',
      cell: (row) => <span className="font-bold text-xs text-ink dark:text-text-dark-primary">{row.buyerName}</span>,
    },
    {
      header: 'Dispute Claim',
      accessorKey: 'issueType',
      cell: (row) => <span className="text-[11px] text-ink-muted leading-tight">{row.issueType}</span>,
    },
    {
      header: 'Claim Amount',
      accessorKey: 'amount',
      align: 'right',
      cell: (row) => <span className="font-extrabold tabular-nums text-xs">{formatCurrency(row.amount)}</span>,
    },
    {
      header: 'Mediation Status',
      align: 'center',
      cell: (row) => (
        <Badge variant={row.status === 'refund_approved' ? 'success' : 'warning'}>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      header: 'Decision',
      align: 'right',
      cell: (row) =>
        row.status === 'under_review' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleApproveRefund(row.id)}
            className="h-8 text-xs font-bold"
          >
            Authorize Refund
          </Button>
        ) : (
          <span className="text-xs text-semantic-success font-semibold">Refund Issued</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
          Returns, Disputes & Chargeback Mediation
        </h1>
        <p className="text-xs text-ink-muted">
          Customer return inspections, damaged transit claims, and merchant dispute adjudications
        </p>
      </div>

      <DataTable
        columns={columns}
        data={cases}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};

