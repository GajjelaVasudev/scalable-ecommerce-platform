const mongoose = require('mongoose');
const ReturnRequest = require('../models/returnRequest.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const { createRazorpayRefund } = require('./payment.service');
const { sendNotification } = require('./notification.service');

/**
 * Initiates an online refund via Razorpay for an eligible return request.
 */
async function initiateGatewayRefund({ returnRequestId, adminUser, refundAmountOverride }) {
    if (!mongoose.isValidObjectId(returnRequestId)) {
        const err = new Error('Invalid return request ID');
        err.statusCode = 400;
        throw err;
    }

    const ret = await ReturnRequest.findById(returnRequestId).populate('order');
    if (!ret) {
        const err = new Error('Return request not found');
        err.statusCode = 404;
        throw err;
    }

    if (['completed', 'processing'].includes(ret.refundDetails?.status)) {
        const err = new Error(`Refund is already in '${ret.refundDetails?.status}' state. Duplicate refund is disallowed.`);
        err.statusCode = 400;
        throw err;
    }

    const isOnline = ret.refundMethod?.type === 'ORIGINAL_GATEWAY';
    if (!isOnline) {
        const err = new Error(`Cannot initiate gateway refund for a COD order. Use COD bank transfer confirmation.`);
        err.statusCode = 400;
        throw err;
    }

    // Find captured payment for this order
    const payment = await Payment.findOne({
        order: ret.order._id,
        status: { $in: ['paid', 'refunded'] }
    });

    if (!payment || !payment.providerPaymentId) {
        const err = new Error('No captured Razorpay payment found for this order');
        err.statusCode = 400;
        throw err;
    }

    const amount = Number(refundAmountOverride || ret.totalRefundAmount || ret.refundDetails.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        const err = new Error(`Invalid refund amount: ${amount}`);
        err.statusCode = 400;
        throw err;
    }

    // Validate refundable amount against captured amount minus previous refunds
    const currentRefunded = Number(payment.refundAmount || 0);
    const maxRefundable = Math.max(0, Number(payment.amount) - currentRefunded);
    if (amount > maxRefundable) {
        const err = new Error(
            `Refund amount (₹${amount}) exceeds maximum refundable balance (₹${maxRefundable}) on payment`
        );
        err.statusCode = 400;
        throw err;
    }

    // Call Razorpay refund API
    let razorpayRefund;
    try {
        razorpayRefund = await createRazorpayRefund({
            paymentId: payment.providerPaymentId,
            amount,
            notes: {
                rmaNumber: ret.rmaNumber,
                returnRequestId: String(ret._id),
                orderId: String(ret.order._id)
            }
        });
    } catch (gatewayErr) {
        ret.refundDetails.status = 'failed';
        ret.refundDetails.failureReason = gatewayErr.message || 'Gateway refund error';
        ret.statusHistory.push({
            status: ret.status,
            changedBy: adminUser.id,
            role: 'admin',
            note: `Gateway refund failed: ${gatewayErr.message}`,
            timestamp: new Date()
        });
        await ret.save();

        const err = new Error(`Razorpay refund failed: ${gatewayErr.message}`);
        err.statusCode = 502;
        throw err;
    }

    // Successful gateway acceptance
    const isInstantComplete = razorpayRefund.status === 'processed';
    const finalRefundStatus = isInstantComplete ? 'completed' : 'processing';

    ret.refundDetails.status = finalRefundStatus;
    ret.refundDetails.amount = amount;
    ret.refundDetails.gatewayRefundId = razorpayRefund.id;
    ret.refundDetails.providerPaymentId = payment.providerPaymentId;
    ret.refundDetails.paymentId = payment._id;
    ret.refundDetails.initiatedAt = new Date();

    if (isInstantComplete) {
        ret.refundDetails.completedAt = new Date();
        ret.status = 'completed';
    }

    ret.statusHistory.push({
        status: isInstantComplete ? 'completed' : ret.status,
        changedBy: adminUser.id,
        role: 'admin',
        note: `Gateway refund initiated with ID: ${razorpayRefund.id} (status: ${razorpayRefund.status})`,
        timestamp: new Date()
    });

    await ret.save();

    // Update payment record
    payment.refundAmount = currentRefunded + amount;
    if (!payment.refunds) payment.refunds = [];
    payment.refunds.push({
        refundId: razorpayRefund.id,
        amount,
        status: razorpayRefund.status || 'created',
        notes: { rmaNumber: ret.rmaNumber },
        createdAt: new Date()
    });
    if (payment.refundAmount >= payment.amount) {
        payment.status = 'refunded';
    }
    await payment.save();

    // Update order refund status if fully refunded
    const allOrderReturns = await ReturnRequest.find({ order: ret.order._id });
    const allCompleted = allOrderReturns.every(r => r.refundDetails?.status === 'completed');
    if (allCompleted) {
        await Order.findByIdAndUpdate(ret.order._id, { refundStatus: 'completed' });
    }

    // Notify customer
    sendNotification({
        userId: ret.customer,
        category: 'payments',
        title: isInstantComplete ? 'Refund completed' : 'Refund processing',
        message: isInstantComplete
            ? `Your refund of ₹${amount.toLocaleString('en-IN')} for RMA ${ret.rmaNumber} has been successfully credited via Razorpay (Ref: ${razorpayRefund.id}).`
            : `Your refund of ₹${amount.toLocaleString('en-IN')} for RMA ${ret.rmaNumber} is processing (Gateway Ref: ${razorpayRefund.id}).`,
        icon: 'currency_rupee',
        actionUrl: `/account/returns/${ret._id}`,
        actionLabel: 'View refund',
        dedupeKey: `refund_processed_${razorpayRefund.id}`,
        prefKey: 'refundStatus'
    }).catch(() => {});

    return {
        returnRequest: ret,
        gatewayRefund: razorpayRefund
    };
}

/**
 * Confirms COD bank transfer with verified UTR / Bank Reference number.
 */
async function confirmCODBankTransfer({ returnRequestId, adminUser, bankReferenceNumber, notes }) {
    if (!mongoose.isValidObjectId(returnRequestId)) {
        const err = new Error('Invalid return request ID');
        err.statusCode = 400;
        throw err;
    }

    if (!bankReferenceNumber || !bankReferenceNumber.trim()) {
        const err = new Error('Bank Reference Number / UTR is mandatory to confirm COD transfer');
        err.statusCode = 400;
        throw err;
    }

    const ret = await ReturnRequest.findById(returnRequestId);
    if (!ret) {
        const err = new Error('Return request not found');
        err.statusCode = 404;
        throw err;
    }

    if (['completed', 'processing'].includes(ret.refundDetails?.status)) {
        const err = new Error(`Refund is already in '${ret.refundDetails?.status}' state. Duplicate refund is disallowed.`);
        err.statusCode = 400;
        throw err;
    }

    const isCOD = ret.refundMethod?.type === 'COD_BANK_TRANSFER' || ret.refundMethod?.type === 'COD_UPI';
    if (!isCOD) {
        const err = new Error('This return was paid online. Please use the gateway refund option.');
        err.statusCode = 400;
        throw err;
    }

    ret.refundDetails.status = 'completed';
    ret.refundDetails.bankReferenceNumber = bankReferenceNumber.trim();
    ret.refundDetails.completedAt = new Date();
    ret.status = 'completed';

    ret.statusHistory.push({
        status: 'completed',
        changedBy: adminUser.id,
        role: 'admin',
        note: `COD refund confirmed via bank transfer. UTR: ${bankReferenceNumber.trim()}. ${notes || ''}`.trim(),
        timestamp: new Date()
    });

    await ret.save();

    // Update order
    const allOrderReturns = await ReturnRequest.find({ order: ret.order });
    const allCompleted = allOrderReturns.every(r => r.refundDetails?.status === 'completed');
    if (allCompleted) {
        await Order.findByIdAndUpdate(ret.order, { refundStatus: 'completed' });
    }

    // Notify customer
    sendNotification({
        userId: ret.customer,
        category: 'payments',
        title: 'COD refund completed',
        message: `Your COD refund of ₹${ret.totalRefundAmount.toLocaleString('en-IN')} has been transferred to your account (UTR: ${bankReferenceNumber.trim()}).`,
        icon: 'account_balance',
        actionUrl: `/account/returns/${ret._id}`,
        actionLabel: 'View details',
        dedupeKey: `cod_refund_completed_${ret._id}`,
        prefKey: 'refundStatus'
    }).catch(() => {});

    return ret;
}

/**
 * Reconciles refund events from Razorpay webhook.
 */
async function processRefundWebhookEvent(event) {
    const refundEntity = event.payload?.refund?.entity;
    if (!refundEntity?.id) return;

    const refundId = refundEntity.id;
    const isSuccess = event.event === 'refund.processed';
    const isFailure = event.event === 'refund.failed';

    const ret = await ReturnRequest.findOne({ 'refundDetails.gatewayRefundId': refundId });
    if (!ret) return;

    if (isSuccess && ret.refundDetails.status !== 'completed') {
        ret.refundDetails.status = 'completed';
        ret.refundDetails.completedAt = new Date();
        ret.status = 'completed';
        ret.statusHistory.push({
            status: 'completed',
            role: 'system',
            note: `Refund confirmed completed by Razorpay webhook (ID: ${refundId})`,
            timestamp: new Date()
        });
        await ret.save();

        sendNotification({
            userId: ret.customer,
            category: 'payments',
            title: 'Refund completed',
            message: `Your refund of ₹${ret.totalRefundAmount.toLocaleString('en-IN')} has been credited (Gateway Ref: ${refundId}).`,
            icon: 'currency_rupee',
            actionUrl: `/account/returns/${ret._id}`,
            actionLabel: 'View refund',
            dedupeKey: `webhook_refund_processed_${refundId}`,
            prefKey: 'refundStatus'
        }).catch(() => {});
    } else if (isFailure && ret.refundDetails.status !== 'failed') {
        ret.refundDetails.status = 'failed';
        ret.refundDetails.failureReason = refundEntity.error_description || 'Refund failed at payment gateway';
        ret.statusHistory.push({
            status: ret.status,
            role: 'system',
            note: `Refund failed at gateway: ${ret.refundDetails.failureReason}`,
            timestamp: new Date()
        });
        await ret.save();

        sendNotification({
            userId: ret.customer,
            category: 'payments',
            title: 'Refund failed',
            message: `Refund of ₹${ret.totalRefundAmount.toLocaleString('en-IN')} failed at payment gateway. Support will assist you.`,
            icon: 'error',
            actionUrl: `/account/returns/${ret._id}`,
            actionLabel: 'View return',
            dedupeKey: `webhook_refund_failed_${refundId}`,
            prefKey: 'refundStatus'
        }).catch(() => {});
    }
}

module.exports = {
    initiateGatewayRefund,
    confirmCODBankTransfer,
    processRefundWebhookEvent
};
