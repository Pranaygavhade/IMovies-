require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
const City = require('../models/City');

const { syncMovies } = require('../services/tmdbService');
const { generateRollingShows } = require('../services/showGenerator');
const { getTodayKolkata } = require('../utils/dateUtils');

// Supported Cities as defined in Section 16.3
const citiesData = [
  { name: 'Bhilai', state: 'Chhattisgarh', lat: 21.2195, lng: 81.3227, isActive: true },
  { name: 'Durg', state: 'Chhattisgarh', lat: 21.1904, lng: 81.2849, isActive: true },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, isActive: true },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, isActive: true },
  { name: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0797, lng: 82.1409, isActive: true },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, isActive: true },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, isActive: true },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, isActive: true },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, isActive: true },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, isActive: true },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, isActive: true },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, isActive: true },
];

// Helper to construct screen layout
const makeScreen = (name, rows = 6, seatsPerRow = 10, lowerPrice = 110, midPrice = 160, balconyPrice = 250) => ({
  name,
  rows,
  seatsPerRow,
  seatLayout: [
    { row: 'A', tier: 'balcony', category: 'Recliner', seats: seatsPerRow, basePrice: balconyPrice },
    { row: 'B', tier: 'middle', category: 'Premium', seats: seatsPerRow, basePrice: midPrice },
    { row: 'C', tier: 'middle', category: 'Premium', seats: seatsPerRow, basePrice: midPrice },
    { row: 'D', tier: 'middle', category: 'Premium', seats: seatsPerRow, basePrice: midPrice },
    { row: 'E', tier: 'lower', category: 'Regular', seats: seatsPerRow, basePrice: lowerPrice },
    { row: 'F', tier: 'lower', category: 'Regular', seats: seatsPerRow, basePrice: lowerPrice },
  ],
});

