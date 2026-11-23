import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/account/AccountLayout';
import { useNotifications } from '../../context/NotificationContext';
import { formatTimeAgo } from '../../components/marketplace/NotificationDropdown';
import { NotificationItem } from '../../types';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'returns', label: 'Returns & Refunds' },
  { id: 'offers', label: 'Offers' },
  { id: 'account', label: 'Account' }
];

export const NotificationCentrePage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    filter,
    pagination,
    setFilter,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleToggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleToggleRead = async (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (item.isRead) {
      await markAsUnread(item._id);
    } else {
      await markAsRead(item._id);
    }
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    await deleteNotification(id);
  };

  return (
    <AccountLayout activeKey="notifications">
      <div className="flex flex-col w-full gap-space-lg">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm border-b border-lavender-mist dark:border-obsidian-border">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <h1 className="font-headline-md text-2xl font-bold text-on-surface tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span
                  id="unread-badge"
                  className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-xs font-semibold"
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="font-body-md text-sm text-on-surface-variant">
              Stay updated on your orders, offers and account activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-md">
            <button
              type="button"
              id="mark-all-read-btn"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-space-xs px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low shadow-sm transition-all font-label-md text-xs font-medium cursor-pointer border border-lavender-mist dark:border-obsidian-border"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">done_all</span>
              <span>Mark all as read</span>
            </button>

            <Link
              to="/account/notifications/preferences"
              className="inline-flex items-center gap-space-xs text-primary hover:text-secondary transition-colors font-label-md text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Notification preferences</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" id="filter-bar">
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-filter={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`filter-pill shrink-0 px-4 py-2 rounded-full font-label-md text-xs transition-all cursor-pointer font-medium ${
                  isActive
                    ? 'bg-on-surface text-surface shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface shadow-sm border border-lavender-mist/60 dark:border-obsidian-border'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* State: Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-space-sm" id="state-loading">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex items-start gap-space-md p-space-md rounded-xl bg-surface-container-lowest shadow-sm animate-pulse border border-lavender-mist/50 dark:border-obsidian-border"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-container-high shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 w-1/3 rounded bg-surface-container-high" />
                  <div className="h-3.5 w-2/3 rounded bg-surface-container" />
                  <div className="h-3 w-24 rounded bg-surface-container" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* State: Error */}
        {!isLoading && error && (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-lavender-mist dark:border-obsidian-border"
            id="state-error"
          >
            <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mb-space-md">
              <span className="material-symbols-outlined text-[32px] text-on-error-container">cloud_off</span>
            </div>
            <h2 className="font-headline-sm text-lg font-bold text-on-surface mb-1">
              Unable to load notifications
            </h2>
            <p className="font-body-md text-sm text-on-surface-variant max-w-md mb-space-lg">
              We encountered a temporary issue fetching your latest updates. Please check your connection and try again.
            </p>
            <button
              type="button"
              id="retry-btn"
              onClick={() => fetchNotifications(pagination.page, filter)}
              className="inline-flex items-center gap-space-xs px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-secondary transition-colors font-label-md text-xs font-semibold cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* State: Empty State (No notifications total) */}
        {!isLoading && !error && notifications.length === 0 && filter === 'all' && (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-lavender-mist dark:border-obsidian-border"
            id="state-empty"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-md">
              <span className="material-symbols-outlined text-[32px] text-primary">notifications_off</span>
            </div>
            <h2 className="font-headline-sm text-lg font-bold text-on-surface mb-1">
              You're all caught up
            </h2>
            <p className="font-body-md text-sm text-on-surface-variant max-w-md mb-space-lg">
              There are no notifications to show right now. We'll let you know when there's an update on your orders or wishlist.
            </p>
            <Link
              to="/products"
              className="px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-secondary transition-colors font-label-md text-xs font-semibold shadow-sm inline-block"
            >
              Explore Marketplace
            </Link>
          </div>
        )}

        {/* State: No Filter Results */}
        {!isLoading && !error && notifications.length === 0 && filter !== 'all' && (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-lavender-mist dark:border-obsidian-border"
            id="state-no-results"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-md">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant">filter_list_off</span>
            </div>
            <h2 className="font-headline-sm text-lg font-bold text-on-surface mb-1">
              No matching notifications
            </h2>
            <p className="font-body-md text-sm text-on-surface-variant max-w-md mb-space-lg">
              No notifications were found for the selected category filter.
            </p>
            <button
              type="button"
              id="reset-filter-btn"
              onClick={() => setFilter('all')}
              className="px-5 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-xs font-semibold cursor-pointer"
            >
              View all notifications
            </button>
          </div>
        )}

        {/* State: Notification List */}
        {!isLoading && !error && notifications.length > 0 && (
          <div className="flex flex-col gap-space-sm" id="notification-list">
            {notifications.map((item) => {
              const isUnread = !item.isRead;
              const rowBg = isUnread
                ? 'bg-surface-container-low/70'
                : 'bg-surface-container-lowest';
              const iconBg = isUnread
                ? 'bg-primary-fixed text-primary'
                : 'bg-surface-container text-on-surface-variant';
              const isMenuOpen = openMenuId === item._id;

              return (
                <div
                  key={item._id}
                  className={`relative flex items-start gap-space-md p-space-md rounded-xl ${rowBg} shadow-sm hover:shadow-md transition-all border border-lavender-mist/60 dark:border-obsidian-border`}
                >
                  {/* Category Icon */}
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon || 'notifications'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" title="Unread" />
                      )}
                      <h3
                        className={`font-title-sm text-sm truncate ${
                          isUnread ? 'text-on-surface font-bold' : 'text-on-surface-variant font-medium'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <span className="font-body-sm text-xs text-outline ml-auto shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="font-body-md text-sm text-on-surface-variant mb-2">
                      {item.message}
                    </p>

                    <Link
                      to={item.actionUrl || '/account/orders'}
                      onClick={() => {
                        if (!item.isRead) markAsRead(item._id);
                      }}
                      className="inline-flex items-center gap-1 font-label-md text-xs text-primary hover:text-secondary transition-colors font-semibold"
                    >
                      <span>{item.actionLabel || 'View details'}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>

                  {/* Overflow Action Menu */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      data-menu-btn={item._id}
                      onClick={(e) => handleToggleMenu(item._id, e)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                      aria-label="More actions"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>

                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-9 z-30 w-44 py-1.5 rounded-xl bg-surface-container-lowest shadow-lg border border-lavender-mist dark:border-obsidian-border animate-fade-in"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleToggleRead(item, e)}
                          className="w-full text-left px-3.5 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isUnread ? 'mark_email_read' : 'mark_email_unread'}
                          </span>
                          <span>{isUnread ? 'Mark as read' : 'Mark as unread'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDismiss(item._id, e)}
                          className="w-full text-left px-3.5 py-2 font-body-sm text-xs text-error hover:bg-error-container/30 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete_outline</span>
                          <span>Dismiss</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-lavender-mist dark:border-obsidian-border">
                <span className="font-body-sm text-xs text-on-surface-variant">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalNotifications} notifications)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchNotifications(pagination.page - 1, filter)}
                    className="px-3 py-1.5 rounded-lg border border-lavender-mist dark:border-obsidian-border bg-surface-container-lowest text-on-surface text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchNotifications(pagination.page + 1, filter)}
                    className="px-3 py-1.5 rounded-lg border border-lavender-mist dark:border-obsidian-border bg-surface-container-lowest text-on-surface text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};
