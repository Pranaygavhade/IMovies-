import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import Payment from './pages/Payment';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/AdminDashboard';
import AdminMovies from './pages/AdminMovies';
import AdminTheatres from './pages/AdminTheatres';
import AdminShows from './pages/AdminShows';
import AdminUsers from './pages/AdminUsers';
import AdminBookings from './pages/AdminBookings';
import NotFound from './pages/NotFound';

import { fetchCurrentUser, logout } from './redux/slices/authSlice';
import { fetchCities } from './redux/slices/movieSlice';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // If token exists, load current user profile
    if (localStorage.getItem('imovies_token')) {
      dispatch(fetchCurrentUser());
    }
    dispatch(fetchCities());

    // Listen to token expiry events dispatched by axios interceptor
    const handleAuthChange = () => {
      dispatch(logout());
    };
    window.addEventListener('imovies_auth_change', handleAuthChange);

    return () => {
      window.removeEventListener('imovies_auth_change', handleAuthChange);
    };
  }, [dispatch]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark-cinema">
      <Navbar />

      <main className="flex-grow-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Protected Routes */}
          <Route
            path="/shows/:id/seats"
            element={
              <ProtectedRoute>
                <SeatSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/confirmation/:id"
            element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/movies"
            element={
              <AdminRoute>
                <AdminMovies />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/theatres"
            element={
              <AdminRoute>
                <AdminTheatres />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/shows"
            element={
              <AdminRoute>
                <AdminShows />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AdminRoute>
                <AdminBookings />
              </AdminRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />

      {/* Toast Notifications Container */}
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default App;
