import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Film,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  Star,
  Clock,
  Eye,
} from 'lucide-react';
import api from '../api/axios';
import { Spinner } from '../components/common/Loader';
import MoviePoster from '../components/common/MoviePoster';

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: 'Action, Sci-Fi',
    language: 'English',
    duration: 120,
    rating: 8.0,
    releaseDate: new Date().toISOString().split('T')[0],
    poster: '',
    backdrop: '',
    trailerUrl: '',
    cast: '',
    director: '',
    certificate: 'UA',
    status: 'now_showing',
  });

  const loadMovies = () => {
    setLoading(true);
    api
      .get('/movies?limit=100')
      .then((res) => {
        setMovies(res.data.data.movies);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load movies'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const openAddModal = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      description: '',
      genre: 'Action, Sci-Fi',
      language: 'English',
      duration: 120,
      rating: 8.0,
      releaseDate: new Date().toISOString().split('T')[0],
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: '',
      cast: 'Lead Actor, Co-Star',
      director: '',
      certificate: 'UA',
      status: 'now_showing',
    });
    setShowModal(true);
  };

  const openEditModal = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      genre: movie.genre.join(', '),
      language: movie.language,
      duration: movie.duration,
      rating: movie.rating || 8.0,
      releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
      poster: movie.poster,
      backdrop: movie.backdrop || '',
      trailerUrl: movie.trailerUrl || '',
      cast: movie.cast ? movie.cast.join(', ') : '',
      director: movie.director || '',
      certificate: movie.certificate || 'UA',
      status: movie.status || 'now_showing',
    });
    setShowModal(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? Associated shows will also be cancelled.`)) {
      return;
    }
    try {
      await api.delete(`/movies/${id}`);
      toast.success(`"${title}" deleted successfully`);
      loadMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete movie');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        genre: formData.genre.split(',').map((g) => g.trim()),
        cast: formData.cast.split(',').map((c) => c.trim()),
        duration: Number(formData.duration),
        rating: Number(formData.rating),
      };

      if (editingMovie) {
        await api.put(`/movies/${editingMovie._id}`, payload);
        toast.success(`"${formData.title}" updated successfully`);
      } else {
        await api.post('/movies', payload);
        toast.success(`"${formData.title}" created successfully`);
      }

      setShowModal(false);
      loadMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.genre.some((g) => g.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="admin-movies container py-5">
      {/* Top Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <Link to="/admin" className="text-muted small text-decoration-none d-flex align-items-center gap-1 mb-1 hover-white">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-white fs-2 mb-0">Manage Movies</h1>
        </div>

        <button className="btn btn-cinema btn-sm d-flex align-items-center gap-2" onClick={openAddModal}>
          <Plus size={18} /> Add New Movie
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-6 position-relative">
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              className="form-control bg-dark text-light border-secondary ps-5 py-2"
              placeholder="Search movie title or genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-6 text-md-end text-muted small">
            Total Movies: <strong className="text-white">{filteredMovies.length}</strong>
          </div>
        </div>
      </div>

      {/* Movies Table */}
      {loading ? (
        <Spinner text="Loading movies catalog..." />
      ) : (
        <div className="glass-panel p-3 table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
            <thead>
              <tr className="border-secondary text-muted small text-uppercase">
                <th>Movie</th>
                <th>Genre</th>
                <th>Duration & Cert</th>
                <th>Rating</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map((movie) => (
                <tr key={movie._id} className="border-secondary">
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <MoviePoster
                        src={movie.poster}
                        title={movie.title}
                        certificate={movie.certificate}
                        language={movie.language}
                        style={{ width: '45px', height: '60px', minWidth: '45px' }}
                      />
                      <div>
                        <div className="fw-bold text-white small">{movie.title}</div>
                        <div className="text-muted small">{movie.language} • Directed by {movie.director || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted small">{movie.genre.join(', ')}</td>
                  <td className="text-muted small">
                    {movie.duration}m • <span className="badge-cert">{movie.certificate}</span>
                  </td>
                  <td>
                    <span className="badge-rating">
                      <Star size={12} className="fill-warning" /> {movie.rating?.toFixed(1)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        movie.status === 'now_showing' ? 'bg-success' : 'bg-warning text-dark'
                      } text-uppercase px-2 py-1`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {movie.status === 'now_showing' ? 'Now Showing' : 'Upcoming'}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <button
                        className="btn btn-sm btn-outline-secondary text-light p-1"
                        title="Edit Movie"
                        onClick={() => openEditModal(movie)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger p-1"
                        title="Delete Movie"
                        onClick={() => handleDelete(movie._id, movie.title)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Movie Modal */}
      {showModal && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-panel p-4 rounded-4 position-relative overflow-y-auto"
            style={{ maxWidth: '720px', width: '100%', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
              <h4 className="font-heading text-white fs-5 mb-0">
                {editingMovie ? 'Edit Movie Details' : 'Add New Movie Release'}
              </h4>
              <button className="btn btn-sm btn-dark rounded-circle" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-8">
                  <label className="text-muted small fw-semibold mb-1">Movie Title *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">Status *</label>
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="text-muted small fw-semibold mb-1">Synopsis / Description *</label>
                  <textarea
                    rows="3"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Genres (comma separated) *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="e.g. Action, Sci-Fi, Thriller"
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="text-muted small fw-semibold mb-1">Language *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="text-muted small fw-semibold mb-1">Certificate *</label>
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    value={formData.certificate}
                    onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                  >
                    <option value="U">U (Universal)</option>
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="A">A (Adults 18+)</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">Rating (0 - 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">Release Date *</label>
                  <input
                    type="date"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Director</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.director}
                    onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Cast (comma separated)</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.cast}
                    onChange={(e) => setFormData({ ...formData, cast: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Poster URL *</label>
                  <input
                    type="url"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.poster}
                    onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Backdrop URL</label>
                  <input
                    type="url"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.backdrop}
                    onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="col-12">
                  <label className="text-muted small fw-semibold mb-1">YouTube Trailer URL</label>
                  <input
                    type="url"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.trailerUrl}
                    onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-cinema btn-sm px-4 fw-bold">
                  {submitting ? 'Saving...' : editingMovie ? 'Save Changes' : 'Create Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMovies;

