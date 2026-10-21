require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

const moviesData = [
  {
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    genre: ['Sci-Fi', 'Adventure', 'Action'],
    language: 'English',
    duration: 166,
    rating: 8.8,
    releaseDate: new Date('2024-03-01'),
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
    director: 'Denis Villeneuve',
    certificate: 'UA',
    status: 'now_showing',
  },
  {
    title: 'Oppenheimer',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    genre: ['Biography', 'Drama', 'History'],
    language: 'English',
    duration: 180,
    rating: 8.9,
    releaseDate: new Date('2023-07-21'),
    poster: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    director: 'Christopher Nolan',
    certificate: 'A',
    status: 'now_showing',
  },
  {
    title: 'Interstellar',
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    genre: ['Sci-Fi', 'Drama', 'Adventure'],
    language: 'English',
    duration: 169,
    rating: 8.7,
    releaseDate: new Date('2014-11-07'),
    poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    director: 'Christopher Nolan',
    certificate: 'UA',
    status: 'now_showing',
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When heroes clash on handling a new threat, Miles must redefine what it means to be a hero.',
    genre: ['Animation', 'Action', 'Adventure'],
    language: 'English',
    duration: 140,
    rating: 8.7,
    releaseDate: new Date('2023-06-02'),
    poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
    director: 'Joaquim Dos Santos, Kemp Powers',
    certificate: 'U',
    status: 'now_showing',
  },
  {
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    genre: ['Action', 'Crime', 'Drama'],
    language: 'English',
    duration: 152,
    rating: 9.0,
    releaseDate: new Date('2008-07-18'),
    poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine', 'Gary Oldman'],
    director: 'Christopher Nolan',
    certificate: 'UA',
    status: 'now_showing',
  },
  {
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    language: 'English',
    duration: 148,
    rating: 8.8,
    releaseDate: new Date('2010-07-16'),
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
    director: 'Christopher Nolan',
    certificate: 'UA',
    status: 'now_showing',
  },
  {
    title: 'Deadpool & Wolverine',
    description: 'Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool. They team up to defeat a common enemy in an irreverent multiverse adventure.',
    genre: ['Action', 'Comedy', 'Sci-Fi'],
    language: 'English',
    duration: 128,
    rating: 8.3,
    releaseDate: new Date('2024-07-26'),
    poster: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen'],
    director: 'Shawn Levy',
    certificate: 'A',
    status: 'now_showing',
  },
  {
    title: 'Gladiator II',
    description: 'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum after the powerful emperors of Rome conquer his home.',
    genre: ['Action', 'Adventure', 'Drama'],
    language: 'English',
    duration: 145,
    rating: 8.2,
    releaseDate: new Date('2024-11-15'),
    poster: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
    cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
    director: 'Ridley Scott',
    certificate: 'A',
    status: 'upcoming',
  },
  {
    title: 'Avengers: Endgame',
    description: 'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos actions.',
    genre: ['Action', 'Sci-Fi', 'Adventure'],
    language: 'English',
    duration: 181,
    rating: 8.4,
    releaseDate: new Date('2019-04-26'),
    poster: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo', 'Chris Hemsworth', 'Scarlett Johansson'],
    director: 'Anthony Russo, Joe Russo',
    certificate: 'UA',
    status: 'now_showing',
  },
  {
    title: 'Blade Runner 2049',
    description: 'Young Blade Runner K unearths a long-buried secret that has the potential to plunge what is left of society into chaos. His discovery leads him on a quest to find Rick Deckard.',
    genre: ['Sci-Fi', 'Mystery', 'Thriller'],
    language: 'English',
    duration: 164,
    rating: 8.0,
    releaseDate: new Date('2017-10-06'),
    poster: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=gCcx85zbxz4',
    cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas', 'Sylvia Hoeks'],
    director: 'Denis Villeneuve',
    certificate: 'A',
    status: 'now_showing',
  },
  {
    title: 'Top Gun: Maverick',
    description: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN elite graduates on a mission.',
    genre: ['Action', 'Drama'],
    language: 'English',
    duration: 130,
    rating: 8.3,
    releaseDate: new Date('2022-05-27'),
    poster: 'https://images.unsplash.com/photo-1519074069444-1ba4eae16e60?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=qSqVVhua500',
    cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly', 'Jon Hamm'],
    director: 'Joseph Kosinski',
    certificate: 'UA',
    status: 'now_showing',
  },
  {
    title: 'Parasite',
    description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    genre: ['Drama', 'Thriller'],
    language: 'Korean',
    duration: 132,
    rating: 8.5,
    releaseDate: new Date('2019-11-08'),
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=5xH0hhJLEEQ',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik'],
    director: 'Bong Joon Ho',
    certificate: 'A',
    status: 'now_showing',
  },
  {
    title: 'Avatar: The Way of Water',
    description: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri.',
    genre: ['Sci-Fi', 'Action', 'Adventure'],
    language: 'English',
    duration: 192,
    rating: 7.6,
    releaseDate: new Date('2022-12-16'),
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Stephen Lang'],
    director: 'James Cameron',
    certificate: 'UA',
    status: 'now_showing',
  },
  {
    title: 'Cyberpunk 2099: Neon City',
    description: 'In a dystopian metropolis ruled by mega-corporations, an enhanced underground hacker uncovers a cybernetic conspiracy capable of wiping human consciousness.',
    genre: ['Sci-Fi', 'Action', 'Thriller'],
    language: 'English',
    duration: 135,
    rating: 8.1,
    releaseDate: new Date('2025-01-10'),
    poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    backdrop: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=qIcTM8WXFjk',
    cast: ['Keanu Reeves', 'Karl Urban', 'Ana de Armas'],
    director: 'Alex Garland',
    certificate: 'A',
    status: 'upcoming',
  },
];

