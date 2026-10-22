import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
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
  Heart,
  MessageSquare,
  Send,
  User,
} from 'lucide-react';
import { fetchMovieById } from '../redux/slices/movieSlice';
import { Spinner } from '../components/common/Loader';
import api from '../api/axios';

const MovieDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { currentMovie, availableDates, movieShows, loading, selectedCity } = useSelector(
    (state) => state.movies
  );

  const [selectedDate, setSelectedDate] = useState('');
  const [trailerModalUrl, setTrailerModalUrl] = useState(null);

  // Watchlist (Favorite) state
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    dispatch(fetchMovieById(id));
    loadReviews();

    // Check favorite status if authenticated
    if (isAuthenticated) {
      api
        .get(`/favorites/check/${id}`)
        .then((res) => setIsFavorite(res.data.data.isFavorite))
        .catch(() => setIsFavorite(false));
    }
  }, [dispatch, id, isAuthenticated]);

  useEffect(() => {
    if (availableDates && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    } else {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [availableDates]);

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await api.get(`/reviews/movie/${id}`);
      setReviews(res.data.data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to save movies to your watchlist.');
      navigate('/login', { state: { from: `/movies/${id}` } });
      return;
    }

    try {
      setFavoriteLoading(true);
      if (isFavorite) {
        await api.delete(`/favorites/${id}`);
        setIsFavorite(false);
        toast.info(`Removed "${currentMovie.title}" from watchlist.`);
      } else {
        await api.post(`/favorites/${id}`);
        setIsFavorite(true);
        toast.success(`Added "${currentMovie.title}" to your watchlist!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update watchlist.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to write a review.');
      navigate('/login', { state: { from: `/movies/${id}` } });
      return;
    }

    if (!userComment.trim()) {
      toast.warning('Please enter a comment for your review.');
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post(`/reviews/${id}`, {
        rating: userRating,
        comment: userComment.trim(),
      });

      toast.success('Your review has been submitted!');
      setUserComment('');
      // Reload reviews and movie stats
      loadReviews();
      dispatch(fetchMovieById(id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Extract YouTube embed URL
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
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
              <div className="d-flex gap-2 mt-2">
                {currentMovie.trailerUrl && (
                  <button
                    className="btn btn-cinema btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                    onClick={() => setTrailerModalUrl(getEmbedUrl(currentMovie.trailerUrl))}
                  >
                    <Play size={16} className="fill-white" /> Trailer
                  </button>
                )}
                <button
                  className={`btn btn-sm d-flex align-items-center justify-content-center gap-1 ${
                    isFavorite
                      ? 'btn-danger text-white'
                      : 'btn-dark text-light border border-secondary'
                  }`}
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  title={isFavorite ? 'In your Watchlist' : 'Add to Watchlist'}
                >
                  <Heart size={16} className={isFavorite ? 'fill-white' : ''} />
                  <span>{isFavorite ? 'Saved' : 'Watchlist'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="col-md-8 col-lg-9 text-white">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="badge-cert">{currentMovie.certificate}</span>
              <span className="badge-rating">
                <Star size={14} className="fill-warning" />{' '}
                {currentMovie.rating?.toFixed(1) || currentMovie.averageRating?.toFixed(1) || '8.5'} / 10
              </span>
              <span className="text-muted small d-flex align-items-center gap-1 ms-2">
                <Clock size={14} /> {currentMovie.duration || currentMovie.runtime || 120} mins
              </span>
              <span className="text-muted small ms-2">• {currentMovie.language}</span>
            </div>

            <h1 className="font-display display-4 fw-bold mb-2 text-uppercase text-white">
              {currentMovie.title}
            </h1>

            <div className="d-flex flex-wrap gap-2 mb-3">
              {(currentMovie.genre || currentMovie.genres || []).map((g) => (
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
                              From ${show.priceMap?.Regular || show.priceMap?.middle || 220}
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

        {/* 4. REVIEWS & RATINGS SECTION */}
        <div className="mt-5 pt-4">
          <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-dark">
            <div>
              <h3 className="font-heading text-white fs-4 mb-1 d-flex align-items-center gap-2">
                <MessageSquare size={22} className="text-danger" /> Audience Reviews
              </h3>
              <p className="text-muted small mb-0">
                Overall Rating:{' '}
                <strong className="text-warning">
                  ★ {currentMovie.averageRating ? currentMovie.averageRating.toFixed(1) : currentMovie.rating?.toFixed(1) || '8.5'} / 5
                </strong>{' '}
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Submit Review Card */}
            <div className="col-lg-5">
              <div className="glass-panel p-4 h-100">
                <h4 className="text-white fs-5 fw-bold mb-3">Write a Review</h4>
                <form onSubmit={handleReviewSubmit}>
                  {/* Rating Selector */}
                  <div className="mb-3">
                    <label className="text-muted small fw-semibold d-block mb-1">Your Rating</label>
                    <div className="d-flex align-items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="btn btn-link p-0 text-decoration-none"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setUserRating(star)}
                        >
                          <Star
                            size={26}
                            className={`transition-all ${
                              (hoverRating || userRating) >= star
                                ? 'text-warning fill-warning'
                                : 'text-secondary'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-white fw-bold ms-2">
                        {hoverRating || userRating} / 5
                      </span>
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div className="mb-3">
                    <label className="text-muted small fw-semibold mb-1">Your Thoughts</label>
                    <textarea
                      className="form-control bg-dark text-light border-secondary"
                      rows="4"
                      placeholder="What did you love about this cinema experience? (Performances, visuals, sound...)"
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn btn-cinema w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                  >
                    <Send size={16} />
                    <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Reviews List */}
            <div className="col-lg-7">
              {reviewsLoading ? (
                <div className="glass-panel p-4 text-center">
                  <span className="text-muted small">Loading reviews...</span>
                </div>
              ) : reviews.length === 0 ? (
                <div className="glass-panel p-4 text-center">
                  <Star size={36} className="text-muted mb-2" />
                  <h6 className="text-white">No reviews yet</h6>
                  <p className="text-muted small mb-0">
                    Be the first moviegoer to share your thoughts on {currentMovie.title}!
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  {reviews.map((rev) => (
                    <div key={rev._id} className="glass-panel p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={
                              rev.user?.avatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={rev.user?.name || 'Reviewer'}
                            className="rounded-circle border border-secondary"
                            style={{ width: '34px', height: '34px', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="text-white fw-bold small">
                              {rev.user?.name || 'Cinema Fan'}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {new Date(rev.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Rating Stars */}
                        <div className="d-flex align-items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={
                                s <= rev.rating ? 'text-warning fill-warning' : 'text-secondary'
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-light opacity-90 small mb-0 ps-1">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
