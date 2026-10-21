import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Film, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { registerUser } from '../redux/slices/authSlice';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await dispatch(
        registerUser({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        })
      ).unwrap();

      toast.success(`Account created! Welcome to IMovies, ${res.user.name}`);
      navigate('/');
    } catch (err) {
      toast.error(err || 'Registration failed');
    }
  };

  return (
    <div
      className="register-page d-flex align-items-center justify-content-center py-5"
      style={{
        minHeight: '85vh',
        background: 'radial-gradient(circle at center, rgba(229, 9, 20, 0.08) 0%, transparent 70%)',
      }}
    >
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="glass-panel p-4 p-sm-5 shadow-lg border border-secondary border-opacity-50">
          <div className="text-center mb-4">
            <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 p-2"
                style={{ background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)' }}
              >
                <Film size={24} className="text-white" />
              </div>
              <span className="font-display fs-2 text-white fw-bold">IMOVIES</span>
            </Link>
            <h2 className="font-heading text-white fs-4 mb-1">Create Account</h2>
            <p className="text-muted small">Join IMovies for seamless movie tickets & real-time seat locks</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small mb-3 border-0" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="text-muted small fw-semibold mb-1">Full Name</label>
              <div className="position-relative">
                <User size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="text"
                  name="name"
                  className="form-control bg-dark text-light border-secondary ps-5 py-2"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-muted small fw-semibold mb-1">Email Address</label>
              <div className="position-relative">
                <Mail size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="email"
                  name="email"
                  className="form-control bg-dark text-light border-secondary ps-5 py-2"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-muted small fw-semibold mb-1">Phone Number (Optional)</label>
              <div className="position-relative">
                <Phone size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="tel"
                  name="phone"
                  className="form-control bg-dark text-light border-secondary ps-5 py-2"
                  placeholder="+1 555-0100"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-muted small fw-semibold mb-1">Password</label>
              <div className="position-relative">
                <Lock size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="password"
                  name="password"
                  className="form-control bg-dark text-light border-secondary ps-5 py-2"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-muted small fw-semibold mb-1">Confirm Password</label>
              <div className="position-relative">
                <Lock size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control bg-dark text-light border-secondary ps-5 py-2"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-cinema w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mb-3"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center text-muted small">
              Already have an account?{' '}
              <Link to="/login" className="text-danger fw-semibold text-decoration-none hover-underline">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