const theatresData = [
  {
    name: 'PVR ICON Gold Cinemas',
    city: 'Mumbai',
    address: 'High Street Phoenix, Senapati Bapat Marg, Lower Parel',
    location: { lat: 18.9953, lng: 72.8258 },
    amenities: ['Dolby Atmos', '4K Laser Projection', 'Recliner Lounges', 'Gourmet Menu', 'Valet Parking'],
    screens: [
      {
        name: 'Screen 1 (IMAX Laser)',
        rows: 7,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', category: 'Recliner', seats: 10, basePrice: 550 },
          { row: 'B', category: 'Recliner', seats: 10, basePrice: 550 },
          { row: 'C', category: 'Premium', seats: 10, basePrice: 380 },
          { row: 'D', category: 'Premium', seats: 10, basePrice: 380 },
          { row: 'E', category: 'Premium', seats: 10, basePrice: 380 },
          { row: 'F', category: 'Regular', seats: 10, basePrice: 240 },
          { row: 'G', category: 'Regular', seats: 10, basePrice: 240 },
        ],
      },
      {
        name: 'Screen 2 (Dolby Atmos)',
        rows: 6,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', category: 'Recliner', seats: 10, basePrice: 500 },
          { row: 'B', category: 'Premium', seats: 10, basePrice: 350 },
          { row: 'C', category: 'Premium', seats: 10, basePrice: 350 },
          { row: 'D', category: 'Regular', seats: 10, basePrice: 220 },
          { row: 'E', category: 'Regular', seats: 10, basePrice: 220 },
          { row: 'F', category: 'Regular', seats: 10, basePrice: 220 },
        ],
      },
    ],
  },
  {
    name: 'INOX Insignia',
    city: 'Bengaluru',
    address: 'Nexus Mall, 80 Feet Road, Koramangala 4th Block',
    location: { lat: 12.9352, lng: 77.6245 },
    amenities: ['Insignia Recliners', 'Dolby 7.1 Surround', 'Live Chef Kitchen', 'Wheelchair Access'],
    screens: [
      {
        name: 'Screen 1 (Insignia Recliner)',
        rows: 6,
        seatsPerRow: 8,
        seatLayout: [
          { row: 'A', category: 'Recliner', seats: 8, basePrice: 600 },
          { row: 'B', category: 'Recliner', seats: 8, basePrice: 600 },
          { row: 'C', category: 'Premium', seats: 8, basePrice: 420 },
          { row: 'D', category: 'Premium', seats: 8, basePrice: 420 },
          { row: 'E', category: 'Regular', seats: 8, basePrice: 280 },
          { row: 'F', category: 'Regular', seats: 8, basePrice: 280 },
        ],
      },
      {
        name: 'Screen 2 (Laser 4K)',
        rows: 7,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', category: 'Recliner', seats: 10, basePrice: 520 },
          { row: 'B', category: 'Premium', seats: 10, basePrice: 360 },
          { row: 'C', category: 'Premium', seats: 10, basePrice: 360 },
          { row: 'D', category: 'Premium', seats: 10, basePrice: 360 },
          { row: 'E', category: 'Regular', seats: 10, basePrice: 230 },
          { row: 'F', category: 'Regular', seats: 10, basePrice: 230 },
          { row: 'G', category: 'Regular', seats: 10, basePrice: 230 },
        ],
      },
    ],
  },
  {
    name: 'Cinepolis Grand Central',
    city: 'Delhi NCR',
    address: 'Logix City Centre, Sector 32, Noida',
    location: { lat: 28.5746, lng: 77.3562 },
    amenities: ['Macro XE Giant Screen', '4DX Motion Seats', 'Dolby Atmos', 'Cafe Coffee Lounge'],
    screens: [
      {
        name: 'Screen 1 (Macro XE)',
        rows: 7,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', category: 'Recliner', seats: 10, basePrice: 540 },
          { row: 'B', category: 'Recliner', seats: 10, basePrice: 540 },
          { row: 'C', category: 'Premium', seats: 10, basePrice: 380 },
          { row: 'D', category: 'Premium', seats: 10, basePrice: 380 },
          { row: 'E', category: 'Regular', seats: 10, basePrice: 250 },
          { row: 'F', category: 'Regular', seats: 10, basePrice: 250 },
          { row: 'G', category: 'Regular', seats: 10, basePrice: 250 },
        ],
      },
      {
        name: 'Screen 2 (4DX)',
        rows: 5,
        seatsPerRow: 8,
        seatLayout: [
          { row: 'A', category: 'Recliner', seats: 8, basePrice: 580 },
          { row: 'B', category: 'Premium', seats: 8, basePrice: 400 },
          { row: 'C', category: 'Premium', seats: 8, basePrice: 400 },
          { row: 'D', category: 'Regular', seats: 8, basePrice: 290 },
          { row: 'E', category: 'Regular', seats: 8, basePrice: 290 },
        ],
      },
    ],
  },
  {
    name: 'SPI Cinemas Palazzo',
    city: 'Chennai',
    address: 'The Forum Vijaya Mall, Arcot Road, Vadapalani',
    location: { lat: 13.0500, lng: 80.2121 },
    amenities: ['Dolby Atmos', 'RGB Pure Laser', 'Rhubarb Pastry Bar', 'Wheelchair Friendly'],
    screens: [
      {
        name: 'Screen 1 (Palazzo Grand)',
        rows: 7,
        seatsPerRow: 10,
        seatLayout: [
          { row: 'A', category: 'Recliner', seats: 10, basePrice: 480 },
          { row: 'B', category: 'Recliner', seats: 10, basePrice: 480 },
          { row: 'C', category: 'Premium', seats: 10, basePrice: 320 },
          { row: 'D', category: 'Premium', seats: 10, basePrice: 320 },
          { row: 'E', category: 'Regular', seats: 10, basePrice: 200 },
          { row: 'F', category: 'Regular', seats: 10, basePrice: 200 },
          { row: 'G', category: 'Regular', seats: 10, basePrice: 200 },
        ],
      },
    ],
  },
];

