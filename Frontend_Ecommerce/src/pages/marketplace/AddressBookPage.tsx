import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AccountLayout } from '../../components/account/AccountLayout';
import { INITIAL_SAVED_ADDRESSES } from '../../components/checkout/DeliveryAddressSection';
import { SavedAddressItem } from '../../types';
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
  Edit2,
  Trash2,
  CheckCircle2,
  Home,
  Briefcase,
  Building,
  Check,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AddressBookPage: React.FC = () => {
  const { user } = useAuth();
  const userId = getStableUserId(user);
  const isDemo = isDemoUser(user);

  const [addresses, setAddresses] = useState<SavedAddressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('');
  const [tag, setTag] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME');
  const [isDefault, setIsDefault] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAddresses = useCallback(async () => {
    if (!userId) {
      setAddresses(isDemo ? INITIAL_SAVED_ADDRESSES : []);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      // 1. One-time legacy migration check
      if (!isDemo) {
        await migrateLegacyAddresses(user);
      }

      // 2. Fetch authenticated customer addresses from backend
      const data = await api.addresses.list();
      if (Array.isArray(data) && data.length > 0) {
        setAddresses(data);
        setAccountAddresses(userId, data);
      } else if (isDemo) {
        setAddresses(INITIAL_SAVED_ADDRESSES);
      } else {
        setAddresses([]);
        setAccountAddresses(userId, []);
      }
    } catch (err: any) {
      console.error('Failed to load customer addresses:', err);
      if (isDemo) {
        setAddresses(INITIAL_SAVED_ADDRESSES);
      } else {
        setFetchError(
          err instanceof ApiError ? err.message : 'Unable to connect to address service. Please retry.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, isDemo, user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openAddModal = () => {
    setEditingAddressId(null);
    setFullName('');
    setPhone('');
    setAddressLine('');
    setCity('Mumbai');
    setState('Maharashtra');
    setPostalCode('');
    setTag('HOME');
    setIsDefault(addresses.length === 0);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (addr: SavedAddressItem) => {
    setEditingAddressId(addr.id || (addr as any)._id);
    setFullName(addr.fullName);
    setPhone(extractTenDigitPhone(addr.phone));
    setAddressLine(addr.addressLine);
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setTag(addr.tag);
    setIsDefault(Boolean(addr.isDefault));
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!fullName.trim() || !phone.trim() || !addressLine.trim() || !postalCode.trim() || !city.trim() || !state.trim()) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    const cleanPin = postalCode.replace(/\D/g, '');
    if (cleanPin.length !== 6 || cleanPin.startsWith('0')) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    const rawDigits = phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    const formattedPhone = `+91 ${cleanPhone}`;

    const payload = {
      fullName: fullName.trim(),
      phone: formattedPhone,
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: cleanPin,
      country: 'India',
      tag,
      isDefault: isDefault || addresses.length === 0,
    };

    setIsSaving(true);

    try {
      if (editingAddressId) {
        // Edit existing via backend API
        const updated = await api.addresses.update(editingAddressId, payload);
        const nextList = addresses.map((a) => {
          const aId = a.id || (a as any)._id;
          if (aId === editingAddressId) {
            return updated;
          }
          return payload.isDefault ? { ...a, isDefault: false } : a;
        });
        setAddresses(nextList);
        setAccountAddresses(userId, nextList);
        showToast('Address details updated successfully.');
      } else {
        // Create new address via backend API
        const created = await api.addresses.create(payload);
        const nextList = payload.isDefault
          ? [...addresses.map((a) => ({ ...a, isDefault: false })), created]
          : [...addresses, created];
        setAddresses(nextList);
        setAccountAddresses(userId, nextList);
        showToast('New delivery address added successfully.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save address error:', err);
      setErrorMessage(
        err instanceof ApiError ? err.message : 'Failed to save address to server. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the address for ${name}?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const res = await api.addresses.delete(id);
      const remaining = addresses.filter((a) => (a.id || (a as any)._id) !== id);

      if (res.reassignedDefaultId) {
        const withNewDefault = remaining.map((a) => {
          const aId = a.id || (a as any)._id;
          return {
            ...a,
            isDefault: aId === res.reassignedDefaultId,
          };
        });
        setAddresses(withNewDefault);
        setAccountAddresses(userId, withNewDefault);
      } else {
        setAddresses(remaining);
        setAccountAddresses(userId, remaining);
      }

      showToast('Address removed successfully.');
    } catch (err: any) {
      console.error('Delete address error:', err);
      showToast(err instanceof ApiError ? err.message : 'Failed to delete address.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);

    try {
      await api.addresses.setDefault(id);
      const updated = addresses.map((a) => {
        const aId = a.id || (a as any)._id;
        return {
          ...a,
          isDefault: aId === id,
        };
      });
      setAddresses(updated);
      setAccountAddresses(userId, updated);
      showToast('Default delivery address updated.');
    } catch (err: any) {
      console.error('Set default address error:', err);
      showToast(err instanceof ApiError ? err.message : 'Failed to set default address.');
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <AccountLayout activeKey="addresses">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-sm font-semibold animate-fade-in mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-md text-on-surface font-bold text-2xl">
              Saved Address Book
            </h1>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
              {addresses.length} Addresses
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Manage your doorstep delivery destinations, workplace addresses, and default billing contacts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          icon={<Plus className="w-4 h-4" />}
          disabled={isLoading}
        >
          Add New Address
        </Button>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="p-4 bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 rounded-2xl flex items-center justify-between gap-3 text-sm font-medium mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadAddresses} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-20 bg-surface-container-high rounded" />
                <div className="h-5 w-24 bg-surface-container-high rounded" />
              </div>
              <div className="h-6 w-40 bg-surface-container-high rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-surface-container-high rounded" />
                <div className="h-4 w-3/4 bg-surface-container-high rounded" />
              </div>
              <div className="h-8 w-full bg-surface-container-high rounded mt-4" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        /* Empty State */
        <div className="bg-surface-container-lowest rounded-2xl p-12 border border-dashed border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-2">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-title-lg text-on-surface font-bold text-lg">
            No saved delivery addresses found
          </h2>
          <p className="font-body-md text-on-surface-variant text-sm max-w-md">
            Save your home, office, or frequently used addresses to enjoy 1-Click FastX checkout and instant delivery estimations.
          </p>
          <Button
            variant="primary"
            onClick={openAddModal}
            icon={<Plus className="w-4 h-4" />}
            className="mt-3"
          >
            Add Your First Address
          </Button>
        </div>
      ) : (
        /* Address Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => {
            const addrId = addr.id || (addr as any)._id;
            const isDeleting = deletingId === addrId;
            const isSettingDefault = settingDefaultId === addrId;

            return (
              <div
                key={addrId}
                className={`bg-surface-container-lowest rounded-2xl p-6 border shadow-sm transition-all flex flex-col justify-between relative ${
                  addr.isDefault
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-outline-variant/20 hover:border-outline-variant/40'
                }`}
              >
                <div>
                  {/* Header Tag & Default Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container-high text-on-surface flex items-center gap-1">
                      {addr.tag === 'HOME' && <Home className="w-3 h-3 text-primary" />}
                      {addr.tag === 'WORK' && <Briefcase className="w-3 h-3 text-primary" />}
                      {addr.tag === 'OTHER' && <Building className="w-3 h-3 text-primary" />}
                      {addr.tag}
                    </span>

                    {addr.isDefault && (
                      <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Default Delivery
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <h3 className="font-title-md text-on-surface font-bold text-base">
                    {addr.fullName}
                  </h3>
                  <p className="font-body-md text-on-surface-variant text-sm mt-1">
                    {addr.addressLine}
                  </p>
                  <p className="font-body-md text-on-surface-variant text-sm">
                    {addr.city}, {addr.state} — <strong className="text-on-surface">{addr.postalCode}</strong>
                  </p>
                  <p className="font-body-sm text-outline text-xs mt-2">
                    Contact: {addr.phone}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-outline-variant/15 flex items-center justify-between gap-2">
                  <div>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addrId)}
                        disabled={isSettingDefault}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSettingDefault && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>Set as Default</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(addr)}
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(addrId, addr.fullName)}
                      disabled={isDeleting}
                      icon={
                        isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        )
                      }
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 animate-scale-up">
            <div className="p-4 bg-primary text-white flex items-center justify-between">
              <h3 className="font-headline-sm font-bold text-base">
                {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 flex flex-col gap-4">
              {errorMessage && (
                <div className="p-3 bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                    Phone Number (10 digits) *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-surface-container text-on-surface-variant text-xs rounded-l-xl border border-r-0 border-outline-variant/30 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98201 23456"
                      maxLength={12}
                      required
                      className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-r-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                  Flat, House no., Building, Company, Apartment *
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. Flat 902, Tower B, Oberoi Sky City, Borivali East"
                  required
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                    City / District *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                    6-digit PIN Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="400066"
                    required
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-outline uppercase text-[11px] block mb-1.5">
                  Address Type / Label
                </label>
                <div className="flex items-center gap-3">
                  {(['HOME', 'WORK', 'OTHER'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        tag === t
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultAddressCheckbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="defaultAddressCheckbox" className="text-xs text-on-surface font-medium cursor-pointer">
                  Make this my default shipping address for 1-Click FastX checkout
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/15">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSaving} icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                  {isSaving ? 'Saving...' : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default AddressBookPage;
