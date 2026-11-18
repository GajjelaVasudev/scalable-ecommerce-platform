import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccountLayout } from '../../components/account/AccountLayout';

export const PersonalInfoPage: React.FC = () => {
  const { user } = useAuth();

  // Parse user info dynamically without hardcoded customer data
  const rawUsername = user?.username || '';
  const nameParts = rawUsername.split(/[_\s-]/).filter(Boolean);
  const initialFirstName = nameParts[0]
    ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase()
    : 'Valued';
  const initialLastName = nameParts.slice(1).join(' ')
    ? nameParts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    : 'Customer';

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [displayName, setDisplayName] = useState(
    rawUsername ? `${initialFirstName} ${initialLastName.charAt(0)}.` : 'Buyer Member'
  );
  const [gender, setGender] = useState('female');
  const [dobDay, setDobDay] = useState('14');
  const [dobMonth, setDobMonth] = useState('08');
  const [dobYear, setDobYear] = useState('1994');

  // Contact Credentials
  const email = user?.email || 'buyer@omizon.in';
  const [phone, setPhone] = useState('+91 98201 44820');
  const [altPhone, setAltPhone] = useState('+91 98112 30491');
  const [commLang, setCommLang] = useState('en');

  // Compliance
  const [panNumber, setPanNumber] = useState('ABCDE1234F');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }, 600);
  };

  const handleReset = () => {
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setDisplayName(`${initialFirstName} ${initialLastName.charAt(0)}.`);
    setPhone('+91 98201 44820');
    setAltPhone('+91 98112 30491');
  };

  const initials = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase() || 'OM';

  return (
    <AccountLayout activeKey="personal-info">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
          <div className="bg-ink text-text-dark-primary px-space-md py-space-sm rounded-lg shadow-xl flex items-center gap-space-sm font-label-md text-label-md">
            <span className="material-symbols-outlined text-semantic-success text-[18px]">check_circle</span>
            <span>Profile information successfully updated.</span>
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
              Manage your personal profile details, identity verification, and contact credentials.
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-ink-subtle font-label-sm text-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
            <span>Tier 1 Verified Buyer</span>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-space-lg">
          {/* Avatar Profile Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-lavender-mist/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-royal-purple text-white overflow-hidden flex items-center justify-center flex-shrink-0 font-bold text-xl shadow-sm">
                  {initials}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="font-title-md text-title-md text-ink font-semibold">
                      {firstName} {lastName}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-ink-muted">
                      <span className="material-symbols-outlined text-[13px] text-semantic-success" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      Verified Member
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                    Account holder • Active OMIZON Buyer
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  className="px-space-md py-1.5 bg-surface-container-low hover:bg-surface-container text-ink font-label-md text-label-md rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">photo_camera</span>
                  <span>Change Photo</span>
                </button>
                <button
                  type="button"
                  className="px-space-sm py-1.5 text-ink-subtle hover:text-semantic-error font-label-md text-label-md rounded-lg transition-colors"
                >
                  Remove
                </button>
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

          {/* Section 02: Contact Credentials & Verification */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-lavender-mist/60">
            <div className="pb-space-md mb-space-md flex items-center justify-between border-b border-lavender-mist/60">
              <div className="flex items-center gap-space-xs">
                <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                <h2 className="font-title-md text-title-md text-ink font-semibold">Contact Credentials & Verification</h2>
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-semantic-success font-semibold">
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        Verified
                      </span>
                    </div>
                    <span className="font-title-sm text-title-sm text-ink font-normal mt-0.5">{email}</span>
                    <span className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                      Primary address for tax invoices, delivery updates, and passkeys.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="self-start md:self-center px-space-md py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-ink font-label-md text-label-md transition-colors flex items-center gap-1.5 flex-shrink-0 border border-lavender-mist/60"
                >
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">edit</span>
                  <span>Change Email</span>
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-semantic-success font-semibold">
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          verified
                        </span>
                        Primary Verified
                      </span>
                    </div>
                    <span className="font-title-sm text-title-sm text-ink font-mono font-normal mt-0.5">{phone}</span>
                    <span className="font-body-sm text-body-sm text-ink-subtle mt-0.5">
                      Protected with two-factor authentication (SMS OTP and WhatsApp concierge).
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="self-start md:self-center px-space-md py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-ink font-label-md text-label-md transition-colors flex items-center gap-1.5 flex-shrink-0 border border-lavender-mist/60"
                >
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">sync_alt</span>
                  <span>Update Number</span>
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

          {/* Section 03: Identity & Regulatory Compliance */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-lavender-mist/60">
            <div className="pb-space-md mb-space-md flex items-center justify-between border-b border-lavender-mist/60">
              <div className="flex items-center gap-space-xs">
                <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                <h2 className="font-title-md text-title-md text-ink font-semibold">Identity & Regulatory Compliance</h2>
              </div>
              <span className="font-label-sm text-label-sm text-ink-subtle uppercase">Section 03</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-md text-label-md text-ink font-semibold">PAN / Tax Identification</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-semantic-success">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs font-mono text-title-sm font-semibold text-ink tracking-wider mt-1">
                    <span>{panNumber}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-ink-subtle mt-2">
                    Mandatory for high-value orders surpassing ₹50,000 as per Indian Income Tax guidelines.
                  </p>
                </div>
                <div className="pt-space-md mt-space-sm flex items-center justify-between text-body-sm">
                  <span className="text-ink-subtle font-label-sm text-label-sm">Validated via NSDL</span>
                  <button type="button" className="text-primary hover:text-royal-purple font-label-md text-label-md transition-colors">
                    Re-verify
                  </button>
                </div>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-md text-label-md text-ink font-semibold">Government ID / KYC</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-semantic-success">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        shield_person
                      </span>
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs font-mono text-title-sm font-semibold text-ink tracking-wider mt-1">
                    <span>•••• •••• 8821</span>
                    <span className="font-body-sm font-sans font-normal text-ink-subtle text-[12px] ml-1">
                      (DigiLocker Linked)
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-ink-subtle mt-2">
                    Facilitates instant zero-deposit checkout on high-end electronics and jewelry purchases.
                  </p>
                </div>
                <div className="pt-space-md mt-space-sm flex items-center justify-between text-body-sm">
                  <span className="text-ink-subtle font-label-sm text-label-sm">Sync active</span>
                  <button type="button" className="text-ink-muted hover:text-ink font-label-md text-label-md transition-colors">
                    Manage Access
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Data Protection Callout */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm border border-lavender-mist/60">
            <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0 mt-0.5">
              verified_user
            </span>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-ink font-semibold">Data Protection Commitment</span>
              <p className="font-body-sm text-body-sm text-ink-muted mt-0.5 leading-relaxed">
                Your credentials and identity records are tokenized with AES-256 encryption in compliance with the Digital Personal Data Protection (DPDP) Act. We never share unmasked phone numbers, tax identifiers, or date of birth with sellers or third-party logistics agents.
              </p>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-lavender-mist/60 flex flex-col sm:flex-row items-center justify-between gap-space-md sticky bottom-4 z-20">
            <div className="flex items-center gap-space-xs text-ink-subtle font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Changes auto-synchronized across active sessions</span>
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
                    <span>Save Changes</span>
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
