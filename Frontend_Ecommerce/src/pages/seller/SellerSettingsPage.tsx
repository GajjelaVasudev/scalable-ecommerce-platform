import React, { useState } from 'react';
import { Settings, Store, MapPin, Bell, ShieldCheck, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const SellerSettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('Apex Tech Hub & Sound Engineering');
  const [gstin, setGstin] = useState('27AADCS1234F1Z8');
  const [pickupCity, setPickupCity] = useState('Mumbai Bhiwandi Hub');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
          Store Configurations & Dispatch Policies
        </h1>
        <p className="text-xs text-ink-muted">
          Manage business credentials, GST registration, logistics pickup depots, and notification webhooks
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-obsidian-surface-1 p-6 sm:p-8 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Public Merchant Display Name
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              GSTIN Tax Identification
            </label>
            <input
              type="text"
              required
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Primary Courier Pickup Depot
            </label>
            <input
              type="text"
              required
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
              className="bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-lavender-mist dark:border-obsidian-border">
          <span className="text-xs text-semantic-success font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Verified Marketplace Merchant
          </span>
          <Button type="submit" variant="primary" size="md">
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved Changes!</span>
              </>
            ) : (
              'Save Store Configurations'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

