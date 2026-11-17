import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

interface PincodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPincode: string;
  onApplyPincode: (pin: string, city: string) => void;
}

const QUICK_CITIES = [
  { name: 'Mumbai', pin: '400001', region: 'South Mumbai, Maharashtra' },
  { name: 'Bengaluru', pin: '560001', region: 'Central Bengaluru, Karnataka' },
  { name: 'Delhi', pin: '110001', region: 'Connaught Place, New Delhi' },
];

export const PincodeModal: React.FC<PincodeModalProps> = ({
  isOpen,
  onClose,
  currentPincode,
  onApplyPincode,
}) => {
  const [pin, setPin] = useState(currentPincode);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = (customPin?: string) => {
    const value = (customPin || pin).trim();
    if (!/^\d{6}$/.test(value)) {
      setError('Please enter a valid 6-digit Indian postal code');
      return;
    }
    setError('');
    const matched = QUICK_CITIES.find((c) => c.pin === value);
    const cityText = matched ? matched.region : `Postal Code ${value}, India`;
    onApplyPincode(value, cityText);
    onClose();
  };

  return (
    <div
      id="pincode-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4"
    >
      <div className="bg-surface-container-lowest rounded-xl max-w-sm w-full p-space-lg shadow-xl flex flex-col gap-space-md border border-surface-container-highest/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h4 className="font-title-md text-title-md text-on-surface">Change Delivery Pincode</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            id="close-pincode-modal"
            className="text-on-surface-variant hover:text-on-surface p-1 rounded transition-colors cursor-pointer"
            aria-label="Close pincode modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-body-sm text-on-surface-variant">
          Enter your 6-digit Indian Postal Code to check express courier availability and accurate transit
          times.
        </p>

        <div className="flex items-center gap-2">
          <input
            id="pincode-input"
            maxLength={6}
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              if (error) setError('');
            }}
            placeholder="400001"
            className="w-full bg-surface-container-low px-3 py-2 rounded-lg text-body-md font-semibold text-on-surface border-0 outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            id="apply-pincode-btn"
            onClick={() => handleVerify()}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-sm hover:bg-secondary transition-colors cursor-pointer shrink-0"
          >
            Verify
          </button>
        </div>

        {error && <p className="text-[11px] text-error font-medium">{error}</p>}

        <div className="text-[11px] text-outline">
          Quick cities:{' '}
          {QUICK_CITIES.map((city, idx) => (
            <React.Fragment key={city.pin}>
              <button
                type="button"
                onClick={() => {
                  setPin(city.pin);
                  handleVerify(city.pin);
                }}
                className="underline text-primary hover:text-secondary cursor-pointer"
              >
                {city.name} ({city.pin})
              </button>
              {idx < QUICK_CITIES.length - 1 ? ', ' : ''}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

