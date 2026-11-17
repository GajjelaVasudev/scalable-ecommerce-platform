import React from 'react';
import { FileText, Shield, Download, Lock } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/format';

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  ipAddress: string;
  resource: string;
  outcome: 'success' | 'warning' | 'error';
  timestamp: string;
}

export const AdminReportsPage: React.FC = () => {
  const logs: AuditLog[] = [
    {
      id: 'AUD-88219',
      action: 'ORDER_RESERVATION_CONFIRM',
      actor: 'system/webhook_engine',
      ipAddress: '127.0.0.1 (Internal Cluster)',
      resource: 'Order #ORD-98214-IN',
      outcome: 'success',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'AUD-88215',
      action: 'PRODUCT_PRICE_UPDATE',
      actor: 'merchant/apex_tech_hub',
      ipAddress: '103.21.244.18 (Mumbai)',
      resource: 'Product #prod_apexbook_02',
      outcome: 'success',
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    },
    {
      id: 'AUD-88201',
      action: 'ADMIN_PRIVILEGE_CHECK',
      actor: 'admin/omizon_superadmin',
      ipAddress: '14.143.12.9 (Corporate VPN)',
      resource: 'Reconciliation Queue',
      outcome: 'success',
      timestamp: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    },
  ];

  const columns: Column<AuditLog>[] = [
    {
      header: 'Event ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono font-bold text-xs text-electric-violet">{row.id}</span>,
    },
    {
      header: 'Operation Action',
      accessorKey: 'action',
      cell: (row) => <span className="font-mono text-xs font-bold text-ink dark:text-text-dark-primary">{row.action}</span>,
    },
    {
      header: 'Actor / Identity',
      accessorKey: 'actor',
      cell: (row) => <span className="text-xs text-ink-muted">{row.actor}</span>,
    },
    {
      header: 'Client Network IP',
      accessorKey: 'ipAddress',
      cell: (row) => <span className="font-mono text-[11px] text-ink-subtle">{row.ipAddress}</span>,
    },
    {
      header: 'Target Resource',
      accessorKey: 'resource',
      cell: (row) => <span className="text-xs font-semibold">{row.resource}</span>,
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      cell: (row) => <span className="text-xs text-ink-muted">{formatDate(row.timestamp)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Security Telemetry & Immutable Audit Logs
          </h1>
          <p className="text-xs text-ink-muted">
            Cryptographic ledger tracking all privileged admin changes, merchant mutations, and inventory locks
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
          Export Audit Ledger (.CSV)
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};

