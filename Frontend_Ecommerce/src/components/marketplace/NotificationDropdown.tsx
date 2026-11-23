import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationItem } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function formatTimeAgo(dateString: string): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const recentNotifications = notifications.slice(0, 5);

  const handleItemClick = async (item: NotificationItem, e: React.MouseEvent) => {
    e.preventDefault();
    if (!item.isRead) {
      await markAsRead(item._id);
    }
    onClose();
    if (item.actionUrl) {
      navigate(item.actionUrl);
    } else {
      navigate('/account/orders');
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden flex flex-col z-[70] border border-lavender-mist dark:border-obsidian-border animate-fade-in"
      role="dialog"
      aria-label="Notifications panel"
    >
      {/* Dropdown Header */}
      <div className="px-5 py-3.5 bg-surface-container-lowest flex items-center justify-between border-b border-lavender-mist dark:border-obsidian-border">
        <div className="flex items-center gap-2">
          <h2 className="font-headline-sm text-base font-bold text-on-surface">Notifications</h2>
          {unreadCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-[11px] font-semibold">
              {unreadCount} unread
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px]">
              0 unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="font-label-md text-xs text-primary-container hover:text-primary transition-colors cursor-pointer font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Recent Notifications List */}
      <div className="flex flex-col bg-surface-container-lowest max-h-[380px] overflow-y-auto divide-y divide-lavender-mist/50 dark:divide-obsidian-border/50">
        {recentNotifications.length === 0 ? (
          <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-3xl text-outline mb-1">notifications_off</span>
            <p className="font-title-sm text-sm text-on-surface font-medium">You're all caught up</p>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">No new notifications right now</p>
          </div>
        ) : (
          recentNotifications.map((item) => {
            const isUnread = !item.isRead;
            const rowBg = isUnread
              ? 'bg-surface-container-low/60 hover:bg-surface-container-low'
              : 'bg-surface-container-lowest hover:bg-surface-container-low';
            const iconBg = isUnread
              ? 'bg-primary-fixed text-primary'
              : 'bg-surface-container text-on-surface-variant';

            return (
              <a
                key={item._id}
                href={item.actionUrl || '#'}
                onClick={(e) => handleItemClick(item, e)}
                className={`notification-item px-5 py-3 ${rowBg} transition-colors flex items-start gap-3 cursor-pointer text-left`}
                data-unread={isUnread}
              >
                <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon || 'notifications'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-title-sm text-xs truncate ${isUnread ? 'text-on-surface font-bold' : 'text-on-surface-variant font-medium'}`}>
                      {item.title}
                    </p>
                    <span className="font-label-sm text-[11px] text-outline shrink-0">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant truncate mt-0.5">
                    {item.message}
                  </p>
                </div>
                {isUnread && (
                  <span className="unread-dot w-2 h-2 rounded-full bg-primary-container shrink-0 mt-2" title="Unread" />
                )}
              </a>
            );
          })
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="px-5 py-2.5 bg-surface-container-low text-center border-t border-lavender-mist dark:border-obsidian-border">
        <Link
          to="/account/notifications"
          onClick={onClose}
          className="font-title-sm text-xs text-primary-container hover:text-primary transition-colors inline-flex items-center justify-center gap-1 font-semibold"
        >
          <span>View all notifications</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
};
