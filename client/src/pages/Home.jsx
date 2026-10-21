import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { fetchMovies } from '../redux/slices/movieSlice';
import { MovieCardSkeleton } from '../components/common/Loader';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { nowShowing, upcoming, loading } = useSelector((state) => state.movies);

  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [trailerModalUrl, setTrailerModalUrl] = useState(null);

  const genres = ['All', 'Action', 'Sci-Fi', 'Adventure', 'Drama', 'Thriller', 'Animation'];

  useEffect(() => {
    dispatch(fetchMovies({ limit: 16 }));
  }, [dispatch]);

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

  const filteredMovies =
    selectedGenre === 'All'
      ? nowShowing
      : nowShowing.filter((m) => m.genre && m.genre.includes(selectedGenre));

  // Extract YouTube embed URL
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  return (
    <div className="home-page pb-5">
      {/* 1. HERO SECTION (Full-bleed cinematic backdrop carousel) */}
      {currentHero && (
        <section className="position-relative overflow-hidden" style={{ minHeight: '85vh', maxHeight: '900px' }}>
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
                  'linear-gradient(to right, #0b0b12 0%, rgba(11, 11, 18, 0.85) 45%, rgba(11, 11, 18, 0.4) 100%), linear-gradient(to top, #0b0b12 0%, rgba(11, 11, 18, 0.2) 50%, transparent 100%)',
              }}
            ></div>
          </div>

          {/* Hero Content */}
          <div className="container position-relative py-5 d-flex flex-column justify-content-center" style={{ minHeight: '85vh', zIndex: 2 }}>
            <div className="row align-items-center">
              <motion.div
                key={currentHero._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="col-lg-7 col-xl-6 text-white"
              >
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-danger text-uppercase px-2 py-1 tracking-wider" style={{ fontSize: '0.75rem' }}>
                    Now Showing
                  </span>
                  <span className="badge-cert">{currentHero.certificate}</span>
                  <span className="text-muted small d-flex align-items-center gap-1">
                    <Clock size={14} /> {currentHero.duration} mins
                  </span>
                  <span className="badge-rating">
                    <Star size={14} className="fill-warning" /> {currentHero.rating?.toFixed(1)}
                  </span>
                </div>

                <h1 className="font-display text-white display-3 fw-bold mb-3 tracking-wide text-uppercase">
                  {currentHero.title}
                </h1>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  {currentHero.genre.map((g) => (
                    <span
                      key={g}
                      className="badge rounded-pill px-3 py-1"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', fontSize: '0.8rem' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>

                <p className="text-light opacity-75 fs-6 mb-4 line-clamp-3 pe-lg-4" style={{ lineHeight: '1.6' }}>
                  {currentHero.description}
                </p>

                <div className="d-flex flex-wrap align-items-center gap-3">
                  <Link to={`/movies/${currentHero._id}`} className="btn btn-cinema d-flex align-items-center gap-2 px-4 py-2">
                    <Ticket size={18} />
                    <span className="fw-bold">Book Tickets</span>
                  </Link>

                  {currentHero.trailerUrl && (
                    <button
                      className="btn btn-outline-cinema d-flex align-items-center gap-2 px-4 py-2"
                      onClick={() => setTrailerModalUrl(getEmbedUrl(currentHero.trailerUrl))}
                    >
                      <Play size={18} className="text-danger fill-danger" />
                      <span>Watch Trailer</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Carousel navigation indicators */}
            <div className="position-absolute bottom-0 start-0 p-4 d-flex align-items-center gap-2">
              {heroMovies.map((m, idx) => (
                <button
                  key={m._id}
                  onClick={() => setActiveHeroIdx(idx)}
                  className={`border-0 rounded-pill transition-all ${
                    idx === activeHeroIdx ? 'bg-danger' : 'bg-secondary opacity-50'
                  }`}
                  style={{
                    height: '5px',
                    width: idx === activeHeroIdx ? '32px' : '14px',
                    cursor: 'pointer',
                  }}
                  title={m.title}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. GENRE CHIPS FILTER */}
      <section className="container mt-4 mb-4">
        <div className="d-flex align-items-center gap-2 overflow-auto pb-2 scrollbar-none">
          <span className="text-muted small fw-semibold me-2 text-uppercase tracking-wider">Genres:</span>
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`btn btn-sm rounded-pill px-3 py-1 text-nowrap transition-all ${
                selectedGenre === genre
                  ? 'btn-danger text-white fw-bold shadow-sm'
                  : 'btn-outline-secondary text-light border-0'
              }`}
              style={{
                backgroundColor: selectedGenre === genre ? undefined : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* 3. NOW SHOWING SECTION */}
      <section className="container mt-4">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 text-danger small fw-bold text-uppercase tracking-wider mb-1">
              <Sparkles size={16} /> Current Blockbusters
            </div>
            <h2 className="font-heading text-white fs-3 m-0">Now Showing in Cinemas</h2>
          </div>
          <Link to="/movies?status=now_showing" className="text-danger text-decoration-none small fw-semibold d-flex align-items-center gap-1 hover-underline">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="row g-4">
            {[1, 2, 3, 4].map((n) => (
              <MovieCardSkeleton key={n} />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-5 glass-panel">
            <p className="text-muted mb-0">No movies found matching genre "{selectedGenre}".</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredMovies.slice(0, 8).map((movie) => (
              <div key={movie._id} className="col-xl-3 col-lg-4 col-sm-6">
                <div className="glass-card p-2 h-100 d-flex flex-column">
                  <div className="poster-container mb-3 position-relative">
                    <img src={movie.poster} alt={movie.title} className="poster-img" loading="lazy" />
                    <div className="poster-overlay d-flex flex-column justify-content-between p-3">
                      <div className="d-flex justify-content-between">
                        <span className="badge-cert">{movie.certificate}</span>
                        <span className="badge-rating">
                          <Star size={12} className="fill-warning" /> {movie.rating?.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <div className="text-white small fw-semibold">{movie.language}</div>
                        <div className="text-white-50 small">{movie.duration}m</div>
                      </div>
                    </div>
                  </div>

                  <div className="px-2 pb-2 d-flex flex-column flex-grow-1">
                    <h5 className="text-white fw-bold fs-6 text-truncate mb-1" title={movie.title}>
                      {movie.title}
                    </h5>
                    <p className="text-muted small text-truncate mb-3">{movie.genre.join(', ')}</p>

                    <div className="mt-auto d-flex gap-2">
                      <Link to={`/movies/${movie._id}`} className="btn btn-cinema btn-sm w-100 text-center fw-bold">
                        Book Now
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
            ))}
          </div>
        )}
      </section>

      {/* 4. PREMIUM CINEMA EXPERIENCE FEATURES */}
      <section className="container my-5 py-4">
        <div className="glass-panel p-4 p-lg-5">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <span className="badge bg-danger text-uppercase px-2 py-1 small mb-2">Cinematic Luxury</span>
              <h2 className="font-heading text-white display-6 fw-bold mb-3">
                Experience Cinema Like Never Before
              </h2>
              <p className="text-muted mb-4">
                Step into ultra-premium auditoriums featuring state-of-the-art audiovisual technology and plush comfort crafted for true cinephiles.
              </p>

              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 rounded-3 bg-dark text-danger border border-secondary">
                      <Volume2 size={24} />
                    </div>
                    <div>
                      <h6 className="text-white fw-bold mb-1">Dolby Atmos</h6>
                      <p className="text-muted small mb-0">Immersive multi-dimensional sound surround.</p>
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
                      <p className="text-muted small mb-0">Vivid contrast and colossal aspect ratio.</p>
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
                  <div className="text-gold fw-bold small">PVR & INOX Multiplex Partners</div>
                  <div className="text-white small">Over 4 cities & 12 premium auditoriums</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. UPCOMING RELEASES */}
      <section className="container mt-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <div className="text-danger small fw-bold text-uppercase tracking-wider mb-1">Coming Soon</div>
            <h2 className="font-heading text-white fs-3 m-0">Upcoming Blockbusters</h2>
          </div>
          <Link to="/movies?status=upcoming" className="text-danger text-decoration-none small fw-semibold d-flex align-items-center gap-1 hover-underline">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="row g-4">
          {upcoming.slice(0, 4).map((movie) => (
            <div key={movie._id} className="col-xl-3 col-lg-4 col-sm-6">
              <div className="glass-card p-2 h-100 d-flex flex-column">
                <div className="poster-container mb-3 position-relative">
                  <img src={movie.poster} alt={movie.title} className="poster-img" loading="lazy" />
                  <div className="poster-overlay d-flex flex-column justify-content-between p-3">
                    <span className="badge bg-warning text-dark fw-bold align-self-start">
                      Releasing {new Date(movie.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-white small">{movie.language}</span>
                  </div>
                </div>

                <div className="px-2 pb-2 d-flex flex-column flex-grow-1">
                  <h5 className="text-white fw-bold fs-6 text-truncate mb-1">{movie.title}</h5>
                  <p className="text-muted small text-truncate mb-3">{movie.genre.join(', ')}</p>

                  <div className="mt-auto d-flex gap-2">
                    <Link to={`/movies/${movie._id}`} className="btn btn-outline-cinema btn-sm w-100 text-center">
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

