import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Play,
  Star,
  Clock,
  Ticket,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Volume2,
  Tv,
  Armchair,
  Check,
  MapPin,
  TrendingUp,
  Calendar,
  Flame,
  Heart,
  SlidersHorizontal,
  X,
  Compass,
  Film,
} from 'lucide-react';
import { fetchMovies, setSelectedCity } from '../redux/slices/movieSlice';
import { MovieCardSkeleton } from '../components/common/Loader';
import MoviePoster from '../components/common/MoviePoster';
import api from '../api/axios';
import { getTodayKolkata, formatINR } from '../utils/dateUtils';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { nowShowing, upcoming, loading, selectedCity, cities } = useSelector(
    (state) => state.movies
  );

  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [trailerModalUrl, setTrailerModalUrl] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Real data-driven trending movies
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [rankingBasisText, setRankingBasisText] = useState(
    'Ranked by bookings in last 7 days, watchlist adds & TMDB popularity'
  );

  // City modal
  const [showCityModal, setShowCityModal] = useState(false);

  const languages = ['All', 'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi'];

  // Fetch movies when selectedCity or sort changes
  useEffect(() => {
    dispatch(fetchMovies({ city: selectedCity, sort: selectedSort, limit: 30 }));
  }, [dispatch, selectedCity, selectedSort]);

  // Fetch real trending ranking
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setTrendingLoading(true);
        const res = await api.get(`/movies/trending?city=${encodeURIComponent(selectedCity)}&limit=6`);
        setTrendingMovies(res.data.data?.movies || []);
        if (res.data.data?.rankingBasis) {
          setRankingBasisText(res.data.data.rankingBasis);
        }
      } catch (err) {
        console.error('Trending fetch error:', err);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrending();
  }, [selectedCity]);

  // Load user favorites
  useEffect(() => {
    if (isAuthenticated) {
      api
        .get('/favorites')
        .then((res) => {
          const ids = new Set((res.data.data.favorites || []).map((f) => f.movie?._id || f.movie));
          setFavoriteIds(ids);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Auto-rotating hero spotlight (7s, pauses on hover)
  useEffect(() => {
    if (!isHeroHovered && nowShowing.length > 1) {
      const timer = setInterval(() => {
        setActiveHeroIdx((prev) => (prev + 1) % Math.min(nowShowing.length, 5));
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [nowShowing, isHeroHovered]);

  const heroMovies = nowShowing.slice(0, 5);
  const currentHero = heroMovies[activeHeroIdx] || nowShowing[0];

  // Filter Now Showing by selected Language
  const filteredNowShowing =
    selectedLanguage === 'All'
      ? nowShowing
      : nowShowing.filter(
          (m) => m.language && m.language.toLowerCase() === selectedLanguage.toLowerCase()
        );

  // Split upcoming movies into "Releasing This Week" vs "Coming Soon"
  const todayStr = getTodayKolkata();
  const oneWeekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const releasingThisWeek = upcoming.filter((m) => {
    const relStr = new Date(m.releaseDate).toISOString().split('T')[0];
    return relStr >= todayStr && relStr <= oneWeekAhead;
  });

  const comingSoonLater = upcoming.filter((m) => {
    const relStr = new Date(m.releaseDate).toISOString().split('T')[0];
    return relStr > oneWeekAhead;
  });

  // Extract YouTube embed URL
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  const handleToggleFavorite = async (e, movieId, movieTitle) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please sign in to save movies to your watchlist.');
      navigate('/login');
      return;
    }

    try {
      if (favoriteIds.has(movieId)) {
        await api.delete(`/favorites/${movieId}`);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(movieId);
          return next;
        });
        toast.info(`Removed "${movieTitle}" from watchlist.`);
      } else {
        await api.post(`/favorites/${movieId}`);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.add(movieId);
          return next;
        });
        toast.success(`Saved "${movieTitle}" to watchlist!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update watchlist.');
    }
  };

  const isDefaultCityFallback = !localStorage.getItem('imovies_city') && selectedCity === 'Bhilai';

  return (
    <div className="home-page pb-5">
      {/* 1. HERO SECTION (Full-bleed spotlight carousel, pauses on hover) */}
      {currentHero && (
        <section
          className="position-relative overflow-hidden cursor-pointer"
          style={{ minHeight: '85vh', maxHeight: '900px' }}
          onMouseEnter={() => setIsHeroHovered(true)}
          onMouseLeave={() => setIsHeroHovered(false)}
        >
          {/* Backdrop Image */}
          <div
            className="position-absolute inset-0 w-100 h-100"
            style={{
              backgroundImage: `url(${currentHero.backdrop || currentHero.poster})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              transition: 'background-image 0.8s ease-in-out',
            }}
          >
            {/* Dark gradient vignettes */}
            <div
              className="position-absolute inset-0 w-100 h-100"
              style={{
                background:
                  'linear-gradient(to right, #0b0b12 0%, rgba(11, 11, 18, 0.88) 45%, rgba(11, 11, 18, 0.45) 100%), linear-gradient(to top, #0b0b12 0%, rgba(11, 11, 18, 0.2) 50%, transparent 100%)',
              }}
            ></div>
          </div>

          {/* Hero Content */}
          <div
            className="container position-relative py-5 d-flex flex-column justify-content-center"
            style={{ minHeight: '85vh', zIndex: 2 }}
          >
            <div className="row align-items-center">
              <motion.div
                key={currentHero._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="col-lg-7 col-xl-6 text-white"
              >
                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                  <span
                    className="badge bg-danger text-uppercase px-2 py-1 tracking-wider"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Now Showing in {selectedCity}
                  </span>

                  {currentHero.certification && (
                    <span className="badge-cert">{currentHero.certification}</span>
                  )}

                  {currentHero.rating ? (
                    <span className="badge-rating">
                      <Star size={12} className="fill-warning" /> {currentHero.rating.toFixed(1)}
                    </span>
                  ) : currentHero.averageRating ? (
                    <span className="badge-rating">
                      <Star size={12} className="fill-warning" /> {currentHero.averageRating.toFixed(1)}
                    </span>
                  ) : null}

                  {currentHero.language && (
                    <>
                      <span className="text-muted small">•</span>
                      <span className="text-muted small">{currentHero.language}</span>
                    </>
                  )}

                  {(currentHero.runtime || currentHero.duration) && (
                    <>
                      <span className="text-muted small">•</span>
                      <span className="text-muted small">{currentHero.runtime || currentHero.duration} mins</span>
                    </>
                  )}
                </div>

                <h1 className="font-display display-3 fw-bold text-uppercase mb-3 tracking-wider text-white">
                  {currentHero.title}
                </h1>

                {/* Genre chips */}
                {((currentHero.genres && currentHero.genres.length > 0) || (currentHero.genre && currentHero.genre.length > 0)) && (
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {(currentHero.genres || currentHero.genre || []).map((g) => (
                      <span
                        key={g}
                        className="badge rounded-pill bg-dark bg-opacity-75 text-light border border-secondary px-3 py-1"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Synopsis */}
                {currentHero.description && (
                  <p
                    className="text-light opacity-90 fs-6 mb-4 line-clamp-3"
                    style={{ lineHeight: '1.7', maxWidth: '520px' }}
                  >
                    {currentHero.description}
                  </p>
                )}

                {/* Director & Cast */}
                {currentHero.director && (
                  <div className="text-muted small mb-3">
                    Directed by <strong className="text-white">{currentHero.director}</strong>
                  </div>
                )}

                <div className="d-flex flex-wrap gap-3">
                  <Link
                    to={`/movies/${currentHero._id}`}
                    className="btn btn-cinema btn-lg px-4 py-3 fw-bold d-flex align-items-center gap-2 shadow"
                  >
                    <Ticket size={20} />
                    <span>Book Tickets</span>
                  </Link>

                  {currentHero.trailerUrl && (
                    <button
                      className="btn btn-outline-cinema btn-lg px-4 py-3 fw-bold d-flex align-items-center gap-2"
                      onClick={() => setTrailerModalUrl(getEmbedUrl(currentHero.trailerUrl))}
                    >
                      <Play size={20} className="fill-white" />
                      <span>Watch Trailer</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Hero Carousel Navigation Thumbnails */}
          {heroMovies.length > 1 && (
            <div
              className="position-absolute bottom-0 end-0 p-4 d-none d-lg-flex gap-3 z-3"
              style={{ maxWidth: '480px' }}
            >
              {heroMovies.map((m, idx) => (
                <div
                  key={m._id}
                  className={`cursor-pointer rounded-3 overflow-hidden transition-all ${
                    idx === activeHeroIdx
                      ? 'border border-2 border-danger shadow-lg scale-105'
                      : 'opacity-50 hover-opacity-100 border border-secondary'
                  }`}
                  style={{ width: '64px', height: '90px' }}
                  onClick={() => setActiveHeroIdx(idx)}
                >
                  <img src={m.poster} alt={m.title} className="w-100 h-100 object-fit-cover" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. NOW SHOWING IN {CITY} WITH FILTERS & REAL DATA CARDS */}
      <section className="container mt-5 pt-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <MapPin size={22} className="text-danger" />
              <h2 className="font-heading text-white fs-3 m-0">
                {isDefaultCityFallback ? (
                  <span>
                    Default city: <strong className="text-danger">{selectedCity}</strong>
                  </span>
                ) : (
                  <span>
                    Now Showing in <strong className="text-danger">{selectedCity}</strong>
                  </span>
                )}
              </h2>

              {/* Explicit Change City Button */}
              <button
                type="button"
                onClick={() => setShowCityModal(true)}
                className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 ms-2 fw-semibold"
              >
                Change city
              </button>
            </div>

            {/* Dynamic result count */}
            <div className="d-flex align-items-center gap-2 mt-1">
              <span className="text-muted small">
                Showing {filteredNowShowing.length}{' '}
                {selectedLanguage !== 'All' ? `${selectedLanguage} ` : ''}
                movies in {selectedCity}
              </span>

              {selectedLanguage !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('All')}
                  className="btn btn-link text-danger p-0 small text-decoration-none d-flex align-items-center gap-1 ms-2"
                >
                  <X size={14} /> Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="d-flex align-items-center gap-2">
            <SlidersHorizontal size={16} className="text-muted" />
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary rounded-pill px-3 py-1"
              style={{ width: 'auto' }}
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
            >
              <option value="popular">Popular First</option>
              <option value="rating">Highest Rated</option>
              <option value="release_date">Newest Release</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Language Filter Chips */}
        <div className="d-flex gap-2 overflow-auto pb-3 mb-4 scrollbar-none">
          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang;
            return (
              <button
                key={lang}
                type="button"
                className={`btn btn-sm px-3 py-1 rounded-pill transition-all ${
                  isSelected ? 'btn-danger shadow fw-bold' : 'btn-dark text-muted border border-secondary'
                }`}
                onClick={() => setSelectedLanguage(lang)}
              >
                {lang}
              </button>
            );
          })}
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="row g-4">
            {[1, 2, 3, 4].map((n) => (
              <MovieCardSkeleton key={n} />
            ))}
          </div>
        ) : filteredNowShowing.length === 0 ? (
          <div className="text-center py-5 glass-panel p-5">
            <Film size={48} className="text-muted mb-3 mx-auto" />
            <h4 className="text-white mb-2">No movies found matching "{selectedLanguage}" in {selectedCity}</h4>
            <p className="text-muted small mb-4">
              Try switching your language selection or explore other multiplexes in neighboring cities.
            </p>
            <button
              className="btn btn-danger px-4 py-2 fw-bold"
              onClick={() => setSelectedLanguage('All')}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {filteredNowShowing.slice(0, 8).map((movie) => {
              const isFav = favoriteIds.has(movie._id);
              const cinemasCount = movie.cinemasCount || 1;
              const nextShows = movie.nextShows || [];
              const amenities = movie.theatreAmenities || [];

              return (
                <div key={movie._id} className="col-xl-3 col-lg-4 col-sm-6">
                  <div className="glass-card p-3 h-100 d-flex flex-column border border-secondary border-opacity-25 hover-border-danger transition-all">
                    {/* Poster */}
                    <div className="poster-container mb-3 position-relative overflow-hidden rounded-3">
                      <MoviePoster
                        src={movie.poster}
                        title={movie.title}
                        certificate={movie.certificate}
                        language={movie.language}
                        style={{ height: '320px' }}
                      />

                      {/* Favorite Button with Instant Toast */}
                      <button
                        className="btn btn-dark position-absolute top-0 end-0 m-2 rounded-circle p-2 shadow-sm bg-opacity-75 hover-scale z-2"
                        title={isFav ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        onClick={(e) => handleToggleFavorite(e, movie._id, movie.title)}
                      >
                        <Heart
                          size={16}
                          className={isFav ? 'text-danger fill-danger' : 'text-light'}
                        />
                      </button>

                      {/* Top Badges */}
                      <div className="position-absolute top-0 start-0 m-2 d-flex flex-column gap-1">
                        {movie.certification && (
                          <span className="badge bg-black bg-opacity-75 text-white border border-secondary px-2 py-1">
                            {movie.certification}
                          </span>
                        )}
                        <span className="badge bg-danger text-uppercase px-2 py-1" style={{ fontSize: '0.65rem' }}>
                          Now Showing
                        </span>
                      </div>

                      {/* Bottom overlay */}
                      <div className="poster-overlay d-flex justify-content-between align-items-end p-3">
                        <div>
                          {movie.language && (
                            <div className="text-white small fw-bold">{movie.language}</div>
                          )}
                          {(movie.runtime || movie.duration) && (
                            <div className="text-white-50 small">{movie.runtime || movie.duration}m</div>
                          )}
                        </div>

                        {(movie.rating || movie.averageRating) && (
                          <span className="badge bg-warning text-dark fw-bold d-flex align-items-center gap-1">
                            <Star size={12} className="fill-dark" />{' '}
                            {(movie.rating || movie.averageRating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="d-flex flex-column flex-grow-1">
                      <h5 className="text-white fw-bold fs-6 text-truncate mb-1" title={movie.title}>
                        {movie.title}
                      </h5>

                      {/* One-line synopsis */}
                      {movie.description && (
                        <p className="text-muted small line-clamp-2 mb-2" style={{ lineHeight: '1.4' }}>
                          {movie.description}
                        </p>
                      )}

                      {/* Available in N cinemas */}
                      <div className="d-flex align-items-center gap-2 mb-2 text-danger small fw-semibold">
                        <MapPin size={14} /> Available in {cinemasCount} cinema{cinemasCount > 1 ? 's' : ''}
                      </div>

                      {/* Theatre Amenities (Dolby Atmos, IMAX, Recliner) */}
                      {amenities.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 mb-3">
                          {amenities.slice(0, 3).map((a) => (
                            <span
                              key={a}
                              className="badge bg-dark border border-secondary text-light px-2 py-1"
                              style={{ fontSize: '0.68rem' }}
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Next 3 Showtimes Chips (Clickable directly to seats) */}
                      {nextShows.length > 0 && (
                        <div className="mb-3">
                          <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>
                            Next Showtimes:
                          </span>
                          <div className="d-flex flex-wrap gap-1">
                            {nextShows.map((s) => (
                              <Link
                                key={s.showId}
                                to={`/shows/${s.showId}/seats`}
                                className="btn btn-sm btn-dark text-white border border-secondary px-2 py-1 rounded hover-danger text-decoration-none"
                                style={{ fontSize: '0.75rem' }}
                                title={`${s.theatreName} - ${s.format}`}
                              >
                                {s.showTime}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-auto d-flex gap-2">
                        <Link
                          to={`/movies/${movie._id}`}
                          className="btn btn-cinema btn-sm w-100 text-center fw-bold py-2"
                        >
                          Book Tickets
                        </Link>
                        {movie.trailerUrl && (
                          <button
                            className="btn btn-outline-secondary btn-sm px-2 text-light"
                            title="Watch Trailer"
                            onClick={() => setTrailerModalUrl(getEmbedUrl(movie.trailerUrl))}
                          >
                            <Play size={14} className="fill-light" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. TRENDING MOVIES (Ranked by 7-day bookings + watchlist + TMDB popularity) */}
      {trendingMovies.length > 0 && (
        <section className="container mt-5 pt-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4 pb-2 border-bottom border-secondary border-opacity-25">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Flame size={24} className="text-warning animate-pulse" />
                <h2 className="font-heading text-white fs-3 m-0">Trending in India</h2>
              </div>
              {/* Mandatory label stating ranking basis */}
              <p className="text-warning small mb-0 fw-semibold">
                • {rankingBasisText}
              </p>
            </div>
          </div>

          <div className="row g-4">
            {trendingMovies.slice(0, 4).map((movie, idx) => (
              <div key={movie._id} className="col-xl-3 col-sm-6">
                <div className="glass-card p-3 h-100 d-flex gap-3 align-items-center border border-secondary border-opacity-25 hover-border-warning transition-all">
                  <div
                    className="font-display display-5 fw-bold text-danger"
                    style={{ minWidth: '40px' }}
                  >
                    #{idx + 1}
                  </div>
                  <MoviePoster
                    src={movie.poster}
                    title={movie.title}
                    certificate={movie.certificate}
                    language={movie.language}
                    style={{ width: '65px', height: '90px', minWidth: '65px' }}
                  />
                  <div className="overflow-hidden flex-grow-1">
                    <Link
                      to={`/movies/${movie._id}`}
                      className="text-white fw-bold small text-decoration-none text-truncate d-block mb-1 hover-danger"
                    >
                      {movie.title}
                    </Link>
                    <div className="text-muted small mb-1">
                      {movie.language} • {movie.runtime || movie.duration || 135}m
                    </div>
                    <div className="d-flex align-items-center gap-1 text-warning small fw-bold">
                      <Star size={12} className="fill-warning" />{' '}
                      {(movie.rating || movie.averageRating || 8.5).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. RELEASING THIS WEEK (Friday 23 Oct 2026 Releases) */}
      {releasingThisWeek.length > 0 && (
        <section className="container mt-5 pt-3">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <div className="text-warning small fw-bold text-uppercase tracking-wider mb-1 d-flex align-items-center gap-1">
                <Calendar size={14} /> In Cinemas This Friday
              </div>
              <h2 className="font-heading text-white fs-3 m-0">Releasing This Week</h2>
            </div>
            <Link
              to="/movies?status=upcoming"
              className="text-danger text-decoration-none small fw-semibold d-flex align-items-center gap-1 hover-underline"
            >
              All Upcoming <ChevronRight size={16} />
            </Link>
          </div>

          <div className="row g-4">
            {releasingThisWeek.map((movie) => (
              <div key={movie._id} className="col-xl-3 col-lg-4 col-sm-6">
                <div className="glass-card p-2 h-100 d-flex flex-column">
                  <div className="poster-container mb-3 position-relative rounded-3 overflow-hidden">
                    <MoviePoster
                      src={movie.poster}
                      title={movie.title}
                      certificate={movie.certificate}
                      language={movie.language}
                      style={{ height: '300px' }}
                    />
                    <div className="poster-overlay d-flex flex-column justify-content-between p-3">
                      <span className="badge bg-warning text-dark fw-bold align-self-start">
                        23 Oct 2026
                      </span>
                      <span className="text-white small">{movie.language}</span>
                    </div>
                  </div>

                  <div className="px-2 pb-2 d-flex flex-column flex-grow-1">
                    <h5 className="text-white fw-bold fs-6 text-truncate mb-1">{movie.title}</h5>
                    <p className="text-muted small text-truncate mb-3">
                      {(movie.genre || movie.genres || []).join(', ')}
                    </p>

                    <div className="mt-auto d-flex gap-2">
                      <Link
                        to={`/movies/${movie._id}`}
                        className="btn btn-outline-cinema btn-sm w-100 text-center"
                      >
                        Movie Details
                      </Link>
                      {movie.trailerUrl && (
                        <button
                          className="btn btn-cinema btn-sm px-3"
                          onClick={() => setTrailerModalUrl(getEmbedUrl(movie.trailerUrl))}
                        >
                          Trailer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. COMING SOON (Diwali & Beyond) */}
      {comingSoonLater.length > 0 && (
        <section className="container mt-5 pt-3">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <div className="text-danger small fw-bold text-uppercase tracking-wider mb-1">
                Diwali Blockbusters & Beyond
              </div>
              <h2 className="font-heading text-white fs-3 m-0">Coming Soon</h2>
            </div>
          </div>

          <div className="row g-4">
            {comingSoonLater.map((movie) => (
              <div key={movie._id} className="col-xl-3 col-lg-4 col-sm-6">
                <div className="glass-card p-2 h-100 d-flex flex-column">
                  <div className="poster-container mb-3 position-relative rounded-3 overflow-hidden">
                    <MoviePoster
                      src={movie.poster}
                      title={movie.title}
                      certificate={movie.certificate}
                      language={movie.language}
                      style={{ height: '300px' }}
                    />
                    <div className="poster-overlay d-flex flex-column justify-content-between p-3">
                      <span className="badge bg-danger text-white fw-bold align-self-start">
                        Diwali 2026
                      </span>
                      <span className="text-white small">{movie.language}</span>
                    </div>
                  </div>

                  <div className="px-2 pb-2 d-flex flex-column flex-grow-1">
                    <h5 className="text-white fw-bold fs-6 text-truncate mb-1">{movie.title}</h5>
                    <p className="text-muted small text-truncate mb-3">
                      {(movie.genre || movie.genres || []).join(', ')}
                    </p>

                    <div className="mt-auto d-flex gap-2">
                      <Link
                        to={`/movies/${movie._id}`}
                        className="btn btn-outline-cinema btn-sm w-100 text-center"
                      >
                        Details
                      </Link>
                      {movie.trailerUrl && (
                        <button
                          className="btn btn-cinema btn-sm px-3"
                          onClick={() => setTrailerModalUrl(getEmbedUrl(movie.trailerUrl))}
                        >
                          Trailer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. PREMIUM CINEMA FEATURES */}
      <section className="container my-5 py-4">
        <div className="glass-panel p-4 p-lg-5">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <span className="badge bg-danger text-uppercase px-2 py-1 small mb-2">
                Cinematic Luxury
              </span>
              <h2 className="font-heading text-white display-6 fw-bold mb-3">
                Experience Cinema Like Never Before
              </h2>
              <p className="text-muted mb-4">
                Step into ultra-premium auditoriums across Bhilai, Durg, and major Indian cinema hubs
                featuring Dolby Atmos, 4K Laser IMAX, and motorized luxury seating.
              </p>

              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 rounded-3 bg-dark text-danger border border-secondary">
                      <Volume2 size={24} />
                    </div>
                    <div>
                      <h6 className="text-white fw-bold mb-1">Dolby Atmos</h6>
                      <p className="text-muted small mb-0">Immersive multi-dimensional 3D sound.</p>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 rounded-3 bg-dark text-danger border border-secondary">
                      <Tv size={24} />
                    </div>
                    <div>
                      <h6 className="text-white fw-bold mb-1">4K Laser IMAX</h6>
                      <p className="text-muted small mb-0">Colossal contrast and crystal projection.</p>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 rounded-3 bg-dark text-danger border border-secondary">
                      <Armchair size={24} />
                    </div>
                    <div>
                      <h6 className="text-white fw-bold mb-1">Insignia Recliners</h6>
                      <p className="text-muted small mb-0">Ergonomic motorized luxury seating.</p>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 rounded-3 bg-dark text-danger border border-secondary">
                      <Check size={24} />
                    </div>
                    <div>
                      <h6 className="text-white fw-bold mb-1">Live Seat Lock</h6>
                      <p className="text-muted small mb-0">Zero double-booking via real-time WebSockets.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="position-relative rounded-4 overflow-hidden shadow-lg border border-secondary">
                <img
                  src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
                  alt="Cinema Auditorium"
                  className="w-100"
                  style={{ height: '360px', objectFit: 'cover' }}
                />
                <div
                  className="position-absolute bottom-0 start-0 w-100 p-3"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
                >
                  <div className="text-warning fw-bold small">PVR, Mukta A2 & Heritage Cinemas</div>
                  <div className="text-white small">Over 12 cinema cities & verified local venues</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CITY SELECTION MODAL */}
      {showCityModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}
          onClick={() => setShowCityModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-dark text-white border-secondary shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <MapPin className="text-danger" size={20} /> Select Cinema City
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCityModal(false)}
                />
              </div>
              <div className="modal-body p-4">
                <p className="text-muted small mb-3">
                  Choose your city to view showtimes at local multiplexes and cinemas.
                </p>
                <div className="row g-2">
                  {cities.map((c) => {
                    const cName = typeof c === 'string' ? c : c.name;
                    const isCurrent = cName.toLowerCase() === selectedCity.toLowerCase();
                    return (
                      <div key={cName} className="col-6">
                        <button
                          type="button"
                          className={`btn w-100 py-2 text-start d-flex justify-content-between align-items-center rounded-2 ${
                            isCurrent
                              ? 'btn-danger fw-bold'
                              : 'btn-dark text-light border border-secondary'
                          }`}
                          onClick={() => {
                            dispatch(setSelectedCity(cName));
                            setShowCityModal(false);
                            toast.info(`Cinema city updated to ${cName}`);
                          }}
                        >
                          <span>{cName}</span>
                          {isCurrent && <Check size={16} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRAILER MODAL */}
      {trailerModalUrl && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}
          onClick={() => setTrailerModalUrl(null)}
        >
          <div
            className="glass-panel p-2 rounded-4 position-relative"
            style={{ width: '100%', maxWidth: '850px', aspectRatio: '16/9' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn btn-dark position-absolute top-0 end-0 m-2 rounded-circle p-1 z-3"
              onClick={() => setTrailerModalUrl(null)}
            >
              ✕
            </button>
            <iframe
              src={trailerModalUrl}
              title="Movie Trailer"
              className="w-100 h-100 rounded-3 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
