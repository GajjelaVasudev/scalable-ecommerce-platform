import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import {
  NotificationItem,
  NotificationPreferences,
  NotificationCategory
} from '../types';

interface PaginationState {
  page: number;
  limit: number;
  totalNotifications: number;
  totalPages: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  filter: NotificationCategory | string;
  pagination: PaginationState;
  preferences: NotificationPreferences | null;
  setFilter: (category: NotificationCategory | string) => void;
  fetchNotifications: (page?: number, category?: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<string>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalNotifications: 0,
    totalPages: 1
  });

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.notifications.getUnreadCount();
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignore background refresh errors
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(
    async (page = 1, category = filter) => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await api.notifications.list({
          page,
          limit: 10,
          category: category === 'all' ? undefined : category
        });

        setNotifications(res.notifications || []);
        if (res.pagination) {
          setPagination({
            page: res.pagination.page,
            limit: res.pagination.limit,
            totalNotifications: res.pagination.totalNotifications,
            totalPages: res.pagination.totalPages
          });
          setUnreadCount(res.pagination.unreadCount);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch notifications');
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, filter]
  );

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.notifications.getPreferences();
      if (res.preferences) {
        setPreferences(res.preferences);
      }
    } catch {
      // Ignore preference fetch errors
    }
  }, [isAuthenticated]);

  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (!isAuthenticated) return;
      try {
        // Optimistic update
        setPreferences((prev) => (prev ? { ...prev, ...prefs } : (prefs as NotificationPreferences)));
        const res = await api.notifications.updatePreferences(prefs);
        if (res.preferences) {
          setPreferences(res.preferences);
        }
      } catch (err: any) {
        // Revert on error
        await fetchPreferences();
        throw err;
      }
    },
    [isAuthenticated, fetchPreferences]
  );

  const setFilter = useCallback(
    (newFilter: string) => {
      setFilterState(newFilter);
      fetchNotifications(1, newFilter);
    },
    [fetchNotifications]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await api.notifications.markAsRead(id);
      } catch {
        // Fallback: re-sync
        refreshUnreadCount();
      }
    },
    [refreshUnreadCount]
  );

  const markAsUnread = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: false, readAt: null } : item))
      );
      setUnreadCount((prev) => prev + 1);

      try {
        await api.notifications.markAsUnread(id);
      } catch {
        // Fallback: re-sync
        refreshUnreadCount();
      }
    },
    [refreshUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await api.notifications.markAllAsRead();
    } catch {
      // Fallback: re-sync
      refreshUnreadCount();
    }
  }, [refreshUnreadCount]);

  const deleteNotification = useCallback(
    async (id: string) => {
      const itemToDelete = notifications.find((n) => n._id === id);
      const wasUnread = itemToDelete && !itemToDelete.isRead;

      // Optimistic delete
      setNotifications((prev) => prev.filter((item) => item._id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await api.notifications.delete(id);
      } catch {
        // Fallback: re-sync
        fetchNotifications(pagination.page, filter);
      }
    },
    [notifications, pagination.page, filter, fetchNotifications]
  );

  // Sync state when auth changes
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      // Reset state on user identity change to prevent stale data leakage between sessions
      setNotifications([]);
      setUnreadCount(0);
      fetchNotifications(1, filter);
      refreshUnreadCount();
      fetchPreferences();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
    }
  }, [isAuthenticated, user?._id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        filter,
        pagination,
        preferences,
        setFilter,
        fetchNotifications,
        refreshUnreadCount,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        fetchPreferences,
        updatePreferences
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
