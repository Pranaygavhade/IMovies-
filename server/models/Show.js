const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
    },
    screen: {
      type: String,
      required: [true, 'Screen name is required'],
    },
    date: {
      type: String, // format: YYYY-MM-DD
      required: [true, 'Show date (YYYY-MM-DD) is required'],
      index: true,
    },
    startTime: {
      type: String, // e.g. "10:30 AM" or "14:00"
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String, // e.g. "13:15"
      required: [true, 'End time is required'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      default: 'English',
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX', '4DX'],
      default: '2D',
    },
    priceMap: {
      Regular: { type: Number, default: 200 },
      Premium: { type: Number, default: 350 },
      Recliner: { type: Number, default: 500 },
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Compound index for finding shows by movie, theatre, date
showSchema.index({ movie: 1, date: 1, theatre: 1 });
showSchema.index({ theatre: 1, screen: 1, date: 1 });

module.exports = mongoose.model('Show', showSchema);
