import React, { useEffect, useState, useRef } from 'react';
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
import MoviePoster from '../components/common/MoviePoster';
import { formatINR } from '../utils/dateUtils';
import { toast } from 'react-toastify';

const BookingConfirmation = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const ticketRef = useRef(null);

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Blast celebratory confetti upon successful booking!
    confetti({
      particleCount: 120,
      spread: 80,
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

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const ticketElement = document.getElementById('cinema-ticket-card');
      if (!ticketElement) {
        window.print();
        return;
      }

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        backgroundColor: '#0c0c16',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const imgWidth = 148;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
      pdf.save(`IMovies-Ticket-${booking.bookingCode}.pdf`);
      toast.success('Ticket PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !booking) {
    return <Spinner text="Loading ticket details..." />;
  }

  const movie = booking.show?.movie || {};
  const theatre = booking.show?.theatre || {};
  const showDate = booking.show?.showDate || booking.show?.date || '';
  const showTime = booking.show?.showTime || booking.show?.startTime || '';

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
              A copy of your ticket and signed digital QR pass has been saved to your account.
            </p>
          </div>

          {/* Cinematic Ticket Card */}
          <div
            id="cinema-ticket-card"
            ref={ticketRef}
            className="cinema-ticket p-4 p-md-5 mb-4 shadow-lg border border-secondary border-opacity-50"
            style={{ backgroundColor: '#0c0c16' }}
          >
            {/* Notches for authentic ticket look */}
            <div className="ticket-notch-left"></div>
            <div className="ticket-notch-right"></div>

            {/* Ticket Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
              <div className="d-flex align-items-center gap-2">
                <div className="p-1 rounded bg-danger text-white">
                  <Film size={18} />
                </div>
                <span className="font-display fs-4 text-white fw-bold tracking-wider">IMOVIES E-PASS</span>
              </div>
              <div className="text-end">
                <span className="badge bg-success text-uppercase px-2 py-1">Confirmed & Paid</span>
                <div className="text-warning small font-monospace mt-1 fw-bold">{booking.bookingCode}</div>
              </div>
            </div>

            {/* Main Ticket Body */}
            <div className="row g-4 align-items-center mb-4">
              <div className="col-sm-4 text-center text-sm-start">
                <MoviePoster
                  src={movie.poster}
                  title={movie.title}
                  certificate={movie.certification || movie.certificate}
                  language={movie.language}
                  style={{ maxHeight: '220px', maxWidth: '160px', margin: '0 auto' }}
                />
              </div>

              <div className="col-sm-8 text-white">
                <h3 className="font-heading fs-4 fw-bold mb-1 text-danger">{movie.title}</h3>
                <div className="text-secondary small mb-3">
                  {movie.certification || movie.certificate} • {movie.language} • {movie.runtime || movie.duration} mins • {booking.show?.format || '2D'}
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
                    <span>{showDate}</span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <Clock size={16} className="text-danger flex-shrink-0" />
                    <span className="text-white fw-bold">{showTime} (Asia/Kolkata)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="ticket-divider"></div>

            {/* Ticket Footer Details with Custom QR & Signed Entry Gate Pass */}
            <div className="row g-3 align-items-center">
              <div className="col-md-7">
                <div className="row g-2 small">
                  <div className="col-6">
                    <span className="text-secondary d-block">Seats ({booking.seats.length})</span>
                    <strong className="text-white fs-6">
                      {booking.seats.map((s) => s.seatNumber).join(', ')}
                    </strong>
                  </div>

                  <div className="col-6">
                    <span className="text-secondary d-block">Amount Paid</span>
                    <strong className="text-danger fs-6">{formatINR(booking.totalAmount)}</strong>
                  </div>

                  <div className="col-6 mt-2">
                    <span className="text-secondary d-block">Booking Reference</span>
                    <span className="text-warning font-monospace fw-bold">{booking.bookingCode}</span>
                  </div>

                  <div className="col-6 mt-2">
                    <span className="text-secondary d-block">Payment Mode</span>
                    <span className="text-white text-capitalize">
                      {booking.payment?.method === 'phonepe_qr' ? 'PhonePe UPI QR' : booking.payment?.method || 'Online'}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Passes: Custom Ticket QR + Gate Token Pass */}
              <div className="col-md-5 text-center">
                <div className="d-flex justify-content-center align-items-center gap-3">
                  {/* Custom Ticket QR Image */}
                  <div className="text-center">
                    <div className="p-2 bg-white rounded-3 shadow-sm d-inline-block">
                      <img
                        src="/assets/custom-ticket-qr.png"
                        alt="Cinema Ticket QR"
                        className="img-fluid"
                        style={{ width: '92px', height: '92px', objectFit: 'contain', imageRendering: 'crisp-edges' }}
                      />
                    </div>
                    <div className="text-secondary small mt-1 fw-bold" style={{ fontSize: '0.65rem' }}>
                      Ticket Pass
                    </div>
                  </div>

                  {/* Cryptographic Entry Gate QR */}
                  {(booking.qrCode || booking.qrData) && (
                    <div className="text-center">
                      <div className="p-2 bg-white rounded-3 shadow-sm d-inline-block">
                        <img
                          src={booking.qrCode || booking.qrData}
                          alt="Security Gate QR"
                          className="img-fluid"
                          style={{ width: '92px', height: '92px', objectFit: 'contain' }}
                        />
                      </div>
                      <div className="text-success small mt-1 fw-bold" style={{ fontSize: '0.65rem' }}>
                        Gate Scan
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-secondary small mt-2" style={{ fontSize: '0.65rem' }}>
                  Single-Use Entry Pass • Verified
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow"
            >
              {downloading ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                <Download size={18} />
              )}
              <span>Download PDF Ticket</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn btn-outline-light d-flex align-items-center gap-2 px-4 py-2"
            >
              <Printer size={18} />
              <span>Print</span>
            </button>

            <Link
              to="/bookings"
              className="btn btn-outline-secondary text-light d-flex align-items-center gap-2 px-4 py-2"
            >
              <Ticket size={18} />
              <span>My Bookings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
