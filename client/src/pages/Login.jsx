import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Film, Mail, Lock, Shield, User, ArrowRight } from 'lucide-react';
import { loginUser } from '../redux/slices/authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await dispatch(loginUser({ email, password })).unwrap();
      toast.success(`Welcome back, ${res.user.name}!`);
      if (res.user.role === 'admin' && from === '/') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err || 'Login failed');
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    dispatch(loginUser({ email: demoEmail, password: demoPassword }))
      .unwrap()
      .then((res) => {
        toast.success(`Logged in as ${res.user.name}`);
        if (res.user.role === 'admin') navigate('/admin');
        else navigate(from, { replace: true });
      })
      .catch((err) => toast.error(err));
  };

  return (
    <div
      className="login-page d-flex align-items-center justify-content-center py-5"
      style={{
        minHeight: '80vh',
        background: 'radial-gradient(circle at center, rgba(229, 9, 20, 0.08) 0%, transparent 70%)',
      }}
    >
      <div className="container" style={{ maxWidth: '460px' }}>
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
            <h2 className="font-heading text-white fs-4 mb-1">Welcome Back</h2>
            <p className="text-muted small">Sign in to your cinema account to manage bookings</p>
          </div>

          {/* Quick Demo Access Pills */}
          <div className="mb-4 p-3 rounded-3 bg-dark border border-secondary text-center">
            <span className="text-muted small d-block mb-2 text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>
              ⚡ 1-Click Demo Login
            </span>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                onClick={() => handleQuickLogin('admin@imovies.com', 'Admin@123')}
              >
                <Shield size={14} /> Admin Director
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                onClick={() => handleQuickLogin('john@example.com', 'User@123')}
              >
                <User size={14} /> John Doe
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small mb-3 border-0" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="text-muted small fw-semibold mb-1">Email Address</label>
              <div className="position-relative">
                <Mail size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="email"
                  className="form-control bg-dark text-light border-secondary ps-5 py-2"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-muted small fw-semibold mb-1">Password</label>
              <div className="position-relative">
                <Lock size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="password"
                  className="form-control bg-dark text-light border-secondary ps-5 py-2"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center text-muted small">
              Don't have an account?{' '}
              <Link to="/register" className="text-danger fw-semibold text-decoration-none hover-underline">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

