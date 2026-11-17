import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-obsidian-surface-1 rounded-2xl border border-lavender-mist dark:border-obsidian-border max-w-lg mx-auto shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-electric-violet flex items-center justify-center mb-4">
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-bold text-ink dark:text-text-dark-primary tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-ink-muted dark:text-text-dark-muted mt-2 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