// Real venues for Bhilai, Durg, Raipur, Nagpur, Mumbai as specified in Section 16.4
const theatresData = [
  // Bhilai
  {
    name: 'PVR Treasure Island',
    city: 'Bhilai',
    address: 'Surya Treasure Island Mall, Surya Vihar, Bhilai 490020',
    location: {
      address: 'Surya Treasure Island Mall, Surya Vihar, Bhilai 490020',
      lat: 21.2195,
      lng: 81.3227,
    },
    lowerSeats: 20,
    lowerSeatPrice: 180,
    middleSeats: 30,
    middleSeatPrice: 260,
    balconySeats: 10,
    balconySeatPrice: 420,
    amenities: ['Dolby Atmos', '4K Laser Projection', 'PVR Gold Class', 'Gourmet Food Court', 'Valet Parking'],
    screens: [
      makeScreen('Audi 1 - 4K Dolby Atmos', 6, 10, 180, 260, 420),
      makeScreen('Audi 2 - RealD 3D', 6, 10, 180, 260, 420),
      makeScreen('Audi 3 - Premium Luxe', 6, 10, 180, 260, 420),
      makeScreen('Audi 4 - Gold Class Recliner', 6, 10, 180, 260, 420),
    ],
  },
  {
    name: 'Mukta A2 Cinemas',
    city: 'Bhilai',
    address: 'Poonam Talkies, Nagar Palika Rd, Shanti Nagar, Bhilai 3, Charoda 490021',
    location: {
      address: 'Poonam Talkies, Nagar Palika Rd, Shanti Nagar, Bhilai 3, Charoda 490021',
      lat: 21.2125,
      lng: 81.4321,
    },
    lowerSeats: 20,
    lowerSeatPrice: 110,
    middleSeats: 30,
    middleSeatPrice: 130,
    balconySeats: 10,
    balconySeatPrice: 180,
    amenities: ['Dolby Digital 7.1', 'Comfort Seating', 'Cafeteria', 'Motorcycle & Car Parking'],
    screens: [
      makeScreen('Screen 1', 6, 10, 110, 130, 180),
      makeScreen('Screen 2', 6, 10, 110, 130, 180),
    ],
  },
  {
    name: 'New Vasant Talkies',
    city: 'Bhilai',
    address: 'Rajnagar, Camp 1, Bhilai 490023',
    location: {
      address: 'Rajnagar, Camp 1, Bhilai 490023',
      lat: 21.2093,
      lng: 81.3689,
    },
    lowerSeats: 20,
    lowerSeatPrice: 90,
    middleSeats: 30,
    middleSeatPrice: 120,
    balconySeats: 10,
    balconySeatPrice: 150,
    amenities: ['Stereo Sound', 'Single Screen Grand Auditorium', 'Concessions Stall'],
    screens: [
      makeScreen('Main Auditorium', 6, 10, 90, 120, 150),
    ],
  },
  {
    name: 'RLR Cinemas',
    city: 'Bhilai',
    address: 'GE Rd, Shastri Nagar, Supela, Bhilai 490023',
    location: {
      address: 'GE Rd, Shastri Nagar, Supela, Bhilai 490023',
      lat: 21.2071,
      lng: 81.3591,
    },
    lowerSeats: 20,
    lowerSeatPrice: 120,
    middleSeats: 30,
    middleSeatPrice: 160,
    balconySeats: 10,
    balconySeatPrice: 220,
    amenities: ['Dolby 7.1', 'Air Conditioned', 'Snack Bar', 'Parking'],
    screens: [
      makeScreen('Screen 1', 6, 10, 120, 160, 220),
      makeScreen('Screen 2', 6, 10, 120, 160, 220),
    ],
  },

  // Durg
  {
    name: 'Tarun LV Cinemas',
    city: 'Durg',
    address: 'Station Road, Guru Nanak Nagar, Durg 491001',
    location: {
      address: 'Station Road, Guru Nanak Nagar, Durg 491001',
      lat: 21.1960,
      lng: 81.2844,
    },
    lowerSeats: 20,
    lowerSeatPrice: 100,
    middleSeats: 30,
    middleSeatPrice: 140,
    balconySeats: 10,
    balconySeatPrice: 200,
    amenities: ['Dolby 7.1 Surround', 'Push-back Seats', 'Refreshments Bar', 'Near Railway Station'],
    screens: [
      makeScreen('Audi 1 - Dolby 7.1', 6, 10, 100, 140, 200),
      makeScreen('Audi 2 - Digital Stereo', 6, 10, 100, 140, 200),
    ],
  },
  {
    name: 'Swaroop Talkies',
    city: 'Durg',
    address: 'Guru Nanak Nagar, Durg 491001',
    location: {
      address: 'Guru Nanak Nagar, Durg 491001',
      lat: 21.1973,
      lng: 81.2876,
    },
    lowerSeats: 20,
    lowerSeatPrice: 60,
    middleSeats: 30,
    middleSeatPrice: 90,
    balconySeats: 10,
    balconySeatPrice: 120,
    amenities: ['Classic Single Screen Cinema', 'Balcony Tier', 'Budget Friendly', 'Snacks'],
    screens: [
      makeScreen('Classic Hall', 6, 10, 60, 90, 120),
    ],
  },
  {
    name: 'K Sera Sera Miniplex',
    city: 'Durg',
    address: 'Mahalaxmi Market, Pulgaon Chowk, Durg 491001',
    location: {
      address: 'Mahalaxmi Market, Pulgaon Chowk, Durg 491001',
      lat: 21.1645,
      lng: 81.2638,
    },
    lowerSeats: 20,
    lowerSeatPrice: 120,
    middleSeats: 30,
    middleSeatPrice: 160,
    balconySeats: 10,
    balconySeatPrice: 220,
    amenities: ['Digital 2K Projection', '7.1 Sound', 'Cozy Miniplex Ambiance', 'Parking'],
    screens: [
      makeScreen('Blue Audi', 6, 10, 120, 160, 220),
      makeScreen('Red Audi', 6, 10, 120, 160, 220),
    ],
  },

  // Raipur
  {
    name: 'PVR Magneto Mall',
    city: 'Raipur',
    address: 'Labhandi, GE Road, Raipur 492001',
    location: {
      address: 'Labhandi, GE Road, Raipur 492001',
      lat: 21.2422,
      lng: 81.6934,
    },
    lowerSeats: 20,
    lowerSeatPrice: 150,
    middleSeats: 30,
    middleSeatPrice: 220,
    balconySeats: 10,
    balconySeatPrice: 350,
    amenities: ['4K Dolby Atmos', 'PVR Cafe', 'Mall Parking', 'Wheelchair Access'],
    screens: [
      makeScreen('Screen 1 Atmos', 6, 10, 150, 220, 350),
      makeScreen('Screen 2 3D', 6, 10, 150, 220, 350),
      makeScreen('Screen 3', 6, 10, 150, 220, 350),
      makeScreen('Screen 4 Recliner', 6, 10, 150, 220, 350),
    ],
  },
  {
    name: 'Inox City Mall 36',
    city: 'Raipur',
    address: 'NH 6, Devendra Nagar, Raipur 492004',
    location: {
      address: 'NH 6, Devendra Nagar, Raipur 492004',
      lat: 21.2635,
      lng: 81.6512,
    },
    lowerSeats: 20,
    lowerSeatPrice: 140,
    middleSeats: 30,
    middleSeatPrice: 200,
    balconySeats: 10,
    balconySeatPrice: 320,
    amenities: ['Inox Insignia', 'Dolby Digital', 'F&B Service', 'Parking'],
    screens: [
      makeScreen('Screen 1', 6, 10, 140, 200, 320),
      makeScreen('Screen 2', 6, 10, 140, 200, 320),
      makeScreen('Screen 3', 6, 10, 140, 200, 320),
    ],
  },

  // Nagpur
  {
    name: 'Cinépolis VR Mall',
    city: 'Nagpur',
    address: 'Medical Square, Nagpur 440009',
    location: {
      address: 'Medical Square, Nagpur 440009',
      lat: 21.1345,
      lng: 79.0984,
    },
    lowerSeats: 20,
    lowerSeatPrice: 160,
    middleSeats: 30,
    middleSeatPrice: 240,
    balconySeats: 10,
    balconySeatPrice: 380,
    amenities: ['RealD 3D', 'Macro XE', 'Coffee Tree', 'Covered Parking'],
    screens: [
      makeScreen('Audi 1 Macro XE', 6, 10, 160, 240, 380),
      makeScreen('Audi 2 3D', 6, 10, 160, 240, 380),
      makeScreen('Audi 3', 6, 10, 160, 240, 380),
      makeScreen('Audi 4 VIP', 6, 10, 160, 240, 380),
    ],
  },
  {
    name: 'PVR Empress City Mall',
    city: 'Nagpur',
    address: 'Empress City, Nagpur 440018',
    location: {
      address: 'Empress City, Nagpur 440018',
      lat: 21.1471,
      lng: 79.0945,
    },
    lowerSeats: 20,
    lowerSeatPrice: 150,
    middleSeats: 30,
    middleSeatPrice: 230,
    balconySeats: 10,
    balconySeatPrice: 360,
    amenities: ['Dolby Atmos', 'Quick Bytes', 'Central Nagpur Mall', 'Parking'],
    screens: [
      makeScreen('Screen 1', 6, 10, 150, 230, 360),
      makeScreen('Screen 2', 6, 10, 150, 230, 360),
      makeScreen('Screen 3', 6, 10, 150, 230, 360),
      makeScreen('Screen 4', 6, 10, 150, 230, 360),
    ],
  },

  // Mumbai
  {
    name: 'PVR ICON Phoenix Palladium',
    city: 'Mumbai',
    address: 'High Street Phoenix, Lower Parel, Mumbai 400013',
    location: {
      address: 'High Street Phoenix, Lower Parel, Mumbai 400013',
      lat: 18.9953,
      lng: 72.8258,
    },
    lowerSeats: 20,
    lowerSeatPrice: 250,
    middleSeats: 30,
    middleSeatPrice: 380,
    balconySeats: 10,
    balconySeatPrice: 600,
    amenities: ['IMAX with Laser', 'Dolby Atmos', 'Gourmet Lounge', 'Valet Parking'],
    screens: [
      makeScreen('Audi 1 - IMAX Laser', 6, 10, 250, 380, 600),
      makeScreen('Audi 2 - 4DX', 6, 10, 250, 380, 600),
      makeScreen('Audi 3 - Atmos', 6, 10, 250, 380, 600),
      makeScreen('Audi 4 - Gold Class', 6, 10, 250, 380, 600),
    ],
  },
  {
    name: 'Inox Megaplex Inorbit Mall',
    city: 'Mumbai',
    address: 'Inorbit Mall, Link Rd, Malad West, Mumbai 400064',
    location: {
      address: 'Inorbit Mall, Link Rd, Malad West, Mumbai 400064',
      lat: 19.1764,
      lng: 72.8347,
    },
    lowerSeats: 20,
    lowerSeatPrice: 220,
    middleSeats: 30,
    middleSeatPrice: 340,
    balconySeats: 10,
    balconySeatPrice: 550,
    amenities: ['ScreenX 270-degree', 'Insignia Lounge', 'Recliner Seating', 'Mall Parking'],
    screens: [
      makeScreen('Screen 1 - ScreenX', 6, 10, 220, 340, 550),
      makeScreen('Screen 2 - Atmos', 6, 10, 220, 340, 550),
      makeScreen('Screen 3 - Insignia', 6, 10, 220, 340, 550),
      makeScreen('Screen 4 - 3D', 6, 10, 220, 340, 550),
    ],
  },
];

