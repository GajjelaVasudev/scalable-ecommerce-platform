const Razorpay = require('razorpay');

let razorpayClient = null;

function getRazorpayClient() {
    if (!razorpayClient) {
        razorpayClient = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret'
        });
    }
    return razorpayClient;
}

function setRazorpayClient(client) {
    razorpayClient = client;
}

async function createRazorpayOrder({ amount, currency = 'INR', receipt }) {
    const client = getRazorpayClient();
    const options = {
        amount: Math.round(amount * 100), // amount in paise
        currency,
        receipt
    };

    const razorpayOrder = await client.orders.create(options);
    return razorpayOrder;
}

module.exports = {
    createRazorpayOrder,
    getRazorpayClient,
    setRazorpayClient
};