import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login, switchRoleDemo, isLoading } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('priya@omizon.in');
  const [password, setPassword] = useState('password123');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-porcelain dark:bg-obsidian-violet">
      <div className="w-full max-w-md bg-white dark:bg-obsidian-surface-1 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-modal p-8 flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center flex flex-col items-center">
          <Link to="/">
            <img src="/logo.svg" alt="OMIZON" className="h-10 w-auto mb-2 dark:hidden" />
            <img src="/logo-dark.svg" alt="OMIZON" className="h-10 w-auto mb-2 hidden dark:block" />
          </Link>
          <h1 className="text-xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Sign In to OMIZON
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Access your orders, merchant portal, and platform governance
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-semantic-error flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Username or Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="priya@omizon.in or username"
                className="w-full bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 pl-9 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet"
              />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
                Password
              </label>
              <a href="#forgot" className="text-[11px] text-electric-violet hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 pl-9 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet"
              />
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full font-bold shadow-md shadow-electric-violet/20 mt-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Quick Demo Logins Bar */}
        <div className="pt-2 border-t border-lavender-mist dark:border-obsidian-border flex flex-col gap-2">
          <span className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold text-center">
            One-Click Demo Simulator:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                switchRoleDemo('buyer');
                navigate('/');
              }}
              className="py-2 px-1 text-[11px] font-bold rounded-xl bg-porcelain dark:bg-obsidian-surface-2 hover:bg-electric-violet/10 text-electric-violet border border-lavender-mist dark:border-obsidian-border transition-colors text-center"
            >
              Buyer Mode
            </button>
            <button
              type="button"
              onClick={() => {
                switchRoleDemo('seller');
                navigate('/seller/dashboard');
              }}
              className="py-2 px-1 text-[11px] font-bold rounded-xl bg-porcelain dark:bg-obsidian-surface-2 hover:bg-emerald-500/10 text-emerald-600 border border-lavender-mist dark:border-obsidian-border transition-colors text-center"
            >
              Seller Hub
            </button>
            <button
              type="button"
              onClick={() => {
                switchRoleDemo('admin');
                navigate('/admin/dashboard');
              }}
              className="py-2 px-1 text-[11px] font-bold rounded-xl bg-porcelain dark:bg-obsidian-surface-2 hover:bg-amber-500/10 text-amber-600 border border-lavender-mist dark:border-obsidian-border transition-colors text-center"
            >
              Admin Ops
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-electric-violet font-bold hover:underline">
            Register as Buyer
          </Link>
        </p>
      </div>
    </div>
  );
};

