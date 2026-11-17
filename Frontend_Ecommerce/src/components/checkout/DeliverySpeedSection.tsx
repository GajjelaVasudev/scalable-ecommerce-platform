import React from 'react';
import { Truck } from 'lucide-react';

export type DeliverySpeedOption = 'fastx' | 'standard' | 'morning';

interface DeliverySpeedSectionProps {
  selectedSpeed: DeliverySpeedOption;
  onSelectSpeed: (speed: DeliverySpeedOption, fee: number) => void;
  itemCount?: number;
}

export const DeliverySpeedSection: React.FC<DeliverySpeedSectionProps> = ({
  selectedSpeed,
  onSelectSpeed,
  itemCount = 3,
}) => {
  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden" id="step-shipping">
      <div className="p-5 md:p-6 bg-surface-container-low flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-title-sm">
            2
          </span>
          <h2 className="font-headline-sm text-on-surface">Select Delivery Speed</h2>
        </div>
        <div className="flex items-center gap-1.5 text-secondary font-label-md font-semibold">
          <Truck className="w-4 h-4" />
          <span>{itemCount} {itemCount === 1 ? 'Item' : 'Items'} in 1 Shipment</span>
        </div>
      </div>

      <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Option 1: FastX Prime Guaranteed */}
        <label
          onClick={() => onSelectSpeed('fastx', 0)}
          className={`relative p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
            selectedSpeed === 'fastx'
              ? 'bg-surface-container-low ring-2 ring-primary shadow-sm shadow-primary/10'
              : 'bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container-low'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              {/* Radio Graphic */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedSpeed === 'fastx' ? 'border-primary' : 'border-outline-variant'
                }`}
              >
                {selectedSpeed === 'fastx' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className="font-title-sm text-on-surface font-bold">FastX Next-Day</span>
            </div>
            <span className="bg-primary text-on-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
              POPULAR
            </span>
          </div>

          <div className="mt-3">
            <p className="font-body-sm text-on-surface font-semibold">Tomorrow, 11:00 AM – 2:00 PM</p>
            <p className="font-body-sm text-on-surface-variant mt-0.5 text-[12px]">
              Guaranteed doorstep handover
            </p>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/15">
            <div className="flex items-center gap-1.5">
              <span className="font-title-md text-primary font-bold">FREE</span>
              <span className="text-outline line-through font-body-sm">₹99</span>
            </div>
            <span className="bg-surface-container-highest text-secondary text-[10px] font-bold px-2 py-0.5 rounded">
              PRIME FREE
            </span>
          </div>
        </label>

        {/* Option 2: Standard Delivery */}
        <label
          onClick={() => onSelectSpeed('standard', 0)}
          className={`relative p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
            selectedSpeed === 'standard'
              ? 'bg-surface-container-low ring-2 ring-primary shadow-sm shadow-primary/10'
              : 'bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container-low'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedSpeed === 'standard' ? 'border-primary' : 'border-outline-variant'
                }`}
              >
                {selectedSpeed === 'standard' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className="font-title-sm text-on-surface font-semibold">Standard Speed</span>
            </div>
            <span className="text-on-surface-variant font-label-sm font-semibold">Eco</span>
          </div>

          <div className="mt-3">
            <p className="font-body-sm text-on-surface">2–3 Business Days</p>
            <p className="font-body-sm text-on-surface-variant mt-0.5 text-[12px]">
              Estimated by Friday
            </p>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/15">
            <span className="font-title-md text-on-surface font-bold">FREE</span>
            <span className="text-outline text-body-sm">Standard</span>
          </div>
        </label>

        {/* Option 3: Morning Express */}
        <label
          onClick={() => onSelectSpeed('morning', 149)}
          className={`relative p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
            selectedSpeed === 'morning'
              ? 'bg-surface-container-low ring-2 ring-primary shadow-sm shadow-primary/10'
              : 'bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container-low'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedSpeed === 'morning' ? 'border-primary' : 'border-outline-variant'
                }`}
              >
                {selectedSpeed === 'morning' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className="font-title-sm text-on-surface font-semibold">Morning Express</span>
            </div>
            <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded">
              SLOT
            </span>
          </div>

          <div className="mt-3">
            <p className="font-body-sm text-on-surface font-semibold">Tomorrow by 9:00 AM</p>
            <p className="font-body-sm text-on-surface-variant mt-0.5 text-[12px]">
              Priority express courier
            </p>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/15">
            <span className="font-title-md text-on-surface font-bold">₹149</span>
            <span className="text-outline text-body-sm">+₹149 slot fee</span>
          </div>
        </label>
      </div>
    </section>
  );
};
