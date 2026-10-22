import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Eye, Copy, RefreshCw, Smartphone, Film, MapPin, User, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { formatINR } from '../utils/dateUtils';

const AdminPendingPayments = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('Transaction ID / UTR not found in PhonePe statement');

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/pending-payments');
      setPendingBookings(res.data.data?.pendingBookings || []);
    } catch (err) {
      toast.error('Failed to load pending payments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
    // Poll every 15 seconds for new manual UPI transfers
    const interval = setInterval(fetchPendingPayments, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (bookingId) => {
    if (!window.confirm('Confirm that you have checked your PhonePe app and received this payment?')) {
      return;
    }

    try {
      setActionLoading(bookingId);
      const res = await api.post(`/admin/payments/${bookingId}/approve`);
      toast.success('🎉 ' + (res.data.message || 'Payment approved! Ticket confirmed.'));
      // Remove from list
      setPendingBookings((prev) => prev.filter((b) => b._id !== bookingId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalBooking) return;
    try {
      setActionLoading(rejectModalBooking._id);
      const res = await api.post(`/admin/payments/${rejectModalBooking._id}/reject`, {
        reason: rejectReason,
      });
      toast.info('❌ ' + (res.data.message || 'Payment rejected. Seats released.'));
      setPendingBookings((prev) => prev.filter((b) => b._id !== rejectModalBooking._id));
      setRejectModalBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('UTR copied to clipboard!');
  };

  // Remaining time in minutes
  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return '15 mins';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-dark">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning text-dark px-2 py-1 fw-bold">Manual Verification</span>
            <span className="text-muted small">PhonePe UPI Ledger</span>
          </div>
          <h2 className="text-white fw-bold mb-1 d-flex align-items-center gap-2">
            <Smartphone className="text-warning" /> Pending PhonePe QR Payments
          </h2>
          <p className="text-muted small mb-0">
            Review customer-submitted 12-digit UTR numbers and screenshots against your PhonePe app statement.
          </p>
        </div>

        <button
          onClick={fetchPendingPayments}
          disabled={loading}
          className="btn btn-outline-light d-flex align-items-center gap-2 align-self-start"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Content */}
      {loading && pendingBookings.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger mb-3" role="status" />
          <p className="text-muted">Loading pending payments...</p>
        </div>
      ) : pendingBookings.length === 0 ? (
        <div className="card bg-dark border-secondary border-opacity-25 text-center p-5 shadow">
          <CheckCircle2 size={56} className="text-success mx-auto mb-3 opacity-75" />
          <h4 className="text-white fw-bold mb-2">No Pending Payments</h4>
          <p className="text-muted small max-w-md mx-auto mb-0">
            All PhonePe QR transfers have been reviewed and reconciled. New submissions will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {pendingBookings.map((b) => (
            <div key={b._id} className="col-12">
              <div className="card bg-dark border-warning border-opacity-50 shadow-lg overflow-hidden">
                <div className="card-header bg-warning bg-opacity-10 py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 border-bottom border-warning border-opacity-25">
                  <div className="d-flex align-items-center gap-3">
                    <span className="badge bg-warning text-dark fs-6 px-3 py-1 font-monospace">
                      {b.bookingCode}
                    </span>
                    <span className="text-white fw-bold fs-5">
                      Amount: <span className="text-warning">{formatINR(b.totalAmount)}</span>
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <span className="text-muted small d-flex align-items-center gap-1">
                      <Clock size={16} className="text-warning" />
                      <span>Lock expires in: <strong className="text-warning">{getRemainingTime(b.expiresAt)}</strong></span>
                    </span>
                  </div>
                </div>

                <div className="card-body p-4">
                  <div className="row g-4 align-items-center">
                    {/* Attendee Details */}
                    <div className="col-lg-3 col-md-6 border-end-md border-secondary border-opacity-25">
                      <span className="text-muted small d-block mb-1">Customer / Attendee</span>
                      <h6 className="text-white fw-bold mb-1 d-flex align-items-center gap-2">
                        <User size={16} className="text-danger" />
                        {b.user?.name || 'Customer'}
                      </h6>
                      <p className="text-muted small mb-1">{b.user?.email}</p>
                      <p className="text-muted small mb-0">{b.user?.phone || 'No phone recorded'}</p>
                    </div>

                    {/* Movie & Show Details */}
                    <div className="col-lg-3 col-md-6 border-end-lg border-secondary border-opacity-25">
                      <span className="text-muted small d-block mb-1">Movie & Screening</span>
                      <h6 className="text-white fw-bold mb-1 d-flex align-items-center gap-2">
                        <Film size={16} className="text-danger" />
                        {b.show?.movie?.title}
                      </h6>
                      <p className="text-muted small mb-1 d-flex align-items-center gap-1">
                        <MapPin size={14} /> {b.show?.theatre?.name} ({b.show?.theatre?.city})
                      </p>
                      <p className="text-muted small mb-0 d-flex align-items-center gap-1">
                        <Calendar size={14} /> {b.show?.showDate} at {b.show?.showTime} • {b.seats?.map((s) => s.seatNumber).join(', ')}
                      </p>
                    </div>

                    {/* UTR & Verification Info */}
                    <div className="col-lg-3 col-md-6 border-end-md border-secondary border-opacity-25">
                      <span className="text-muted small d-block mb-1">Submitted 12-Digit UTR</span>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="fs-5 fw-black text-warning font-monospace bg-black px-2 py-1 rounded border border-warning border-opacity-50">
                          {b.manualPayment?.utrNumber || 'N/A'}
                        </span>
                        {b.manualPayment?.utrNumber && (
                          <button
                            onClick={() => copyToClipboard(b.manualPayment.utrNumber)}
                            className="btn btn-sm btn-outline-warning p-1"
                            title="Copy UTR"
                          >
                            <Copy size={16} />
                          </button>
                        )}
                      </div>

                      {b.manualPayment?.screenshotUrl ? (
                        <button
                          onClick={() => setSelectedScreenshot(b.manualPayment.screenshotUrl)}
                          className="btn btn-sm btn-outline-light d-flex align-items-center gap-1 mt-2"
                        >
                          <Eye size={14} /> View Receipt Screenshot
                        </button>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-50 text-muted small">No screenshot attached</span>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="col-lg-3 col-md-6 d-flex flex-column gap-2 justify-content-center">
                      <button
                        onClick={() => handleApprove(b._id)}
                        disabled={actionLoading === b._id}
                        className="btn btn-success fw-bold d-flex align-items-center justify-content-center gap-2 py-2"
                      >
                        {actionLoading === b._id ? (
                          <span className="spinner-border spinner-border-sm" role="status" />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}
                        <span>Approve & Confirm</span>
                      </button>

                      <button
                        onClick={() => setRejectModalBooking(b)}
                        disabled={actionLoading === b._id}
                        className="btn btn-outline-danger fw-bold d-flex align-items-center justify-content-center gap-2 py-2"
                      >
                        <XCircle size={18} />
                        <span>Reject & Release Seats</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot Viewer Modal */}
      {selectedScreenshot && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">Customer Payment Receipt Screenshot</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedScreenshot(null)}
                />
              </div>
              <div className="modal-body text-center p-3">
                <img
                  src={selectedScreenshot}
                  alt="Receipt Screenshot"
                  className="img-fluid rounded shadow"
                  style={{ maxHeight: '75vh', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Reason Modal */}
      {rejectModalBooking && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setRejectModalBooking(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-dark text-white border-danger shadow-lg">
              <div className="modal-header border-danger">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <AlertCircle size={20} /> Reject Payment & Release Seats
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setRejectModalBooking(null)}
                />
              </div>
              <div className="modal-body p-4">
                <p className="text-muted small mb-3">
                  Are you sure you want to reject booking <strong>{rejectModalBooking.bookingCode}</strong>? The locked seats will be immediately released back to other cinema viewers.
                </p>

                <label className="form-label text-white small fw-bold">Reason for Rejection (sent to customer):</label>
                <select
                  className="form-select bg-black text-white border-secondary mb-3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                >
                  <option value="Transaction ID / UTR not found in PhonePe statement">
                    Transaction ID / UTR not found in PhonePe statement
                  </option>
                  <option value="Paid amount does not match ticket total exactly">
                    Paid amount does not match ticket total exactly
                  </option>
                  <option value="Duplicate or fraudulent transaction ID entered">
                    Duplicate or fraudulent transaction ID entered
                  </option>
                  <option value="Payment verification window timed out">
                    Payment verification window timed out
                  </option>
                </select>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    onClick={() => setRejectModalBooking(null)}
                    className="btn btn-outline-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading === rejectModalBooking._id}
                    className="btn btn-danger fw-bold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingPayments;
