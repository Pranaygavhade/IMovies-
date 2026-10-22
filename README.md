# IMovies – Movie Ticket Booking Made Simple 🎬🍿

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-red.svg)](https://reactjs.org/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-black.svg)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-39%20Passing-success.svg)](https://jestjs.io/)
[![Deploy](https://img.shields.io/badge/Deploy-Single--Deploy%20Monorepo-blueviolet.svg)](render.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**IMovies** is a complete, production-ready cinema ticket booking platform built on the modern MERN stack. Designed with a cinematic dark theme (`#0b0b12`, `#e50914`, `#d4af37`), it features live movie catalog synchronization via TMDB (with an automated curated fallback as of 22 October 2026), intelligent city auto-detection defaulting to **Bhilai, Chhattisgarh**, real multiplexes and heritage cinema halls in Bhilai and Durg, a rolling 7-day show schedule with zero overlaps, real-time seat lock synchronization, an interactive curved-screen auditorium layout, dynamic QR ticketing, a dual-mode payment gateway (Razorpay test mode + built-in zero-dependency simulated gateway), a watchlist, an audience reviews system with automatic movie rating recalculation, and an admin command center with live Recharts analytics and CSV export.

---

## 🌟 Key Features

### 📍 Live Movies, Geo-City & Real Details (Section 16)
- **Live TMDB Catalog Sync**: Automatically queries `/movie/now_playing`, `/movie/upcoming`, and `/discover/movie` with Indian languages (`hi, te, ta, ml, kn, bn, mr, pa, en`). Daily automated cron sync + admin 1-click "Sync Movies Now" button.
- **22 October 2026 Curated Catalog**: 18 curated films (*Drishyam 3: The Conclusion*, *Prem Keetanu*, *Udta Teer*, *Jailer 2*, *Ranabaali*, *Prahaar*, *Nayyi Navelli*, *Street Fighter*, *Tu Hai Meri Kiran*, *Kaali Kheti*, *Ramayana: Part 1*, etc.) loaded instantly when TMDB key is omitted.
- **Intelligent City Auto-Detection**:
  1. Browser Geolocation API reverse-geocoded to the nearest supported cinema hub
  2. IP-based server fallback (`/api/v1/cities/detect-ip`)
  3. Last remembered city in `localStorage`
  4. Default: **Bhilai, Chhattisgarh**
- **12 Supported Cinema Cities**: Bhilai, Durg, Raipur, Nagpur, Bilaspur, Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Pune, and Kolkata.
- **Real Theatres for Bhilai & Durg**:
  - *Bhilai*: PVR Treasure Island, Mukta A2 Cinemas, New Vasant Talkies, RLR Cinemas
  - *Durg*: Tarun LV Cinemas, Swaroop Talkies, K Sera Sera Miniplex
  - *Plus venues across Raipur, Nagpur, and Mumbai*.
- **7-Day Rolling Show Generator**: Nightly 00:05 IST cron keeps the next 7 days filled with shows for every active movie across all multiplexes and single screens with zero collisions.
- **Interactive Proximity & Directions**: Displays live distance in kilometers from the user's location and 1-click "Get Directions" Google Maps links.
- **OCCUPANCY BADGES & SHOW STATUS**: Live occupancy chips ("Fast Filling" >70%, "Almost Full" >90%), greyed-out passed showtimes, and `Asia/Kolkata` timezone with Indian Rupee (`₹`) pricing throughout.

### 🎟️ QR Entry Validation & Dual-Mode Payment Architecture (Section 5)
- **HMAC-SHA256 Cryptographically Signed Ticket QR**:
  - The e-ticket QR encodes a signed cryptographic token (`bookingId + showId + seats + expiry + sig`) signed with a dedicated server secret—never plain vulnerable booking text.
  - **Single-Use Gate Enforcement**: Authenticated endpoint `GET /api/v1/tickets/verify?token=&bookingCode=` checks signature validity, ensures the booking is confirmed and paid, confirms the show has not ended, and atomically marks the ticket as `used` with timestamp and staff ID. Subsequent scans return `already_used`.
  - **Staff Gate Scanner Portal (`/admin/scan-ticket`)**: Native camera-based QR scanner using `html5-qrcode` with live device camera switching, sound/visual verification cards, and instant manual booking code / token lookup.
  - **Downloadable PDF Tickets**: Responsive digital pass ready for single-click high-resolution PDF download using `html2canvas` + `jspdf`.
- **PhonePe QR (Manual Verification Mode)**:
  - Displayed **unmodified** at `client/public/assets/phonepe-qr.jpeg` on the checkout page only (never on the ticket).
  - Explicit merchant payee guidance: *"Pay exactly ₹X to PRANAY GAVHADE and enter your UTR/transaction ID"*.
  - **15-Minute Seat Reservation**: Locks seats for 15 minutes while user completes payment in their PhonePe / UPI app.
  - **Strict UTR Enforcement**: 12-digit numeric UTR validation with a database unique sparse index to prevent reuse or fraudulent claims.
  - **Optional Screenshot Upload**: Users can attach payment screenshots for merchant verification.
  - **Status Flow**: Sets booking to `payment_under_review`. The user is guided by a live countdown and automatic status polling.
  - **Admin Pending Payments Ledger (`/admin/pending-payments`)**: Dedicated admin dashboard displaying amount, 12-digit UTR with 1-click copy, screenshot modal viewer, and expiration timers.
  - **Admin Approval / Rejection Workflow**: ONLY admin approval confirms the booking, marks seats as `booked`, and generates the HMAC ticket QR. Rejection or expiry immediately cancels the booking and restores seats to `available`.
- **Automatic Instant Verified Payments (Primary Mode)**:
  - Supports Razorpay test mode (cards/UPI/netbanking) and built-in zero-dependency simulated gateway.
  - Dedicated failure simulation to test declined payments with zero seat loss.

### 🎬 High-Fidelity Homepage & Discovery (Section 11)
- **Authentic Movie Metadata**: Every film displays real, verified metadata (release date, certificate `U`/`UA`/`A`, IMDb/TMDB ratings, runtimes in hours and minutes). Unverified or placeholder values are strictly hidden.
- **Dynamic City Selection**:
  1. Browser Geolocation API reverse-geocodes coordinates to nearest supported cinema hub.
  2. Persistent choice in `localStorage`.
  3. Clear visual badge: *"Default city: Bhilai"* with prominent *"Change city"* modal selector.
- **Hero Spotlight Carousel**: 7-second auto-rotation with **smart pause on hover**, backdrops, runtime, certificate chips, and instant *"Book Tickets"* & trailer modal triggers.
- **Real-Data Trending Row**: Transparently ranked by confirmed bookings in the last 7 days, user watchlist additions, and TMDB popularity metrics, with explicit disclosure badge.
- **Smart Language Filters**: Dynamic counter (e.g., *"Showing 4 Hindi movies in Bhilai"*), visible *"Clear filters"* button, and empty state fallbacks.
- **Enriched Cinema Movie Cards**:
  - Certificate & "Now Showing" badges.
  - Concise one-line synopsis.
  - Available cinema count (*"Available in N cinemas"*).
  - Next 3 clickable showtime chips linking straight to auditorium seat maps.
  - Instant Watchlist heart toggle with toast confirmation.
  - Real theatre amenities (Dolby Atmos 7.1, 4K Laser, Recliner Lounges, Food Court, Wheelchair Access).
- **Live Search Autocomplete**: Instant suggestions dropdown displaying categorized matches across Movies, Cinemas, and Genres.
- **Mobile Sticky Navigation Bar**: Responsive bottom bar on mobile viewports for quick switching between Home, Movies, Tickets, Watchlist, and Profile.
- **Platform Footer**: Standardized branding featuring the badge: *"Engineered with love for movie lovers everywhere"* with a crimson heart.

### 🎟️ Public & Audience Experience
- **Cinematic Dark Design**: Immersive `#0b0b12` interface with crimson `#e50914` & gold `#d4af37` accents, glassmorphic panels, and backdrop blur.
- **Hero Carousel**: Autoplay showcase of trending releases with movie details, runtime, genre chips, and YouTube trailer modals.
- **Multi-City Multiplex Discovery**: Browse movies and showtimes across **Mumbai**, **Bengaluru**, **Delhi NCR**, and **Chennai**.
- **Interactive Auditorium Seating**: Authentic cinema layout with curved screen indicator, aisle gaps, and tier-colored rows (**Lower**, **Middle**, **Balcony** / **Regular**, **Premium**, **Insignia Recliner**).
- **Zero Double-Booking (Real-Time Socket.IO)**: Seats locked by another user are instantly broadcast to all connected viewers and highlighted in amber.
- **5-Minute Reservation Timer**: Locked seats automatically release if payment is not completed within 5 minutes.
- **Dual-Mode Payment Gateway**:
  - **Razorpay Test Mode**: Dynamically loads official Razorpay checkout script if `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` are configured.
  - **Built-in Simulated Gateway**: Realistic Card, UPI / QR, Netbanking, and Wallets with 0 external keys needed for complete demo.
  - **Dedicated "Payment Failed – Retry" Screen**: Test failure cards (`4000 0000 0000 0002`), UPI failure IDs (`@fail`), and test failure switch let you test declined bank transactions and retry without losing your 5-minute reserved seats.
- **Dynamic QR Ticket Passes**: High-fidelity digital ticket with scannable QR code generated server-side, confetti celebrations, and native print / download support.
- **Cancellation & Smart Refunds**: Full refund automatically credited if cancelled 2+ hours before showtime; 50% within 2 hours; 0% after showtime.
- **Watchlist (Favorites)**: 1-click heart toggle on movie cards and movie details page to save movies to personal watchlist.
- **Audience Reviews & Ratings**: Submit 1-5 star reviews with comments; automatically updates and recalculates the movie's average rating and total rating count.
- **User Notifications & Profile**: Live in-app notification center for booking confirmations, cancellations, and profile/password management.

### 🛡️ Admin Command Center
- **Executive Analytics**: Gross revenue counter, tickets sold, multiplex occupancy rate, and audience accounts.
- **Visual Trends (Recharts)**: 7-day revenue trend area chart and top grossing movies.
- **CSV Financial Export**: One-click authenticated download of the platform revenue report (`/api/v1/admin/reports/revenue-csv`).
- **Movie Catalog Management**: Add, edit, or delete movies with poster uploads or direct image URLs.
- **Cinema Hall & Screen Management**: Configure auditorium screen layouts and seat pricing tiers.
- **Showtime Scheduler**: Schedule shows with automated screen collision / overlap conflict detection.
- **Customer & Booking Ledger**: Searchable platform ledger to monitor tickets, status, and manage active/deactivated user accounts.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js (v18+), Express.js, MongoDB / Mongoose, JWT, bcryptjs, Socket.IO, Multer, Helmet, Morgan, Compression, Express-Rate-Limit, Express-Validator, QRCode, Crypto HMAC-SHA256, Nodemailer, Node-Cron, Razorpay SDK |
| **Frontend** | React 18 (Vite), React Router DOM v6, Redux Toolkit, Axios, Tailwind CSS v4, Bootstrap 5, Framer Motion, Recharts, Lucide React, React Toastify, HTML5-QRCode, HTML2Canvas, jsPDF, Canvas-Confetti |
| **Testing** | Jest, Supertest (**39 automated integration tests across 10 test suites – 100% PASS**) |
| **Deployment** | Single-Deploy Monorepo (Express serves static Vite `client/dist` with SPA fallback; configured for Render via `render.yaml`) |
| **Tooling** | Postman Collection v2.1, Concurrently, Dotenv |

---

## 📁 Repository Structure

```
imovies/
├── package.json            # Root workspace scripts (install-all, build, start, dev, seed, test)
├── render.yaml             # Render single web service blueprint
├── .env.example            # Root environment variable template
├── server/
│   ├── config/             # DB connection with auto MongoMemoryServer fallback
│   ├── controllers/        # Auth, Movie, Theatre, Show, Seat, Booking, Payment, Ticket, Favorite, Review, Admin
│   ├── middleware/         # JWT Auth, Role Authorizer, Multer Upload, Express-Validator, Sanitizer, Error Handler
│   ├── models/             # User, Movie, Theatre, Show, Seat, Booking, Payment, Favorite, Review, Notification
│   ├── routes/             # REST endpoints under /api/v1 (auth, movies, theatres, shows, bookings, payments, tickets, admin, etc.)
│   ├── seed/               # Database seeder (1 Admin, 3 Users, 18 Curated Fallback Movies, Multiplexes, Rolling Shows)
│   ├── services/           # paymentService, tmdbService, emailService, qrService (HMAC signing), seatLockService
│   ├── sockets/            # Socket.IO room broadcaster for real-time seats
│   ├── tests/              # Automated integration tests (api.test.js - 39 tests)
│   ├── utils/              # apiResponse, logger (Winston)
│   ├── server.js           # Server entry point + static client/dist serving
│   └── package.json
├── client/
│   ├── public/
│   │   └── assets/         # phonepe-qr.jpeg (PhonePe merchant QR)
│   ├── src/
│   │   ├── api/            # Relative Axios instance (/api/v1), relative Socket.IO connection
│   │   ├── components/     # Navbar (Live Search), Footer, MobileBottomNav, Modals, Skeletons, Loaders
│   │   ├── pages/          # Home, Movies, MovieDetails, SeatSelection, Payment, BookingConfirmation (PDF), MyBookings, Watchlist, Profile, AdminDashboard, AdminScanTicket, AdminPendingPayments
│   │   ├── redux/          # Store & Slices (auth, movies, booking, notifications)
│   │   ├── App.jsx         # App routes & toast notifications container
│   │   ├── index.css       # Cinematic dark theme styling & custom CSS
│   │   └── main.jsx        # React root
│   ├── dist/               # Built static production bundle
│   ├── package.json
│   └── vite.config.js      # Vite build & development proxy
└── postman/
    └── IMovies.postman_collection.json # Comprehensive tested Postman collection with Gate Scanner & PhonePe QR
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v8.0.0 or higher)
- *Optional*: Local MongoDB instance (If no MongoDB server is running, the server automatically starts a zero-config in-memory MongoDB instance with pre-seeded data so you can test immediately!)

### 1. Install Dependencies
Run from the root directory to install all dependencies for root, server, and client:
```bash
npm run install-all
```

### 2. Seed Database
Populate the database with 1 Admin, 3 Users, 13 Movies, 4 Theatres across 4 cities, 84 Shows over 7 days, and 5,040 cinema seats:
```bash
npm run seed
```

### 3. Run in Development
Start both the backend API server (port 5000) and frontend client (port 5173 with Vite proxy) concurrently:
```bash
npm run dev
```
- **Client UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 4. Run in Production (Single-Deploy Monorepo)
Compile the client and start the production server on port 5000:
```bash
npm run build
npm start
```
Now visit [http://localhost:5000](http://localhost:5000) — the Node.js server serves the static React application, the API, and Socket.IO on the same single port!

---

## 🔑 Default Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin Director** | `admin@imovies.com` | `Admin@123` | Full access to Admin Portal, Movies, Shows, Theatres, Ledger, CSV Reports |
| **Audience User** | `john@example.com` | `User@123` | Book tickets, real-time seats, QR passes, cancel bookings, watchlist, reviews |
| **Audience User** | `sarah@example.com` | `User@123` | Book tickets, personal profile, reviews |
| **Audience User** | `alex@example.com` | `User@123` | Book tickets, personal profile |

> **Tip**: The login page includes convenient **1-Click Demo Login** buttons to sign in instantly with either Admin or User credentials!

---

## 💳 Dual-Mode Payment System

IMovies dynamically selects the payment gateway based on your environment:

1. **Razorpay Test Mode**:
   - Active when `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in `.env`.
   - Generates official Razorpay orders, opens the Razorpay modal, and verifies signatures using HMAC SHA256.
2. **Built-in Simulated Gateway**:
   - Active when Razorpay keys are omitted.
   - Requires **ZERO external keys** — works 100% out of the box!
   - Provides realistic Card, UPI, Netbanking, and Wallet checkout forms.
   - **Test Card Presets**:
     - Success Card: `4111 1111 1111 1111` (Expires 12/28, CVV 999)
     - Failure Card: `4000 0000 0000 0002` (Triggers bank-declined transaction)
   - **Test UPI Presets**:
     - Success UPI: `john@okhdfcbank`
     - Failure UPI: `customer@fail`
   - **Dedicated "Payment Failed – Retry" Screen**:
     - Shows transaction failure reason while preserving the 5-minute reserved seats countdown.
     - One-click "Retry Payment Now" resets the checkout form so the user can fix details without re-selecting seats.

---

## 📡 REST API Reference (`/api/v1`)

### Authentication (`/auth`)
- `POST /auth/register` – Register new user
- `POST /auth/login` – Login & receive JWT Bearer token
- `GET /auth/me` – Get authenticated user profile (`Bearer Token`)
- `PUT /auth/profile` – Update name, phone, or avatar
- `PUT /auth/change-password` – Update password

### Movies (`/movies`)
- `GET /movies` – Paginated list with search, filter (genre, language, city, status), and sorting
- `GET /movies/trending` – Transparently ranked by 7-day bookings, watchlist additions & TMDB score
- `GET /movies/suggestions?q=` – Autocomplete search suggestions for movies, cinemas, and genres
- `GET /movies/:id` – Single movie details, trailer, and available screening dates
- `POST /movies` – Create movie (`Admin`)
- `PUT /movies/:id` – Update movie (`Admin`)
- `DELETE /movies/:id` – Delete movie & cancel associated shows (`Admin`)

### Cities & Geolocation (`/cities`)
- `GET /cities` – List all 12 supported cinema cities with default `Bhilai`
- `GET /cities/nearest?lat=&lng=` – Nearest supported city via Haversine reverse-geocoding
- `GET /cities/detect-ip` – IP-based fallback city detection

### Theatres (`/theatres`)
- `GET /theatres` – List theatres (optional `?city=Bhilai`)
- `GET /theatres/cities` – List distinct cinema hub cities
- `GET /theatres/:id` – Single theatre details with screens & amenities
- `POST /theatres` – Create theatre (`Admin`)
- `PUT /theatres/:id` – Update theatre (`Admin`)
- `DELETE /theatres/:id` – Delete theatre (`Admin`)

### Shows & Real-time Seats (`/shows`)
- `GET /shows?movie=&date=&city=` – Filter scheduled showtimes
- `GET /shows/:id` – Get show details with real-time seat availability map
- `POST /shows/:id/lock-seats` – Lock seats for 5 minutes (`Bearer Token`)
- `POST /shows/:id/release-seats` – Release user's locked seats (`Bearer Token`)
- `POST /shows` – Schedule show with screen overlap collision validation (`Admin`)
- `DELETE /shows/:id` – Delete show and purge generated seats (`Admin`)

### Bookings & Payments (`/bookings` & `/payments`)
- `POST /bookings` – Create pending reservation with server-calculated total
- `GET /bookings/my` – Retrieve user's upcoming and past booking history
- `GET /bookings/:id` – Single booking details with scannable QR ticket pass
- `PUT /bookings/:id/cancel` – Cancel booking (Applies 2-hour refund rule: 100% >2h, 50% <2h, 0% after show)
- `POST /payments/initiate` – Create gateway order (Razorpay order ID or simulated order ID)
- `POST /payments/verify` – Idempotent verification, generates QR code, updates seats to booked, sends email receipt
- `POST /payments/webhook` – Raw-body HMAC verified Razorpay webhook
- `POST /payments/submit-manual-qr` – Submit PhonePe QR 12-digit UTR + screenshot for manual review (15-min seat lock)

### Tickets & Entry Gate Verification (`/tickets`)
- `GET /tickets/verify?token=&bookingCode=` – Cryptographically verify HMAC-signed ticket token, enforce single-use entry, and return gate validation status (`Admin / Staff`)

### Watchlist / Favorites (`/favorites`)
- `GET /favorites` – Get current user's saved movies
- `GET /favorites/check/:movieId` – Check if movie is in user's watchlist
- `POST /favorites/:movieId` – Add movie to watchlist
- `DELETE /favorites/:movieId` – Remove movie from watchlist

### Reviews & Ratings (`/reviews`)
- `GET /reviews/movie/:movieId` – Get approved reviews for a movie
- `POST /reviews/:movieId` – Submit or update a 1-5 star review and comment (auto-recalculates movie average rating)
- `DELETE /reviews/:id` – Delete review

### Admin Command Center (`/admin`)
- `GET /admin/stats` – Revenue metrics, 7-day trend, top movies, multiplex occupancy rate
- `GET /admin/reports/revenue-csv` – Streamed CSV financial ledger download
- `GET /admin/users` – Paginated audience user accounts
- `GET /admin/sync/movies` – Trigger live TMDB catalog sync or curated fallback (`Admin`)
- `POST /admin/generate-shows` – Trigger rolling 7-day show schedule generation (`Admin`)
- `PUT /admin/users/:id/toggle-status` – Suspend / activate user account
- `GET /admin/bookings` – Searchable platform bookings ledger
- `GET /admin/pending-payments` – View all pending manual PhonePe QR submissions with UTR and screenshot
- `POST /admin/payments/:bookingId/approve` – Approve manual PhonePe payment, confirm seats, generate HMAC ticket QR
- `POST /admin/payments/:bookingId/reject` – Reject manual PhonePe payment, release seats, and notify customer

### Notifications (`/notifications`)
- `GET /notifications` – User notifications and unread counter
- `PUT /notifications/:id/read` – Mark notification as read
- `PUT /notifications/read-all` – Mark all notifications as read

---

## 🧪 Automated Testing

The backend includes a comprehensive Jest + Supertest integration suite with **39 automated tests** covering all 10 core system domains:

```bash
npm test
```

### Test Suite Execution:
```
PASS tests/api.test.js (55.9 s)
  1. Authentication & Security Workflow
    √ should register a new user successfully
    √ should reject registration with duplicate email
    √ should reject login with wrong password
    √ should retrieve current user profile with valid token
    √ should reject unauthorized access without token
  2. Movies & Search/Filter APIs
    √ should retrieve paginated movies list
    √ should search movies by title
    √ should filter movies by genre
  3. Shows & Real-time Seat Availability
    √ should get show details and seat layout
    √ should lock seats for 5 minutes
    √ should prevent double-locking the same seats by another user (409 Conflict)
  4. Complete End-to-End Booking & Payment Lifecycle
    √ should create a pending booking for the locked seats with server-calculated amount
    √ should initiate payment order and return gateway details
    √ should reject payment verification if signature / token is tampered
    √ should verify payment, confirm booking, generate QR code, and mark seats as booked
    √ should handle idempotent payment verification without errors or double-booking
    √ should fetch user bookings history including confirmed booking
    √ should cancel booking and process refund according to rules
  5. Watchlist (Favorites) & Reviews
    √ should add a movie to user watchlist
    √ should list user favorites
    √ should create a review and recalculate movie average rating
  6. Role-Based Access Control & Admin Features
    √ should forbid regular users from accessing admin statistics (403 Forbidden)
    √ should allow admin user to access admin statistics
    √ should export revenue report CSV for admin
  7. Section 16 - Geolocation & Live Indian Cinema Cities
    √ should list supported cities including Bhilai as default
    √ should reverse-geocode Bhilai coordinates to Bhilai
    √ should reverse-geocode Durg coordinates to Durg
    √ should return client IP detected city
    √ should retrieve theatres in Bhilai with real multiplexes
  8. Section 16 - TMDB Live Sync & Rolling Shows
    √ should trigger TMDB sync or curated fallback successfully
    √ should trigger 7-day rolling show generation
  9. Section 5 - QR Codes & Gate Entry Verification
    √ should reject gate verification without admin/staff authorization
    √ should verify valid HMAC-signed ticket QR and mark ticket as used (single use)
    √ should return state already_used on second entry attempt
    √ should reject verification with tampered HMAC signature
  10. Section 5 - PhonePe QR Manual Verification Flow
    √ should submit manual PhonePe payment with 12-digit UTR and set status to payment_under_review
    √ should reject duplicate UTR submission
    √ should list pending manual payments for admin
    √ should allow admin to approve manual payment and confirm booking with HMAC ticket QR
    √ should allow admin to reject manual payment and release seats to available

Test Suites: 1 passed, 1 total
Tests:       39 passed, 39 total (100% PASS)
```

---

## 🌐 Production Deployment (Render)

This repository is structured as a **Single-Deploy Monorepo**. A single web service builds the client and serves both the React frontend and Express backend from one process.

Included `render.yaml`:
```yaml
services:
  - type: web
    name: imovies-cinema-platform
    env: node
    plan: free
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        generateValue: true
      - key: MONGO_URI
        sync: false # Set your MongoDB Atlas URI in Render dashboard
```

1. Push your repository to GitHub.
2. In [Render](https://render.com), click **New +** > **Blueprint** and select your repository (or create a **Web Service** with Build Command: `npm run build` and Start Command: `npm start`).
3. Set your `MONGO_URI` environment variable.
4. Your platform will be live at `https://your-service.onrender.com`!

---

## 📮 Postman Collection

Import `postman/IMovies.postman_collection.json` into Postman to explore and test all API routes. The collection includes pre-configured collection variables (`baseUrl`, `authToken`, `adminToken`) with automated token extraction on login.

---

## 📄 License
MIT License. Built for cinema lovers and theatre multiplex operators worldwide.
