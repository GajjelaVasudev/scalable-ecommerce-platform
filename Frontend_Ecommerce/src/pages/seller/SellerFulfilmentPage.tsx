import React, { useState } from 'react';
import { Truck, Barcode, CheckCircle2, ShieldCheck, Printer, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const SellerFulfilmentPage: React.FC = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedItems, setScannedItems] = useState([
    { id: 'SCN-8812', sku: 'SKU-SND-PRO-VIOLET', orderId: 'ORD-98214-IN', courier: 'FastX Metro', verified: true },
    { id: 'SCN-8815', sku: 'SKU-APX-M3-16', orderId: 'ORD-98205-IN', courier: 'BlueDart Secure Air', verified: true },
  ]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setScannedItems((prev) => [
      {
        id: `SCN-${Math.floor(1000 + Math.random() * 9000)}`,
        sku: barcodeInput.trim().toUpperCase(),
        orderId: `ORD-${Math.floor(10000 + Math.random() * 90000)}-IN`,
        courier: 'FastX Metro',
        verified: true,
      },
      ...prev,
    ]);
    setBarcodeInput('');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
          Dispatch & Manifest Operations
        </h1>
        <p className="text-xs text-ink-muted">
          Barcode verification station, courier handover manifests, and bulk airway bill generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Barcode Station */}
        <div className="lg:col-span-7 bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2.5 border-b border-lavender-mist dark:border-obsidian-border pb-4">
            <Barcode className="w-5 h-5 text-electric-violet" />
            <h2 className="text-sm font-bold text-ink dark:text-text-dark-primary">
              Barcode Scan & Package Verification
            </h2>
          </div>

          <form onSubmit={handleScanSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan SKU barcode or type SKU-..."
              className="flex-1 bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet font-mono"
            />
            <Button type="submit" variant="primary" size="md">
              Verify Scan
            </Button>
          </form>

          {/* Scanned Items Log */}
          <div className="flex flex-col divide-y divide-lavender-mist dark:divide-obsidian-border">
            {scannedItems.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-semantic-success" />
                  <div>
                    <span className="font-mono font-bold text-ink dark:text-text-dark-primary">{item.sku}</span>
                    <p className="text-[10px] text-ink-subtle">Mapped to Order #{item.orderId}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-royal-purple">{item.courier}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Courier Manifest Summary */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-lavender-mist dark:border-obsidian-border pb-3">
              <Truck className="w-4 h-4 text-electric-violet" />
              <h3 className="text-sm font-bold text-ink dark:text-text-dark-primary">
                Today's Scheduled Courier Pickups
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-porcelain dark:bg-obsidian-surface-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-ink dark:text-text-dark-primary">FastX Metro Express</span>
                  <p className="text-[11px] text-ink-muted">Arrival: 4:30 PM (18 packages)</p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px]">
                  Print Manifest
                </Button>
              </div>

              <div className="p-3.5 rounded-xl bg-porcelain dark:bg-obsidian-surface-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-ink dark:text-text-dark-primary">BlueDart Cargo Air</span>
                  <p className="text-[11px] text-ink-muted">Arrival: 5:15 PM (6 packages)</p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px]">
                  Print Manifest
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

