import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Search, Filter, Star, Clock, ChevronLeft, ChevronRight, X, Heart } from 'lucide-react';
import { fetchMovies } from '../redux/slices/movieSlice';
import { MovieCardSkeleton } from '../components/common/Loader';
import MoviePoster from '../components/common/MoviePoster';
import api from '../api/axios';

const Movies = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { movies, pagination, loading, selectedCity } = useSelector((state) => state.movies);

  // Search & Filter state derived from query params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || 'All');
  const [language, setLanguage] = useState(searchParams.get('language') || 'All');
  const [status, setStatus] = useState(searchParams.get('status') || 'now_showing');
  const [sort, setSort] = useState(searchParams.get('sort') || 'rating_desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Watchlist set
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const genres = [
    'All',
    'Action',
    'Sci-Fi',
    'Adventure',
    'Drama',
    'Thriller',
    'Animation',
    'Crime',
    'Biography',
  ];
  const languages = ['All', 'English', 'Korean'];

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

  useEffect(() => {
    const params = {
      page,
      limit: 12,
      status: status === 'all' ? undefined : status,
      genre: genre === 'All' ? undefined : genre,
      language: language === 'All' ? undefined : language,
      sort,
      search: search.trim() || undefined,
      city: selectedCity,
    };

    dispatch(fetchMovies(params));

    // Sync state with URL params
    const newParams = {};
    if (search.trim()) newParams.search = search.trim();
    if (genre !== 'All') newParams.genre = genre;
    if (language !== 'All') newParams.language = language;
    if (status !== 'now_showing') newParams.status = status;
    if (sort !== 'rating_desc') newParams.sort = sort;
    if (page > 1) newParams.page = page;

    setSearchParams(newParams);
  }, [dispatch, search, genre, language, status, sort, page, selectedCity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch('');
    setGenre('All');
    setLanguage('All');
    setStatus('now_showing');
    setSort('rating_desc');
    setPage(1);
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
    <div className="movies-page container py-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="font-heading text-white fs-2 mb-1">Explore Movies</h1>
          <p className="text-muted small mb-0">
            Showing movies in <span className="text-danger fw-semibold">{selectedCity}</span> (
            {pagination.total} movies found)
          </p>
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="position-relative"
          style={{ maxWidth: '320px', width: '100%' }}
        >
          <Search
            size={16}
            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
          />
          <input
            type="text"
            className="form-control rounded-pill ps-5 py-2 text-light border-0"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            placeholder="Search titles, cast, directors..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </form>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-3 mb-4">
        <div className="row g-3 align-items-center">
          {/* Status Tab (Now Showing / Upcoming) */}
          <div className="col-lg-3 col-sm-6">
            <label className="text-muted small fw-semibold d-block mb-1">Status</label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm ${
                  status === 'now_showing' ? 'btn-danger' : 'btn-dark text-muted'
                }`}
                onClick={() => {
                  setStatus('now_showing');
                  setPage(1);
                }}
              >
                Now Showing
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  status === 'upcoming' ? 'btn-danger' : 'btn-dark text-muted'
                }`}
                onClick={() => {
                  setStatus('upcoming');
                  setPage(1);
                }}
              >
                Upcoming
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  status === 'all' ? 'btn-danger' : 'btn-dark text-muted'
                }`}
                onClick={() => {
                  setStatus('all');
                  setPage(1);
                }}
              >
                All
              </button>
            </div>
          </div>

          {/* Genre Dropdown */}
          <div className="col-lg-3 col-sm-6">
            <label className="text-muted small fw-semibold d-block mb-1">Genre</label>
            <select
              className="form-select form-select-sm bg-dark text-light border-secondary"
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                setPage(1);
              }}
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Language Dropdown */}
          <div className="col-lg-3 col-sm-6">
            <label className="text-muted small fw-semibold d-block mb-1">Language</label>
            <select
              className="form-select form-select-sm bg-dark text-light border-secondary"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setPage(1);
              }}
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="col-lg-2 col-sm-4">
            <label className="text-muted small fw-semibold d-block mb-1">Sort By</label>
            <select
              className="form-select form-select-sm bg-dark text-light border-secondary"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="rating_desc">Highest Rated</option>
              <option value="release_desc">Newest Releases</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="col-lg-1 col-sm-2 text-end pt-sm-4">
            <button
              className="btn btn-outline-secondary btn-sm p-2 w-100"
              title="Reset Filters"
              onClick={clearAllFilters}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="row g-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <MovieCardSkeleton key={n} />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="glass-panel text-center py-5 my-4">
          <p className="fs-5 text-white mb-2">No movies match your selected criteria.</p>
          <p className="text-muted small mb-3">Try adjusting your genre, search term, or city.</p>
          <button className="btn btn-cinema btn-sm" onClick={clearAllFilters}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {movies.map((movie) => {
            const isFav = favoriteIds.has(movie._id);

            return (
              <div key={movie._id} className="col-xl-3 col-lg-4 col-sm-6">
                <div className="glass-card p-2 h-100 d-flex flex-column">
                  <div className="poster-container mb-3 position-relative">
                    <MoviePoster
                      src={movie.poster}
                      title={movie.title}
                      certificate={movie.certificate}
                      language={movie.language}
                    />

                    {/* Favorite Heart Button */}
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
                          <Star size={12} className="fill-warning" /> {movie.rating?.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <div className="text-white small fw-semibold">{movie.language}</div>
                        <div className="text-white-50 small">
                          {movie.duration || movie.runtime || 120}m
                        </div>
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

                    <div className="mt-auto">
                      <Link
                        to={`/movies/${movie._id}`}
                        className={`btn btn-sm w-100 text-center fw-bold ${
                          movie.status === 'upcoming' ? 'btn-outline-cinema' : 'btn-cinema'
                        }`}
                      >
                        {movie.status === 'upcoming' ? 'View Details' : 'Book Tickets'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
          <button
            className="btn btn-dark btn-sm text-light border border-secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-muted small px-2">
            Page <strong className="text-white">{page}</strong> of{' '}
            <strong className="text-white">{pagination.pages}</strong>
          </span>
          <button
            className="btn btn-dark btn-sm text-light border border-secondary"
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Movies;
