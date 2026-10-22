import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
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
  Heart,
  Navigation,
  Compass,
  Check,
  QrCode,
  Smartphone,
  Tag,
  Building,
} from 'lucide-react';
import { logout, updateUserProfile } from '../../redux/slices/authSlice';
import {
  setSelectedCity,
  fetchCities,
  detectNearestCity,
  detectCityByIp,
} from '../../redux/slices/movieSlice';
import { fetchNotifications, markNotificationAsRead } from '../../redux/slices/notificationSlice';
import api from '../../api/axios';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { cities, selectedCity, detectingLocation } = useSelector((state) => state.movies);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearchFilter, setCitySearchFilter] = useState('');

  // Live search suggestions
  const [suggestions, setSuggestions] = useState({ movies: [], cinemas: [], genres: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  const cityDropdownRef = useRef(null);

  useEffect(() => {
    dispatch(fetchCities());
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }

    // Auto-detect on first load if city not in localStorage
    if (!localStorage.getItem('imovies_city')) {
      handleAutoDetectLocation();
    }
  }, [isAuthenticated, dispatch]);

  // Live suggestions query
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/movies/suggestions?q=${encodeURIComponent(searchQuery.trim())}&city=${selectedCity}`);
          setSuggestions(res.data.data || { movies: [], cinemas: [], genres: [] });
          setShowSuggestions(true);
        } catch (e) {
          console.error(e);
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSuggestions({ movies: [], cinemas: [], genres: [] });
      setShowSuggestions(false);
    }
  }, [searchQuery, selectedCity]);

  // Click outside listener for city dropdown & suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setCityDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleCitySelect = (cityName) => {
    dispatch(setSelectedCity(cityName));
    setCityDropdownOpen(false);
    setCitySearchFilter('');

    // If logged in, update user profile city
    if (isAuthenticated) {
      dispatch(updateUserProfile({ city: cityName }));
    }

    toast.info(`Cinema location set to ${cityName}`);
  };

  const handleAutoDetectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await dispatch(
              detectNearestCity({ lat: latitude, lng: longitude })
            ).unwrap();
            const nearestName = res.city?.name || 'Bhilai';
            toast.success(`Location detected: ${nearestName} (${res.distanceKm} km away)`);
          } catch {
            dispatch(detectCityByIp());
          }
        },
        () => {
          // Fallback to IP detection
          dispatch(detectCityByIp());
        },
        { timeout: 7000 }
      );
    } else {
      dispatch(detectCityByIp());
    }
  };

  const handleDetectLocationClick = (e) => {
    e.stopPropagation();
    if (!('geolocation' in navigator)) {
      toast.warn('Geolocation not supported by your browser. Using IP detection.');
      dispatch(detectCityByIp());
      return;
    }

    toast.info('Detecting your current location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await dispatch(
            detectNearestCity({ lat: latitude, lng: longitude })
          ).unwrap();
          const nearestName = res.city?.name || 'Bhilai';
          toast.success(`Location detected: ${nearestName} (${res.distanceKm} km away)`);
          setCityDropdownOpen(false);
        } catch {
          toast.error('Could not find nearest city. Falling back to default.');
          dispatch(detectCityByIp());
        }
      },
      (err) => {
        toast.warn(`Location permission not granted. Defaulting to Bhilai, CG.`);
        dispatch(detectCityByIp());
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleLogout = () => {
    dispatch(logout());
    setUserDropdownOpen(false);
    navigate('/login');
  };

  // Filter cities for search inside dropdown
  const filteredCities = (cities || []).filter((c) => {
    const name = typeof c === 'string' ? c : c.name;
    const state = typeof c === 'object' && c.state ? c.state : '';
    const term = citySearchFilter.toLowerCase();
    return name.toLowerCase().includes(term) || state.toLowerCase().includes(term);
  });

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

        {/* Searchable City Selector with "Detect My Location" */}
        <div className="position-relative d-none d-md-block ms-lg-3" ref={cityDropdownRef}>
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2 text-light border-0 py-2 px-3 rounded-pill"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            type="button"
            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
          >
            <MapPin size={16} className="text-danger" />
            <span className="fw-medium text-capitalize">{selectedCity || 'Bhilai'}</span>
          </button>

          {/* City Selection Dropdown Panel */}
          {cityDropdownOpen && (
            <div
              className="position-absolute start-0 mt-2 p-3 glass-panel shadow-lg border border-secondary"
              style={{ width: '310px', zIndex: 1060 }}
            >
              {/* Detect my location button */}
              <button
                type="button"
                className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 mb-3 py-2 fw-semibold"
                onClick={handleDetectLocationClick}
                disabled={detectingLocation}
              >
                <Navigation size={15} className={detectingLocation ? 'animate-spin' : ''} />
                <span>{detectingLocation ? 'Locating...' : 'Detect My Location'}</span>
              </button>

              {/* City search input */}
              <div className="position-relative mb-2">
                <Search
                  size={14}
                  className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                />
                <input
                  type="text"
                  className="form-control form-control-sm bg-dark text-light border-secondary ps-4 py-1"
                  placeholder="Search city (e.g. Bhilai, Durg)..."
                  value={citySearchFilter}
                  onChange={(e) => setCitySearchFilter(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Cities List */}
              <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {filteredCities.length === 0 ? (
                  <p className="text-muted small text-center my-3">No matching cities found</p>
                ) : (
                  filteredCities.map((city) => {
                    const cityName = typeof city === 'string' ? city : city.name;
                    const cityState = typeof city === 'object' && city.state ? city.state : '';
                    const isSelected = cityName.toLowerCase() === selectedCity.toLowerCase();

                    return (
                      <button
                        key={cityName}
                        type="button"
                        className={`btn btn-sm w-100 text-start d-flex justify-content-between align-items-center px-2 py-2 rounded-2 mb-1 ${
                          isSelected
                            ? 'bg-danger text-white fw-bold'
                            : 'btn-dark text-light border-0'
                        }`}
                        onClick={() => handleCitySelect(cityName)}
                      >
                        <div>
                          <span className="text-capitalize">{cityName}</span>
                          {cityState && (
                            <span className="text-muted small ms-2" style={{ fontSize: '0.72rem' }}>
                              {cityState}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check size={16} />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search Bar with Autocomplete Suggestions */}
        <div ref={searchContainerRef} className="d-none d-lg-flex mx-auto position-relative" style={{ width: '380px' }}>
          <form onSubmit={handleSearchSubmit} className="w-100 position-relative">
            <Search
              size={18}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
            />
            <input
              type="text"
              className="form-control rounded-pill ps-5 py-2 text-light border-0"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              placeholder="Search movies, genres, cinemas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setShowSuggestions(true);
              }}
            />
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions &&
            (suggestions.movies?.length > 0 ||
              suggestions.cinemas?.length > 0 ||
              suggestions.genres?.length > 0) && (
              <div
                className="position-absolute start-0 w-100 mt-2 p-2 rounded-3 shadow-lg border border-secondary"
                style={{
                  top: '100%',
                  backgroundColor: 'rgba(12, 12, 22, 0.98)',
                  backdropFilter: 'blur(16px)',
                  zIndex: 1060,
                  maxHeight: '380px',
                  overflowY: 'auto',
                }}
              >
                {/* Movies Group */}
                {suggestions.movies?.length > 0 && (
                  <div className="mb-2">
                    <span
                      className="text-muted text-uppercase fw-bold px-2 py-1 d-block"
                      style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}
                    >
                      Movies
                    </span>
                    {suggestions.movies.map((m) => (
                      <div
                        key={m._id}
                        className="d-flex align-items-center gap-2 p-2 rounded-2 cursor-pointer hover-bg-dark text-white text-decoration-none"
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchQuery('');
                          navigate(`/movies/${m._id}`);
                        }}
                      >
                        <img
                          src={m.poster || 'https://via.placeholder.com/60'}
                          alt={m.title}
                          className="rounded"
                          style={{ width: '32px', height: '46px', objectFit: 'cover' }}
                        />
                        <div className="text-truncate">
                          <div className="fw-semibold small text-truncate text-white">{m.title}</div>
                          <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                            {m.certification || 'UA'} • {m.genres?.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cinemas Group */}
                {suggestions.cinemas?.length > 0 && (
                  <div className="mb-2 border-top border-secondary border-opacity-25 pt-2">
                    <span
                      className="text-muted text-uppercase fw-bold px-2 py-1 d-block"
                      style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}
                    >
                      Cinemas
                    </span>
                    {suggestions.cinemas.map((c) => (
                      <div
                        key={c._id}
                        className="d-flex align-items-center gap-2 p-2 rounded-2 cursor-pointer hover-bg-dark text-white text-decoration-none"
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchQuery('');
                          navigate(`/movies?theatre=${c._id}`);
                        }}
                      >
                        <Building size={16} className="text-danger flex-shrink-0" />
                        <div className="text-truncate">
                          <div className="fw-semibold small text-truncate text-white">{c.name}</div>
                          <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                            {c.city} • {c.amenities?.slice(0, 2).join(', ') || 'Multiplex'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Genres Group */}
                {suggestions.genres?.length > 0 && (
                  <div className="border-top border-secondary border-opacity-25 pt-2">
                    <span
                      className="text-muted text-uppercase fw-bold px-2 py-1 d-block"
                      style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}
                    >
                      Genres
                    </span>
                    <div className="d-flex flex-wrap gap-1 px-2 py-1">
                      {suggestions.genres.map((g) => (
                        <span
                          key={g}
                          className="badge bg-dark border border-secondary text-light px-2 py-1 cursor-pointer hover-danger"
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearchQuery('');
                            navigate(`/movies?genre=${g}`);
                          }}
                        >
                          <Tag size={10} className="me-1" /> {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="btn btn-link text-light d-lg-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* Right Nav Action items */}
        <div
          className={`collapse navbar-collapse ${mobileMenuOpen ? 'show mt-3' : ''} justify-content-end`}
        >
          {/* Mobile City Selector */}
          <div className="d-md-none mb-3 pb-2 border-bottom border-secondary">
            <div className="text-muted small fw-semibold mb-2">Cinema Location</div>
            <div className="d-flex gap-2">
              <select
                className="form-select bg-dark text-light border-secondary"
                value={selectedCity}
                onChange={(e) => handleCitySelect(e.target.value)}
              >
                {cities.map((c) => {
                  const name = typeof c === 'string' ? c : c.name;
                  return (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                className="btn btn-danger btn-sm px-3"
                onClick={handleDetectLocationClick}
                title="Detect My Location"
              >
                <Navigation size={16} />
              </button>
            </div>
          </div>

          <ul className="navbar-nav align-items-lg-center gap-3">
            <li className="nav-item">
              <Link
                to="/movies"
                className={`nav-link px-3 ${
                  location.pathname === '/movies' ? 'text-danger fw-bold' : 'text-light'
                }`}
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
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: '0.65rem' }}
                    >
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
                              notif.isRead
                                ? 'bg-transparent text-secondary'
                                : 'bg-dark text-light border-start border-3 border-danger'
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
                    src={
                      user?.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={user?.name}
                    className="rounded-circle border border-danger"
                    style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                  />
                  <div className="text-start d-none d-sm-block">
                    <div
                      className="fw-semibold small text-white text-truncate"
                      style={{ maxWidth: '120px' }}
                    >
                      {user?.name}
                    </div>
                    {user?.role === 'admin' && (
                      <span
                        className="badge bg-danger text-uppercase px-1 py-0"
                        style={{ fontSize: '0.6rem' }}
                      >
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
                      <>
                        <Link
                          to="/admin"
                          className="dropdown-item py-2 px-3 text-danger d-flex align-items-center gap-2 rounded-2 fw-semibold"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Shield size={16} /> Admin Portal
                        </Link>
                        <Link
                          to="/admin/scan-ticket"
                          className="dropdown-item py-2 px-3 text-light d-flex align-items-center gap-2 rounded-2"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <QrCode size={16} /> Scan Ticket
                        </Link>
                        <Link
                          to="/admin/pending-payments"
                          className="dropdown-item py-2 px-3 text-warning d-flex align-items-center gap-2 rounded-2 fw-semibold"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Smartphone size={16} /> Pending Payments
                        </Link>
                      </>
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
                <Link
                  to="/login"
                  className="btn btn-outline-cinema btn-sm px-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-cinema btn-sm px-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
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
