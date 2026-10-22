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

const moviesData = [
  {
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    language: 'English',
    runtime: 166,
    certification: 'UA',
    releaseDate: new Date('2024-03-01'),
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
    director: 'Denis Villeneuve',
    status: 'now_showing',
    averageRating: 4.8,
    ratingCount: 120,
  },
  {
    title: 'Oppenheimer',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    genres: ['Biography', 'Drama', 'History'],
    language: 'English',
    runtime: 180,
    certification: 'A',
    releaseDate: new Date('2023-07-21'),
    poster: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    director: 'Christopher Nolan',
    status: 'now_showing',
    averageRating: 4.9,
    ratingCount: 340,
  },
  {
    title: 'Interstellar',
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    language: 'English',
    runtime: 169,
    certification: 'UA',
    releaseDate: new Date('2014-11-07'),
    poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    director: 'Christopher Nolan',
    status: 'now_showing',
    averageRating: 4.9,
    ratingCount: 512,
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    genres: ['Animation', 'Action', 'Adventure'],
    language: 'English',
    runtime: 140,
    certification: 'U',
    releaseDate: new Date('2023-06-02'),
    poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
    director: 'Joaquim Dos Santos, Kemp Powers',
    status: 'now_showing',
    averageRating: 4.7,
    ratingCount: 220,
  },
  {
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    genres: ['Action', 'Crime', 'Drama'],
    language: 'English',
    runtime: 152,
    certification: 'UA',
    releaseDate: new Date('2008-07-18'),
    poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine', 'Gary Oldman'],
    director: 'Christopher Nolan',
    status: 'now_showing',
    averageRating: 5.0,
    ratingCount: 680,
  },
  {
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    language: 'English',
    runtime: 148,
    certification: 'UA',
    releaseDate: new Date('2010-07-16'),
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
    director: 'Christopher Nolan',
    status: 'now_showing',
    averageRating: 4.8,
    ratingCount: 410,
  },
  {
    title: 'Gladiator II',
    description: 'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist.',
    genres: ['Action', 'Adventure', 'Drama'],
    language: 'English',
    runtime: 148,
    certification: 'A',
    releaseDate: new Date('2024-11-22'),
    poster: 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
    cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
    director: 'Ridley Scott',
    status: 'now_showing',
    averageRating: 4.6,
    ratingCount: 195,
  },
  {
    title: 'Deadpool & Wolverine',
    description: 'Deadpool is offered a place in the Marvel Cinematic Universe by the Time Variance Authority, but instead recruits a variant of Wolverine to save his universe from extinction.',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    language: 'English',
    runtime: 128,
    certification: 'A',
    releaseDate: new Date('2024-07-26'),
    poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Morena Baccarin'],
    director: 'Shawn Levy',
    status: 'now_showing',
    averageRating: 4.7,
    ratingCount: 310,
  },
  {
    title: 'Kalki 2898 AD',
    description: 'A modern avatar of Vishnu, a Hindu god, who is believed to have descended to the earth to protect the world from evil forces in a futuristic post-apocalyptic setting.',
    genres: ['Action', 'Sci-Fi', 'Mythology'],
    language: 'Hindi',
    runtime: 181,
    certification: 'UA',
    releaseDate: new Date('2024-06-27'),
    poster: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=kQDd1AhGIHk',
    cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone'],
    director: 'Nag Ashwin',
    status: 'now_showing',
    averageRating: 4.5,
    ratingCount: 180,
  },
  {
    title: 'Parasite',
    description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    genres: ['Drama', 'Thriller'],
    language: 'Korean',
    runtime: 132,
    certification: 'A',
    releaseDate: new Date('2019-11-08'),
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=5xH0hhJLEEQ',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik'],
    director: 'Bong Joon Ho',
    status: 'now_showing',
    averageRating: 4.9,
    ratingCount: 450,
  },
  {
    title: 'Avatar: The Way of Water',
    description: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri.',
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    language: 'English',
    runtime: 192,
    certification: 'UA',
    releaseDate: new Date('2022-12-16'),
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Stephen Lang'],
    director: 'James Cameron',
    status: 'now_showing',
    averageRating: 4.4,
    ratingCount: 290,
  },
  {
    title: 'Cyberpunk 2099: Neon City',
    description: 'In a dystopian metropolis ruled by mega-corporations, an underground netrunner uncovers an insidious neural weapon threatening the remaining free human settlements.',
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    language: 'English',
    runtime: 135,
    certification: 'A',
    releaseDate: new Date('2026-12-15'),
    poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=qIcTM8WXFjk',
    cast: ['Keanu Reeves', 'Karl Urban', 'Ana de Armas'],
    director: 'Alex Garland',
    status: 'upcoming',
    averageRating: 0,
    ratingCount: 0,
  },
  {
    title: 'Mission: Impossible – The Final Reckoning',
    description: 'Ethan Hunt and his IMF team embark on their most dangerous mission yet: to track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.',
    genres: ['Action', 'Thriller', 'Adventure'],
    language: 'English',
    runtime: 160,
    certification: 'UA',
    releaseDate: new Date('2026-05-23'),
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=NOhDy4m6bZ4',
    cast: ['Tom Cruise', 'Hayley Atwell', 'Ving Rhames', 'Simon Pegg'],
    director: 'Christopher McQuarrie',
    status: 'upcoming',
    averageRating: 0,
    ratingCount: 0,
  },
];

