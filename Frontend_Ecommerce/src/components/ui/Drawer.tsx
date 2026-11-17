import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const isRight = position === 'right';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-midnight-violet/50 backdrop-blur-sm transition-opacity">
      <div
        className={cn(
          'fixed inset-y-0 flex max-w-full',
          isRight ? 'right-0 pl-10' : 'left-0 pr-10'
        )}
      >
        <div
          className={cn(
            'w-screen bg-white dark:bg-obsidian-surface-1 shadow-modal flex flex-col border-l border-lavender-mist dark:border-obsidian-border',
            maxWidths[maxWidth]
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-lavender-mist dark:border-obsidian-border bg-porcelain/40 dark:bg-obsidian-surface-2/40">
            {title && (
              <h2 className="text-lg font-bold text-ink dark:text-text-dark-primary tracking-tight">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-outline hover:text-ink dark:hover:text-white rounded-lg hover:bg-lavender-mist/40 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-5 border-t border-lavender-mist dark:border-obsidian-border bg-porcelain/20 dark:bg-obsidian-surface-2/20">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

