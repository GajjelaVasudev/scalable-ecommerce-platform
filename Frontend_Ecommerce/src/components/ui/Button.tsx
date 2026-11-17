import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary:
      'bg-electric-violet hover:bg-royal-purple text-white shadow-sm focus:ring-electric-violet border border-transparent',
    secondary:
      'bg-surface-container-lowest hover:bg-surface-container-low text-ink border border-lavender-mist hover:border-electric-violet/40 focus:ring-electric-violet dark:bg-obsidian-surface-1 dark:text-text-dark-primary dark:border-obsidian-border dark:hover:bg-obsidian-surface-2',
    ghost:
      'bg-transparent hover:bg-electric-violet/10 text-royal-purple dark:text-text-dark-primary hover:text-electric-violet focus:ring-electric-violet',
    outline:
      'bg-transparent border border-lavender-mist hover:border-electric-violet text-ink hover:text-electric-violet dark:border-obsidian-border dark:text-text-dark-primary',
    danger:
      'bg-error hover:bg-red-700 text-white shadow-sm focus:ring-error border border-transparent',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

