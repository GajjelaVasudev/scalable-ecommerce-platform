import React from 'react';
import { FileCheck2, CheckCircle2, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const SellerVerificationPage: React.FC = () => {
  const steps = [
    {
      title: 'Certificate of Corporate Incorporation (MCA)',
      desc: 'CIN: U72900MH2021PTC368921 verified with Ministry of Corporate Affairs database.',
      status: 'verified',
    },
    {
      title: 'GSTIN & PAN Tax Verification',
      desc: 'GSTIN: 27AADCS1234F1Z8 verified via Government Tax Portal. Input Tax Credit active.',
      status: 'verified',
    },
    {
      title: 'Bank Account Penny Drop Validation',
      desc: 'HDFC Bank account verified via ₹1.00 automated reverse-charge penny drop.',
      status: 'verified',
    },
    {
      title: 'Authorized Brand Reseller & Trademark Deed',
      desc: 'Direct OEM authorization letter on file for SoundPulse and ApexBook hardware.',
      status: 'verified',
    },
    {
      title: 'OMIZON Marketplace Service Agreement',
      desc: 'Electronic contract signed via Aadhaar e-Sign on 12 Jan 2026.',
      status: 'verified',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            KYC Verification & Compliance Checklist
          </h1>
          <p className="text-xs text-ink-muted">
            Status of corporate documentation, regulatory sign-offs, and merchant trust verification
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-semantic-success border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Tier-1 Verified Merchant</span>
        </div>
      </div>

      <div className="bg-white dark:bg-obsidian-surface-1 p-6 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col gap-4">
        <div className="flex flex-col divide-y divide-lavender-mist dark:divide-obsidian-border">
          {steps.map((s, idx) => (
            <div key={idx} className="py-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-50 text-semantic-success flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink dark:text-text-dark-primary">{s.title}</h3>
                  <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                Verified
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

