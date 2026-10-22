import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, Search, CheckCircle2, AlertTriangle, XCircle, Clock, ShieldAlert, Film, RefreshCw, User, Calendar, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { formatINR } from '../utils/dateUtils';

const AdminScanTicket = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const scannerRef = useRef(null);

  // Initialize or teardown camera scanner
  useEffect(() => {
    let html5QrCode = null;

    if (cameraActive) {
      try {
        html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        html5QrCode
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              // Scanned successfully!
              handleVerify(decodedText);
              // Stop camera after successful scan
              setCameraActive(false);
            },
            (errorMessage) => {
              // Scanning in progress...
            }
          )
          .catch((err) => {
            console.error('Camera scan error:', err);
            setScannerError('Could not start camera scanner. Please grant camera permission or use manual code entry.');
            setCameraActive(false);
          });
      } catch (err) {
        console.error('Camera setup error:', err);
        setScannerError(err.message);
      }
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [cameraActive]);

  const handleVerify = async (tokenOrCode) => {
    const query = tokenOrCode || tokenInput;
    if (!query || query.trim() === '') {
      toast.warning('Please enter a ticket QR token or booking code.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const clean = query.trim();
      const isBookingCode = clean.toUpperCase().startsWith('IMV-') || clean.length <= 10;
      const param = isBookingCode ? `bookingCode=${encodeURIComponent(clean)}` : `token=${encodeURIComponent(clean)}`;

      const res = await api.get(`/tickets/verify?${param}`);
      setResult(res.data.data);

      const state = res.data.data?.state;
      if (state === 'valid') {
        toast.success('🎉 Ticket Verified! Entry Granted.');
      } else if (state === 'already_used') {
        toast.warn('⚠️ Ticket was already used!');
      } else if (state === 'cancelled') {
        toast.error('❌ Booking was cancelled!');
      } else {
        toast.error(`❌ Ticket verification: ${state}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify ticket.';
      toast.error(msg);
      setResult({
        state: 'invalid',
        message: msg,
        booking: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setTokenInput('');
  };

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-dark">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger text-uppercase px-2 py-1">Door Gate Control</span>
            <span className="text-muted small">Single-Use Validator</span>
          </div>
          <h2 className="text-white fw-bold mb-1 d-flex align-items-center gap-2">
            <QrCode className="text-danger" /> Scan & Verify E-Ticket
          </h2>
          <p className="text-muted small mb-0">
            Validates cryptographic HMAC-SHA256 signature, ensures single-use entry, and confirms paid status.
          </p>
        </div>

        <button
          onClick={() => {
            setScannerError(null);
            setCameraActive((prev) => !prev);
          }}
          className={`btn ${cameraActive ? 'btn-danger' : 'btn-outline-danger'} d-flex align-items-center gap-2`}
        >
          <Camera size={18} />
          {cameraActive ? 'Close Camera' : 'Start Camera Scanner'}
        </button>
      </div>

      {/* Camera Viewport */}
      {cameraActive && (
        <div className="card bg-dark border-danger mb-4 shadow-lg overflow-hidden">
          <div className="card-header bg-danger text-white py-2 px-3 d-flex justify-content-between align-items-center">
            <span className="small fw-bold d-flex align-items-center gap-2">
              <span className="spinner-grow spinner-grow-sm" role="status" /> LIVE CAMERA SCANNER
            </span>
            <span className="small opacity-75">Point camera at attendee ticket QR</span>
          </div>
          <div className="card-body p-3 text-center bg-black">
            <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} />
            <p className="text-muted small mt-2 mb-0">Align the QR code within the scanning box.</p>
          </div>
        </div>
      )}

      {scannerError && (
        <div className="alert alert-warning d-flex align-items-center gap-2 small mb-4">
          <AlertTriangle size={18} className="text-warning flex-shrink-0" />
          <span>{scannerError}</span>
        </div>
      )}

      {/* Manual Input Form */}
      <div className="card bg-dark border-secondary border-opacity-25 mb-4 shadow">
        <div className="card-body p-4">
          <h5 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
            <Search size={18} className="text-danger" /> Manual Code / Token Entry
          </h5>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
          >
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder="Paste signed token or Booking Code (e.g. IMV-XXXXXX)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className="btn btn-danger px-4 fw-bold d-flex align-items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Verify Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
          <div className="d-flex align-items-center gap-2 text-muted small">
            <span>Tip:</span> Staff can enter the 6-character reference (e.g. <code>IMV-8J2K9L</code>) if the attendee's phone screen is cracked.
          </div>
        </div>
      </div>

      {/* Verification Result Display */}
      {result && (
        <div className="card bg-dark border-0 shadow-lg mb-4 overflow-hidden">
          {/* Status Banner */}
          <div
            className={`p-4 text-center text-white ${
              result.state === 'valid'
                ? 'bg-success'
                : result.state === 'already_used'
                ? 'bg-warning text-dark'
                : 'bg-danger'
            }`}
          >
            <div className="mb-2">
              {result.state === 'valid' && <CheckCircle2 size={54} className="mx-auto" />}
              {result.state === 'already_used' && <AlertTriangle size={54} className="mx-auto text-dark" />}
              {result.state === 'cancelled' && <XCircle size={54} className="mx-auto" />}
              {result.state === 'wrong_show' && <Clock size={54} className="mx-auto" />}
              {result.state === 'invalid' && <ShieldAlert size={54} className="mx-auto" />}
            </div>

            <h3 className="fw-black text-uppercase tracking-wider mb-1">
              {result.state === 'valid' && 'ENTRY GRANTED • TICKET VALID'}
              {result.state === 'already_used' && 'ENTRY DENIED • ALREADY USED'}
              {result.state === 'cancelled' && 'ENTRY DENIED • BOOKING CANCELLED'}
              {result.state === 'wrong_show' && 'ENTRY DENIED • WRONG SHOW / EXPIRED'}
              {result.state === 'invalid' && 'ENTRY DENIED • INVALID TICKET'}
            </h3>
            <p className="mb-0 fs-6 opacity-90">{result.message}</p>
          </div>

          {/* Ticket Details Body */}
          {result.booking && (
            <div className="card-body p-4 bg-dark text-white">
              <div className="row g-4">
                {/* Movie & Poster */}
                <div className="col-md-4 text-center text-md-start">
                  <img
                    src={result.booking.show?.movie?.poster || 'https://via.placeholder.com/300x450'}
                    alt={result.booking.show?.movie?.title}
                    className="rounded-3 shadow w-100 mb-3"
                    style={{ maxHeight: '280px', objectFit: 'cover' }}
                  />
                  <h5 className="fw-bold text-white mb-1">{result.booking.show?.movie?.title}</h5>
                  <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 text-muted small">
                    <span className="badge bg-secondary">{result.booking.show?.movie?.certification || 'UA'}</span>
                    <span>{result.booking.show?.movie?.language || 'Hindi'}</span>
                    <span>•</span>
                    <span>{result.booking.show?.format || '2D'}</span>
                  </div>
                </div>

                {/* Screening & Attendee Specs */}
                <div className="col-md-8">
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-25">
                        <span className="text-muted small d-block mb-1">Attendee Name</span>
                        <div className="fw-bold d-flex align-items-center gap-2">
                          <User size={16} className="text-danger" />
                          <span>{result.booking.user?.name || 'Customer'}</span>
                        </div>
                        <span className="text-muted small">{result.booking.user?.phone || result.booking.user?.email}</span>
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-25">
                        <span className="text-muted small d-block mb-1">Booking Reference</span>
                        <div className="fw-bold text-warning font-monospace fs-5">
                          {result.booking.bookingCode}
                        </div>
                        <span className="badge bg-success small">PAID • {formatINR(result.booking.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-25">
                        <span className="text-muted small d-block mb-1">Cinema & Auditorium</span>
                        <div className="fw-bold d-flex align-items-center gap-2">
                          <MapPin size={16} className="text-danger" />
                          <span>{result.booking.show?.theatre?.name}</span>
                        </div>
                        <span className="text-muted small">{result.booking.show?.screen}</span>
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-25">
                        <span className="text-muted small d-block mb-1">Show Date & Time</span>
                        <div className="fw-bold d-flex align-items-center gap-2">
                          <Calendar size={16} className="text-danger" />
                          <span>
                            {result.booking.show?.showDate} at {result.booking.show?.showTime}
                          </span>
                        </div>
                        <span className="text-muted small">Asia/Kolkata Time</span>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="p-3 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-30">
                        <span className="text-muted small d-block mb-1">Reserved Seats ({result.booking.seats?.length})</span>
                        <div className="d-flex flex-wrap gap-2">
                          {result.booking.seats?.map((s) => (
                            <span key={s.seatNumber} className="badge bg-danger fs-6 px-3 py-2">
                              {s.seatNumber} ({s.tier || s.category})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scan Next Action */}
                  <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-end gap-2">
                    <button onClick={resetScanner} className="btn btn-outline-light d-flex align-items-center gap-2">
                      <RefreshCw size={16} /> Scan Next Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminScanTicket;
