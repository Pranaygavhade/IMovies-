import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  Calendar,
  Globe,
  MapPin,
  Sparkles,
  Ticket,
  Heart,
  Send,
  Building2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';
import api from '../services/api.js';
import { IMovie, IReview, ICinema, IShow } from '../types/index.js';
import { getBackdropUrl, getPosterUrl, handleImageError } from '../utils/tmdbImage.js';
import { useAuth } from '../context/AuthContext.js';
import { useLocation } from '../context/LocationContext.js';

interface CinemaListing {
  cinema: ICinema;
  shows: IShow[];
}

export const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, toggleFavorite, openAuthModal } = useAuth();
  const { selectedCity, setSelectedCity, openLocationModal } = useLocation();

  const [movie, setMovie] = useState<IMovie | null>(null);
  const [cinemas, setCinemas] = useState<CinemaListing[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review form state
  const [newRating, setNewRating] = useState(9);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  const showtimesRef = useRef<HTMLDivElement>(null);

  // Helper to reliably extract local calendar date string (YYYY-MM-DD)
  const getShowDateString = (s: IShow): string => {
    if (s.date && typeof s.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.date.trim())) {
      return s.date.trim();
    }
    if (s.startTime) {
      const d = new Date(s.startTime);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    }
    return '';
  };

  // Generate 7 calendar date options (Today, Tomorrow, and subsequent 5 days)
  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yr}-${mo}-${da}`;
      const dayLabel =
        i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const formatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      return { dateStr, label: `${dayLabel}, ${formatted}`, dayLabel, formatted };
    });
  }, []);

  const fetchMovieDetails = async () => {
    if (!id || id === 'undefined' || id === 'null') {
      setErrorMessage('Invalid or missing movie ID. Please pick a movie from the catalog.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const endpoint = selectedCity
        ? `/movies/${id}?city=${encodeURIComponent(selectedCity)}`
        : `/movies/${id}`;
      const res = await api.get(endpoint);

      if (res.data.success) {
        setMovie(res.data.movie);
        const fetchedCinemas: CinemaListing[] = res.data.cinemas || [];
        setCinemas(fetchedCinemas);
        setAvailableCities(res.data.availableCities || []);
        setReviews(res.data.reviews || []);

        // Auto-select first date that actually has scheduled shows if today has none
        if (fetchedCinemas.length > 0) {
          const allShows = fetchedCinemas.flatMap((c) => c.shows || []);
          const todayStr = dateOptions[0].dateStr;
          const hasTodayShows = allShows.some((s) => {
            const isFuture = new Date(s.startTime).getTime() > Date.now();
            return getShowDateString(s) === todayStr && isFuture;
          });

          if (!hasTodayShows) {
            // Find first date that has shows
            for (const opt of dateOptions) {
              if (allShows.some((s) => getShowDateString(s) === opt.dateStr)) {
                setSelectedDate(opt.dateStr);
                break;
              }
            }
          }
        }
      } else {
        setErrorMessage(res.data.message || 'Could not load movie details.');
      }
    } catch (err: any) {
      console.warn('Failed to load movie details:', err);
      const msg = err.response?.data?.message || 'Unable to connect to movie service. Please check your network or try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [id, selectedCity]);

  // Compute show count per date tab to inform the user
  const showCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const opt of dateOptions) {
      counts[opt.dateStr] = 0;
    }
    const nowMs = Date.now();
    for (const c of cinemas) {
      for (const s of c.shows || []) {
        const isFuture = new Date(s.startTime).getTime() > nowMs;
        if (!isFuture) continue;
        const sDate = getShowDateString(s);
        if (counts[sDate] !== undefined) {
          counts[sDate]++;
        }
      }
    }
    return counts;
  }, [cinemas, dateOptions]);

  // Filter shows by selected date
  const filteredCinemas = useMemo(() => {
    const nowMs = Date.now();
    return cinemas
      .map((c) => ({
        cinema: c.cinema,
        shows: (c.shows || []).filter((s) => {
          const sDate = getShowDateString(s);
          const isFuture = new Date(s.startTime).getTime() > nowMs;
          return sDate === selectedDate && isFuture;
        }),
      }))
      .filter((c) => c.shows.length > 0);
  }, [cinemas, selectedDate]);

  const scrollToShowtimes = () => {
    if (showtimesRef.current) {
      showtimesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    setReviewMessage(null);
    try {
      const res = await api.post(`/movies/${id}/reviews`, {
        rating: newRating,
        comment: newComment,
      });
      if (res.data.success) {
        setReviews([res.data.review, ...reviews]);
        setNewComment('');
        setReviewMessage('Your review was posted successfully!');
        if (movie && res.data.newAverage) {
          setMovie({ ...movie, voteAverage: res.data.newAverage });
        }
      }
    } catch (err: any) {
      setReviewMessage(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="w-full aspect-[21/9] bg-cinema-900 rounded-3xl" />
        <div className="h-10 bg-cinema-900 rounded-xl w-1/3" />
        <div className="h-44 bg-cinema-900 rounded-2xl" />
      </div>
    );
  }

  // 2. Error / Not Found State
  if (errorMessage || !movie) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 sm:p-10 text-center bg-cinema-900 border border-cinema-750 rounded-3xl space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-crimson-600/15 border border-crimson-500/30 text-crimson-500 rounded-2xl mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">Movie Unavailable</h2>
            <p className="text-sm text-cinema-300">
              {errorMessage || 'The requested movie could not be found or has been archived.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchMovieDetails}
              className="flex items-center gap-2 px-5 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-xl text-xs transition shadow-glow-crimson-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              to="/movies"
              className="flex items-center gap-2 px-5 py-2.5 bg-cinema-850 hover:bg-cinema-800 text-cinema-200 hover:text-white border border-cinema-750 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse All Movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isFavorite = movie._id ? user?.favorites?.includes(movie._id) : false;
  const genresList = Array.isArray(movie.genres) ? movie.genres : [];
  const languagesList = Array.isArray(movie.spokenLanguages) && movie.spokenLanguages.length > 0
    ? movie.spokenLanguages
    : [movie.originalLanguage || 'English'];

  let releaseYear = '2024';
  if (movie.releaseDate) {
    const yr = new Date(movie.releaseDate).getFullYear();
    if (!isNaN(yr)) releaseYear = String(yr);
  }

  return (
    <div className="space-y-12">
      {/* 1. Cinematic Backdrop Header Banner */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[440px] max-h-[540px] rounded-3xl overflow-hidden border border-cinema-800 shadow-2xl bg-cinema-900 select-none">
        <img
          src={getBackdropUrl(movie.backdropPath, 'w1280')}
          alt={movie.title}
          onError={(e) => handleImageError(e, 'backdrop')}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-950/95 via-cinema-950/50 to-transparent w-full sm:w-4/5 pointer-events-none" />

        {/* Floating Poster & Info Header */}
        <div className="absolute inset-0 flex items-end p-6 sm:p-10 lg:p-12 gap-8 z-10">
          {/* Portrait Poster */}
          <div className="hidden sm:block w-48 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-cinema-700 shadow-2xl shrink-0 bg-cinema-850">
            <img
              src={getPosterUrl(movie.posterPath, 'w500')}
              alt={movie.title}
              onError={(e) => handleImageError(e, 'poster')}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title & Metadata */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-xs font-bold backdrop-blur-md">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{typeof movie.voteAverage === 'number' ? movie.voteAverage.toFixed(1) : '7.5'}</span>
                <span className="text-[10px] text-amber-300/70">
                  ({movie.voteCount || 0} reviews)
                </span>
              </div>

              {movie.runtime && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-cinema-200 text-xs font-medium backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{movie.runtime} min</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-cinema-200 text-xs font-medium backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5" />
                <span>{releaseYear}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-cinema-200 text-xs font-medium backdrop-blur-md">
                <Globe className="w-3.5 h-3.5" />
                <span>{languagesList.join(', ')}</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
              {movie.title}
            </h1>

            <div className="flex flex-wrap gap-2">
              {genresList.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 bg-cinema-850/80 border border-cinema-700 rounded-full text-cinema-300 text-xs font-medium"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={scrollToShowtimes}
                className="flex items-center gap-2 px-6 py-3 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-xl text-sm transition shadow-glow-crimson group cursor-pointer"
              >
                <Ticket className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>Book Tickets</span>
              </button>

              {movie._id && (
                <button
                  onClick={() => toggleFavorite(movie._id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                    isFavorite
                      ? 'bg-crimson-600/20 border-crimson-500 text-crimson-400'
                      : 'bg-cinema-850 border-cinema-750 text-cinema-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-crimson-500 text-crimson-500' : ''}`} />
                  {isFavorite ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Synopsis Section */}
      <section className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 sm:p-8 space-y-3">
        <h2 className="text-xl font-bold text-white tracking-tight">About the Movie</h2>
        <p className="text-cinema-300 text-sm sm:text-base leading-relaxed">
          {movie.overview || 'No overview available for this title.'}
        </p>
      </section>

      {/* 3. Screenings & Showtimes Booking Section */}
      <section ref={showtimesRef} id="showtimes-section" className="space-y-6 scroll-mt-24">
        <div className="bg-cinema-900 border border-cinema-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cinema-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-crimson-500 text-xs font-bold uppercase tracking-wider mb-1">
                <Ticket className="w-4 h-4" />
                <span>Ticket Reservations</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Available Showtimes {selectedCity ? `in ${selectedCity}` : 'Across Multiplexes'}
              </h2>
              <p className="text-xs text-cinema-400 mt-1">
                Select your preferred date, multiplex, and showtime to choose your seats.
              </p>
            </div>

            {/* City Selection Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-cinema-400 font-medium">City:</span>
              {['Indore', 'Nagpur', 'Mumbai', 'Delhi NCR'].map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    selectedCity?.toLowerCase() === city.toLowerCase()
                      ? 'bg-crimson-600 text-white border-crimson-500 shadow-glow-crimson-sm'
                      : 'bg-cinema-850 text-cinema-300 border-cinema-750 hover:text-white hover:border-cinema-700'
                  }`}
                >
                  {city}
                </button>
              ))}
              <button
                onClick={openLocationModal}
                className="px-3 py-1.5 bg-cinema-850 hover:bg-cinema-800 text-cinema-300 hover:text-white rounded-xl text-xs font-bold border border-cinema-750 flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-crimson-400" />
                <span>More Cities</span>
              </button>
            </div>
          </div>

          {/* Date Picker Bar with Live Count Badges */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-cinema-400 uppercase tracking-wider block">
              Choose Date
            </span>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
              {dateOptions.map((opt) => {
                const count = showCountByDate[opt.dateStr] || 0;
                const isSelected = selectedDate === opt.dateStr;

                return (
                  <button
                    key={opt.dateStr}
                    onClick={() => setSelectedDate(opt.dateStr)}
                    className={`flex flex-col items-center px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition border cursor-pointer ${
                      isSelected
                        ? 'bg-crimson-600 border-crimson-500 text-white shadow-glow-crimson-sm'
                        : 'bg-cinema-850 border-cinema-750 text-cinema-300 hover:text-white hover:border-cinema-700'
                    }`}
                  >
                    <span className="font-bold">{opt.dayLabel}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-cinema-400'}`}>
                      {opt.formatted}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold mt-1 ${
                        count > 0
                          ? isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-cinema-800 text-cinema-500'
                      }`}
                    >
                      {count} {count === 1 ? 'Show' : 'Shows'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cinema-Specific Showtimes */}
          {filteredCinemas.length > 0 ? (
            <div className="space-y-4 pt-2">
              {filteredCinemas.map(({ cinema, shows }) => (
                <div
                  key={cinema._id}
                  className="bg-cinema-850/60 border border-cinema-750 rounded-2xl p-5 sm:p-6 space-y-4 transition hover:border-cinema-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cinema-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-crimson-500" />
                        {cinema.name}
                      </h3>
                      <p className="text-xs text-cinema-400 mt-0.5">
                        {cinema.address}, {cinema.locality} ({cinema.city})
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(cinema.amenities || []).slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="px-2 py-0.5 bg-cinema-900 rounded text-[10px] text-cinema-400 border border-cinema-800"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Showtimes Pills */}
                  <div>
                    <span className="text-[11px] font-semibold text-cinema-400 uppercase tracking-wider block mb-2">
                      Available Showtimes
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {shows.map((show) => {
                        const time = new Date(show.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        });
                        const screenName = (show.screenId as any)?.name || 'Screen 1';
                        const startPrice = show.pricing?.Standard || 220;

                        return (
                          <Link
                            key={show._id}
                            to={`/shows/${show._id}/seats`}
                            className="group flex flex-col items-center justify-center px-5 py-3 rounded-xl bg-cinema-900 hover:bg-crimson-600 border border-cinema-750 hover:border-crimson-500 text-center transition-all duration-200 hover:shadow-glow-crimson-sm hover:scale-105 cursor-pointer"
                          >
                            <span className="text-sm font-black text-white group-hover:text-white">
                              {time}
                            </span>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-cinema-400 group-hover:text-white/90">
                              <span className="font-semibold">{show.format || '2D'}</span>
                              <span>•</span>
                              <span>{screenName}</span>
                              <span>•</span>
                              <span className="text-emerald-400 group-hover:text-white font-bold">₹{startPrice}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-cinema-850/40 border border-cinema-750 rounded-2xl space-y-3">
              <Building2 className="w-10 h-10 text-cinema-500 mx-auto" />
              {cinemas.some((c) => (c.shows || []).length > 0) ? (
                <>
                  <h3 className="text-base font-bold text-white">
                    No Upcoming Screenings on {dateOptions.find((o) => o.dateStr === selectedDate)?.label || selectedDate} in {selectedCity || 'Selected City'}
                  </h3>
                  <p className="text-xs text-cinema-400 max-w-md mx-auto leading-relaxed">
                    All scheduled screenings for this date have concluded or start on upcoming dates. Pick another date to view showtimes in {selectedCity}:
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center gap-2">
                    {dateOptions
                      .filter((opt) => (showCountByDate[opt.dateStr] || 0) > 0)
                      .map((opt) => (
                        <button
                          key={opt.dateStr}
                          onClick={() => setSelectedDate(opt.dateStr)}
                          className="px-3.5 py-1.5 bg-cinema-800 hover:bg-crimson-600 border border-cinema-700 text-cinema-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          {opt.label} ({showCountByDate[opt.dateStr]} Shows)
                        </button>
                      ))}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-base font-bold text-white">
                    No Screenings in {selectedCity || 'Selected City'}
                  </h3>
                  <p className="text-xs text-cinema-400 max-w-md mx-auto leading-relaxed">
                    {movie.title} is currently not scheduled in {selectedCity || 'this city'}.
                    {availableCities.filter((c) => c.toLowerCase() !== (selectedCity || '').toLowerCase()).length > 0 &&
                      ' You can check showtimes in other cinema hubs:'}
                  </p>
                  {availableCities.filter((c) => c.toLowerCase() !== (selectedCity || '').toLowerCase()).length > 0 && (
                    <div className="pt-2 flex flex-wrap justify-center gap-2">
                      {availableCities
                        .filter((c) => c.toLowerCase() !== (selectedCity || '').toLowerCase())
                        .map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedCity(c)}
                            className="px-3.5 py-1.5 bg-cinema-800 hover:bg-crimson-600 border border-cinema-700 text-cinema-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            View {c} Shows
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Audience Reviews & Ratings */}
      <section className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          Audience Reviews ({reviews.length})
        </h2>

        {/* Add Review Form */}
        <form onSubmit={handleReviewSubmit} className="p-4 bg-cinema-850 border border-cinema-750 rounded-xl space-y-3">
          <h4 className="text-sm font-semibold text-white">Leave a Review</h4>
          {reviewMessage && (
            <p className="text-xs text-emerald-400 font-medium">{reviewMessage}</p>
          )}

          <div className="flex items-center gap-4">
            <label className="text-xs text-cinema-400">Rating:</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setNewRating(num)}
                  className={`w-7 h-7 rounded text-xs font-bold transition cursor-pointer ${
                    newRating >= num
                      ? 'bg-amber-500 text-black'
                      : 'bg-cinema-800 text-cinema-400 hover:bg-cinema-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-400">{newRating} / 10</span>
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
            rows={3}
            placeholder="Write your review about the film (performance, direction, sound)..."
            className="w-full p-3 bg-cinema-900 border border-cinema-750 rounded-xl text-sm text-white placeholder-cinema-500 outline-none focus:border-crimson-500"
          />

          <button
            type="submit"
            disabled={isSubmittingReview}
            className="flex items-center gap-2 px-5 py-2 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-glow-crimson-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmittingReview ? 'Submitting...' : 'Post Review'}
          </button>
        </form>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev._id} className="p-4 bg-cinema-850/60 border border-cinema-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{rev.userId?.name || 'Customer'}</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{rev.rating} / 10</span>
                  </div>
                </div>
                <p className="text-xs text-cinema-300 leading-relaxed">{rev.comment}</p>
                <p className="text-[10px] text-cinema-500">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-cinema-400">No reviews yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </section>
    </div>
  );
};
