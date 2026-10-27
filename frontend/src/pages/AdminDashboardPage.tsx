import React, { useEffect, useState } from 'react';
import {
  Shield,
  Film,
  Building2,
  Calendar,
  DollarSign,
  Ticket,
  Plus,
  AlertCircle,
  CheckCircle,
  Smartphone,
  QrCode,
  CheckCheck,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { IMovie, ICinema, IScreen } from '../types/index.js';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [cinemas, setCinemas] = useState<ICinema[]>([]);
  const [screens, setScreens] = useState<IScreen[]>([]);
  const [manualPayments, setManualPayments] = useState<any[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'new-cinema' | 'new-show' | 'all-bookings' | 'manual-payments'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states: New Cinema
  const [cinemaForm, setCinemaForm] = useState({
    name: '',
    address: '',
    locality: '',
    city: 'Mumbai',
    latitude: '19.0760',
    longitude: '72.8777',
    amenities: 'IMAX, Dolby Atmos, Recliners, Food Court',
  });

  // Form states: New Show
  const [showForm, setShowForm] = useState({
    movieId: '',
    cinemaId: '',
    screenId: '',
    startTime: '',
    format: '2D',
    standardPrice: '220',
    premiumPrice: '350',
    vipPrice: '500',
  });

  useEffect(() => {
    async function loadAdminData() {
      setIsLoading(true);
      try {
        const [dashRes, moviesRes, cinemasRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/movies?limit=50&status=all'),
          api.get('/cinemas'),
        ]);

        if (dashRes.data.success) {
          setStats(dashRes.data.stats);
          setRecentBookings(dashRes.data.recentBookings || []);
        }
        if (moviesRes.data.success) {
          setMovies(moviesRes.data.movies);
          if (moviesRes.data.movies.length > 0) {
            setShowForm((prev) => ({ ...prev, movieId: moviesRes.data.movies[0]._id }));
          }
        }
        if (cinemasRes.data.success) {
          setCinemas(cinemasRes.data.cinemas);
          if (cinemasRes.data.cinemas.length > 0) {
            setShowForm((prev) => ({ ...prev, cinemaId: cinemasRes.data.cinemas[0]._id }));
          }
        }
      } catch (err: any) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminData();
  }, []);

  // When cinema changes in showForm, fetch its screens
  useEffect(() => {
    async function loadScreens() {
      if (!showForm.cinemaId) return;
      try {
        const res = await api.get(`/admin/cinemas/${showForm.cinemaId}/screens`);
        if (res.data.success) {
          setScreens(res.data.screens);
          if (res.data.screens.length > 0) {
            setShowForm((prev) => ({ ...prev, screenId: res.data.screens[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to load screens:', err);
      }
    }
    loadScreens();
  }, [showForm.cinemaId]);

  const loadManualPayments = async () => {
    try {
      const res = await api.get('/admin/manual-payments');
      if (res.data.success) {
        setManualPayments(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load manual payments:', err);
    }
  };

  useEffect(() => {
    loadManualPayments();
  }, []);

  const handleApprovePayment = async (bookingId: string) => {
    setIsProcessingPayment(bookingId);
    setNotification(null);
    try {
      const res = await api.post(`/admin/manual-payments/${bookingId}/approve`);
      if (res.data.success) {
        setNotification({
          type: 'success',
          message: res.data.message || 'Payment approved! Ticket confirmed.',
        });
        await loadManualPayments();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to approve payment.',
      });
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleRejectPayment = async (bookingId: string) => {
    const reason = window.prompt(
      'Enter reason for rejecting this payment (this will release held seats back to the public pool):',
      'UTR number could not be verified on PhonePe statement'
    );
    if (!reason) return;

    setIsProcessingPayment(bookingId);
    setNotification(null);
    try {
      const res = await api.post(`/admin/manual-payments/${bookingId}/reject`, { reason });
      if (res.data.success) {
        setNotification({
          type: 'success',
          message: res.data.message || 'Payment rejected. Seats released back to inventory.',
        });
        await loadManualPayments();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reject payment.',
      });
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleCreateCinema = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    try {
      const amenitiesArr = cinemaForm.amenities.split(',').map((s) => s.trim());
      const res = await api.post('/admin/cinemas', {
        ...cinemaForm,
        latitude: parseFloat(cinemaForm.latitude),
        longitude: parseFloat(cinemaForm.longitude),
        amenities: amenitiesArr,
      });

      if (res.data.success) {
        setNotification({ type: 'success', message: 'Cinema multiplex created successfully!' });
        setCinemas([...cinemas, res.data.cinema]);
        setCinemaForm({
          name: '',
          address: '',
          locality: '',
          city: 'Mumbai',
          latitude: '19.0760',
          longitude: '72.8777',
          amenities: 'IMAX, Dolby Atmos, Recliners, Food Court',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create cinema.',
      });
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    try {
      const res = await api.post('/admin/shows', {
        movieId: showForm.movieId,
        cinemaId: showForm.cinemaId,
        screenId: showForm.screenId,
        startTime: new Date(showForm.startTime).toISOString(),
        format: showForm.format,
        pricing: {
          Standard: parseFloat(showForm.standardPrice),
          Premium: parseFloat(showForm.premiumPrice),
          VIP: parseFloat(showForm.vipPrice),
        },
      });

      if (res.data.success) {
        setNotification({
          type: 'success',
          message: 'Show scheduled successfully! Seat inventory generated.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Schedule conflict or validation error.',
      });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-cinema-900 border border-cinema-800 rounded-3xl p-8 space-y-4">
        <Shield className="w-12 h-12 text-crimson-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-cinema-400">
          This dashboard is strictly restricted to authorized system administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-400" />
            Admin Operations Portal
          </h1>
          <p className="text-sm text-cinema-400 mt-1">
            Manage cinemas, configure screen layouts, schedule shows, and monitor platform revenue.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cinema-800 gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-crimson-500 text-crimson-500'
              : 'border-transparent text-cinema-400 hover:text-white'
          }`}
        >
          Metrics & Overview
        </button>
        <button
          onClick={() => setActiveTab('new-show')}
          className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'new-show'
              ? 'border-crimson-500 text-crimson-500'
              : 'border-transparent text-cinema-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Schedule Showtime
        </button>
        <button
          onClick={() => setActiveTab('new-cinema')}
          className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'new-cinema'
              ? 'border-crimson-500 text-crimson-500'
              : 'border-transparent text-cinema-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Add Multiplex
        </button>
        <button
          onClick={() => setActiveTab('all-bookings')}
          className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'all-bookings'
              ? 'border-crimson-500 text-crimson-500'
              : 'border-transparent text-cinema-400 hover:text-white'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Customer Bookings
        </button>
        <button
          onClick={() => {
            setActiveTab('manual-payments');
            loadManualPayments();
          }}
          className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'manual-payments'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-cinema-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>UPI QR Verifications</span>
          {manualPayments.length > 0 && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-black">
              {manualPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-600 text-emerald-300'
              : 'bg-crimson-950/80 border border-crimson-600 text-crimson-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-crimson-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tab 1: Overview & Metrics */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 space-y-2">
              <span className="text-xs font-semibold text-cinema-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Total Revenue
              </span>
              <p className="text-3xl font-black text-white">₹{stats?.totalRevenue || 0}</p>
              <span className="text-[11px] text-emerald-400 font-medium">Verified payments</span>
            </div>

            <div className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 space-y-2">
              <span className="text-xs font-semibold text-cinema-400 uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-crimson-500" />
                Tickets Sold
              </span>
              <p className="text-3xl font-black text-white">{stats?.totalTicketsSold || 0}</p>
              <span className="text-[11px] text-cinema-400">Confirmed seats</span>
            </div>

            <div className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 space-y-2">
              <span className="text-xs font-semibold text-cinema-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-400" />
                Active Cinemas
              </span>
              <p className="text-3xl font-black text-white">{stats?.totalCinemas || 0}</p>
              <span className="text-[11px] text-cinema-400">Indexed locations</span>
            </div>

            <div className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 space-y-2">
              <span className="text-xs font-semibold text-cinema-400 uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-4 h-4 text-amber-400" />
                Active Shows
              </span>
              <p className="text-3xl font-black text-white">{stats?.totalShows || 0}</p>
              <span className="text-[11px] text-cinema-400">Bookable schedules</span>
            </div>
          </div>

          {/* Recent Customer Bookings */}
          <div className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            {recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-cinema-300">
                  <thead className="bg-cinema-850 text-cinema-400 uppercase border-b border-cinema-800">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Movie</th>
                      <th className="p-3">Cinema</th>
                      <th className="p-3">Seats</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-800">
                    {recentBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-cinema-850/50">
                        <td className="p-3 font-mono font-bold text-white">{b.bookingReference}</td>
                        <td className="p-3">{b.userId?.name || b.userId?.email || 'Customer'}</td>
                        <td className="p-3 font-semibold text-white">{b.movieId?.title}</td>
                        <td className="p-3">{b.cinemaId?.name}</td>
                        <td className="p-3">{b.seats?.map((s: any) => s.seatIdentifier).join(', ')}</td>
                        <td className="p-3 font-bold text-emerald-400">₹{b.totalAmount}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                              b.status === 'confirmed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-crimson-950 text-crimson-400'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-cinema-400">No transactions recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Schedule New Showtime */}
      {activeTab === 'new-show' && (
        <form onSubmit={handleCreateShow} className="bg-cinema-900 border border-cinema-800 rounded-3xl p-8 max-w-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-crimson-500" />
            Schedule a Showtime
          </h2>
          <p className="text-xs text-cinema-400">
            Scheduling automatically validates screen availability to prevent duplicate or overlapping bookings.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Movie</label>
              <select
                value={showForm.movieId}
                onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                required
                className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
              >
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.runtime}m)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Cinema Multiplex</label>
              <select
                value={showForm.cinemaId}
                onChange={(e) => setShowForm({ ...showForm, cinemaId: e.target.value })}
                required
                className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
              >
                {cinemas.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Screen / Audi</label>
              <select
                value={showForm.screenId}
                onChange={(e) => setShowForm({ ...showForm, screenId: e.target.value })}
                required
                className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
              >
                {screens.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.screenType}) - {s.totalSeats} seats
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Format</label>
              <select
                value={showForm.format}
                onChange={(e) => setShowForm({ ...showForm, format: e.target.value })}
                className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
              >
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX 2D">IMAX 2D</option>
                <option value="IMAX 3D">IMAX 3D</option>
                <option value="4DX">4DX</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Date & Showtime</label>
            <input
              type="datetime-local"
              required
              value={showForm.startTime}
              onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
              className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
            />
          </div>

          {/* Pricing Tiers */}
          <div>
            <label className="block text-xs font-semibold text-cinema-300 uppercase mb-2">Category Pricing (INR)</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-cinema-400 uppercase">Standard</span>
                <input
                  type="number"
                  value={showForm.standardPrice}
                  onChange={(e) => setShowForm({ ...showForm, standardPrice: e.target.value })}
                  className="w-full p-2 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-sky-400 uppercase">Premium</span>
                <input
                  type="number"
                  value={showForm.premiumPrice}
                  onChange={(e) => setShowForm({ ...showForm, premiumPrice: e.target.value })}
                  className="w-full p-2 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 uppercase">VIP</span>
                <input
                  type="number"
                  value={showForm.vipPrice}
                  onChange={(e) => setShowForm({ ...showForm, vipPrice: e.target.value })}
                  className="w-full p-2 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-xl transition shadow-glow-crimson-sm"
          >
            Create Showtime & Generate Seat Inventory
          </button>
        </form>
      )}

      {/* Tab 3: Add New Multiplex */}
      {activeTab === 'new-cinema' && (
        <form onSubmit={handleCreateCinema} className="bg-cinema-900 border border-cinema-800 rounded-3xl p-8 max-w-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-crimson-500" />
            Register a New Cinema Multiplex
          </h2>
          <p className="text-xs text-cinema-400">
            Coordinates are stored using MongoDB 2dsphere index for location proximity queries.
          </p>

          <div>
            <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Cinema Name</label>
            <input
              type="text"
              required
              placeholder="e.g. PVR INOX: Nexus Mall"
              value={cinemaForm.name}
              onChange={(e) => setCinemaForm({ ...cinemaForm, name: e.target.value })}
              className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Locality</label>
              <input
                type="text"
                required
                placeholder="e.g. Koramangala"
                value={cinemaForm.locality}
                onChange={(e) => setCinemaForm({ ...cinemaForm, locality: e.target.value })}
                className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">City</label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru"
                value={cinemaForm.city}
                onChange={(e) => setCinemaForm({ ...cinemaForm, city: e.target.value })}
                className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Address</label>
            <input
              type="text"
              required
              placeholder="e.g. Hosur Road, Koramangala 7th Block"
              value={cinemaForm.address}
              onChange={(e) => setCinemaForm({ ...cinemaForm, address: e.target.value })}
              className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Latitude</label>
              <input
                type="text"
                required
                value={cinemaForm.latitude}
                onChange={(e) => setCinemaForm({ ...cinemaForm, latitude: e.target.value })}
                className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Longitude</label>
              <input
                type="text"
                required
                value={cinemaForm.longitude}
                onChange={(e) => setCinemaForm({ ...cinemaForm, longitude: e.target.value })}
                className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cinema-300 uppercase mb-1">Amenities (Comma separated)</label>
            <input
              type="text"
              value={cinemaForm.amenities}
              onChange={(e) => setCinemaForm({ ...cinemaForm, amenities: e.target.value })}
              className="w-full p-2.5 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-xl transition shadow-glow-crimson-sm"
          >
            Create Cinema
          </button>
        </form>
      )}

      {/* Tab 4: All Bookings */}
      {activeTab === 'all-bookings' && (
        <div className="bg-cinema-900 border border-cinema-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-crimson-500" />
            All Bookings ({recentBookings.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-cinema-300">
              <thead className="bg-cinema-850 text-cinema-400 uppercase border-b border-cinema-800">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Movie</th>
                  <th className="p-3">Seats</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-800">
                {recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-cinema-850/50">
                    <td className="p-3 font-mono font-bold text-white">{b.bookingReference}</td>
                    <td className="p-3">{b.userId?.name || b.userId?.email || 'Customer'}</td>
                    <td className="p-3 font-semibold text-white">{b.movieId?.title}</td>
                    <td className="p-3">{b.seats?.map((s: any) => s.seatIdentifier).join(', ')}</td>
                    <td className="p-3 font-bold text-emerald-400">₹{b.totalAmount}</td>
                    <td className="p-3">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-crimson-950 text-crimson-400'
                        }`}
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
      )}

      {/* Manual PhonePe Payment Verifications Tab */}
      {activeTab === 'manual-payments' && (
        <div className="bg-cinema-900 border border-cinema-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-800 pb-5">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-emerald-400" />
                UPI QR Payment Verifications ({manualPayments.length})
              </h2>
              <p className="text-xs text-cinema-400 mt-1">
                Review submitted UTR / UPI transaction IDs against your UPI / bank statement and approve to issue tickets.
              </p>
            </div>
            <button
              onClick={loadManualPayments}
              className="px-4 py-2 bg-cinema-850 hover:bg-cinema-800 border border-cinema-750 text-cinema-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer w-fit"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {manualPayments.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-white">All Caught Up!</h3>
              <p className="text-xs text-cinema-400 max-w-sm mx-auto">
                There are no pending PhonePe manual verification requests in the queue right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {manualPayments.map((b) => (
                <div
                  key={b._id}
                  className="p-5 bg-cinema-850/80 border border-cinema-750 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-purple-500/50 transition"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2.5 py-1 rounded-lg">
                        {b.bookingReference}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          b.status === 'pending_verification'
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                            : 'bg-cinema-800 text-cinema-400'
                        }`}
                      >
                        {b.status === 'pending_verification' ? 'UTR Submitted — Needs Review' : 'Pending UTR Submission'}
                      </span>
                      <span className="text-xs text-cinema-400">
                        {b.movieId?.title} &bull; {b.cinemaId?.name} ({b.screenId?.name})
                      </span>
                    </div>

                    {/* UTR & Transaction Highlight Box */}
                    <div className="p-3 bg-cinema-900 border border-cinema-700/80 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-cinema-400 block">Submitted UTR / Ref ID</span>
                        <span className="font-mono text-sm font-black text-amber-400 tracking-wider">
                          {b.manualPayment?.utrNumber || 'Not submitted yet'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-cinema-400 block">Customer / Payer UPI</span>
                        <span className="font-medium text-white truncate block">
                          {b.manualPayment?.payerUpiId || b.userId?.email || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-cinema-400 block">Seats & Amount</span>
                        <span className="font-bold text-white">
                          {b.seats?.map((s: any) => s.seatIdentifier).join(', ')} &bull;{' '}
                          <strong className="text-emerald-400">₹{b.totalAmount}</strong>
                        </span>
                      </div>
                    </div>

                    {b.manualPayment?.customerNotes && (
                      <p className="text-xs text-cinema-300 italic">
                        Note: &ldquo;{b.manualPayment.customerNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col lg:flex-row items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleApprovePayment(b._id)}
                      disabled={isProcessingPayment === b._id}
                      className="flex-1 sm:w-full lg:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>{isProcessingPayment === b._id ? 'Verifying...' : 'Approve & Issue Ticket'}</span>
                    </button>
                    <button
                      onClick={() => handleRejectPayment(b._id)}
                      disabled={isProcessingPayment === b._id}
                      className="flex-1 sm:w-full lg:w-auto px-4 py-2.5 bg-crimson-600/20 hover:bg-crimson-600 text-crimson-400 hover:text-white border border-crimson-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject & Release</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
