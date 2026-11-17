import React, { useState } from 'react';
import { AccountLayout } from '../../components/account/AccountLayout';
import { SavedAddressItem, INITIAL_SAVED_ADDRESSES } from '../../components/checkout/DeliveryAddressSection';
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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AddressBookPage: React.FC = () => {
  const [addresses, setAddresses] = useState<SavedAddressItem[]>(() => {
    try {
      const cached = localStorage.getItem('omizon_saved_addresses');
      if (cached) return JSON.parse(cached);
    } catch {}
    return INITIAL_SAVED_ADDRESSES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

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

  const persistAddresses = (updated: SavedAddressItem[]) => {
    setAddresses(updated);
    try {
      localStorage.setItem('omizon_saved_addresses', JSON.stringify(updated));
    } catch {}
  };

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
    setEditingAddressId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setAddressLine(addr.addressLine);
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setTag(addr.tag);
    setIsDefault(Boolean(addr.isDefault));
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!fullName.trim() || !phone.trim() || !addressLine.trim() || !postalCode.trim()) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    if (!/^\d{6}$/.test(postalCode.trim())) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    if (!/^\+?[0-9]{10,13}$/.test(phone.replace(/[\s-]/g, ''))) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    if (editingAddressId) {
      // Edit existing
      const updated: SavedAddressItem[] = addresses.map((addr) => {
        if (addr.id === editingAddressId) {
          return {
            ...addr,
            fullName: fullName.trim(),
            phone: phone.trim(),
            addressLine: addressLine.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country: 'India',
            tag,
            isDefault: isDefault ? true : Boolean(addr.isDefault),
          };
        }
        return isDefault ? { ...addr, isDefault: false } : addr;
      });
      persistAddresses(updated);
      showToast('Address details updated successfully.');
    } else {
      // Add new
      const newAddr: SavedAddressItem = {
        id: `addr_${Date.now()}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine: addressLine.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: 'India',
        tag,
        isDefault: isDefault || addresses.length === 0,
      };

      const updated: SavedAddressItem[] = isDefault
        ? [...addresses.map((a) => ({ ...a, isDefault: false })), newAddr]
        : [...addresses, newAddr];

      persistAddresses(updated);
      showToast('New delivery address added successfully.');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the address for ${name}?`)) {
      return;
    }
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    persistAddresses(updated);
    showToast('Address removed successfully.');
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    persistAddresses(updated);
    showToast('Default delivery address updated.');
  };

  return (
    <AccountLayout activeKey="addresses">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        >
          Add New Address
        </Button>
      </div>

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((addr) => {
          return (
            <div
              key={addr.id}
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
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Set as Default
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
                    onClick={() => handleDelete(addr.id, addr.fullName)}
                    icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
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
                className="text-white/80 hover:text-white"
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
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98201 23456"
                    required
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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
                <Button type="submit" variant="primary">
                  Save Address
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
