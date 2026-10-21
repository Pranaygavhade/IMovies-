import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Star,
  Clock,
  Calendar,
  Play,
  MapPin,
  Film,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { fetchMovieById } from '../redux/slices/movieSlice';
import { Spinner } from '../components/common/Loader';

const MovieDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentMovie, availableDates, movieShows, loading, selectedCity } = useSelector(
    (state) => state.movies
  );

  const [selectedDate, setSelectedDate] = useState('');
  const [trailerModalUrl, setTrailerModalUrl] = useState(null);

  useEffect(() => {
    dispatch(fetchMovieById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (availableDates && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    } else {
      // Default to today
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [availableDates]);

  // Extract YouTube embed URL
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  if (loading || !currentMovie) {
    return <Spinner text="Loading movie details and cinema showtimes..." />;
  }

  // Filter shows for selected date
  const showsOnDate = (movieShows || []).filter((s) => s.date === selectedDate);

  // Group shows by Theatre
  const theatreMap = {};
  showsOnDate.forEach((show) => {
    const tId = show.theatre._id || show.theatre;
    const tName = show.theatre.name || 'Cinema Multiplex';
    if (!theatreMap[tId]) {
      theatreMap[tId] = {
        theatre: show.theatre,
        shows: [],
      };
    }
    theatreMap[tId].shows.push(show);
  });

  const groupedTheatres = Object.values(theatreMap);

  return (
    <div className="movie-details-page pb-5">
      {/* 1. Backdrop Banner */}
      <div
        className="position-relative w-100"
        style={{
          height: '420px',
          backgroundImage: `url(${currentMovie.backdrop || currentMovie.poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 25%',
        }}
      >
        <div
          className="position-absolute inset-0 w-100 h-100"
          style={{
            background:
              'linear-gradient(to top, #0b0b12 0%, rgba(11, 11, 18, 0.7) 60%, rgba(11, 11, 18, 0.3) 100%)',
          }}
        ></div>
      </div>

      {/* 2. Movie Info Container */}
      <div className="container" style={{ marginTop: '-200px', position: 'relative', zIndex: 10 }}>
        <div className="row g-4 align-items-start">
          {/* Poster Column */}
          <div className="col-md-4 col-lg-3">
            <div className="glass-card p-2 shadow-lg rounded-4 overflow-hidden">
              <div className="poster-container position-relative">
                <img src={currentMovie.poster} alt={currentMovie.title} className="poster-img" />
              </div>
              {currentMovie.trailerUrl && (
                <button
                  className="btn btn-cinema btn-sm w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setTrailerModalUrl(getEmbedUrl(currentMovie.trailerUrl))}
                >
                  <Play size={16} className="fill-white" /> Watch Trailer
                </button>
              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="col-md-8 col-lg-9 text-white">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="badge-cert">{currentMovie.certificate}</span>
              <span className="badge-rating">
                <Star size={14} className="fill-warning" /> {currentMovie.rating?.toFixed(1)} / 10
              </span>
              <span className="text-muted small d-flex align-items-center gap-1 ms-2">
                <Clock size={14} /> {currentMovie.duration} mins
              </span>
              <span className="text-muted small ms-2">• {currentMovie.language}</span>
            </div>

            <h1 className="font-display display-4 fw-bold mb-2 text-uppercase text-white">
              {currentMovie.title}
            </h1>

            <div className="d-flex flex-wrap gap-2 mb-3">
              {currentMovie.genre.map((g) => (
                <span
                  key={g}
                  className="badge rounded-pill px-3 py-1 text-light"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                >
                  {g}
                </span>
              ))}
            </div>

            <p className="text-light opacity-90 fs-6 mb-4 pe-lg-4" style={{ lineHeight: '1.7' }}>
              {currentMovie.description}
            </p>

            <div className="row g-3 pt-3 border-top border-secondary opacity-75 small">
              <div className="col-sm-6">
                <strong className="text-white">Director: </strong>
                <span className="text-muted">{currentMovie.director || 'N/A'}</span>
              </div>
              <div className="col-sm-6">
                <strong className="text-white">Release Date: </strong>
                <span className="text-muted">
                  {new Date(currentMovie.releaseDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {currentMovie.cast && currentMovie.cast.length > 0 && (
                <div className="col-12">
                  <strong className="text-white">Starring: </strong>
                  <span className="text-muted">{currentMovie.cast.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. SHOWTIMES & CINEMA BOOKING SECTION */}
        <div className="mt-5 pt-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-2 border-bottom border-dark pb-3">
            <div>
              <h3 className="font-heading text-white fs-4 mb-1">Select Date & Showtimes</h3>
              <p className="text-muted small mb-0">
                Screenings in <strong className="text-danger">{selectedCity}</strong>
              </p>
            </div>
          </div>

          {/* Date Selector Tabs */}
          <div className="d-flex align-items-center gap-2 overflow-auto pb-3 mb-4 scrollbar-none">
            {availableDates.map((dateStr) => {
              const d = new Date(dateStr + 'T00:00:00');
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = d.toLocaleDateString('en-US', { day: 'numeric' });
              const monthName = d.toLocaleDateString('en-US', { month: 'short' });
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`btn p-2 text-center rounded-3 transition-all ${
                    isSelected ? 'btn-danger shadow' : 'btn-dark text-light border border-secondary'
                  }`}
                  style={{ minWidth: '78px' }}
                >
                  <div className="text-uppercase small" style={{ fontSize: '0.7rem' }}>
                    {dayName}
                  </div>
                  <div className="fs-5 fw-bold my-1">{dayNum}</div>
                  <div className="text-uppercase small" style={{ fontSize: '0.7rem' }}>
                    {monthName}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Theatres & Showtimes List */}
          {groupedTheatres.length === 0 ? (
            <div className="glass-panel text-center py-5">
              <Calendar size={36} className="text-muted mb-2" />
              <h5 className="text-white">No shows scheduled for {selectedDate}</h5>
              <p className="text-muted small">
                Please select another date above or check nearby theatres.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {groupedTheatres.map(({ theatre, shows }) => (
                <div key={theatre._id || theatre.name} className="glass-panel p-4">
                  <div className="row g-3 align-items-center">
                    {/* Theatre Info */}
                    <div className="col-lg-4 col-md-5">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Film size={18} className="text-danger" />
                        <h5 className="text-white fw-bold mb-0">{theatre.name}</h5>
                      </div>
                      <p className="text-muted small mb-2 d-flex align-items-center gap-1">
                        <MapPin size={14} /> {theatre.address}, {theatre.city}
                      </p>
                      {theatre.amenities && (
                        <div className="d-flex flex-wrap gap-1">
                          {theatre.amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="badge bg-dark text-secondary border border-secondary"
                              style={{ fontSize: '0.65rem' }}
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Showtimes Pills */}
                    <div className="col-lg-8 col-md-7">
                      <div className="d-flex flex-wrap gap-3">
                        {shows.map((show) => (
                          <div
                            key={show._id}
                            className="p-2 rounded-3 border border-secondary bg-dark text-center cursor-pointer transition-all hover-scale"
                            style={{ minWidth: '120px' }}
                            onClick={() => navigate(`/shows/${show._id}/seats`)}
                          >
                            <div className="fw-bold text-white fs-6">{show.startTime}</div>
                            <div className="text-danger small fw-semibold">{show.format}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              From ${show.priceMap?.Regular || 220}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

export default MovieDetails;

