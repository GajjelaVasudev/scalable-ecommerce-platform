import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/account/AccountLayout';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationPreferences } from '../../types';

interface PrefItemConfig {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: string;
}

const SECTION_CONFIGS: { number: string; title: string; items: PrefItemConfig[] }[] = [
  {
    number: '01',
    title: 'Order updates',
    items: [
      {
        key: 'orderConfirmation',
        title: 'Order confirmation',
        description: 'Receive confirmation when your order is placed',
        icon: 'receipt_long'
      },
      {
        key: 'paymentUpdates',
        title: 'Payment updates',
        description: 'Receipts, payment confirmations, and billing alerts',
        icon: 'payments'
      },
      {
        key: 'shippingUpdates',
        title: 'Shipping updates',
        description: 'Tracking numbers and carrier dispatch notices',
        icon: 'local_shipping'
      },
      {
        key: 'deliveryUpdates',
        title: 'Delivery updates',
        description: 'Out-for-delivery and doorstep arrival alerts',
        icon: 'inventory_2'
      },
      {
        key: 'cancellationUpdates',
        title: 'Cancellation updates',
        description: 'Order cancellation confirmations',
        icon: 'cancel'
      }
    ]
  },
  {
    number: '02',
    title: 'Returns and refunds',
    items: [
      {
        key: 'returnStatus',
        title: 'Return status',
        description: 'Approval and pickup schedule updates',
        icon: 'assignment_return'
      },
      {
        key: 'refundStatus',
        title: 'Refund status',
        description: 'Notifications when refunds are initiated and credited',
        icon: 'currency_rupee'
      }
    ]
  },
  {
    number: '03',
    title: 'Wishlist and shopping',
    items: [
      {
        key: 'priceDropAlerts',
        title: 'Price drop alerts',
        description: 'Get notified when saved items go on sale',
        icon: 'trending_down'
      },
      {
        key: 'backInStockAlerts',
        title: 'Back-in-stock alerts',
        description: 'Know when out-of-stock wishlist items return',
        icon: 'inventory'
      },
      {
        key: 'promotionalOffers',
        title: 'Promotional offers',
        description: 'Curated deals, seasonal sales, and member exclusives',
        icon: 'local_offer'
      }
    ]
  },
  {
    number: '04',
    title: 'Account',
    items: [
      {
        key: 'profileChanges',
        title: 'Profile changes',
        description: 'Updates to your personal details or saved addresses',
        icon: 'manage_accounts'
      },
      {
        key: 'securityAlerts',
        title: 'Security-related alerts',
        description: 'Password changes and sign-in notifications',
        icon: 'shield_lock'
      }
    ]
  },
  {
    number: '05',
    title: 'Channels',
    items: [
      {
        key: 'inApp',
        title: 'In-app notifications',
        description: 'Alerts inside your OMIZON notification centre',
        icon: 'notifications_active'
      },
      {
        key: 'email',
        title: 'Email notifications',
        description: 'Summaries and order updates sent to your email',
        icon: 'mail'
      },
      {
        key: 'push',
        title: 'Push notifications',
        description: 'Instant browser and mobile alerts',
        icon: 'devices'
      }
    ]
  }
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  orderConfirmation: true,
  paymentUpdates: true,
  shippingUpdates: true,
  deliveryUpdates: true,
  cancellationUpdates: true,
  returnStatus: true,
  refundStatus: true,
  priceDropAlerts: true,
  backInStockAlerts: true,
  promotionalOffers: false,
  profileChanges: true,
  securityAlerts: true,
  inApp: true,
  email: true,
  push: false
};

const ALL_KEYS: (keyof NotificationPreferences)[] = [
  'orderConfirmation',
  'paymentUpdates',
  'shippingUpdates',
  'deliveryUpdates',
  'cancellationUpdates',
  'returnStatus',
  'refundStatus',
  'priceDropAlerts',
  'backInStockAlerts',
  'promotionalOffers',
  'profileChanges',
  'securityAlerts',
  'inApp',
  'email',
  'push'
];

