import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  DollarSign,
  Ticket,
  Users,
  Film,
  Building,
  TrendingUp,
  Percent,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import api from '../api/axios';
import { Spinner } from '../components/common/Loader';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => {
        setStats(res.data.data);
      })
      .catch((err) => {
        console.error('Failed to load admin stats:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <Spinner text="Loading analytics and revenue metrics..." />;
  }

  const { summary, revenueTrend, topMovies, recentBookings } = stats;

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

  return (
    <div className="admin-dashboard container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <span className="badge bg-danger text-uppercase px-2 py-1 small mb-1">Admin Command Center</span>
          <h1 className="font-heading text-white fs-2 mb-0">Platform Overview & Metrics</h1>
        </div>

        {/* Action Shortcuts */}
        <div className="d-flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
          >
            <Download size={16} /> Export Revenue CSV
          </button>
          <Link to="/admin/movies" className="btn btn-cinema btn-sm d-flex align-items-center gap-1">
            <PlusCircle size={16} /> Manage Movies
          </Link>
          <Link to="/admin/shows" className="btn btn-outline-cinema btn-sm d-flex align-items-center gap-1">
            <Calendar size={16} /> Schedule Shows
          </Link>
          <Link to="/admin/theatres" className="btn btn-outline-secondary btn-sm text-light d-flex align-items-center gap-1">
            <Building size={16} /> Theatres
          </Link>
        </div>
      </div>

      {/* 1. Stat Metric Cards */}
      <div className="row g-3 mb-4">
        {/* Total Revenue */}
        <div className="col-xl-3 col-sm-6">
          <div className="glass-panel p-4 h-100 border-start border-4 border-danger">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small text-uppercase fw-semibold">Gross Revenue</span>
              <div className="p-2 rounded-3 bg-danger bg-opacity-25 text-danger">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="fs-2 fw-bold text-white font-heading">${summary.totalRevenue.toLocaleString()}</div>
            <div className="text-muted small mt-1">Confirmed transactions</div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="col-xl-3 col-sm-6">
          <div className="glass-panel p-4 h-100 border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small text-uppercase fw-semibold">Total Bookings</span>
              <div className="p-2 rounded-3 bg-warning bg-opacity-25 text-warning">
                <Ticket size={20} />
              </div>
            </div>
            <div className="fs-2 fw-bold text-white font-heading">{summary.totalBookings.toLocaleString()}</div>
            <div className="text-muted small mt-1">{summary.bookedSeatsCount} tickets issued</div>
          </div>
        </div>

        {/* Multiplex Occupancy Rate */}
        <div className="col-xl-3 col-sm-6">
          <div className="glass-panel p-4 h-100 border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small text-uppercase fw-semibold">Chain Occupancy</span>
              <div className="p-2 rounded-3 bg-success bg-opacity-25 text-success">
                <Percent size={20} />
              </div>
            </div>
            <div className="fs-2 fw-bold text-white font-heading">{summary.occupancyRate}%</div>
            <div className="text-muted small mt-1">Across {summary.totalTheatres} multiplexes</div>
          </div>
        </div>

        {/* Registered Users */}
        <div className="col-xl-3 col-sm-6">
          <div className="glass-panel p-4 h-100 border-start border-4 border-info">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small text-uppercase fw-semibold">Audience Members</span>
              <div className="p-2 rounded-3 bg-info bg-opacity-25 text-info">
                <Users size={20} />
              </div>
            </div>
            <div className="fs-2 fw-bold text-white font-heading">{summary.totalUsers.toLocaleString()}</div>
            <div className="text-muted small mt-1">
              <Link to="/admin/users" className="text-info text-decoration-none">
                Manage accounts &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="row g-4 mb-4">
        {/* Revenue Trend Area Chart */}
        <div className="col-lg-8">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="font-heading text-white fs-5 mb-0 d-flex align-items-center gap-2">
                <TrendingUp size={20} className="text-danger" /> 7-Day Revenue Trend
              </h4>
              <span className="badge bg-dark border border-secondary text-muted">Daily Breakdown</span>
            </div>

            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    revenueTrend.length > 0
                      ? revenueTrend
                      : [{ _id: new Date().toISOString().split('T')[0], revenue: summary.totalRevenue }]
                  }
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e50914" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#e50914" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232338" />
                  <XAxis dataKey="_id" stroke="#7b7b90" fontSize={12} />
                  <YAxis stroke="#7b7b90" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141422', borderColor: '#33334d', color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#e50914"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    name="Revenue ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Grossing Movies */}
        <div className="col-lg-4">
          <div className="glass-panel p-4 h-100">
            <h4 className="font-heading text-white fs-5 mb-3">Top Grossing Movies</h4>
            <div className="d-flex flex-column gap-3">
              {topMovies.length === 0 ? (
                <p className="text-muted small">No movies with confirmed bookings yet.</p>
              ) : (
                topMovies.map((movie, idx) => (
                  <div key={movie._id} className="d-flex align-items-center gap-3 p-2 rounded-3 bg-dark border border-secondary">
                    <span className="font-heading text-danger fw-bold fs-5" style={{ width: '20px' }}>
                      #{idx + 1}
                    </span>
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="rounded"
                      style={{ width: '40px', height: '55px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="text-white fw-semibold small text-truncate">{movie.title}</div>
                      <div className="text-muted small">{movie.ticketsSold} tickets sold</div>
                    </div>
                    <div className="text-end">
                      <div className="text-warning fw-bold small">${movie.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recent Bookings Feed */}
      <div className="glass-panel p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="font-heading text-white fs-5 mb-0">Recent Cinema Bookings</h4>
          <Link to="/admin/bookings" className="text-danger small text-decoration-none hover-underline">
            View All ({summary.totalBookings})
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
            <thead>
              <tr className="border-secondary text-muted small text-uppercase">
                <th>Code</th>
                <th>Audience</th>
                <th>Movie</th>
                <th>Cinema & Screen</th>
                <th>Show Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b._id} className="border-secondary">
                  <td className="font-monospace fw-bold text-white small">{b.bookingCode}</td>
                  <td>
                    <div className="text-white small fw-semibold">{b.user?.name || 'Guest'}</div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{b.user?.email}</div>
                  </td>
                  <td className="text-white small">{b.show?.movie?.title}</td>
                  <td className="text-muted small">
                    {b.show?.theatre?.name} ({b.show?.screen})
                  </td>
                  <td className="text-muted small">
                    {b.show?.date} • {b.show?.startTime}
                  </td>
                  <td className="text-danger fw-bold small">${b.totalAmount.toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        b.status === 'confirmed' ? 'bg-success' : 'bg-danger'
                      } text-uppercase px-2 py-1`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

