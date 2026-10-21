import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Calendar, Plus, Trash2, ChevronLeft, Clock, Film, MapPin } from 'lucide-react';
import api from '../api/axios';
import { Spinner } from '../components/common/Loader';

const AdminShows = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    movie: '',
    theatre: '',
    screen: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '05:00 PM',
    endTime: '07:45 PM',
    language: 'English',
    format: '2D',
    priceMap: {
      Regular: 220,
      Premium: 350,
      Recliner: 500,
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        api.get('/shows?limit=100'),
        api.get('/movies?limit=100'),
        api.get('/theatres'),
      ]);
      setShows(showsRes.data.data.shows);
      setMovies(moviesRes.data.data.movies);
      setTheatres(theatresRes.data.data.theatres);

      if (moviesRes.data.data.movies.length > 0 && theatresRes.data.data.theatres.length > 0) {
        const firstTheatre = theatresRes.data.data.theatres[0];
        setFormData((prev) => ({
          ...prev,
          movie: moviesRes.data.data.movies[0]._id,
          theatre: firstTheatre._id,
          screen: firstTheatre.screens[0]?.name || 'Screen 1',
        }));
      }
    } catch (err) {
      toast.error('Failed to load shows schedule data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTheatreChange = (theatreId) => {
    const selected = theatres.find((t) => t._id === theatreId);
    setFormData({
      ...formData,
      theatre: theatreId,
      screen: selected?.screens[0]?.name || 'Screen 1',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this show schedule and cancel its reserved seats?')) return;
    try {
      await api.delete(`/shows/${id}`);
      toast.success('Show deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete show');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/shows', formData);
      toast.success('Show scheduled and seats generated successfully!');
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule show');
    } finally {
      setSubmitting(false);
    }
  };

  const currentTheatreScreens =
    theatres.find((t) => t._id === formData.theatre)?.screens || [];

  return (
    <div className="admin-shows container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <Link to="/admin" className="text-muted small text-decoration-none d-flex align-items-center gap-1 mb-1 hover-white">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-white fs-2 mb-0">Cinema Showtimes Scheduler</h1>
        </div>

        <button className="btn btn-cinema btn-sm d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Schedule Show
        </button>
      </div>

      {loading ? (
        <Spinner text="Loading current schedules..." />
      ) : (
        <div className="glass-panel p-3 table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
            <thead>
              <tr className="border-secondary text-muted small text-uppercase">
                <th>Movie</th>
                <th>Theatre & Screen</th>
                <th>Date & Time Slot</th>
                <th>Format</th>
                <th>Prices</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {shows.map((show) => (
                <tr key={show._id} className="border-secondary">
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Film size={16} className="text-danger flex-shrink-0" />
                      <span className="text-white fw-bold small">{show.movie?.title}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-white small fw-semibold">{show.theatre?.name}</div>
                    <div className="text-muted small">{show.theatre?.city} • {show.screen}</div>
                  </td>
                  <td>
                    <div className="text-white small">{show.date}</div>
                    <div className="text-danger fw-bold small d-flex align-items-center gap-1">
                      <Clock size={12} /> {show.startTime} – {show.endTime}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-secondary">{show.format}</span>
                  </td>
                  <td className="text-muted small">
                    Reg: ${show.priceMap?.Regular} | Prem: ${show.priceMap?.Premium} | Rec: ${show.priceMap?.Recliner}
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-danger p-1"
                      title="Delete Show"
                      onClick={() => handleDelete(show._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Show Modal */}
      {showModal && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-panel p-4 rounded-4 position-relative"
            style={{ maxWidth: '650px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
              <h4 className="font-heading text-white fs-5 mb-0">Schedule Cinema Show</h4>
              <button className="btn btn-sm btn-dark rounded-circle" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-12">
                  <label className="text-muted small fw-semibold mb-1">Select Movie *</label>
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    value={formData.movie}
                    onChange={(e) => setFormData({ ...formData, movie: e.target.value })}
                    required
                  >
                    {movies.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title} ({m.language})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Select Multiplex Theatre *</label>
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    value={formData.theatre}
                    onChange={(e) => handleTheatreChange(e.target.value)}
                    required
                  >
                    {theatres.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Auditorium / Screen *</label>
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    value={formData.screen}
                    onChange={(e) => setFormData({ ...formData, screen: e.target.value })}
                    required
                  >
                    {currentTheatreScreens.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">Show Date *</label>
                  <input
                    type="date"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">Start Time *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="e.g. 05:00 PM"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">End Time *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="e.g. 07:45 PM"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Screen Format *</label>
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  >
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="4DX">4DX</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Audio Language</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">Regular Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.priceMap.Regular}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceMap: { ...formData.priceMap, Regular: Number(e.target.value) },
                      })
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">Premium Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.priceMap.Premium}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceMap: { ...formData.priceMap, Premium: Number(e.target.value) },
                      })
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="text-muted small fw-semibold mb-1">Recliner Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.priceMap.Recliner}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceMap: { ...formData.priceMap, Recliner: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-cinema btn-sm px-4 fw-bold">
                  {submitting ? 'Generating Seats...' : 'Schedule & Generate Seats'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShows;

