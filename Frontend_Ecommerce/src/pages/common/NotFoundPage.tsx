import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-porcelain dark:bg-obsidian-surface-2 border border-lavender-mist dark:border-obsidian-border flex items-center justify-center text-electric-violet font-extrabold text-2xl mb-4 shadow-sm">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
        Destination Not Found
      </h1>
      <p className="text-xs sm:text-sm text-ink-muted mt-2 max-w-md leading-relaxed">
        The marketplace catalog or operations route you requested does not exist or has moved.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <Link to="/">
          <Button variant="primary" size="md" icon={<Home className="w-4 h-4" />}>
            Return to Marketplace Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

