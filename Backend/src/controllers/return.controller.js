const mongoose = require('mongoose');
const returnService = require('../services/return.service');
const refundService = require('../services/refund.service');
const { saveReturnEvidence } = require('../services/storage.service');
const Order = require('../models/order.model');

// --- Customer Endpoints ---

async function getOrderEligibility(req, res) {
    try {
        const { orderId } = req.params;
        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(orderId).populate('items.product');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderUserId = order.user ? (order.user._id ? order.user._id.toString() : order.user.toString()) : null;
        if (req.user.role !== 'admin' && orderUserId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const eligibility = await returnService.calculateOrderReturnEligibility(order);
        return res.status(200).json({
            orderId: order._id,
            deliveryStatus: order.deliveryStatus,
            paymentMethod: order.paymentMethod,
            totalAmount: order.totalAmount,
            eligibility
        });
    } catch (err) {
        console.error('getOrderEligibility error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to check eligibility' });
    }
}

async function createReturn(req, res) {
    try {
        const {
            orderId,
            items,
            pickupAddress,
            pickupInstructions,
            refundMethod,
            codBankDetails,
            customerNotes
        } = req.body;

        const createdReturns = await returnService.createReturnRequest({
            user: req.user,
            orderId,
            items,
            pickupAddress,
            pickupInstructions,
            refundMethod,
            codBankDetails,
            customerNotes
        });

        return res.status(201).json({
            message: `Return request created successfully with ${createdReturns.length} RMA shipment(s)`,
            returns: createdReturns
        });
    } catch (err) {
        console.error('createReturn error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to submit return request' });
    }
}

async function getMyReturns(req, res) {
    try {
        const { status, search, page, limit } = req.query;
        const result = await returnService.getCustomerReturns({
            user: req.user,
            status,
            search,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error('getMyReturns error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to fetch returns' });
    }
}

async function getReturnById(req, res) {
    try {
        const { id } = req.params;
        const returnDoc = await returnService.getCustomerReturnById({
            user: req.user,
            returnId: id
        });

        return res.status(200).json({ returnRequest: returnDoc });
    } catch (err) {
        console.error('getReturnById error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to fetch return details' });
    }
}

async function cancelReturn(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body || {};
        const cancelled = await returnService.cancelCustomerReturn({
            user: req.user,
            returnId: id,
            reason
        });

        return res.status(200).json({
            message: 'Return request cancelled successfully',
            returnRequest: cancelled
        });
    } catch (err) {
        console.error('cancelReturn error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to cancel return' });
    }
}

async function uploadEvidence(req, res) {
    try {
        const { base64Data, mimeType } = req.body;
        if (!base64Data || !mimeType) {
            return res.status(400).json({ message: 'Missing base64Data or mimeType' });
        }

        const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');

        const fileUrl = await saveReturnEvidence(req.user.id, buffer, mimeType);
        return res.status(201).json({ url: fileUrl });
    } catch (err) {
        console.error('uploadEvidence error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to upload evidence image' });
    }
}

async function raiseDispute(req, res) {
    try {
        const { id } = req.params;
        const { reason, evidence } = req.body;
        const disputed = await returnService.raiseReturnDispute({
            user: req.user,
            returnId: id,
            reason,
            evidence
        });

        return res.status(200).json({
            message: 'Dispute submitted for Administrative Review',
            returnRequest: disputed
        });
    } catch (err) {
        console.error('raiseDispute error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to submit dispute' });
    }
}

// --- Seller Endpoints ---

async function getSellerReturnsList(req, res) {
    try {
        const { status, search, page, limit } = req.query;
        const result = await returnService.getSellerReturns({
            sellerId: req.user.id,
            status,
            search,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error('getSellerReturnsList error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to fetch seller returns' });
    }
}

async function sellerReview(req, res) {
    try {
        const { id } = req.params;
        const { action, rejectionReason, note } = req.body;

        const updated = await returnService.sellerReviewReturn({
            sellerId: req.user.id,
            returnId: id,
            action,
            rejectionReason,
            note
        });

        return res.status(200).json({
            message: `Return request ${action}d successfully`,
            returnRequest: updated
        });
    } catch (err) {
        console.error('sellerReview error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to review return request' });
    }
}

async function updateLogistics(req, res) {
    try {
        const { id } = req.params;
        const { status, carrier, trackingNumber, note } = req.body;

        const updated = await returnService.updateReturnLogistics({
            actor: req.user,
            returnId: id,
            status,
            carrier,
            trackingNumber,
            note
        });

        return res.status(200).json({
            message: 'Logistics milestone updated',
            returnRequest: updated
        });
    } catch (err) {
        console.error('updateLogistics error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to update logistics' });
    }
}

async function performInspection(req, res) {
    try {
        const { id } = req.params;
        const { itemsInspection, generalNotes } = req.body;

        const updated = await returnService.performReturnInspection({
            actor: req.user,
            returnId: id,
            itemsInspection,
            generalNotes
        });

        return res.status(200).json({
            message: 'Quality inspection and inventory disposition completed successfully',
            returnRequest: updated
        });
    } catch (err) {
        console.error('performInspection error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to perform inspection' });
    }
}

// --- Admin Endpoints ---

async function getAdminReturnsList(req, res) {
    try {
        const { status, disputeOnly, search, page, limit } = req.query;
        const result = await returnService.getAdminReturns({
            status,
            disputeOnly,
            search,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 15
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error('getAdminReturnsList error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to fetch admin returns' });
    }
}

async function resolveDispute(req, res) {
    try {
        const { id } = req.params;
        const { decision, adminNotes, action } = req.body;

        const updated = await returnService.resolveReturnDispute({
            adminUser: req.user,
            returnId: id,
            decision,
            adminNotes,
            action
        });

        return res.status(200).json({
            message: `Dispute resolved (${decision})`,
            returnRequest: updated
        });
    } catch (err) {
        console.error('resolveDispute error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to resolve dispute' });
    }
}

async function triggerGatewayRefund(req, res) {
    try {
        const { id } = req.params;
        const { amount } = req.body || {};

        const result = await refundService.initiateGatewayRefund({
            returnRequestId: id,
            adminUser: req.user,
            refundAmountOverride: amount
        });

        return res.status(200).json({
            message: 'Razorpay gateway refund initiated successfully',
            returnRequest: result.returnRequest,
            gatewayRefund: result.gatewayRefund
        });
    } catch (err) {
        console.error('triggerGatewayRefund error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to initiate gateway refund' });
    }
}

async function confirmCODTransfer(req, res) {
    try {
        const { id } = req.params;
        const { bankReferenceNumber, notes } = req.body;

        const updated = await refundService.confirmCODBankTransfer({
            returnRequestId: id,
            adminUser: req.user,
            bankReferenceNumber,
            notes
        });

        return res.status(200).json({
            message: 'COD bank transfer confirmed successfully',
            returnRequest: updated
        });
    } catch (err) {
        console.error('confirmCODTransfer error:', err);
        return res.status(err.statusCode || 500).json({ message: err.message || 'Failed to confirm COD transfer' });
    }
}

module.exports = {
    // Customer
    getOrderEligibility,
    createReturn,
    getMyReturns,
    getReturnById,
    cancelReturn,
    uploadEvidence,
    raiseDispute,
    // Seller
    getSellerReturnsList,
    sellerReview,
    updateLogistics,
    performInspection,
    // Admin
    getAdminReturnsList,
    resolveDispute,
    triggerGatewayRefund,
    confirmCODTransfer
};
