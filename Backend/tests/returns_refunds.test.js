const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const returnService = require('../src/services/return.service');
const refundService = require('../src/services/refund.service');
const paymentService = require('../src/services/payment.service');
const ReturnRequest = require('../src/models/returnRequest.model');
const Order = require('../src/models/order.model');
const Product = require('../src/models/product.model');
const Payment = require('../src/models/payment.model');
const Inventory = require('../src/models/inventory.model');
const NotificationPreference = require('../src/models/notificationPreference.model');
const { Notification } = require('../src/models/notification.model');

test('OMIZON Returns & Refunds — Backend Unit & Integration Tests', async (t) => {
    const userA_Id = '654321000000000000000001';
    const userB_Id = '654321000000000000000002';
    const sellerA_Id = '654321000000000000000010';
    const sellerB_Id = '654321000000000000000020';
    const admin_Id = '654321000000000000000099';
    const prodA_Id = '654321000000000000000101';
    const prodB_Id = '654321000000000000000102';
    const order1_Id = '654321000000000000000201';

    NotificationPreference.findOne = () => ({
        lean: async () => ({ inApp: true, returnStatus: true, refundStatus: true })
    });
    Notification.findOneAndUpdate = async () => ({ _id: new mongoose.Types.ObjectId() });
    Order.findByIdAndUpdate = async () => ({});

    await t.test('1. Eligibility Calculation & Policy Checks', async (t2) => {
        await t2.test('1.1 Rejects return eligibility if order is not delivered', async () => {
            const orderPending = {
                _id: order1_Id,
                deliveryStatus: 'shipped',
                items: [{ product: prodA_Id, name: 'Headphones', quantity: 1, price: 1000 }]
            };
            const result = await returnService.calculateOrderReturnEligibility(orderPending);
            assert.equal(result.isEligible, false);
            assert.match(result.reason, /not delivered/i);
        });

        await t2.test('1.2 Calculates eligible quantity based on previous active returns', async () => {
            const originalFind = ReturnRequest.find;
            // Mock existing return of 1 item
            ReturnRequest.find = () => ({
                lean: async () => [
                    {
                        order: order1_Id,
                        status: 'under_review',
                        items: [{ product: prodA_Id, variant: 'default', quantity: 1 }]
                    }
                ]
            });

            const deliveredOrder = {
                _id: order1_Id,
                deliveryStatus: 'delivered',
                createdAt: new Date(),
                updatedAt: new Date(),
                items: [
                    { product: prodA_Id, name: 'Headphones', variant: 'default', quantity: 3, price: 1000 }
                ]
            };

            const result = await returnService.calculateOrderReturnEligibility(deliveredOrder);
            ReturnRequest.find = originalFind;

            assert.equal(result.isEligible, true);
            assert.equal(result.items[0].purchasedQuantity, 3);
            assert.equal(result.items[0].alreadyReturnedQuantity, 1);
            assert.equal(result.items[0].eligibleQuantity, 2);
        });

        await t2.test('1.3 Marks item ineligible when all units are already returned', async () => {
            const originalFind = ReturnRequest.find;
            ReturnRequest.find = () => ({
                lean: async () => [
                    {
                        order: order1_Id,
                        status: 'approved',
                        items: [{ product: prodA_Id, variant: 'default', quantity: 2 }]
                    }
                ]
            });

            const deliveredOrder = {
                _id: order1_Id,
                deliveryStatus: 'delivered',
                createdAt: new Date(),
                updatedAt: new Date(),
                items: [
                    { product: prodA_Id, name: 'Headphones', variant: 'default', quantity: 2, price: 1000 }
                ]
            };

            const result = await returnService.calculateOrderReturnEligibility(deliveredOrder);
            ReturnRequest.find = originalFind;

            assert.equal(result.isEligible, false);
            assert.equal(result.items[0].eligibleQuantity, 0);
            assert.equal(result.items[0].isEligible, false);
        });
    });

    await t.test('2. Multi-Vendor Order Return Scoping', async (t2) => {
        await t2.test('2.1 Splits multi-vendor order items into separate ReturnRequests per seller', async () => {
            const originalOrderFind = Order.findById;
            const originalReturnFind = ReturnRequest.find;
            const savedReturns = [];

            const mockProductA = { _id: prodA_Id, name: 'Aura Headphones', price: 5000, seller: sellerA_Id, image: 'imgA.jpg' };
            const mockProductB = { _id: prodB_Id, name: 'Ceramic Carafe', price: 2000, seller: sellerB_Id, image: 'imgB.jpg' };

            const mockOrder = {
                _id: order1_Id,
                user: { _id: userA_Id },
                deliveryStatus: 'delivered',
                paymentMethod: 'UPI',
                totalAmount: 7000,
                updatedAt: new Date(),
                items: [
                    { product: mockProductA, name: 'Aura Headphones', variant: 'default', quantity: 1, price: 5000 },
                    { product: mockProductB, name: 'Ceramic Carafe', variant: 'default', quantity: 1, price: 2000 }
                ],
                shippingAddress: { fullName: 'Priya Sharma', phone: '9876543210', city: 'Mumbai' },
                save: async () => {}
            };

            Order.findById = () => ({
                populate: async () => mockOrder
            });
            ReturnRequest.find = () => ({
                lean: async () => []
            });

            // Mock ReturnRequest constructor / save
            const originalSave = ReturnRequest.prototype.save;
            ReturnRequest.prototype.save = async function() {
                savedReturns.push(this);
                return this;
            };

            const result = await returnService.createReturnRequest({
                user: { id: userA_Id, role: 'buyer' },
                orderId: order1_Id,
                items: [
                    { product: prodA_Id, variant: 'default', quantity: 1, reason: 'DEFECTIVE_DAMAGED', evidenceImages: ['https://example.com/dmg.jpg'] },
                    { product: prodB_Id, variant: 'default', quantity: 1, reason: 'NOT_AS_DESCRIBED' }
                ],
                customerNotes: 'Issue with both items'
            });

            Order.findById = originalOrderFind;
            ReturnRequest.find = originalReturnFind;
            ReturnRequest.prototype.save = originalSave;

            assert.equal(result.length, 2, 'Must create 2 ReturnRequests (one per seller)');
            const sellerIds = result.map(r => String(r.seller));
            assert.ok(sellerIds.includes(sellerA_Id), 'Includes Seller A');
            assert.ok(sellerIds.includes(sellerB_Id), 'Includes Seller B');
            assert.notEqual(result[0].rmaNumber, result[1].rmaNumber, 'Each seller receives distinct RMA number');
        });

        await t2.test('2.2 Rejects return creation when user is not the order owner', async () => {
            const originalOrderFind = Order.findById;
            Order.findById = () => ({
                populate: async () => ({
                    _id: order1_Id,
                    user: { _id: userA_Id },
                    deliveryStatus: 'delivered',
                    items: []
                })
            });

            await assert.rejects(
                async () => {
                    await returnService.createReturnRequest({
                        user: { id: userB_Id, role: 'buyer' },
                        orderId: order1_Id,
                        items: [{ product: prodA_Id, quantity: 1 }]
                    });
                },
                /Forbidden/i
            );

            Order.findById = originalOrderFind;
        });
    });

    await t.test('3. Seller Ownership & Quality Inspection with Restocking', async (t2) => {
        await t2.test('3.1 Seller A cannot review or inspect return assigned to Seller B', async () => {
            const originalReturnFind = ReturnRequest.findById;
            ReturnRequest.findById = async () => ({
                _id: '654321000000000000000301',
                seller: sellerB_Id,
                status: 'requested'
            });

            await assert.rejects(
                async () => {
                    await returnService.sellerReviewReturn({
                        sellerId: sellerA_Id,
                        returnId: '654321000000000000000301',
                        action: 'approve'
                    });
                },
                /Forbidden/i
            );

            ReturnRequest.findById = originalReturnFind;
        });

        await t2.test('3.2 Quality inspection restocks inventory for passed items and protects against duplicate restock', async () => {
            const originalReturnFind = ReturnRequest.findById;
            const originalInventoryUpdate = Inventory.findOneAndUpdate;
            const originalProductUpdate = Product.findByIdAndUpdate;

            let inventoryRestockedCount = 0;
            let productStockIncrement = 0;

            Inventory.findOneAndUpdate = async (filter, update) => {
                inventoryRestockedCount += update.$inc['variants.$.availableStock'];
                return {};
            };

            Product.findByIdAndUpdate = async (id, update) => {
                productStockIncrement += update.$inc.stock;
                return {};
            };

            const mockReturnDoc = {
                _id: '654321000000000000000301',
                seller: sellerA_Id,
                customer: userA_Id,
                rmaNumber: 'RMA-20261123-TEST01',
                status: 'received',
                refundDetails: { status: 'none' },
                statusHistory: [],
                items: [
                    {
                        _id: '654321000000000000000401',
                        product: prodA_Id,
                        variant: 'Midnight Violet',
                        quantity: 2,
                        inspection: { condition: 'uninspected', disposition: 'pending' }
                    }
                ],
                save: async function() { return this; }
            };
            mockReturnDoc.items.id = (id) => mockReturnDoc.items[0];

            ReturnRequest.findById = async () => mockReturnDoc;

            // First inspection: passes and restocks 2 units
            await returnService.performReturnInspection({
                actor: { id: sellerA_Id, role: 'seller' },
                returnId: '654321000000000000000301',
                itemsInspection: [
                    {
                        itemId: '654321000000000000000401',
                        condition: 'passed_resellable',
                        disposition: 'restocked',
                        notes: 'Box opened but product factory new'
                    }
                ]
            });

            assert.equal(inventoryRestockedCount, 2, 'Restocked 2 units to inventory');
            assert.equal(productStockIncrement, 2, 'Incremented product stock by 2');
            assert.equal(mockReturnDoc.items[0].inspection.disposition, 'restocked');

            // Duplicate inspection call: disposition already 'restocked', must NOT double restock
            await returnService.performReturnInspection({
                actor: { id: sellerA_Id, role: 'seller' },
                returnId: '654321000000000000000301',
                itemsInspection: [
                    {
                        itemId: '654321000000000000000401',
                        condition: 'passed_resellable',
                        disposition: 'restocked'
                    }
                ]
            });

            assert.equal(inventoryRestockedCount, 2, 'Duplicate restock prevented: count remains 2');
            assert.equal(productStockIncrement, 2, 'Duplicate product stock increment prevented');

            ReturnRequest.findById = originalReturnFind;
            Inventory.findOneAndUpdate = originalInventoryUpdate;
            Product.findByIdAndUpdate = originalProductUpdate;
        });

        await t2.test('3.3 Damaged item does NOT replenish sellable inventory', async () => {
            const originalReturnFind = ReturnRequest.findById;
            const originalInventoryUpdate = Inventory.findOneAndUpdate;

            let inventoryRestocked = false;
            Inventory.findOneAndUpdate = async () => {
                inventoryRestocked = true;
            };

            const mockReturnDoc = {
                _id: '654321000000000000000302',
                seller: sellerA_Id,
                customer: userA_Id,
                rmaNumber: 'RMA-20261123-TEST02',
                status: 'received',
                refundDetails: { status: 'none' },
                statusHistory: [],
                items: [
                    {
                        _id: '654321000000000000000402',
                        product: prodA_Id,
                        variant: 'default',
                        quantity: 1,
                        inspection: { condition: 'uninspected', disposition: 'pending' }
                    }
                ],
                save: async function() { return this; }
            };
            mockReturnDoc.items.id = (id) => mockReturnDoc.items[0];

            ReturnRequest.findById = async () => mockReturnDoc;

            await returnService.performReturnInspection({
                actor: { id: sellerA_Id, role: 'seller' },
                returnId: '654321000000000000000302',
                itemsInspection: [
                    {
                        itemId: '654321000000000000000402',
                        condition: 'damaged_unsellable',
                        disposition: 'scrapped',
                        notes: 'Broken internal driver'
                    }
                ]
            });

            assert.equal(inventoryRestocked, false, 'Damaged items must never be restocked into inventory');
            assert.equal(mockReturnDoc.items[0].inspection.disposition, 'scrapped');

            ReturnRequest.findById = originalReturnFind;
            Inventory.findOneAndUpdate = originalInventoryUpdate;
        });

        await t2.test('3.4 Seller can retrieve their return record and customer COD bank details are sanitized', async () => {
            const originalFindById = ReturnRequest.findById;
            const mockReturnDoc = {
                _id: '654321000000000000000302',
                customer: userA_Id,
                seller: sellerA_Id,
                status: 'requested',
                refundMethod: {
                    type: 'COD_BANK_TRANSFER',
                    codBankDetails: {
                        accountHolderName: 'Customer A',
                        accountNumberMasked: '••••1234',
                        ifsc: 'HDFC0001234'
                    }
                }
            };

            ReturnRequest.findById = () => ({
                populate: () => ({
                    populate: () => ({
                        populate: () => ({
                            lean: async () => JSON.parse(JSON.stringify(mockReturnDoc))
                        })
                    })
                })
            });

            // Seller A can view
            const sellerView = await returnService.getCustomerReturnById({
                user: { id: sellerA_Id, role: 'seller' },
                returnId: '654321000000000000000302'
            });
            assert.equal(sellerView._id, '654321000000000000000302');
            assert.equal(sellerView.refundMethod.codBankDetails, undefined, 'Sellers must never receive customer bank details');

            // Unrelated Seller B receives 403 Forbidden
            await assert.rejects(
                async () => {
                    await returnService.getCustomerReturnById({
                        user: { id: sellerB_Id, role: 'seller' },
                        returnId: '654321000000000000000302'
                    });
                },
                /Forbidden/i
            );

            ReturnRequest.findById = originalFindById;
        });

        await t2.test('3.5 Logistics update is rejected if return is cancelled or rejected', async () => {
            const originalFind = ReturnRequest.findById;
            const mockCancelled = {
                _id: '654321000000000000000302',
                seller: sellerA_Id,
                status: 'cancelled',
                pickupDetails: {}
            };
            ReturnRequest.findById = async () => mockCancelled;

            await assert.rejects(
                async () => {
                    await returnService.updateReturnLogistics({
                        actor: { id: sellerA_Id, role: 'seller' },
                        returnId: '654321000000000000000302',
                        status: 'in_transit'
                    });
                },
                /Cannot update logistics for a cancelled return request/i
            );

            ReturnRequest.findById = originalFind;
        });

        await t2.test('3.6 Quality inspection is rejected if parcel has not been received at warehouse', async () => {
            const originalFind = ReturnRequest.findById;
            const mockInTransit = {
                _id: '654321000000000000000302',
                seller: sellerA_Id,
                status: 'in_transit'
            };
            ReturnRequest.findById = async () => mockInTransit;

            await assert.rejects(
                async () => {
                    await returnService.performReturnInspection({
                        actor: { id: sellerA_Id, role: 'seller' },
                        returnId: '654321000000000000000302',
                        itemsInspection: [{ itemId: '654321000000000000000402', condition: 'passed_resellable' }]
                    });
                },
                /Parcel must be received first/i
            );

            ReturnRequest.findById = originalFind;
        });
    });

    await t.test('4. Razorpay & COD Refund Processing', async (t2) => {
        await t2.test('4.1 Razorpay refund calls gateway, stores refund ID, and updates payment record', async () => {
            const originalReturnFind = ReturnRequest.findById;
            const originalPaymentFind = Payment.findOne;
            const originalRefundCall = paymentService.createRazorpayRefund;

            const mockPayment = {
                _id: '654321000000000000000501',
                order: order1_Id,
                amount: 5000,
                refundAmount: 0,
                refunds: [],
                status: 'paid',
                providerPaymentId: 'pay_OMIZON_TEST_999',
                save: async function() { return this; }
            };

            const mockReturn = {
                _id: '654321000000000000000303',
                rmaNumber: 'RMA-20261123-REF01',
                order: { _id: order1_Id },
                customer: userA_Id,
                totalRefundAmount: 5000,
                status: 'inspected',
                refundMethod: { type: 'ORIGINAL_GATEWAY' },
                refundDetails: { status: 'pending', amount: 5000 },
                statusHistory: [],
                save: async function() { return this; }
            };

            ReturnRequest.findById = () => ({
                populate: async () => mockReturn
            });
            Payment.findOne = async () => mockPayment;
            ReturnRequest.find = async () => [mockReturn];

            paymentService.setRazorpayClient({
                payments: {
                    refund: async (payId, opts) => ({
                        id: 'rfnd_OMIZON_RF_777',
                        amount: opts.amount,
                        currency: 'INR',
                        status: 'processed'
                    })
                }
            });

            const result = await refundService.initiateGatewayRefund({
                returnRequestId: '654321000000000000000303',
                adminUser: { id: admin_Id, role: 'admin' }
            });

            assert.equal(result.gatewayRefund.id, 'rfnd_OMIZON_RF_777');
            assert.equal(mockReturn.refundDetails.gatewayRefundId, 'rfnd_OMIZON_RF_777');
            assert.equal(mockReturn.refundDetails.status, 'completed');
            assert.equal(mockReturn.status, 'completed');
            assert.equal(mockPayment.refundAmount, 5000);
            assert.equal(mockPayment.status, 'refunded');

            ReturnRequest.findById = originalReturnFind;
            Payment.findOne = originalPaymentFind;
        });

        await t2.test('4.2 Rejects refund amount exceeding captured payment balance', async () => {
            const originalReturnFind = ReturnRequest.findById;
            const originalPaymentFind = Payment.findOne;

            const mockPayment = {
                _id: '654321000000000000000502',
                order: order1_Id,
                amount: 3000,
                refundAmount: 2500, // Only 500 remaining
                status: 'paid',
                providerPaymentId: 'pay_OMIZON_TEST_500'
            };

            const mockReturn = {
                _id: '654321000000000000000304',
                rmaNumber: 'RMA-20261123-REF02',
                order: { _id: order1_Id },
                totalRefundAmount: 1000, // Demands 1000
                refundMethod: { type: 'ORIGINAL_GATEWAY' },
                refundDetails: { status: 'pending', amount: 1000 },
                statusHistory: [],
                save: async function() { return this; }
            };

            ReturnRequest.findById = () => ({
                populate: async () => mockReturn
            });
            Payment.findOne = async () => mockPayment;

            await assert.rejects(
                async () => {
                    await refundService.initiateGatewayRefund({
                        returnRequestId: '654321000000000000000304',
                        adminUser: { id: admin_Id, role: 'admin' }
                    });
                },
                /exceeds maximum refundable balance/i
            );

            ReturnRequest.findById = originalReturnFind;
            Payment.findOne = originalPaymentFind;
        });

        await t2.test('4.3 Confirms COD bank transfer with UTR and marks status completed', async () => {
            const originalReturnFind = ReturnRequest.findById;
            const mockReturn = {
                _id: '654321000000000000000305',
                rmaNumber: 'RMA-20261123-COD01',
                order: order1_Id,
                customer: userA_Id,
                totalRefundAmount: 2500,
                status: 'inspected',
                refundMethod: { type: 'COD_BANK_TRANSFER' },
                refundDetails: { status: 'pending', amount: 2500 },
                statusHistory: [],
                save: async function() { return this; }
            };

            ReturnRequest.findById = async () => mockReturn;
            ReturnRequest.find = async () => [mockReturn];

            const updated = await refundService.confirmCODBankTransfer({
                returnRequestId: '654321000000000000000305',
                adminUser: { id: admin_Id, role: 'admin' },
                bankReferenceNumber: 'UTR-HDFC-9988776655',
                notes: 'Transferred via RTGS'
            });

            assert.equal(updated.refundDetails.status, 'completed');
            assert.equal(updated.refundDetails.bankReferenceNumber, 'UTR-HDFC-9988776655');
            assert.equal(updated.status, 'completed');

            ReturnRequest.findById = originalReturnFind;
        });

        await t2.test('4.4 Rejects duplicate in-flight gateway refund when status is processing or completed', async () => {
            const originalReturnFind = ReturnRequest.findById;
            const mockReturn = {
                _id: '654321000000000000000304',
                totalRefundAmount: 1000,
                refundMethod: { type: 'ORIGINAL_GATEWAY' },
                refundDetails: { status: 'processing', amount: 1000 }
            };

            ReturnRequest.findById = () => ({
                populate: async () => mockReturn
            });

            await assert.rejects(
                async () => {
                    await refundService.initiateGatewayRefund({
                        returnRequestId: '654321000000000000000304',
                        adminUser: { id: admin_Id, role: 'admin' }
                    });
                },
                /Refund is already in 'processing' state/i
            );

            ReturnRequest.findById = originalReturnFind;
        });
    });

    await t.test('5. Dispute Resolution Workflow', async (t2) => {
        await t2.test('5.1 Buyer can raise dispute and Admin can uphold buyer and mark refund pending', async () => {
            const originalReturnFind = ReturnRequest.findById;
            const mockReturn = {
                _id: '654321000000000000000306',
                rmaNumber: 'RMA-20261123-DISP01',
                customer: userA_Id,
                seller: sellerA_Id,
                status: 'rejected',
                refundDetails: { status: 'failed' },
                disputeDetails: {},
                statusHistory: [],
                save: async function() { return this; }
            };

            ReturnRequest.findById = async () => mockReturn;

            // Buyer raises dispute
            await returnService.raiseReturnDispute({
                user: { id: userA_Id, role: 'buyer' },
                returnId: '654321000000000000000306',
                reason: 'Seller unjustly rejected return of defective item',
                evidence: ['https://example.com/proof.jpg']
            });

            assert.equal(mockReturn.status, 'disputed');
            assert.equal(mockReturn.disputeDetails.isDisputed, true);

            // Admin resolves dispute in buyer's favor
            await returnService.resolveReturnDispute({
                adminUser: { id: admin_Id, role: 'admin' },
                returnId: '654321000000000000000306',
                decision: 'upheld_buyer',
                adminNotes: 'Inspection photo confirms defect was present upon arrival'
            });

            assert.equal(mockReturn.status, 'approved');
            assert.equal(mockReturn.refundDetails.status, 'pending');
            assert.equal(mockReturn.disputeDetails.adminDecision, 'upheld_buyer');

            ReturnRequest.findById = originalReturnFind;
        });

        await t2.test('5.2 Dispute cannot be raised on a cancelled return', async () => {
            const originalReturnFind = ReturnRequest.findById;
            const mockCancelledReturn = {
                _id: '654321000000000000000306',
                customer: userA_Id,
                seller: sellerA_Id,
                status: 'cancelled'
            };
            ReturnRequest.findById = async () => mockCancelledReturn;

            await assert.rejects(
                async () => {
                    await returnService.raiseReturnDispute({
                        user: { id: userA_Id, role: 'buyer' },
                        returnId: '654321000000000000000306',
                        reason: 'Want to dispute after cancellation'
                    });
                },
                /Cannot dispute a cancelled return request/i
            );

            ReturnRequest.findById = originalReturnFind;
        });
    });
});
