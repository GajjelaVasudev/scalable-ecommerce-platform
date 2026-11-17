import React from 'react';
import { UserCheck, Building, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SellerAccountPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
          Merchant Account & Corporate Profile
        </h1>
        <p className="text-xs text-ink-muted">
          Authorized signatories, enterprise KYC credentials, and operational contacts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-lavender-mist dark:border-obsidian-border pb-3">
            <UserCheck className="w-4 h-4 text-electric-violet" />
            <h2 className="text-sm font-bold text-ink dark:text-text-dark-primary">
              Signatory Credentials
            </h2>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <span className="text-ink-subtle">Merchant Legal Name:</span>
              <p className="font-bold text-ink dark:text-text-dark-primary">Apex Tech Solutions Private Limited</p>
            </div>
            <div>
              <span className="text-ink-subtle">Authorized Account Representative:</span>
              <p className="font-bold text-ink dark:text-text-dark-primary">{user?.username || 'Arjun Mehta'}</p>
            </div>
            <div>
              <span className="text-ink-subtle">Corporate Email:</span>
              <p className="font-bold text-ink dark:text-text-dark-primary">{user?.email || 'merchant@apextech.com'}</p>
            </div>
            <div>
              <span className="text-ink-subtle">Escalation Helpline:</span>
              <p className="font-bold text-ink dark:text-text-dark-primary">+91 22 6123 9800</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-lavender-mist dark:border-obsidian-border pb-3">
            <Building className="w-4 h-4 text-electric-violet" />
            <h2 className="text-sm font-bold text-ink dark:text-text-dark-primary">
              Registered Corporate Depot
            </h2>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <span className="text-ink-subtle">Dispatch Center Address:</span>
              <p className="font-bold text-ink dark:text-text-dark-primary leading-relaxed">
                Unit 102, Logistics Horizon Park, Mankoli Naka, Bhiwandi, Thane, Maharashtra — 421302, India
              </p>
            </div>
            <div>
              <span className="text-ink-subtle">FSSAI / Regulatory Compliance:</span>
              <p className="font-bold text-semantic-success">FSSAI Reg: #10022022000491 (Active)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

