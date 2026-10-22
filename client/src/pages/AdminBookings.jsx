import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Ticket, Search, ChevronLeft, Calendar, DollarSign, Film, Download } from 'lucide-react';
import api from '../api/axios';
import { Spinner } from '../components/common/Loader';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/reports/revenue-csv', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `imovies_revenue_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Revenue report CSV downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export CSV report');
    }
  };

  const loadBookings = () => {
    setLoading(true);
    const params = {};
    if (status) params.status = status;
    if (search.trim()) params.search = search.trim();

    api
      .get('/admin/bookings', { params })
      .then((res) => {
        setBookings(res.data.data.bookings);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, [status, search]);

  return (
    <div className="admin-bookings container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <Link to="/admin" className="text-muted small text-decoration-none d-flex align-items-center gap-1 mb-1 hover-white">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-white fs-2 mb-0">Platform Bookings Ledger</h1>
        </div>

        <div>
          <button
            onClick={handleExportCSV}
            className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
          >
            <Download size={16} /> Export Revenue CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-6 position-relative">
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              className="form-control bg-dark text-light border-secondary ps-5 py-2"
              placeholder="Search by booking code (e.g. IMV-123456)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-6 d-flex justify-content-md-end gap-2">
            <button
              type="button"
              className={`btn btn-sm ${status === '' ? 'btn-danger' : 'btn-dark text-muted'}`}
              onClick={() => setStatus('')}
            >
              All
            </button>
            <button
              type="button"
              className={`btn btn-sm ${status === 'confirmed' ? 'btn-danger' : 'btn-dark text-muted'}`}
              onClick={() => setStatus('confirmed')}
            >
              Confirmed
            </button>
            <button
              type="button"
              className={`btn btn-sm ${status === 'cancelled' ? 'btn-danger' : 'btn-dark text-muted'}`}
              onClick={() => setStatus('cancelled')}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading bookings ledger..." />
      ) : bookings.length === 0 ? (
        <div className="glass-panel text-center py-5">
          <p className="text-muted mb-0">No bookings found matching criteria.</p>
        </div>
      ) : (
        <div className="glass-panel p-3 table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
            <thead>
              <tr className="border-secondary text-muted small text-uppercase">
                <th>Code</th>
                <th>Audience</th>
                <th>Movie</th>
                <th>Multiplex</th>
                <th>Show Date</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-secondary">
                  <td className="font-monospace fw-bold text-white small">{b.bookingCode}</td>
                  <td>
                    <div className="text-white small fw-semibold">{b.user?.name || 'Guest'}</div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{b.user?.email}</div>
                  </td>
                  <td className="text-white small">{b.show?.movie?.title}</td>
                  <td className="text-muted small">
                    {b.show?.theatre?.name} ({b.show?.theatre?.city})
                  </td>
                  <td className="text-muted small">
                    {b.show?.date} • {b.show?.startTime}
                  </td>
                  <td className="small">
                    {b.seats?.map((s) => s.seatNumber).join(', ')}
                  </td>
                  <td className="text-danger fw-bold small">${b.totalAmount.toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        b.status === 'confirmed' ? 'bg-success' : 'bg-danger'
                      } text-uppercase px-2 py-1`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;

