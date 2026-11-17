import React from 'react';
import { CreditCard, ArrowDownRight, Building, CheckCircle2, Download } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/format';

interface SettlementRecord {
  id: string;
  utrNumber: string;
  grossAmount: number;
  commission: number;
  netPayout: number;
  status: 'settled' | 'processing';
  settledAt: string;
}

export const SellerPayoutsPage: React.FC = () => {
  const settlements: SettlementRecord[] = [
    {
      id: 'SETTL-2026-102',
      utrNumber: 'HDFC0001928374',
      grossAmount: 1845000,
      commission: 156825,
      netPayout: 1688175,
      status: 'settled',
      settledAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    },
    {
      id: 'SETTL-2026-101',
      utrNumber: 'HDFC0001712093',
      grossAmount: 2210000,
      commission: 187850,
      netPayout: 2022150,
      status: 'settled',
      settledAt: new Date(Date.now() - 3600 * 1000 * 120).toISOString(),
    },
  ];

  const columns: Column<SettlementRecord>[] = [
    {
      header: 'Settlement Batch',
      accessorKey: 'id',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-electric-violet">{row.id}</span>
          <p className="text-[10px] text-ink-subtle mt-0.5">UTR: {row.utrNumber}</p>
        </div>
      ),
    },
    {
      header: 'Gross Sales',
      accessorKey: 'grossAmount',
      align: 'right',
      cell: (row) => <span className="tabular-nums text-xs">{formatCurrency(row.grossAmount)}</span>,
    },
    {
      header: 'Platform Fee (8.5%)',
      accessorKey: 'commission',
      align: 'right',
      cell: (row) => <span className="tabular-nums text-xs text-ink-muted">-{formatCurrency(row.commission)}</span>,
    },
    {
      header: 'Net Settled',
      accessorKey: 'netPayout',
      align: 'right',
      cell: (row) => <span className="font-extrabold tabular-nums text-xs text-semantic-success">{formatCurrency(row.netPayout)}</span>,
    },
    {
      header: 'Disbursed Date',
      accessorKey: 'settledAt',
      cell: (row) => <span className="text-xs text-ink-muted">{formatDate(row.settledAt)}</span>,
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => <Badge variant="success">Disbursed (NEFT/RTGS)</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Payouts, Settlements & Ledger
          </h1>
          <p className="text-xs text-ink-muted">
            Bank account settlements, automated bi-weekly disbursements, and commission reconciliations
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
          Export Financial Statement
        </Button>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Next Scheduled Settlement</span>
          <p className="text-3xl font-extrabold text-ink dark:text-text-dark-primary mt-2 tabular-nums">
            ₹8,37,275
          </p>
          <span className="text-xs text-electric-violet font-semibold mt-2">
            Scheduled for Tomorrow by 11:00 AM
          </span>
        </div>

        <div className="bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Verified Settlement Account</span>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 rounded-xl bg-porcelain dark:bg-obsidian-surface-2 flex items-center justify-center text-electric-violet">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink dark:text-text-dark-primary">HDFC Bank Ltd.</p>
              <p className="text-[11px] text-ink-subtle font-mono">A/C: •••• •••• 9821 (IFSC: HDFC0000240)</p>
            </div>
          </div>
          <span className="text-xs text-semantic-success font-semibold mt-2">✓ Verified via Penny Drop</span>
        </div>

        <div className="bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Lifetime Disbursed</span>
          <p className="text-3xl font-extrabold text-ink dark:text-text-dark-primary mt-2 tabular-nums">
            ₹1,42,85,000
          </p>
          <span className="text-xs text-ink-muted mt-2">100% On-Time SLA Record</span>
        </div>
      </div>

      {/* Historical Ledger */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
          Settlement History Ledger
        </h2>
        <DataTable
          columns={columns}
          data={settlements}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
};

