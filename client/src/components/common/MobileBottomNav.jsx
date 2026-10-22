import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Film, Ticket, Heart, User } from 'lucide-react';
import { useSelector } from 'react-redux';

const MobileBottomNav = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Movies', path: '/movies', icon: Film },
    { label: 'Tickets', path: '/my-bookings', icon: Ticket },
    { label: 'Watchlist', path: '/watchlist', icon: Heart },
    { label: 'Profile', path: isAuthenticated ? '/profile' : '/login', icon: User },
  ];

  return (
    <nav
      className="d-md-none fixed-bottom w-100 border-top border-secondary border-opacity-25 py-2 px-3"
      style={{
        backgroundColor: 'rgba(12, 12, 22, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 1040,
      }}
    >
      <div className="d-flex justify-content-around align-items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `d-flex flex-column align-items-center text-decoration-none py-1 px-2 rounded-2 transition-all ${
                  isActive ? 'text-danger fw-bold' : 'text-muted'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? '#e50914' : '#8e8ea0',
                fontSize: '0.72rem',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    className={`mb-1 ${isActive ? 'text-danger' : 'text-muted'}`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