const theatresData = [
  {
    name: 'PVR ICON Gold Cinemas',
    city: 'Mumbai',
    address: 'High Street Phoenix, Senapati Bapat Marg, Lower Parel',
    location: { address: 'Lower Parel, Mumbai', lat: 18.9953, lng: 72.8258 },
    lowerSeats: 20,
    lowerSeatPrice: 180,
    middleSeats: 30,
    middleSeatPrice: 320,
    balconySeats: 16,
    balconySeatPrice: 520,
    amenities: ['Dolby Atmos', '4K Laser Projection', 'Recliner Lounges', 'Gourmet Menu', 'Valet Parking'],
    screens: [
      {
        name: 'Screen 1 (IMAX Laser)',
        rows: 6,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', tier: 'balcony', category: 'Recliner', seats: 10, basePrice: 520 },
          { row: 'B', tier: 'middle', category: 'Premium', seats: 10, basePrice: 320 },
          { row: 'C', tier: 'middle', category: 'Premium', seats: 10, basePrice: 320 },
          { row: 'D', tier: 'middle', category: 'Premium', seats: 10, basePrice: 320 },
          { row: 'E', tier: 'lower', category: 'Regular', seats: 10, basePrice: 180 },
          { row: 'F', tier: 'lower', category: 'Regular', seats: 10, basePrice: 180 },
        ],
      },
    ],
  },
  {
    name: 'INOX Insignia',
    city: 'Bengaluru',
    address: 'Nexus Mall, 80 Feet Road, Koramangala 4th Block',
    location: { address: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
    lowerSeats: 20,
    lowerSeatPrice: 200,
    middleSeats: 30,
    middleSeatPrice: 350,
    balconySeats: 16,
    balconySeatPrice: 550,
    amenities: ['Insignia Recliners', 'Dolby 7.1 Surround', 'Live Chef Kitchen', 'Wheelchair Access'],
    screens: [
      {
        name: 'Screen 1 (Insignia Lounge)',
        rows: 6,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', tier: 'balcony', category: 'Recliner', seats: 10, basePrice: 550 },
          { row: 'B', tier: 'middle', category: 'Premium', seats: 10, basePrice: 350 },
          { row: 'C', tier: 'middle', category: 'Premium', seats: 10, basePrice: 350 },
          { row: 'D', tier: 'middle', category: 'Premium', seats: 10, basePrice: 350 },
          { row: 'E', tier: 'lower', category: 'Regular', seats: 10, basePrice: 200 },
          { row: 'F', tier: 'lower', category: 'Regular', seats: 10, basePrice: 200 },
        ],
      },
    ],
  },
  {
    name: 'Cinepolis Grand Central',
    city: 'Delhi NCR',
    address: 'Logix City Centre, Sector 32, Noida',
    location: { address: 'Sector 32, Noida, Delhi NCR', lat: 28.5746, lng: 77.3562 },
    lowerSeats: 20,
    lowerSeatPrice: 190,
    middleSeats: 30,
    middleSeatPrice: 340,
    balconySeats: 16,
    balconySeatPrice: 500,
    amenities: ['Macro XE Giant Screen', '4DX Motion Seats', 'Dolby Atmos', 'Cafe Coffee Lounge'],
    screens: [
      {
        name: 'Screen 1 (Macro XE)',
        rows: 6,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', tier: 'balcony', category: 'Recliner', seats: 10, basePrice: 500 },
          { row: 'B', tier: 'middle', category: 'Premium', seats: 10, basePrice: 340 },
          { row: 'C', tier: 'middle', category: 'Premium', seats: 10, basePrice: 340 },
          { row: 'D', tier: 'middle', category: 'Premium', seats: 10, basePrice: 340 },
          { row: 'E', tier: 'lower', category: 'Regular', seats: 10, basePrice: 190 },
          { row: 'F', tier: 'lower', category: 'Regular', seats: 10, basePrice: 190 },
        ],
      },
    ],
  },
  {
    name: 'SPI Cinemas Palazzo',
    city: 'Chennai',
    address: 'The Forum Vijaya Mall, Arcot Road, Vadapalani',
    location: { address: 'Vadapalani, Chennai', lat: 13.0500, lng: 80.2121 },
    lowerSeats: 20,
    lowerSeatPrice: 160,
    middleSeats: 30,
    middleSeatPrice: 280,
    balconySeats: 16,
    balconySeatPrice: 450,
    amenities: ['Dolby Atmos', 'RGB Pure Laser', 'Rhubarb Pastry Bar', 'Wheelchair Friendly'],
    screens: [
      {
        name: 'Screen 1 (Palazzo Grand)',
        rows: 6,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', tier: 'balcony', category: 'Recliner', seats: 10, basePrice: 450 },
          { row: 'B', tier: 'middle', category: 'Premium', seats: 10, basePrice: 280 },
          { row: 'C', tier: 'middle', category: 'Premium', seats: 10, basePrice: 280 },
          { row: 'D', tier: 'middle', category: 'Premium', seats: 10, basePrice: 280 },
          { row: 'E', tier: 'lower', category: 'Regular', seats: 10, basePrice: 160 },
          { row: 'F', tier: 'lower', category: 'Regular', seats: 10, basePrice: 160 },
        ],
      },
    ],
  },
];

