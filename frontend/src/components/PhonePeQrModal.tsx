import React, { useState } from 'react';
import {
  Smartphone,
  AlertTriangle,
  Clock,
  X,
  CheckCircle2,
  Copy,
  Check,
  Send,
  RefreshCw,
  Info,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api.js';

interface PhonePeQrModalProps {
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
  onSubmitted: (bookingId: string) => void;
  onSwitchToAutomated?: () => void;
}

export const PhonePeQrModal: React.FC<PhonePeQrModalProps> = ({
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
  onSubmitted,
  onSwitchToAutomated,
}) => {
  const [utrNumber, setUtrNumber] = useState('');
  const [payerUpiId, setPayerUpiId] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Personal Static PhonePe QR Code image
  const phonePeQrSrc = '/images/phonepe-personal-qr.jpeg';

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

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      setErrorMessage('Booking has not been initialized. Please try again.');
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
      const res = await api.post('/payments/phonepe/submit', {
        bookingId,
        utrNumber: trimmedUtr,
        payerUpiId: payerUpiId.trim() || undefined,
        customerNotes: customerNotes.trim() || undefined,
      });

      if (res.data.success) {
        setStatusMessage(
          'Verification details submitted! Your booking is now pending administrator review against our statement.'
        );
        setTimeout(() => {
          onSubmitted(bookingId);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit payment details. Please check the UTR and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!bookingId) return;
    setIsCheckingStatus(true);
    setErrorMessage(null);

    try {
      const res = await api.get(`/payments/status/${bookingId}`);
      if (res.data.status === 'confirmed') {
        setStatusMessage('Payment verified and booking confirmed! Redirecting to your ticket...');
        setTimeout(() => {
          onSubmitted(bookingId);
        }, 1200);
      } else if (res.data.status === 'rejected') {
        setErrorMessage(res.data.message || 'Payment verification was rejected by administrator.');
      } else if (res.data.status === 'pending_verification') {
        setStatusMessage(res.data.message || 'Payment verification request is currently under admin review.');
      } else {
        setStatusMessage('Payment details have not been submitted yet. Please scan the QR and enter your UTR.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Could not check status.');
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
            <div className="p-2.5 bg-purple-600/20 border border-purple-500/40 text-purple-400 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  PhonePe QR — Manual Verification
                </h2>
              </div>
              <p className="text-xs text-cinema-400">
                Personal Static UPI QR &bull; Requires manual admin audit before ticket confirmation
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
          {/* Important Static QR Disclaimer Alert */}
          <div className="p-4 bg-purple-950/50 border border-purple-500/40 rounded-2xl flex items-start gap-3 text-xs text-purple-200 leading-relaxed shadow-sm">
            <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-bold block mb-1">
                Notice: Static Personal QR Code
              </strong>
              This is a personal static PhonePe QR code, not an automated payment gateway. Please ensure your UPI app pays the <strong>exact amount of ₹{totalAmount}</strong>. If your UPI app does not prefill the amount, enter exactly ₹{totalAmount} before paying. Your booking will remain in <em>pending verification</em> until an administrator audits the 12-digit UTR against our bank statement. Tickets are never issued from scans alone.
            </div>
          </div>

          {/* Prominent Amount & Reference Card */}
          <div className="p-4 bg-cinema-850/90 border border-cinema-750 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-cinema-400 uppercase tracking-wider block">
                Exact Amount to Pay
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
                      <span>Copy Amount</span>
                    </>
                  )}
                </button>
              </div>

              {bookingReference && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-cinema-400 font-mono">
                    Booking Ref: <strong className="text-cinema-200">{bookingReference}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="text-[10px] text-cinema-400 hover:text-white underline cursor-pointer"
                  >
                    {copiedRef ? 'Copied' : 'Copy'}
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
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-cinema-850 to-cinema-900 border border-cinema-750 rounded-3xl space-y-4">
            <div className="px-3 py-1 bg-purple-950/60 border border-purple-700/60 rounded-full text-center">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                Payee: PRANAY GAVHADE &bull; PhonePe UPI
              </span>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-purple-500/40 max-w-[260px] w-full aspect-square flex items-center justify-center overflow-hidden">
              <img
                src={phonePeQrSrc}
                alt="Personal PhonePe Payment QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-white">
                1. Scan QR in PhonePe / GPay &bull; 2. Verify amount is ₹{totalAmount} &bull; 3. Complete payment
              </p>
              <p className="text-[11px] text-cinema-400 max-w-sm">
                After paying, locate the 12-digit UTR in your payment receipt and enter it below.
              </p>
            </div>
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div className="p-4 bg-cinema-800 border border-amber-500/50 text-amber-200 text-xs rounded-2xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 bg-crimson-950/70 border border-crimson-600 text-crimson-200 text-xs rounded-2xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* UTR Submission Form */}
          <div className="p-5 bg-cinema-850/90 border border-cinema-750 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Step 2: Submit 12-Digit UTR for Verification
                </h3>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-950/50 border border-amber-600/30 px-2 py-0.5 rounded font-mono">
                Required
              </span>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-cinema-300 block mb-1">
                  12-Digit UTR / UPI Transaction Reference:
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. 428719283741"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                  className="w-full px-4 py-2.5 bg-cinema-900 border border-cinema-700 focus:border-purple-500 rounded-xl text-white text-sm font-mono tracking-wider placeholder-cinema-600 focus:outline-none transition"
                  required
                />
                <span className="text-[10px] text-cinema-500 block mt-1">
                  Find the 12-digit number labeled &quot;UTR&quot; or &quot;UPI Ref No&quot; on your PhonePe/UPI payment receipt.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-cinema-300 block mb-1">
                  Your PhonePe Name or UPI ID (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. customer@ybl or 9876543210"
                  value={payerUpiId}
                  onChange={(e) => setPayerUpiId(e.target.value)}
                  className="w-full px-4 py-2 bg-cinema-900 border border-cinema-700 focus:border-purple-500 rounded-xl text-white text-xs placeholder-cinema-600 focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || utrNumber.trim().length < 6}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting UTR Verification...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Paid — Submit UTR for Admin Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Switch to Automated Razorpay Checkout */}
          {onSwitchToAutomated && (
            <div className="pt-2 border-t border-cinema-800 flex items-center justify-between text-xs text-cinema-400">
              <span>Prefer instant automated payment with dynamic QR?</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToAutomated();
                }}
                className="text-crimson-400 hover:text-crimson-300 font-semibold underline cursor-pointer"
              >
                Pay via Razorpay Checkout ↗
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
            <span>Check Approval Status</span>
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
