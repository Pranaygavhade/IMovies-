import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Printer,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Film,
  Download,
  Share2,
} from 'lucide-react';
import api from '../api/axios';
import { Spinner } from '../components/common/Loader';

const BookingConfirmation = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    // Blast confetti upon successful booking!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e50914', '#d4af37', '#ffffff', '#22c55e'],
    });

    if (!booking) {
      api
        .get(`/bookings/${id}`)
        .then((res) => {
          setBooking(res.data.data.booking);
        })
        .catch((err) => {
          console.error('Failed to load booking:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !booking) {
    return <Spinner text="Loading ticket details..." />;
  }

  const movie = booking.show?.movie || {};
  const theatre = booking.show?.theatre || {};

  return (
    <div className="booking-confirmation-page container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          {/* Success Banner */}
          <div className="text-center mb-4">
            <div className="d-inline-flex p-3 rounded-circle bg-success bg-opacity-25 text-success mb-3">
              <CheckCircle size={48} />
            </div>
            <h1 className="font-heading text-white fs-2 mb-1">Booking Confirmed!</h1>
            <p className="text-muted small">
              A copy of your ticket and booking code has been saved to your account.
            </p>
          </div>

          {/* Cinematic Ticket Card */}
          <div className="cinema-ticket p-4 p-md-5 mb-4 shadow-lg border border-secondary border-opacity-50">
            {/* Notches for authentic ticket look */}
            <div className="ticket-notch-left"></div>
            <div className="ticket-notch-right"></div>

            {/* Ticket Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
              <div className="d-flex align-items-center gap-2">
                <div className="p-1 rounded bg-danger text-white">
                  <Film size={18} />
                </div>
                <span className="font-display fs-4 text-white fw-bold tracking-wider">IMOVIES PASS</span>
              </div>
              <div className="text-end">
                <span className="badge bg-success text-uppercase px-2 py-1">Confirmed</span>
                <div className="text-muted small font-monospace mt-1">{booking.bookingCode}</div>
              </div>
            </div>

            {/* Main Ticket Body */}
            <div className="row g-4 align-items-center mb-4">
              <div className="col-sm-4 text-center text-sm-start">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="rounded-3 shadow w-100"
                  style={{ maxHeight: '220px', objectFit: 'cover', maxWidth: '160px' }}
                />
              </div>

              <div className="col-sm-8 text-white">
                <h3 className="font-heading fs-4 fw-bold mb-1 text-danger">{movie.title}</h3>
                <div className="text-muted small mb-3">
                  {movie.certificate} • {movie.language} • {movie.duration} mins • {booking.show?.format || '2D'}
                </div>

                <div className="d-flex flex-column gap-2 small">
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={16} className="text-danger flex-shrink-0" />
                    <span>
                      <strong className="text-white">{theatre.name}</strong>, {theatre.city} ({booking.show?.screen})
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={16} className="text-danger flex-shrink-0" />
                    <span>{booking.show?.date}</span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <Clock size={16} className="text-danger flex-shrink-0" />
                    <span className="text-white fw-bold">{booking.show?.startTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="ticket-divider"></div>

            {/* Ticket Footer Details with QR Code */}
            <div className="row g-3 align-items-center">
              <div className="col-sm-8">
                <div className="row g-2 small">
                  <div className="col-6">
                    <span className="text-muted d-block">Seats ({booking.seats.length})</span>
                    <strong className="text-white fs-6">
                      {booking.seats.map((s) => s.seatNumber).join(', ')}
                    </strong>
                  </div>

                  <div className="col-6">
                    <span className="text-muted d-block">Amount Paid</span>
                    <strong className="text-danger fs-6">${booking.totalAmount.toFixed(2)}</strong>
                  </div>

                  <div className="col-6 mt-2">
                    <span className="text-muted d-block">Booking Reference</span>
                    <span className="text-white font-monospace">{booking.bookingCode}</span>
                  </div>

                  <div className="col-6 mt-2">
                    <span className="text-muted d-block">Payment Method</span>
                    <span className="text-white text-capitalize">{booking.payment?.method || 'Card'}</span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="col-sm-4 text-center">
                {booking.qrData && (
                  <div className="d-inline-block p-2 bg-white rounded-3 shadow">
                    <img
                      src={booking.qrData}
                      alt="Booking QR Code"
                      style={{ width: '100px', height: '100px' }}
                    />
                  </div>
                )}
                <div className="text-muted small mt-1" style={{ fontSize: '0.65rem' }}>
                  Scan at cinema turnstile
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3">
            <button
              onClick={handlePrint}
              className="btn btn-outline-cinema d-flex align-items-center gap-2 px-4 py-2"
            >
              <Printer size={18} />
              <span>Print Ticket</span>
            </button>

            <Link
              to="/bookings"
              className="btn btn-cinema d-flex align-items-center gap-2 px-4 py-2"
            >
              <Ticket size={18} />
              <span>View in My Bookings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;

