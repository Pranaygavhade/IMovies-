import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Film,
  MapPin,
  Search,
  Bell,
  User,
  LogOut,
  Ticket,
  Shield,
  Menu,
  X,
  CheckCircle,
  Heart,
} from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { setSelectedCity } from '../../redux/slices/movieSlice';
import { fetchNotifications, markNotificationAsRead } from '../../redux/slices/notificationSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { cities, selectedCity } = useSelector((state) => state.movies);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [isAuthenticated, dispatch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleCityChange = (city) => {
    dispatch(setSelectedCity(city));
  };

  const handleLogout = () => {
    dispatch(logout());
    setUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg glass-nav sticky-top py-3">
      <div className="container-fluid px-lg-5">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 p-2"
            style={{ background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)' }}
          >
            <Film size={22} className="text-white" />
          </div>
          <div>
            <span className="font-display fs-3 text-white fw-bold tracking-wider">I</span>
            <span className="font-display fs-3 text-danger fw-bold tracking-wider">MOVIES</span>
          </div>
        </Link>

        {/* City Selector */}
        <div className="dropdown d-none d-md-block ms-lg-3">
          <button
            className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 text-light border-0 py-2 px-3 rounded-pill"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
            type="button"
            data-bs-toggle="dropdown"
          >
            <MapPin size={16} className="text-danger" />
            <span className="fw-medium text-capitalize">{selectedCity}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-dark glass-panel mt-2 shadow-lg border-0">
            {cities.map((city) => (
              <li key={city}>
                <button
                  className={`dropdown-item py-2 ${city === selectedCity ? 'text-danger fw-bold' : 'text-light'}`}
                  onClick={() => handleCityChange(city)}
                >
                  {city}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="d-none d-lg-flex mx-auto position-relative" style={{ width: '380px' }}>
          <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control rounded-pill ps-5 py-2 text-light border-0"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            placeholder="Search movies, genres, cinemas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Mobile menu toggle */}
        <button
          className="btn btn-link text-light d-lg-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* Right Nav Action items */}
        <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show mt-3' : ''} justify-content-end`}>
          <ul className="navbar-nav align-items-lg-center gap-3">
            <li className="nav-item">
              <Link
                to="/movies"
                className={`nav-link px-3 ${location.pathname === '/movies' ? 'text-danger fw-bold' : 'text-light'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Movies
              </Link>
            </li>

            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link
                    to="/bookings"
                    className={`nav-link px-3 d-flex align-items-center gap-1 ${
                      location.pathname === '/bookings' ? 'text-danger fw-bold' : 'text-light'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Ticket size={16} />
                    <span>My Tickets</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/watchlist"
                    className={`nav-link px-3 d-flex align-items-center gap-1 ${
                      location.pathname === '/watchlist' ? 'text-danger fw-bold' : 'text-light'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart size={16} />
                    <span>Watchlist</span>
                  </Link>
                </li>
              </>
            )}

            {/* Notification Dropdown */}
            {isAuthenticated && (
              <li className="nav-item position-relative">
                <button
                  className="btn btn-link text-light p-2 position-relative text-decoration-none"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    className="position-absolute end-0 mt-2 p-3 glass-panel shadow-lg"
                    style={{ width: '320px', zIndex: 1050 }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom border-secondary">
                      <span className="fw-bold fs-6">Notifications</span>
                      <span className="badge bg-secondary">{unreadCount} new</span>
                    </div>

                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <p className="text-muted small my-3 text-center">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-2 mb-2 rounded-2 cursor-pointer ${
                              notif.isRead ? 'bg-transparent text-secondary' : 'bg-dark text-light border-start border-3 border-danger'
                            }`}
                            onClick={() => dispatch(markNotificationAsRead(notif._id))}
                          >
                            <div className="fw-semibold small">{notif.title}</div>
                            <div className="small text-muted text-truncate">{notif.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </li>
            )}

            {/* User Profile / Auth buttons */}
            {isAuthenticated ? (
              <li className="nav-item dropdown position-relative">
                <button
                  className="btn btn-link text-decoration-none d-flex align-items-center gap-2 p-1 text-light border-0"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={user?.name}
                    className="rounded-circle border border-danger"
                    style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                  />
                  <div className="text-start d-none d-sm-block">
                    <div className="fw-semibold small text-white text-truncate" style={{ maxWidth: '120px' }}>
                      {user?.name}
                    </div>
                    {user?.role === 'admin' && (
                      <span className="badge bg-danger text-uppercase px-1 py-0" style={{ fontSize: '0.6rem' }}>
                        Admin
                      </span>
                    )}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div
                    className="position-absolute end-0 mt-2 p-2 glass-panel shadow-lg"
                    style={{ width: '220px', zIndex: 1050 }}
                  >
                    <div className="px-3 py-2 border-bottom border-secondary mb-2">
                      <div className="fw-bold text-white small">{user?.name}</div>
                      <div className="text-muted small text-truncate">{user?.email}</div>
                    </div>

                    <Link
                      to="/profile"
                      className="dropdown-item py-2 px-3 text-light d-flex align-items-center gap-2 rounded-2"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User size={16} /> Profile
                    </Link>

                    <Link
                      to="/bookings"
                      className="dropdown-item py-2 px-3 text-light d-flex align-items-center gap-2 rounded-2"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Ticket size={16} /> My Bookings
                    </Link>

                    <Link
                      to="/watchlist"
                      className="dropdown-item py-2 px-3 text-light d-flex align-items-center gap-2 rounded-2"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Heart size={16} /> My Watchlist
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="dropdown-item py-2 px-3 text-danger d-flex align-items-center gap-2 rounded-2 fw-semibold"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Shield size={16} /> Admin Portal
                      </Link>
                    )}

                    <div className="dropdown-divider border-secondary my-1"></div>

                    <button
                      className="dropdown-item py-2 px-3 text-danger d-flex align-items-center gap-2 rounded-2"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <li className="nav-item d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-outline-cinema btn-sm px-3" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-cinema btn-sm px-3" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
