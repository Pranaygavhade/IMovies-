import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Film, Calendar, Clock, MapPin, XCircle, Heart, ChevronRight } from 'lucide-react';
import api from '../services/api.js';
import { IBooking, IMovie } from '../types/index.js';
import { getPosterUrl, handleImageError } from '../utils/tmdbImage.js';
import { useAuth } from '../context/AuthContext.js';
import { MovieCard } from '../components/MovieCard.js';

export const MyBookingsPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'watchlist'>('upcoming');
  const [upcomingBookings, setUpcomingBookings] = useState<IBooking[]>([]);
  const [pastBookings, setPastBookings] = useState<IBooking[]>([]);
  const [watchlistMovies, setWatchlistMovies] = useState<IMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [bookingsRes, favsRes] = await Promise.all([
          api.get('/bookings/my-bookings'),
          api.get('/auth/favorites'),
        ]);

        if (bookingsRes.data.success) {
          setUpcomingBookings(bookingsRes.data.upcoming || []);
          setPastBookings(bookingsRes.data.past || []);
        }

        if (favsRes.data.success) {
          setWatchlistMovies(favsRes.data.favorites || []);
        }
      } catch (err) {
        console.error('Failed to load user bookings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This will release your seats.')) {
      return;
    }

    setCancellingId(bookingId);
    setMessage(null);
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`, {
        reason: 'Customer initiated cancellation',
      });
      if (res.data.success) {
        setMessage('Booking cancelled successfully. Seats have been made available.');
        setUpcomingBookings((prev) => prev.filter((b) => b._id !== bookingId));
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-cinema-900 border border-cinema-800 rounded-3xl p-8 space-y-4">
        <Ticket className="w-12 h-12 text-crimson-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In to View Bookings</h2>
        <p className="text-xs text-cinema-400">
          Access your digital tickets, upcoming showtimes, and movie watchlist.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white font-semibold rounded-xl text-xs transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Ticket className="w-8 h-8 text-crimson-500" />
          My Cinema Hub
        </h1>
        <p className="text-sm text-cinema-400 mt-1">
          Manage your booked movie tickets, view past admissions, and access your watchlist.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cinema-800 gap-4">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'upcoming'
              ? 'border-crimson-500 text-crimson-500'
              : 'border-transparent text-cinema-400 hover:text-white'
          }`}
        >
          Upcoming Tickets ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'past'
              ? 'border-crimson-500 text-crimson-500'
              : 'border-transparent text-cinema-400 hover:text-white'
          }`}
        >
          Past Bookings ({pastBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'watchlist'
              ? 'border-crimson-500 text-crimson-500'
              : 'border-transparent text-cinema-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          Watchlist ({watchlistMovies.length})
        </button>
      </div>

      {message && (
        <div className="p-4 bg-cinema-850 border border-cinema-750 rounded-2xl text-xs text-cinema-200">
          {message}
        </div>
      )}

      {/* Tab Contents */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-cinema-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'upcoming' ? (
        <div className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((b) => {
              const movie: any = b.movieId;
              const cinema: any = b.cinemaId;
              const screen: any = b.screenId;
              const show: any = b.showId;

              return (
                <div
                  key={b._id}
                  className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-cinema-750 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-cinema-750">
                      <img
                        src={getPosterUrl(movie?.posterPath, 'w342')}
                        alt={movie?.title}
                        onError={(e) => handleImageError(e, 'poster')}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                          Confirmed
                        </span>
                        <span className="text-xs font-mono font-bold text-cinema-400">
                          {b.bookingReference}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{movie?.title}</h3>
                      <p className="text-xs text-cinema-400">
                        {cinema?.name} • {screen?.name}
                      </p>
                      <p className="text-xs text-cinema-300 font-medium flex items-center gap-3 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-crimson-500" />
                          {show?.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-crimson-500" />
                          {show?.startTime
                            ? new Date(show.startTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })
                            : ''}
                        </span>
                        <span className="font-bold text-white">
                          Seats: {b.seats.map((s) => s.seatIdentifier).join(', ')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleCancelBooking(b._id)}
                      disabled={cancellingId === b._id}
                      className="px-4 py-2 bg-cinema-850 hover:bg-crimson-950/60 text-cinema-400 hover:text-crimson-400 border border-cinema-750 rounded-xl text-xs font-semibold transition"
                    >
                      {cancellingId === b._id ? 'Cancelling...' : 'Cancel Ticket'}
                    </button>
                    <Link
                      to={`/bookings/${b._id}`}
                      className="px-5 py-2 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl text-xs font-bold transition shadow-glow-crimson-sm"
                    >
                      View Ticket
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-16 text-center bg-cinema-900 border border-cinema-800 rounded-2xl space-y-3">
              <Ticket className="w-12 h-12 text-cinema-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Upcoming Tickets</h3>
              <p className="text-xs text-cinema-400">
                You don't have any confirmed upcoming movies. Book your seats now!
              </p>
              <Link
                to="/movies"
                className="inline-block px-5 py-2 bg-crimson-600 text-white text-xs font-semibold rounded-xl"
              >
                Browse Now Showing
              </Link>
            </div>
          )}
        </div>
      ) : activeTab === 'past' ? (
        <div className="space-y-4">
          {pastBookings.length > 0 ? (
            pastBookings.map((b) => {
              const movie: any = b.movieId;
              const cinema: any = b.cinemaId;

              return (
                <div
                  key={b._id}
                  className="bg-cinema-900/60 border border-cinema-800 rounded-2xl p-6 flex items-center justify-between gap-4 opacity-80"
                >
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        b.status === 'confirmed'
                          ? 'bg-cinema-800 text-cinema-400'
                          : 'bg-crimson-950 text-crimson-400'
                      }`}
                    >
                      {b.status}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{movie?.title}</h4>
                    <p className="text-xs text-cinema-400">
                      {cinema?.name} • Ref: {b.bookingReference} • ₹{b.totalAmount}
                    </p>
                  </div>
                  <Link
                    to={`/bookings/${b._id}`}
                    className="text-xs text-crimson-400 hover:text-crimson-300 font-semibold"
                  >
                    Details →
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-cinema-900 border border-cinema-800 rounded-2xl text-xs text-cinema-400">
              No past booking history found.
            </div>
          )}
        </div>
      ) : (
        <div>
          {watchlistMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {watchlistMovies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-cinema-900 border border-cinema-800 rounded-2xl space-y-3">
              <Heart className="w-12 h-12 text-cinema-500 mx-auto" />
              <h3 className="text-base font-bold text-white">Your Watchlist is Empty</h3>
              <p className="text-xs text-cinema-400">
                Click the heart icon on any movie card to bookmark it here for later.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
