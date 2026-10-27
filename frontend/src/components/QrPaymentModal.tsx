import React, { useState } from 'react';
import {
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Smartphone,
  CreditCard,
  Copy,
  Check,
  Send,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api.js';

interface QrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  bookingReference: string | null;
  totalAmount: number;
  movieTitle?: string;
  cinemaName?: string;
  showTime?: string;
  selectedSeats: string[];
  remainingSeconds: number | null;
  onPaymentSuccess?: (bookingId: string) => void;
  onSubmitted?: (bookingId: string) => void;
  onLaunchRazorpay?: (method?: 'upi' | 'card') => void;
}

export const QrPaymentModal: React.FC<QrPaymentModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingReference,
  totalAmount,
  movieTitle,
  cinemaName,
  showTime,
  selectedSeats,
  remainingSeconds,
  onPaymentSuccess,
  onSubmitted,
  onLaunchRazorpay,
}) => {
  const [utrNumber, setUtrNumber] = useState('');
  const [payerUpiId, setPayerUpiId] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'pending' | 'success' | 'error'>('info');

  if (!isOpen) return null;

  // Pranay Gavhade's uploaded UPI QR code
  const upiQrImageSrc = '/images/upi-qr-code.jpg';

  const formattedTimer = remainingSeconds
    ? `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`
    : '00:00';

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(totalAmount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleCopyRef = () => {
    if (bookingReference) {
      navigator.clipboard.writeText(bookingReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // Submit UTR reference
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      setErrorMessage('Booking has not been initialized. Please select seats and try again.');
      return;
    }

    const trimmedUtr = utrNumber.trim();
    if (!trimmedUtr || trimmedUtr.length < 6) {
      setErrorMessage('Please enter a valid 12-digit UTR Number or UPI Transaction Reference ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/payments/upi-qr/submit', {
        bookingId,
        utrNumber: trimmedUtr,
        payerUpiId: payerUpiId.trim() || undefined,
        customerNotes: customerNotes.trim() || undefined,
      });

      if (res.data.success) {
        setSubmitSuccess(true);
        setStatusMessage(
          'Verification details submitted successfully! An administrator will review your transaction and confirm your ticket.'
        );
        setTimeout(() => {
          if (onSubmitted) {
            onSubmitted(bookingId);
          } else if (onPaymentSuccess) {
            onPaymentSuccess(bookingId);
          }
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit payment details. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-check payment status
  const handleCheckStatus = async () => {
    if (!bookingId) {
      setStatusMessage('Order has not been initialized yet. Please try again.');
      setStatusType('error');
      return;
    }

    setIsCheckingStatus(true);
    setStatusMessage(null);

    try {
      const res = await api.get(`/payments/status/${bookingId}`);

      if (res.data.status === 'confirmed') {
        setStatusType('success');
        setStatusMessage('Payment verified successfully! Redirecting to your confirmed ticket...');
        setTimeout(() => {
          if (onPaymentSuccess) {
            onPaymentSuccess(bookingId);
          } else if (onSubmitted) {
            onSubmitted(bookingId);
          }
        }, 1200);
      } else if (res.data.status === 'rejected') {
        setStatusType('error');
        setStatusMessage(res.data.message || 'Payment verification was rejected.');
      } else if (res.data.status === 'expired') {
        setStatusType('error');
        setStatusMessage('Seat reservation has expired. Please reselect your seats.');
      } else {
        setStatusType('pending');
        setStatusMessage(
          res.data.message ||
            'Payment is pending verification. Please submit your 12-digit UTR number below after completing the transfer.'
        );
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(
        err.response?.data?.message || 'Could not verify payment status. Please try again.'
      );
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-cinema-900 border border-cinema-750 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-cinema-800 bg-cinema-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-crimson-600/15 border border-crimson-500/30 text-crimson-500 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Pay using UPI QR Code
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                  All UPI Apps
                </span>
              </div>
              <p className="text-xs text-cinema-400">
                Scan with Google Pay, PhonePe, Paytm, BHIM, Cred, or any UPI app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-cinema-400 hover:text-white rounded-lg hover:bg-cinema-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Prominent Amount & Reference Card */}
          <div className="p-4 bg-cinema-850 border border-cinema-750 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-cinema-400 uppercase tracking-wider block">
                Total Amount to Pay
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ₹{totalAmount}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  className="px-2 py-1 bg-cinema-800 hover:bg-cinema-750 border border-cinema-700 text-cinema-300 hover:text-white rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedAmount ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {bookingReference && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-cinema-400 font-mono">
                    Ref: <strong className="text-cinema-200">{bookingReference}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="text-[10px] text-cinema-400 hover:text-white underline cursor-pointer"
                  >
                    {copiedRef ? 'Copied' : 'Copy Ref'}
                  </button>
                </div>
              )}
            </div>

            {/* Lock countdown & Seats */}
            <div className="sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Seats Held: {formattedTimer}</span>
              </div>
              <span className="text-[10px] text-cinema-400 block mt-1">
                {selectedSeats.length} seat(s): {selectedSeats.join(', ')}
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-cinema-850 to-cinema-900 border border-cinema-750 rounded-3xl space-y-4 shadow-inner">
            {/* Payee Badge */}
            <div className="px-3 py-1 bg-cinema-800/90 border border-cinema-700 rounded-full text-center">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Payee: PRANAY GAVHADE
              </span>
            </div>

            {/* Uploaded QR Code Image */}
            <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-cinema-700 max-w-[280px] w-full aspect-square flex items-center justify-center overflow-hidden">
              <img
                src={upiQrImageSrc}
                alt="Pranay Gavhade UPI QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Supported UPI Apps Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Cred', 'Any Bank UPI'].map((app) => (
                <span
                  key={app}
                  className="px-2.5 py-0.5 bg-cinema-800 border border-cinema-700/60 rounded-full text-[10px] font-semibold text-cinema-300 flex items-center gap-1"
                >
                  <Smartphone className="w-3 h-3 text-crimson-400" />
                  {app}
                </span>
              ))}
            </div>

            {/* Scanning Instructions */}
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-white">
                1. Open any UPI App &bull; 2. Scan QR &bull; 3. Pay exact ₹{totalAmount}
              </p>
              <p className="text-[11px] text-cinema-400 max-w-sm">
                After completing the payment in your UPI app, enter your 12-digit UTR number below to confirm.
              </p>
            </div>
          </div>

          {/* Status Alert (if present) */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed ${
                statusType === 'success'
                  ? 'bg-emerald-950/70 border border-emerald-600 text-emerald-200'
                  : statusType === 'pending'
                  ? 'bg-cinema-800/90 border border-amber-500/50 text-amber-200'
                  : 'bg-crimson-950/70 border border-crimson-600 text-crimson-200'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : statusType === 'pending' ? (
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{statusMessage}</span>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 bg-crimson-950/70 border border-crimson-600 text-crimson-200 text-xs rounded-2xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* UTR Submission Form ("I Have Paid") */}
          <div className="p-5 bg-cinema-850/90 border border-cinema-750 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Step 2: Enter UPI Transaction ID (UTR)
                </h3>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-950/50 border border-amber-600/30 px-2 py-0.5 rounded font-mono">
                Required
              </span>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-cinema-300 block mb-1">
                  12-Digit UTR Number / UPI Ref ID:
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. 428719283741"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                  className="w-full px-4 py-2.5 bg-cinema-900 border border-cinema-700 focus:border-crimson-500 rounded-xl text-white text-sm font-mono tracking-wider placeholder-cinema-600 focus:outline-none transition"
                  required
                />
                <span className="text-[10px] text-cinema-500 block mt-1">
                  Look in your UPI app (PhonePe / GPay / Paytm) payment receipt for the 12-digit number labeled &quot;UTR&quot; or &quot;UPI Ref No&quot;.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-cinema-300 block mb-1">
                  Your UPI ID or Phone (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okaxis or 9876543210"
                  value={payerUpiId}
                  onChange={(e) => setPayerUpiId(e.target.value)}
                  className="w-full px-4 py-2 bg-cinema-900 border border-cinema-700 focus:border-crimson-500 rounded-xl text-white text-xs placeholder-cinema-600 focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || utrNumber.trim().length < 6}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting UTR Verification...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Paid — Submit UTR for Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Fallback to Card Checkout */}
          {onLaunchRazorpay && (
            <div className="pt-2 border-t border-cinema-800 flex items-center justify-between text-xs text-cinema-400">
              <span>Prefer instant online card checkout instead?</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchRazorpay('card');
                }}
                className="text-crimson-400 hover:text-crimson-300 font-semibold underline cursor-pointer"
              >
                Pay via Card ↗
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-cinema-800 bg-cinema-950/90 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            className="px-4 py-2 bg-cinema-850 hover:bg-cinema-800 border border-cinema-750 text-cinema-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            <span>Check Status Again</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-cinema-400 hover:text-white transition"
          >
            Close & Keep Seats Held
          </button>
        </div>
      </div>
    </div>
  );
};
