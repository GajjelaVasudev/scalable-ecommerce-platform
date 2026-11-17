import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  footerText?: string;
  icon?: React.ReactNode;
  sparkline?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  footerText,
  icon,
  sparkline = true,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-surface-container-lowest dark:bg-obsidian-surface-1 p-5 rounded-xl border border-lavender-mist dark:border-obsidian-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-ink-muted dark:text-text-dark-muted">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-electric-violet dark:bg-electric-violet/20">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-text-dark-primary tabular-nums tracking-tight">
            {value}
          </span>
          {change && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-bold gap-0.5',
                isPositive ? 'text-semantic-success' : 'text-semantic-error'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {change}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-ink-subtle dark:text-text-dark-muted mt-1 leading-snug">
            {subtitle}
          </p>
        )}
      </div>

      {footerText && (
        <div className="mt-4 pt-2.5 border-t border-lavender-mist/60 dark:border-obsidian-border/60 flex items-center justify-between text-xs text-ink-muted dark:text-text-dark-muted">
          <span>{footerText}</span>
          {sparkline && (
            <svg className="w-14 h-4 text-electric-violet" fill="none" viewBox="0 0 64 20">
              <path
                d="M2 16L14 12L26 15L38 7L50 9L62 3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};

