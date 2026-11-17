import React from 'react';
import { CheckCircle2, MapPin, Zap, CreditCard, ClipboardCheck } from 'lucide-react';

interface CheckoutStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="w-full bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-sm mb-6 border border-outline-variant/15">
      <div className="flex items-center justify-between overflow-x-auto gap-3 py-1">
        {/* Step 1: Cart */}
        <div
          className={`flex items-center gap-2.5 shrink-0 ${
            currentStep >= 1 ? 'cursor-pointer opacity-100' : 'opacity-60'
          }`}
          onClick={() => onStepClick && onStepClick(1)}
        >
          <div className="w-8 h-8 rounded-full bg-surface-container-highest text-primary flex items-center justify-center font-title-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-outline uppercase tracking-wider text-[11px]">Step 1</span>
            <span className="font-title-sm text-on-surface">Cart</span>
          </div>
        </div>

        <div className="h-0.5 w-6 sm:w-12 bg-surface-container-highest shrink-0" />

        {/* Step 2: Address */}
        <div
          className={`flex items-center gap-2.5 shrink-0 ${
            currentStep >= 2 ? 'cursor-pointer' : 'opacity-70'
          }`}
          onClick={() => onStepClick && onStepClick(2)}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-title-sm shadow-sm transition-colors ${
              currentStep === 2
                ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                : currentStep > 2
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-primary'
            }`}
          >
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-label-sm uppercase tracking-wider text-[11px] ${
                currentStep === 2 ? 'text-primary font-semibold' : 'text-outline'
              }`}
            >
              Step 2
            </span>
            <span
              className={`font-title-sm text-on-surface ${
                currentStep === 2 ? 'font-semibold' : ''
              }`}
            >
              Address
            </span>
          </div>
        </div>

        <div className="h-0.5 w-6 sm:w-12 bg-surface-container-highest shrink-0" />

        {/* Step 3: Delivery */}
        <div
          className={`flex items-center gap-2.5 shrink-0 ${
            currentStep >= 3 ? 'cursor-pointer' : 'opacity-70'
          }`}
          onClick={() => onStepClick && onStepClick(3)}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-title-sm transition-colors ${
              currentStep === 3
                ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                : currentStep > 3
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-primary'
            }`}
          >
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-label-sm uppercase tracking-wider text-[11px] ${
                currentStep === 3 ? 'text-primary font-semibold' : 'text-outline'
              }`}
            >
              Step 3
            </span>
            <span
              className={`font-title-sm text-on-surface ${
                currentStep === 3 ? 'font-semibold' : ''
              }`}
            >
              Delivery
            </span>
          </div>
        </div>

        <div className="h-0.5 w-6 sm:w-12 bg-surface-container-highest shrink-0" />

        {/* Step 4: Payment */}
        <div
          className={`flex items-center gap-2.5 shrink-0 ${
            currentStep >= 4 ? 'cursor-pointer' : 'opacity-70'
          }`}
          onClick={() => onStepClick && onStepClick(4)}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-title-sm transition-colors ${
              currentStep === 4
                ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                : currentStep > 4
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-primary'
            }`}
          >
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-label-sm uppercase tracking-wider text-[11px] ${
                currentStep === 4 ? 'text-primary font-semibold' : 'text-outline'
              }`}
            >
              Step 4
            </span>
            <span
              className={`font-title-sm text-on-surface ${
                currentStep === 4 ? 'font-semibold' : ''
              }`}
            >
              Payment
            </span>
          </div>
        </div>

        <div className="h-0.5 w-6 sm:w-12 bg-surface-container-highest shrink-0" />

        {/* Step 5: Review */}
        <div
          className={`flex items-center gap-2.5 shrink-0 ${
            currentStep === 5 ? 'cursor-pointer' : 'opacity-60'
          }`}
          onClick={() => onStepClick && onStepClick(5)}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-title-sm transition-colors ${
              currentStep === 5
                ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                : 'bg-surface-container-low text-on-surface-variant'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-label-sm uppercase tracking-wider text-[11px] ${
                currentStep === 5 ? 'text-primary font-semibold' : 'text-outline'
              }`}
            >
              Step 5
            </span>
            <span className="font-title-sm text-on-surface-variant">Review</span>
          </div>
        </div>
      </div>
    </div>
  );
};
