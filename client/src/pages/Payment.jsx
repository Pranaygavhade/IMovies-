import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
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
  Film,
} from 'lucide-react';
import { createBookingOrder } from '../redux/slices/bookingSlice';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { showId, show, selectedSeats, totalAmount } = location.state || {};
  const { user } = useSelector((state) => state.auth);

  if (!showId || !selectedSeats || selectedSeats.length === 0) {
    return <Navigate to="/" replace />;
  }

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242 •••• •••• 4242',
    cardName: user?.name || 'John Doe',
    expDate: '12/28',
    cvv: '999',
  });

  const [upiId, setUpiId] = useState('john@okhdfcbank');

  const convenienceFee = 2.5;
  const grandTotal = totalAmount + convenienceFee;

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    if (simulateFailure) {
      setTimeout(() => {
        setProcessing(false);
        toast.error('Payment Simulation: Transaction declined by bank issuer (Test failure). Please try again.');
      }, 1200);
      return;
    }

    try {
      const seatNumbers = selectedSeats.map((s) => s.seatNumber);
      const booking = await dispatch(
        createBookingOrder({
          showId,
          seatNumbers,
          paymentMethod,
          paymentDetails: {
            cardNumber: cardDetails.cardNumber,
            upiId: paymentMethod === 'UPI' ? upiId : null,
          },
        })
      ).unwrap();

      toast.success('Payment verified! Your booking is confirmed.');
      navigate(`/booking/confirmation/${booking._id}`, { state: { booking } });
    } catch (err) {
      toast.error(err || 'Payment verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="payment-page container py-5">
      <div className="row g-4 justify-content-center">
        {/* Left Column: Payment Methods Form */}
        <div className="col-lg-7">
          <div className="glass-panel p-4 p-md-5">
            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-25">
              <div>
                <h2 className="font-heading text-white fs-3 mb-1">Payment Checkout</h2>
                <span className="text-muted small">Choose your preferred payment method</span>
              </div>
              <div className="d-flex align-items-center gap-1 text-success small fw-semibold">
                <ShieldCheck size={18} /> 256-Bit SSL Encrypted
              </div>
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

            {/* Payment Forms */}
            <form onSubmit={handlePaymentSubmit}>
              {paymentMethod === 'card' && (
                <div className="d-flex flex-column gap-3 mb-4">
                  <div>
                    <label className="text-muted small fw-semibold mb-1">Card Number</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-light border-secondary py-2"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-muted small fw-semibold mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-light border-secondary py-2"
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
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
                        onChange={(e) => setCardDetails({ ...cardDetails, expDate: e.target.value })}
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
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div className="mb-4">
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
                    Google Pay, PhonePe, Paytm, or BHIM supported.
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

              {/* Edge Case Simulator Failure Toggle (for QA and Testing requirement in Prompt Section 5 & 9) */}
              <div
                className="p-3 mb-4 rounded-3 border border-secondary"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                <div className="form-check form-switch d-flex align-items-center justify-content-between p-0">
                  <label className="form-check-label text-warning small fw-bold d-flex align-items-center gap-2 m-0" htmlFor="simulateFailureToggle">
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
                <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                  Toggle ON to simulate a bank-declined transaction for testing error boundaries and user notifications.
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
                    <span>Pay ${grandTotal.toFixed(2)} & Confirm</span>
                  </>
                )}
              </button>
            </form>
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
                <span className="text-white">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-2">
                <span>Convenience Fee:</span>
                <span className="text-white">${convenienceFee.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-top border-secondary border-opacity-50 d-flex justify-content-between align-items-center">
              <div>
                <div className="text-white fw-bold fs-5">Total Payable</div>
                <div className="text-muted small">Inclusive of all cinema taxes</div>
              </div>
              <div className="fs-3 fw-bold text-danger font-heading">
                ${grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;

