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
} from 'lucide-react';
import { fetchMovies } from '../redux/slices/movieSlice';
import { MovieCardSkeleton } from '../components/common/Loader';
import api from '../api/axios';
import { getTodayKolkata } from '../utils/dateUtils';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { nowShowing, upcoming, trending, loading, selectedCity } = useSelector(
    (state) => state.movies
  );

  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [trailerModalUrl, setTrailerModalUrl] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const languages = ['All', 'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada'];

  useEffect(() => {
    dispatch(fetchMovies({ city: selectedCity, limit: 30 }));
  }, [dispatch, selectedCity]);

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

  // Autoplay hero carousel every 7 seconds
  useEffect(() => {
    if (nowShowing.length > 1) {
      const timer = setInterval(() => {
        setActiveHeroIdx((prev) => (prev + 1) % Math.min(nowShowing.length, 5));
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [nowShowing]);

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
  const todayStr = getTodayKolkata(); // 2026-10-22
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

  return (
    <div className="home-page pb-5">
      {/* 1. HERO SECTION (Full-bleed cinematic backdrop carousel) */}
      {currentHero && (
        <section
          className="position-relative overflow-hidden"
          style={{ minHeight: '85vh', maxHeight: '900px' }}
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
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span
                    className="badge bg-danger text-uppercase px-2 py-1 tracking-wider"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Now Showing in {selectedCity}
                  </span>
                  <span className="badge-cert">{currentHero.certificate}</span>
                  <span className="badge-rating">
                    <Star size={12} className="fill-warning" />{' '}
                    {currentHero.rating?.toFixed(1) || '8.5'}
                  </span>
                  <span className="text-muted small">•</span>
                  <span className="text-muted small">{currentHero.language}</span>
                  <span className="text-muted small">•</span>
                  <span className="text-muted small">{currentHero.duration || 135} mins</span>
                </div>

                <h1 className="font-display display-3 fw-bold text-uppercase mb-3 tracking-wider text-white">
                  {currentHero.title}
                </h1>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  {(currentHero.genre || currentHero.genres || []).map((g) => (
                    <span
                      key={g}
                      className="badge rounded-pill bg-dark bg-opacity-75 text-light border border-secondary px-3 py-1"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                <p
                  className="text-light opacity-90 fs-6 mb-4 line-clamp-3"
                  style={{ lineHeight: '1.7', maxWidth: '520px' }}
                >
                  {currentHero.description}
                </p>

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

      {/* 2. NOW SHOWING IN {CITY} WITH LANGUAGE FILTER CHIPS */}
      <section className="container mt-5 pt-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <MapPin size={20} className="text-danger" />
              <h2 className="font-heading text-white fs-3 m-0">
                Now Showing in <span className="text-danger">{selectedCity}</span>
              </h2>
            </div>
            <p className="text-muted small mb-0">Explore showtimes across cinemas in {selectedCity}</p>
          </div>

          <Link
            to="/movies?status=now_showing"
            className="text-danger text-decoration-none small fw-semibold d-flex align-items-center gap-1 hover-underline"
          >
            View All Movies <ChevronRight size={16} />
          </Link>
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
                  isSelected ? 'btn-danger shadow' : 'btn-dark text-muted border border-secondary'
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
          <div className="text-center py-5 glass-panel">
            <p className="text-white mb-1">No movies currently showing in {selectedLanguage} for {selectedCity}.</p>
            <p className="text-muted small mb-3">Try switching language or explore other cinema cities.</p>
            <button className="btn btn-outline-danger btn-sm" onClick={() => setSelectedLanguage('All')}>
              Show All Languages
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {filteredNowShowing.slice(0, 8).map((movie) => {
              const isFav = favoriteIds.has(movie._id);

              return (
                <div key={movie._id} className="col-xl-3 col-lg-4 col-sm-6">
                  <div className="glass-card p-2 h-100 d-flex flex-column">
                    <div className="poster-container mb-3 position-relative">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="poster-img"
                        loading="lazy"
                      />

                      {/* Favorite Button */}
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

                      <div className="poster-overlay d-flex flex-column justify-content-between p-3">
                        <div className="d-flex justify-content-between">
                          <span className="badge-cert">{movie.certificate}</span>
                          <span className="badge-rating">
                            <Star size={12} className="fill-warning" />{' '}
                            {movie.rating?.toFixed(1) || '8.5'}
                          </span>
                        </div>
                        <div>
                          <div className="text-white small fw-semibold">{movie.language}</div>
                          <div className="text-white-50 small">{movie.duration || 130}m</div>
                        </div>
                      </div>
                    </div>

                    <div className="px-2 pb-2 d-flex flex-column flex-grow-1">
                      <h5 className="text-white fw-bold fs-6 text-truncate mb-1" title={movie.title}>
                        {movie.title}
                      </h5>
                      <p className="text-muted small text-truncate mb-3">
                        {(movie.genre || movie.genres || []).join(', ')}
                      </p>

                      <div className="mt-auto d-flex gap-2">
                        <Link
                          to={`/movies/${movie._id}`}
                          className="btn btn-cinema btn-sm w-100 text-center fw-bold"
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

      {/* 3. TRENDING MOVIES (Ranked by TMDB popularity) */}
      {trending.length > 0 && (
        <section className="container mt-5 pt-3">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-2">
              <Flame size={22} className="text-warning" />
              <h2 className="font-heading text-white fs-3 m-0">Trending Across India</h2>
            </div>
            <span className="text-muted small">Ranked by Audience Popularity</span>
          </div>

          <div className="row g-4">
            {trending.slice(0, 4).map((movie, idx) => (
              <div key={movie._id} className="col-xl-3 col-sm-6">
                <div className="glass-card p-3 h-100 d-flex gap-3 align-items-center">
                  <div className="font-display display-5 fw-bold text-danger" style={{ minWidth: '36px' }}>
                    #{idx + 1}
                  </div>
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="rounded-2 shadow"
                    style={{ width: '60px', height: '85px', objectFit: 'cover' }}
                  />
                  <div className="overflow-hidden flex-grow-1">
                    <Link
                      to={`/movies/${movie._id}`}
                      className="text-white fw-bold small text-decoration-none text-truncate d-block mb-1 hover-danger"
                    >
                      {movie.title}
                    </Link>
                    <div className="text-muted small mb-1">{movie.language} • {movie.duration || 135}m</div>
                    <div className="d-flex align-items-center gap-1 text-warning small">
                      <Star size={12} className="fill-warning" /> {movie.rating?.toFixed(1) || '8.5'}
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
                  <div className="poster-container mb-3 position-relative">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="poster-img"
                      loading="lazy"
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
                  <div className="poster-container mb-3 position-relative">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="poster-img"
                      loading="lazy"
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
                Step into ultra-premium auditoriums across Bhilai, Durg, and major Indian cities
                featuring state-of-the-art audiovisual technology and plush comfort crafted for true cinephiles.
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
                  <div className="text-gold fw-bold small">PVR, Mukta A2 & Inox Multiplex Partners</div>
                  <div className="text-white small">Over 12 cities & real local cinema venues</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
