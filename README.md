# IMovies – Movie Ticket Booking Made Simple 🎬🍿

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-red.svg)](https://reactjs.org/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-black.svg)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

IMovies is a complete, production-ready cinema ticket booking platform built on the modern MERN stack. Designed with a cinematic dark theme, it delivers real-time seat lock synchronization, an interactive auditorium layout with curved screen projection, dynamic QR ticketing, simulated payment gateway with edge-case testing, and a comprehensive admin management suite with live analytics.

---

## 🌟 Key Features

### 🎟️ Public & Audience Experience
- **Cinematic Dark Design**: Immersive `#0b0b12` interface with crimson `#e50914` & gold `#d4af37` accents, glassmorphic panels, and backdrop blur.
- **Hero Carousel**: Autoplay showcase of trending releases with movie details, runtime, genre chips, and YouTube trailer modals.
- **Multi-City Multiplex Discovery**: Browse movies and showtimes across **Mumbai**, **Bengaluru**, **Delhi NCR**, and **Chennai**.
- **Interactive Auditorium Seating**: Authentic cinema layout with curved screen indicator, aisle gaps, and tier-colored rows (**Regular**, **Premium**, **Insignia Recliner**).
- **Zero Double-Booking (Real-time Socket.io)**: Seats locked by another user are instantly broadcast to all connected viewers and highlighted in amber.
- **5-Minute Reservation Timer**: Locked seats automatically release if payment is not completed within 5 minutes.
- **Simulated Payment Gateway**: Card, UPI / QR, Netbanking, and Wallets with a toggle switch to simulate gateway failure outcomes for testing edge cases.
- **Dynamic QR Ticket Passes**: High-fidelity digital ticket with scannable QR code generated server-side, confetti celebrations, and native print / download support.
- **Cancellation & Smart Refunds**: Full refund automatically credited if cancelled 2+ hours before showtime; non-refundable notice within 2 hours.
- **User Notifications & Profile**: Live in-app notification center for booking confirmations, cancellations, and profile/password management.

### 🛡️ Admin Command Center
- **Executive Analytics**: Gross revenue counter, tickets sold, multiplex occupancy rate, and audience accounts.
- **Visual Trends (Recharts)**: 7-day revenue trend line/area chart and top 5 grossing movies.
- **Movie Catalog Management**: Add, edit, or delete movies with poster uploads or direct image URLs.
- **Cinema Hall & Screen Management**: Configure auditorium screen layouts and seat pricing tiers.
- **Showtime Scheduler**: Schedule shows with automated screen collision / overlap conflict detection.
- **Customer & Booking Ledger**: Searchable platform ledger to monitor tickets, status, and manage active/deactivated user accounts.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js (v16+), Express.js, MongoDB / Mongoose, JWT, bcryptjs, Socket.IO, Multer, Helmet, Morgan, Compression, Express-Rate-Limit, Express-Validator, QRCode |
| **Frontend** | React 18 (Vite), React Router DOM v6, Redux Toolkit, Axios, Bootstrap 5, Framer Motion, Recharts, Lucide React, React Toastify, Canvas-Confetti |
| **Testing** | Jest, Supertest (15 automated integration tests) |
| **Tooling** | Postman Collection v2.1, Concurrently, Dotenv |

---

## 📁 Repository Structure

```
imovies/
├── server/
│   ├── config/             # DB connection with auto MongoMemoryServer fallback
│   ├── controllers/        # Auth, Movies, Theatres, Shows, Seats, Bookings, Payments, Admin, Notifications
│   ├── middleware/         # JWT Auth, Role Authorizer, Multer Upload, Express-Validator, Error Handler
│   ├── models/             # User, Movie, Theatre, Show, Seat, Booking, Payment, Notification
│   ├── routes/             # Versioned REST API endpoints (/api/v1)
│   ├── seed/               # Database seeder (1 Admin, 3 Users, 14 Movies, 4 Theatres, 84 Shows, 5418 Seats)
│   ├── sockets/            # Socket.IO room broadcaster for real-time seats
│   ├── tests/              # Automated integration tests (Jest + Supertest)
│   ├── uploads/            # Multer static storage for posters and backdrops
│   ├── .env.example
│   ├── package.json
│   └── server.js           # Express + HTTP + Socket.IO server with seat cleanup cron
├── client/
│   ├── src/
│   │   ├── api/            # Axios instance with interceptors, Socket.IO client singleton
│   │   ├── components/     # Navbar, Footer, ProtectedRoute, AdminRoute, Skeletons, Loaders
│   │   ├── pages/          # Home, Movies, MovieDetails, SeatSelection, Payment, Confirmation, MyBookings, Profile, Login, Register, Admin Pages
│   │   ├── redux/          # Store & Slices (auth, movies, booking, notifications)
│   │   ├── App.jsx         # App router and toast notifications
│   │   ├── index.css       # Cinematic dark theme styling
│   │   └── main.jsx        # React root
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js      # Code splitting & API proxy
├── postman/
│   └── IMovies.postman_collection.json # 20+ tested REST endpoints
├── package.json            # Root workspace orchestration
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- [npm](https://www.npmjs.com/) (v8.0.0 or higher)
- *Optional*: Local MongoDB or MongoDB Atlas URI (If no local MongoDB server is detected, the server automatically starts a zero-config in-memory MongoDB instance so you can test immediately!)

### 1. Install Dependencies
Run the root command to install both server and client packages:
```bash
npm run install:all
```
*(Or install individually: `cd server && npm install` then `cd ../client && npm install`)*

### 2. Environment Variables
Both `.env.example` files are pre-configured with default values for local development:
- **Server** (`server/.env`):
  ```env
  PORT=5000
  NODE_ENV=development
  MONGO_URI=mongodb://localhost:27017/imovies
  JWT_SECRET=imovies_super_secure_jwt_secret_key_2026_cinema_access
  JWT_EXPIRES_IN=7d
  CLIENT_URL=http://localhost:5173
  PAYMENT_KEY=simulated_imovies_pay_key_2026
  ```
- **Client** (`client/.env`):
  ```env
  VITE_API_URL=http://localhost:5000/api/v1
  VITE_SOCKET_URL=http://localhost:5000
  ```

### 3. Seed Database
Populate the database with 1 Admin, 3 Users, 14 Movies, 4 Theatres, 84 Shows across 7 days, and 5,418 cinema seats:
```bash
npm run seed
```

### 4. Run Development Servers
Start both backend API server and frontend client concurrently:
```bash
npm run dev
```
- **Client UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Default Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin Director** | `admin@imovies.com` | `Admin@123` | Full access to Admin Portal, Movies, Shows, Theatres, Analytics |
| **Audience User** | `john@example.com` | `User@123` | Book tickets, seat locking, view QR passes, cancel bookings |
| **Audience User** | `sarah@example.com` | `User@123` | Book tickets, personal profile |

> **Tip**: The login page includes convenient **1-Click Demo Login** buttons to sign in instantly without typing credentials!

---

## 📡 REST API Reference (`/api/v1`)

### Authentication
- `POST /auth/register` – Register new user
- `POST /auth/login` – Login & receive JWT Bearer token
- `GET /auth/me` – Get authenticated user profile (`Bearer Token`)
- `PUT /auth/profile` – Update name, phone, or avatar
- `PUT /auth/change-password` – Update user account password

### Movies
- `GET /movies` – Paginated list with search, filter (genre, language, city, status), and sorting
- `GET /movies/:id` – Single movie details, trailer, and available screening dates
- `POST /movies` – Create movie (`Admin`)
- `PUT /movies/:id` – Update movie (`Admin`)
- `DELETE /movies/:id` – Delete movie & cancel associated shows (`Admin`)

### Theatres
- `GET /theatres` – List theatres (optional `?city=Mumbai`)
- `GET /theatres/cities` – List distinct cinema hub cities
- `GET /theatres/:id` – Single theatre details with screens & amenities
- `POST /theatres` – Create theatre (`Admin`)
- `PUT /theatres/:id` – Update theatre (`Admin`)
- `DELETE /theatres/:id` – Delete theatre (`Admin`)

### Shows & Real-time Seats
- `GET /shows?movie=&date=&city=` – Filter scheduled showtimes
- `GET /shows/:id` – Get show details with real-time seat availability map
- `POST /shows/:id/lock-seats` – Lock seats for 5 minutes (`Bearer Token`)
- `POST /shows/:id/release-seats` – Release user's locked seats (`Bearer Token`)
- `POST /shows` – Schedule show with screen overlap collision validation (`Admin`)
- `DELETE /shows/:id` – Delete show and purge generated seats (`Admin`)

### Bookings & Payments
- `POST /bookings` – Create booking, generate QR code, process payment
- `GET /bookings/my` – Retrieve user's upcoming and past booking history
- `GET /bookings/:id` – Single booking details with scannable QR ticket pass
- `PUT /bookings/:id/cancel` – Cancel booking (Applies 2-hour refund rule)
- `POST /payments/initiate` – Simulated gateway order generation
- `POST /payments/verify` – Verify payment signature & authorization

### Admin Management
- `GET /admin/stats` – Platform summary, revenue trends, top movies (`Admin`)
- `GET /admin/users` – Paginated user accounts (`Admin`)
- `PUT /admin/users/:id/toggle-status` – Suspend / activate user account (`Admin`)
- `GET /admin/bookings` – Searchable platform booking ledger (`Admin`)

### Notifications
- `GET /notifications` – User's notifications and unread counter
- `PUT /notifications/:id/read` – Mark single notification as read
- `PUT /notifications/read-all` – Mark all notifications as read

---

## ⚡ Real-time WebSocket Protocol

IMovies uses **Socket.IO** to prevent seat collision and double-booking across concurrent browser sessions.

- **Join Room**: Client emits `join-show` with `showId` to join the room `show:${showId}`.
- **Seat Locked**: Emits `seat-locked` with `{ showId, seats, lockedBy, lockExpiresAt }` (seats glow amber on other clients).
- **Seat Released**: Emits `seat-released` with `{ showId, seats }` (seats revert to available dark slate).
- **Seat Booked**: Emits `seat-booked` with `{ showId, seats }` (seats turn red/disabled).
- **Auto-Release Cron**: Server runs a background interval job every 25 seconds to release expired locks and broadcasts to all viewing clients.

---

## 🧪 Automated Testing

The backend includes a comprehensive Jest + Supertest integration suite testing:
- Registration, duplicate email rejection, invalid password rejection, profile access
- Movie search, genre filtering, pagination
- Real-time seat locking and double-lock conflict prevention (409 Conflict)
- Complete booking checkout, payment generation, and QR code creation
- Role-based authorization checks (403 Forbidden for non-admins)

To run the automated tests:
```bash
npm run test:server
```
*Result: 15/15 tests passing.*

---

## 📮 Postman Collection

Import `postman/IMovies.postman_collection.json` into Postman to test all endpoints. It comes pre-configured with collection variables:
- `baseUrl`: `http://localhost:5000/api/v1`
- Auto-extracts `authToken` on User Login
- Auto-extracts `adminToken` on Admin Login

---

## 🌐 Production Deployment Guide

### 1. MongoDB Atlas Setup
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and whitelist IP `0.0.0.0/0`.
3. Copy your Connection String (`mongodb+srv://<user>:<password>@cluster.mongodb.net/imovies?retryWrites=true&w=majority`).

### 2. Backend Deployment (Render / Railway)
1. Push repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app).
3. Set Root Directory to `server`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Set Environment Variables:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = your production secret key
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = your frontend deployment URL (e.g. `https://imovies.vercel.app`)

### 3. Frontend Deployment (Vercel / Netlify)
1. Import repository to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. Set Root Directory to `client`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set Environment Variables:
   - `VITE_API_URL` = `https://your-server.onrender.com/api/v1`
   - `VITE_SOCKET_URL` = `https://your-server.onrender.com`

---

## 📄 License
MIT License. Built for movie enthusiasts and cinema operators worldwide.
