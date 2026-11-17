import React, { useState } from 'react';
import { ShoppingBag, Printer, CheckCircle, Clock, Truck, Search, Filter } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/format';

interface SellerOrder {
  id: string;
  customerName: string;
  itemsCount: number;
  total: number;
  status: 'pending' | 'packed' | 'shipped' | 'delivered';
  slaDeadline: string;
  courier: string;
  createdAt: string;
}

export const SellerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SellerOrder[]>([
    {
      id: 'ORD-98214-IN',
      customerName: 'Rajesh Singhania',
      itemsCount: 1,
      total: 24999,
      status: 'shipped',
      slaDeadline: 'Dispatched on time',
      courier: 'FastX Metro Express',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ORD-98219-IN',
      customerName: 'Ananya Roy',
      itemsCount: 2,
      total: 39998,
      status: 'pending',
      slaDeadline: '4:00 PM Today (Cutoff in 2h 15m)',
      courier: 'FastX Metro Express',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ORD-98205-IN',
      customerName: 'Vikram Joshi',
      itemsCount: 1,
      total: 189990,
      status: 'packed',
      slaDeadline: 'Ready for Courier Pickup',
      courier: 'BlueDart Secure Air',
      createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'shipped'>('all');

  const filtered = orders.filter((o) => {
    if (activeFilter === 'pending') return o.status === 'pending' || o.status === 'packed';
    if (activeFilter === 'shipped') return o.status === 'shipped' || o.status === 'delivered';
    return true;
  });

  const columns: Column<SellerOrder>[] = [
    {
      header: 'Order Reference',
      accessorKey: 'id',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-electric-violet">#{row.id}</span>
          <p className="text-[11px] text-ink-subtle mt-0.5">{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (row) => <span className="font-bold text-xs text-ink dark:text-text-dark-primary">{row.customerName}</span>,
    },
    {
      header: 'Items',
      accessorKey: 'itemsCount',
      align: 'center',
      cell: (row) => <span className="text-xs">{row.itemsCount} units</span>,
    },
    {
      header: 'Gross Value',
      accessorKey: 'total',
      align: 'right',
      cell: (row) => <span className="font-extrabold tabular-nums">{formatCurrency(row.total)}</span>,
    },
    {
      header: 'Fulfillment Deadline',
      accessorKey: 'slaDeadline',
      cell: (row) => (
        <span
          className={`text-xs ${
            row.status === 'pending' ? 'text-semantic-warning font-bold' : 'text-ink-muted'
          }`}
        >
          {row.slaDeadline}
        </span>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'delivered'
              ? 'success'
              : row.status === 'shipped'
              ? 'primary'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Printing packing manifest for order ${row.id}`)}
            className="h-8 text-xs font-bold gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Label</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Order Fulfillment & SLA Pipeline
          </h1>
          <p className="text-xs text-ink-muted">
            Batch print shipping labels, verify packaging manifests, and hand over to couriers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            All Orders
          </Button>
          <Button
            variant={activeFilter === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('pending')}
          >
            Pending Dispatch
          </Button>
          <Button
            variant={activeFilter === 'shipped' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('shipped')}
          >
            Shipped
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};

