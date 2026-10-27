import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Ticket,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Smartphone,
  QrCode,
  Check,
} from 'lucide-react';
import api from '../services/api.js';
import { IShow, IShowSeat, IScreen, SeatCategory } from '../types/index.js';
import { SeatMap } from '../components/SeatMap.js';
import { useAuth } from '../context/AuthContext.js';
import { PhonePeQrModal } from '../components/PhonePeQrModal.js';
import { PaymentLifecycleModal, PaymentLifecycleStage } from '../components/PaymentLifecycleModal.js';

interface SelectedSeat {
  seatIdentifier: string;
  category: SeatCategory;
  price: number;
}

interface ActiveOrder {
  bookingId: string;
  bookingReference: string;
  orderId: string;
  amountInPaise: number;
  keyId: string;
  isRazorpayConfigured: boolean;
  paymentLinkUrl?: string | null;
  dynamicQrDataUrl?: string | null;
}

export const SeatSelectionPage: React.FC = () => {
  const { id: showId } = useParams<{ id: string }>();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState<any>(null);
  const [screen, setScreen] = useState<IScreen | null>(null);
  const [seats, setSeats] = useState<IShowSeat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocking, setIsLocking] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Active payment order and modal states
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [isPhonePeModalOpen, setIsPhonePeModalOpen] = useState(false);
  const [phonePeBooking, setPhonePeBooking] = useState<{
    bookingId: string;
    bookingReference: string;
    amount: number;
    expiresAt?: string;
  } | null>(null);
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);
  const [lifecycleStage, setLifecycleStage] = useState<PaymentLifecycleStage>('initiating');
  const [lifecycleErrorMessage, setLifecycleErrorMessage] = useState<string | null>(null);
  const [isCheckingStatusAgain, setIsCheckingStatusAgain] = useState(false);

  // Load show details and seats
  useEffect(() => {
    async function fetchShowSeats() {
      if (!showId) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/shows/${showId}/seats`);
        if (res.data.success) {
          setShow(res.data.show);
          setScreen(res.data.show.screen);
          setSeats(res.data.seats);
        }
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Failed to load seating layout.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchShowSeats();
  }, [showId]);

  // Lock countdown timer
  useEffect(() => {
    if (!lockExpiresAt) return;

    const interval = setInterval(() => {
      const diffMs = lockExpiresAt.getTime() - Date.now();
      const seconds = Math.max(0, Math.floor(diffMs / 1000));
      setRemainingSeconds(seconds);

      if (seconds <= 0) {
        clearInterval(interval);
        setLockExpiresAt(null);
        setActiveOrder(null);
        setSelectedSeats([]);
        setIsPhonePeModalOpen(false);
        setErrorMessage('Seat reservation expired. Please select your seats again.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  const handleToggleSeat = (seatIdentifier: string, category: SeatCategory, price: number) => {
    setErrorMessage(null);
    setActiveOrder(null);
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.seatIdentifier === seatIdentifier);
      if (exists) {
        return prev.filter((s) => s.seatIdentifier !== seatIdentifier);
      }
      if (prev.length >= 10) {
        setErrorMessage('You can select a maximum of 10 seats per booking.');
        return prev;
      }
      return [...prev, { seatIdentifier, category, price }];
    });
  };

  // Lock selected seats
  const handleLockSeats = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat to proceed.');
      return;
    }

    setIsLocking(true);
    setErrorMessage(null);

    try {
      const seatIds = selectedSeats.map((s) => s.seatIdentifier);
      const res = await api.post(`/shows/${showId}/lock-seats`, {
        seatIdentifiers: seatIds,
      });

      if (res.data.success) {
        const expiresAt = new Date(res.data.lockExpiresAt);
        setLockExpiresAt(expiresAt);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to hold seats. Someone else may have selected them.'
      );
    } finally {
      setIsLocking(false);
    }
  };

  // Ensure seats are locked and create active Razorpay order
  const ensureBookingOrder = async (): Promise<ActiveOrder | null> => {
    if (!user) {
      openAuthModal('login');
      return null;
    }

    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat to proceed.');
      return null;
    }

    // Reuse existing valid order if lock is active
    if (activeOrder && remainingSeconds && remainingSeconds > 0) {
      return activeOrder;
    }

    try {
      // 1. Lock seats if not locked yet
      if (!lockExpiresAt) {
        const lockRes = await api.post(`/shows/${showId}/lock-seats`, {
          seatIdentifiers: selectedSeats.map((s) => s.seatIdentifier),
        });
        if (lockRes.data.success) {
          setLockExpiresAt(new Date(lockRes.data.lockExpiresAt));
        }
      }

      // 2. Create Razorpay Payment Order on Backend
      const orderRes = await api.post('/payments/create-order', {
        showId,
        seatIdentifiers: selectedSeats.map((s) => s.seatIdentifier),
      });

      const {
        bookingId,
        bookingReference,
        orderId,
        amountInPaise,
        keyId,
        isRazorpayConfigured,
        paymentLinkUrl,
        dynamicQrDataUrl,
        expiresAt,
      } = orderRes.data;

      if (expiresAt) {
        setLockExpiresAt(new Date(expiresAt));
      }

      const orderData: ActiveOrder = {
        bookingId,
        bookingReference,
        orderId,
        amountInPaise,
        keyId,
        isRazorpayConfigured,
        paymentLinkUrl: paymentLinkUrl || null,
        dynamicQrDataUrl: dynamicQrDataUrl || null,
      };
      setActiveOrder(orderData);
      return orderData;
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Payment order initiation failed.');
      return null;
    }
  };

  // Launch Razorpay official checkout SDK
  const launchRazorpayCheckout = (orderData: ActiveOrder, method?: 'upi' | 'card') => {
    setIsPaymentProcessing(true);
    setErrorMessage(null);
    setLifecycleErrorMessage(null);
    setLifecycleStage('awaiting_payment');
    setIsLifecycleModalOpen(true);

    // If Razorpay public key is present and configured, trigger official modal
    if (orderData.isRazorpayConfigured && orderData.keyId && (window as any).Razorpay) {
      const cleanPhone = user?.phone ? user.phone.replace(/[^\d]/g, '') : '';
      const options: any = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: 'INR',
        name: 'iMovies Ticket Booking',
        description: `Booking ${orderData.bookingReference} - ${show?.movie?.title}`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: cleanPhone.length >= 8 && cleanPhone.length <= 14 ? cleanPhone : undefined,
          method: method === 'upi' ? 'upi' : method === 'card' ? 'card' : undefined,
        },
        theme: {
          color: '#E50914',
        },
        handler: async (response: any) => {
          setLifecycleStage('verifying');
          try {
            // Verify Payment Signature on Backend
            const verifyRes = await api.post('/payments/verify', {
              bookingId: orderData.bookingId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              method: method || 'razorpay',
            });

            if (verifyRes.data.success) {
              setLifecycleStage('success');
              setTimeout(() => {
                navigate(`/bookings/${orderData.bookingId}`);
              }, 1400);
            } else {
              setLifecycleStage('failed');
              setLifecycleErrorMessage('Payment verification failed.');
            }
          } catch (vErr: any) {
            setLifecycleStage('failed');
            setLifecycleErrorMessage(
              vErr.response?.data?.message || 'Payment signature verification failed.'
            );
          } finally {
            setIsPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaymentProcessing(false);
            setLifecycleStage('cancelled');
            setLifecycleErrorMessage(
              'Checkout window was dismissed. Your selected seats remain held so you can retry or choose another payment method.'
            );
          },
        },
      };

      // Set prefill method to guide user directly to selected category
      if (method === 'upi') {
        options.prefill.method = 'upi';
      } else if (method === 'card') {
        options.prefill.method = 'card';
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setLifecycleStage('failed');
        setLifecycleErrorMessage(
          response.error?.description || 'Payment was declined by the bank or provider.'
        );
        setIsPaymentProcessing(false);
      });
      rzp.open();
    } else {
      // Deterministic Sandbox Verification (when RAZORPAY_KEY_ID is awaiting live test credentials)
      setTimeout(async () => {
        setLifecycleStage('verifying');
        try {
          const testPaymentId = `pay_test_${Date.now()}`;
          const testSignature = `sig_test_valid_${Date.now()}`;

          const verifyRes = await api.post('/payments/verify', {
            bookingId: orderData.bookingId,
            orderId: orderData.orderId,
            paymentId: testPaymentId,
            signature: testSignature,
            method: method || 'sandbox_test',
          });

          if (verifyRes.data.success) {
            setLifecycleStage('success');
            setTimeout(() => {
              navigate(`/bookings/${orderData.bookingId}`);
            }, 1200);
          }
        } catch (verifyErr: any) {
          setLifecycleStage('failed');
          setLifecycleErrorMessage(verifyErr.response?.data?.message || 'Sandbox verification failed.');
        } finally {
          setIsPaymentProcessing(false);
        }
      }, 900);
    }
  };

  // Re-check payment status
  const handleCheckStatusAgain = async () => {
    if (!activeOrder?.bookingId) return;
    setIsCheckingStatusAgain(true);
    try {
      const res = await api.get(`/payments/status/${activeOrder.bookingId}`);
      if (res.data.status === 'confirmed') {
        setLifecycleStage('success');
        setTimeout(() => {
          navigate(`/bookings/${activeOrder.bookingId}`);
        }, 1200);
      } else if (res.data.status === 'expired' || res.data.status === 'failed') {
        setLifecycleStage('failed');
        setLifecycleErrorMessage(res.data.message || 'Payment failed or expired.');
      } else {
        setLifecycleStage('verifying');
        setLifecycleErrorMessage(null);
      }
    } catch (err: any) {
      setLifecycleErrorMessage(err.response?.data?.message || 'Could not verify payment status.');
    } finally {
      setIsCheckingStatusAgain(false);
    }
  };

  // Cancel reservation & release seats
  const handleCancelReservation = async () => {
    if (showId && selectedSeats.length > 0) {
      try {
        await api.post(`/shows/${showId}/unlock-seats`, {
          seatIdentifiers: selectedSeats.map((s) => s.seatIdentifier),
        });
      } catch (err) {
        console.warn('Unlock error:', err);
      }
    }
    setIsLifecycleModalOpen(false);
    setLockExpiresAt(null);
    setActiveOrder(null);
    setSelectedSeats([]);
  };

  // User proceeds to payment via official Razorpay Checkout SDK
  const handleContinueToPayment = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat to proceed.');
      return;
    }

    setIsPaymentProcessing(true);
    setErrorMessage(null);
    const orderData = await ensureBookingOrder();
    if (orderData) {
      launchRazorpayCheckout(orderData);
    } else {
      setIsPaymentProcessing(false);
    }
  };

  // User opens PhonePe QR manual verification modal
  const handleOpenPhonePeManualModal = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat to proceed.');
      return;
    }

    setIsPaymentProcessing(true);
    setErrorMessage(null);

    try {
      if (!lockExpiresAt) {
        const lockRes = await api.post(`/shows/${showId}/lock-seats`, {
          seatIdentifiers: selectedSeats.map((s) => s.seatIdentifier),
        });
        if (lockRes.data.success) {
          setLockExpiresAt(new Date(lockRes.data.lockExpiresAt));
        }
      }

      const res = await api.post('/payments/phonepe/create-order', {
        showId,
        seatIdentifiers: selectedSeats.map((s) => s.seatIdentifier),
      });

      if (res.data.success) {
        setPhonePeBooking({
          bookingId: res.data.bookingId,
          bookingReference: res.data.bookingReference,
          amount: res.data.amount,
          expiresAt: res.data.expiresAt,
        });
        if (res.data.expiresAt) {
          setLockExpiresAt(new Date(res.data.expiresAt));
        }
        setIsPhonePeModalOpen(true);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to initiate PhonePe QR order.');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  // Pricing calculations
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const ticketCount = selectedSeats.length;
  const convenienceFee = (show?.convenienceFee || 30) * ticketCount;
  const taxes = Math.round(convenienceFee * ((show?.taxPercentage || 18) / 100));
  const totalAmount = subtotal + convenienceFee + taxes;

  const formattedTimer = remainingSeconds
    ? `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-cinema-900 rounded-2xl" />
        <div className="h-96 bg-cinema-900 rounded-3xl" />
      </div>
    );
  }

  if (!show || !screen) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 sm:p-10 text-center bg-cinema-900 border border-cinema-750 rounded-3xl space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-crimson-600/15 border border-crimson-500/30 text-crimson-500 rounded-2xl mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">Showtime Unavailable</h2>
            <p className="text-sm text-cinema-300">
              {errorMessage || 'This showtime is no longer active or the screening ID is invalid.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-xl text-xs transition shadow-glow-crimson-sm cursor-pointer"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate('/movies')}
              className="px-5 py-2.5 bg-cinema-850 hover:bg-cinema-800 text-cinema-200 hover:text-white border border-cinema-750 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Browse Movies
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Show & Cinema Header Bar */}
      <div className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go Back"
            className="p-2.5 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-cinema-300 hover:text-white transition border border-cinema-750 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">{show.movie?.title || 'Selected Showtime'}</h1>
            <p className="text-xs text-cinema-400 mt-0.5">
              {show.cinema?.name || 'Multiplex'} • {screen?.name || 'Screen 1'} ({show.format || '2D'})
            </p>
          </div>
        </div>

        {/* Date & Time pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-cinema-850 border border-cinema-750 rounded-xl text-center">
            <span className="text-[10px] text-cinema-400 uppercase font-semibold block">Date</span>
            <span className="text-xs font-bold text-white">{show.date}</span>
          </div>
          <div className="px-4 py-2 bg-cinema-850 border border-cinema-750 rounded-xl text-center">
            <span className="text-[10px] text-cinema-400 uppercase font-semibold block">Time</span>
            <span className="text-xs font-bold text-crimson-400">
              {new Date(show.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Live Seat Lock Timer Banner */}
      {formattedTimer && (
        <div className="flex items-center justify-between p-4 bg-crimson-950/60 border border-crimson-600/40 rounded-2xl text-white animate-pulse shadow-glow-crimson-sm">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-crimson-500 animate-spin" />
            <div>
              <span className="text-sm font-bold">Seats Reserved For You</span>
              <p className="text-xs text-cinema-300">
                Complete your payment before the timer expires to confirm your reservation.
              </p>
            </div>
          </div>
          <div className="text-2xl font-black text-crimson-400 font-mono tracking-wider">
            {formattedTimer}
          </div>
        </div>
      )}

      {/* Error notification banner */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-crimson-950/80 border border-crimson-900 rounded-2xl text-crimson-200 text-sm">
          <AlertCircle className="w-5 h-5 text-crimson-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Interactive Seat Map & Checkout Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Seat Map Panel */}
        <div className="lg:col-span-2 bg-cinema-900 border border-cinema-800 rounded-3xl p-6 sm:p-8">
          <SeatMap
            showId={showId || show._id || show.id}
            screen={screen}
            seats={seats}
            selectedSeatIds={selectedSeats.map((s) => s.seatIdentifier)}
            onToggleSeat={handleToggleSeat}
            currentUserId={user?.id}
          />
        </div>

        {/* Booking Summary & Checkout Card */}
        <div className="bg-cinema-900 border border-cinema-800 rounded-3xl p-6 space-y-6 sticky top-24">
          <div className="flex items-center justify-between border-b border-cinema-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-crimson-500" />
              Booking Summary
            </h3>
            <span className="text-xs px-2.5 py-1 bg-crimson-600/20 text-crimson-400 font-bold rounded-full">
              {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
            </span>
          </div>

          {/* Selected Seats Chips */}
          <div>
            <label className="text-xs font-semibold text-cinema-400 uppercase tracking-wider block mb-2">
              Selected Seats
            </label>
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <span
                    key={seat.seatIdentifier}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cinema-850 border border-crimson-600/40 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <span>{seat.seatIdentifier}</span>
                    <span className="text-[10px] text-cinema-400">({seat.category})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-cinema-500 italic">No seats selected yet. Click on the seats above.</p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 pt-4 border-t border-cinema-800 text-sm">
            <div className="flex justify-between text-cinema-300">
              <span>Subtotal ({ticketCount} seats)</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-cinema-400 text-xs">
              <span>Convenience Fee (₹{show.convenienceFee || 30}/seat)</span>
              <span>₹{convenienceFee}</span>
            </div>
            <div className="flex justify-between text-cinema-400 text-xs">
              <span>Integrated GST ({show.taxPercentage || 18}%)</span>
              <span>₹{taxes}</span>
            </div>
            <div className="flex justify-between text-white font-black text-lg pt-3 border-t border-cinema-800">
              <span>Amount Payable</span>
              <span className="text-crimson-500">₹{totalAmount}</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-3 pt-4 border-t border-cinema-800">
            <button
              type="button"
              onClick={handleContinueToPayment}
              disabled={isPaymentProcessing || selectedSeats.length === 0}
              className="w-full py-4 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white font-black rounded-2xl transition shadow-glow-crimson flex items-center justify-center gap-2 text-base cursor-pointer tracking-wide"
            >
              <CreditCard className="w-5 h-5" />
              <span>
                {isPaymentProcessing
                  ? 'Preparing Payment...'
                  : selectedSeats.length === 0
                  ? 'Select Seats to Continue'
                  : `Continue to Payment — ₹${totalAmount}`}
              </span>
            </button>

            {/* Separate Manual PhonePe QR Option */}
            {selectedSeats.length > 0 && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleOpenPhonePeManualModal}
                  disabled={isPaymentProcessing}
                  className="text-xs text-cinema-400 hover:text-purple-400 underline transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                  <span>PhonePe QR — Manual Verification</span>
                </button>
              </div>
            )}

            {/* Active Seat Lock Timer Display */}
            {remainingSeconds !== null && remainingSeconds > 0 && (
              <div className="p-3 bg-cinema-850/60 border border-cinema-800 rounded-xl flex items-center justify-between text-xs text-cinema-400">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>Seats Held for You</span>
                </div>
                <span className="font-mono font-bold text-white bg-cinema-800 px-2 py-0.5 rounded">
                  {formattedTimer}
                </span>
              </div>
            )}

            {/* Security Guarantee Badge */}
            <div className="p-3 bg-cinema-850/40 border border-cinema-800/60 rounded-xl flex items-center gap-2.5 text-xs text-cinema-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Official 256-bit encrypted checkout with instant seat confirmation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Separate Manual PhonePe QR Modal */}
      <PhonePeQrModal
        isOpen={isPhonePeModalOpen}
        onClose={() => setIsPhonePeModalOpen(false)}
        bookingId={phonePeBooking?.bookingId || activeOrder?.bookingId || null}
        bookingReference={phonePeBooking?.bookingReference || activeOrder?.bookingReference || null}
        totalAmount={phonePeBooking?.amount || totalAmount}
        movieTitle={show?.movie?.title}
        cinemaName={show?.cinema?.name}
        showTime={
          show?.startTime
            ? new Date(show.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : undefined
        }
        selectedSeats={selectedSeats.map((s) => s.seatIdentifier)}
        remainingSeconds={remainingSeconds}
        onSubmitted={(bId) => {
          setIsPhonePeModalOpen(false);
          navigate(`/bookings/${bId}`);
        }}
        onSwitchToAutomated={() => {
          setIsPhonePeModalOpen(false);
          handleContinueToPayment();
        }}
      />

      {/* Payment Lifecycle Modal (Stages 4, 5, 6, 7, 9) */}
      <PaymentLifecycleModal
        isOpen={isLifecycleModalOpen}
        stage={lifecycleStage}
        paymentMethod="upi"
        bookingReference={activeOrder?.bookingReference}
        bookingId={activeOrder?.bookingId}
        totalAmount={totalAmount}
        movieTitle={show?.movie?.title}
        errorMessage={lifecycleErrorMessage}
        remainingSeconds={remainingSeconds}
        onRetry={() => {
          if (activeOrder) {
            launchRazorpayCheckout(activeOrder);
          }
        }}
        onChangeMethod={() => setIsLifecycleModalOpen(false)}
        onCancelReservation={handleCancelReservation}
        onViewTicket={() => {
          setIsLifecycleModalOpen(false);
          if (activeOrder?.bookingId) {
            navigate(`/bookings/${activeOrder.bookingId}`);
          }
        }}
        onCheckStatusAgain={handleCheckStatusAgain}
        isCheckingStatus={isCheckingStatusAgain}
        onClose={() => setIsLifecycleModalOpen(false)}
      />
    </div>
  );
};
