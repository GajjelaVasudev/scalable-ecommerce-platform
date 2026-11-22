import React, { useState, useEffect, useCallback } from 'react';
import { ShippingAddress, SavedAddressItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../services/api';
import {
  getStableUserId,
  isDemoUser,
  setAccountAddresses,
  extractTenDigitPhone,
} from '../../utils/accountStorage';
import { migrateLegacyAddresses } from '../../utils/addressMigration';
import {
  MapPin,
  Plus,
  Check,
  ShieldCheck,
  Home,
  Building2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export type { SavedAddressItem };

interface DeliveryAddressSectionProps {
  selectedAddress: SavedAddressItem | null;
  onSelectAddress: (addr: SavedAddressItem | null) => void;
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
  const { user, isAuthenticated } = useAuth();
  const userId = getStableUserId(user);
  const isDemo = isDemoUser(user);

  const [addresses, setAddresses] = useState<SavedAddressItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '',
    country: 'India',
    tag: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
  });
  const [formError, setFormError] = useState('');

  // Load addresses from backend or demo source
  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      if (isDemo) {
        setAddresses(INITIAL_SAVED_ADDRESSES);
        if (!selectedAddress) {
          onSelectAddress(INITIAL_SAVED_ADDRESSES[0]);
        }
      } else {
        setAddresses([]);
      }
      return;
    }

    setIsLoading(true);
    try {
      if (!isDemo) {
        await migrateLegacyAddresses(user);
      }

      const list = await api.addresses.list();
      if (Array.isArray(list) && list.length > 0) {
        setAddresses(list);
        setAccountAddresses(userId, list);

        // Auto-select default or first address if no address currently selected
        if (!selectedAddress) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          onSelectAddress(defaultAddr);
        } else {
          // If the selected address was updated, refresh its reference
          const fresh = list.find((a) => (a.id || (a as any)._id) === (selectedAddress.id || (selectedAddress as any)._id));
          if (fresh) onSelectAddress(fresh);
        }
      } else if (isDemo) {
        setAddresses(INITIAL_SAVED_ADDRESSES);
        if (!selectedAddress) {
          onSelectAddress(INITIAL_SAVED_ADDRESSES[0]);
        }
      } else {
        setAddresses([]);
        setAccountAddresses(userId, []);
      }
    } catch (err) {
      console.error('Failed to fetch addresses during checkout:', err);
      if (isDemo) {
        setAddresses(INITIAL_SAVED_ADDRESSES);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, isDemo, user, selectedAddress, onSelectAddress]);

  useEffect(() => {
    fetchAddresses();
  }, [userId, isDemo]);

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
    const aId = addr.id || (addr as any)._id;
    setEditingId(aId);
    setFormData({
      fullName: addr.fullName,
      phone: extractTenDigitPhone(addr.phone),
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || 'India',
      tag: addr.tag || 'HOME',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
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

    const rawDigits = formData.phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    const cleanPin = formData.postalCode.replace(/\D/g, '');
    if (cleanPin.length !== 6 || cleanPin.startsWith('0')) {
      setFormError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    const formattedPhone = `+91 ${cleanPhone}`;

    const payload = {
      fullName: formData.fullName.trim(),
      phone: formattedPhone,
      addressLine: formData.addressLine.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postalCode: cleanPin,
      country: 'India',
      tag: formData.tag,
      isDefault: addresses.length === 0,
    };

    setIsSubmitting(true);
    setFormError('');

    try {
      if (isAuthenticated && userId && !isDemo) {
        if (editingId) {
          const updated = await api.addresses.update(editingId, payload);
          const nextList = addresses.map((a) => {
            const aId = a.id || (a as any)._id;
            return aId === editingId ? updated : a;
          });
          setAddresses(nextList);
          setAccountAddresses(userId, nextList);
          onSelectAddress(updated);
        } else {
          const created = await api.addresses.create(payload);
          const nextList = [...addresses, created];
          setAddresses(nextList);
          setAccountAddresses(userId, nextList);
          onSelectAddress(created);
        }
      } else {
        // Guest or demo fallback: preserve state client-side
        if (editingId) {
          const updated = addresses.map((a) => {
            const aId = a.id || (a as any)._id;
            return aId === editingId
              ? { ...a, ...payload, id: aId }
              : a;
          });
          setAddresses(updated);
          const chosen = updated.find((a) => (a.id || (a as any)._id) === editingId);
          if (chosen) onSelectAddress(chosen);
        } else {
          const newAddress: SavedAddressItem = {
            id: `addr_${Date.now()}`,
            ...payload,
          };
          const nextList = [...addresses, newAddress];
          setAddresses(nextList);
          onSelectAddress(newAddress);
        }
      }

      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Checkout address save error:', err);
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to save address to server. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
        {/* Inline Add & Edit Form */}
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
                className="text-outline hover:text-on-surface text-body-sm cursor-pointer"
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
                  required
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
                    required
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
                required
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
                  required
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
                  required
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
                  required
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
              <label className="flex items-center gap-1.5 text-body-sm cursor-pointer">
                <input
                  type="radio"
                  name="tag"
                  checked={formData.tag === 'OTHER'}
                  onChange={() => setFormData({ ...formData, tag: 'OTHER' })}
                  className="accent-primary"
                />
                <span>Other</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-secondary text-on-primary px-4 py-2 rounded-lg font-label-md transition-colors cursor-pointer font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingId ? 'Update Address' : 'Save & Deliver Here'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-6 flex items-center justify-center gap-2 text-on-surface-variant text-body-md">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Loading delivery addresses...</span>
          </div>
        )}

        {/* Saved Addresses List or Empty Prompt */}
        {!isLoading && addresses.length === 0 ? (
          !isFormOpen && (
            <div className="p-8 text-center border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-1">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-title-sm text-on-surface font-semibold text-base">
                No delivery address selected
              </h3>
              <p className="font-body-sm text-on-surface-variant text-sm max-w-md">
                Please add a delivery address to calculate accurate delivery speeds, slots, and statutory taxes.
              </p>
              <button
                type="button"
                onClick={openAddForm}
                className="mt-2 bg-primary hover:bg-secondary text-on-primary px-4 py-2 rounded-lg font-label-md transition-colors cursor-pointer font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Delivery Address</span>
              </button>
            </div>
          )
        ) : (
          !isLoading &&
          addresses.map((addr) => {
            const addrId = addr.id || (addr as any)._id;
            const selectedId = selectedAddress ? selectedAddress.id || (selectedAddress as any)._id : null;
            const isSelected = selectedId === addrId;

            if (isSelected) {
              return (
                <div
                  key={addrId}
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
                key={addrId}
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
                    className="text-outline hover:text-primary font-label-sm px-2 py-1 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectAddress(addr)}
                    className="text-outline hover:text-primary font-label-sm px-2 py-1 transition-colors font-semibold cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
