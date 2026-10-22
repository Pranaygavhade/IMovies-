const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isApproved: {
      type: Boolean,
      default: true, // Default approved or moderateable
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring each user can review a movie only once
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

// Static method to recalculate and update averageRating and ratingCount for a movie
reviewSchema.statics.recalculateMovieRating = async function (movieId) {
  const Movie = mongoose.model('Movie');
  const stats = await this.aggregate([
    {
      $match: {
        movie: new mongoose.Types.ObjectId(movieId),
        isApproved: true,
      },
    },
    {
      $group: {
        _id: '$movie',
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(movieId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      ratingCount: stats[0].ratingCount,
    });
  } else {
    await Movie.findByIdAndUpdate(movieId, {
      averageRating: 0,
      ratingCount: 0,
    });
  }
};

// Recalculate rating after save and remove
reviewSchema.post('save', async function () {
  await this.constructor.recalculateMovieRating(this.movie);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.recalculateMovieRating(doc.movie);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
