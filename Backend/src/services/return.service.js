const crypto = require('crypto');
const mongoose = require('mongoose');

const ReturnRequest = require('../models/returnRequest.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Payment = require('../models/payment.model');
const Inventory = require('../models/inventory.model');
const { sendNotification } = require('./notification.service');
const {
    DEFAULT_RETURN_WINDOW_DAYS,
    VALID_RETURN_REASONS,
    VALID_RETURN_STATUSES,
    VALID_INSPECTION_CONDITIONS,
    VALID_DISPOSITIONS
} = require('../config/returnPolicy.config');

/**
 * Generates unique human-readable RMA Number (e.g., RMA-20261123-A7F2BC)
 */
function generateRMANumber() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `RMA-${dateStr}-${randomHex}`;
}

/**
 * Calculates return eligibility for an order and all its items.
 */
async function calculateOrderReturnEligibility(order) {
    if (!order) {
        return { isEligible: false, reason: 'Order not found', items: [] };
    }

    if (order.deliveryStatus !== 'delivered' && order.deliveryStatus !== 'returned') {
        return {
            isEligible: false,
            reason: `Order is not delivered (current status: ${order.deliveryStatus})`,
            deliveryDate: null,
            deadline: null,
            items: (order.items || []).map(item => ({
                product: item.product,
                name: item.name,
                variant: item.variant,
                price: item.price,
                purchasedQuantity: item.quantity,
                eligibleQuantity: 0,
                isEligible: false,
                reason: 'Order must be delivered to be eligible for return'
            }))
        };
    }

    // Determine delivery date and deadline
    const deliveryDate = order.updatedAt || order.createdAt;
    const windowDays = DEFAULT_RETURN_WINDOW_DAYS;
    const returnDeadline = new Date(deliveryDate.getTime() + windowDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const isWindowExpired = now > returnDeadline;

    // Fetch existing active return requests for this order to compute already returned quantities
    const existingReturns = await ReturnRequest.find({
        order: order._id,
        status: { $nin: ['cancelled', 'rejected'] }
    }).lean();

    const returnedQuantities = new Map(); // key: `${productId}:${variant}` -> count
    for (const ret of existingReturns) {
        for (const it of ret.items) {
            const key = `${String(it.product)}:${it.variant || 'default'}`;
            returnedQuantities.set(key, (returnedQuantities.get(key) || 0) + it.quantity);
        }
    }

    // Inspect each item
    let anyEligible = false;
    const itemEligibility = [];

    for (const item of order.items) {
        const prodId = item.product?._id ? String(item.product._id) : String(item.product);
        const variant = item.variant || 'default';
        const key = `${prodId}:${variant}`;
        const alreadyReturned = returnedQuantities.get(key) || 0;
        const remaining = Math.max(0, item.quantity - alreadyReturned);

        let itemEligible = remaining > 0 && !isWindowExpired;
        let itemReason = '';

        if (isWindowExpired) {
            itemReason = `Return window of ${windowDays} days expired on ${returnDeadline.toLocaleDateString('en-IN')}`;
        } else if (remaining === 0) {
            itemReason = 'All purchased units for this item have already been returned or requested';
        }

        if (itemEligible) {
            anyEligible = true;
        }

        itemEligibility.push({
            product: item.product,
            name: item.name,
            variant,
            price: item.price,
            purchasedQuantity: item.quantity,
            alreadyReturnedQuantity: alreadyReturned,
            eligibleQuantity: remaining,
            isEligible: itemEligible,
            reason: itemReason
        });
    }

    return {
        isEligible: anyEligible && !isWindowExpired,
        reason: isWindowExpired
            ? `Return window of ${windowDays} days expired on ${returnDeadline.toLocaleDateString('en-IN')}`
            : (anyEligible ? 'Eligible for return' : 'No items remain eligible for return'),
        deliveryDate,
        returnDeadline,
        windowDays,
        items: itemEligibility
    };
}

/**
 * Creates one or more ReturnRequests for an order (multi-vendor aware).
 * If items belong to different sellers, each seller receives a distinct ReturnRequest.
 */
async function createReturnRequest({
    user,
    orderId,
    items,
    pickupAddress,
    pickupInstructions,
    refundMethod,
    codBankDetails,
    customerNotes
}) {
    if (!mongoose.isValidObjectId(orderId)) {
        const err = new Error('Invalid order ID');
        err.statusCode = 400;
        throw err;
    }

    if (!Array.isArray(items) || items.length === 0) {
        const err = new Error('At least one item must be selected for return');
        err.statusCode = 400;
        throw err;
    }

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
    }

    // Customer or Admin authorization check
    const orderUserId = order.user ? (order.user._id ? order.user._id.toString() : order.user.toString()) : null;
    if (user.role !== 'admin' && orderUserId !== user.id) {
        const err = new Error('Forbidden: you can only request returns for your own orders');
        err.statusCode = 403;
        throw err;
    }

    // Eligibility check
    const eligibility = await calculateOrderReturnEligibility(order);
    if (!eligibility.isEligible) {
        const err = new Error(`Order is not eligible for return: ${eligibility.reason}`);
        err.statusCode = 400;
        throw err;
    }

    // Map order items by productId:variant for rapid validation
    const orderItemMap = new Map();
    for (const it of order.items) {
        const pId = it.product?._id ? String(it.product._id) : String(it.product);
        const variant = it.variant || 'default';
        orderItemMap.set(`${pId}:${variant}`, it);
    }

    // Map eligible quantities
    const eligibleQtyMap = new Map();
    for (const it of eligibility.items) {
        const pId = it.product?._id ? String(it.product._id) : String(it.product);
        const variant = it.variant || 'default';
        eligibleQtyMap.set(`${pId}:${variant}`, it.eligibleQuantity);
    }

    // Group items by Seller to support multi-vendor orders cleanly
    const itemsBySeller = new Map(); // sellerId -> array of item payload

    for (const reqItem of items) {
        const prodId = String(reqItem.productId || reqItem.product);
        const variant = reqItem.variant || 'default';
        const key = `${prodId}:${variant}`;

        const matchedOrderItem = orderItemMap.get(key);
        if (!matchedOrderItem) {
            const err = new Error(`Product ${prodId} (variant: ${variant}) is not part of this order`);
            err.statusCode = 400;
            throw err;
        }

        const eligibleQty = eligibleQtyMap.get(key) || 0;
        const reqQty = Number(reqItem.quantity);
        if (!Number.isInteger(reqQty) || reqQty <= 0) {
            const err = new Error(`Invalid quantity ${reqQty} for item ${matchedOrderItem.name}`);
            err.statusCode = 400;
            throw err;
        }

        if (reqQty > eligibleQty) {
            const err = new Error(
                `Requested quantity (${reqQty}) exceeds eligible quantity (${eligibleQty}) for ${matchedOrderItem.name}`
            );
            err.statusCode = 400;
            throw err;
        }

        // Validate reason
        const reasonObj = VALID_RETURN_REASONS.find(r => r.code === reqItem.reason || r.label === reqItem.reason);
        const reasonText = reasonObj ? reasonObj.label : (reqItem.reason || 'Other');

        if (reasonObj && reasonObj.requiresEvidence) {
            const evidence = Array.isArray(reqItem.evidenceImages) ? reqItem.evidenceImages : [];
            if (evidence.length === 0) {
                const err = new Error(`Photo evidence is required for reason: "${reasonText}"`);
                err.statusCode = 400;
                throw err;
            }
        }

        // Determine seller of the product
        const productDoc = matchedOrderItem.product;
        const sellerId = productDoc?.seller
            ? (productDoc.seller._id ? String(productDoc.seller._id) : String(productDoc.seller))
            : String(user.id); // Fallback if no seller

        if (!itemsBySeller.has(sellerId)) {
            itemsBySeller.set(sellerId, []);
        }

        itemsBySeller.get(sellerId).push({
            product: productDoc?._id || matchedOrderItem.product,
            name: matchedOrderItem.name,
            variant,
            image: productDoc?.image || matchedOrderItem.image || '',
            price: matchedOrderItem.price,
            quantity: reqQty,
            reason: reasonText,
            customerNotes: reqItem.customerNotes || customerNotes || '',
            evidenceImages: reqItem.evidenceImages || []
        });
    }

    // Determine refund method
    const isCOD = order.paymentMethod === 'COD';
    let chosenRefundMethod = refundMethod;
    if (!chosenRefundMethod) {
        chosenRefundMethod = isCOD ? 'COD_BANK_TRANSFER' : 'ORIGINAL_GATEWAY';
    }

    let maskedAccount = '';
    let encryptedAccount = '';
    if (isCOD && codBankDetails) {
        const rawAcc = String(codBankDetails.accountNumber || '').trim();
        if (rawAcc.length >= 4) {
            maskedAccount = '•'.repeat(Math.max(0, rawAcc.length - 4)) + rawAcc.slice(-4);
        } else {
            maskedAccount = rawAcc;
        }
        encryptedAccount = rawAcc; // Stored securely with select: false in schema
    }

    // Determine pickup address (use user supplied or fallback to order shipping address)
    const orderAddress = order.shippingAddress || {};
    const effectivePickupAddress = {
        fullName: pickupAddress?.fullName || orderAddress.fullName || '',
        phone: pickupAddress?.phone || orderAddress.phone || '',
        addressLine: pickupAddress?.addressLine || orderAddress.addressLine || '',
        city: pickupAddress?.city || orderAddress.city || '',
        state: pickupAddress?.state || orderAddress.state || '',
        postalCode: pickupAddress?.postalCode || orderAddress.postalCode || '',
        country: pickupAddress?.country || orderAddress.country || 'India'
    };

    const createdReturns = [];

    // Create a ReturnRequest for each seller slice
    for (const [sellerId, sellerItems] of itemsBySeller.entries()) {
        const rmaNumber = generateRMANumber();
        const sellerTotalRefund = sellerItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);

        const newReturn = new ReturnRequest({
            rmaNumber,
            order: order._id,
            customer: order.user ? (order.user._id || order.user) : user.id,
            seller: sellerId,
            items: sellerItems,
            totalRefundAmount: sellerTotalRefund,
            status: 'requested',
            pickupDetails: {
                address: effectivePickupAddress,
                scheduledDate: null,
                carrier: 'OMIZON Express Reverse Logistics',
                trackingNumber: '',
                pickupInstructions: pickupInstructions || ''
            },
            refundMethod: {
                type: chosenRefundMethod,
                paymentMethod: order.paymentMethod || 'UPI',
                codBankDetails: isCOD ? {
                    accountHolderName: codBankDetails?.accountHolderName || '',
                    accountNumberMasked: maskedAccount,
                    accountNumberEncrypted: encryptedAccount,
                    ifsc: codBankDetails?.ifsc || '',
                    bankName: codBankDetails?.bankName || '',
                    upiId: codBankDetails?.upiId || ''
                } : {}
            },
            refundDetails: {
                status: 'pending',
                amount: sellerTotalRefund,
                gatewayRefundId: null,
                bankReferenceNumber: null
            },
            statusHistory: [
                {
                    status: 'requested',
                    changedBy: user.id,
                    role: 'buyer',
                    note: `Return request submitted by customer for ${sellerItems.length} item(s)`,
                    timestamp: new Date()
                }
            ]
        });

        await newReturn.save();
        createdReturns.push(newReturn);

        // Emit notifications (customer & seller)
        if (order.user) {
            const customerId = order.user._id || order.user;
            sendNotification({
                userId: customerId,
                category: 'returns',
                title: 'Return requested',
                message: `Your return request (${rmaNumber}) for order #${order.trackingNumber || order._id} has been received.`,
                icon: 'assignment_return',
                actionUrl: `/account/returns/${newReturn._id}`,
                actionLabel: 'Track return',
                dedupeKey: `return_requested_${newReturn._id}`,
                prefKey: 'returnStatus',
                metadata: { returnId: newReturn._id, rmaNumber, orderId: order._id }
            }).catch(() => {});
        }

        // Notify seller
        sendNotification({
            userId: sellerId,
            category: 'returns',
            title: 'New return request received',
            message: `Customer requested a return (${rmaNumber}) for order #${order.trackingNumber || order._id}. Please review.`,
            icon: 'assignment_return',
            actionUrl: `/seller/returns/${newReturn._id}`,
            actionLabel: 'Review request',
            dedupeKey: `seller_return_requested_${newReturn._id}`,
            prefKey: 'returnStatus',
            metadata: { returnId: newReturn._id, rmaNumber, orderId: order._id }
        }).catch(() => {});
    }

    // Keep order deliveryStatus and refundStatus synchronized
    order.deliveryStatus = 'returned';
    order.refundStatus = 'pending';
    order.refundAmount = createdReturns.reduce((sum, r) => sum + r.totalRefundAmount, 0);
    order.returnReason = customerNotes || items[0]?.reason || 'Customer requested return';
    await order.save();

    return createdReturns;
}