export const NotificationPreferencesPage: React.FC = () => {
  const { preferences, fetchPreferences, updatePreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(
    preferences || DEFAULT_PREFERENCES
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const togglePref = (key: keyof NotificationPreferences) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(localPrefs);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      // Error handled in context
    } finally {
      setIsSaving(false);
    }
  };

  // Math for Active Alerts Summary
  const totalCount = ALL_KEYS.length;
  const activeCount = ALL_KEYS.filter((k) => Boolean(localPrefs[k])).length;
  const percent = Math.round((activeCount / totalCount) * 100);
  const circumference = 163.36; // 2 * PI * 26
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <AccountLayout activeKey="notifications">
      <div className="flex flex-col w-full gap-space-xl">
        {/* Header Section */}
        <div className="flex flex-col gap-space-md">
          <Link
            to="/account/notifications"
            className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors font-label-md text-xs font-semibold w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Notifications</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md">
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                Notification Preferences
              </h1>
              <p className="font-body-md text-sm text-on-surface-variant">
                Choose how and when you want to hear from OMIZON.
              </p>
            </div>

            <button
              type="button"
              id="save-preferences-btn"
              disabled={isSaving}
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 bg-on-primary-fixed hover:bg-primary text-on-primary font-title-sm text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all active:scale-[0.985] cursor-pointer shrink-0 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>{isSaving ? 'Saving...' : 'Save preferences'}</span>
            </button>
          </div>
        </div>

        {/* Editorial Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Active Alerts Card */}
          <div className="md:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex items-center justify-between gap-space-md border border-lavender-mist/60 dark:border-obsidian-border">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-label-sm text-xs text-outline uppercase tracking-wider font-semibold">
                Active Alerts
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-2xl font-bold text-on-surface tabular-nums" id="active-count">
                  {activeCount}
                </span>
                <span className="font-body-md text-sm text-on-surface-variant">
                  of {totalCount} preferences enabled
                </span>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Changes take effect immediately across your selected channels.
              </p>
            </div>

            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90 text-primary-container" viewBox="0 0 64 64">
                <circle
                  className="text-surface-container-high opacity-60"
                  cx="32"
                  cy="32"
                  fill="none"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                />
                <circle
                  className="transition-all duration-300"
                  cx="32"
                  cy="32"
                  fill="none"
                  id="progress-ring"
                  r="26"
                  stroke="currentColor"
                  strokeDasharray="163.36"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth="5"
                />
              </svg>
              <span className="absolute font-label-sm text-xs text-on-surface tabular-nums font-bold" id="active-percent">
                {percent}%
              </span>
            </div>
          </div>

          {/* Delivery Channels Card */}
          <div className="md:col-span-5 bg-surface-container-low rounded-xl p-space-lg flex flex-col justify-between gap-space-sm border border-lavender-mist/40 dark:border-obsidian-border">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-xs text-outline uppercase tracking-wider font-semibold">
                Delivery Channels
              </span>
              <span className="material-symbols-outlined text-primary-container text-[20px]">tune</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-xs font-semibold shadow-sm border border-lavender-mist/60 dark:border-obsidian-border">
                <span
                  className={`w-2 h-2 rounded-full ${
                    localPrefs.inApp ? 'bg-primary-container' : 'bg-outline'
                  }`}
                />
                In-app
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-xs font-semibold shadow-sm border border-lavender-mist/60 dark:border-obsidian-border">
                <span
                  className={`w-2 h-2 rounded-full ${
                    localPrefs.email ? 'bg-primary-container' : 'bg-outline'
                  }`}
                />
                Email
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-xs font-semibold shadow-sm border border-lavender-mist/60 dark:border-obsidian-border">
                <span
                  className={`w-2 h-2 rounded-full ${
                    localPrefs.push ? 'bg-primary-container' : 'bg-outline'
                  }`}
                />
                Push
              </span>
            </div>
          </div>
        </div>

        {/* Preferences Sections */}
        <div className="flex flex-col gap-space-xl">
          {SECTION_CONFIGS.map((section) => (
            <section key={section.number} className="flex flex-col gap-space-md">
              <div className="flex items-baseline gap-3">
                <span className="font-label-sm text-xs font-bold text-primary-container uppercase tracking-widest">
                  {section.number}
                </span>
                <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                  {section.title}
                </h2>
              </div>

              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-2 flex flex-col gap-1 border border-lavender-mist/60 dark:border-obsidian-border">
                {section.items.map((item) => {
                  const isChecked = Boolean(localPrefs[item.key]);
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-space-md p-space-md rounded-lg hover:bg-surface-container-low/60 transition-colors"
                    >
                      <div className="flex items-start gap-space-md min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-title-sm text-sm font-semibold text-on-surface">
                            {item.title}
                          </span>
                          <span className="font-body-sm text-xs text-on-surface-variant">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        aria-label={item.title}
                        onClick={() => togglePref(item.key)}
                        className={`pref-toggle relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${
                          isChecked ? 'bg-primary-container' : 'bg-surface-container-high'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-on-primary shadow-sm transition duration-200 mt-0.5 ml-0.5 ${
                            isChecked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Save Confirmation Toast */}
        <div
          id="save-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-on-primary-fixed text-on-primary px-5 py-3 rounded-xl shadow-xl transition-all duration-300 ${
            showToast ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-primary-fixed">check_circle</span>
          <span className="font-title-sm text-sm font-semibold">Notification preferences saved</span>
        </div>
      </div>
    </AccountLayout>
  );
};
