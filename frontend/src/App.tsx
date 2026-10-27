import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { LocationProvider } from './context/LocationContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { LocationModal } from './components/LocationModal.js';
import { AuthModal } from './components/AuthModal.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

// HomePage is loaded eagerly to ensure zero-delay initial screen render
import { HomePage } from './pages/HomePage.js';

// Heavy secondary routes are lazy-loaded to minimize initial JavaScript bundle size
const MoviesPage = React.lazy(() =>
  import('./pages/MoviesPage.js').then((m) => ({ default: m.MoviesPage }))
);
const MovieDetailsPage = React.lazy(() =>
  import('./pages/MovieDetailsPage.js').then((m) => ({ default: m.MovieDetailsPage }))
);
const CinemasPage = React.lazy(() =>
  import('./pages/CinemasPage.js').then((m) => ({ default: m.CinemasPage }))
);
const CinemaDetailsPage = React.lazy(() =>
  import('./pages/CinemaDetailsPage.js').then((m) => ({ default: m.CinemaDetailsPage }))
);
const SeatSelectionPage = React.lazy(() =>
  import('./pages/SeatSelectionPage.js').then((m) => ({ default: m.SeatSelectionPage }))
);
const BookingConfirmationPage = React.lazy(() =>
  import('./pages/BookingConfirmationPage.js').then((m) => ({ default: m.BookingConfirmationPage }))
);
const MyBookingsPage = React.lazy(() =>
  import('./pages/MyBookingsPage.js').then((m) => ({ default: m.MyBookingsPage }))
);
const AdminDashboardPage = React.lazy(() =>
  import('./pages/AdminDashboardPage.js').then((m) => ({ default: m.AdminDashboardPage }))
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFoundPage.js').then((m) => ({ default: m.NotFoundPage }))
);

const PageLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
    <div className="w-12 h-12 rounded-2xl bg-crimson-600/20 border border-crimson-500/40 flex items-center justify-center animate-pulse">
      <div className="w-5 h-5 rounded-lg bg-crimson-600" />
    </div>
    <div className="text-xs uppercase tracking-widest text-cinema-400 font-semibold">
      Loading cinematic view...
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <div className="min-h-screen bg-cinema-950 text-cinema-100 flex flex-col selection:bg-crimson-600 selection:text-white">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <ErrorBoundary>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/movies" element={<MoviesPage />} />
                    <Route path="/movies/:id" element={<MovieDetailsPage />} />
                    <Route path="/cinemas" element={<CinemasPage />} />
                    <Route path="/cinemas/:id" element={<CinemaDetailsPage />} />
                    <Route path="/shows/:id/seats" element={<SeatSelectionPage />} />
                    <Route path="/bookings/:id" element={<BookingConfirmationPage />} />
                    <Route path="/my-bookings" element={<MyBookingsPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
            <LocationModal />
            <AuthModal />
          </div>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
