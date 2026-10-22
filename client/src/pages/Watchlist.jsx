import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Film, Star, Clock, Trash2, Ticket, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { Spinner } from '../components/common/Loader';
import MoviePoster from '../components/common/MoviePoster';

const Watchlist = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/favorites');
      setFavorites(res.data.data.favorites || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (movieId, movieTitle) => {
    try {
      await api.delete(`/favorites/${movieId}`);
      setFavorites((prev) => prev.filter((item) => (item.movie._id || item.movie) !== movieId));
      toast.info(`Removed "${movieTitle}" from watchlist`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove from watchlist');
    }
  };

  if (loading) {
    return <Spinner text="Loading your saved movies..." />;
  }

  return (
    <div className="watchlist-page container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Heart size={22} className="text-danger fill-danger" />
            <h1 className="font-heading text-white fs-2 mb-0">My Watchlist</h1>
          </div>
          <p className="text-muted small mb-0">
            Keep track of movies you want to watch and book tickets in one click
          </p>
        </div>

        <span className="badge bg-dark border border-secondary text-light px-3 py-2">
          {favorites.length} {favorites.length === 1 ? 'Movie' : 'Movies'} Saved
        </span>
      </div>

      {/* Grid or Empty State */}
      {favorites.length === 0 ? (
        <div className="glass-panel text-center py-5 my-4">
          <Heart size={48} className="text-muted mb-3" />
          <h4 className="text-white mb-2">Your Watchlist is Empty</h4>
          <p className="text-muted small mb-4">
            Explore now showing and upcoming movies, and click the heart icon to save them here!
          </p>
          <Link to="/movies" className="btn btn-cinema btn-sm px-4">
            Discover Movies
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {favorites.map((item) => {
            const movie = item.movie;
            if (!movie) return null;

            return (
              <div key={item._id || movie._id} className="col-sm-6 col-md-4 col-lg-3">
                <div className="movie-card glass-card h-100 d-flex flex-column rounded-3 overflow-hidden">
                  {/* Poster */}
                  <div className="position-relative">
                    <Link to={`/movies/${movie._id}`}>
                      <MoviePoster
                        src={movie.poster}
                        title={movie.title}
                        certificate={movie.certificate}
                        language={movie.language}
                        style={{ height: '320px' }}
                      />
                    </Link>

                    {/* Remove button overlay */}
                    <button
                      className="btn btn-dark position-absolute top-0 end-0 m-2 rounded-circle p-2 shadow-sm bg-opacity-75 hover-scale"
                      title="Remove from Watchlist"
                      onClick={() => handleRemove(movie._id, movie.title)}
                    >
                      <Trash2 size={16} className="text-danger" />
                    </button>

                    {/* Certificate Badge */}
                    <span className="badge-cert position-absolute bottom-0 start-0 m-2">
                      {movie.certificate}
                    </span>

                    {/* Rating Badge */}
                    <span className="badge-rating position-absolute bottom-0 end-0 m-2">
                      <Star size={12} className="fill-warning" /> {movie.rating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-3 d-flex flex-column flex-grow-1">
                    <Link
                      to={`/movies/${movie._id}`}
                      className="text-white fw-bold text-decoration-none fs-6 mb-1 text-truncate d-block"
                      title={movie.title}
                    >
                      {movie.title}
                    </Link>

                    <div className="text-muted small mb-2 d-flex align-items-center gap-2">
                      <span>{movie.language}</span>
                      <span>•</span>
                      <span className="d-flex align-items-center gap-1">
                        <Clock size={12} /> {movie.duration || movie.runtime || 120}m
                      </span>
                    </div>

                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {(movie.genre || movie.genres || []).slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="badge bg-dark text-muted border border-secondary"
                          style={{ fontSize: '0.65rem' }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-2">
                      <Link
                        to={`/movies/${movie._id}`}
                        className="btn btn-cinema btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                      >
                        <Ticket size={16} />
                        <span>Book Tickets</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
