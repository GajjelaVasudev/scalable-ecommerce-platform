import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { api } from '../../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [demoResetToken, setDemoResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if ((api.auth as any).forgotPassword) {
        const res = await (api.auth as any).forgotPassword({ email: email.trim() });
        if (res?.resetToken) {
          setDemoResetToken(res.resetToken);
        }
      }
      setIsSent(true);
    } catch (err: any) {
      // In production security, we still display confirmation or friendly error
      setErrorMessage(err.message || 'Unable to process password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      backTo={{ path: '/login', label: 'Back to Sign In' }}
      showSecurityBadge={true}
    >
      <div className="w-full flex flex-col my-auto">
        {/* Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-[#F2EBFF] flex items-center justify-center text-[#762FF2] mb-6 shadow-sm">
          <span
            className="material-symbols-outlined text-[30px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            vpn_key
          </span>
        </div>

        {/* Headings */}
        <h2 className="font-headline-md text-headline-md font-bold text-[#190B46] tracking-tight mb-2">
          Forgot your password?
        </h2>
        <p className="font-body-md text-body-md text-[#4A4456] leading-relaxed mb-8">
          Enter your registered email address and we&apos;ll send you a secure link to reset your account credentials.
        </p>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#D92D20] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email Input Group */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="font-title-sm text-title-sm font-semibold text-[#190B46]"
                htmlFor="recovery-email"
              >
                Email address
              </label>
              <span className="font-label-sm text-label-sm text-[#4A4456]/70 uppercase tracking-wider text-[11px]">
                Registered ID
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#7B7487] text-[20px] pointer-events-none">
                mail
              </span>
              <input
                id="recovery-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isSent}
                className="w-full h-12 pl-11 pr-4 bg-[#FFFFFF] text-[#1D192D] font-body-md text-body-md rounded-xl border border-[#E8E6F0] focus:border-[#762FF2] focus:ring-2 focus:ring-[#762FF2]/20 transition-all placeholder:text-[#7B7487]/60 outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="submit-btn"
            type="submit"
            disabled={isSubmitting || isSent}
            className={`w-full h-12 text-white font-title-sm text-title-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer group ${
              isSent
                ? 'bg-[#762FF2] shadow-[#762FF2]/25'
                : 'bg-[#190B46] hover:bg-[#281566] shadow-[#190B46]/20 active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Sending Instructions...</span>
              </span>
            ) : isSent ? (
              <>
                <span>Link Dispatched</span>
                <span className="material-symbols-outlined text-[18px]">done</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        {/* Dynamic Success Toast */}
        {isSent && (
          <div className="mt-6 p-4 rounded-xl bg-[#EADDFF] text-[#190B46] flex items-start gap-3 animate-fadeIn">
            <span
              className="material-symbols-outlined text-[#762FF2] text-[22px] flex-shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <div className="space-y-1">
              <p className="font-title-sm text-title-sm font-bold">Verification Link Sent</p>
              <p className="font-body-sm text-body-sm text-[#4A4456]">
                Check your inbox at <span className="font-semibold text-[#190B46]">{email}</span> for step-by-step instructions. Please allow up to 2 minutes for delivery.
              </p>
              {demoResetToken && (
                <div className="mt-2 pt-2 border-t border-[#762FF2]/20">
                  <Link
                    to={`/reset-password?token=${demoResetToken}`}
                    className="text-xs font-bold text-[#762FF2] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Proceed with Reset Link</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informational Security Note Box */}
        <div className="mt-8 p-4 rounded-xl bg-[#F7F7FB] border border-[#E8E6F0]/60 flex items-start gap-3">
          <span
            className="material-symbols-outlined text-[#762FF2] text-[20px] flex-shrink-0 mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            info
          </span>
          <p className="font-body-sm text-body-sm text-[#4A4456] leading-relaxed text-[12px]">
            We will send a single-use secure reset link. For your protection, the authorization token will automatically expire in{' '}
            <span className="font-semibold text-[#190B46]">15 minutes</span>.
          </p>
        </div>

        {/* Bottom Navigation Footer */}
        <div className="w-full text-center pt-8">
          <p className="font-body-md text-body-md text-[#4A4456]">
            Remember your password?{' '}
            <Link
              to="/login"
              className="font-title-sm text-title-sm font-semibold text-[#762FF2] hover:text-[#5C00D2] hover:underline ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
