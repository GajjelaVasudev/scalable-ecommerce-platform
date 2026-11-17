import React, { useState } from 'react';
import { Warehouse, Plus, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../services/api';

interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  variant: string;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  location: string;
}

export const SellerInventoryPage: React.FC = () => {
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([
    {
      id: 'inv_01',
      sku: 'SKU-SND-PRO-VIOLET',
      productName: 'SoundPulse Studio Pro Headphones',
      variant: 'Midnight Violet',
      totalStock: 18,
      availableStock: 15,
      reservedStock: 3,
      location: 'Bin A-14, Bhiwandi Central',
    },
    {
      id: 'inv_02',
      sku: 'SKU-APX-M3-16',
      productName: 'ApexBook M3 Ultra 16"',
      variant: 'default',
      totalStock: 2,
      availableStock: 1,
      reservedStock: 1,
      location: 'Cage H-02, Secure Vault',
    },
    {
      id: 'inv_03',
      sku: 'SKU-STN-DINE-16',
      productName: 'Artisan Stoneware Dining Set',
      variant: '16-Piece Matte',
      totalStock: 45,
      availableStock: 43,
      reservedStock: 2,
      location: 'Aisle C-08, Pallet 4',
    },
    {
      id: 'inv_04',
      sku: 'SKU-OLV-500ML',
      productName: 'Cold-Pressed Estate Olive Oil',
      variant: '500ml Glass',
      totalStock: 120,
      availableStock: 114,
      reservedStock: 6,
      location: 'Ambient Rack G-11',
    },
  ]);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState('20');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const amount = Number(restockAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      alert('Please enter a valid positive integer.');
      return;
    }

    setIsUpdating(true);
    try {
      // Optimistic update
      setInventoryList((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                totalStock: item.totalStock + amount,
                availableStock: item.availableStock + amount,
              }
            : item
        )
      );
      setSelectedItem(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<InventoryItem>[] = [
    {
      header: 'SKU / Product',
      accessorKey: 'sku',
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-electric-violet">{row.sku}</span>
          <p className="font-bold text-xs text-ink dark:text-text-dark-primary mt-0.5">{row.productName}</p>
          <span className="text-[10px] text-ink-subtle">Variant: {row.variant}</span>
        </div>
      ),
    },
    {
      header: 'Warehouse Depot',
      accessorKey: 'location',
      cell: (row) => <span className="text-xs text-ink-muted">{row.location}</span>,
    },
    {
      header: 'Total Stock',
      accessorKey: 'totalStock',
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-xs">{row.totalStock}</span>,
    },
    {
      header: 'Available',
      accessorKey: 'availableStock',
      align: 'right',
      cell: (row) => (
        <span
          className={`font-mono font-extrabold text-xs ${
            row.availableStock <= 5 ? 'text-semantic-error' : 'text-semantic-success'
          }`}
        >
          {row.availableStock}
        </span>
      ),
    },
    {
      header: 'Reserved (Locks)',
      accessorKey: 'reservedStock',
      align: 'right',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
          {row.reservedStock}
        </span>
      ),
    },
    {
      header: 'Stock Health',
      align: 'center',
      cell: (row) => (
        <Badge
          variant={
            row.availableStock <= 2
              ? 'error'
              : row.availableStock <= 10
              ? 'warning'
              : 'success'
          }
        >
          {row.availableStock <= 2
            ? 'Critical'
            : row.availableStock <= 10
            ? 'Low Reserve'
            : 'Healthy'}
        </Badge>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedItem(row);
            setRestockAmount('20');
          }}
          className="h-8 text-xs font-bold"
        >
          Quick Restock
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Warehouse Stock & Inventory Control
          </h1>
          <p className="text-xs text-ink-muted">
            Atomic stock synchronization across live checkouts, locks, and replenishment batches
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={inventoryList}
        keyExtractor={(item) => item.id}
      />

      {/* Restock Modal */}
      {selectedItem && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          title={`Restock: ${selectedItem.productName}`}
          subtitle={`Current Available Stock: ${selectedItem.availableStock} | Reserved Stock: ${selectedItem.reservedStock}`}
        >
          <form onSubmit={handleRestockSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink">Units to Add to Depot</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="bg-porcelain text-sm p-3 rounded-xl border border-lavender-mist outline-none focus:ring-1 focus:ring-electric-violet font-mono"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdating}>
                Confirm Stock Replenishment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