/**
 * Retrieves returns for a customer with filtering and pagination.
 */
async function getCustomerReturns({ user, status, search, page = 1, limit = 10 }) {
    const query = { customer: user.id };

    if (status && status !== 'all') {
        query.status = status;
    }

    if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
            { rmaNumber: regex },
            { 'items.name': regex }
        ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [returns, total] = await Promise.all([
        ReturnRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('seller', 'name email storeName')
            .populate('order', 'totalAmount paymentMethod deliveryStatus trackingNumber createdAt')
            .lean(),
        ReturnRequest.countDocuments(query)
    ]);

    return {
        returns,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

/**
 * Retrieves a single return request by ID with customer authorization check.
 */
async function getCustomerReturnById({ user, returnId }) {
    if (!mongoose.isValidObjectId(returnId)) {
        const err = new Error('Invalid return ID');
        err.statusCode = 400;
        throw err;
    }

    const ret = await ReturnRequest.findById(returnId)
        .populate('seller', 'name email storeName')
        .populate('order')
        .populate('items.product')
        .lean();

    if (!ret) {
        const err = new Error('Return request not found');
        err.statusCode = 404;
        throw err;
    }

    const isCustomer = String(ret.customer?._id || ret.customer) === user.id;
    const isSeller = String(ret.seller?._id || ret.seller) === user.id;
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isSeller && !isAdmin) {
        const err = new Error('Forbidden: access denied to this return record');
        err.statusCode = 403;
        throw err;
    }

    // Mask/sanitize sensitive bank coordinates for sellers
    if (isSeller && !isAdmin && ret.refundMethod) {
        delete ret.refundMethod.codBankDetails;
    }

    return ret;
}

/**
 * Customer cancels an active return request (allowed in requested / under_review / approved before pickup).
 */
async function cancelCustomerReturn({ user, returnId, reason }) {
    if (!mongoose.isValidObjectId(returnId)) {
        const err = new Error('Invalid return ID');
        err.statusCode = 400;
        throw err;
    }

    const ret = await ReturnRequest.findById(returnId);
    if (!ret) {
        const err = new Error('Return request not found');
        err.statusCode = 404;
        throw err;
    }

    if (user.role !== 'admin' && String(ret.customer) !== user.id) {
        const err = new Error('Forbidden: you can only cancel your own return requests');
        err.statusCode = 403;
        throw err;
    }

    const cancellableStatuses = ['requested', 'under_review', 'approved'];
    if (!cancellableStatuses.includes(ret.status)) {
        const err = new Error(
            `Cannot cancel return in '${ret.status}' status. Package may already be picked up or in transit.`
        );
        err.statusCode = 400;
        throw err;
    }

    ret.status = 'cancelled';
    ret.refundDetails.status = 'none';
    ret.statusHistory.push({
        status: 'cancelled',
        changedBy: user.id,
        role: 'buyer',
        note: reason || 'Cancelled by customer',
        timestamp: new Date()
    });

    await ret.save();

    // Notify customer & seller
    sendNotification({
        userId: ret.customer,
        category: 'returns',
        title: 'Return cancelled',
        message: `Your return request (${ret.rmaNumber}) has been cancelled.`,
        icon: 'cancel',
        actionUrl: `/account/returns/${ret._id}`,
        actionLabel: 'View details',
        dedupeKey: `return_cancelled_${ret._id}`,
        prefKey: 'returnStatus'
    }).catch(() => {});

    sendNotification({
        userId: ret.seller,
        category: 'returns',
        title: 'Return cancelled by buyer',
        message: `Customer cancelled return request (${ret.rmaNumber}).`,
        icon: 'cancel',
        actionUrl: `/seller/returns/${ret._id}`,
        actionLabel: 'View details',
        dedupeKey: `seller_return_cancelled_${ret._id}`,
        prefKey: 'returnStatus'
    }).catch(() => {});

    return ret;
}

/**
 * Seller returns query scoped to seller ID.
 */
async function getSellerReturns({ sellerId, status, search, page = 1, limit = 10 }) {
    const query = { seller: sellerId };

    if (status && status !== 'all') {
        query.status = status;
    }

    if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
            { rmaNumber: regex },
            { 'items.name': regex }
        ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [returns, total, countsByStatus] = await Promise.all([
        ReturnRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('customer', 'name email')
            .populate('order', 'totalAmount paymentMethod deliveryStatus trackingNumber createdAt')
            .lean(),
        ReturnRequest.countDocuments(query),
        ReturnRequest.aggregate([
            { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
    ]);

    const statusCounts = {};
    for (const c of countsByStatus) {
        statusCounts[c._id] = c.count;
    }

    return {
        returns,
        counts: statusCounts,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

/**
 * Seller reviews a return request (Approve or Reject with mandatory reason).
 */
async function sellerReviewReturn({ sellerId, returnId, action, rejectionReason, note }) {
    if (!mongoose.isValidObjectId(returnId)) {
        const err = new Error('Invalid return ID');
        err.statusCode = 400;
        throw err;
    }

    const ret = await ReturnRequest.findById(returnId);
    if (!ret) {
        const err = new Error('Return request not found');
        err.statusCode = 404;
        throw err;
    }

    if (String(ret.seller) !== String(sellerId)) {
        const err = new Error('Forbidden: you can only review returns for your own merchant products');
        err.statusCode = 403;
        throw err;
    }

    if (!['requested', 'under_review'].includes(ret.status)) {
        const err = new Error(`Return is already in '${ret.status}' status and cannot be re-reviewed`);
        err.statusCode = 400;
        throw err;
    }

    if (action === 'approve') {
        ret.status = 'approved';
        ret.pickupDetails.scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next business day
        ret.pickupDetails.trackingNumber = `RET-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        ret.statusHistory.push({
            status: 'approved',
            changedBy: sellerId,
            role: 'seller',
            note: note || 'Return request approved by seller. Pickup will be scheduled.',
            timestamp: new Date()
        });

        await ret.save();

        // Notify customer
        sendNotification({
            userId: ret.customer,
            category: 'returns',
            title: 'Return approved',
            message: `Your return request (${ret.rmaNumber}) has been approved by the seller. Reverse pickup is being scheduled.`,
            icon: 'assignment_return',
            actionUrl: `/account/returns/${ret._id}`,
            actionLabel: 'Track return',
            dedupeKey: `return_approved_${ret._id}`,
            prefKey: 'returnStatus'
        }).catch(() => {});

    } else if (action === 'reject') {
        if (!rejectionReason || !rejectionReason.trim()) {
            const err = new Error('Rejection reason is mandatory when rejecting a return request');
            err.statusCode = 400;
            throw err;
        }

        ret.status = 'rejected';
        ret.rejectionReason = rejectionReason.trim();
        ret.refundDetails.status = 'failed';
        ret.refundDetails.failureReason = `Rejected by seller: ${rejectionReason.trim()}`;
        ret.statusHistory.push({
            status: 'rejected',
            changedBy: sellerId,
            role: 'seller',
            note: `Rejected: ${rejectionReason.trim()}`,
            timestamp: new Date()
        });

        await ret.save();

        // Notify customer
        sendNotification({
            userId: ret.customer,
            category: 'returns',
            title: 'Return rejected',
            message: `Your return request (${ret.rmaNumber}) was rejected: "${rejectionReason.trim()}". You may dispute this decision with admin.`,
            icon: 'cancel',
            actionUrl: `/account/returns/${ret._id}`,
            actionLabel: 'View details',
            dedupeKey: `return_rejected_${ret._id}`,
            prefKey: 'returnStatus'
        }).catch(() => {});
    } else {
        const err = new Error(`Invalid action '${action}'. Expected 'approve' or 'reject'.`);
        err.statusCode = 400;
        throw err;
    }

    return ret;
}

/**
 * Updates logistics tracking milestones (e.g. pickup_scheduled -> in_transit -> received).
 */
async function updateReturnLogistics({ actor, returnId, status, carrier, trackingNumber, note }) {
    if (!mongoose.isValidObjectId(returnId)) {
        const err = new Error('Invalid return ID');
        err.statusCode = 400;
        throw err;
    }

    const ret = await ReturnRequest.findById(returnId);
    if (!ret) {
        const err = new Error('Return request not found');
        err.statusCode = 404;
        throw err;
    }

    // Role check: seller or admin
    if (actor.role !== 'admin' && String(ret.seller) !== actor.id) {
        const err = new Error('Forbidden: unauthorized logistics update');
        err.statusCode = 403;
        throw err;
    }

    if (['rejected', 'cancelled'].includes(ret.status)) {
        const err = new Error(`Cannot update logistics for a ${ret.status} return request`);
        err.statusCode = 400;
        throw err;
    }

    const validLogisticsStatuses = ['pickup_scheduled', 'in_transit', 'received'];
    if (!validLogisticsStatuses.includes(status)) {
        const err = new Error(`Invalid logistics status '${status}'`);
        err.statusCode = 400;
        throw err;
    }

    ret.status = status;
    if (carrier) ret.pickupDetails.carrier = carrier;
    if (trackingNumber) ret.pickupDetails.trackingNumber = trackingNumber;

    ret.statusHistory.push({
        status,
        changedBy: actor.id,
        role: actor.role,
        note: note || `Logistics milestone updated to ${status}`,
        timestamp: new Date()
    });

    await ret.save();

    // Notify customer
    const titles = {
        pickup_scheduled: 'Pickup scheduled',
        in_transit: 'Return package picked up',
        received: 'Return package received at merchant facility'
    };
    sendNotification({
        userId: ret.customer,
        category: 'delivery',
        title: titles[status] || 'Return shipment updated',
        message: `Return (${ret.rmaNumber}) status updated to: ${status.replace('_', ' ')}.`,
        icon: 'local_shipping',
        actionUrl: `/account/returns/${ret._id}`,
        actionLabel: 'Track package',
        dedupeKey: `return_logistics_${status}_${ret._id}`,
        prefKey: 'returnStatus'
    }).catch(() => {});

    return ret;
}

/**
 * Performs physical inspection and controls inventory disposition.
 * Item condition passed -> triggers restock and marks refund ready.
 * Item damaged -> marks non-sellable disposition and holds restock.
 */
async function performReturnInspection({ actor, returnId, itemsInspection, generalNotes }) {
    if (!mongoose.isValidObjectId(returnId)) {
        const err = new Error('Invalid return ID');
        err.statusCode = 400;
        throw err;
    }

    const ret = await ReturnRequest.findById(returnId);
    if (!ret) {
        const err = new Error('Return request not found');
        err.statusCode = 404;
        throw err;
    }

    if (actor.role !== 'admin' && String(ret.seller) !== actor.id) {
        const err = new Error('Forbidden: only product seller or admin can perform quality inspection');
        err.statusCode = 403;
        throw err;
    }

    if (!['received', 'inspected'].includes(ret.status)) {
        const err = new Error(`Cannot perform inspection on return in '${ret.status}' status. Parcel must be received first.`);
        err.statusCode = 400;
        throw err;
    }

    if (!Array.isArray(itemsInspection) || itemsInspection.length === 0) {
        const err = new Error('Inspection details for returned items are required');
        err.statusCode = 400;
        throw err;
    }

    let allPassed = true;
    let anyDamaged = false;

    for (const insp of itemsInspection) {
        const lookupId = String(insp.itemId || insp._id || insp.orderItemId || '');
        const item = ret.items.id(lookupId) || ret.items.find(it => String(it._id) === lookupId || String(it.orderItemId) === lookupId);
        if (!item) continue;

        const condition = insp.condition || 'passed_resellable';
        const disposition = insp.disposition || (condition === 'passed_resellable' ? 'restocked' : 'scrapped');

        if (!VALID_INSPECTION_CONDITIONS.includes(condition)) {
            const err = new Error(`Invalid inspection condition '${condition}'`);
            err.statusCode = 400;
            throw err;
        }

        if (!VALID_DISPOSITIONS.includes(disposition)) {
            const err = new Error(`Invalid inventory disposition '${disposition}'`);
            err.statusCode = 400;
            throw err;
        }

        // Restocking logic: only restock if condition passed, disposition restocked, and NOT already restocked!
        if (condition === 'passed_resellable' && disposition === 'restocked') {
            if (!item.inspection?.isRestocked && item.inspection?.disposition !== 'restocked') {
                const variantName = item.variant || 'default';
                const quantity = item.quantity;

                // 1. Replenish inventory variants
                await Inventory.findOneAndUpdate(
                    {
                        product: item.product,
                        'variants.name': variantName
                    },
                    {
                        $inc: {
                            'variants.$.availableStock': quantity,
                            'variants.$.totalStock': quantity
                        }
                    }
                );

                // 2. Increment Product catalog stock
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: quantity }
                });

                item.inspection.isRestocked = true;
            }
        } else {
            allPassed = false;
            anyDamaged = true;
        }

        item.inspection.condition = condition;
        item.inspection.disposition = disposition;
        item.inspection.notes = insp.notes || '';
        item.inspection.inspectedAt = new Date();
        item.inspection.inspectedBy = actor.id;
    }

    ret.status = 'inspected';
    ret.statusHistory.push({
        status: 'inspected',
        changedBy: actor.id,
        role: actor.role,
        note: generalNotes || (allPassed ? 'Quality inspection passed. Items restocked.' : 'Quality inspection completed with damage/disposition notes.'),
        timestamp: new Date()
    });

    // If passed inspection, refund status remains pending or moves to processing
    if (allPassed) {
        ret.refundDetails.status = 'pending';
    } else if (anyDamaged) {
        // Can hold for admin review if dispute arises
        ret.refundDetails.status = 'pending';
    }

    await ret.save();

    // Notify customer
    sendNotification({
        userId: ret.customer,
        category: 'returns',
        title: 'Return inspection completed',
        message: allPassed
            ? `Your returned item(s) for ${ret.rmaNumber} passed inspection. Refund is being processed.`
            : `Inspection completed for return ${ret.rmaNumber}. Review details in your returns hub.`,
        icon: 'fact_check',
        actionUrl: `/account/returns/${ret._id}`,
        actionLabel: 'View report',
        dedupeKey: `return_inspected_${ret._id}`,
        prefKey: 'returnStatus'
    }).catch(() => {});

    return ret;
}

/**
 * Customer or Seller raises a dispute on a return request to Platform Admin.
 */
async function raiseReturnDispute({ user, returnId, reason, evidence }) {
    if (!mongoose.isValidObjectId(returnId)) {
        const err = new Error('Invalid return ID');
        err.statusCode = 400;
        throw err;
    }

    const ret = await ReturnRequest.findById(returnId);
    if (!ret) {
        const err = new Error('Return request not found');
        err.statusCode = 404;
        throw err;
    }

    const isCustomer = String(ret.customer) === user.id;
    const isSeller = String(ret.seller) === user.id;

    if (!isCustomer && !isSeller && user.role !== 'admin') {
        const err = new Error('Forbidden: you must be the customer or seller to dispute this return');
        err.statusCode = 403;
        throw err;
    }

    if (ret.status === 'cancelled') {
        const err = new Error('Cannot dispute a cancelled return request');
        err.statusCode = 400;
        throw err;
    }

    if (!reason || !reason.trim()) {
        const err = new Error('Dispute reason is required');
        err.statusCode = 400;
        throw err;
    }

    ret.status = 'disputed';
    ret.disputeDetails = {
        isDisputed: true,
        disputedBy: user.id,
        reason: reason.trim(),
        evidence: Array.isArray(evidence) ? evidence : [],
        adminDecision: 'pending',
        adminNotes: '',
        resolvedAt: null,
        resolvedBy: null
    };

    ret.statusHistory.push({
        status: 'disputed',
        changedBy: user.id,
        role: user.role,
        note: `Dispute raised by ${user.role}: ${reason.trim()}`,
        timestamp: new Date()
    });

    await ret.save();

    return ret;
}

/**
 * Admin resolves a dispute with a final binding decision and audit trail.
 */
async function resolveReturnDispute({ adminUser, returnId, decision, adminNotes, action }) {
    if (!mongoose.isValidObjectId(returnId)) {
        const err = new Error('Invalid return ID');
        err.statusCode = 400;
        throw err;
    }

    const ret = await ReturnRequest.findById(returnId);
    if (!ret) {
        const err = new Error('Return request not found');
        err.statusCode = 404;
        throw err;
    }

    const validDecisions = ['upheld_buyer', 'upheld_seller', 'settled_split'];
    if (!validDecisions.includes(decision)) {
        const err = new Error(`Invalid dispute decision '${decision}'`);
        err.statusCode = 400;
        throw err;
    }

    ret.disputeDetails.adminDecision = decision;
    ret.disputeDetails.adminNotes = adminNotes || '';
    ret.disputeDetails.resolvedAt = new Date();
    ret.disputeDetails.resolvedBy = adminUser.id;

    if (decision === 'upheld_buyer') {
        ret.status = 'approved';
        ret.refundDetails.status = 'pending';
    } else if (decision === 'upheld_seller') {
        ret.status = 'rejected';
        ret.refundDetails.status = 'failed';
        ret.refundDetails.failureReason = `Dispute settled in seller's favor: ${adminNotes}`;
    } else {
        ret.status = 'completed';
        ret.refundDetails.status = 'pending';
    }

    ret.statusHistory.push({
        status: ret.status,
        changedBy: adminUser.id,
        role: 'admin',
        note: `Dispute resolved by Admin (${decision}): ${adminNotes || 'Final resolution'}`,
        timestamp: new Date()
    });

    await ret.save();

    // Notify both parties
    sendNotification({
        userId: ret.customer,
        category: 'returns',
        title: 'Return dispute resolved',
        message: `Admin resolved dispute for RMA ${ret.rmaNumber}: ${decision.replace('_', ' ')}.`,
        icon: 'gavel',
        actionUrl: `/account/returns/${ret._id}`,
        actionLabel: 'View resolution',
        dedupeKey: `dispute_resolved_${ret._id}`,
        prefKey: 'returnStatus'
    }).catch(() => {});

    sendNotification({
        userId: ret.seller,
        category: 'returns',
        title: 'Return dispute resolved by Admin',
        message: `Admin resolved dispute for RMA ${ret.rmaNumber}: ${decision.replace('_', ' ')}.`,
        icon: 'gavel',
        actionUrl: `/seller/returns/${ret._id}`,
        actionLabel: 'View resolution',
        dedupeKey: `seller_dispute_resolved_${ret._id}`,
        prefKey: 'returnStatus'
    }).catch(() => {});

    return ret;
}

/**
 * Admin returns query with dispute and refund metrics.
 */
async function getAdminReturns({ status, disputeOnly, search, page = 1, limit = 15 }) {
    const query = {};

    if (status && status !== 'all') {
        query.status = status;
    }

    if (disputeOnly === 'true' || disputeOnly === true) {
        query['disputeDetails.isDisputed'] = true;
    }

    if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
            { rmaNumber: regex },
            { 'items.name': regex }
        ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [returns, total, stats] = await Promise.all([
        ReturnRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('customer', 'name email')
            .populate('seller', 'name email storeName')
            .populate('order', 'totalAmount paymentMethod deliveryStatus trackingNumber createdAt')
            .lean(),
        ReturnRequest.countDocuments(query),
        ReturnRequest.aggregate([
            {
                $group: {
                    _id: null,
                    totalReturns: { $sum: 1 },
                    pendingReviews: { $sum: { $cond: [{ $in: ['$status', ['requested', 'under_review']] }, 1, 0] } },
                    inTransit: { $sum: { $cond: [{ $in: ['$status', ['pickup_scheduled', 'in_transit']] }, 1, 0] } },
                    awaitingInspection: { $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] } },
                    disputes: { $sum: { $cond: [{ $eq: ['$status', 'disputed'] }, 1, 0] } },
                    refundPendingAmount: {
                        $sum: {
                            $cond: [
                                { $in: ['$refundDetails.status', ['pending', 'processing']] },
                                '$totalRefundAmount',
                                0
                            ]
                        }
                    },
                    completedRefundsAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$refundDetails.status', 'completed'] },
                                '$refundDetails.amount',
                                0
                            ]
                        }
                    }
                }
            }
        ])
    ]);

    return {
        returns,
        stats: stats[0] || {
            totalReturns: 0,
            pendingReviews: 0,
            inTransit: 0,
            awaitingInspection: 0,
            disputes: 0,
            refundPendingAmount: 0,
            completedRefundsAmount: 0
        },
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

module.exports = {
    generateRMANumber,
    calculateOrderReturnEligibility,
    createReturnRequest,
    getCustomerReturns,
    getCustomerReturnById,
    cancelCustomerReturn,
    getSellerReturns,
    sellerReviewReturn,
    updateReturnLogistics,
    performReturnInspection,
    raiseReturnDispute,
    resolveReturnDispute,
    getAdminReturns
};
