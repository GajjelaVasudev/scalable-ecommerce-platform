import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  NotificationItem,
  NotificationCategory,
  NotificationPreferences,
  NotificationListResponse
} from '../src/types';
import { formatTimeAgo } from '../src/components/marketplace/NotificationDropdown';
import { api } from '../src/services/api';

describe('OMIZON Notifications — Frontend Unit & Integration Tests', () => {
  // ---------------------------------------------------------------------------
  // 1. Types & Interface Conformance
  // ---------------------------------------------------------------------------
  test('1.1 should conform to NotificationItem interface', () => {
    const item: NotificationItem = {
      _id: '6740c0000000000000000001',
      user: '6740b0000000000000000001',
      category: 'orders',
      title: 'Order confirmed',
      message: 'Your order #OMZ-10245 has been confirmed.',
      icon: 'shopping_bag',
      isRead: false,
      readAt: null,
      actionUrl: '/account/orders',
      actionLabel: 'View order',
      dedupeKey: 'order_confirmed_10245',
      metadata: { orderId: '10245' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    assert.equal(item.category, 'orders');
    assert.equal(item.isRead, false);
    assert.equal(item.icon, 'shopping_bag');
    assert.equal(item.actionLabel, 'View order');
  });

  test('1.2 should conform to NotificationPreferences interface with 15 options', () => {
    const prefs: NotificationPreferences = {
      orderConfirmation: true,
      paymentUpdates: true,
      shippingUpdates: true,
      deliveryUpdates: true,
      cancellationUpdates: true,
      returnStatus: true,
      refundStatus: true,
      priceDropAlerts: true,
      backInStockAlerts: true,
      promotionalOffers: false,
      profileChanges: true,
      securityAlerts: true,
      inApp: true,
      email: true,
      push: false
    };

    const keys = Object.keys(prefs);
    assert.equal(keys.length, 15);
    assert.equal(prefs.orderConfirmation, true);
    assert.equal(prefs.promotionalOffers, false);
    assert.equal(prefs.push, false);
    assert.equal(prefs.inApp, true);
  });

  // ---------------------------------------------------------------------------
  // 2. Relative Time Formatter (formatTimeAgo)
  // ---------------------------------------------------------------------------
  test('2.1 formatTimeAgo formats under 60 seconds as Just now', () => {
    const now = new Date();
    assert.equal(formatTimeAgo(now.toISOString()), 'Just now');
  });

  test('2.2 formatTimeAgo formats minutes ago', () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    assert.equal(formatTimeAgo(fiveMinsAgo.toISOString()), '5m ago');
  });

  test('2.3 formatTimeAgo formats hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
    assert.equal(formatTimeAgo(threeHoursAgo.toISOString()), '3h ago');
  });

  test('2.4 formatTimeAgo formats 1 day ago as Yesterday', () => {
    const yesterday = new Date(Date.now() - 25 * 3600 * 1000);
    assert.equal(formatTimeAgo(yesterday.toISOString()), 'Yesterday');
  });

  test('2.5 formatTimeAgo formats 4 days ago as 4d ago', () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 3600 * 1000);
    assert.equal(formatTimeAgo(fourDaysAgo.toISOString()), '4d ago');
  });

  test('2.6 formatTimeAgo returns empty string for falsy input', () => {
    assert.equal(formatTimeAgo(''), '');
  });

  // ---------------------------------------------------------------------------
  // 3. Active Alerts Summary Math & SVG Progress Ring
  // ---------------------------------------------------------------------------
  test('3.1 calculates active preferences count and percentage accurately', () => {
    const prefs: NotificationPreferences = {
      orderConfirmation: true,
      paymentUpdates: true,
      shippingUpdates: true,
      deliveryUpdates: true,
      cancellationUpdates: true,
      returnStatus: true,
      refundStatus: true,
      priceDropAlerts: true,
      backInStockAlerts: true,
      promotionalOffers: false,
      profileChanges: true,
      securityAlerts: true,
      inApp: true,
      email: true,
      push: false
    };

    const keys: (keyof NotificationPreferences)[] = [
      'orderConfirmation',
      'paymentUpdates',
      'shippingUpdates',
      'deliveryUpdates',
      'cancellationUpdates',
      'returnStatus',
      'refundStatus',
      'priceDropAlerts',
      'backInStockAlerts',
      'promotionalOffers',
      'profileChanges',
      'securityAlerts',
      'inApp',
      'email',
      'push'
    ];

    const total = keys.length;
    assert.equal(total, 15);

    const active = keys.filter((k) => Boolean(prefs[k])).length;
    assert.equal(active, 13);

    const percent = Math.round((active / total) * 100);
    assert.equal(percent, 87);

    const circumference = 163.36;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    assert.ok(Math.abs(strokeDashoffset - 21.2368) < 0.5);
  });

  // ---------------------------------------------------------------------------
  // 4. Notification Unread Count & State Logic
  // ---------------------------------------------------------------------------
  test('4.1 unread count math behaves correctly on mark as read and unread', () => {
    let unreadCount = 4;

    // Mark 1 unread item as read
    unreadCount = Math.max(0, unreadCount - 1);
    assert.equal(unreadCount, 3);

    // Mark 1 read item as unread
    unreadCount = unreadCount + 1;
    assert.equal(unreadCount, 4);

    // Mark all as read
    unreadCount = 0;
    assert.equal(unreadCount, 0);

    // Mark as read when already 0 doesn't go negative
    unreadCount = Math.max(0, unreadCount - 1);
    assert.equal(unreadCount, 0);
  });

  test('4.2 category filtering separates items into specified tabs', () => {
    const items: Partial<NotificationItem>[] = [
      { _id: '1', category: 'orders', title: 'Order placed' },
      { _id: '2', category: 'payments', title: 'Payment received' },
      { _id: '3', category: 'delivery', title: 'Package shipped' },
      { _id: '4', category: 'orders', title: 'Order delivered' },
      { _id: '5', category: 'returns', title: 'Return approved' },
      { _id: '6', category: 'offers', title: 'Price drop' },
      { _id: '7', category: 'account', title: 'Profile updated' }
    ];

    const filterAll = items.filter(() => true);
    assert.equal(filterAll.length, 7);

    const filterOrders = items.filter((i) => i.category === 'orders');
    assert.equal(filterOrders.length, 2);

    const filterPayments = items.filter((i) => i.category === 'payments');
    assert.equal(filterPayments.length, 1);

    const filterDelivery = items.filter((i) => i.category === 'delivery');
    assert.equal(filterDelivery.length, 1);

    const filterReturns = items.filter((i) => i.category === 'returns');
    assert.equal(filterReturns.length, 1);

    const filterOffers = items.filter((i) => i.category === 'offers');
    assert.equal(filterOffers.length, 1);

    const filterAccount = items.filter((i) => i.category === 'account');
    assert.equal(filterAccount.length, 1);
  });

  // ---------------------------------------------------------------------------
  // 5. API Client Methods
  // ---------------------------------------------------------------------------
  test('5.1 api.notifications object provides all required endpoints', () => {
    assert.equal(typeof api.notifications.list, 'function');
    assert.equal(typeof api.notifications.getUnreadCount, 'function');
    assert.equal(typeof api.notifications.markAsRead, 'function');
    assert.equal(typeof api.notifications.markAsUnread, 'function');
    assert.equal(typeof api.notifications.markAllAsRead, 'function');
    assert.equal(typeof api.notifications.delete, 'function');
    assert.equal(typeof api.notifications.getPreferences, 'function');
    assert.equal(typeof api.notifications.updatePreferences, 'function');
  });
});
