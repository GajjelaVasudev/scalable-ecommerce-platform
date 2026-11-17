import React, { useState } from 'react';
import { ShippingAddress } from '../../types';
import { MapPin, Plus, Check, ShieldCheck, Home, Building2, AlertCircle } from 'lucide-react';

export interface SavedAddressItem extends ShippingAddress {
  id: string;
  tag: 'HOME' | 'WORK' | 'OTHER';
  isDefault?: boolean;
}

interface DeliveryAddressSectionProps {
  selectedAddress: SavedAddressItem;
  onSelectAddress: (addr: SavedAddressItem) => void;
  onAddressConfirmed?: () => void;
}

export const INITIAL_SAVED_ADDRESSES: SavedAddressItem[] = [
  {
    id: 'addr_01',
    fullName: 'Rajesh Singhania',
    phone: '+91 98201 23456',
    addressLine: 'Flat 402, Highmont Residences, Senapati Bapat Marg, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400013',
    country: 'India',
    tag: 'HOME',
    isDefault: true,
  },
  {
    id: 'addr_02',
    fullName: 'Rajesh Singhania (Office)',
    phone: '+91 98201 23456',
    addressLine: 'Level 9, Maker Maxity, Bandra Kurla Complex (BKC), Bandra East',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400051',
    country: 'India',
    tag: 'WORK',
    isDefault: false,
  },
];

