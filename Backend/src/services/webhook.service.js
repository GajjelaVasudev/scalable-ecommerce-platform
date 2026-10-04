const crypto = require('crypto');

function verifyRazorpaySignature(body, signature) {
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
}

module.exports = {
    verifyRazorpaySignature
};