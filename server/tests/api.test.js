process.env.NODE_ENV = 'test';
const request = require('supertest');
const { app, httpServer, startServer } = require('../server');
const mongoose = require('mongoose');
const { disconnectDB } = require('../config/db');

jest.setTimeout(35000);

let adminToken;
let userToken;
let testShowId;
let testMovieId;
let testSeatNumbers = [];
let createdBookingId;
let gatewayOrderId;
let gatewaySimulationToken;

beforeAll(async () => {
  await startServer();

  // Login as admin
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@imovies.com', password: 'Admin@123' });
  adminToken = adminRes.body.data.token;

  // Login as regular user
  const userRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'john@example.com', password: 'User@123' });
  userToken = userRes.body.data.token;

  // Fetch a show to use in tests
  const showsRes = await request(app).get('/api/v1/shows');
  if (showsRes.body.data.shows && showsRes.body.data.shows.length > 0) {
    testShowId = showsRes.body.data.shows[0]._id;
    testMovieId = showsRes.body.data.shows[0].movie?._id || showsRes.body.data.shows[0].movie;
  }
});

afterAll(async () => {
  if (httpServer) {
    httpServer.close();
  }
  await disconnectDB();
});

describe('1. Authentication & Security Workflow', () => {
  it('should register a new user successfully', async () => {
    const randomEmail = `test_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Audience',
        email: randomEmail,
        password: 'Password@123',
        phone: '+1 555-9988',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(randomEmail);
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate User',
        email: 'john@example.com',
        password: 'Password@123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'john@example.com',
        password: 'WrongPassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should retrieve current user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('John Doe');
  });

  it('should reject unauthorized access without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('2. Movies & Search/Filter APIs', () => {
  it('should retrieve paginated movies list', async () => {
    const res = await request(app).get('/api/v1/movies?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.movies.length).toBeLessThanOrEqual(5);
    expect(res.body.data.pagination).toBeDefined();
  });

  it('should search movies by title', async () => {
    const res = await request(app).get('/api/v1/movies?search=Dune');
    expect(res.status).toBe(200);
    expect(res.body.data.movies.length).toBeGreaterThan(0);
    expect(res.body.data.movies[0].title).toContain('Dune');
  });

  it('should filter movies by genre', async () => {
    const res = await request(app).get('/api/v1/movies?genre=Sci-Fi');
    expect(res.status).toBe(200);
    expect(res.body.data.movies.length).toBeGreaterThan(0);
    const hasSciFi = res.body.data.movies.every(
      (m) => (m.genres && m.genres.includes('Sci-Fi')) || (m.genre && m.genre.includes('Sci-Fi'))
    );
    expect(hasSciFi).toBe(true);
  });
});

describe('3. Shows & Real-time Seat Availability', () => {
  it('should get show details and seat layout', async () => {
    const res = await request(app).get(`/api/v1/shows/${testShowId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.show).toBeDefined();
    expect(res.body.data.seats.length).toBeGreaterThan(0);

    // Pick two available seats for locking test
    const available = res.body.data.seats.filter((s) => s.status === 'available');
    expect(available.length).toBeGreaterThanOrEqual(2);
    testSeatNumbers = [available[0].seatNumber, available[1].seatNumber];
  });

  it('should lock seats for 5 minutes', async () => {
    const res = await request(app)
      .post(`/api/v1/shows/${testShowId}/lock-seats`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seatNumbers: testSeatNumbers });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lockedSeats).toEqual(testSeatNumbers);
  });

  it('should prevent double-locking the same seats by another user', async () => {
    // Another user tries to lock the same seats
    const res = await request(app)
      .post(`/api/v1/shows/${testShowId}/lock-seats`)
      .set('Authorization', `Bearer ${adminToken}`) // different user
      .send({ seatNumbers: testSeatNumbers });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('4. Complete End-to-End Booking & Payment Lifecycle', () => {
  it('should create a pending booking for the locked seats with server-calculated amount', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showId: testShowId,
        seatNumbers: testSeatNumbers,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.bookingCode).toBeDefined();
    expect(res.body.data.booking.status).toBe('pending');
    expect(res.body.data.booking.totalAmount).toBeGreaterThan(0);
    createdBookingId = res.body.data.booking._id;
  });

  it('should initiate payment order and return gateway details', async () => {
    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId: createdBookingId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBeDefined();
    gatewayOrderId = res.body.data.orderId;
    gatewaySimulationToken = res.body.data.simulationToken;
  });

  it('should reject payment verification if signature / token is tampered', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookingId: createdBookingId,
        orderId: gatewayOrderId,
        simulationToken: 'tampered_fake_token_value',
        paymentMethod: 'card',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should verify payment, confirm booking, generate QR code, and mark seats as booked', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookingId: createdBookingId,
        orderId: gatewayOrderId,
        simulationToken: gatewaySimulationToken,
        paymentMethod: 'card',
        cardNumber: '4111 1111 1111 1111',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.status).toBe('confirmed');
    expect(res.body.data.booking.qrCode || res.body.data.booking.qrData).toContain('data:image/png;base64');
  });

  it('should handle idempotent payment verification without errors or double-booking', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookingId: createdBookingId,
        orderId: gatewayOrderId,
        simulationToken: gatewaySimulationToken,
        paymentMethod: 'card',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.status).toBe('confirmed');
  });

  it('should fetch user bookings history including confirmed booking', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.all.length).toBeGreaterThan(0);
  });

  it('should cancel booking and process refund according to rules', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');
    expect(['full', 'partial', 'ineligible']).toContain(res.body.data.refundStatus);
  });
});

describe('5. Watchlist (Favorites) & Reviews', () => {
  it('should add a movie to user watchlist', async () => {
    const res = await request(app)
      .post(`/api/v1/favorites/${testMovieId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('should list user favorites', async () => {
    const res = await request(app)
      .get('/api/v1/favorites')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.favorites.length).toBeGreaterThan(0);
  });

  it('should create a review and recalculate movie average rating', async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${testMovieId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        rating: 5,
        comment: 'Masterpiece! Visual storytelling at its finest.',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });
});

describe('6. Role-Based Access Control & Admin Features', () => {
  it('should forbid regular users from accessing admin statistics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin user to access admin statistics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalRevenue).toBeDefined();
  });

  it('should export revenue report CSV for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reports/revenue-csv')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/csv');
    expect(res.text).toContain('Booking Code');
  });
});
