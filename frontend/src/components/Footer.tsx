import React from 'react';
import { Film, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-cinema-950 border-t border-cinema-850 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-crimson-600 flex items-center justify-center shadow-glow-crimson-sm">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white font-['Cinzel',serif]">
                i<span className="text-crimson-500">Movies</span>
              </span>
            </Link>
            <p className="text-cinema-400 text-sm max-w-sm leading-relaxed">
              Experience the pinnacle of cinema booking. Real-time seat reservations, nearby multiplex discovery, and frictionless test-mode payments powered by Razorpay.
            </p>
            {/* Official TMDB Attribution */}
            <div className="pt-2 flex items-center gap-3">
              <div className="px-2.5 py-1 bg-[#0d253f] border border-[#01b4e4]/40 rounded text-[11px] font-bold text-[#01b4e4] tracking-wider">
                TMDB
              </div>
              <p className="text-[11px] text-cinema-500">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cinema-300">Explore</h4>
            <ul className="space-y-2 text-sm text-cinema-400">
              <li>
                <Link to="/movies" className="hover:text-crimson-400 transition">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link to="/movies?status=upcoming" className="hover:text-crimson-400 transition">
                  Upcoming Movies
                </Link>
              </li>
              <li>
                <Link to="/cinemas" className="hover:text-crimson-400 transition">
                  Nearby Multiplexes
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-crimson-400 transition">
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Features & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cinema-300">Security & Tech</h4>
            <ul className="space-y-2 text-xs text-cinema-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Socket.IO Real-time Seat Locking
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Razorpay Test Mode Integration
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                MongoDB 2dsphere Geospatial Index
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                JWT & Bcrypt Hashed Security
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 mt-10 border-t border-cinema-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cinema-500">
          <p>© {new Date().getFullYear()} iMovies Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-crimson-500 fill-crimson-500" /> for cinema enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
};
