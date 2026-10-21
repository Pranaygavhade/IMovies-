const mongoose = require('mongoose');

const screenLayoutSchema = new mongoose.Schema({
  row: { type: String, required: true },
  category: {
    type: String,
    enum: ['Regular', 'Premium', 'Recliner'],
    default: 'Regular',
  },
  seats: { type: Number, required: true },
  basePrice: { type: Number, required: true },
});

const screenSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Screen 1 - Atmos", "Audi 2 IMAX"
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
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    screens: [screenSchema],
    amenities: {
      type: [String],
      default: ['Dolby Atmos', '4K Laser Projection', 'Recliner Seats', 'F&B Service', 'Wheelchair Access'],
    },
  },
  { timestamps: true }
);

theatreSchema.index({ city: 1, name: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);
