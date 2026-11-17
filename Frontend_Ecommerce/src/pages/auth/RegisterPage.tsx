import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (username.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register(username.trim(), email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-porcelain dark:bg-obsidian-violet">
      <div className="w-full max-w-md bg-white dark:bg-obsidian-surface-1 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-modal p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center">
          <Link to="/">
            <img src="/logo.svg" alt="OMIZON" className="h-10 w-auto mb-2 dark:hidden" />
            <img src="/logo-dark.svg" alt="OMIZON" className="h-10 w-auto mb-2 hidden dark:block" />
          </Link>
          <h1 className="text-xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Create an OMIZON Account
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Join India's premier multi-category verified marketplace
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
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ananya_sharma"
                className="w-full bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 pl-9 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet"
              />
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 pl-9 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet"
              />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Password (min 6 characters)
            </label>
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

          <div className="p-3 bg-porcelain dark:bg-obsidian-surface-2 rounded-xl text-[11px] text-ink-subtle leading-relaxed">
            By creating an account, you agree to OMIZON's{' '}
            <a href="#terms" className="text-electric-violet underline">Terms of Commerce</a> and{' '}
            <a href="#privacy" className="text-electric-violet underline">Privacy Policy</a>. Public registration strictly assigns Buyer privileges.
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full font-bold shadow-md shadow-electric-violet/20"
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-center text-xs text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-electric-violet font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

