const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      trim: true,
    },
    genre: {
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
    duration: {
      type: Number, // duration in minutes
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    rating: {
      type: Number,
      default: 8.0,
      min: 0,
      max: 10,
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    poster: {
      type: String,
      required: [true, 'Movie poster URL or file path is required'],
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
    certificate: {
      type: String,
      enum: ['U', 'UA', 'A'],
      default: 'UA',
    },
    status: {
      type: String,
      enum: ['now_showing', 'upcoming'],
      default: 'now_showing',
    },
  },
  { timestamps: true }
);

// Text index for search functionality across title, genre, and language
movieSchema.index(
  { title: 'text', genre: 'text', language: 'text', director: 'text' },
  { language_override: 'none' }
);
movieSchema.index({ status: 1, releaseDate: -1 });

module.exports = mongoose.model('Movie', movieSchema);
