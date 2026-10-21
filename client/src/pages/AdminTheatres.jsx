import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Building, Plus, Trash2, ChevronLeft, MapPin, Film, Shield } from 'lucide-react';
import api from '../api/axios';
import { Spinner } from '../components/common/Loader';

const AdminTheatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    city: 'Mumbai',
    address: '',
    amenities: 'Dolby Atmos, 4K Laser Projection, Recliner Seats, F&B Service',
    screens: [
      {
        name: 'Screen 1 (Laser 4K)',
        rows: 7,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', category: 'Recliner', seats: 10, basePrice: 500 },
          { row: 'B', category: 'Premium', seats: 10, basePrice: 350 },
          { row: 'C', category: 'Premium', seats: 10, basePrice: 350 },
          { row: 'D', category: 'Regular', seats: 10, basePrice: 220 },
          { row: 'E', category: 'Regular', seats: 10, basePrice: 220 },
          { row: 'F', category: 'Regular', seats: 10, basePrice: 220 },
          { row: 'G', category: 'Regular', seats: 10, basePrice: 220 },
        ],
      },
    ],
  });

  const loadTheatres = () => {
    setLoading(true);
    api
      .get('/theatres')
      .then((res) => {
        setTheatres(res.data.data.theatres);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load theatres'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTheatres();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all associated show schedules?`)) return;
    try {
      await api.delete(`/theatres/${id}`);
      toast.success(`Theatre "${name}" deleted`);
      loadTheatres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete theatre');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        amenities: formData.amenities.split(',').map((a) => a.trim()),
      };
      await api.post('/theatres', payload);
      toast.success(`Theatre "${formData.name}" added successfully!`);
      setShowModal(false);
      loadTheatres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create theatre');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-theatres container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <Link to="/admin" className="text-muted small text-decoration-none d-flex align-items-center gap-1 mb-1 hover-white">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-white fs-2 mb-0">Manage Multiplex Theatres</h1>
        </div>

        <button className="btn btn-cinema btn-sm d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Multiplex
        </button>
      </div>

      {loading ? (
        <Spinner text="Loading multiplex cinema listings..." />
      ) : (
        <div className="row g-4">
          {theatres.map((theatre) => (
            <div key={theatre._id} className="col-lg-6">
              <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 rounded bg-dark border border-secondary text-danger">
                        <Building size={20} />
                      </div>
                      <div>
                        <h4 className="text-white fw-bold fs-5 mb-0">{theatre.name}</h4>
                        <span className="badge bg-danger text-uppercase px-2 py-0" style={{ fontSize: '0.65rem' }}>
                          {theatre.city}
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn btn-sm btn-outline-danger p-1"
                      title="Delete Theatre"
                      onClick={() => handleDelete(theatre._id, theatre.name)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-muted small d-flex align-items-center gap-1 mb-3">
                    <MapPin size={14} className="text-danger flex-shrink-0" /> {theatre.address}
                  </p>

                  <div className="mb-3">
                    <span className="text-muted small fw-semibold d-block mb-1">Screens ({theatre.screens?.length || 0}):</span>
                    <div className="d-flex flex-wrap gap-2">
                      {theatre.screens?.map((scr) => (
                        <span key={scr.name} className="badge bg-dark border border-secondary text-light">
                          {scr.name} ({scr.rows * scr.seatsPerRow} seats)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted small fw-semibold d-block mb-1">Amenities:</span>
                    <div className="d-flex flex-wrap gap-1">
                      {theatre.amenities?.map((amenity) => (
                        <span key={amenity} className="badge bg-secondary bg-opacity-25 text-white" style={{ fontSize: '0.7rem' }}>
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Theatre Modal */}
      {showModal && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-panel p-4 rounded-4 position-relative"
            style={{ maxWidth: '580px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
              <h4 className="font-heading text-white fs-5 mb-0">Add Multiplex Theatre</h4>
              <button className="btn btn-sm btn-dark rounded-circle" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-12">
                  <label className="text-muted small fw-semibold mb-1">Cinema Chain & Branch Name *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="e.g. Cinepolis IMAX Grand"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">City *</label>
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small fw-semibold mb-1">Primary Screen Name *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.screens[0].name}
                    onChange={(e) => {
                      const updated = [...formData.screens];
                      updated[0].name = e.target.value;
                      setFormData({ ...formData, screens: updated });
                    }}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="text-muted small fw-semibold mb-1">Full Street Address *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="Mall / Plaza, Street, Sector"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="text-muted small fw-semibold mb-1">Amenities (comma separated)</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-cinema btn-sm px-4 fw-bold">
                  {submitting ? 'Creating...' : 'Create Multiplex'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTheatres;