export const DeliveryAddressSection: React.FC<DeliveryAddressSectionProps> = ({
  selectedAddress,
  onSelectAddress,
  onAddressConfirmed,
}) => {
  const [addresses, setAddresses] = useState<SavedAddressItem[]>(INITIAL_SAVED_ADDRESSES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    tag: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
  });
  const [formError, setFormError] = useState('');

  const openAddForm = () => {
    setEditingId(null);
    setFormData({
      fullName: '',
      phone: '',
      addressLine: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '',
      country: 'India',
      tag: 'HOME',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (addr: SavedAddressItem) => {
    setEditingId(addr.id);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone.replace('+91 ', ''),
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      tag: addr.tag,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.fullName.trim() ||
      !formData.phone.trim() ||
      !formData.addressLine.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.postalCode.trim()
    ) {
      setFormError('All fields marked with an asterisk are required.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const cleanPin = formData.postalCode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setFormError('Please enter a valid 6-digit PIN code.');
      return;
    }

    const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10
      ? `+${cleanPhone}`
      : `+91 ${cleanPhone.slice(-10)}`;

    if (editingId) {
      const updated = addresses.map((a) =>
        a.id === editingId
          ? {
              ...a,
              ...formData,
              phone: formattedPhone,
              postalCode: cleanPin,
            }
          : a
      );
      setAddresses(updated);
      const updatedItem = updated.find((a) => a.id === editingId);
      if (updatedItem && selectedAddress.id === editingId) {
        onSelectAddress(updatedItem);
      }
    } else {
      const newAddress: SavedAddressItem = {
        id: `addr_${Date.now()}`,
        ...formData,
        phone: formattedPhone,
        postalCode: cleanPin,
        isDefault: false,
      };
      setAddresses((prev) => [...prev, newAddress]);
      onSelectAddress(newAddress);
    }

    setIsFormOpen(false);
  };

  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden" id="step-address">
      {/* Section Header */}
      <div className="p-5 md:p-6 bg-surface-container-low flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-title-sm">
            1
          </span>
          <h2 className="font-headline-sm text-on-surface">Shipping &amp; Delivery Address</h2>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="text-primary hover:text-secondary font-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New</span>
        </button>
      </div>

      <div className="p-5 md:p-6 flex flex-col gap-4">
        {/* Modal / Inline Add & Edit Form */}
        {isFormOpen && (
          <form
            onSubmit={handleSaveForm}
            className="p-5 bg-surface-container-low rounded-xl border border-primary/20 flex flex-col gap-4 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <span className="font-title-sm text-on-surface font-semibold">
                {editingId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </span>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-outline hover:text-on-surface text-body-sm"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-error/10 text-error rounded-md text-body-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Rajesh Singhania"
                  className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md border border-outline-variant/50 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                  Mobile Number *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-surface-container text-on-surface-variant text-body-sm rounded-l-lg border border-r-0 border-outline-variant/50">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-r-lg font-body-md border border-outline-variant/50 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                Flat, House no., Building, Street *
              </label>
              <input
                type="text"
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                placeholder="e.g. Flat 402, Highmont Residences, Senapati Bapat Marg"
                className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md border border-outline-variant/50 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Mumbai"
                  className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md border border-outline-variant/50 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md border border-outline-variant/50 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-body-sm text-on-surface-variant font-medium mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="400013"
                  maxLength={6}
                  className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md border border-outline-variant/50 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <span className="text-body-sm font-medium text-on-surface-variant">Address Tag:</span>
              <label className="flex items-center gap-1.5 text-body-sm cursor-pointer">
                <input
                  type="radio"
                  name="tag"
                  checked={formData.tag === 'HOME'}
                  onChange={() => setFormData({ ...formData, tag: 'HOME' })}
                  className="accent-primary"
                />
                <span>Home</span>
              </label>
              <label className="flex items-center gap-1.5 text-body-sm cursor-pointer">
                <input
                  type="radio"
                  name="tag"
                  checked={formData.tag === 'WORK'}
                  onChange={() => setFormData({ ...formData, tag: 'WORK' })}
                  className="accent-primary"
                />
                <span>Work / Commercial</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="bg-primary hover:bg-secondary text-on-primary px-4 py-2 rounded-lg font-label-md transition-colors cursor-pointer font-semibold"
              >
                {editingId ? 'Update Address' : 'Save & Deliver Here'}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Saved Addresses List */}
        {addresses.map((addr) => {
          const isSelected = selectedAddress.id === addr.id;

          if (isSelected) {
            return (
              <div
                key={addr.id}
                className="relative bg-surface-container-lowest rounded-lg p-5 shadow-md shadow-primary/5 border border-primary/20 transition-all"
              >
                {/* Badge Tag */}
                <div className="absolute -top-3 left-4 bg-primary text-on-primary text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm">
                  {addr.tag === 'HOME' ? (
                    <Home className="w-3 h-3" />
                  ) : (
                    <Building2 className="w-3 h-3" />
                  )}
                  {addr.isDefault ? `DEFAULT • ${addr.tag}` : addr.tag}
                </div>

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-start gap-3">
                    {/* Radio Checked SVG Graphic */}
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-title-md text-on-surface font-bold">
                          {addr.fullName}
                        </span>
                        <span className="bg-surface-container-high text-on-primary-fixed text-[11px] font-semibold px-2 py-0.5 rounded">
                          {addr.phone}
                        </span>
                      </div>
                      <p className="font-body-md text-on-surface-variant mt-2 leading-relaxed">
                        {addr.addressLine},<br />
                        {addr.city}, {addr.state} —{' '}
                        <span className="font-semibold text-on-surface">{addr.postalCode}</span>, {addr.country}
                      </p>

                      {/* Pincode Speed Badge */}
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-container-low text-primary text-body-sm font-medium">
                        <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
                        <span>
                          Pincode {addr.postalCode} eligible for{' '}
                          <strong>FastX Same-Day &amp; Next-Day</strong> delivery
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditForm(addr)}
                    className="text-primary hover:text-secondary font-label-md px-2 py-1 rounded hover:bg-surface-container-low transition-colors shrink-0 cursor-pointer font-semibold"
                  >
                    Edit
                  </button>
                </div>

                <div className="mt-4 pt-3 flex flex-wrap items-center gap-3 border-t border-outline-variant/15">
                  <button
                    type="button"
                    onClick={() => onAddressConfirmed && onAddressConfirmed()}
                    className="bg-primary text-on-primary hover:bg-secondary px-4 py-2 rounded-lg font-label-md flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer font-semibold"
                  >
                    <Check className="w-4 h-4" />
                    Deliver to this Address
                  </button>
                  <span className="text-outline text-body-sm hidden sm:inline">•</span>
                  <span className="text-outline font-body-sm">
                    Cash on Delivery &amp; Contactless Handover available
                  </span>
                </div>
              </div>
            );
          }

          // Unselected Address Card
          return (
            <div
              key={addr.id}
              onClick={() => onSelectAddress(addr)}
              className="bg-surface-container-low rounded-lg p-4 flex items-start justify-between gap-3 hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-outline-variant/30"
            >
              <div className="flex items-start gap-3">
                {/* Radio Unchecked Graphic */}
                <div className="w-5 h-5 rounded-full border-2 border-outline-variant shrink-0 mt-0.5" />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-title-sm text-on-surface font-semibold">
                      {addr.fullName}
                    </span>
                    <span className="bg-surface-container-highest text-on-surface-variant text-[10px] uppercase font-semibold px-2 py-0.5 rounded">
                      {addr.tag}
                    </span>
                  </div>
                  <p className="font-body-sm text-on-surface-variant mt-1">
                    {addr.addressLine}, {addr.city}, {addr.state} — {addr.postalCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditForm(addr);
                  }}
                  className="text-outline hover:text-primary font-label-sm px-2 py-1 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onSelectAddress(addr)}
                  className="text-outline hover:text-primary font-label-sm px-2 py-1 transition-colors font-semibold"
                >
                  Select
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
