import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Film,
} from 'lucide-react';
import { fetchMyBookings, cancelBooking } from '../redux/slices/bookingSlice';
import { Spinner } from '../components/common/Loader';

const MyBookings = () => {
  const dispatch = useDispatch();
  const { myBookings, upcomingBookings, pastBookings, loading } = useSelector(
    (state) => state.booking
  );

  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedBookingForQr, setSelectedBookingForQr] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      const res = await dispatch(cancelBooking(bookingToCancel._id)).unwrap();
      toast.success(res.message || 'Booking cancelled successfully.');
      setBookingToCancel(null);
      dispatch(fetchMyBookings());
    } catch (err) {
      toast.error(err || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  if (loading && myBookings.length === 0) {
    return <Spinner text="Loading your cinema tickets..." />;
  }

  return (
    <div className="my-bookings-page container py-5">
      {/* Page Title */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 pb-2 border-bottom border-secondary border-opacity-25">
        <div>
          <h1 className="font-heading text-white fs-2 mb-1">My Cinema Bookings</h1>
          <p className="text-muted small mb-0">View your active tickets and past movie attendance</p>
        </div>

        {/* Tabs */}
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn btn-sm px-4 py-2 ${
              activeTab === 'upcoming' ? 'btn-danger fw-bold' : 'btn-dark text-muted'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm px-4 py-2 ${
              activeTab === 'past' ? 'btn-danger fw-bold' : 'btn-dark text-muted'
            }`}
            onClick={() => setActiveTab('past')}
          >
            Past & Cancelled ({pastBookings.length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {displayedBookings.length === 0 ? (
        <div className="glass-panel text-center py-5 my-4">
          <Ticket size={48} className="text-muted mb-3" />
          <h4 className="text-white mb-2">No {activeTab} bookings found</h4>
          <p className="text-muted small mb-4">
            {activeTab === 'upcoming'
              ? 'You have no upcoming movie shows scheduled. Explore current movies and book your seats!'
              : 'You have no past booking records.'}
          </p>
          <Link to="/movies" className="btn btn-cinema btn-sm px-4">
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {displayedBookings.map((b) => {
            const movie = b.show?.movie || {};
            const theatre = b.show?.theatre || {};
            const isCancelled = b.status === 'cancelled';

            return (
              <div key={b._id} className="glass-panel p-4 position-relative overflow-hidden">
                {isCancelled && (
                  <div
                    className="position-absolute top-0 end-0 bg-danger text-white px-3 py-1 text-uppercase fw-bold"
                    style={{ fontSize: '0.7rem', borderBottomLeftRadius: '8px' }}
                  >
                    Cancelled
                  </div>
                )}

                <div className="row g-4 align-items-center">
                  {/* Poster */}
                  <div className="col-md-2 col-sm-3 text-center">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="rounded-3 shadow w-100"
                      style={{ maxHeight: '160px', objectFit: 'cover', maxWidth: '120px' }}
                    />
                  </div>

                  {/* Show & Cinema Details */}
                  <div className="col-md-6 col-sm-9">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h4 className="text-white fw-bold fs-5 mb-0">{movie.title}</h4>
                      <span className="badge-cert">{movie.certificate}</span>
                    </div>

                    <div className="text-danger small fw-semibold mb-2">
                      {theatre.name}, {theatre.city} ({b.show?.screen})
                    </div>

                    <div className="d-flex flex-wrap gap-3 text-muted small mb-2">
                      <span className="d-flex align-items-center gap-1">
                        <Calendar size={14} className="text-danger" /> {b.show?.date}
                      </span>
                      <span className="d-flex align-items-center gap-1 text-white fw-bold">
                        <Clock size={14} className="text-danger" /> {b.show?.startTime}
                      </span>
                      <span>Format: {b.show?.format || '2D'}</span>
                    </div>

                    <div className="d-flex align-items-center gap-2 mt-2">
                      <span className="text-muted small">Seats:</span>
                      <div className="d-flex flex-wrap gap-1">
                        {b.seats.map((s) => (
                          <span key={s.seatNumber} className="badge bg-dark border border-secondary text-light">
                            {s.seatNumber} ({s.category})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Booking Status & Actions */}
                  <div className="col-md-4 col-12 text-md-end border-top border-md-top-0 border-secondary border-opacity-25 pt-3 pt-md-0">
                    <div className="mb-2">
                      <span className="text-muted small d-block">Booking Code:</span>
                      <span className="text-white font-monospace fs-6 fw-bold">{b.bookingCode}</span>
                    </div>

                    <div className="mb-3">
                      <span className="text-muted small d-block">Total Paid:</span>
                      <span className="text-danger fs-5 fw-bold font-heading">₹{b.totalAmount.toFixed(2)}</span>
                      {b.refundStatus && b.refundStatus !== 'none' && (
                        <div className="small text-warning mt-1">
                          Refund: {b.refundStatus === 'full' ? 'Full Refund Processed' : 'Ineligible (<2h policy)'}
                        </div>
                      )}
                    </div>

                    <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                      {b.status === 'payment_under_review' ? (
                        <span className="badge bg-warning text-dark px-3 py-2 fw-bold d-inline-flex align-items-center gap-1">
                          <Clock size={14} className="animate-pulse" /> Review in Progress
                        </span>
                      ) : (
                        <>
                          <Link
                            to={`/booking/confirmation/${b._id}`}
                            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                          >
                            <Ticket size={16} /> E-Pass
                          </Link>

                          {b.qrData && (
                            <button
                              className="btn btn-outline-secondary btn-sm text-light d-flex align-items-center gap-1"
                              onClick={() => setSelectedBookingForQr(b)}
                            >
                              <QrCode size={16} /> QR Pass
                            </button>
                          )}

                          {!isCancelled && activeTab === 'upcoming' && (
                            <button
                              className="btn btn-outline-secondary btn-sm text-danger"
                              onClick={() => setBookingToCancel(b)}
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedBookingForQr && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}
          onClick={() => setSelectedBookingForQr(null)}
        >
          <div
            className="glass-panel p-4 rounded-4 text-center position-relative"
            style={{ maxWidth: '380px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn btn-sm btn-dark position-absolute top-0 end-0 m-3 rounded-circle"
              onClick={() => setSelectedBookingForQr(null)}
            >
              ✕
            </button>
            <h5 className="text-white fw-bold mb-1">{selectedBookingForQr.show?.movie?.title}</h5>
            <div className="text-muted small mb-3">
              {selectedBookingForQr.show?.date} • {selectedBookingForQr.show?.startTime}
            </div>

            <div className="p-3 bg-white rounded-3 d-inline-block shadow mb-3">
              <img
                src={selectedBookingForQr.qrData}
                alt="QR Code"
                style={{ width: '180px', height: '180px' }}
              />
            </div>

            <div className="font-monospace text-white fw-bold fs-5 mb-1">
              {selectedBookingForQr.bookingCode}
            </div>
            <div className="text-muted small">Seats: {selectedBookingForQr.seats.map((s) => s.seatNumber).join(', ')}</div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {bookingToCancel && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}
          onClick={() => setBookingToCancel(null)}
        >
          <div
            className="glass-panel p-4 rounded-4 position-relative"
            style={{ maxWidth: '480px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center gap-2 text-danger mb-3">
              <AlertCircle size={24} />
              <h5 className="text-white fw-bold mb-0">Cancel Ticket Booking</h5>
            </div>

            <p className="text-light small mb-3">
              Are you sure you want to cancel booking{' '}
              <strong className="text-white font-monospace">{bookingToCancel.bookingCode}</strong> for{' '}
              <strong className="text-white">{bookingToCancel.show?.movie?.title}</strong>?
            </p>

            <div className="p-3 rounded-3 bg-dark border border-secondary mb-4 small text-muted">
              <strong className="text-warning d-block mb-1">IMovies Cinema Refund Policy:</strong>
              • Full refund is automatically credited if cancelled more than 2 hours before the scheduled showtime.
              <br />• Cancellations within 2 hours of showtime are ineligible for refunds per cinema policy.
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setBookingToCancel(null)}
                disabled={cancelling}
              >
                Keep Booking
              </button>
              <button
                className="btn btn-danger btn-sm px-3"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