const seedDatabase = async () => {
  try {
    console.log('======================================================');
    console.log('Seeding IMovies Database (Bhilai, Live Movies, 7-Day Shows)...');
    console.log('======================================================');

    // Clean existing collections
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Theatre.deleteMany({});
    await Show.deleteMany({});
    await Seat.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Notification.deleteMany({});
    await Favorite.deleteMany({});
    await Review.deleteMany({});
    await City.deleteMany({});

    console.log('Cleaned existing collections.');

    // 1. Seed Supported Cities
    await City.insertMany(citiesData);
    console.log(`Seeded ${citiesData.length} Supported Cities (Default: Bhilai, CG).`);

    // 2. Seed Users (1 Admin, 3 Audience Users)
    const adminUser = await User.create({
      name: 'Admin Director',
      email: 'admin@imovies.com',
      password: 'Admin@123',
      phone: '+91 98271 23456',
      role: 'admin',
      city: 'Bhilai',
      avatar: null,
    });

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'User@123',
      phone: '+91 98271 67890',
      role: 'user',
      city: 'Bhilai',
      avatar: null,
    });

    const user2 = await User.create({
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      password: 'User@123',
      phone: '+91 98271 11223',
      role: 'user',
      city: 'Durg',
      avatar: null,
    });

    const user3 = await User.create({
      name: 'Alex Kumar',
      email: 'alex@example.com',
      password: 'User@123',
      phone: '+91 98271 44556',
      role: 'user',
      city: 'Raipur',
      avatar: null,
    });

    console.log('Seeded 1 Admin (admin@imovies.com) and 3 Audience Users.');

    // 3. Seed Theatres
    const theatresWithAdmin = theatresData.map((t) => ({ ...t, adminId: adminUser._id }));
    const createdTheatres = await Theatre.insertMany(theatresWithAdmin);
    console.log(`Seeded ${createdTheatres.length} Real Theatres across Bhilai, Durg, Raipur, Nagpur, Mumbai.`);

    // 4. Sync Movies (Live TMDB if configured, or curated fallback list)
    console.log('Syncing movie catalog (TMDB / Curated 22 Oct 2026 Fallback)...');
    const syncRes = await syncMovies();
    const movieCount = await Movie.countDocuments();
    console.log(`Movie catalog ready: ${movieCount} movies loaded (Source: ${syncRes.source}).`);

    // 5. Generate Rolling Shows & Seat Maps (2 days for fast testing, 7 days for production/demo)
    const daysAhead = process.env.NODE_ENV === 'test' ? 2 : 7;
    console.log(`Generating ${daysAhead}-day rolling shows across all theatres...`);
    const showGenRes = await generateRollingShows({ daysAhead });
    console.log(`Shows and seat layouts ready: ${showGenRes.createdShowsCount} shows, ${showGenRes.createdSeatsCount} seats generated.`);

    // 6. Create sample bookings, reviews, and favorites for realism
    const sampleShow = await Show.findOne({ status: 'active' }).populate('movie theatre');
    if (sampleShow) {
      const seatsToBook = await Seat.find({ show: sampleShow._id, status: 'available' }).limit(2);
      if (seatsToBook.length === 2) {
        const bookingCode = `IMV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const totalAmount = seatsToBook.reduce((sum, s) => sum + s.price, 0);

        const qrDataUrl = await QRCode.toDataURL(
          JSON.stringify({
            bookingCode,
            showId: sampleShow._id,
            movie: sampleShow.movie.title,
            theatre: sampleShow.theatre.name,
            seats: seatsToBook.map((s) => s.seatNumber),
            totalAmount,
          }),
          { margin: 1, width: 220 }
        );

        const booking = await Booking.create({
          user: user1._id,
          show: sampleShow._id,
          seats: seatsToBook.map((s) => ({
            seatId: s._id,
            seatNumber: s.seatNumber,
            row: s.row,
            tier: s.tier,
            category: s.category,
            price: s.price,
          })),
          totalAmount,
          bookingCode,
          status: 'confirmed',
          qrCode: qrDataUrl,
        });

        const payment = await Payment.create({
          booking: booking._id,
          user: user1._id,
          amount: totalAmount,
          currency: 'INR',
          method: 'UPI',
          gateway: 'simulated',
          gatewayOrderId: `sim_ord_${Date.now()}`,
          gatewayPaymentId: `sim_pay_${Date.now()}`,
          status: 'success',
        });

        booking.payment = payment._id;
        await booking.save();

        for (const seat of seatsToBook) {
          seat.status = 'booked';
          seat.booking = booking._id;
          await seat.save();
        }

        await Notification.create({
          user: user1._id,
          title: 'Booking Confirmed!',
          message: `Your booking for "${sampleShow.movie.title}" (${seatsToBook.map((s) => s.seatNumber).join(', ')}) is confirmed at ${sampleShow.theatre.name}.`,
          type: 'booking',
          isRead: false,
        });

        // Sample favorite
        await Favorite.create({
          user: user1._id,
          movie: sampleShow.movie._id,
        });

        // Sample reviews
        await Review.create({
          user: user1._id,
          movie: sampleShow.movie._id,
          rating: 5,
          comment: 'Spectacular cinema experience! Flawless visuals and earth-shattering sound quality.',
          isApproved: true,
        });

        await Review.create({
          user: user2._id,
          movie: sampleShow.movie._id,
          rating: 4,
          comment: 'Loved the pacing, cinematography and gripping lead performance. Highly recommended in theatres.',
          isApproved: true,
        });

        console.log('Created sample Booking, Payment, Notification, Watchlist, and Reviews.');
      }
    }

    console.log('\n======================================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY (Bhilai / Durg / Raipur)');
    console.log('Default City: Bhilai, Chhattisgarh');
    console.log('Admin: admin@imovies.com / Admin@123');
    console.log('User:  john@example.com / User@123');
    console.log('User:  sarah@example.com / User@123');
    console.log('======================================================\n');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  }
};

// Execute directly if run as a script
if (require.main === module) {
  connectDB()
    .then(async () => {
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to run seed script:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
