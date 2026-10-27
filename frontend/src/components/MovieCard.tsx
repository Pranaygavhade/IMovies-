import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { IMovie } from '../types/index.js';
import { getPosterUrl, handleImageError } from '../utils/tmdbImage.js';
import { useAuth } from '../context/AuthContext.js';

interface MovieCardProps {
  movie: IMovie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { user, toggleFavorite } = useAuth();
  
  // Resolve unique ID: prefer MongoDB _id, fallback to tmdbId
  const movieId = movie._id || (movie.tmdbId ? String(movie.tmdbId) : '');
  const isFavorite = movie._id ? user?.favorites?.includes(movie._id) : false;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (movie._id) {
      await toggleFavorite(movie._id);
    }
  };

  const formattedRating = typeof movie.voteAverage === 'number' ? movie.voteAverage.toFixed(1) : '7.5';
  const genresList = Array.isArray(movie.genres) ? movie.genres : [];
  const spokenLanguage = Array.isArray(movie.spokenLanguages) && movie.spokenLanguages.length > 0
    ? movie.spokenLanguages[0]
    : movie.originalLanguage || 'English';

  let releaseYear = '2024';
  if (movie.releaseDate) {
    const parsed = new Date(movie.releaseDate).getFullYear();
    if (!isNaN(parsed)) releaseYear = String(parsed);
  }

  return (
    <Link
      to={`/movies/${movieId || 'not-found'}`}
      className="group flex flex-col bg-cinema-900 border border-cinema-800 hover:border-cinema-700 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-cinema-card"
    >
      {/* Portrait Poster Container with fixed 2/3 Aspect Ratio */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-cinema-850">
        <img
          src={getPosterUrl(movie.posterPath, 'w500')}
          alt={movie.title || 'Movie Poster'}
          onError={(e) => handleImageError(e, 'poster')}
          loading="lazy"
          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-cinema-950/80 backdrop-blur-md border border-white/10 rounded-lg text-amber-400 text-xs font-bold shadow-md">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>{formattedRating}</span>
        </div>

        {/* Favorite Heart Button */}
        {movie._id && (
          <button
            onClick={handleFavoriteClick}
            aria-label="Add to Watchlist"
            className="absolute top-3 right-3 p-2 rounded-lg bg-cinema-950/80 backdrop-blur-md border border-white/10 text-white hover:text-crimson-500 transition shadow-md group/heart cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition ${
                isFavorite ? 'fill-crimson-500 text-crimson-500 scale-110' : 'group-hover/heart:scale-110'
              }`}
            />
          </button>
        )}

        {/* Format Pill (e.g. 2D / IMAX) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-crimson-600/90 text-white font-bold text-[10px] uppercase tracking-wider rounded">
            {movie.status === 'upcoming' ? 'Upcoming' : 'Now Showing'}
          </span>
          <span className="px-2 py-0.5 bg-cinema-900/90 text-cinema-300 font-medium text-[10px] uppercase rounded backdrop-blur-sm">
            {spokenLanguage}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-crimson-400 transition">
            {movie.title}
          </h3>
          <p className="text-xs text-cinema-400 line-clamp-1 mt-1">
            {genresList.slice(0, 2).join(' • ') || 'Feature Film'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-cinema-800/60 mt-1">
          <span className="text-xs text-cinema-400">
            {releaseYear} {movie.runtime ? `• ${movie.runtime}m` : ''}
          </span>
          <span className="text-xs font-semibold text-crimson-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            Book →
          </span>
        </div>
      </div>
    </Link>
  );
};
