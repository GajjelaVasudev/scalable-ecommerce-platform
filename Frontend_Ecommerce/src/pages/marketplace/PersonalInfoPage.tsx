import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccountLayout } from '../../components/account/AccountLayout';
import { api } from '../../services/api';
import { migrateLegacyProfile } from '../../utils/profileMigration';

export const PersonalInfoPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse user info dynamically without hardcoded customer data
  const rawUsername = user?.username || '';
  const nameParts = rawUsername.split(/[_\s-]/).filter(Boolean);
  const defaultFirstName = nameParts[0]
    ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase()
    : 'Valued';
  const defaultLastName = nameParts.slice(1).join(' ')
    ? nameParts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    : 'Customer';

  const [firstName, setFirstName] = useState(user?.firstName || defaultFirstName);
  const [lastName, setLastName] = useState(user?.lastName || defaultLastName);
  const [displayName, setDisplayName] = useState(
    user?.displayName || (rawUsername ? `${defaultFirstName} ${defaultLastName.charAt(0)}.` : 'Buyer Member')
  );
  const [gender, setGender] = useState(user?.gender || 'prefer-not-to-say');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  // Contact Credentials
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [altPhone, setAltPhone] = useState(user?.altPhone || '');
  const [commLang, setCommLang] = useState(user?.commLang || 'en');

  // Compliance: in-memory state only for session. Never prefilled with fake PAN.
  const [panNumber, setPanNumber] = useState('');

  // Profile Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.avatarUrl || null);

  const populateFromUserData = (p: any) => {
    if (!p) return;
    setFirstName(p.firstName || defaultFirstName);
    setLastName(p.lastName || defaultLastName);
    setDisplayName(
      p.displayName || (rawUsername ? `${defaultFirstName} ${defaultLastName.charAt(0)}.` : 'Buyer Member')
    );
    setGender(p.gender || 'prefer-not-to-say');
    if (p.dateOfBirth) {
      const parts = String(p.dateOfBirth).split('T')[0].split('-');
      if (parts.length === 3) {
        setDobYear(parts[0]);
        setDobMonth(parts[1]);
        setDobDay(parts[2]);
      }
    }
    setEmail(p.email || user?.email || '');
    setPhone(p.phone || '');
    setAltPhone(p.altPhone || '');
    setCommLang(p.commLang || 'en');
    setPhotoUrl(p.avatarUrl || null);
  };

  // Synchronize state and migrate legacy profile on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAndSyncProfile() {
      try {
        const res = await api.auth.getProfile();
        if (isMounted && res?.user) {
          populateFromUserData(res.user);
          updateUser(res.user);

          // Perform legacy migration if local storage data exists
          const migrated = await migrateLegacyProfile(user, res.user);
          if (isMounted && migrated) {
            populateFromUserData(migrated);
            updateUser(migrated);
          }
        }
      } catch (e) {
        // Fallback to in-memory user if network is momentarily unavailable
        if (isMounted && user) {
          populateFromUserData(user);
        }
      }
    }

    loadAndSyncProfile();

    return () => {
      isMounted = false;
    };
  }, [user?._id]);

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
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setValidationErrors(['Please upload a valid JPEG, PNG, or WebP image.']);
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        try {
          const res = await api.auth.uploadAvatar({ image: result, mimeType: file.type });
          setPhotoUrl(res.avatarUrl);
          updateUser(res.user);
          triggerToast('Profile photo uploaded and saved successfully.');
        } catch (err: any) {
          triggerToast(err.message || 'Failed to upload photo to server.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await api.auth.removeAvatar();
      setPhotoUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      updateUser({ avatarUrl: null });
      triggerToast('Profile photo removed.');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to remove photo.');
    }
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
    if (firstName.trim().length > 100) {
      errors.push('First name cannot exceed 100 characters.');
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      errors.push('Last name is required (minimum 2 characters).');
    }
    if (lastName.trim().length > 100) {
      errors.push('Last name cannot exceed 100 characters.');
    }
    if (!displayName.trim()) {
      errors.push('Display name is required.');
    }
    if (displayName.trim().length > 100) {
      errors.push('Display name cannot exceed 100 characters.');
    }

    // DOB check: if any DOB part entered, validate completeness and ranges
    if (dobDay || dobMonth || dobYear) {
      const day = parseInt(dobDay, 10);
      const month = parseInt(dobMonth, 10);
      const year = parseInt(dobYear, 10);
      if (isNaN(day) || day < 1 || day > 31) {
        errors.push('Please enter a valid day of birth (1-31).');
      }
      if (isNaN(month) || month < 1 || month > 12) {
        errors.push('Please enter a valid month of birth (1-12).');
      }
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        errors.push(`Please enter a valid year of birth (1900-${new Date().getFullYear()}).`);
      }
    }

    // Phone check
    if (phone && phone.trim()) {
      const digits = phone.replace(/\D/g, '');
      const valid =
        (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) ||
        (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits));
      if (!valid) {
        errors.push('Mobile phone must be a valid 10-digit Indian number starting with 6-9.');
      }
    }

    // PAN check (standard 10-char format: 5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (panNumber && !panRegex.test(panNumber.toUpperCase())) {
      errors.push('PAN number must follow standard format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setValidationErrors([]);
    try {
      const response = await api.auth.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        gender: gender as any,
        phone: phone ? phone.trim() : null,
        altPhone: altPhone ? altPhone.trim() : null,
        commLang: commLang as any,
        dobDay: dobDay || undefined,
        dobMonth: dobMonth || undefined,
        dobYear: dobYear || undefined,
      });

      updateUser(response.user);
      populateFromUserData(response.user);
      triggerToast('Profile details saved successfully on server.');
    } catch (err: any) {
      setValidationErrors([err.message || 'Failed to update profile on server.']);
      triggerToast('Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    populateFromUserData(user);
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
    const rawDigits = phone.replace(/\D/g, '');
    const cleanDigits = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
    setModalInput(cleanDigits);
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
      // Phase 6 requirement: email is read-only in UI
      setActiveModal(null);
    } else if (activeModal === 'phone') {
      const digits = modalInput.replace(/\D/g, '');
      if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
        setModalError('Please enter a valid 10-digit Indian mobile number (starting with 6-9).');
        return;
      }
      setPhone(`+91 ${digits}`);
      setActiveModal(null);
      setModalInput('');
      triggerToast('Mobile number updated. Click "Save Profile to Server" below to persist.');
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
                  ? 'Account Email Security'
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

            {activeModal === 'email' ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-surface-container-low rounded-xl border border-lavender-mist/60 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-label-md">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>Primary Account Email</span>
                  </div>
                  <p className="font-title-sm text-title-sm text-ink font-mono font-medium">
                    {email || 'No email registered'}
                  </p>
                  <p className="font-body-sm text-body-sm text-ink-subtle">
                    This email is permanently linked to your OMIZON account for sign-in, order confirmations, and security alerts.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs leading-relaxed flex items-start gap-2 border border-amber-200">
                  <span className="material-symbols-outlined text-[16px] text-amber-600 mt-0.5 flex-shrink-0">info</span>
                  <span>
                    Direct email changes are restricted to protect account integrity. Email modification requires a verification link sent to your registered email, which will be enabled in an upcoming security release.
                  </span>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-space-lg py-2 rounded-lg bg-primary hover:bg-royal-purple text-on-primary font-label-md text-label-md transition-colors font-semibold"
                  >
                    Understood
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
                {modalError && (
                  <div className="p-3 bg-red-50 text-semantic-error rounded-lg text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-ink">
                    {activeModal === 'phone'
                      ? '10-Digit Mobile Number'
                      : '10-Character PAN Number'}
                  </label>
                  <div className="relative flex items-center">
                    {activeModal === 'phone' && (
                      <span className="absolute left-3.5 text-ink-subtle font-mono text-sm">+91</span>
                    )}
                    <input
                      type="text"
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                      placeholder={
                        activeModal === 'phone'
                          ? '98200 12345'
                          : 'ABCDE1234F'
                      }
                      maxLength={10}
                      className={`w-full h-11 pr-3.5 rounded-lg bg-surface-container-low text-ink font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-lavender-mist/60 ${
                        activeModal === 'phone' ? 'pl-14 font-mono' : 'pl-3.5'
                      }`}
                      autoFocus
                    />
                  </div>
                  <span className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                    {activeModal === 'phone'
                      ? 'Used for courier communication. Saves to your profile on the server. SMS OTP verification will be required for two-factor authentication in a future update.'
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
                    {activeModal === 'pan' ? 'Validate Format' : 'Update Number'}
                  </button>
                </div>
              </form>
            )}
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
                    onChange={(e) => setGender(e.target.value as any)}
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
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">lock</span>
                  <span>Email Security</span>
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
                      onChange={(e) => setCommLang(e.target.value as any)}
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

          {/* Privacy & Account Data Notice */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm border border-lavender-mist/60">
            <span className="material-symbols-outlined text-ink-muted text-[22px] flex-shrink-0 mt-0.5">
              shield
            </span>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-ink font-semibold">Privacy & Data Protection Notice</span>
              <p className="font-body-sm text-body-sm text-ink-muted mt-0.5 leading-relaxed">
                Your profile preferences and personal information are stored securely in your authenticated OMIZON account database. Sensitive tax and government identifiers (such as PAN and Aadhaar) are not stored without statutory KYC verification.
              </p>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-lavender-mist/60 flex flex-col sm:flex-row items-center justify-between gap-space-md sticky bottom-4 z-20">
            <div className="flex items-center gap-space-xs text-ink-subtle font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[16px]">cloud_done</span>
              <span>{user?.updatedAt ? `Profile synced • Last modified on ${new Date(user.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Profile synced with server'}</span>
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
                    <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                    <span>Save Profile to Server</span>
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
