import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccountLayout } from '../../components/account/AccountLayout';
import { formatCurrency } from '../../utils/format';
import {
  Package,
  MapPin,
  CreditCard,
  Headphones,
  Truck,
  Zap,
  Sparkles,
  ChevronRight,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(
    user?.username === 'priya_sharma' ? 'Priya Sharma' : user?.username || 'Priya Sharma'
  );
  const [profilePhone, setProfilePhone] = useState('+91 98200 44912');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'priya.sharma@example.com');
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingProfile(false);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3500);
  };

  return (
    <AccountLayout activeKey="overview">
      {/* Toast Feedback */}
      {saveFeedback && (
        <div className="p-3 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* 1. Personalized Welcome Banner with Gradient */}
      <div className="bg-gradient-to-r from-primary via-purple-700 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                VIP Elite Member
              </span>
              <span className="text-white/80 text-xs">Prime+ Activated</span>
            </div>
            <h1 className="font-headline-lg font-bold text-2xl sm:text-3xl mt-2 tracking-tight">
              Welcome back, {profileName.split(' ')[0]}!
            </h1>
            <p className="font-body-md text-white/80 text-sm mt-1 max-w-xl">
              Manage your orders, saved addresses, digital payment methods, and exclusive member benefits.
            </p>
          </div>

          {/* Quick Metrics Chips */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <span className="text-white/70 text-[10px] font-bold uppercase block">Active Orders</span>
              <span className="text-xl font-bold font-mono">2</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <span className="text-white/70 text-[10px] font-bold uppercase block">Prime Savings</span>
              <span className="text-xl font-bold font-mono">₹14.2k</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <span className="text-white/70 text-[10px] font-bold uppercase block">OMIZON Coins</span>
              <span className="text-xl font-bold font-mono text-amber-300">2,450</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. In-Flight Active Delivery Pulse Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
            <div>
              <span className="font-label-sm text-primary font-bold uppercase text-[11px] block">
                In-Flight Shipment
              </span>
              <h3 className="font-title-md text-on-surface font-bold text-base">
                ApexBook M3 Ultra 16-inch (32GB Unified RAM, 1TB SSD)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Arriving Tomorrow by 2:00 PM
            </span>
            <Link to="/account/orders/OMZ-993821-IN">
              <Button variant="primary" size="sm" icon={<Truck className="w-3.5 h-3.5" />}>
                Track Package
              </Button>
            </Link>
          </div>
        </div>

        {/* Mini progress tracker */}
        <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant">
          <span className="text-primary font-bold">✓ Dispatched from Mumbai</span>
          <span className="text-primary font-bold">✓ Out for Delivery</span>
          <span className="text-outline">Doorstep Handover</span>
        </div>
      </div>

      {/* 3. Four Quick Action Hub Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Your Orders */}
        <Link
          to="/account/orders"
          className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
          </div>
          <div className="mt-4">
            <h4 className="font-title-sm text-on-surface font-bold text-sm group-hover:text-primary transition-colors">
              Your Orders
            </h4>
            <p className="font-body-sm text-outline text-xs mt-0.5">
              2 orders in transit • View invoice
            </p>
          </div>
        </Link>

        {/* Card 2: Address Book */}
        <Link
          to="/account/addresses"
          className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
          </div>
          <div className="mt-4">
            <h4 className="font-title-sm text-on-surface font-bold text-sm group-hover:text-primary transition-colors">
              Address Book
            </h4>
            <p className="font-body-sm text-outline text-xs mt-0.5">
              3 saved delivery destinations
            </p>
          </div>
        </Link>

        {/* Card 3: OMIZON Pay & Cards */}
        <Link
          to="/account/settings"
          className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
          </div>
          <div className="mt-4">
            <h4 className="font-title-sm text-on-surface font-bold text-sm group-hover:text-primary transition-colors">
              OMIZON Pay & Cards
            </h4>
            <p className="font-body-sm text-outline text-xs mt-0.5">
              Balance: ₹4,500 • 2 saved cards
            </p>
          </div>
        </Link>

        {/* Card 4: Customer Care */}
        <div
          onClick={() => alert('Connecting you to 24x7 OMIZON Priority Support...')}
          className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
          </div>
          <div className="mt-4">
            <h4 className="font-title-sm text-on-surface font-bold text-sm group-hover:text-primary transition-colors">
              Customer Care
            </h4>
            <p className="font-body-sm text-outline text-xs mt-0.5">
              24x7 VIP Concierge Support
            </p>
          </div>
        </div>
      </div>

      {/* 4. Profile Information & Quick Edit Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-title-md text-on-surface font-bold text-base">
              Personal Information
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            icon={<Edit3 className="w-3.5 h-3.5" />}
          >
            {isEditingProfile ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                required
                className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                required
                className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingProfile(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div className="flex flex-col">
              <span className="font-label-sm text-outline uppercase text-[11px]">Full Name</span>
              <span className="font-title-sm text-on-surface font-semibold text-sm mt-0.5">
                {profileName}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-outline uppercase text-[11px]">Email Address</span>
              <span className="font-title-sm text-on-surface font-semibold text-sm mt-0.5">
                {profileEmail}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-outline uppercase text-[11px]">Phone</span>
              <span className="font-title-sm text-on-surface font-semibold text-sm mt-0.5">
                {profilePhone}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Recent Orders Snapshot */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
          <h3 className="font-title-md text-on-surface font-bold text-base">
            Recent Orders Snapshot
          </h3>
          <Link
            to="/account/orders"
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-title-sm text-on-surface font-semibold text-xs line-clamp-1">
                  SoundPulse Studio Pro Wireless ANC Headphones
                </h4>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                  Delivered on Oct 18, 2024
                </span>
              </div>
            </div>
            <span className="font-title-sm text-on-surface font-bold text-sm shrink-0">
              ₹24,999
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-title-sm text-on-surface font-semibold text-xs line-clamp-1">
                  AuraGlow Minimalist Architect Desk Lamp
                </h4>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                  Delivered on Oct 18, 2024
                </span>
              </div>
            </div>
            <span className="font-title-sm text-on-surface font-bold text-sm shrink-0">
              ₹8,499
            </span>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
};

export default AccountPage;
