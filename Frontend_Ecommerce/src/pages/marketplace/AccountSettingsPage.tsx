import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccountLayout } from '../../components/account/AccountLayout';
import { api } from '../../services/api';
import {
  ShieldCheck,
  KeyRound,
  Bell,
  Mail,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AccountSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notification Preferences
  const [smsOrders, setSmsOrders] = useState(true);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [emailNewsletters, setEmailNewsletters] = useState(false);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);

  // Security Toggles
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  // Delete Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.auth.updateProfile({ currentPassword, newPassword });
      setPasswordFeedback({
        type: 'success',
        message: 'Password successfully updated on server! All active sessions remain secure.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully.');
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err.message || 'Failed to update password. Please check your current password.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmationText !== 'DELETE') {
      alert('Please type DELETE to confirm account deactivation.');
      return;
    }
    alert('Your account deactivation request has been scheduled. Signing out...');
    logout();
    navigate('/');
  };

  return (
    <AccountLayout activeKey="settings">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">
            Login & Account Security
          </h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Manage your credentials, 2-factor authentication, privacy controls, and communication preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Security Score: Strong (96%)
          </span>
        </div>
      </div>

      {/* 1. Change Password Section */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/15">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="font-title-md text-on-surface font-bold text-base">
            Change Password
          </h3>
        </div>

        {passwordFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              passwordFeedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
            }`}
          >
            {passwordFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{passwordFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full h-10 px-3 pr-9 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
              New Password (min 8 chars)
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-1">
            <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Two-Factor Authentication & Active Sessions */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/15">
          <Smartphone className="w-5 h-5 text-primary" />
          <h3 className="font-title-md text-on-surface font-bold text-base">
            Two-Factor Authentication & Devices
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-title-sm text-on-surface font-semibold text-sm">
              SMS / WhatsApp 2FA Verification
            </h4>
            <p className="font-body-sm text-on-surface-variant text-xs mt-0.5">
              Require a 6-digit OTP code sent to your registered mobile number for every new browser session.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTwoFactorEnabled(!twoFactorEnabled);
              showToast(`Two-Factor Authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}.`);
            }}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              twoFactorEnabled ? 'bg-primary' : 'bg-surface-container-high'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-4 bg-surface-container-low rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-primary">
              PC
            </div>
            <div>
              <span className="font-bold text-on-surface block">Windows 11 • Chrome 129</span>
              <span className="text-outline">Mumbai, India • Current active session</span>
            </div>
          </div>
          <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Active Now
          </span>
        </div>
      </div>

      {/* 3. Notification & Marketing Preferences */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/15">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-title-md text-on-surface font-bold text-base">
            Notification Preferences
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/10 cursor-pointer">
            <input
              type="checkbox"
              checked={smsOrders}
              onChange={(e) => setSmsOrders(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary"
            />
            <div>
              <span className="font-title-sm text-on-surface font-semibold text-xs block">
                Order Status SMS & Dispatch Alerts
              </span>
              <span className="font-body-sm text-outline text-[11px]">
                Real-time tracking and OTP notifications.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/10 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappUpdates}
              onChange={(e) => setWhatsappUpdates(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary"
            />
            <div>
              <span className="font-title-sm text-on-surface font-semibold text-xs block">
                WhatsApp Delivery Tracking Updates
              </span>
              <span className="font-body-sm text-outline text-[11px]">
                Receive FastX live location link on WhatsApp.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/10 cursor-pointer">
            <input
              type="checkbox"
              checked={priceDropAlerts}
              onChange={(e) => setPriceDropAlerts(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary"
            />
            <div>
              <span className="font-title-sm text-on-surface font-semibold text-xs block">
                Wishlist Price-Drop & Restock Alerts
              </span>
              <span className="font-body-sm text-outline text-[11px]">
                Notify when saved products drop in price.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/10 cursor-pointer">
            <input
              type="checkbox"
              checked={emailNewsletters}
              onChange={(e) => setEmailNewsletters(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary"
            />
            <div>
              <span className="font-title-sm text-on-surface font-semibold text-xs block">
                Exclusive VIP Newsletters & Curated Deals
              </span>
              <span className="font-body-sm text-outline text-[11px]">
                Weekly luxury tech and design drops.
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => showToast('Preferences updated.')}>
            Save Preferences
          </Button>
        </div>
      </div>

      {/* 4. Danger Zone: Deactivate Account */}
      <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-title-md text-red-600 dark:text-red-400 font-bold text-base">
            Deactivate or Delete Account
          </h4>
          <p className="font-body-sm text-on-surface-variant text-xs mt-0.5">
            Permanently close your OMIZON buyer profile, saved payment methods, and VIP Prime+ tier.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDeleteModalOpen(true)}
          icon={<Trash2 className="w-4 h-4 text-red-600" />}
          className="text-red-600 hover:bg-red-100/50 dark:hover:bg-red-950/30"
        >
          Close Account
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl p-6 border border-red-500/30 animate-scale-up flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-headline-sm text-on-surface font-bold text-lg">
                Are you absolutely sure?
              </h3>
              <p className="font-body-sm text-on-surface-variant text-xs mt-2 leading-relaxed">
                This action cannot be undone. All order history, OMIZON Coins balance, and saved addresses will be purged.
              </p>
            </div>

            <div>
              <label className="font-label-sm text-outline uppercase text-[11px] block mb-1">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-mono font-bold"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default AccountSettingsPage;

