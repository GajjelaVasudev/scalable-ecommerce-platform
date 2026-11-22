import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';

export const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength validation calculations
  const { score, strengthLabel, strengthColor, hasLength, hasUpper, hasNum, hasSpecial } = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const num = /[0-9]/.test(password);
    const special = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    const passedCount = [len, upper, num, special].filter(Boolean).length;

    let label = 'Weak';
    let color = '#D92D20'; // Weak red
    if (passedCount >= 4) {
      label = 'Strong';
      color = '#762FF2'; // Electric violet
    } else if (passedCount >= 2) {
      label = 'Medium';
      color = '#4C2ACB'; // Royal purple
    }

    return {
      score: passedCount,
      strengthLabel: label,
      strengthColor: color,
      hasLength: len,
      hasUpper: upper,
      hasNum: num,
      hasSpecial: special,
    };
  }, [password]);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    const trimmedName = fullName.trim();
    if (trimmedName.length < 3) {
      setErrorMessage('Full name / username must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password entry.');
      return;
    }

    try {
      // Backend expects username, email, password
      const usernamePayload = trimmedName.toLowerCase().replace(/\s+/g, '_');
      await register(usernamePayload, email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your information and try again.');
    }
  };

  return (
    <AuthLayout showSecurityBadge={true}>
      {/* Header Wordmark & Title */}
      <div className="mb-6">
        <div className="hidden lg:flex items-center gap-1.5 mb-2">
          <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-[#211D31]">
            OMIZON
          </span>
          <span className="w-2 h-2 rounded-full bg-[#762FF2]" />
        </div>
        <h2 className="font-headline-md text-headline-md text-[#211D31] font-bold tracking-tight">
          Create your account
        </h2>
        <p className="font-body-md text-body-md text-[#4A4456] mt-1 leading-relaxed">
          Join OMIZON and discover a better way to shop.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#D92D20] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Signup Form */}
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        {/* Full Name Field */}
        <div>
          <label className="block font-label-md text-label-md text-[#211D31] mb-1" htmlFor="fullName">
            Full Name
          </label>
          <div className="relative">
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Elena Rostova"
              className="w-full h-11 px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E6F0] text-[#211D31] font-body-md text-body-md placeholder:text-[#7B7487]/60 focus:border-[#762FF2] focus:ring-2 focus:ring-[#762FF2]/15 focus:outline-none transition-all duration-200"
            />
            <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7B7487]/50 text-[18px] pointer-events-none">
              person
            </span>
          </div>
        </div>

        {/* Email Address Field */}
        <div>
          <label className="block font-label-md text-label-md text-[#211D31] mb-1" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-11 px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E6F0] text-[#211D31] font-body-md text-body-md placeholder:text-[#7B7487]/60 focus:border-[#762FF2] focus:ring-2 focus:ring-[#762FF2]/15 focus:outline-none transition-all duration-200"
            />
            <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7B7487]/50 text-[18px] pointer-events-none">
              mail
            </span>
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block font-label-md text-label-md text-[#211D31] mb-1" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="w-full h-11 pl-3.5 pr-10 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E6F0] text-[#211D31] font-body-md text-body-md placeholder:text-[#7B7487]/60 focus:border-[#762FF2] focus:ring-2 focus:ring-[#762FF2]/15 focus:outline-none transition-all duration-200"
            />
            <button
              id="togglePassBtn"
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7B7487] hover:text-[#211D31] flex items-center justify-center p-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          {/* Password Strength Bar Indicator */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1.5 animate-fadeIn">
              <div className="grid grid-cols-4 gap-1.5">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    score >= 1 ? (score >= 4 ? 'bg-[#762FF2]' : score >= 2 ? 'bg-[#4C2ACB]' : 'bg-[#D92D20]') : 'bg-[#E8E6F0]'
                  }`}
                />
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    score >= 2 ? (score >= 4 ? 'bg-[#762FF2]' : 'bg-[#4C2ACB]') : 'bg-[#E8E6F0]'
                  }`}
                />
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    score >= 3 ? 'bg-[#762FF2]' : 'bg-[#E8E6F0]'
                  }`}
                />
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    score >= 4 ? 'bg-[#4C2ACB]' : 'bg-[#E8E6F0]'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-[#4A4456] text-[11px]">
                  At least 8 characters with letters &amp; numbers
                </span>
                <span
                  className="font-semibold text-[11px] tracking-wide"
                  style={{ color: strengthColor }}
                >
                  {strengthLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block font-label-md text-label-md text-[#211D31] mb-1" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full h-11 px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E6F0] text-[#211D31] font-body-md text-body-md placeholder:text-[#7B7487]/60 focus:border-[#762FF2] focus:ring-2 focus:ring-[#762FF2]/15 focus:outline-none transition-all duration-200"
            />
            {passwordsMatch && (
              <span
                className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#762FF2] text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            )}
            {passwordsMismatch && (
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#D92D20] text-[18px]">
                error
              </span>
            )}
          </div>
        </div>

        {/* Terms & Agreement Checkbox */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="terms"
            type="checkbox"
            required
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-[#E8E6F0] text-[#762FF2] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#762FF2]"
          />
          <label htmlFor="terms" className="font-body-sm text-body-sm text-[#4A4456] leading-tight cursor-pointer text-[12px]">
            I agree to the{' '}
            <a href="#terms" className="text-[#762FF2] font-medium hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#privacy" className="text-[#762FF2] font-medium hover:underline">
              Privacy Policy
            </a>
            .
          </label>
        </div>

        {/* Submit CTA Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#190B46] hover:bg-[#762FF2] disabled:opacity-70 disabled:cursor-not-allowed text-[#FFFFFF] font-title-sm text-title-sm rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 mt-2 group cursor-pointer"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Creating account...</span>
            </span>
          ) : (
            <>
              <span>Create Account</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full h-px bg-[#E8E6F0]" />
        <span className="absolute bg-[#FFFFFF] px-3 font-label-sm text-label-sm uppercase tracking-wider text-[#7B7487] text-[11px]">
          OR SIGN UP WITH
        </span>
      </div>

      {/* Google OAuth Action Button */}
      <button
        type="button"
        onClick={() => {
          console.log('Initiating Google Federated Identity OAuth flow');
        }}
        className="w-full h-11 bg-[#FFFFFF] hover:bg-[#F7F7FB] border border-[#E8E6F0] text-[#211D31] font-title-sm text-title-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-3 shadow-sm hover:shadow cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
            fill="#4285F4"
          />
          <path
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
            fill="#34A853"
          />
          <path
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
            fill="#FBBC05"
          />
          <path
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            fill="#EA4335"
          />
        </svg>
        <span className="font-medium text-sm">Continue with Google</span>
      </button>

      {/* Footer Switcher Link */}
      <p className="text-center font-body-sm text-body-sm text-[#4A4456] mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-[#762FF2] font-semibold hover:underline ml-1">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export const SignupPage = RegisterPage;
export default RegisterPage;