const seedDatabase = async () => {
  console.log('Seeding database with fresh data...');

  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    Theatre.deleteMany({}),
    Show.deleteMany({}),
    Seat.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('Cleared existing collections.');

  // 1. Create Admin and Users
  const adminUser = await User.create({
    name: 'Admin Director',
    email: 'admin@imovies.com',
    password: 'Admin@123',
    phone: '+1 555-0199',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  });

  const user1 = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'User@123',
    phone: '+1 555-0101',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  });

  const user2 = await User.create({
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    password: 'User@123',
    phone: '+1 555-0102',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  });

  const user3 = await User.create({
    name: 'Alex Turner',
    email: 'alex@example.com',
    password: 'User@123',
    phone: '+1 555-0103',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
  });

  console.log('Created 1 Admin and 3 Users.');

  // 2. Create Movies
  const createdMovies = await Movie.insertMany(moviesData);
  console.log(`Created ${createdMovies.length} Movies.`);

  // 3. Create Theatres
  const createdTheatres = await Theatre.insertMany(theatresData);
  console.log(`Created ${createdTheatres.length} Theatres.`);

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
        date: showDate,
        startTime: timeSlots[0].start,
        endTime: timeSlots[0].end,
        language: movie1.language,
        format: screen.name.includes('IMAX') ? 'IMAX' : '2D',
        priceMap: {
          Regular: 220,
          Premium: 350,
          Recliner: 520,
        },
        status: 'active',
      });

      showsToCreate.push({
        movie: movie2._id,
        theatre: theatre._id,
        screen: screen.name,
        date: showDate,
        startTime: timeSlots[1].start,
        endTime: timeSlots[1].end,
        language: movie2.language,
        format: screen.name.includes('IMAX') ? 'IMAX' : '3D',
        priceMap: {
          Regular: 240,
          Premium: 380,
          Recliner: 550,
        },
        status: 'active',
      });

      showsToCreate.push({
        movie: movie1._id,
        theatre: theatre._id,
        screen: screen.name,
        date: showDate,
        startTime: timeSlots[2].start,
        endTime: timeSlots[2].end,
        language: movie1.language,
        format: '2D',
        priceMap: {
          Regular: 250,
          Premium: 400,
          Recliner: 580,
        },
        status: 'active',
      });
    }
  }

  const createdShows = await Show.insertMany(showsToCreate);
  console.log(`Created ${createdShows.length} Shows across 7 days.`);

  // 5. Generate Seats for each Show
  console.log('Generating cinema seat layouts for all shows...');
  let totalSeatsCount = 0;

  for (const show of createdShows) {
    const theatre = createdTheatres.find((t) => t._id.toString() === show.theatre.toString());
    const screen = theatre.screens.find((s) => s.name === show.screen) || theatre.screens[0];

    const seatDocs = [];

    for (const rowConfig of screen.seatLayout) {
      const rowLetter = rowConfig.row;
      const count = rowConfig.seats || 10;
      const category = rowConfig.category;
      const price = show.priceMap[category] || rowConfig.basePrice || 250;

      for (let num = 1; num <= count; num++) {
        seatDocs.push({
          show: show._id,
          seatNumber: `${rowLetter}${num}`,
          row: rowLetter,
          category,
          price,
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
          bookingId: null,
        });
      }
    }

    const insertedSeats = await Seat.insertMany(seatDocs);
    totalSeatsCount += insertedSeats.length;
  }
  console.log(`Generated ${totalSeatsCount} total seats.`);

  // 6. Create sample bookings & payments for user1
  const sampleShow = createdShows[0];
  const sampleSeats = await Seat.find({ show: sampleShow._id }).limit(2);

  await Seat.updateMany(
    { _id: { $in: sampleSeats.map((s) => s._id) } },
    { $set: { status: 'booked' } }
  );

  const bookingCode = 'IMV-' + Math.floor(100000 + Math.random() * 900000);
  const totalAmt = sampleSeats.reduce((acc, s) => acc + s.price, 0);

  const sampleBooking = await Booking.create({
    user: user1._id,
    show: sampleShow._id,
    seats: sampleSeats.map((s) => ({
      seatId: s._id,
      seatNumber: s.seatNumber,
      row: s.row,
      category: s.category,
      price: s.price,
    })),
    totalAmount: totalAmt,
    status: 'confirmed',
    bookingCode,
    qrData: `IMOVIES-BOOKING:${bookingCode}:USER:${user1.name}:SHOW:${sampleShow._id}`,
    cancelledAt: null,
    refundStatus: 'none',
  });

  const samplePayment = await Payment.create({
    booking: sampleBooking._id,
    user: user1._id,
    amount: totalAmt,
    method: 'card',
    transactionId: 'TXN-' + Date.now(),
    status: 'success',
    gatewayResponse: { simulator: true, authCode: 'AUTH-9988' },
  });

  sampleBooking.payment = samplePayment._id;
  await sampleBooking.save();

  await Notification.create({
    user: user1._id,
    title: 'Booking Confirmed!',
    message: `Your booking ${bookingCode} for ${moviesData[0].title} is confirmed. Enjoy the show!`,
    type: 'booking',
    isRead: false,
  });

  console.log('Seeded sample booking, payment, and notification.');
  console.log('\n--- SEED COMPLETE ---');
  console.log('Admin Credentials: admin@imovies.com / Admin@123');
  console.log('User Credentials:  john@example.com / User@123');
  console.log('---------------------\n');
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
