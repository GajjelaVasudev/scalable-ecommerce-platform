import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'discount';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  icon,
}) => {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full select-none';

  const variants = {
    primary: 'bg-primary/10 text-electric-violet border border-electric-violet/20',
    success: 'bg-emerald-50 text-semantic-success border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
    warning: 'bg-amber-50 text-semantic-warning border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
    error: 'bg-rose-50 text-semantic-error border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800',
    neutral: 'bg-surface-container-high text-on-surface-variant border border-lavender-mist dark:bg-obsidian-surface-2 dark:border-obsidian-border dark:text-text-dark-secondary',
    discount: 'bg-electric-violet/10 text-electric-violet font-bold',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

