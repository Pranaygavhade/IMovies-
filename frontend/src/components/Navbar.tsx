import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Film,
  MapPin,
  Search,
  User,
  Ticket,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useLocation } from '../context/LocationContext.js';

export const Navbar: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const { selectedCity, locationSource, openLocationModal } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-cinema-950/90 backdrop-blur-md border-b border-cinema-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-crimson-600 flex items-center justify-center shadow-glow-crimson-sm group-hover:scale-105 transition">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white font-['Cinzel',serif]">
                i<span className="text-crimson-500">Movies</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-cinema-400 font-semibold -mt-1">
                Cinema Redefined
              </span>
            </div>
          </Link>

          {/* Location Selector Pill */}
          <button
            onClick={openLocationModal}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cinema-900 border border-cinema-750 hover:border-crimson-500/60 hover:bg-cinema-850 text-cinema-200 hover:text-white transition group text-sm shadow-sm"
          >
            <MapPin className={`w-4 h-4 ${selectedCity ? 'text-crimson-500' : 'text-cinema-400'} group-hover:scale-110 transition`} />
            <span className="font-semibold text-xs sm:text-sm">
              {selectedCity || 'Choose your city'}
            </span>
            {selectedCity && locationSource === 'detected' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Detected via GPS" />
            )}
            <ChevronDown className="w-3.5 h-3.5 text-cinema-400" />
          </button>
        </div>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md relative items-center"
        >
          <Search className="absolute left-3.5 w-4 h-4 text-cinema-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for movies, cinemas, or genres..."
            className="w-full pl-10 pr-4 py-2 bg-cinema-900 border border-cinema-750 focus:border-crimson-500 rounded-full text-sm text-white placeholder-cinema-500 outline-none transition"
          />
        </form>

        {/* Desktop Navigation Links & User Menu */}
        <div className="hidden lg:flex items-center gap-6">
          <Link
            to="/movies"
            className="text-sm font-semibold text-cinema-200 hover:text-white transition"
          >
            Movies
          </Link>
          <Link
            to="/cinemas"
            className="text-sm font-semibold text-cinema-200 hover:text-white transition"
          >
            Cinemas
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-full text-xs font-semibold transition"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cinema-850 border border-cinema-750 hover:border-cinema-600 text-white transition"
              >
                <div className="w-7 h-7 rounded-full bg-crimson-600/30 text-crimson-400 flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-cinema-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-cinema-900 border border-cinema-750 rounded-2xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-cinema-800">
                    <p className="text-xs text-cinema-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/my-bookings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-cinema-200 hover:text-white hover:bg-cinema-800 transition"
                  >
                    <Ticket className="w-4 h-4 text-crimson-500" />
                    My Bookings
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-cinema-800 transition"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-crimson-400 hover:text-crimson-300 hover:bg-cinema-800 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-2 px-5 py-2 bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-semibold rounded-full transition shadow-glow-crimson-sm"
            >
              <User className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={openLocationModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-cinema-900 border border-cinema-750 rounded-full text-xs text-cinema-200"
          >
            <MapPin className="w-3.5 h-3.5 text-crimson-500" />
            <span className="truncate max-w-[80px]">{selectedCity || 'City'}</span>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-cinema-300 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-cinema-900 border-b border-cinema-800 px-4 py-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, cinemas..."
              className="w-full pl-10 pr-4 py-2 bg-cinema-850 border border-cinema-750 rounded-xl text-sm text-white placeholder-cinema-500 outline-none"
            />
          </form>

          <div className="flex flex-col space-y-3 pt-2">
            <Link
              to="/movies"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold text-cinema-200 hover:text-white py-1"
            >
              Movies
            </Link>
            <Link
              to="/cinemas"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold text-cinema-200 hover:text-white py-1"
            >
              Cinemas
            </Link>
            {user && (
              <Link
                to="/my-bookings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-semibold text-cinema-200 hover:text-white py-1 flex items-center gap-2"
              >
                <Ticket className="w-4 h-4 text-crimson-500" />
                My Bookings
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-semibold text-amber-400 py-1 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Link>
            )}
          </div>

          <div className="pt-4 border-t border-cinema-800">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-cinema-400">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-crimson-400 bg-crimson-950/50 border border-crimson-900 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full py-2.5 bg-crimson-600 text-white font-semibold rounded-xl text-sm shadow-glow-crimson-sm"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
