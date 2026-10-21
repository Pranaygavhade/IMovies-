import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Shield, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-top border-dark mt-5 pt-5 pb-4" style={{ backgroundColor: '#07070c' }}>
      <div className="container px-4">
        <div className="row g-4 mb-4">
          {/* Brand info */}
          <div className="col-lg-4 col-md-6">
            <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 p-2"
                style={{ background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)' }}
              >
                <Film size={20} className="text-white" />
              </div>
              <span className="font-display fs-3 text-white fw-bold">IMOVIES</span>
            </Link>
            <p className="text-muted small pe-lg-4 mb-3">
              IMovies makes movie ticket booking effortless, instant, and immersive. Discover the latest blockbuster releases, explore premium multiplexes, pick your favorite seats in real-time, and enjoy the show!
            </p>
            <div className="d-flex align-items-center gap-3 text-muted small">
              <span className="d-flex align-items-center gap-1">
                <Shield size={14} className="text-danger" /> 100% Secure Payments
              </span>
              <span>•</span>
              <span>Instant E-Tickets</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-white fw-bold text-uppercase mb-3 small tracking-wider">Explore</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li><Link to="/movies?status=now_showing" className="text-muted text-decoration-none hover-white">Now Showing</Link></li>
              <li><Link to="/movies?status=upcoming" className="text-muted text-decoration-none hover-white">Upcoming Releases</Link></li>
              <li><Link to="/movies?genre=Sci-Fi" className="text-muted text-decoration-none hover-white">IMAX Experiences</Link></li>
              <li><Link to="/bookings" className="text-muted text-decoration-none hover-white">Ticket Status</Link></li>
            </ul>
          </div>

          {/* Cinemas & Cities */}
          <div className="col-lg-3 col-md-6 col-6">
            <h6 className="text-white fw-bold text-uppercase mb-3 small tracking-wider">Cinema Hubs</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small text-muted">
              <li>PVR ICON Gold – Mumbai</li>
              <li>INOX Insignia – Bengaluru</li>
              <li>Cinepolis Grand – Delhi NCR</li>
              <li>SPI Cinemas Palazzo – Chennai</li>
            </ul>
          </div>

          {/* Help & Contact */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold text-uppercase mb-3 small tracking-wider">Customer Support</h6>
            <div className="d-flex flex-column gap-2 text-muted small">
              <div className="d-flex align-items-center gap-2">
                <Mail size={14} className="text-danger" /> support@imovies.com
              </div>
              <div className="d-flex align-items-center gap-2">
                <Phone size={14} className="text-danger" /> 1800-400-MOVIES (Toll Free)
              </div>
              <div className="d-flex align-items-center gap-2">
                <MapPin size={14} className="text-danger" /> Multiplex Towers, Tech District
              </div>
            </div>
          </div>
        </div>

        <hr className="border-secondary opacity-25 my-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 text-muted small">
          <div>
            &copy; {new Date().getFullYear()} IMovies Entertainment Inc. All rights reserved.
          </div>
          <div className="d-flex align-items-center gap-1">
            Engineered with <Heart size={14} className="text-danger fill-danger" /> for movie lovers everywhere.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
