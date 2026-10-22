const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring each user can favorite a movie only once
favoriteSchema.index({ user: 1, movie: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
