const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true,
    },
    screen: {
      type: String,
      required: [true, 'Screen name is required'],
    },
    showDate: {
      type: String, // format: YYYY-MM-DD
      required: [true, 'Show date (YYYY-MM-DD) is required'],
      index: true,
    },
    showTime: {
      type: String, // e.g. "10:30 AM" or "14:00"
      required: [true, 'Show start time is required'],
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
      lower: { type: Number, default: 150 },
      middle: { type: Number, default: 250 },
      balcony: { type: Number, default: 400 },
      // Aliases for layout compatibility
      Regular: { type: Number, default: 150 },
      Premium: { type: Number, default: 250 },
      Recliner: { type: Number, default: 400 },
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for frontend compatibility
showSchema.virtual('date').get(function () {
  return this.showDate;
});
showSchema.virtual('startTime').get(function () {
  return this.showTime;
});

// Indexes per specification
showSchema.index(
  { theatre: 1, screen: 1, showDate: 1, showTime: 1 },
  { unique: true }
);
showSchema.index({ movie: 1, showDate: 1 });
showSchema.index({ theatre: 1, showDate: 1 });

module.exports = mongoose.model('Show', showSchema);
