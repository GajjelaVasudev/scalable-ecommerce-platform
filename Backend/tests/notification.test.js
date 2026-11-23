const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { Notification, NOTIFICATION_CATEGORIES } = require('../src/models/notification.model');
const NotificationPreference = require('../src/models/notificationPreference.model');
const { sendNotification, isNotificationEnabled, CATEGORY_DEFAULT_ICONS } = require('../src/services/notification.service');
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences
} = require('../src/controllers/notification.controller');

describe('OMIZON Notifications — Backend Unit & Integration Tests', () => {
    function createMockRes() {
        return {
            statusCode: 200,
            body: null,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.body = data;
                return this;
            }
        };
    }

    const userA_Id = '654321000000000000000001';
    const userB_Id = '654321000000000000000002';
    const notif1_Id = '654321000000000000000011';
    const notif2_Id = '654321000000000000000012';

    // -------------------------------------------------------------------------
    // 1. Models & Constants Conformance
    // -------------------------------------------------------------------------
    test('1.1 should define valid notification categories matching Stitch specifications', () => {
        assert.ok(Array.isArray(NOTIFICATION_CATEGORIES));
        assert.ok(NOTIFICATION_CATEGORIES.includes('orders'));
        assert.ok(NOTIFICATION_CATEGORIES.includes('payments'));
        assert.ok(NOTIFICATION_CATEGORIES.includes('delivery'));
        assert.ok(NOTIFICATION_CATEGORIES.includes('returns'));
        assert.ok(NOTIFICATION_CATEGORIES.includes('offers'));
        assert.ok(NOTIFICATION_CATEGORIES.includes('account'));
        assert.ok(NOTIFICATION_CATEGORIES.includes('system'));
    });

    test('1.2 should have proper default icons for each category', () => {
        assert.equal(CATEGORY_DEFAULT_ICONS.orders, 'shopping_bag');
        assert.equal(CATEGORY_DEFAULT_ICONS.payments, 'payments');
        assert.equal(CATEGORY_DEFAULT_ICONS.delivery, 'local_shipping');
        assert.equal(CATEGORY_DEFAULT_ICONS.returns, 'assignment_return');
        assert.equal(CATEGORY_DEFAULT_ICONS.offers, 'sell');
        assert.equal(CATEGORY_DEFAULT_ICONS.account, 'manage_accounts');
        assert.equal(CATEGORY_DEFAULT_ICONS.system, 'notifications');
    });

    test('1.3 Notification model validates required fields', () => {
        const notif = new Notification({});
        const err = notif.validateSync();
        assert.ok(err);
        assert.ok(err.errors.user);
        assert.ok(err.errors.title);
        assert.ok(err.errors.message);
    });

    test('1.4 NotificationPreference model has default values matching Stitch specifications', () => {
        const pref = new NotificationPreference({ user: userA_Id });
        assert.equal(pref.orderConfirmation, true);
        assert.equal(pref.paymentUpdates, true);
        assert.equal(pref.shippingUpdates, true);
        assert.equal(pref.deliveryUpdates, true);
        assert.equal(pref.cancellationUpdates, true);
        assert.equal(pref.returnStatus, true);
        assert.equal(pref.refundStatus, true);
        assert.equal(pref.priceDropAlerts, true);
        assert.equal(pref.backInStockAlerts, true);
        assert.equal(pref.promotionalOffers, false);
        assert.equal(pref.profileChanges, true);
        assert.equal(pref.securityAlerts, true);
        assert.equal(pref.inApp, true);
        assert.equal(pref.email, true);
        assert.equal(pref.push, false);
    });

    test('1.5 Pre-hooks safely transform null, empty, or whitespace dedupeKey into undefined to preserve sparse index', () => {
        const notifNull = new Notification({
            user: userA_Id,
            title: 'Test Null',
            message: 'Testing null dedupeKey',
            dedupeKey: null
        });
        notifNull.validateSync();
        assert.strictEqual(notifNull.dedupeKey, undefined);

        const notifEmpty = new Notification({
            user: userA_Id,
            title: 'Test Empty',
            message: 'Testing empty dedupeKey',
            dedupeKey: '   '
        });
        notifEmpty.validateSync();
        assert.strictEqual(notifEmpty.dedupeKey, undefined);

        const notifValid = new Notification({
            user: userA_Id,
            title: 'Test Valid',
            message: 'Testing valid dedupeKey',
            dedupeKey: 'order_123_confirmed'
        });
        notifValid.validateSync();
        assert.strictEqual(notifValid.dedupeKey, 'order_123_confirmed');
    });

    // -------------------------------------------------------------------------
    // 2. Notification Service & Preference Checks
    // -------------------------------------------------------------------------
    describe('Notification Service', () => {
        const originalPrefFindOne = NotificationPreference.findOne;
        const originalNotifFindOneAndUpdate = Notification.findOneAndUpdate;
        const originalNotifCreate = Notification.create;

        after(() => {
            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalNotifFindOneAndUpdate;
            Notification.create = originalNotifCreate;
        });

        test('2.1 sendNotification creates notification with defaults', async () => {
            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, orderConfirmation: true })
            });

            let createdPayload = null;
            Notification.create = async (payload) => {
                createdPayload = payload;
                return { _id: notif1_Id, ...payload };
            };

            const notif = await sendNotification({
                userId: userA_Id,
                category: 'orders',
                title: 'Order confirmed',
                message: 'Your order #OMZ-101 has been confirmed.',
                actionUrl: '/account/orders'
            });

            assert.ok(notif);
            assert.equal(createdPayload.category, 'orders');
            assert.equal(createdPayload.icon, 'shopping_bag');
            assert.equal(createdPayload.title, 'Order confirmed');
            assert.equal(createdPayload.user, userA_Id);
        });

        test('2.2 sendNotification respects inApp channel toggle', async () => {
            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: false, orderConfirmation: true })
            });

            let created = false;
            Notification.create = async () => {
                created = true;
                return {};
            };

            const notif = await sendNotification({
                userId: userA_Id,
                category: 'orders',
                title: 'Order confirmed',
                message: 'Test message',
                prefKey: 'orderConfirmation'
            });

            assert.equal(notif, null);
            assert.equal(created, false);
        });

        test('2.3 sendNotification respects specific preference toggle', async () => {
            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, promotionalOffers: false })
            });

            let created = false;
            Notification.create = async () => {
                created = true;
                return {};
            };

            const notif = await sendNotification({
                userId: userA_Id,
                category: 'offers',
                title: 'Exclusive Weekend Sale',
                message: 'Save 20% on accessories',
                prefKey: 'promotionalOffers'
            });

            assert.equal(notif, null);
            assert.equal(created, false);
        });

        test('2.4 sendNotification deduplicates via dedupeKey using findOneAndUpdate upsert', async () => {
            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, orderConfirmation: true })
            });

            let upsertFilter = null;
            let upsertUpdate = null;
            let upsertOptions = null;

            Notification.findOneAndUpdate = async (filter, update, options) => {
                upsertFilter = filter;
                upsertUpdate = update;
                upsertOptions = options;
                return {
                    _id: notif1_Id,
                    dedupeKey: filter.dedupeKey,
                    ...update.$setOnInsert
                };
            };

            const result = await sendNotification({
                userId: userA_Id,
                category: 'orders',
                title: 'Order confirmed',
                message: 'Your order #OMZ-101 has been confirmed.',
                dedupeKey: 'order_confirmed_101',
                prefKey: 'orderConfirmation'
            });

            assert.ok(result);
            assert.equal(upsertFilter.dedupeKey, 'order_confirmed_101');
            assert.equal(upsertOptions.upsert, true);
            assert.equal(upsertUpdate.$setOnInsert.isRead, false);
        });
    });

    // -------------------------------------------------------------------------
    // 3. Controller Actions (getNotifications, unreadCount, markRead, preferences)
    // -------------------------------------------------------------------------
    describe('Notification Controller', () => {
        const originalFind = Notification.find;
        const originalCount = Notification.countDocuments;
        const originalFindOneAndUpdate = Notification.findOneAndUpdate;
        const originalUpdateMany = Notification.updateMany;
        const originalFindOneAndDelete = Notification.findOneAndDelete;
        const originalPrefFindOneAndUpdate = NotificationPreference.findOneAndUpdate;

        after(() => {
            Notification.find = originalFind;
            Notification.countDocuments = originalCount;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;
            Notification.updateMany = originalUpdateMany;
            Notification.findOneAndDelete = originalFindOneAndDelete;
            NotificationPreference.findOneAndUpdate = originalPrefFindOneAndUpdate;
        });

        test('3.1 getNotifications returns paginated results and unreadCount', async () => {
            const mockNotifications = [
                { _id: notif1_Id, user: userA_Id, title: 'Order confirmed', category: 'orders', isRead: false },
                { _id: notif2_Id, user: userA_Id, title: 'Payment received', category: 'payments', isRead: true }
            ];

            Notification.find = (filter) => ({
                sort: () => ({
                    skip: () => ({
                        limit: () => ({
                            lean: async () => mockNotifications
                        })
                    })
                })
            });

            Notification.countDocuments = async (filter) => {
                if (filter.isRead === false) return 1;
                return 2;
            };

            const req = {
                user: { id: userA_Id },
                query: { page: '1', limit: '10' }
            };
            const res = createMockRes();

            await getNotifications(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.notifications.length, 2);
            assert.equal(res.body.pagination.totalNotifications, 2);
            assert.equal(res.body.pagination.unreadCount, 1);
            assert.equal(res.body.pagination.page, 1);
        });

        test('3.2 getNotifications filters by valid category', async () => {
            let capturedFilter = null;
            Notification.find = (filter) => {
                capturedFilter = filter;
                return {
                    sort: () => ({
                        skip: () => ({
                            limit: () => ({
                                lean: async () => []
                            })
                        })
                    })
                };
            };
            Notification.countDocuments = async () => 0;

            const req = {
                user: { id: userA_Id },
                query: { category: 'orders' }
            };
            const res = createMockRes();

            await getNotifications(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(capturedFilter.category, 'orders');
            assert.equal(capturedFilter.user, userA_Id);
        });

        test('3.3 getUnreadCount returns accurate unread count for user', async () => {
            Notification.countDocuments = async (filter) => {
                assert.equal(filter.user, userA_Id);
                assert.equal(filter.isRead, false);
                return 4;
            };

            const req = { user: { id: userA_Id } };
            const res = createMockRes();

            await getUnreadCount(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.unreadCount, 4);
        });

        test('3.4 markAsRead marks notification read and sets readAt', async () => {
            Notification.findOneAndUpdate = async (filter, update) => {
                assert.equal(filter._id, notif1_Id);
                assert.equal(filter.user, userA_Id);
                assert.equal(update.isRead, true);
                assert.ok(update.readAt instanceof Date);
                return { _id: notif1_Id, user: userA_Id, isRead: true, readAt: update.readAt };
            };

            const req = {
                user: { id: userA_Id },
                params: { id: notif1_Id }
            };
            const res = createMockRes();

            await markAsRead(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.notification.isRead, true);
        });

        test('3.5 markAsRead returns 404 when notification belongs to another user', async () => {
            Notification.findOneAndUpdate = async () => null;

            const req = {
                user: { id: userA_Id },
                params: { id: notif1_Id }
            };
            const res = createMockRes();

            await markAsRead(req, res);

            assert.equal(res.statusCode, 404);
            assert.equal(res.body.message, 'Notification not found');
        });

        test('3.6 markAsRead returns 400 for invalid ObjectId format', async () => {
            const req = {
                user: { id: userA_Id },
                params: { id: 'invalid-id' }
            };
            const res = createMockRes();

            await markAsRead(req, res);

            assert.equal(res.statusCode, 400);
            assert.equal(res.body.message, 'Invalid notification ID');
        });

        test('3.7 markAsUnread marks notification as unread with readAt null', async () => {
            Notification.findOneAndUpdate = async (filter, update) => {
                assert.equal(update.isRead, false);
                assert.equal(update.readAt, null);
                return { _id: notif1_Id, isRead: false, readAt: null };
            };

            const req = {
                user: { id: userA_Id },
                params: { id: notif1_Id }
            };
            const res = createMockRes();

            await markAsUnread(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.notification.isRead, false);
        });

        test('3.8 markAllAsRead updates all unread notifications for user', async () => {
            Notification.updateMany = async (filter, update) => {
                assert.equal(filter.user, userA_Id);
                assert.equal(filter.isRead, false);
                assert.equal(update.isRead, true);
                return { modifiedCount: 5 };
            };

            const req = { user: { id: userA_Id } };
            const res = createMockRes();

            await markAllAsRead(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.modifiedCount, 5);
        });

        test('3.9 deleteNotification removes notification for user', async () => {
            Notification.findOneAndDelete = async (filter) => {
                assert.equal(filter._id, notif1_Id);
                assert.equal(filter.user, userA_Id);
                return { _id: notif1_Id };
            };

            const req = {
                user: { id: userA_Id },
                params: { id: notif1_Id }
            };
            const res = createMockRes();

            await deleteNotification(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.message, 'Notification dismissed successfully');
        });

        test('3.10 getPreferences returns user preferences (upserting default)', async () => {
            NotificationPreference.findOneAndUpdate = () => ({
                lean: async () => ({
                    user: userA_Id,
                    orderConfirmation: true,
                    inApp: true,
                    email: true,
                    push: false
                })
            });

            const req = { user: { id: userA_Id } };
            const res = createMockRes();

            await getPreferences(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.preferences.inApp, true);
            assert.equal(res.body.preferences.push, false);
        });

        test('3.11 updatePreferences updates allowed boolean fields', async () => {
            let capturedUpdate = null;
            NotificationPreference.findOneAndUpdate = (filter, update) => {
                capturedUpdate = update;
                return {
                    lean: async () => ({
                        user: userA_Id,
                        inApp: false,
                        push: true,
                        orderConfirmation: true
                    })
                };
            };

            const req = {
                user: { id: userA_Id },
                body: {
                    inApp: false,
                    push: true,
                    maliciousField: 'exploit',
                    notABool: 'true'
                }
            };
            const res = createMockRes();

            await updatePreferences(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(capturedUpdate.$set.inApp, false);
            assert.equal(capturedUpdate.$set.push, true);
            assert.equal(capturedUpdate.$set.maliciousField, undefined);
            assert.equal(capturedUpdate.$set.notABool, undefined);
        });
    });

    // -------------------------------------------------------------------------
    // 4. Marketplace Event Triggers & Webhook Boundary Tests
    // -------------------------------------------------------------------------
    describe('Marketplace Event Triggers', () => {
        test('4.1 sendNotification creates order confirmed event with proper dedupeKey and prefKey', async () => {
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, orderConfirmation: true })
            });

            let upsertFilter = null;
            let insertData = null;
            Notification.findOneAndUpdate = async (filter, update) => {
                upsertFilter = filter;
                insertData = update.$setOnInsert;
                return { _id: notif1_Id, ...insertData };
            };

            const notif = await sendNotification({
                userId: userA_Id,
                category: 'orders',
                title: 'Order confirmed',
                message: 'Your order #OMZ-10245 has been confirmed.',
                icon: 'shopping_bag',
                actionUrl: '/account/orders',
                actionLabel: 'View order',
                dedupeKey: 'order_confirmed_654321000000000000000099',
                prefKey: 'orderConfirmation',
                metadata: { orderId: '654321000000000000000099' }
            });

            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            assert.ok(notif);
            assert.equal(upsertFilter.dedupeKey, 'order_confirmed_654321000000000000000099');
            assert.equal(insertData.category, 'orders');
            assert.equal(insertData.icon, 'shopping_bag');
            assert.equal(insertData.actionLabel, 'View order');
        });

        test('4.2 sendNotification handles order cancelled and delivery status transitions', async () => {
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, shippingUpdates: true, deliveryUpdates: true })
            });

            const emittedKeys = [];
            Notification.findOneAndUpdate = async (filter) => {
                emittedKeys.push(filter.dedupeKey);
                return { _id: notif1_Id, dedupeKey: filter.dedupeKey };
            };

            await sendNotification({
                userId: userA_Id,
                category: 'delivery',
                title: 'Order shipped',
                message: 'Your package is on its way.',
                dedupeKey: 'order_shipped_654321000000000000000099',
                prefKey: 'shippingUpdates'
            });

            await sendNotification({
                userId: userA_Id,
                category: 'orders',
                title: 'Order delivered',
                message: 'Your package was delivered successfully.',
                dedupeKey: 'order_delivered_654321000000000000000099',
                prefKey: 'deliveryUpdates'
            });

            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            assert.equal(emittedKeys.length, 2);
            assert.ok(emittedKeys.includes('order_shipped_654321000000000000000099'));
            assert.ok(emittedKeys.includes('order_delivered_654321000000000000000099'));
        });

        test('4.3 sendNotification suppresses event when specific preference is disabled', async () => {
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, shippingUpdates: false })
            });

            let called = false;
            Notification.findOneAndUpdate = async () => {
                called = true;
                return {};
            };

            const result = await sendNotification({
                userId: userA_Id,
                category: 'delivery',
                title: 'Order shipped',
                message: 'Your package is on its way.',
                dedupeKey: 'order_shipped_99',
                prefKey: 'shippingUpdates'
            });

            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            assert.strictEqual(result, null);
            assert.strictEqual(called, false);
        });

        test('4.4 sendNotification fails safely on DB errors without throwing to caller', async () => {
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalCreate = Notification.create;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true })
            });

            Notification.create = async () => {
                throw new Error('Simulated database disconnection');
            };

            // Must NOT throw
            const result = await sendNotification({
                userId: userA_Id,
                category: 'orders',
                title: 'Order confirmed',
                message: 'Order was placed'
            });

            NotificationPreference.findOne = originalPrefFindOne;
            Notification.create = originalCreate;

            assert.strictEqual(result, null);
        });
    });

    // -------------------------------------------------------------------------
    // 5. Return Event Deduplication & Lifecycle Regression Tests
    // -------------------------------------------------------------------------
    describe('Return Event Deduplication & Lifecycle', () => {
        const Order = require('../src/models/order.model');
        const { requestReturn } = require('../src/controllers/order.controller');

        test('5.1 Return requested creates one notification with distinct return_requested key', async () => {
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, returnStatus: true })
            });

            let savedDedupeKey = null;
            let savedCategory = null;
            let savedTitle = null;

            Notification.findOneAndUpdate = async (filter, update) => {
                savedDedupeKey = filter.dedupeKey;
                savedCategory = update.$setOnInsert.category;
                savedTitle = update.$setOnInsert.title;
                return { _id: notif1_Id, dedupeKey: filter.dedupeKey, ...update.$setOnInsert };
            };

            const orderId = '654321000000000000000999';
            const notif = await sendNotification({
                userId: userA_Id,
                category: 'returns',
                title: 'Return requested',
                message: 'Your return request has been received.',
                dedupeKey: `return_requested_${orderId}`,
                prefKey: 'returnStatus',
                metadata: { orderId }
            });

            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            assert.ok(notif);
            assert.equal(savedDedupeKey, `return_requested_${orderId}`);
            assert.equal(savedCategory, 'returns');
            assert.equal(savedTitle, 'Return requested');
        });

        test('5.2 Return approved creates a separate notification with distinct return_approved key', async () => {
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, returnStatus: true })
            });

            let savedDedupeKey = null;
            let savedCategory = null;
            let savedTitle = null;

            Notification.findOneAndUpdate = async (filter, update) => {
                savedDedupeKey = filter.dedupeKey;
                savedCategory = update.$setOnInsert.category;
                savedTitle = update.$setOnInsert.title;
                return { _id: notif2_Id, dedupeKey: filter.dedupeKey, ...update.$setOnInsert };
            };

            const orderId = '654321000000000000000999';
            const notif = await sendNotification({
                userId: userA_Id,
                category: 'returns',
                title: 'Return approved',
                message: 'Your return request has been approved.',
                dedupeKey: `return_approved_${orderId}`,
                prefKey: 'returnStatus',
                metadata: { orderId }
            });

            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            assert.ok(notif);
            assert.equal(savedDedupeKey, `return_approved_${orderId}`);
            assert.notEqual(savedDedupeKey, `return_requested_${orderId}`);
            assert.equal(savedCategory, 'returns');
            assert.equal(savedTitle, 'Return approved');
        });

        test('5.3 Repeated return requested does not create duplicates (idempotent)', async () => {
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, returnStatus: true })
            });

            let callCount = 0;
            const databaseStore = new Map();

            Notification.findOneAndUpdate = async (filter, update) => {
                callCount++;
                const key = filter.dedupeKey;
                if (!databaseStore.has(key)) {
                    databaseStore.set(key, { _id: notif1_Id, dedupeKey: key, ...update.$setOnInsert });
                }
                return databaseStore.get(key);
            };

            const orderId = '654321000000000000000999';
            const key = `return_requested_${orderId}`;

            // First emission
            const notif1 = await sendNotification({
                userId: userA_Id,
                category: 'returns',
                title: 'Return requested',
                message: 'First attempt',
                dedupeKey: key,
                prefKey: 'returnStatus'
            });

            // Duplicate emission
            const notif2 = await sendNotification({
                userId: userA_Id,
                category: 'returns',
                title: 'Return requested',
                message: 'Second duplicate attempt',
                dedupeKey: key,
                prefKey: 'returnStatus'
            });

            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            assert.equal(callCount, 2);
            assert.equal(databaseStore.size, 1, 'Store must only contain exactly one document for the dedupe key');
            assert.equal(notif1._id, notif2._id);
            assert.equal(notif1.dedupeKey, key);
        });

        test('5.4 Repeated return approved does not create duplicates (idempotent)', async () => {
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, returnStatus: true })
            });

            let callCount = 0;
            const databaseStore = new Map();

            Notification.findOneAndUpdate = async (filter, update) => {
                callCount++;
                const key = filter.dedupeKey;
                if (!databaseStore.has(key)) {
                    databaseStore.set(key, { _id: notif2_Id, dedupeKey: key, ...update.$setOnInsert });
                }
                return databaseStore.get(key);
            };

            const orderId = '654321000000000000000999';
            const key = `return_approved_${orderId}`;

            // First emission
            const notif1 = await sendNotification({
                userId: userA_Id,
                category: 'returns',
                title: 'Return approved',
                message: 'Approved notice',
                dedupeKey: key,
                prefKey: 'returnStatus'
            });

            // Duplicate emission
            const notif2 = await sendNotification({
                userId: userA_Id,
                category: 'returns',
                title: 'Return approved',
                message: 'Duplicate approved notice',
                dedupeKey: key,
                prefKey: 'returnStatus'
            });

            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            assert.equal(callCount, 2);
            assert.equal(databaseStore.size, 1);
            assert.equal(notif1._id, notif2._id);
            assert.equal(notif1.dedupeKey, key);
        });

        test('5.5 Refund processed remains a separate notification with order_refund key', async () => {
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, returnStatus: true, refundStatus: true })
            });

            const notificationsMap = new Map();

            Notification.findOneAndUpdate = async (filter, update) => {
                const doc = { _id: `id_${filter.dedupeKey}`, dedupeKey: filter.dedupeKey, ...update.$setOnInsert };
                notificationsMap.set(filter.dedupeKey, doc);
                return doc;
            };

            const orderId = '654321000000000000000999';

            await sendNotification({
                userId: userA_Id,
                category: 'returns',
                title: 'Return requested',
                message: 'Your return request has been submitted.',
                dedupeKey: `return_requested_${orderId}`,
                prefKey: 'returnStatus'
            });

            await sendNotification({
                userId: userA_Id,
                category: 'returns',
                title: 'Return approved',
                message: 'Your return request has been approved.',
                dedupeKey: `return_approved_${orderId}`,
                prefKey: 'returnStatus'
            });

            await sendNotification({
                userId: userA_Id,
                category: 'returns',
                title: 'Refund pending',
                message: 'Your refund of ₹999 is awaiting processing.',
                dedupeKey: `order_refund_${orderId}`,
                prefKey: 'refundStatus'
            });

            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            // All three must exist separately without overwriting or colliding
            assert.equal(notificationsMap.size, 3);
            assert.ok(notificationsMap.has(`return_requested_${orderId}`));
            assert.ok(notificationsMap.has(`return_approved_${orderId}`));
            assert.ok(notificationsMap.has(`order_refund_${orderId}`));
        });

        test('5.6 Failed return operations do not create notifications', async () => {
            const originalOrderFindById = Order.findById;
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, returnStatus: true, refundStatus: true })
            });

            let notifCreated = false;
            Notification.findOneAndUpdate = async () => {
                notifCreated = true;
                return {};
            };

            // Test 1: Invalid order ID
            const res1 = createMockRes();
            await requestReturn({ params: { id: 'invalid-hex-id' }, body: {}, user: { id: userA_Id, role: 'buyer' } }, res1);
            assert.equal(res1.statusCode, 400);
            assert.equal(notifCreated, false, 'No notification on invalid order ID');

            // Test 2: Order not found
            Order.findById = async () => null;
            const res2 = createMockRes();
            const orderId = '654321000000000000000888';
            await requestReturn({ params: { id: orderId }, body: {}, user: { id: userA_Id, role: 'buyer' } }, res2);
            assert.equal(res2.statusCode, 404);
            assert.equal(notifCreated, false, 'No notification on order not found');

            // Test 3: Unauthorized user (not owner and not admin)
            Order.findById = async () => ({
                _id: orderId,
                user: userB_Id, // owned by user B
                deliveryStatus: 'delivered'
            });
            const res3 = createMockRes();
            await requestReturn({ params: { id: orderId }, body: {}, user: { id: userA_Id, role: 'buyer' } }, res3);
            assert.equal(res3.statusCode, 403);
            assert.equal(notifCreated, false, 'No notification when unauthorized');

            // Test 4: Order not delivered (cannot return pending / shipped)
            Order.findById = async () => ({
                _id: orderId,
                user: userA_Id,
                deliveryStatus: 'shipped' // not delivered yet
            });
            const res4 = createMockRes();
            await requestReturn({ params: { id: orderId }, body: {}, user: { id: userA_Id, role: 'buyer' } }, res4);
            assert.equal(res4.statusCode, 400);
            assert.equal(notifCreated, false, 'No notification when order not delivered');

            // Test 5: Order save failure
            Order.findById = async () => ({
                _id: orderId,
                user: userA_Id,
                deliveryStatus: 'delivered',
                save: async () => {
                    throw new Error('Database write error');
                }
            });
            const res5 = createMockRes();
            await requestReturn({ params: { id: orderId }, body: {}, user: { id: userA_Id, role: 'buyer' } }, res5);
            assert.equal(res5.statusCode, 500);
            assert.equal(notifCreated, false, 'No notification when database save fails');

            Order.findById = originalOrderFindById;
            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;
        });

        test('5.7 Successful return request in requestReturn controller verifies genuine state transitions and triggers distinct requested, approved and refund notifications', async () => {
            const originalOrderFindById = Order.findById;
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, returnStatus: true, refundStatus: true })
            });

            const emittedNotifications = [];
            Notification.findOneAndUpdate = async (filter, update) => {
                emittedNotifications.push({
                    dedupeKey: filter.dedupeKey,
                    title: update.$setOnInsert.title,
                    message: update.$setOnInsert.message
                });
                return { _id: notif1_Id, dedupeKey: filter.dedupeKey, ...update.$setOnInsert };
            };

            const orderId = '654321000000000000000777';
            let savedOrder = false;
            const mockOrder = {
                _id: orderId,
                user: { _id: userA_Id },
                deliveryStatus: 'delivered',
                paymentStatus: 'paid',
                refundStatus: 'none',
                paymentMethod: 'UPI',
                refundAmount: 0,
                totalAmount: 1499,
                trackingNumber: 'FX-IN-9876543',
                save: async function() {
                    savedOrder = true;
                }
            };

            Order.findById = async () => mockOrder;

            const res = createMockRes();
            await requestReturn({
                params: { id: orderId },
                body: { reason: 'Wrong size delivered' },
                user: { id: userA_Id, role: 'buyer' }
            }, res);

            // Verify genuine business state transitions in MongoDB order document
            assert.equal(res.statusCode, 200);
            assert.equal(savedOrder, true, 'Order document must be persisted to the database');
            assert.equal(mockOrder.deliveryStatus, 'returned', 'Order delivery status transitioned from delivered to returned');
            assert.equal(mockOrder.refundStatus, 'pending', 'Refund status accurately set to pending instead of falsely marking completed');
            assert.equal(mockOrder.refundAmount, 1499, 'Refund amount matches total order amount');
            assert.equal(mockOrder.returnReason, 'Wrong size delivered', 'Return reason persisted to order document');

            // Give any microtasks / async fire-and-forget a tick
            await new Promise((r) => setImmediate(r));

            Order.findById = originalOrderFindById;
            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            const dedupeKeys = emittedNotifications.map(n => n.dedupeKey);
            assert.ok(dedupeKeys.includes(`return_requested_${orderId}`), 'Emits return_requested dedupe key');
            assert.ok(dedupeKeys.includes(`return_approved_${orderId}`), 'Emits return_approved dedupe key');
            assert.ok(dedupeKeys.includes(`order_refund_${orderId}`), 'Emits order_refund dedupe key');
            assert.ok(!dedupeKeys.includes(`order_return_${orderId}`), 'Does NOT use old ambiguous order_return key');

            const refundNotif = emittedNotifications.find(n => n.dedupeKey === `order_refund_${orderId}`);
            assert.equal(refundNotif.title, 'Refund pending');
            assert.match(refundNotif.message, /awaiting processing/i);
            assert.match(refundNotif.message, /notify you when it has been completed/i);
            assert.doesNotMatch(refundNotif.message, /razorpay|initiated to your original payment method|has been refunded/i);
        });

        test('5.8 Admin/seller updateOrderStatus to returned emits only return_approved notification', async () => {
            const originalOrderFindById = Order.findById;
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;
            const { updateOrderStatus } = require('../src/controllers/order.controller');

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, returnStatus: true, refundStatus: true })
            });

            const emittedNotifications = [];
            Notification.findOneAndUpdate = async (filter, update) => {
                emittedNotifications.push({
                    dedupeKey: filter.dedupeKey,
                    title: update.$setOnInsert.title,
                    message: update.$setOnInsert.message
                });
                return { _id: notif1_Id, dedupeKey: filter.dedupeKey, ...update.$setOnInsert };
            };

            const orderId = '654321000000000000000666';
            let savedOrder = false;
            const mockOrder = {
                _id: orderId,
                user: { _id: userA_Id },
                deliveryStatus: 'delivered',
                paymentStatus: 'paid',
                trackingNumber: 'FX-IN-1234567',
                save: async function() {
                    savedOrder = true;
                }
            };
            Order.findById = async () => mockOrder;

            const res = createMockRes();
            await updateOrderStatus({
                params: { id: orderId },
                body: { deliveryStatus: 'returned' },
                user: { id: 'admin_123', role: 'admin' }
            }, res);

            assert.equal(res.statusCode, 200);
            assert.equal(savedOrder, true);
            assert.equal(mockOrder.deliveryStatus, 'returned');

            await new Promise((r) => setImmediate(r));

            Order.findById = originalOrderFindById;
            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            // In admin/seller updateOrderStatus workflow, ONLY return_approved is emitted
            const dedupeKeys = emittedNotifications.map(n => n.dedupeKey);
            assert.equal(dedupeKeys.length, 1);
            assert.equal(dedupeKeys[0], `return_approved_${orderId}`);
        });

        test('5.9 Cash on Delivery (COD) returns are handled separately without claiming false online refund', async () => {
            const originalOrderFindById = Order.findById;
            const originalPrefFindOne = NotificationPreference.findOne;
            const originalFindOneAndUpdate = Notification.findOneAndUpdate;

            NotificationPreference.findOne = () => ({
                lean: async () => ({ inApp: true, returnStatus: true, refundStatus: true })
            });

            const emittedNotifications = [];
            Notification.findOneAndUpdate = async (filter, update) => {
                emittedNotifications.push({
                    dedupeKey: filter.dedupeKey,
                    title: update.$setOnInsert.title,
                    message: update.$setOnInsert.message
                });
                return { _id: notif1_Id, dedupeKey: filter.dedupeKey, ...update.$setOnInsert };
            };

            const orderId = '654321000000000000000555';
            const mockCODOrder = {
                _id: orderId,
                user: { _id: userA_Id },
                deliveryStatus: 'delivered',
                paymentStatus: 'paid',
                paymentMethod: 'COD',
                refundStatus: 'none',
                totalAmount: 2499,
                trackingNumber: 'FX-IN-5555555',
                save: async function() {}
            };
            Order.findById = async () => mockCODOrder;

            const res = createMockRes();
            await requestReturn({
                params: { id: orderId },
                body: { reason: 'Defective item' },
                user: { id: userA_Id, role: 'buyer' }
            }, res);

            assert.equal(res.statusCode, 200);
            assert.match(res.body.message, /bank transfer/i);

            await new Promise((r) => setImmediate(r));

            Order.findById = originalOrderFindById;
            NotificationPreference.findOne = originalPrefFindOne;
            Notification.findOneAndUpdate = originalFindOneAndUpdate;

            const refundNotif = emittedNotifications.find(n => n.dedupeKey === `order_refund_${orderId}`);
            assert.ok(refundNotif);
            assert.equal(refundNotif.title, 'Refund pending inspection');
            assert.equal(refundNotif.message, 'Your return has been approved. Your refund will be processed via bank transfer after the returned item passes inspection.');
        });

        test('5.10 Duplicate return requests on already returned or refund-pending orders are blocked with 400', async () => {
            const originalOrderFindById = Order.findById;

            // Scenario A: Order already marked returned
            const orderIdA = '654321000000000000000444';
            Order.findById = async () => ({
                _id: orderIdA,
                user: { _id: userA_Id },
                deliveryStatus: 'returned',
                refundStatus: 'pending'
            });

            const resA = createMockRes();
            await requestReturn({
                params: { id: orderIdA },
                body: { reason: 'Duplicate attempt' },
                user: { id: userA_Id, role: 'buyer' }
            }, resA);

            assert.equal(resA.statusCode, 400);

            // Scenario B: Order delivered but refund already pending
            const orderIdB = '654321000000000000000445';
            Order.findById = async () => ({
                _id: orderIdB,
                user: { _id: userA_Id },
                deliveryStatus: 'delivered',
                refundStatus: 'pending'
            });

            const resB = createMockRes();
            await requestReturn({
                params: { id: orderIdB },
                body: { reason: 'Duplicate attempt' },
                user: { id: userA_Id, role: 'buyer' }
            }, resB);

            Order.findById = originalOrderFindById;

            assert.equal(resB.statusCode, 400);
            assert.match(resB.body.message, /already been processed/i);
        });
    });
});
