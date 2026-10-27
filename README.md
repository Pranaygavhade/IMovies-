# iMovies — Full-Stack Cinema Discovery & Movie Ticket Booking Website

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-brightgreen.svg)](https://mongoosejs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime%20Seats-black.svg)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test%20Gateway-blue.svg)](https://razorpay.com/)

A movie discovery and ticket booking platform built with **React, Vite, TypeScript, Tailwind CSS, Node.js, Express, MongoDB with 2dsphere Geospatial indexing, Socket.IO, and Razorpay**.

---

## 1. Key Features

- **Cinematic Dark UI**: Charcoal and obsidian aesthetic (`#060709`, `#0B0C10`) with restrained crimson accents (`#E50914`), smooth micro-animations, and responsive layouts across mobile, tablet, and desktop.
- **TMDB Integration**: Valid artwork paths, high-resolution landscape hero backdrops, portrait movie cards (`aspect-[2/3]`), and graceful local SVG placeholders.
- **Geospatial Cinema Discovery**: Browser Geolocation API ("Detect my location") combined with manual city selection (Mumbai, Bengaluru, Delhi NCR, Hyderabad, etc.), MongoDB `2dsphere` distance calculations, and proximity sorting.
- **Real-Time Seat Map (Socket.IO)**:
  - Curvilinear cinema screen representation.
  - Multi-category seating: VIP (amber), Premium (sky blue), Standard (slate).
  - Atomic seat locking with a 10-minute countdown timer.
  - Live cross-tab/cross-user status sync (`available`, `locked`, `booked`).
  - Automatic background recovery of abandoned/expired locks.
- **Razorpay Test-Mode Integration**:
  - Official Razorpay Checkout integration with cryptographic HMAC-SHA256 signature verification (`crypto.createHmac`).
  - Server-calculated pricing (tickets, convenience fee, 18% GST). Users cannot manipulate price on frontend.
  - Webhook listener with raw body capture.
  - Sandbox simulation mode for local zero-credential testing.
- **Digital Tickets & QR Verification**:
  - Unique persistent booking reference (`IMV-YYYYMMDD-XXXX`).
  - Base64 QR code for cinema entrance gate check-in.
  - Print/Download ticket support (`@media print` styling).
  - Gate verification endpoint (`/api/bookings/verify/:reference`).
- **Protected Admin Portal**:
  - Cinema manager with latitude/longitude coordinates and amenities.
  - Screen builder with custom row configs and seat categories.
  - Showtime scheduler with conflict detection (prevents overlapping shows on the same screen).
  - Dashboard analytics: revenue, ticket volume, active multiplexes.

---

## 2. Architecture & Project Structure

```
IMovies/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment variables & MongoDB connection
│   │   ├── controllers/     # Auth, Movies, Cinemas, Shows, Seats, Payments, Admin
│   │   ├── middlewares/     # JWT authentication, RBAC, Zod validation, error handling
│   │   ├── models/          # User, Movie, Cinema, Screen, Show, ShowSeat, Booking, Payment, Review
│   │   ├── routes/          # Express API route declarations
│   │   ├── scripts/         # Comprehensive database seeder with real TMDB data
│   │   ├── services/        # SeatLockService (atomic locking), RazorpayService
│   │   ├── socket/          # Socket.IO room dispatcher (show_${showId})
│   │   ├── utils/           # JWT, ApiError, TMDB artwork helper
│   │   ├── app.ts           # Express application setup, Helmet, CORS, Rate Limit
│   │   └── server.ts        # Server bootstrap, Socket.IO, cleanup interval
│   ├── tests/               # Vitest & Supertest unit/integration test suite
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, HeroBanner, MovieCard, CinemaCard, SeatMap, Modals
│   │   ├── context/         # AuthContext (JWT/user state), LocationContext (City/GPS)
│   │   ├── pages/           # Home, Movies, MovieDetails, Cinemas, CinemaDetails, SeatSelection, Confirmation, Admin
│   │   ├── services/        # Axios API client, Socket.IO client
│   │   ├── types/           # TypeScript definitions
│   │   ├── utils/           # Centralized TMDB image resolution & fallbacks
│   │   ├── App.tsx          # React Router setup
│   │   ├── index.css        # Tailwind directives, print styles, scrollbar
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── package.json             # Root orchestrator
└── README.md
```

---

## 3. Quick Start & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
From the root directory:
```bash
# 1. Install all dependencies (root, backend, frontend)
npm run install:all
```

### Seeding Initial Data
The backend includes a high-grade seeder with real TMDB movie records, premier multiplexes (PVR INOX Palladium, INOX Forum Bengaluru, PVR Ambience Delhi), screens with categorized layouts, and scheduled shows:
```bash
npm run seed
```

Default credentials seeded:
- **Admin**: `admin@imovies.com` / `Admin@123456`
- **Customer**: `john@example.com` / `User@123456`

### Running Development Servers
Run both backend (`http://localhost:5000`) and frontend (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Or run individually:
```bash
# Backend (Port 5000)
cd backend && npm run dev

# Frontend (Port 5173)
cd frontend && npm run dev
```

---

## 4. Running Tests & Verifications

Execute the backend automated test suite:
```bash
npm test
# or
cd backend && npx vitest run
```

### Verified Test Results (22 Passing Tests):
- ✅ TMDB artwork URL formatting with exact image size parameters (`w500`, `w1280`, `original`)
- ✅ Graceful local SVG fallback for missing poster/backdrop artwork
- ✅ User registration with bcrypt password hashing and JWT token issuance
- ✅ Role-Based Access Control: non-admins blocked with 403 on `/api/admin/*`
- ✅ Cinema geospatial distance calculation and sorting by proximity to user coordinates
- ✅ Filtering cinemas by city
- ✅ Admin Screen creation with categorized seat layouts (VIP, Premium, Standard)
- ✅ Movie synchronization and Showtime creation
- ✅ **Showtime Overlap Prevention**: 409 conflict when scheduling overlapping shows on the same screen
- ✅ **Atomic Seat Locking**: Prevents double-booking race conditions
- ✅ Rejection of concurrent lock attempts by another customer on the same seat
- ✅ Automatic recovery and release of expired seat locks
- ✅ Server-side price calculation (subtotal, convenience fee, GST)
- ✅ Razorpay order creation
- ✅ Cryptographic HMAC-SHA256 signature verification rejection on bogus signatures
- ✅ Payment failure seat release
- ✅ Payment success confirmation, ticket generation, and entrance QR code issuance
- ✅ Customer upcoming and past booking history retrieval
- ✅ Ticket verification at cinema check-in endpoint

---

## 5. Configuration & Environment Variables

### Backend Configuration (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Local MongoDB or MongoDB Atlas)
# Note: If no external MongoDB instance is running, an in-memory instance is automatically spawned for development.
MONGODB_URI=mongodb://localhost:27017/imovies

# Authentication
JWT_SECRET=super_secret_imovies_jwt_token_key_change_in_production_2026
JWT_EXPIRES_IN=7d

# TMDB API Credentials
# Get a free API key from https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here

# Razorpay Test Mode Credentials
# Get test keys from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
PAYMENT_CURRENCY=INR

# Frontend URL for CORS
CLIENT_URL=http://localhost:5173
```

### Frontend Configuration (`frontend/.env`)

```env
# Leave empty if using Vite dev proxy to localhost:5000
VITE_API_BASE_URL=
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
```

---

## 6. How to Configure External Services

### A. The Movie Database (TMDB) Setup
1. Register for a free account at [themoviedb.org](https://www.themoviedb.org/).
2. Navigate to **Settings > API** (`https://www.themoviedb.org/settings/api`).
3. Request an API key (Developer / Personal use).
4. Copy the **API Key (v3 auth)** into `backend/.env` under `TMDB_API_KEY`.
*(Note: If omitted, the application uses its built-in database of real TMDB titles, IDs, and official artwork paths.)*

### B. MongoDB Atlas Setup
1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free M0 cluster.
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) or your hosting IP.
5. Click **Connect > Drivers (Node.js)** and copy the connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/imovies?retryWrites=true&w=majority`
6. Paste into `backend/.env` under `MONGODB_URI`.

### C. Razorpay Test Mode Setup
1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com/).
2. Toggle the dashboard switch to **Test Mode**.
3. Navigate to **Account & Settings > API Keys > Generate Key**.
4. Copy `Key Id` (`rzp_test_...`) and `Key Secret`.
5. Paste into `backend/.env` under `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
6. Add the public `RAZORPAY_KEY_ID` into `frontend/.env` under `VITE_RAZORPAY_KEY_ID`.
7. Test cards provided by Razorpay (e.g. Card: `4111 1111 1111 1111`, CVV: `123`, any future expiry, OTP: `123456`).

---

## 7. How to Create Screens & Shows through Admin Portal

1. Log in with admin credentials (`admin@imovies.com` / `Admin@123456`).
2. Click **Admin Portal** in the navigation header (or navigate to `/admin`).
3. **Add a Multiplex**:
   - Go to the **Add Multiplex** tab.
   - Enter name (e.g., `PVR ICON: Nexus Mall`), locality (`Koramangala`), city (`Bengaluru`), and coordinates (`12.9352`, `77.6245`).
   - Click **Create Cinema**.
4. **Schedule a Showtime**:
   - Go to the **Schedule Showtime** tab.
   - Select Movie, Cinema, Screen, and Format (2D/IMAX).
   - Set the date and start time.
   - Set pricing for categories: Standard (e.g. `₹250`), Premium (`₹400`), VIP (`₹600`).
   - Click **Create Showtime & Generate Seat Inventory**.
   - The system automatically validates against overlapping schedules on that screen and generates physical seat records for that showtime.

---

## 8. Deployment Guide

### Frontend Deployment (Vercel / Netlify)
1. Push repository to GitHub.
2. In Vercel or Netlify, import the repository and set:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Environment variables:
   - `VITE_API_BASE_URL`: URL of your deployed backend (e.g. `https://imovies-api.onrender.com`)
   - `VITE_RAZORPAY_KEY_ID`: `rzp_test_...`

### Backend Deployment (Render / Railway)
1. In Render, create a new **Web Service** connected to your repository:
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
2. Environment variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: A secure 32+ character random secret
   - `CLIENT_URL`: Your deployed frontend URL (e.g. `https://imovies.vercel.app`)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `TMDB_API_KEY`: Your TMDB API key
#   I M o v i e s -  
 