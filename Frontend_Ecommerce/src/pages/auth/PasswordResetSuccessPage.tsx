import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';

export const PasswordResetSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout
      backTo={{ path: '/login', label: 'Back to Sign In' }}
      showSecurityBadge={true}
    >
      <div className="w-full flex flex-col items-center text-center my-6">
        {/* Success Icon Badge */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-[#EADDFF] flex items-center justify-center shadow-sm mx-auto">
            <span
              className="material-symbols-outlined text-[40px] text-[#762FF2]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
        </div>

        {/* Heading & Supporting Text */}
        <h2 className="font-headline-md text-headline-md text-[#211D31] font-bold mb-3 tracking-tight">
          Password updated successfully
        </h2>
        <p className="font-body-md text-body-md text-[#4A4456] mb-8 max-w-sm leading-relaxed">
          Your OMIZON account password has been reset. All other active sessions have been signed out for your security.
        </p>

        {/* Security Summary Card */}
        <div className="w-full bg-[#F7F7FB] border border-[#E8E6F0]/60 rounded-xl p-5 mb-8 text-left flex flex-col gap-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-[#4A4456]">
              <span className="material-symbols-outlined text-[18px] text-[#762FF2]">
                verified_user
              </span>
              <span className="font-body-sm text-body-sm">Account Status</span>
            </div>
            <span className="font-title-sm text-title-sm text-[#211D31] font-semibold">
              Verified &amp; Secured
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-[#4A4456]">
              <span className="material-symbols-outlined text-[18px] text-[#762FF2]">
                devices
              </span>
              <span className="font-body-sm text-body-sm">Other Devices</span>
            </div>
            <span className="font-title-sm text-title-sm text-[#211D31] font-semibold">
              Signed Out
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-[#4A4456]">
              <span className="material-symbols-outlined text-[18px] text-[#762FF2]">
                schedule
              </span>
              <span className="font-body-sm text-body-sm">Updated</span>
            </div>
            <span className="font-title-sm text-title-sm text-[#211D31] font-semibold">
              Just now
            </span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full h-12 rounded-xl bg-[#190B46] hover:bg-[#4C2ACB] active:scale-[0.99] text-white font-title-md text-title-md flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <span>Sign In to Omizon</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>

        {/* Secondary Concierge Link */}
        <a
          href="#concierge"
          className="mt-5 font-label-md text-label-md text-[#762FF2] hover:text-[#4C2ACB] transition-colors text-[13px]"
        >
          Need help? Contact OMIZON Concierge
        </a>

        {/* Vault Footnote */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[#7B7487] font-body-sm text-body-sm text-[11px]">
          <span className="material-symbols-outlined text-[15px] text-[#762FF2]">shield</span>
          <span>End-to-End Vault • 24/7 Threat Guard</span>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PasswordResetSuccessPage;
