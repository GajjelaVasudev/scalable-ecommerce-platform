import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccountLayout } from '../../components/account/AccountLayout';
import {
  getStableUserId,
  getAccountProfile,
  setAccountProfile,
} from '../../utils/accountStorage';

export const PersonalInfoPage: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = getStableUserId(user);

  // Parse user info dynamically without hardcoded customer data
  const rawUsername = user?.username || '';
  const nameParts = rawUsername.split(/[_\s-]/).filter(Boolean);
  const defaultFirstName = nameParts[0]
    ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase()
    : 'Valued';
  const defaultLastName = nameParts.slice(1).join(' ')
    ? nameParts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    : 'Customer';

  // Read persisted profile changes scoped per authenticated user (sensitive tax identifiers like PAN are never stored in browser storage)
  const [savedProfile, setSavedProfile] = useState<any>(() => getAccountProfile(userId));

  const [firstName, setFirstName] = useState(savedProfile?.firstName || defaultFirstName);
  const [lastName, setLastName] = useState(savedProfile?.lastName || defaultLastName);
  const [displayName, setDisplayName] = useState(
    savedProfile?.displayName || (rawUsername ? `${defaultFirstName} ${defaultLastName.charAt(0)}.` : 'Buyer Member')
  );
  const [gender, setGender] = useState(savedProfile?.gender || 'prefer-not-to-say');
  const [dobDay, setDobDay] = useState(savedProfile?.dobDay || '');
  const [dobMonth, setDobMonth] = useState(savedProfile?.dobMonth || '');
  const [dobYear, setDobYear] = useState(savedProfile?.dobYear || '');

  // Contact Credentials
  const [email, setEmail] = useState(savedProfile?.email || user?.email || '');
  const [phone, setPhone] = useState(savedProfile?.phone || '');
  const [altPhone, setAltPhone] = useState(savedProfile?.altPhone || '');
  const [commLang, setCommLang] = useState(savedProfile?.commLang || 'en');

  // Compliance: in-memory state only for session. Never prefilled with fake PAN.
  const [panNumber, setPanNumber] = useState('');
  const [lastModified, setLastModified] = useState(savedProfile?.lastModified || null);

  // Profile Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(savedProfile?.photoUrl || null);

  // Synchronize state when the authenticated user changes
  useEffect(() => {
    const profile = getAccountProfile(userId);
    setSavedProfile(profile);
    setFirstName(profile?.firstName || defaultFirstName);
    setLastName(profile?.lastName || defaultLastName);
    setDisplayName(
      profile?.displayName || (rawUsername ? `${defaultFirstName} ${defaultLastName.charAt(0)}.` : 'Buyer Member')
    );
    setGender(profile?.gender || 'prefer-not-to-say');
    setDobDay(profile?.dobDay || '');
    setDobMonth(profile?.dobMonth || '');
    setDobYear(profile?.dobYear || '');
    setEmail(profile?.email || user?.email || '');
    setPhone(profile?.phone || '');
    setAltPhone(profile?.altPhone || '');
    setCommLang(profile?.commLang || 'en');
    setPhotoUrl(profile?.photoUrl || null);
    setLastModified(profile?.lastModified || null);
    setPanNumber('');
    setModalInput('');
    setValidationErrors([]);
  }, [userId, rawUsername, defaultFirstName, defaultLastName, user?.email]);

  // UI state & Modals
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Profile information updated.');

  // Modal dialog states
  const [activeModal, setActiveModal] = useState<'email' | 'phone' | 'pan' | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [modalError, setModalError] = useState('');

  const initials = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase() || 'OM';

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setValidationErrors(['Profile photo size must be less than 2MB.']);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoUrl(result);
        triggerToast('Profile photo updated.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    triggerToast('Profile photo removed.');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!firstName.trim() || firstName.trim().length < 2) {
      errors.push('First name is required (minimum 2 characters).');
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      errors.push('Last name is required (minimum 2 characters).');
    }
    if (!displayName.trim()) {
      errors.push('Display name is required.');
    }

    // DOB check
    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      errors.push('Please enter a valid day of birth (1-31).');
    }
    if (isNaN(month) || month < 1 || month > 12) {
      errors.push('Please enter a valid month of birth (1-12).');
    }
    if (isNaN(year) || year < 1920 || year > 2015) {
      errors.push('Please enter a valid year of birth (1920-2015).');
    }

    // PAN check (standard 10-char format: 5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (panNumber && !panRegex.test(panNumber.toUpperCase())) {
      errors.push('PAN number must follow standard format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const now = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
      setLastModified(now);

      // Sensitive identifiers like PAN are deliberately excluded from browser storage
      const profilePayload = {
        firstName,
        lastName,
        displayName,
        gender,
        dobDay,
        dobMonth,
        dobYear,
        email,
        phone,
        altPhone,
        commLang,
        photoUrl,
        lastModified: now,
      };

      try {
        setAccountProfile(userId, profilePayload);
        setSavedProfile(profilePayload);
      } catch {}

      triggerToast('Profile details saved locally in this browser.');
    }, 600);
  };

  const handleReset = () => {
    setFirstName(savedProfile?.firstName || defaultFirstName);
    setLastName(savedProfile?.lastName || defaultLastName);
    setDisplayName(
      savedProfile?.displayName || (rawUsername ? `${defaultFirstName} ${defaultLastName.charAt(0)}.` : 'Buyer Member')
    );
    setGender(savedProfile?.gender || 'prefer-not-to-say');
    setDobDay(savedProfile?.dobDay || '');
    setDobMonth(savedProfile?.dobMonth || '');
    setDobYear(savedProfile?.dobYear || '');
    setAltPhone(savedProfile?.altPhone || '');
    setCommLang(savedProfile?.commLang || 'en');
    setPanNumber('');
    setModalInput('');
    setValidationErrors([]);
    triggerToast('Changes reverted.');
  };

  // Modal Handlers
  const openEmailModal = () => {
    setModalInput(email);
    setModalError('');
    setActiveModal('email');
  };

  const openPhoneModal = () => {
    setModalInput(phone.replace('+91 ', ''));
    setModalError('');
    setActiveModal('phone');
  };

  const openPanModal = () => {
    setModalInput(panNumber);
    setModalError('');
    setActiveModal('pan');
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (activeModal === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(modalInput.trim())) {
        setModalError('Please enter a valid email address.');
        return;
      }
      setEmail(modalInput.trim());
      setActiveModal(null);
      setModalInput('');
      triggerToast('Contact email updated locally in this browser. Server verification is not connected.');
    } else if (activeModal === 'phone') {
      const digits = modalInput.replace(/\D/g, '');
      if (digits.length !== 10) {
        setModalError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      setPhone(`+91 ${digits.slice(0, 5)} ${digits.slice(5)}`);
      setActiveModal(null);
      setModalInput('');
      triggerToast('Mobile number updated locally in this browser. SMS OTP verification is not connected.');
    } else if (activeModal === 'pan') {
      const clean = modalInput.trim().toUpperCase();
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(clean)) {
        setModalError('Invalid PAN format. Standard format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
        return;
      }
      setPanNumber(clean);
      setActiveModal(null);
      setModalInput('');
      triggerToast('PAN format validated in memory. NSDL verification is not connected.');
    }
  };

  return (
    <AccountLayout activeKey="personal-info">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-fade-in max-w-md">
          <div className="bg-ink text-text-dark-primary px-space-md py-space-sm rounded-lg shadow-xl flex items-center gap-space-sm font-label-md text-label-md">
            <span className="material-symbols-outlined text-semantic-success text-[18px]">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* Modal Dialog for Sensitive Credentials (Email, Phone, PAN) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-modal border border-lavender-mist p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-lavender-mist">
              <h3 className="font-title-md text-title-md text-ink font-semibold">
                {activeModal === 'email'
                  ? 'Update Email Address'
                  : activeModal === 'phone'
                  ? 'Update Mobile Number'
                  : 'Enter PAN (Format Validation Only)'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setModalInput('');
                }}
                className="text-ink-subtle hover:text-ink transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
              {modalError && (
                <div className="p-3 bg-red-50 text-semantic-error rounded-lg text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-ink">
                  {activeModal === 'email'
                    ? 'New Email Address'
                    : activeModal === 'phone'
                    ? '10-Digit Mobile Number'
                    : '10-Character PAN Number'}
                </label>
                <div className="relative flex items-center">
                  {activeModal === 'phone' && (
                    <span className="absolute left-3.5 text-ink-subtle font-mono text-sm">+91</span>
                  )}
                  <input
                    type={activeModal === 'email' ? 'email' : 'text'}
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    placeholder={
                      activeModal === 'email'
                        ? 'e.g. name@domain.in'
                        : activeModal === 'phone'
                        ? '98200 12345'
                        : 'ABCDE1234F'
                    }
                    maxLength={activeModal === 'phone' ? 10 : activeModal === 'pan' ? 10 : undefined}
                    className={`w-full h-11 pr-3.5 rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-lavender-mist/60 ${
                      activeModal === 'phone' ? 'pl-14 font-mono' : 'pl-3.5'
                    }`}
                    autoFocus
                  />
                </div>
                <span className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                  {activeModal === 'email'
                    ? 'Updates your account contact email locally in this browser. Verification email service is not connected.'
                    : activeModal === 'phone'
                    ? 'Used for delivery driver communication. SMS OTP verification service is not connected.'
                    : 'Format check only (5 letters, 4 numbers, 1 letter). Sensitive tax identifiers are not stored in browser storage.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setModalInput('');
                  }}
                  className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink font-label-md text-label-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-space-lg py-2 rounded-lg bg-primary hover:bg-royal-purple text-on-primary font-label-md text-label-md transition-colors shadow-sm font-semibold"
                >
                  {activeModal === 'pan' ? 'Validate Format' : 'Save Locally'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-ink-subtle mb-space-sm">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/account" className="hover:text-ink transition-colors">My Account</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-ink font-medium">Personal Information</span>
        </nav>

        {/* Page Title & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-space-xs pb-space-lg">
          <div>
            <h1 className="font-headline-md text-headline-md text-midnight-violet tracking-tight">
              Personal Information
            </h1>
            <p className="font-body-md text-body-md text-ink-muted mt-1">
              Manage your personal profile details, communication preferences, and contact credentials.
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-ink-subtle font-label-sm text-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Buyer Profile</span>
          </div>
        </div>

        {/* Validation Errors Alert Banner */}
        {validationErrors.length > 0 && (
          <div className="mb-space-md p-space-md bg-red-50 border border-red-200 rounded-xl text-semantic-error flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
            <div className="flex flex-col gap-1">
              <span className="font-title-sm text-title-sm font-semibold">Please correct the following errors:</span>
              <ul className="list-disc list-inside text-xs space-y-0.5 font-medium">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-space-lg">
          {/* Avatar Profile Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-lavender-mist/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-royal-purple text-white overflow-hidden flex items-center justify-center flex-shrink-0 font-bold text-xl shadow-sm">
                  {photoUrl ? (
                    <img src={photoUrl} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="font-title-md text-title-md text-ink font-semibold">
                      {firstName} {lastName}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-ink-muted">
                      <span className="material-symbols-outlined text-[13px] text-primary">
                        person
                      </span>
                      Active Account
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                    Account holder • Active OMIZON Account
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-space-md py-1.5 bg-surface-container-low hover:bg-surface-container text-ink font-label-md text-label-md rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                >
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">photo_camera</span>
                  <span>Change Photo</span>
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-space-sm py-1.5 text-ink-subtle hover:text-semantic-error font-label-md text-label-md rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 01: Basic Details */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-lavender-mist/60">
            <div className="pb-space-md mb-space-md flex items-center justify-between border-b border-lavender-mist/60">
              <div className="flex items-center gap-space-xs">
                <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                <h2 className="font-title-md text-title-md text-ink font-semibold">Basic Details</h2>
              </div>
              <span className="font-label-sm text-label-sm text-ink-subtle uppercase">Section 01</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-ink" htmlFor="first-name">
                  First Name
                </label>
                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 px-3.5 rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:text-ink transition-all border border-transparent focus:border-primary/40"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-ink" htmlFor="last-name">
                  Last Name
                </label>
                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 px-3.5 rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:text-ink transition-all border border-transparent focus:border-primary/40"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-ink" htmlFor="display-name">
                  Display Name / Preferred Name
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11 px-3.5 rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:text-ink transition-all border border-transparent focus:border-primary/40"
                />
                <span className="font-body-sm text-body-sm text-ink-subtle">
                  Visible to marketplace sellers on review posts and buyer queries.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-ink" htmlFor="gender-select">
                  Gender
                </label>
                <div className="relative">
                  <select
                    id="gender-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-11 px-3.5 appearance-none rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-10 cursor-pointer border border-transparent focus:border-primary/40"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-subtle text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-ink" htmlFor="dob-day">
                    Date of Birth
                  </label>
                  <span className="font-label-sm text-label-sm text-ink-subtle flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Confidential
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-space-sm max-w-md">
                  <input
                    id="dob-day"
                    aria-label="Day"
                    type="text"
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    placeholder="DD"
                    maxLength={2}
                    className="h-11 text-center rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/40"
                  />
                  <input
                    aria-label="Month"
                    type="text"
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    placeholder="MM"
                    maxLength={2}
                    className="h-11 text-center rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/40"
                  />
                  <input
                    aria-label="Year"
                    type="text"
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    placeholder="YYYY"
                    maxLength={4}
                    className="h-11 text-center rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/40"
                  />
                </div>
                <span className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                  Used strictly for curated birthday offers and statutory age verification on restricted categories.
                </span>
              </div>
            </div>
          </div>

          {/* Section 02: Contact Credentials */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-lavender-mist/60">
            <div className="pb-space-md mb-space-md flex items-center justify-between border-b border-lavender-mist/60">
              <div className="flex items-center gap-space-xs">
                <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                <h2 className="font-title-md text-title-md text-ink font-semibold">Contact Credentials</h2>
              </div>
              <span className="font-label-sm text-label-sm text-ink-subtle uppercase">Section 02</span>
            </div>

            <div className="flex flex-col gap-space-md">
              {/* Email row */}
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center flex-shrink-0 text-primary shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="font-label-md text-label-md text-ink font-medium">Email Address</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-ink-muted">
                        <span className="material-symbols-outlined text-[13px] text-ink-subtle">
                          alternate_email
                        </span>
                        Account Email
                      </span>
                    </div>
                    <span className="font-title-sm text-title-sm text-ink font-normal mt-0.5">{email || 'Not provided'}</span>
                    <span className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                      Primary address for tax invoices, delivery updates, and passkeys.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openEmailModal}
                  className="self-start md:self-center px-space-md py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-ink font-label-md text-label-md transition-colors flex items-center gap-1.5 flex-shrink-0 border border-lavender-mist/60 font-medium"
                >
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">edit</span>
                  <span>{email ? 'Change Email' : 'Add Email'}</span>
                </button>
              </div>

              {/* Phone row */}
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center flex-shrink-0 text-primary shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">smartphone</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="font-label-md text-label-md text-ink font-medium">Mobile Phone Number</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-ink-muted">
                        <span className="material-symbols-outlined text-[13px] text-ink-subtle">
                          phone
                        </span>
                        {phone ? 'Contact Phone' : 'Not Added'}
                      </span>
                    </div>
                    <span className="font-title-sm text-title-sm text-ink font-mono font-normal mt-0.5">{phone || 'Not added'}</span>
                    <span className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                      Used for courier delivery updates and account contact. SMS OTP delivery is not connected.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openPhoneModal}
                  className="self-start md:self-center px-space-md py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-ink font-label-md text-label-md transition-colors flex items-center gap-1.5 flex-shrink-0 border border-lavender-mist/60 font-medium"
                >
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">sync_alt</span>
                  <span>{phone ? 'Update Number' : 'Add Number'}</span>
                </button>
              </div>

              {/* Optional Phone & Language */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-ink" htmlFor="alt-phone">
                    Alternate / Emergency Contact <span className="text-ink-subtle font-normal">(Optional)</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-ink-subtle text-[18px]">
                      call
                    </span>
                    <input
                      id="alt-phone"
                      type="tel"
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value)}
                      className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono border border-transparent focus:border-primary/40"
                    />
                  </div>
                  <span className="font-body-sm text-body-sm text-ink-subtle">
                    Used only if you are unreachable during high-priority courier deliveries.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-ink" htmlFor="comm-lang">
                    Preferred Communication Language
                  </label>
                  <div className="relative">
                    <select
                      id="comm-lang"
                      value={commLang}
                      onChange={(e) => setCommLang(e.target.value)}
                      className="w-full h-11 px-3.5 appearance-none rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-10 cursor-pointer border border-transparent focus:border-primary/40"
                    >
                      <option value="en">English (India)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="kn">Kannada (ಕನ್ನಡ)</option>
                      <option value="ta">Tamil (தமிழ்)</option>
                      <option value="mr">Marathi (मराठी)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-subtle text-[20px]">
                      expand_more
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-ink-subtle">
                    Applied to logistics SMS notifications and live agent support calls.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 03: Identity & Regulatory Details */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-lavender-mist/60">
            <div className="pb-space-md mb-space-md flex items-center justify-between border-b border-lavender-mist/60">
              <div className="flex items-center gap-space-xs">
                <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                <h2 className="font-title-md text-title-md text-ink font-semibold">Identity & Regulatory Details (Optional)</h2>
              </div>
              <span className="font-label-sm text-label-sm text-ink-subtle uppercase">Section 03</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-md text-label-md text-ink font-semibold">PAN / Tax Identification (Optional)</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                      panNumber
                        ? /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                        : 'bg-surface-container text-ink-subtle'
                    }`}>
                      <span className="material-symbols-outlined text-[13px]">
                        {panNumber ? (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber) ? 'check' : 'warning') : 'info'}
                      </span>
                      {panNumber
                        ? /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)
                          ? 'Format Validated'
                          : 'Invalid Format'
                        : 'Not Added'}
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs font-mono text-title-sm font-semibold text-ink tracking-wider mt-1">
                    <span>{panNumber || 'No PAN on file'}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-ink-subtle mt-2">
                    Mandatory for high-value orders surpassing ₹50,000 as per Indian Income Tax guidelines. Format is checked locally; backend verification is currently pending service connection.
                  </p>
                </div>
                <div className="pt-space-md mt-space-sm flex items-center justify-between text-body-sm">
                  <span className="text-ink-subtle font-label-sm text-label-sm">Local format check only • Not stored in browser</span>
                  <button
                    type="button"
                    onClick={openPanModal}
                    className="text-primary hover:text-royal-purple font-label-md text-label-md transition-colors font-medium"
                  >
                    {panNumber ? 'Update PAN' : 'Add PAN'}
                  </button>
                </div>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-md text-label-md text-ink font-semibold">Government ID / KYC</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-ink-subtle">
                      <span className="material-symbols-outlined text-[13px]">
                        pending
                      </span>
                      Service Not Connected
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs text-title-sm font-medium text-ink-subtle mt-1">
                    <span>No Government ID Linked</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-ink-subtle mt-2">
                    DigiLocker and government identity services are not connected to this marketplace deployment. No identity records or Aadhaar data are stored.
                  </p>
                </div>
                <div className="pt-space-md mt-space-sm flex items-center justify-between text-body-sm">
                  <span className="text-ink-subtle font-label-sm text-label-sm">Integration Pending</span>
                  <span className="text-ink-subtle font-label-md text-label-md">Pending Integration</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Local Browser Storage Notice */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm border border-lavender-mist/60">
            <span className="material-symbols-outlined text-ink-muted text-[22px] flex-shrink-0 mt-0.5">
              shield
            </span>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-ink font-semibold">Privacy & Local Storage Notice</span>
              <p className="font-body-sm text-body-sm text-ink-muted mt-0.5 leading-relaxed">
                Your profile preferences, saved addresses, and wishlist are stored locally in this browser per account until cleared. They are not synchronized across devices. Cloud profile synchronization and backend KYC services are under active development. For privacy and data protection, sensitive government identifiers (such as PAN and Aadhaar) are not stored in browser storage.
              </p>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-lavender-mist/60 flex flex-col sm:flex-row items-center justify-between gap-space-md sticky bottom-4 z-20">
            <div className="flex items-center gap-space-xs text-ink-subtle font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{lastModified ? `Saved locally • Last modified on ${lastModified}` : 'Saved locally in this browser'}</span>
            </div>
            <div className="flex items-center gap-space-sm w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-initial px-space-lg py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink font-label-md text-label-md transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-initial px-space-xl py-2.5 rounded-lg bg-primary hover:bg-royal-purple text-on-primary font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.985] font-semibold disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Save Profile Locally</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AccountLayout>
  );
};

export default PersonalInfoPage;