const seedDatabase = async () => {
  console.log('Seeding database with production seed dataset...');

  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    Theatre.deleteMany({}),
    Show.deleteMany({}),
    Seat.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
    Favorite.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log('Cleaned existing collections.');

  // 1. Create Admin and 3 Users
  const adminUser = await User.create({
    name: 'Admin Director',
    email: 'admin@imovies.com',
    password: 'Admin@123',
    phone: '+91 9876543210',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  });

  const user1 = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'User@123',
    phone: '+91 9876543211',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  });

  const user2 = await User.create({
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    password: 'User@123',
    phone: '+91 9876543212',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  });

  const user3 = await User.create({
    name: 'Alex Turner',
    email: 'alex@example.com',
    password: 'User@123',
    phone: '+91 9876543213',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
  });
  console.log('Seeded 1 Admin (admin@imovies.com) and 3 Users.');

  // 2. Create 12+ Movies
  const createdMovies = await Movie.insertMany(moviesData);
  console.log(`Seeded ${createdMovies.length} Movies.`);

  // 3. Create 4 Theatres
  const theatresWithAdmin = theatresData.map((t) => ({ ...t, adminId: adminUser._id }));
  const createdTheatres = await Theatre.insertMany(theatresWithAdmin);
  console.log(`Seeded ${createdTheatres.length} Theatres across Mumbai, Bengaluru, Delhi NCR, Chennai.`);

  // 4. Create 30+ Shows across the next 7 days
  const timeSlots = [
    { start: '10:00 AM', end: '12:45 PM' },
    { start: '01:30 PM', end: '04:15 PM' },
    { start: '05:00 PM', end: '07:45 PM' },
    { start: '08:30 PM', end: '11:15 PM' },
  ];

  const getFormattedDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const showsToCreate = [];
  const nowShowingMovies = createdMovies.filter((m) => m.status === 'now_showing');

  for (let day = 0; day < 7; day++) {
    const showDate = getFormattedDate(day);

    for (let tIdx = 0; tIdx < createdTheatres.length; tIdx++) {
      const theatre = createdTheatres[tIdx];
      const screen = theatre.screens[0];

      const movie1 = nowShowingMovies[(tIdx + day) % nowShowingMovies.length];
      const movie2 = nowShowingMovies[(tIdx + day + 2) % nowShowingMovies.length];

      showsToCreate.push({
        movie: movie1._id,
        theatre: theatre._id,
        screen: screen.name,
        showDate,
        showTime: timeSlots[0].start,
        endTime: timeSlots[0].end,
        language: movie1.language,
        format: screen.name.includes('IMAX') ? 'IMAX' : '2D',
        priceMap: {
          lower: theatre.lowerSeatPrice,
          middle: theatre.middleSeatPrice,
          balcony: theatre.balconySeatPrice,
          Regular: theatre.lowerSeatPrice,
          Premium: theatre.middleSeatPrice,
          Recliner: theatre.balconySeatPrice,
        },
        status: 'active',
      });

      showsToCreate.push({
        movie: movie2._id,
        theatre: theatre._id,
        screen: screen.name,
        showDate,
        showTime: timeSlots[1].start,
        endTime: timeSlots[1].end,
        language: movie2.language,
        format: screen.name.includes('IMAX') ? 'IMAX' : '3D',
        priceMap: {
          lower: theatre.lowerSeatPrice,
          middle: theatre.middleSeatPrice,
          balcony: theatre.balconySeatPrice,
          Regular: theatre.lowerSeatPrice,
          Premium: theatre.middleSeatPrice,
          Recliner: theatre.balconySeatPrice,
        },
        status: 'active',
      });

      showsToCreate.push({
        movie: movie1._id,
        theatre: theatre._id,
        screen: screen.name,
        showDate,
        showTime: timeSlots[2].start,
        endTime: timeSlots[2].end,
        language: movie1.language,
        format: '2D',
        priceMap: {
          lower: theatre.lowerSeatPrice,
          middle: theatre.middleSeatPrice,
          balcony: theatre.balconySeatPrice,
          Regular: theatre.lowerSeatPrice,
          Premium: theatre.middleSeatPrice,
          Recliner: theatre.balconySeatPrice,
        },
        status: 'active',
      });
    }
  }

  const createdShows = await Show.insertMany(showsToCreate);
  console.log(`Seeded ${createdShows.length} Shows across 7 days.`);

  // 5. Generate Seats for each Show
  console.log('Generating seats for each show...');
  let totalSeats = 0;

  for (const show of createdShows) {
    const theatre = createdTheatres.find((t) => t._id.toString() === show.theatre.toString());
    const screen = theatre.screens.find((s) => s.name === show.screen) || theatre.screens[0];

    const seatDocs = [];

    for (const rowConfig of screen.seatLayout) {
      const rowLetter = rowConfig.row;
      const count = rowConfig.seats || 10;
      const tier = rowConfig.tier || (rowLetter === 'A' ? 'balcony' : rowLetter === 'F' ? 'lower' : 'middle');
      const category = rowConfig.category || (tier === 'balcony' ? 'Recliner' : tier === 'lower' ? 'Regular' : 'Premium');
      const price = show.priceMap[tier] || show.priceMap[category] || 250;

      for (let num = 1; num <= count; num++) {
        seatDocs.push({
          show: show._id,
          seatNumber: `${rowLetter}${num}`,
          row: rowLetter,
          tier,
          category,
          price,
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
          booking: null,
        });
      }
    }

    const inserted = await Seat.insertMany(seatDocs);
    totalSeats += inserted.length;
  }
  console.log(`Generated ${totalSeats} seats across all shows.`);

  // 6. Create sample bookings and reviews
  const firstShow = createdShows[0];
  const sampleSeats = await Seat.find({ show: firstShow._id }).limit(2);

  await Seat.updateMany(
    { _id: { $in: sampleSeats.map((s) => s._id) } },
    { $set: { status: 'booked' } }
  );

  const bookingCode = 'IMV-102938';
  const totalAmount = sampleSeats.reduce((sum, s) => sum + s.price, 0);

  const qrPayload = JSON.stringify({
    code: bookingCode,
    movie: createdMovies[0].title,
    theatre: createdTheatres[0].name,
    showDate: firstShow.showDate,
    showTime: firstShow.showTime,
    seats: sampleSeats.map((s) => s.seatNumber),
    user: user1.name,
    totalAmount,
  });
  const qrCode = await QRCode.toDataURL(qrPayload);

  const booking = await Booking.create({
    user: user1._id,
    show: firstShow._id,
    seats: sampleSeats.map((s) => ({
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
    qrCode,
    refundStatus: 'none',
  });

  const payment = await Payment.create({
    booking: booking._id,
    user: user1._id,
    amount: totalAmount,
    currency: 'INR',
    method: 'card',
    gateway: 'simulated',
    gatewayOrderId: 'sim_order_' + Date.now(),
    gatewayPaymentId: 'sim_pay_' + Date.now(),
    gatewaySignature: 'sim_sig_verified_sample',
    transactionId: 'TXN-' + Date.now(),
    status: 'success',
  });

  booking.payment = payment._id;
  await booking.save();

  await Seat.updateMany(
    { _id: { $in: sampleSeats.map((s) => s._id) } },
    { $set: { booking: booking._id } }
  );

  // Sample Notifications
  await Notification.create({
    user: user1._id,
    title: 'Booking Confirmed!',
    message: `Your tickets for "${createdMovies[0].title}" (${bookingCode}) have been confirmed.`,
    type: 'booking',
    isRead: false,
  });

  // Sample Favorites
  await Favorite.create({ user: user1._id, movie: createdMovies[0]._id });
  await Favorite.create({ user: user1._id, movie: createdMovies[1]._id });

  // Sample Reviews
  await Review.create({
    user: user1._id,
    movie: createdMovies[0]._id,
    rating: 5,
    comment: 'An absolute masterpiece of cinema! The visuals, sound, and pacing were unbelievable.',
    isApproved: true,
  });

  await Review.create({
    user: user2._id,
    movie: createdMovies[0]._id,
    rating: 5,
    comment: 'Denis Villeneuve has outdone himself. Best IMAX experience ever!',
    isApproved: true,
  });

  await Review.create({
    user: user3._id,
    movie: createdMovies[1]._id,
    rating: 5,
    comment: 'Christopher Nolan crafts pure tension and brilliant drama.',
    isApproved: true,
  });

  console.log('Seeded sample Booking, Payment, Notification, Favorites, and Reviews.');
  console.log('\n======================================================');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY');
  console.log('Admin: admin@imovies.com / Admin@123');
  console.log('User:  john@example.com / User@123');
  console.log('User:  sarah@example.com / User@123');
  console.log('User:  alex@example.com / User@123');
  console.log('======================================================\n');
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('Seed failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = { seedDatabase };
