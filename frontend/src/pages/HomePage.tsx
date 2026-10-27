import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Sparkles,
  Film,
  Building2,
  Flame,
  MapPin,
  Compass,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api.js';
import { IMovie, ICinema } from '../types/index.js';
import { HeroBanner } from '../components/HeroBanner.js';
import { MovieCard } from '../components/MovieCard.js';
import { CinemaCard } from '../components/CinemaCard.js';
import { useLocation } from '../context/LocationContext.js';

export const HomePage: React.FC = () => {
  const { selectedCity, setSelectedCity, openLocationModal, userCoords } = useLocation();

  const [featuredMovies, setFeaturedMovies] = useState<IMovie[]>([]);
  const [nowShowing, setNowShowing] = useState<IMovie[]>([]);
  const [trendingTMDB, setTrendingTMDB] = useState<IMovie[]>([]);
  const [upcoming, setUpcoming] = useState<IMovie[]>([]);
  const [cinemas, setCinemas] = useState<ICinema[]>([]);
  const [totalCinemasInDb, setTotalCinemasInDb] = useState<number>(0);

  const [isHeroLoading, setIsHeroLoading] = useState(true);
  const [isNowShowingLoading, setIsNowShowingLoading] = useState(true);
  const [isCinemasLoading, setIsCinemasLoading] = useState(true);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  const [heroError, setHeroError] = useState<string | null>(null);
  const [nowShowingError, setNowShowingError] = useState<string | null>(null);
  const [cinemasError, setCinemasError] = useState<string | null>(null);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // 1. Fetch Featured Movies for Hero Banner
  const loadFeatured = useCallback(async () => {
    setIsHeroLoading(true);
    setHeroError(null);
    try {
      const res = await api.get('/movies/featured');
      if (res.data.success && Array.isArray(res.data.movies)) {
        setFeaturedMovies(res.data.movies);
      }
    } catch (err: any) {
      console.warn('Failed to load featured banner movies:', err);
      setHeroError('Unable to load featured movies right now.');
    } finally {
      setIsHeroLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  // 2. Fetch Now Showing movies that have active, bookable shows (filtered by selected city)
  useEffect(() => {
    const controller = new AbortController();
    async function loadNowShowing() {
      setIsNowShowingLoading(true);
      setNowShowingError(null);
      try {
        const endpoint = selectedCity
          ? `/movies/now-showing?city=${encodeURIComponent(selectedCity)}`
          : '/movies/now-showing';
        const res = await api.get(endpoint, { signal: controller.signal });
        if (res.data.success && Array.isArray(res.data.movies)) {
          setNowShowing(res.data.movies);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.warn('Failed to load now showing movies:', err);
          setNowShowingError('Could not load current showtimes.');
        }
      } finally {
        setIsNowShowingLoading(false);
      }
    }

    loadNowShowing();
    return () => controller.abort();
  }, [selectedCity]);

  // 3. Fetch Cinemas for selected city or coordinates
  useEffect(() => {
    const controller = new AbortController();
    async function loadCinemas() {
      setIsCinemasLoading(true);
      setCinemasError(null);
      try {
        let endpoint = '/cinemas';
        if (selectedCity) {
          endpoint = `/cinemas?city=${encodeURIComponent(selectedCity)}`;
          if (userCoords) {
            endpoint += `&lat=${userCoords.latitude}&lng=${userCoords.longitude}`;
          }
        } else if (userCoords) {
          endpoint = `/cinemas?lat=${userCoords.latitude}&lng=${userCoords.longitude}&radius=50`;
        }

        const res = await api.get(endpoint, { signal: controller.signal });
        if (res.data.success) {
          setCinemas(res.data.cinemas || []);
          if (typeof res.data.totalCinemasInDb === 'number') {
            setTotalCinemasInDb(res.data.totalCinemasInDb);
          }
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.warn('Failed to load cinemas:', err);
          setCinemasError('Could not load nearby multiplexes.');
        }
      } finally {
        setIsCinemasLoading(false);
      }
    }

    loadCinemas();
    return () => controller.abort();
  }, [selectedCity, userCoords]);

  // 4. Fetch TMDB Trending & Upcoming (Movie Discovery independent of local shows)
  const loadTMDBDiscovery = useCallback(async () => {
    setIsTrendingLoading(true);
    setTrendingError(null);
    try {
      const [trendingRes, upcomingRes] = await Promise.allSettled([
        api.get('/movies/tmdb/trending'),
        api.get('/movies/tmdb/upcoming'),
      ]);

      if (trendingRes.status === 'fulfilled' && trendingRes.value.data.success && Array.isArray(trendingRes.value.data.movies)) {
        setTrendingTMDB(trendingRes.value.data.movies.slice(0, 8));
      }

      if (upcomingRes.status === 'fulfilled' && upcomingRes.value.data.success && Array.isArray(upcomingRes.value.data.movies)) {
        setUpcoming(upcomingRes.value.data.movies.slice(0, 4));
      }
    } catch (err: any) {
      console.warn('Failed to load TMDB discovery movies:', err);
      setTrendingError('Could not load trending discovery catalog.');
    } finally {
      setIsTrendingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTMDBDiscovery();
  }, [loadTMDBDiscovery]);

  const heroMovies = featuredMovies.length > 0 ? featuredMovies : trendingTMDB.slice(0, 6);

  return (
    <div className="space-y-16">
      {/* 1. Cinematic Hero Banner */}
      <section aria-label="Featured Releases">
        <HeroBanner
          movies={heroMovies}
          isLoading={isHeroLoading && heroMovies.length === 0}
        />
      </section>

      {/* 2. Now Showing in Theatres (City-Specific Screenings) */}
      <section className="space-y-6" aria-label="Now Showing in Theatres">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-crimson-600/15 text-crimson-500 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Now Showing in Theatres
                {selectedCity && (
                  <span className="text-sm font-semibold text-crimson-400 font-sans">
                    • {selectedCity}
                  </span>
                )}
              </h2>
              <p className="text-xs text-cinema-400">
                {selectedCity
                  ? `Movies with active scheduled showtimes in ${selectedCity}`
                  : 'Displaying movies currently screening across cinema hubs'}
              </p>
            </div>
          </div>
          <Link
            to="/movies"
            className="flex items-center gap-1 text-sm font-semibold text-crimson-500 hover:text-crimson-400 transition group self-start sm:self-auto"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Not Selected City helper hint */}
        {!selectedCity && (
          <div className="flex items-center justify-between p-3.5 bg-cinema-900 border border-cinema-800 rounded-2xl text-xs text-cinema-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-crimson-500" />
              <span>Select your city to check exact showtimes and reserve nearby cinema seats.</span>
            </div>
            <button
              onClick={openLocationModal}
              className="px-3 py-1 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-lg transition cursor-pointer"
            >
              Select City
            </button>
          </div>
        )}

        {isNowShowingLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-full aspect-[2/3] bg-cinema-900 border border-cinema-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : nowShowingError ? (
          <div className="p-8 text-center bg-cinema-900/60 border border-cinema-800 rounded-2xl flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-sm text-cinema-300">{nowShowingError}</p>
            <button
              onClick={() => {
                const endpoint = selectedCity
                  ? `/movies/now-showing?city=${encodeURIComponent(selectedCity)}`
                  : '/movies/now-showing';
                api.get(endpoint).then((res) => setNowShowing(res.data.movies || []));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cinema-800 hover:bg-cinema-750 text-white rounded-xl text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : nowShowing.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {nowShowing.map((movie) => (
              <MovieCard key={movie._id || movie.tmdbId} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-cinema-900 border border-cinema-800 rounded-3xl space-y-3">
            <Film className="w-10 h-10 text-cinema-500 mx-auto" />
            <h3 className="text-base font-bold text-white">
              No Scheduled Screenings in {selectedCity || 'Your Area'}
            </h3>
            <p className="text-xs text-cinema-400 max-w-md mx-auto leading-relaxed">
              There are currently no active shows scheduled in {selectedCity || 'this location'}.
              You can switch your city to see screenings in Nagpur, Mumbai, Bengaluru, or Delhi NCR.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              {['Indore', 'Nagpur', 'Mumbai', 'Bengaluru', 'Delhi NCR'].map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className="px-3.5 py-1.5 bg-cinema-850 hover:bg-crimson-600 border border-cinema-750 text-cinema-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  View {city} Shows
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Nearby Multiplexes in Selected City */}
      <section className="space-y-6" aria-label="Multiplexes">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-crimson-600/15 text-crimson-500 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {selectedCity ? `Cinemas in ${selectedCity}` : 'Featured Multiplexes'}
              </h2>
              <p className="text-xs text-cinema-400">
                Dolby Atmos, IMAX Laser, 4DX, and Gold Class screens
              </p>
            </div>
          </div>
          <Link
            to="/cinemas"
            className="flex items-center gap-1 text-sm font-semibold text-crimson-500 hover:text-crimson-400 transition group self-start sm:self-auto"
          >
            <span>All Cinemas</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isCinemasLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-cinema-900 border border-cinema-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : cinemasError ? (
          <div className="p-8 text-center bg-cinema-900/60 border border-cinema-800 rounded-2xl flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-sm text-cinema-300">{cinemasError}</p>
          </div>
        ) : cinemas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cinemas.map((cinema) => (
              <CinemaCard key={cinema._id} cinema={cinema} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-cinema-900 border border-cinema-800 rounded-3xl space-y-3">
            <Building2 className="w-10 h-10 text-cinema-500 mx-auto" />
            <h3 className="text-base font-bold text-white">
              No Multiplexes Configured in {selectedCity || 'Selected Region'}
            </h3>
            <p className="text-xs text-cinema-400 max-w-md mx-auto leading-relaxed">
              We haven't added any multiplex records in {selectedCity || 'this city'} yet.
              Choose another city below or add one in the Admin Portal.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              {['Indore', 'Nagpur', 'Mumbai', 'Bengaluru', 'Delhi NCR'].map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className="px-3.5 py-1.5 bg-cinema-850 hover:bg-crimson-600 border border-cinema-750 text-cinema-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  {city} Multiplexes
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4. TMDB Movie Discovery (Independent of cinema schedules) */}
      <section className="space-y-6" aria-label="Trending on TMDB">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-crimson-600/15 text-crimson-500 rounded-xl">
              <Compass className="w-5 h-5 text-crimson-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Trending on TMDB
                <span className="px-2 py-0.5 bg-cinema-800 border border-cinema-700 text-[10px] text-[#01b4e4] font-bold rounded">
                  Live Discovery
                </span>
              </h2>
              <p className="text-xs text-cinema-400">
                Explore globally popular films from The Movie Database
              </p>
            </div>
          </div>
          <Link
            to="/movies"
            className="flex items-center gap-1 text-sm font-semibold text-crimson-500 hover:text-crimson-400 transition group"
          >
            <span>Explore Catalogue</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isTrendingLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-full aspect-[2/3] bg-cinema-900 border border-cinema-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : trendingTMDB.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {trendingTMDB.map((movie) => (
              <MovieCard key={movie._id || movie.tmdbId} movie={movie} />
            ))}
          </div>
        ) : trendingError ? (
          <div className="p-6 text-center bg-cinema-900/60 border border-cinema-800 rounded-2xl">
            <p className="text-xs text-cinema-400">{trendingError}</p>
          </div>
        ) : null}
      </section>

      {/* 5. Upcoming Releases Section */}
      <section className="space-y-6" aria-label="Upcoming Releases">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-crimson-600/15 text-crimson-500 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Upcoming Releases</h2>
              <p className="text-xs text-cinema-400">Anticipated blockbusters arriving soon to cinemas</p>
            </div>
          </div>
          <Link
            to="/movies?status=upcoming"
            className="flex items-center gap-1 text-sm font-semibold text-crimson-500 hover:text-crimson-400 transition group"
          >
            <span>View Upcoming</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {upcoming.map((movie) => (
            <MovieCard key={movie._id || movie.tmdbId} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  );
};
