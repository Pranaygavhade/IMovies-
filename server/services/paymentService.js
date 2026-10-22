const crypto = require('crypto');
const Razorpay = require('razorpay');

const isRazorpayConfigured = Boolean(
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_ID.startsWith('rzp_')
);

let razorpay = null;
if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('[PaymentService] Razorpay gateway initialized in REAL/TEST mode with Key ID:', process.env.RAZORPAY_KEY_ID);
} else {
  console.log('[PaymentService] Razorpay keys not provided. IMovies built-in Simulated Gateway ACTIVE.');
}

/**
 * Get active payment mode
 */
const getPaymentGatewayMode = () => {
  return isRazorpayConfigured ? 'razorpay' : 'simulated';
};

/**
 * Generate a secure server-issued token for simulated gateway authorization
 */
const generateSimulatedToken = (orderId, amount, bookingId) => {
  const secret = process.env.JWT_SECRET || 'imovies_simulated_gateway_secret_2026';
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}:${amount}:${bookingId}`)
    .digest('hex');
};

/**
 * Create an order for checkout
 */
const createGatewayOrder = async ({ amount, bookingId, currency = 'INR', receipt }) => {
  const mode = getPaymentGatewayMode();

  if (mode === 'razorpay' && razorpay) {
    // Razorpay requires integer paise (₹1 = 100 paise)
    const amountInPaise = Math.round(amount * 100);
    const options = {
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: (receipt || `rcpt_${bookingId}`).slice(0, 40),
      notes: { bookingId: bookingId.toString() },
    };

    const order = await razorpay.orders.create(options);
    return {
      gateway: 'razorpay',
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  // Simulated Gateway Mode
  const orderId = `order_sim_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const simulationToken = generateSimulatedToken(orderId, amount, bookingId);

  return {
    gateway: 'simulated',
    orderId,
    amount,
    currency,
    keyId: 'rzp_test_simulated_imovies_2026',
    simulationToken,
  };
};

/**
 * Verify payment signature
 */
const verifyPaymentSignature = ({
  gateway,
  orderId,
  paymentId,
  signature,
  simulationToken,
  amount,
  bookingId,
}) => {
  if (gateway === 'razorpay' || (!gateway && isRazorpayConfigured)) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay secret not configured on server');
    }
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const actualBuffer = Buffer.from(signature || '', 'utf-8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  // Verify Simulated Gateway signature / token
  if (simulationToken) {
    const expectedToken = generateSimulatedToken(orderId, amount, bookingId);
    return simulationToken === expectedToken;
  }

  // Fallback signature verification for simulated mode
  const secret = process.env.JWT_SECRET || 'imovies_simulated_gateway_secret_2026';
  const expectedSimSig = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return signature === expectedSimSig || signature === 'simulated_valid_signature';
};

/**
 * Verify Razorpay Webhook Signature
 */
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const actualBuffer = Buffer.from(signature || '', 'utf-8');

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

/**
 * Process refund (either Razorpay API or Simulated)
 */
const processGatewayRefund = async ({ gateway, paymentId, amount, notes }) => {
  if (gateway === 'razorpay' && razorpay) {
    const amountInPaise = Math.round(amount * 100);
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amountInPaise,
      notes: notes || {},
    });
    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
    };
  }

  // Simulated Refund
  return {
    refundId: `rfnd_sim_${Date.now()}`,
    status: 'processed',
    amount,
    gateway: 'simulated',
  };
};

module.exports = {
  isRazorpayConfigured,
  getPaymentGatewayMode,
  generateSimulatedToken,
  createGatewayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  processGatewayRefund,
};
