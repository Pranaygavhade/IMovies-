import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, Sparkles, Calendar, ChevronRight } from 'lucide-react';
import api from '../services/api.js';
import { ICinema, IMovie, IShow } from '../types/index.js';
import { getPosterUrl, handleImageError } from '../utils/tmdbImage.js';

interface MovieSchedule {
  movie: IMovie;
  shows: IShow[];
}

export const CinemaDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cinema, setCinema] = useState<ICinema | null>(null);
  const [movieSchedules, setMovieSchedules] = useState<MovieSchedule[]>([]);
  // Helper to get local date string YYYY-MM-DD
  const toLocalDateStr = (d: Date) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateStr(new Date()));
  const [isLoading, setIsLoading] = useState(true);

  // Generate date tabs: Today, Tomorrow, and next 5 days (7 days total)
  const dateOptions = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = toLocalDateStr(d);
    const dayLabel =
      i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return { dateStr, label: `${dayLabel}, ${formatted}` };
  });

  useEffect(() => {
    async function loadCinemaDetails() {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/cinemas/${id}?date=${selectedDate}`);
        if (res.data.success) {
          setCinema(res.data.cinema);
          setMovieSchedules(res.data.movies || []);
        }
      } catch (err) {
        console.error('Failed to load cinema details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCinemaDetails();
  }, [id, selectedDate]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-cinema-900 rounded-3xl" />
        <div className="h-64 bg-cinema-900 rounded-2xl" />
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="p-16 text-center bg-cinema-900 border border-cinema-800 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Cinema Not Found</h2>
        <Link to="/cinemas" className="px-6 py-2 bg-crimson-600 text-white text-sm rounded-xl font-semibold">
          Browse All Cinemas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Cinema Header Card */}
      <div className="bg-cinema-900 border border-cinema-800 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-crimson-500 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              Multiplex Details
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {cinema.name}
            </h1>
            <p className="text-cinema-300 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cinema-500 shrink-0" />
              {cinema.address}, {cinema.locality}, {cinema.city} {cinema.postalCode && `- ${cinema.postalCode}`}
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs text-cinema-400">
            {cinema.phone && (
              <span className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-crimson-500" />
                {cinema.phone}
              </span>
            )}
            {cinema.email && (
              <span className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-crimson-500" />
                {cinema.email}
              </span>
            )}
          </div>
        </div>

        {/* Amenities Bar */}
        <div className="pt-4 border-t border-cinema-800 flex flex-wrap gap-2">
          {cinema.amenities.map((a) => (
            <span
              key={a}
              className="flex items-center gap-1.5 px-3 py-1 bg-cinema-850 border border-cinema-750 rounded-full text-xs text-cinema-300"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Showtimes Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-crimson-500" />
            Screenings & Showtimes
          </h2>

          {/* Date Picker */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {dateOptions.map((opt) => (
              <button
                key={opt.dateStr}
                onClick={() => setSelectedDate(opt.dateStr)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  selectedDate === opt.dateStr
                    ? 'bg-crimson-600 border-crimson-500 text-white shadow-glow-crimson-sm'
                    : 'bg-cinema-900 border-cinema-800 text-cinema-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Movie Listings at this Cinema */}
        {movieSchedules.length > 0 ? (
          <div className="space-y-6">
            {movieSchedules.map(({ movie, shows }) => (
              <div
                key={movie._id}
                className="bg-cinema-900 border border-cinema-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6"
              >
                {/* Poster */}
                <div className="w-24 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-cinema-750">
                  <img
                    src={getPosterUrl(movie.posterPath, 'w342')}
                    alt={movie.title}
                    onError={(e) => handleImageError(e, 'poster')}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Movie Details & Showtimes */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Link
                      to={`/movies/${movie._id}`}
                      className="text-xl font-bold text-white hover:text-crimson-400 transition"
                    >
                      {movie.title}
                    </Link>
                    <p className="text-xs text-cinema-400 mt-1">
                      {movie.genres.join(' • ')} • {movie.runtime} min • {movie.spokenLanguages[0] || 'English'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {shows.map((show) => {
                      const time = new Date(show.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });

                      return (
                        <Link
                          key={show._id}
                          to={`/shows/${show._id}/seats`}
                          className="group flex flex-col items-center justify-center px-5 py-2.5 rounded-xl bg-cinema-850 hover:bg-crimson-600 border border-cinema-750 hover:border-crimson-500 transition-all duration-200 hover:scale-105"
                        >
                          <span className="text-sm font-bold text-white">{time}</span>
                          <span className="text-[10px] text-cinema-400 group-hover:text-white/90">
                            {show.format} • ₹{show.pricing?.Standard || 200}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-14 text-center bg-cinema-900 border border-cinema-800 rounded-2xl space-y-2">
            <h3 className="text-base font-bold text-white">No Shows Scheduled</h3>
            <p className="text-xs text-cinema-400">
              There are no screenings scheduled at this multiplex on the selected date.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
