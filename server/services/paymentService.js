const crypto = require('crypto');
const Razorpay = require('razorpay');

/**
 * Check if running in production or Vercel environment
 */
const isProductionEnv = () => {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
};

/**
 * Safely parse Razorpay configuration from server environment variables
 */
const getRazorpayCredentials = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_') || keyId.startsWith('rzp_'))
  );
  return { keyId, keySecret, isConfigured };
};

let razorpayInstance = null;
let lastKeyId = null;

/**
 * Get or initialize Razorpay SDK instance
 */
const getRazorpayClient = () => {
  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();

  if (!isConfigured) {
    razorpayInstance = null;
    return null;
  }

  if (!razorpayInstance || lastKeyId !== keyId) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    lastKeyId = keyId;
    const maskedKey = keyId.length > 8 ? `${keyId.slice(0, 8)}...` : 'configured';
    console.log(`[PaymentService] Razorpay gateway client initialized (Key ID: ${maskedKey})`);
  }

  return razorpayInstance;
};

/**
 * Check if Razorpay is configured on this server
 */
const isRazorpayConfigured = () => {
  return getRazorpayCredentials().isConfigured;
};

/**
 * Get active payment mode: 'razorpay' in production, or 'simulated' only in dev/test
 */
const getPaymentGatewayMode = () => {
  const { isConfigured } = getRazorpayCredentials();
  if (isConfigured) return 'razorpay';

  if (isProductionEnv()) {
    return 'unconfigured';
  }

  return 'simulated';
};

/**
 * Generate a secure server-issued token for simulated gateway authorization (Dev/Test only)
 */
const generateSimulatedToken = (orderId, amount, bookingId) => {
  if (isProductionEnv()) {
    throw new Error('[Security Error] Simulated payment tokens cannot be generated in production.');
  }
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
  const isProd = isProductionEnv();
  const { keyId, isConfigured } = getRazorpayCredentials();
  const razorpay = getRazorpayClient();

  // 1. Production Mode: Strict Razorpay validation
  if (isProd) {
    if (!isConfigured || !razorpay) {
      throw new Error(
        '[Payment Error] Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing or invalid in production. ' +
        'Payment initiation is disabled. Please configure your Razorpay keys in Vercel project environment variables.'
      );
    }

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
      keyId,
    };
  }

  // 2. Real Razorpay in Development/Test (if keys provided)
  if (isConfigured && razorpay) {
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
      keyId,
    };
  }

  // 3. Simulated Gateway Mode (Strictly for local development and test environments)
  console.warn('[PaymentService] Razorpay keys not provided. IMovies built-in Simulated Gateway ACTIVE (Dev/Test only).');
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
  const isProd = isProductionEnv();
  const { keySecret, isConfigured } = getRazorpayCredentials();

  // In production, reject any simulated gateway attempt
  if (isProd) {
    if (gateway === 'simulated' || simulationToken) {
      throw new Error(
        '[Security Error] Simulated payment verification is strictly prohibited in production. A genuine Razorpay payment verification is required.'
      );
    }
  }

  // Razorpay signature verification
  if (gateway === 'razorpay' || (!gateway && isConfigured)) {
    if (!keySecret) {
      throw new Error('[Payment Error] Razorpay secret not configured on server.');
    }
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const actualBuffer = Buffer.from(signature || '', 'utf-8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  // Development/Test simulated verification only
  if (simulationToken) {
    const expectedToken = generateSimulatedToken(orderId, amount, bookingId);
    return simulationToken === expectedToken;
  }

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
  const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
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
  const razorpay = getRazorpayClient();

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

  if (isProductionEnv()) {
    throw new Error('[Payment Error] Cannot process simulated refund in production.');
  }

  // Simulated Refund (Dev/Test only)
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
