const crypto = require('crypto');

function verifyRazorpaySignature(body, signature, secret = process.env.RAZORPAY_WEBHOOK_SECRET) {
    if (!secret || typeof secret !== 'string') {
        console.error('Razorpay webhook secret is not configured');
        return false;
    }

    if (!signature || typeof signature !== 'string') {
        return false;
    }

    if (!body || (!Buffer.isBuffer(body) && typeof body !== 'string')) {
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
        const receivedBuffer = Buffer.from(signature, 'utf8');

        if (expectedBuffer.length !== receivedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    } catch (err) {
        console.error('Razorpay signature verification error:', err.message);
        return false;
    }
}

module.exports = {
    verifyRazorpaySignature
};