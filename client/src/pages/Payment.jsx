import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  CreditCard,
  QrCode,
  Building,
  Wallet,
  ShieldCheck,
  Lock,
  ChevronLeft,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  Smartphone,
  Upload,
  Info,
} from 'lucide-react';
import {
  createPendingBooking,
  initiatePaymentOrder,
  verifyPaymentOrder,
} from '../redux/slices/bookingSlice';
import api from '../api/axios';
import { Spinner } from '../components/common/Loader';
import { formatINR } from '../utils/dateUtils';

// Helper to dynamically load external scripts like Razorpay
const loadExternalScript = (src) => {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { showId, show, selectedSeats, totalAmount, lockExpiresAt } = location.state || {};
  const { user } = useSelector((state) => state.auth);

  if (!showId || !selectedSeats || selectedSeats.length === 0) {
    return <Navigate to="/" replace />;
  }

  // Reservation countdown timer
  const [timeLeft, setTimeLeft] = useState(null);

  // Flow states
  const [initLoading, setInitLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [bookingRecord, setBookingRecord] = useState(null);
  const [paymentOrderData, setPaymentOrderData] = useState(null);

  // Checkout Mode: 'online' (Instant) vs 'phonepe_qr' (Manual)
  const [checkoutMode, setCheckoutMode] = useState('online');

  // Manual PhonePe QR state
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [isUnderReview, setIsUnderReview] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);

  // Payment form states (Online mode)
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [failureError, setFailureError] = useState(null);

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4111 1111 1111 1111',
    cardName: user?.name || 'John Doe',
    expDate: '12/28',
    cvv: '999',
  });

  const [upiId, setUpiId] = useState('john@okhdfcbank');

  // Reservation timer logic (5 mins for online, 15 mins for review)
  useEffect(() => {
    const targetExpiresAt = isUnderReview
      ? reviewBooking?.expiresAt || Date.now() + 15 * 60 * 1000
      : lockExpiresAt;

    if (!targetExpiresAt) return;

    const updateTimer = () => {
      const remainingMs = new Date(targetExpiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft(0);
        if (!isUnderReview) {
          toast.error('Seat reservation expired. Please select seats again.');
          navigate(`/shows/${showId}/seats`);
        }
      } else {
        setTimeLeft(Math.floor(remainingMs / 1000));
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [lockExpiresAt, isUnderReview, reviewBooking, navigate, showId]);

  // Step 1: Create Pending Booking & Initiate Gateway Order on Mount
  useEffect(() => {
    let isMounted = true;

    const setupPaymentSession = async () => {
      setInitLoading(true);
      try {
        const seatNumbers = selectedSeats.map((s) => s.seatNumber);

        // 1. Create Pending Booking
        const bookingRes = await dispatch(
          createPendingBooking({ showId, seatNumbers })
        ).unwrap();

        if (!isMounted) return;
        const currentBooking = bookingRes.booking;
        setBookingRecord(currentBooking);

        // 2. Initiate Payment Order
        const orderRes = await dispatch(
          initiatePaymentOrder({ bookingId: currentBooking._id })
        ).unwrap();

        if (!isMounted) return;
        setPaymentOrderData(orderRes);
      } catch (err) {
        if (!isMounted) return;
        toast.error(err || 'Failed to initialize booking payment session.');
        setFailureError(err || 'Failed to initialize booking session.');
      } finally {
        if (isMounted) setInitLoading(false);
      }
    };

    setupPaymentSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch, showId, selectedSeats]);

  // Polling hook when booking is in "payment_under_review"
  useEffect(() => {
    let pollInterval = null;
    if (isUnderReview && bookingRecord?._id) {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.get(`/bookings/${bookingRecord._id}`);
          const current = res.data.data?.booking;
          if (current) {
            if (current.status === 'confirmed') {
              clearInterval(pollInterval);
              toast.success('🎉 Payment Verified & Approved by Admin! Tickets confirmed.');
              navigate(`/booking/confirmation/${current._id}`, {
                state: { booking: current },
              });
            } else if (current.status === 'cancelled') {
              clearInterval(pollInterval);
              const reason = current.manualPayment?.rejectionReason || 'UTR not verified';
              toast.error(`❌ Payment rejected: ${reason}`);
              setFailureError(`Manual verification declined: ${reason}`);
              setIsUnderReview(false);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 4000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isUnderReview, bookingRecord, navigate]);

  // Handle Razorpay Checkout
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    setFailureError(null);

    const scriptLoaded = await loadExternalScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!scriptLoaded) {
      setProcessing(false);
      toast.error('Razorpay SDK failed to load. Are you connected to the internet?');
      return;
    }

    const options = {
      key: paymentOrderData.key,
      amount: Math.round(paymentOrderData.amount * 100),
      currency: paymentOrderData.currency || 'INR',
      name: 'IMovies Cinemas',
      description: `Cinema Ticket Booking - ${paymentOrderData.bookingCode}`,
      order_id: paymentOrderData.orderId,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: {
        color: '#e50914',
      },
      handler: async function (response) {
        try {
          const verifyPayload = {
            bookingId: paymentOrderData.bookingId,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            paymentMethod: 'card',
          };

          const verifyRes = await dispatch(verifyPaymentOrder(verifyPayload)).unwrap();
          toast.success('Payment verified! Your booking is confirmed.');
          navigate(`/booking/confirmation/${verifyRes.booking._id}`, {
            state: { booking: verifyRes.booking },
          });
        } catch (err) {
          setFailureError(err || 'Razorpay payment verification failed.');
        } finally {
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
          toast.info('Razorpay checkout window closed.');
        },
      },
    };

    try {
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response) {
        setProcessing(false);
        const errMsg = response.error?.description || 'Transaction declined by payment network.';
        setFailureError(errMsg);
        toast.error(`Payment failed: ${errMsg}`);
      });
      rzpInstance.open();
    } catch (err) {
      setProcessing(false);
      setFailureError(err.message || 'Failed to open Razorpay modal.');
    }
  };

  // Handle Built-in Simulated Gateway Checkout
  const handleSimulatedPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setFailureError(null);

    try {
      const verifyPayload = {
        bookingId: paymentOrderData?.bookingId || bookingRecord?._id,
        orderId: paymentOrderData?.orderId || `sim_ord_${Date.now()}`,
        paymentId: `sim_pay_${Date.now()}`,
        simulationToken: paymentOrderData?.simulationToken || 'demo_token',
        paymentMethod,
        cardNumber: paymentMethod === 'card' ? cardDetails.cardNumber : undefined,
        upiId: paymentMethod === 'UPI' ? upiId : undefined,
        simulateFailure,
      };

      const verifyRes = await dispatch(verifyPaymentOrder(verifyPayload)).unwrap();
      toast.success('Payment verified! Your booking is confirmed.');
      navigate(`/booking/confirmation/${verifyRes.booking._id}`, {
        state: { booking: verifyRes.booking },
      });
    } catch (err) {
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.message || 'Transaction declined by bank issuer (Test failure).';
      setFailureError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Handle Manual PhonePe QR Submission
  const handlePhonePeSubmit = async (e) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();

    if (!cleanUtr) {
      toast.error('Please enter your 12-digit UPI / UTR Transaction ID.');
      return;
    }

    if (!/^\d{12}$/.test(cleanUtr)) {
      toast.error('Invalid UTR format. Please enter exactly 12 numeric digits (e.g. 429182736451).');
      return;
    }

    setProcessing(true);
    setFailureError(null);

    try {
      const formData = new FormData();
      formData.append('bookingId', bookingRecord._id);
      formData.append('utrNumber', cleanUtr);
      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      const res = await api.post('/payments/submit-manual-qr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedBooking = res.data.data?.booking;
      setReviewBooking(updatedBooking);
      setIsUnderReview(true);
      toast.info('Payment submitted for manual review. Your seats are held for 15 minutes!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit payment for review.';
      toast.error(msg);
      setFailureError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const formatTimer = (seconds) => {
    if (seconds === null) return '05:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const convenienceFee = 35;
  const grandTotal = totalAmount + convenienceFee;
  const isRealRazorpay = paymentOrderData?.gateway === 'razorpay';

  if (initLoading) {
    return <Spinner text="Securing seat lock and creating reservation order..." />;
  }

  // -------------------------------------------------------------
  // DEDICATED "PAYMENT UNDER REVIEW" VIEW (PhonePe Manual Flow)
  // -------------------------------------------------------------
  if (isUnderReview) {
    return (
      <div className="container py-5" style={{ maxWidth: '750px' }}>
        <div className="glass-panel p-4 p-md-5 border-start border-4 border-warning shadow-lg text-center">
          <div className="d-inline-flex p-3 rounded-circle bg-warning bg-opacity-20 text-warning mb-3">
            <Clock size={52} className="animate-pulse" />
          </div>

          <span className="badge bg-warning text-dark px-3 py-1 fs-6 text-uppercase fw-bold mb-2 d-inline-block">
            Payment Under Review
          </span>

          <h2 className="font-heading text-white fs-3 mb-2">Verifying Your Transfer</h2>
          <p className="text-muted small mb-4 max-w-lg mx-auto">
            You have submitted a manual UPI transfer of <strong className="text-white">{formatINR(grandTotal)}</strong> to{' '}
            <strong className="text-warning">PRANAY GAVHADE</strong>. Our cinema administrator is currently checking
            their PhonePe app statement.
          </p>

          {/* Details Card */}
          <div className="p-4 rounded-3 bg-dark border border-secondary text-start mb-4">
            <div className="row g-3">
              <div className="col-sm-6">
                <span className="text-muted small d-block">Booking Reference:</span>
                <span className="text-warning font-monospace fw-bold fs-5">
                  {bookingRecord?.bookingCode}
                </span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Submitted 12-Digit UTR:</span>
                <span className="text-white font-monospace fw-bold fs-5">
                  {utrNumber}
                </span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Seats Reserved:</span>
                <span className="text-white fw-bold">
                  {selectedSeats.map((s) => s.seatNumber).join(', ')} ({selectedSeats.length})
                </span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Total Amount:</span>
                <span className="text-danger fw-bold fs-5">{formatINR(grandTotal)}</span>
              </div>
            </div>

            <hr className="border-secondary opacity-25 my-3" />

            <div className="d-flex align-items-center justify-content-between text-warning small">
              <span className="d-flex align-items-center gap-2">
                <Clock size={16} /> Seats locked for manual verification:
              </span>
              <strong className="font-monospace fs-6">
                {timeLeft !== null ? formatTimer(timeLeft) : '15:00'}
              </strong>
            </div>
          </div>

          {/* Live waiting indicator */}
          <div className="p-3 mb-4 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 d-flex align-items-center justify-content-center gap-3">
            <span className="spinner-border spinner-border-sm text-warning" role="status" />
            <span className="text-light small">
              Listening for admin approval... Your e-ticket with digital signed QR will be generated automatically.
            </span>
          </div>

          <div className="d-flex justify-content-center gap-3">
            <Link to="/bookings" className="btn btn-outline-secondary text-light px-4">
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEDICATED "PAYMENT FAILED – RETRY" VIEW
  // -------------------------------------------------------------
  if (failureError) {
    return (
      <div className="payment-failed-page container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-7 col-md-9">
            <div className="glass-panel p-4 p-md-5 border-start border-4 border-danger shadow-lg">
              <div className="text-center mb-4">
                <div
                  className="d-inline-flex p-3 rounded-circle bg-danger bg-opacity-25 text-danger mb-3"
                  style={{ animation: 'bounce 1s infinite' }}
                >
                  <XCircle size={56} />
                </div>
                <h2 className="font-heading text-white fs-3 mb-1">Payment Declined</h2>
                <p className="text-muted small">
                  The transaction could not be completed with your payment provider.
                </p>
              </div>

              {/* Error Detail Card */}
              <div
                className="p-3 mb-4 rounded-3 border border-danger border-opacity-50"
                style={{ backgroundColor: 'rgba(229, 9, 20, 0.08)' }}
              >
                <div className="d-flex align-items-start gap-2">
                  <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-white fw-bold small">Reason for Failure:</div>
                    <div className="text-light opacity-90 small mt-1">{failureError}</div>
                  </div>
                </div>
              </div>

              {/* Reservation Status Reminder */}
              <div
                className="p-3 mb-4 rounded-3 border border-warning border-opacity-50 d-flex align-items-center justify-content-between"
                style={{ backgroundColor: 'rgba(217, 119, 6, 0.08)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Clock size={20} className="text-warning flex-shrink-0" />
                  <div>
                    <span className="text-warning fw-semibold small d-block">
                      Good news! Your seats are still held.
                    </span>
                    <span className="text-muted small">
                      Seats: <strong className="text-white">{selectedSeats.map((s) => s.seatNumber).join(', ')}</strong>
                    </span>
                  </div>
                </div>
                {timeLeft !== null && (
                  <div className="text-end">
                    <span className="text-muted small d-block">Reservation timer:</span>
                    <span className="font-monospace fw-bold text-warning fs-6">
                      {formatTimer(timeLeft)}
                    </span>
                  </div>
                )}
              </div>

              {/* Retry & Return Options */}
              <div className="d-flex flex-column flex-sm-row gap-3">
                <button
                  type="button"
                  className="btn btn-cinema btn-lg flex-fill py-3 d-flex align-items-center justify-content-center gap-2 shadow"
                  onClick={() => {
                    setFailureError(null);
                    setSimulateFailure(false);
                    if (cardDetails.cardNumber.endsWith('0002')) {
                      setCardDetails((prev) => ({ ...prev, cardNumber: '4111 1111 1111 1111' }));
                    }
                    if (upiId.endsWith('@fail')) {
                      setUpiId('john@okhdfcbank');
                    }
                  }}
                >
                  <RefreshCw size={18} />
                  <span>Retry Payment Now</span>
                </button>

                <Link
                  to={`/shows/${showId}/seats`}
                  className="btn btn-outline-secondary text-light btn-lg flex-fill py-3 d-flex align-items-center justify-content-center gap-2"
                >
                  <ChevronLeft size={18} />
                  <span>Back to Seats</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN CHECKOUT VIEW
  // -------------------------------------------------------------
  return (
    <div className="payment-page container py-5">
      <div className="row g-4 justify-content-center">
        {/* Left Column: Payment Form */}
        <div className="col-lg-7">
          <div className="glass-panel p-4 p-md-5">
            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-25">
              <div>
                <h2 className="font-heading text-white fs-3 mb-1">Payment Checkout</h2>
                <span className="text-muted small">Select your preferred payment channel</span>
              </div>
              <div className="d-flex align-items-center gap-1 text-success small fw-semibold">
                <ShieldCheck size={18} /> 256-Bit SSL Encrypted
              </div>
            </div>

            {/* Lock countdown banner */}
            {timeLeft !== null && (
              <div
                className="p-3 mb-4 rounded-3 border border-warning border-opacity-50 d-flex align-items-center justify-content-between"
                style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Clock size={18} className="text-warning animate-pulse" />
                  <span className="text-warning small fw-bold">
                    {checkoutMode === 'phonepe_qr' ? 'SEATS RESERVED (15 MIN FOR UPI)' : 'SEATS RESERVED FOR CHECKOUT'}
                  </span>
                </div>
                <span className="font-monospace fw-bold text-white fs-6">
                  {formatTimer(timeLeft)}
                </span>
              </div>
            )}

            {/* PRIMARY PAYMENT MODE SWITCHER (Section 5.3) */}
            <div className="row g-2 mb-4">
              <div className="col-6">
                <button
                  type="button"
                  className={`btn w-100 py-3 d-flex flex-column align-items-center justify-content-center gap-1 rounded-3 ${
                    checkoutMode === 'online'
                      ? 'btn-danger text-white shadow'
                      : 'btn-dark text-muted border border-secondary'
                  }`}
                  onClick={() => setCheckoutMode('online')}
                >
                  <CreditCard size={20} />
                  <span className="fw-bold small">Pay Online</span>
                  <span className="text-light opacity-75" style={{ fontSize: '0.7rem' }}>
                    Instant Confirmation
                  </span>
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className={`btn w-100 py-3 d-flex flex-column align-items-center justify-content-center gap-1 rounded-3 ${
                    checkoutMode === 'phonepe_qr'
                      ? 'btn-warning text-dark fw-bold shadow'
                      : 'btn-dark text-muted border border-secondary'
                  }`}
                  onClick={() => setCheckoutMode('phonepe_qr')}
                >
                  <Smartphone size={20} />
                  <span className="fw-bold small">Pay via PhonePe QR</span>
                  <span style={{ fontSize: '0.7rem' }}>
                    Manual Verification
                  </span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* OPTION 2: PHONEPE QR (MANUAL VERIFICATION) */}
            {/* ------------------------------------------------------------- */}
            {checkoutMode === 'phonepe_qr' && (
              <div>
                <div className="p-3 mb-4 rounded-3 bg-warning bg-opacity-10 border border-warning text-center">
                  <span className="badge bg-warning text-dark text-uppercase px-2 py-1 mb-2 fw-bold">
                    Manual Verification Flow
                  </span>
                  <p className="text-white fw-bold fs-6 mb-1">
                    Pay exactly <span className="text-warning fs-5">{formatINR(grandTotal)}</span> to{' '}
                    <span className="text-warning">PRANAY GAVHADE</span> and enter your UTR/transaction ID
                  </p>
                  <p className="text-muted small mb-0">
                    Seats are locked for 15 minutes. An administrator will verify the transfer before confirming your ticket.
                  </p>
                </div>

                {/* Display phonepe-qr.jpeg unmodified */}
                <div className="text-center p-3 mb-4 rounded-3 bg-black border border-secondary">
                  <img
                    src="/assets/phonepe-qr.jpeg"
                    alt="PhonePe Merchant QR Code"
                    className="img-fluid rounded-3 shadow-lg"
                    style={{
                      maxWidth: '340px',
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                  <div className="text-muted small mt-2">
                    Scan with PhonePe, Google Pay, Paytm, or any UPI App
                  </div>
                </div>

                <form onSubmit={handlePhonePeSubmit}>
                  {/* UTR Input */}
                  <div className="mb-3">
                    <label className="text-white small fw-bold mb-1 d-flex justify-content-between">
                      <span>12-Digit UTR / Transaction ID *</span>
                      <span className="text-muted small">Must be 12 numeric digits</span>
                    </label>
                    <input
                      type="text"
                      maxLength="12"
                      required
                      placeholder="e.g. 429182736451"
                      className="form-control bg-dark text-white border-warning font-monospace fs-5 py-2"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                    />
                    <div className="text-muted small mt-1">
                      Found in your UPI app payment receipt / statement.
                    </div>
                  </div>

                  {/* Optional Screenshot */}
                  <div className="mb-4">
                    <label className="text-white small fw-bold mb-1 d-flex align-items-center gap-1">
                      <Upload size={14} /> Upload Payment Screenshot (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control bg-dark text-light border-secondary"
                      onChange={(e) => setScreenshotFile(e.target.files[0] || null)}
                    />
                    <div className="text-muted small mt-1">
                      Helps staff verify and approve your booking faster (JPG/PNG, max 5MB).
                    </div>
                  </div>

                  {/* Warning Notice */}
                  <div className="alert alert-warning d-flex align-items-start gap-2 small mb-4">
                    <Info size={18} className="text-warning flex-shrink-0 mt-1" />
                    <div>
                      <strong>Please note:</strong> This payment is manually verified and may take a few minutes.
                      Your ticket QR will ONLY be issued once the admin approves the transfer. Never auto-confirmed.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || utrNumber.length !== 12}
                    className="btn btn-warning text-dark btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                  >
                    {processing ? (
                      <span>Submitting for Review...</span>
                    ) : (
                      <>
                        <Lock size={18} />
                        <span>Submit UTR for Verification</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* OPTION 1: ONLINE INSTANT VERIFICATION */}
            {/* ------------------------------------------------------------- */}
            {checkoutMode === 'online' && (
              <div>
                {/* If Razorpay Test Mode is active */}
                {isRealRazorpay ? (
                  <div className="text-center py-4">
                    <div className="p-4 mb-4 rounded-3 bg-dark border border-secondary text-start">
                      <div className="d-flex align-items-center gap-2 mb-2 text-danger fw-bold">
                        <Sparkles size={18} /> Razorpay Test Mode Enabled
                      </div>
                      <p className="text-muted small mb-0">
                        Official Razorpay checkout window with instant server-side verification.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={processing}
                      className="btn btn-cinema btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                      onClick={handleRazorpayPayment}
                    >
                      {processing ? (
                        <span>Opening Razorpay Window...</span>
                      ) : (
                        <>
                          <Lock size={18} />
                          <span>Proceed to Razorpay ({formatINR(grandTotal)})</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Built-in Simulated Gateway */
                  <div>
                    {/* Mode info pill */}
                    <div className="d-flex align-items-center justify-content-between mb-3 px-3 py-2 rounded bg-dark border border-secondary">
                      <span className="badge bg-danger text-uppercase px-2 py-1">Simulated Gateway</span>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Instant automated server-side verification
                      </span>
                    </div>

                    {/* Payment Method Selector Tabs */}
                    <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
                      <button
                        type="button"
                        className={`btn flex-fill py-3 d-flex flex-column align-items-center gap-1 rounded-3 ${
                          paymentMethod === 'card'
                            ? 'btn-danger text-white shadow'
                            : 'btn-dark text-muted border border-secondary'
                        }`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CreditCard size={20} />
                        <span className="small fw-semibold">Card</span>
                      </button>

                      <button
                        type="button"
                        className={`btn flex-fill py-3 d-flex flex-column align-items-center gap-1 rounded-3 ${
                          paymentMethod === 'UPI'
                            ? 'btn-danger text-white shadow'
                            : 'btn-dark text-muted border border-secondary'
                        }`}
                        onClick={() => setPaymentMethod('UPI')}
                      >
                        <QrCode size={20} />
                        <span className="small fw-semibold">UPI / QR</span>
                      </button>

                      <button
                        type="button"
                        className={`btn flex-fill py-3 d-flex flex-column align-items-center gap-1 rounded-3 ${
                          paymentMethod === 'netbanking'
                            ? 'btn-danger text-white shadow'
                            : 'btn-dark text-muted border border-secondary'
                        }`}
                        onClick={() => setPaymentMethod('netbanking')}
                      >
                        <Building size={20} />
                        <span className="small fw-semibold">Net Banking</span>
                      </button>

                      <button
                        type="button"
                        className={`btn flex-fill py-3 d-flex flex-column align-items-center gap-1 rounded-3 ${
                          paymentMethod === 'wallet'
                            ? 'btn-danger text-white shadow'
                            : 'btn-dark text-muted border border-secondary'
                        }`}
                        onClick={() => setPaymentMethod('wallet')}
                      >
                        <Wallet size={20} />
                        <span className="small fw-semibold">Wallets</span>
                      </button>
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={handleSimulatedPayment}>
                      {paymentMethod === 'card' && (
                        <div className="d-flex flex-column gap-3 mb-4">
                          <div className="d-flex gap-2 mb-1">
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm flex-fill py-1"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => {
                                setCardDetails({
                                  cardNumber: '4111 1111 1111 1111',
                                  cardName: user?.name || 'John Doe',
                                  expDate: '12/28',
                                  cvv: '999',
                                });
                                setSimulateFailure(false);
                              }}
                            >
                              Fill Success Card (4111...)
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm flex-fill py-1"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => {
                                setCardDetails({
                                  cardNumber: '4000 0000 0000 0002',
                                  cardName: user?.name || 'John Doe',
                                  expDate: '12/28',
                                  cvv: '999',
                                });
                                setSimulateFailure(true);
                              }}
                            >
                              Fill Failure Card (...0002)
                            </button>
                          </div>

                          <div>
                            <label className="text-muted small fw-semibold mb-1">Card Number</label>
                            <input
                              type="text"
                              className="form-control bg-dark text-light border-secondary py-2"
                              value={cardDetails.cardNumber}
                              onChange={(e) =>
                                setCardDetails({ ...cardDetails, cardNumber: e.target.value })
                              }
                              required
                            />
                          </div>

                          <div>
                            <label className="text-muted small fw-semibold mb-1">Cardholder Name</label>
                            <input
                              type="text"
                              className="form-control bg-dark text-light border-secondary py-2"
                              value={cardDetails.cardName}
                              onChange={(e) =>
                                setCardDetails({ ...cardDetails, cardName: e.target.value })
                              }
                              required
                            />
                          </div>

                          <div className="row g-2">
                            <div className="col-6">
                              <label className="text-muted small fw-semibold mb-1">Expiry (MM/YY)</label>
                              <input
                                type="text"
                                className="form-control bg-dark text-light border-secondary py-2"
                                value={cardDetails.expDate}
                                onChange={(e) =>
                                  setCardDetails({ ...cardDetails, expDate: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="col-6">
                              <label className="text-muted small fw-semibold mb-1">CVV</label>
                              <input
                                type="password"
                                maxLength="4"
                                className="form-control bg-dark text-light border-secondary py-2"
                                value={cardDetails.cvv}
                                onChange={(e) =>
                                  setCardDetails({ ...cardDetails, cvv: e.target.value })
                                }
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'UPI' && (
                        <div className="mb-4">
                          <div className="d-flex gap-2 mb-2">
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm flex-fill py-1"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => {
                                setUpiId('john@okhdfcbank');
                                setSimulateFailure(false);
                              }}
                            >
                              Success UPI (@okhdfcbank)
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm flex-fill py-1"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => {
                                setUpiId('tester@fail');
                                setSimulateFailure(true);
                              }}
                            >
                              Failure UPI (@fail)
                            </button>
                          </div>

                          <label className="text-muted small fw-semibold mb-1">Enter UPI VPA / ID</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-light border-secondary py-2"
                            placeholder="e.g. name@okhdfcbank"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            required
                          />
                          <div className="text-muted small mt-2">
                            Instant automated verification via simulated payment rail.
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'netbanking' && (
                        <div className="mb-4">
                          <label className="text-muted small fw-semibold mb-1">Select Bank</label>
                          <select className="form-select bg-dark text-light border-secondary py-2">
                            <option>HDFC Bank</option>
                            <option>State Bank of India</option>
                            <option>ICICI Bank</option>
                            <option>Axis Bank</option>
                            <option>Kotak Mahindra Bank</option>
                          </select>
                        </div>
                      )}

                      {paymentMethod === 'wallet' && (
                        <div className="mb-4">
                          <label className="text-muted small fw-semibold mb-1">Select Digital Wallet</label>
                          <select className="form-select bg-dark text-light border-secondary py-2">
                            <option>Apple Pay / Google Wallet</option>
                            <option>Amazon Pay</option>
                            <option>Paytm Wallet</option>
                          </select>
                        </div>
                      )}

                      {/* Failure Simulator Toggle */}
                      <div
                        className="p-3 mb-4 rounded-3 border border-secondary"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                      >
                        <div className="form-check form-switch d-flex align-items-center justify-content-between p-0">
                          <label
                            className="form-check-label text-warning small fw-bold d-flex align-items-center gap-2 m-0 cursor-pointer"
                            htmlFor="simulateFailureToggle"
                          >
                            <AlertTriangle size={16} /> Simulate Gateway Failure (Test Mode)
                          </label>
                          <input
                            className="form-check-input ms-auto"
                            type="checkbox"
                            role="switch"
                            id="simulateFailureToggle"
                            checked={simulateFailure}
                            onChange={(e) => setSimulateFailure(e.target.checked)}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={processing}
                        className="btn btn-cinema btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                      >
                        {processing ? (
                          <span>Authorizing Transaction...</span>
                        ) : (
                          <>
                            <Lock size={18} />
                            <span>Pay {formatINR(grandTotal)} & Confirm</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary Ticket */}
        <div className="col-lg-5">
          <div className="glass-panel p-4 position-sticky" style={{ top: '100px' }}>
            <h4 className="font-heading text-white fs-5 mb-3 pb-2 border-bottom border-secondary border-opacity-25">
              Booking Summary
            </h4>

            <div className="d-flex gap-3 mb-3">
              <img
                src={show.movie.poster}
                alt={show.movie.title}
                className="rounded-3 shadow"
                style={{ width: '80px', height: '115px', objectFit: 'cover' }}
              />
              <div>
                <h5 className="text-white fw-bold fs-6 mb-1">{show.movie.title}</h5>
                <div className="text-danger small fw-semibold mb-1">{show.theatre.name}</div>
                <div className="text-muted small">{show.screen}</div>
                <div className="text-muted small">
                  {show.date} • {show.startTime}
                </div>
              </div>
            </div>

            <div className="mb-3 pt-3 border-top border-secondary border-opacity-25">
              <div className="d-flex justify-content-between text-muted small mb-2">
                <span>Selected Seats:</span>
                <span className="text-white fw-bold">
                  {selectedSeats.map((s) => s.seatNumber).join(', ')} ({selectedSeats.length})
                </span>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-2">
                <span>Tickets Subtotal:</span>
                <span className="text-white">{formatINR(totalAmount)}</span>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-2">
                <span>Convenience Fee:</span>
                <span className="text-white">{formatINR(convenienceFee)}</span>
              </div>
            </div>

            <div className="pt-3 border-top border-secondary border-opacity-50 d-flex justify-content-between align-items-center">
              <div>
                <div className="text-white fw-bold fs-5">Total Payable</div>
                <div className="text-muted small">Inclusive of all cinema taxes</div>
              </div>
              <div className="fs-3 fw-bold text-danger font-heading">{formatINR(grandTotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
