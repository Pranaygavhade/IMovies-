import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Printer,
  Film,
  MapPin,
  Calendar,
  Clock,
  Ticket,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Smartphone,
  ShieldCheck,
  Eye,
  Download,
  X,
  Share2,
} from 'lucide-react';
import api from '../services/api.js';
import { IBooking } from '../types/index.js';
import { getPosterUrl, handleImageError } from '../utils/tmdbImage.js';

export const BookingConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const fetchBooking = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/bookings/${id}`);
      if (res.data.success) {
        setBooking(res.data.booking);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load booking confirmation.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleRefreshStatus = async () => {
    if (!id) return;
    setIsRefreshing(true);
    setStatusMessage(null);
    try {
      const res = await api.get(`/payments/status/${id}`);
      if (res.data.status === 'confirmed') {
        setStatusMessage('Your payment has been verified and ticket confirmed!');
      } else if (res.data.status === 'rejected') {
        setStatusMessage(res.data.message || 'Payment verification was rejected.');
      } else {
        setStatusMessage(res.data.message || 'Verification is still under review.');
      }
      await fetchBooking();
    } catch (err: any) {
      setStatusMessage(err.response?.data?.message || 'Could not refresh status.');
      setIsRefreshing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-24 bg-cinema-900 rounded-3xl" />
        <div className="h-96 bg-cinema-900 rounded-3xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-cinema-900 border border-cinema-800 rounded-3xl p-8 space-y-4">
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <p className="text-xs text-cinema-400">{error || 'Could not locate this ticket reservation.'}</p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-crimson-600 text-white font-semibold rounded-xl text-xs"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const show: any = booking.showId;
  const movie: any = booking.movieId;
  const cinema: any = booking.cinemaId;
  const screen: any = booking.screenId;

  const isConfirmed = booking.status === 'confirmed' || booking.status === 'paid';
  const isPendingVerification = booking.status === 'pending_verification';
  const isRejected = booking.status === 'rejected';

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      {/* Back button and Print Action */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/my-bookings"
          className="flex items-center gap-2 text-xs font-semibold text-cinema-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          My Bookings
        </Link>

        {isConfirmed ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-crimson-900/30 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              View Ticket Pass
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-cinema-850 hover:bg-cinema-800 border border-cinema-750 text-cinema-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Download
            </button>
          </div>
        ) : (
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-cinema-850 hover:bg-cinema-800 border border-cinema-750 text-cinema-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        )}
      </div>

      {/* Status Notice Toast */}
      {statusMessage && (
        <div className="p-4 bg-cinema-850 border border-cinema-750 text-cinema-200 text-xs rounded-2xl flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-cinema-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Confirmation / Status Header Banner */}
      {isConfirmed && (
        <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-3xl p-6 sm:p-8 flex items-center gap-5 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl shrink-0">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              Confirmed & Verified
            </span>
            <h1 className="text-2xl font-black text-white">Ticket Booking Confirmed!</h1>
            <p className="text-xs text-cinema-300 mt-1">
              Your booking reference is{' '}
              <span className="font-mono font-bold text-white tracking-wider">
                {booking.bookingReference}
              </span>
            </p>
          </div>
        </div>
      )}

      {isPendingVerification && (
        <div className="bg-purple-950/40 border border-purple-600/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl shrink-0">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-1">
                Awaiting Admin Verification
              </span>
              <h1 className="text-2xl font-black text-white">Payment Under Review</h1>
              <p className="text-xs text-cinema-300 mt-1">
                UTR / Ref:{' '}
                <strong className="text-amber-400 font-mono">
                  {booking.manualPayment?.utrNumber || 'Submitted'}
                </strong>{' '}
                &bull; Booking Ref:{' '}
                <strong className="text-white font-mono">{booking.bookingReference}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Check Approval Status</span>
          </button>
        </div>
      )}

      {isRejected && (
        <div className="bg-crimson-950/40 border border-crimson-600/40 rounded-3xl p-6 sm:p-8 flex items-center gap-5 shadow-[0_0_30px_rgba(229,9,20,0.15)]">
          <div className="p-3 bg-crimson-500/20 text-crimson-400 rounded-2xl shrink-0">
            <XCircle className="w-10 h-10" />
          </div>
          <div>
            <span className="text-xs font-bold text-crimson-400 uppercase tracking-widest block mb-1">
              Payment Verification Declined
            </span>
            <h1 className="text-2xl font-black text-white">Booking Not Confirmed</h1>
            <p className="text-xs text-cinema-300 mt-1">
              Reason: {booking.cancellationReason || 'Payment could not be verified on PhonePe statement.'}
            </p>
          </div>
        </div>
      )}

      {/* Cinematic Ticket Card with Perforation styling */}
      <div className="relative bg-cinema-900 border border-cinema-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top Ticket Header Banner */}
        <div className="p-6 sm:p-8 bg-cinema-850 border-b border-cinema-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-cinema-750 shadow-md">
              <img
                src={getPosterUrl(movie?.posterPath, 'w342')}
                alt={movie?.title}
                onError={(e) => handleImageError(e, 'poster')}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="px-2.5 py-0.5 bg-crimson-600 text-white font-bold text-[10px] rounded uppercase tracking-wider mb-2 inline-block">
                {show?.format || '2D'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {movie?.title}
              </h2>
              <p className="text-xs text-cinema-400 mt-1">
                {movie?.genres?.join(' • ')} • {movie?.runtime} min • {show?.language || 'English'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] text-cinema-400 uppercase font-semibold block">
              Booking Ref
            </span>
            <span className="text-base font-black text-crimson-400 font-mono tracking-wider">
              {booking.bookingReference}
            </span>
            <span className="text-[10px] font-bold uppercase block mt-1 text-cinema-400">
              Status: <strong className="text-white">{booking.status.replace('_', ' ')}</strong>
            </span>
          </div>
        </div>

        {/* Perforated Divider line */}
        <div className="relative border-t-2 border-dashed border-cinema-800 my-0">
          <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-cinema-950 border border-cinema-800" />
          <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-cinema-950 border border-cinema-800" />
        </div>

        {/* Ticket Details & QR Code */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Cinema & Schedule Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-semibold text-cinema-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-crimson-500" />
                  Date
                </span>
                <span className="text-sm font-bold text-white">{show?.date}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-cinema-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-crimson-500" />
                  Showtime
                </span>
                <span className="text-sm font-bold text-white">
                  {show?.startTime
                    ? new Date(show.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'Scheduled'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-semibold text-cinema-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Film className="w-3.5 h-3.5 text-crimson-500" />
                  Cinema & Screen
                </span>
                <span className="text-sm font-bold text-white block">{cinema?.name}</span>
                <span className="text-xs text-cinema-400">{screen?.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-cinema-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Ticket className="w-3.5 h-3.5 text-crimson-500" />
                  Reserved Seats ({booking.ticketCount})
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {booking.seats.map((seat) => (
                    <span
                      key={seat.seatIdentifier}
                      className="px-2 py-0.5 bg-cinema-850 border border-cinema-750 text-white rounded text-xs font-bold"
                    >
                      {seat.seatIdentifier}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-cinema-800/80 flex items-center justify-between text-xs text-cinema-400">
              <span>Method: {booking.paymentMethod?.replace('_', ' ') || 'Online Payment'}</span>
              <span className="font-bold text-white text-sm">Total: ₹{booking.totalAmount}</span>
            </div>
          </div>

          {/* Entrance QR Code Area */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-cinema-700/50 shadow-inner">
            {isConfirmed && booking.qrCodeDataUrl ? (
              <>
                <img
                  src={booking.qrCodeDataUrl}
                  alt="Ticket Entry QR Code"
                  className="w-36 h-36 object-contain"
                />
                <span className="text-[10px] font-mono font-bold text-gray-800 mt-2">
                  {booking.verificationCode}
                </span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                  Scan at cinema gate
                </span>
              </>
            ) : isPendingVerification ? (
              <div className="w-36 h-36 bg-purple-50 rounded-xl flex flex-col items-center justify-center text-center p-3 space-y-2 border border-purple-200">
                <Clock className="w-8 h-8 text-purple-600 animate-pulse" />
                <span className="text-[10px] font-bold text-purple-900 leading-tight">
                  Verification in Progress
                </span>
                <span className="text-[8px] text-purple-600">
                  Entrance QR activates after admin approval
                </span>
              </div>
            ) : (
              <div className="w-36 h-36 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-center p-3 space-y-2 border border-gray-200">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
                <span className="text-[10px] font-bold text-gray-700 leading-tight">
                  Not Verified
                </span>
                <span className="text-[8px] text-gray-500">
                  Ticket unconfirmed
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 no-print">
        <Link
          to="/"
          className="text-xs text-cinema-400 hover:text-white transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Homepage
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/movies"
            className="px-5 py-2.5 bg-cinema-850 hover:bg-cinema-800 border border-cinema-750 text-cinema-200 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            Explore More Movies
          </Link>
          <Link
            to="/my-bookings"
            className="px-5 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-crimson-900/30"
          >
            View All My Tickets
          </Link>
        </div>
      </div>

      {/* Cinematic Boarding Pass Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-cinema-900 border border-cinema-750 rounded-3xl overflow-hidden shadow-2xl space-y-0">
            {/* Header / Dismiss */}
            <div className="px-6 py-4 bg-cinema-850 border-b border-cinema-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-crimson-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Official Digital Entrance Pass
                </span>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1.5 text-cinema-400 hover:text-white rounded-lg hover:bg-cinema-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Boarding Pass Body */}
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-cinema-750 shadow">
                  <img
                    src={getPosterUrl(movie?.posterPath, 'w342')}
                    alt={movie?.title}
                    onError={(e) => handleImageError(e, 'poster')}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="px-2 py-0.5 bg-crimson-600/30 text-crimson-400 border border-crimson-600/40 text-[10px] font-bold rounded uppercase">
                    {show?.format || '2D'} &bull; {show?.language || 'English'}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1.5 leading-snug">
                    {movie?.title}
                  </h3>
                  <p className="text-xs text-cinema-400 mt-1">
                    {cinema?.name} &bull; {screen?.name}
                  </p>
                </div>
              </div>

              {/* Perforation line */}
              <div className="relative border-t-2 border-dashed border-cinema-800 -mx-6">
                <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-cinema-900" />
                <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-cinema-900" />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-3 text-center bg-cinema-850/60 p-3.5 rounded-2xl border border-cinema-800">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-cinema-500 block">Date</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{show?.date}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-cinema-500 block">Showtime</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">
                    {show?.startTime
                      ? new Date(show.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : 'Scheduled'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-cinema-500 block">Seats</span>
                  <span className="text-xs font-bold text-crimson-400 mt-0.5 block">
                    {booking.seats.map((s) => s.seatIdentifier).join(', ')}
                  </span>
                </div>
              </div>

              {/* QR Gate Pass Section */}
              <div className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
                {booking.qrCodeDataUrl ? (
                  <>
                    <img
                      src={booking.qrCodeDataUrl}
                      alt="Cinema Entrance Pass QR"
                      className="w-44 h-44 object-contain"
                    />
                    <div className="mt-2 text-center">
                      <span className="text-xs font-mono font-black text-gray-900 tracking-widest block">
                        PASS: {booking.verificationCode}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold block mt-0.5 uppercase tracking-wide">
                        REF: {booking.bookingReference}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-medium block mt-1">
                        &bull; Present at auditorium turnstile for barcode scanning &bull;
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    Entrance QR Pass unavailable
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-cinema-850 border-t border-cinema-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-cinema-300 hover:text-white transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-2 px-5 py-2 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-crimson-900/30"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Ticket Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
