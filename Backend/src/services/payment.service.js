const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function createRazorpayOrder({ amount, currency = 'INR', receipt }) {
    const options = {
        amount: Math.round(amount * 100),
        currency,
        receipt
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return razorpayOrder;
}

module.exports = {
    createRazorpayOrder
};