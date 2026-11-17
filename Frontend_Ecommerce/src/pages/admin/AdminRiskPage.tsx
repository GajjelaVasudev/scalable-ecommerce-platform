import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Lock, Eye } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface RiskAlert {
  id: string;
  triggerEvent: string;
  targetAccount: string;
  score: number;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
}

export const AdminRiskPage: React.FC = () => {
  const alerts: RiskAlert[] = [
    {
      id: 'RSK-9901',
      triggerEvent: 'Checkout Velocity Anomaly (>5 orders in 60s)',
      targetAccount: 'buyer_bot_suspect_99',
      score: 94,
      severity: 'high',
      mitigation: 'Automated 2FA Step-up & IP Throttle applied',
    },
    {
      id: 'RSK-9904',
      triggerEvent: 'Card BIN Mismatch (Issued UK, Geo India)',
      targetAccount: 'guest_user_4412',
      score: 68,
      severity: 'medium',
      mitigation: 'Requires 3D Secure OTP verification',
    },
  ];

  const columns: Column<RiskAlert>[] = [
    {
      header: 'Alert ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono font-bold text-xs text-electric-violet">{row.id}</span>,
    },
    {
      header: 'Anomaly Signal',
      accessorKey: 'triggerEvent',
      cell: (row) => <span className="font-bold text-xs text-ink dark:text-text-dark-primary">{row.triggerEvent}</span>,
    },
    {
      header: 'Target User / IP',
      accessorKey: 'targetAccount',
      cell: (row) => <span className="font-mono text-xs text-ink-muted">{row.targetAccount}</span>,
    },
    {
      header: 'Fraud Score',
      align: 'center',
      cell: (row) => (
        <span className="font-mono font-extrabold text-xs text-semantic-error">
          {row.score}/100
        </span>
      ),
    },
    {
      header: 'Risk Level',
      align: 'center',
      cell: (row) => (
        <Badge variant={row.severity === 'high' ? 'error' : 'warning'}>
          {row.severity.toUpperCase()} RISK
        </Badge>
      ),
    },
    {
      header: 'Active Mitigation',
      accessorKey: 'mitigation',
      cell: (row) => <span className="text-[11px] text-ink-muted">{row.mitigation}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
          Risk, Fraud & Trust Engine Telemetry
        </h1>
        <p className="text-xs text-ink-muted">
          Machine-learning anomaly detection, high-velocity checkout defenses, and account security blocks
        </p>
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};

