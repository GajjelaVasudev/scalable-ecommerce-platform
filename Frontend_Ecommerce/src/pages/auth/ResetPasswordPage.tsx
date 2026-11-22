import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { api } from '../../services/api';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';
  const [resetToken, setResetToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [revokeSessions, setRevokeSessions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password Requirements and Strength Analysis
  const { hasLength, hasUpper, hasNum, hasSpecial, score, strengthLabel, strengthClass } = useMemo(() => {
    const len = newPassword.length >= 8;
    const upper = /[A-Z]/.test(newPassword);
    const num = /[0-9]/.test(newPassword);
    const special = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

    const count = [len, upper, num, special].filter(Boolean).length;

    let label = 'Weak';
    let cls = 'text-[#D92D20]';
    if (count >= 4) {
      label = 'Strong';
      cls = 'text-[#762FF2]';
    } else if (count >= 2) {
      label = 'Medium';
      cls = 'text-[#4C2ACB]';
    }

    return {
      hasLength: len,
      hasUpper: upper,
      hasNum: num,
      hasSpecial: special,
      score: count,
      strengthLabel: label,
      strengthClass: cls,
    };
  }, [newPassword]);

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    setIsSubmitting(true);
    try {
      if ((api.auth as any).resetPassword) {
        await (api.auth as any).resetPassword({
          resetToken: resetToken.trim(),
          newPassword,
          revokeSessions,
        });
      }
      navigate('/password-reset-success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      backTo={{ path: '/login', label: 'Back to Sign In' }}
      showSecurityBadge={true}
    >
      <div className="w-full flex flex-col gap-6 py-4">
        {/* Form Header */}
        <div className="flex flex-col gap-2">
          <div className="w-12 h-12 rounded-xl bg-[#F2EBFF] flex items-center justify-center text-[#762FF2] shadow-sm mb-1">
            <span className="material-symbols-outlined text-[26px]">lock_reset</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-[#211D31] font-bold tracking-tight">
            Create new password
          </h2>
          <p className="font-body-md text-body-md text-[#4A4456]">
            Your new password must be different from previous passwords and satisfy the security requirements below.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#D92D20] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Password Reset Form */}
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Optional Token input (only shown if token is not in URL params) */}
          {!tokenParam && (
            <div className="flex flex-col gap-1.5">
              <label className="font-title-sm text-title-sm text-[#211D31]" htmlFor="reset-token">
                Reset Verification Code / Token
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter token from reset email"
                className="w-full h-11 px-3.5 rounded-xl bg-[#F7F7FB] border border-[#E8E6F0] font-body-md text-body-md focus:bg-white focus:ring-2 focus:ring-[#762FF2] focus:outline-none transition-all placeholder:text-[#7B7487]/60"
              />
            </div>
          )}

          {/* Field 1: New Password */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                className="font-title-sm text-title-sm text-[#211D31] flex items-center gap-1.5"
                htmlFor="new-password"
              >
                <span className="material-symbols-outlined text-[16px] text-[#7B7487]">lock</span>
                <span>New password</span>
              </label>
              {newPassword.length > 0 && (
                <span className={`font-label-sm text-label-sm font-semibold ${strengthClass}`} id="strength-label">
                  {strengthLabel}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full h-12 pl-4 pr-11 bg-[#F7F7FB] rounded-xl text-[#211D31] font-body-md text-body-md border border-[#E8E6F0] focus:bg-white focus:ring-2 focus:ring-[#762FF2] focus:outline-none transition-all duration-200 placeholder:text-[#7B7487]"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 flex items-center justify-center text-[#7B7487] hover:text-[#762FF2] transition-colors focus:outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showNewPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Segmented Password Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 pt-1.5" id="strength-meter">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    score >= 1 ? (score >= 4 ? 'bg-[#762FF2]' : score >= 2 ? 'bg-[#4C2ACB]' : 'bg-[#D92D20]') : 'bg-[#E8E6F0]'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    score >= 2 ? (score >= 4 ? 'bg-[#762FF2]' : 'bg-[#4C2ACB]') : 'bg-[#E8E6F0]'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    score >= 3 ? 'bg-[#762FF2]' : 'bg-[#E8E6F0]'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    score >= 4 ? 'bg-[#4C2ACB]' : 'bg-[#E8E6F0]'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Requirements Checklist Panel */}
          <div className="p-4 rounded-xl bg-[#F7F7FB] border border-[#E8E6F0]/60 flex flex-col gap-2.5">
            <div className="font-label-sm text-label-sm text-[#4A4456] font-semibold uppercase tracking-wider flex items-center gap-1 text-[11px]">
              <span className="material-symbols-outlined text-[14px]">checklist</span>
              <span>Password requirements</span>
            </div>
            <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-[#4A4456] text-[12px]">
              <li
                className={`flex items-center gap-2 transition-colors ${
                  hasLength ? 'text-[#762FF2] font-medium' : 'text-[#7B7487]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    hasLength ? 'bg-[#762FF2]/10 text-[#762FF2]' : 'bg-[#E8E6F0] text-[#7B7487]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {hasLength ? 'check' : 'remove'}
                  </span>
                </span>
                <span>At least 8 characters long</span>
              </li>
              <li
                className={`flex items-center gap-2 transition-colors ${
                  hasUpper ? 'text-[#762FF2] font-medium' : 'text-[#7B7487]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    hasUpper ? 'bg-[#762FF2]/10 text-[#762FF2]' : 'bg-[#E8E6F0] text-[#7B7487]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {hasUpper ? 'check' : 'remove'}
                  </span>
                </span>
                <span>Includes at least one uppercase letter (A-Z)</span>
              </li>
              <li
                className={`flex items-center gap-2 transition-colors ${
                  hasNum ? 'text-[#762FF2] font-medium' : 'text-[#7B7487]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    hasNum ? 'bg-[#762FF2]/10 text-[#762FF2]' : 'bg-[#E8E6F0] text-[#7B7487]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {hasNum ? 'check' : 'remove'}
                  </span>
                </span>
                <span>Includes at least one number (0-9)</span>
              </li>
              <li
                className={`flex items-center gap-2 transition-colors ${
                  hasSpecial ? 'text-[#762FF2] font-medium' : 'text-[#7B7487]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    hasSpecial ? 'bg-[#762FF2]/10 text-[#762FF2]' : 'bg-[#E8E6F0] text-[#7B7487]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {hasSpecial ? 'check' : 'remove'}
                  </span>
                </span>
                <span>Includes at least one special character (!@#$%^&*)</span>
              </li>
            </ul>
          </div>

          {/* Field 2: Confirm Password */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                className="font-title-sm text-title-sm text-[#211D31] flex items-center gap-1.5"
                htmlFor="confirm-password"
              >
                <span className="material-symbols-outlined text-[16px] text-[#7B7487]">verified</span>
                <span>Confirm new password</span>
              </label>
              {passwordsMatch && (
                <span className="font-label-sm text-label-sm text-[#762FF2] flex items-center gap-1 font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Passwords match</span>
                </span>
              )}
              {passwordsMismatch && (
                <span className="font-label-sm text-label-sm text-[#D92D20] flex items-center gap-1 font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>Passwords do not match</span>
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full h-12 pl-4 pr-11 bg-[#F7F7FB] rounded-xl text-[#211D31] font-body-md text-body-md border border-[#E8E6F0] focus:bg-white focus:ring-2 focus:ring-[#762FF2] focus:outline-none transition-all duration-200 placeholder:text-[#7B7487]"
              />
              <button
                type="button"
                aria-label="Toggle confirm password visibility"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 flex items-center justify-center text-[#7B7487] hover:text-[#762FF2] transition-colors focus:outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Security Options: Revoke active sessions */}
          <div className="pt-1">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F7F7FB] hover:bg-[#F2EBFF]/60 border border-[#E8E6F0]/60 cursor-pointer transition-colors group select-none">
              <input
                type="checkbox"
                checked={revokeSessions}
                onChange={(e) => setRevokeSessions(e.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-[#762FF2] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-[#211D31] font-semibold group-hover:text-[#762FF2] transition-colors text-[13px]">
                  Sign out of all other devices and active sessions
                </span>
                <span className="font-body-sm text-body-sm text-[#4A4456] text-[11px] leading-relaxed">
                  Recommended to protect your OMIZON purchases, saved payment cards, and private delivery addresses.
                </span>
              </div>
            </label>
          </div>

          {/* Primary CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative mt-2 w-full h-12 rounded-xl bg-[#190B46] hover:bg-[#4C2ACB] active:scale-[0.99] disabled:opacity-70 text-white font-headline-sm text-title-md font-semibold tracking-wide shadow-md hover:shadow-xl hover:shadow-[#762FF2]/20 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Updating Password...</span>
              </span>
            ) : (
              <>
                <span>Reset Password &amp; Sign In</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        {/* Return Navigation Notice */}
        <div className="text-center font-body-md text-body-md text-[#4A4456]">
          Remember your password?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#762FF2] hover:text-[#4C2ACB] hover:underline ml-1 inline-flex items-center gap-0.5"
          >
            Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
