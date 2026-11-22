import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';

export const LoginPage: React.FC = () => {
  const { login, switchRoleDemo, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected from a protected route, preserve destination
  const from = (location.state as any)?.from?.pathname || '/';

  const [identifier, setIdentifier] = useState('priya@omizon.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    }
  };

  return (
    <AuthLayout showSecurityBadge={true}>
      {/* Section Header */}
      <div className="mb-7">
        <div className="hidden lg:flex items-center gap-2 mb-2">
          <span className="font-headline-sm text-headline-sm font-bold text-[#211D31] tracking-tight">
            OMIZON
          </span>
          <span className="w-2 h-2 rounded-full bg-[#762FF2]" />
        </div>
        <h2 className="font-headline-md text-headline-md font-bold text-[#211D31] tracking-tight">
          Welcome back
        </h2>
        <p className="font-body-md text-body-md text-[#4A4456] mt-1.5 leading-relaxed">
          Sign in to continue your shopping journey and access exclusive member rewards.
        </p>
      </div>

      {/* Redirect Notice */}
      {location.state?.from && (
        <div className="mb-4 p-3.5 bg-[#762FF2]/10 border border-[#762FF2]/20 rounded-xl text-xs text-[#762FF2] font-medium flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified_user
          </span>
          <span>Please sign in to access that protected page.</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#D92D20] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Authentication Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email / Identifier Address Input */}
        <div>
          <label
            className="block font-label-md text-label-sm uppercase tracking-wider text-[#4A4456] font-semibold mb-1.5"
            htmlFor="login-email"
          >
            Email Address or Username
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#7B7487] text-[20px] pointer-events-none">
              mail
            </span>
            <input
              id="login-email"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@example.com or username"
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#FFFFFF] border border-[#E8E6F0] font-body-md text-body-md text-[#211D31] placeholder:text-[#7B7487] transition duration-200 outline-none focus:border-[#762FF2] focus:ring-2 focus:ring-[#762FF2]/20"
            />
          </div>
        </div>

        {/* Password Input with Interactive Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className="block font-label-md text-label-sm uppercase tracking-wider text-[#4A4456] font-semibold"
              htmlFor="login-password"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="font-title-sm text-title-sm text-[#762FF2] hover:text-[#4C2ACB] transition duration-150"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#7B7487] text-[20px] pointer-events-none">
              lock
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-11 pl-11 pr-11 rounded-xl bg-[#FFFFFF] border border-[#E8E6F0] font-body-md text-body-md text-[#211D31] placeholder:text-[#7B7487] transition duration-200 outline-none focus:border-[#762FF2] focus:ring-2 focus:ring-[#762FF2]/20"
            />
            <button
              id="toggle-password-btn"
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 rounded-lg text-[#7B7487] hover:text-[#211D31] transition flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Utility Checkbox Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded text-[#762FF2] border-[#E8E6F0] accent-[#762FF2] focus:ring-[#762FF2]/30 cursor-pointer"
            />
            <span className="font-body-md text-body-md text-[#211D31]">
              Remember this device for 30 days
            </span>
          </label>
        </div>

        {/* Primary Sign In Action CTA */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 mt-2 bg-[#190B46] hover:bg-[#4C2ACB] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed text-white font-title-md text-title-md rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Signing in...</span>
            </span>
          ) : (
            <>
              <span>Sign In to Omizon</span>
              <span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1">
                arrow_forward
              </span>
            </>
          )}
        </button>
      </form>

      {/* Elegant Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="w-full h-[1px] bg-[#E8E6F0]" />
        <span className="absolute bg-[#FFFFFF] px-3 font-label-sm text-label-sm tracking-wider text-[#7B7487] uppercase font-semibold text-[11px]">
          OR CONTINUE WITH
        </span>
      </div>

      {/* Social Single Sign-On Options */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            // Google federated SSO placeholder
            console.log('Initiating Google Federated Identity OAuth flow');
          }}
          className="w-full h-11 bg-[#FFFFFF] hover:bg-[#F7F7FB] border border-[#E8E6F0] active:scale-[0.99] rounded-xl font-title-sm text-title-sm text-[#211D31] transition duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              fill="#4285F4"
            />
            <path
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              fill="#34A853"
            />
            <path
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              fill="#FBBC05"
            />
            <path
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>

      {/* Quick Demo Simulator */}
      <div className="mt-6 pt-5 border-t border-[#E8E6F0] flex flex-col gap-2">
        <span className="text-[11px] text-[#7B7487] uppercase tracking-wider font-semibold text-center">
          One-Click Demo Simulator
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              switchRoleDemo('buyer');
              navigate(from, { replace: true });
            }}
            className="py-2 px-1 text-[11px] font-bold rounded-xl bg-[#F7F7FB] hover:bg-[#762FF2]/10 text-[#762FF2] border border-[#E8E6F0] transition-colors text-center cursor-pointer"
          >
            Buyer Mode
          </button>
          <button
            type="button"
            onClick={() => {
              switchRoleDemo('seller');
              navigate('/seller/dashboard');
            }}
            className="py-2 px-1 text-[11px] font-bold rounded-xl bg-[#F7F7FB] hover:bg-emerald-500/10 text-emerald-600 border border-[#E8E6F0] transition-colors text-center cursor-pointer"
          >
            Seller Hub
          </button>
          <button
            type="button"
            onClick={() => {
              switchRoleDemo('admin');
              navigate('/admin/dashboard');
            }}
            className="py-2 px-1 text-[11px] font-bold rounded-xl bg-[#F7F7FB] hover:bg-amber-500/10 text-amber-600 border border-[#E8E6F0] transition-colors text-center cursor-pointer"
          >
            Admin Ops
          </button>
        </div>
      </div>

      {/* Registration & Terms Footer */}
      <div className="mt-6 text-center space-y-2.5">
        <p className="font-body-md text-body-md text-[#4A4456]">
          New to OMIZON?{' '}
          <Link
            to="/register"
            className="font-title-sm text-title-sm text-[#762FF2] hover:text-[#4C2ACB] transition ml-1 underline decoration-[#762FF2]/40 underline-offset-4 font-semibold"
          >
            Create an account
          </Link>
        </p>
        <p className="font-body-sm text-body-sm text-[#7B7487] max-w-xs mx-auto leading-relaxed text-[11px]">
          By signing in, you agree to OMIZON&apos;s{' '}
          <a href="#conditions" className="underline hover:text-[#211D31]">
            Conditions of Use
          </a>{' '}
          and{' '}
          <a href="#privacy" className="underline hover:text-[#211D31]">
            Privacy Notice
          </a>
          .
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
