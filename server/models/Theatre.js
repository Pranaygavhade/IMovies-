const mongoose = require('mongoose');

const screenLayoutSchema = new mongoose.Schema({
  row: { type: String, required: true },
  tier: {
    type: String,
    enum: ['lower', 'middle', 'balcony'],
    default: 'middle',
  },
  category: {
    type: String,
    enum: ['lower', 'middle', 'balcony', 'Regular', 'Premium', 'Recliner'],
    default: 'middle',
  },
  seats: { type: Number, required: true },
  basePrice: { type: Number, required: true },
});

const screenSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Screen 1 - 4K Atmos", "Audi 2 IMAX"
  rows: { type: Number, required: true },
  seatsPerRow: { type: Number, required: true },
  seatLayout: [screenLayoutSchema],
});

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    location: {
      address: { type: String, default: '' },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    screens: [screenSchema],
    // Seat tiers with default counts and prices per theatre specifications
    lowerSeats: {
      type: Number,
      default: 30,
    },
    lowerSeatPrice: {
      type: Number,
      default: 150,
    },
    middleSeats: {
      type: Number,
      default: 50,
    },
    middleSeatPrice: {
      type: Number,
      default: 250,
    },
    balconySeats: {
      type: Number,
      default: 20,
    },
    balconySeatPrice: {
      type: Number,
      default: 400,
    },
    amenities: {
      type: [String],
      default: ['Dolby Atmos', '4K Laser Projection', 'Recliner Seats', 'F&B Service', 'Wheelchair Access', 'Parking'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

theatreSchema.index({ city: 1, name: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);
