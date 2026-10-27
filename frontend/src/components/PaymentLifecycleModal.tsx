import React, { useEffect, useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowRight,
  Smartphone,
  CreditCard,
  QrCode,
  Ticket,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type PaymentLifecycleStage =
  | 'initiating'
  | 'awaiting_payment'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'cancelled';

interface PaymentLifecycleModalProps {
  isOpen: boolean;
  stage: PaymentLifecycleStage;
  paymentMethod: 'upi' | 'qr' | 'phonepe' | 'card';
  bookingReference?: string | null;
  bookingId?: string | null;
  totalAmount: number;
  movieTitle?: string;
  errorMessage?: string | null;
  remainingSeconds?: number | null;
  onRetry: () => void;
  onChangeMethod: () => void;
  onCancelReservation: () => void;
  onViewTicket: () => void;
  onCheckStatusAgain: () => void;
  isCheckingStatus?: boolean;
  onClose: () => void;
}

export const PaymentLifecycleModal: React.FC<PaymentLifecycleModalProps> = ({
  isOpen,
  stage,
  paymentMethod,
  bookingReference,
  bookingId,
  totalAmount,
  movieTitle,
  errorMessage,
  remainingSeconds,
  onRetry,
  onChangeMethod,
  onCancelReservation,
  onViewTicket,
  onCheckStatusAgain,
  isCheckingStatus = false,
  onClose,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Progressive step indicator for Stage 6 (Processing & Verification)
  useEffect(() => {
    if (stage === 'initiating') {
      setActiveStep(1);
    } else if (stage === 'awaiting_payment') {
      setActiveStep(2);
    } else if (stage === 'verifying') {
      setActiveStep(3);
      const timer = setTimeout(() => {
        setActiveStep(4);
      }, 900);
      return () => clearTimeout(timer);
    } else if (stage === 'success') {
      setActiveStep(4);
    }
  }, [stage]);

  if (!isOpen) return null;

  const formattedTimer = remainingSeconds
    ? `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`
    : '00:00';

  const methodLabel =
    paymentMethod === 'upi'
      ? 'UPI Application'
      : paymentMethod === 'qr'
      ? 'UPI Dynamic QR'
      : paymentMethod === 'phonepe'
      ? 'PhonePe QR'
      : 'Card & Netbanking';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-cinema-900 border border-cinema-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-cinema-800 bg-cinema-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-crimson-600/15 border border-crimson-500/30 text-crimson-500 rounded-xl">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-cinema-400 block tracking-wider">
                Payment Lifecycle &bull; {methodLabel}
              </span>
              <h2 className="text-sm font-black text-white truncate max-w-[280px]">
                {movieTitle || 'Movie Ticket Booking'}
              </h2>
            </div>
          </div>

          {remainingSeconds && remainingSeconds > 0 && stage !== 'success' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold shrink-0">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>{formattedTimer}</span>
            </div>
          )}
        </div>

        {/* Content Body Based on Stage */}
        <div className="p-6 space-y-6">
          {/* STAGES 4, 5, 6: Initiating / Awaiting / Processing & Verifying */}
          {(stage === 'initiating' || stage === 'awaiting_payment' || stage === 'verifying') && (
            <div className="space-y-6 text-center">
              {/* Animated Spinner & Pulse Ring */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-crimson-600/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-2xl bg-cinema-850 border border-crimson-500/40 flex items-center justify-center shadow-glow-crimson-sm">
                  <Loader2 className="w-8 h-8 text-crimson-500 animate-spin" />
                </div>
              </div>

              {/* Status Headline */}
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">
                  {stage === 'initiating' && 'Initiating Secure Payment...'}
                  {stage === 'awaiting_payment' && 'Awaiting Payment Authorization...'}
                  {stage === 'verifying' && 'Verifying Transaction with Provider...'}
                </h3>
                <p className="text-xs text-cinema-300 max-w-sm mx-auto leading-relaxed">
                  {stage === 'initiating' &&
                    'Setting up verified transaction order and reserving your selected seats.'}
                  {stage === 'awaiting_payment' &&
                    `Please complete the authorization of ₹${totalAmount} in your ${methodLabel}.`}
                  {stage === 'verifying' &&
                    'Validating cryptographic HMAC signature, amount, and provider status.'}
                </p>
              </div>

              {/* 4-Step Progressive Timeline */}
              <div className="bg-cinema-850/80 border border-cinema-750 p-4 rounded-2xl text-left space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cinema-400 block border-b border-cinema-750 pb-2">
                  Verification Lifecycle
                </span>

                <div className="space-y-2.5 text-xs">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        activeStep >= 1
                          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                          : 'bg-cinema-800 text-cinema-500'
                      }`}
                    >
                      {activeStep > 1 ? '✓' : '1'}
                    </div>
                    <span className={activeStep >= 1 ? 'text-white font-medium' : 'text-cinema-500'}>
                      Order Initiated ({bookingReference || 'Pending'})
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        activeStep >= 2
                          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                          : 'bg-cinema-800 text-cinema-500'
                      }`}
                    >
                      {activeStep > 2 ? '✓' : '2'}
                    </div>
                    <span className={activeStep >= 2 ? 'text-white font-medium' : 'text-cinema-500'}>
                      Waiting for Payment Confirmation
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        activeStep >= 3
                          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                          : 'bg-cinema-800 text-cinema-500'
                      }`}
                    >
                      {activeStep > 3 ? '✓' : '3'}
                    </div>
                    <span className={activeStep >= 3 ? 'text-white font-medium' : 'text-cinema-500'}>
                      Verifying Cryptographic HMAC Signature & Amount
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        activeStep >= 4
                          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                          : 'bg-cinema-800 text-cinema-500'
                      }`}
                    >
                      {activeStep >= 4 ? '✓' : '4'}
                    </div>
                    <span className={activeStep >= 4 ? 'text-white font-medium' : 'text-cinema-500'}>
                      Finalizing Booking & Issuing E-Ticket
                    </span>
                  </div>
                </div>
              </div>

              {/* Security info & delayed status button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cinema-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>256-bit encrypted validation</span>
                </span>
                <button
                  type="button"
                  onClick={onCheckStatusAgain}
                  disabled={isCheckingStatus}
                  className="hover:text-white underline transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  <span>Check status again</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 7: Payment Success */}
          {stage === 'success' && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">Payment Verified!</h3>
                <p className="text-xs text-emerald-300/90 max-w-sm mx-auto">
                  Your payment of <strong className="text-white">₹{totalAmount}</strong> has been confirmed. Your ticket has been issued with unique entrance barcode.
                </p>
              </div>

              <div className="p-4 bg-cinema-850 border border-cinema-750 rounded-2xl space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-cinema-400 block">Booking Reference</span>
                <span className="text-lg font-black text-crimson-400 font-mono tracking-wider">
                  {bookingReference}
                </span>
              </div>

              <button
                type="button"
                onClick={onViewTicket}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <span>View Confirmed E-Ticket</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STAGE 9: Payment Failure / Cancelled */}
          {(stage === 'failed' || stage === 'cancelled') && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-crimson-600/20 border border-crimson-500/40 text-crimson-500 mx-auto flex items-center justify-center shadow-glow-crimson-sm">
                <XCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">
                  {stage === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
                </h3>
                <p className="text-xs text-cinema-300 max-w-sm mx-auto leading-relaxed">
                  {errorMessage ||
                    (stage === 'cancelled'
                      ? 'You dismissed or cancelled the checkout session before completing authorization.'
                      : 'The payment provider could not complete this transaction or the authorization failed.')}
                </p>
              </div>

              {/* Protective hold message */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-200/90 text-left">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-0.5">Your seats are still held:</strong>
                  Your booking is not confirmed, but your selected seats remain held for{' '}
                  <strong className="text-white font-mono">{formattedTimer}</strong>. You can retry immediately or switch payment methods without losing your seats.
                </div>
              </div>

              {/* 3 Explicit Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={onRetry}
                  className="w-full py-3.5 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-glow-crimson cursor-pointer text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again ({methodLabel})</span>
                </button>

                <button
                  type="button"
                  onClick={onChangeMethod}
                  className="w-full py-3 bg-cinema-850 hover:bg-cinema-800 text-cinema-200 hover:text-white border border-cinema-750 font-semibold rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Choose Another Payment Method</span>
                </button>

                <button
                  type="button"
                  onClick={onCancelReservation}
                  className="w-full py-2.5 text-cinema-400 hover:text-crimson-400 text-xs font-medium transition cursor-pointer"
                >
                  Cancel Reservation & Release Seats
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
