const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      trim: true,
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A movie must have at least one genre',
      },
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    runtime: {
      type: Number, // runtime in minutes
      required: [true, 'Runtime in minutes is required'],
      min: [1, 'Runtime must be at least 1 minute'],
    },
    certification: {
      type: String,
      enum: ['U', 'UA', 'A'],
      default: 'UA',
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    poster: {
      type: String,
      required: [true, 'Movie poster URL is required'],
    },
    backdrop: {
      type: String,
      default: '',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    cast: {
      type: [String],
      default: [],
    },
    director: {
      type: String,
      trim: true,
      default: '',
    },
    tmdbId: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    popularity: {
      type: Number,
      default: 0,
      index: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['now_showing', 'upcoming', 'archived'],
      default: 'now_showing',
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for frontend backwards-compatibility
movieSchema.virtual('genre').get(function () {
  return this.genres;
});
movieSchema.virtual('duration').get(function () {
  return this.runtime;
});
movieSchema.virtual('certificate').get(function () {
  return this.certification;
});
movieSchema.virtual('rating').get(function () {
  return this.averageRating;
});

// Indexes per specifications
movieSchema.index(
  { title: 'text', genres: 'text', language: 'text' },
  { language_override: 'none' }
);
movieSchema.index({ status: 1, releaseDate: -1 });

module.exports = mongoose.model('Movie', movieSchema);
