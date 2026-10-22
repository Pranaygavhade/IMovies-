const Theatre = require('../models/Theatre');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const { getNextNDaysKolkata, computeEndTime } = require('../utils/dateUtils');
const logger = require('../config/logger');

// Standard show time schedules by venue screen capacity
const MULTIPLEX_SLOTS = ['10:00', '13:15', '16:30', '19:45', '22:45'];
const TWIN_SCREEN_SLOTS_A = ['10:30', '14:00', '17:30', '21:00'];
const TWIN_SCREEN_SLOTS_B = ['11:30', '15:00', '18:30', '22:00'];
const SINGLE_SCREEN_SLOTS = ['12:00', '15:30', '19:00', '22:15'];

/**
 * Generate standard seat layout if a screen does not have one
 */
const getDefaultSeatLayout = () => {
  return [
    { row: 'A', tier: 'balcony', category: 'Recliner', seats: 10, basePrice: 350 },
    { row: 'B', tier: 'middle', category: 'Premium', seats: 10, basePrice: 220 },
    { row: 'C', tier: 'middle', category: 'Premium', seats: 10, basePrice: 220 },
    { row: 'D', tier: 'middle', category: 'Premium', seats: 10, basePrice: 220 },
    { row: 'E', tier: 'lower', category: 'Regular', seats: 10, basePrice: 130 },
    { row: 'F', tier: 'lower', category: 'Regular', seats: 10, basePrice: 130 },
  ];
};

/**
 * Generates rolling shows for the NEXT N DAYS (default 7) for all now_showing movies
 * across all registered cinema halls with zero collision and atomic seat creation.
 */
const generateRollingShows = async ({ daysAhead = (process.env.NODE_ENV === 'test' ? 2 : 7) } = {}) => {
  logger.info(`[ShowGenerator] Starting rolling show schedule generator for next ${daysAhead} days...`);

  // 1. Fetch now_showing movies sorted by popularity
  const movies = await Movie.find({ status: 'now_showing' }).sort({ popularity: -1 });
  if (movies.length === 0) {
    logger.warn('[ShowGenerator] No now_showing movies found. Please sync movies first.');
    return { createdShowsCount: 0, createdSeatsCount: 0, message: 'No now_showing movies found' };
  }

  // 2. Fetch theatres
  const theatres = await Theatre.find({});
  if (theatres.length === 0) {
    logger.warn('[ShowGenerator] No theatres found.');
    return { createdShowsCount: 0, createdSeatsCount: 0, message: 'No theatres found' };
  }

  const targetDates = getNextNDaysKolkata(daysAhead);
  let createdShowsCount = 0;
  let createdSeatsCount = 0;
  const allSeatDocs = [];

  // Pre-fetch all existing shows for targetDates to avoid thousands of individual round-trips
  const existingShows = await Show.find({
    theatre: { $in: theatres.map((t) => t._id) },
    showDate: { $in: targetDates },
  }).select('theatre screen showDate showTime').lean();

  const existingKeySet = new Set(
    existingShows.map((s) => `${s.theatre.toString()}_${s.screen}_${s.showDate}_${s.showTime}`)
  );

  for (const theatre of theatres) {
    const screens = theatre.screens && theatre.screens.length > 0 ? theatre.screens : [{ name: 'Screen 1', rows: 6, seatsPerRow: 10, seatLayout: getDefaultSeatLayout() }];

    for (let screenIdx = 0; screenIdx < screens.length; screenIdx++) {
      const screen = screens[screenIdx];
      const screenLayout = screen.seatLayout && screen.seatLayout.length > 0 ? screen.seatLayout : getDefaultSeatLayout();

      // Determine time slots based on theatre screen scale
      let timeSlots;
      if (screens.length >= 3) {
        timeSlots = MULTIPLEX_SLOTS;
      } else if (screens.length === 2) {
        timeSlots = screenIdx === 0 ? TWIN_SCREEN_SLOTS_A : TWIN_SCREEN_SLOTS_B;
      } else {
        timeSlots = SINGLE_SCREEN_SLOTS;
      }

      for (const showDate of targetDates) {
        for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
          const showTime = timeSlots[slotIdx];

          const showKey = `${theatre._id.toString()}_${screen.name}_${showDate}_${showTime}`;
          // DO NOT TOUCH EXISTING SHOWS (Preserve all user bookings!)
          if (existingKeySet.has(showKey)) {
            continue;
          }

          // Pick a movie: rotate through movies, giving top popular movies higher distribution
          const movieIndex = (slotIdx + screenIdx + targetDates.indexOf(showDate)) % movies.length;
          const movie = movies[movieIndex];

          // Screen format
          let format = '2D';
          const screenLower = screen.name.toLowerCase();
          if (screenLower.includes('imax')) {
            format = 'IMAX';
          } else if (screenLower.includes('3d')) {
            format = '3D';
          } else if (screenLower.includes('4dx')) {
            format = '4DX';
          }

          // End time calculation: runtime + 15 min cleaning
          const endTime = computeEndTime(showTime, movie.runtime, 15);

          // Pricing based on theatre defaults
          const lowerPrice = theatre.lowerSeatPrice || 110;
          const middlePrice = theatre.middleSeatPrice || 160;
          const balconyPrice = theatre.balconySeatPrice || 250;

          const priceMap = {
            lower: lowerPrice,
            middle: middlePrice,
            balcony: balconyPrice,
            Regular: lowerPrice,
            Premium: middlePrice,
            Recliner: balconyPrice,
          };

          // Create Show
          const newShow = await Show.create({
            movie: movie._id,
            theatre: theatre._id,
            screen: screen.name,
            showDate,
            showTime,
            endTime,
            language: movie.language || 'Hindi',
            format,
            priceMap,
            status: 'active',
          });

          createdShowsCount++;

          // Generate Seats for the new show
          const seatDocs = [];
          for (const rowConfig of screenLayout) {
            const rowLetter = rowConfig.row;
            const count = rowConfig.seats || 10;
            const tier = rowConfig.tier || (rowLetter === 'A' ? 'balcony' : rowLetter === 'F' ? 'lower' : 'middle');
            const category = rowConfig.category || (tier === 'balcony' ? 'Recliner' : tier === 'lower' ? 'Regular' : 'Premium');
            const price = priceMap[tier] || priceMap[category] || middlePrice;

            for (let num = 1; num <= count; num++) {
              seatDocs.push({
                show: newShow._id,
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

          if (seatDocs.length > 0) {
            allSeatDocs.push(...seatDocs);
          }
        }
      }
    }
  }

  // Bulk-insert all generated seats in high-performance chunks
  if (allSeatDocs.length > 0) {
    const CHUNK_SIZE = 5000;
    for (let i = 0; i < allSeatDocs.length; i += CHUNK_SIZE) {
      const chunk = allSeatDocs.slice(i, i + CHUNK_SIZE);
      await Seat.insertMany(chunk, { ordered: false });
    }
    createdSeatsCount = allSeatDocs.length;
  }

  logger.info(`[ShowGenerator] Completed: Created ${createdShowsCount} new shows with ${createdSeatsCount} seats across ${targetDates.length} days.`);
  return {
    createdShowsCount,
    createdSeatsCount,
    datesCovered: targetDates,
    message: `Scheduled ${createdShowsCount} shows across the next ${daysAhead} days`,
  };
};

module.exports = {
  generateRollingShows,
};
