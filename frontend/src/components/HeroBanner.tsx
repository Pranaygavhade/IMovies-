import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Calendar, Ticket, ChevronLeft, ChevronRight, Film, Sparkles } from 'lucide-react';
import { IMovie } from '../types/index.js';
import { getBackdropUrl, handleImageError } from '../utils/tmdbImage.js';

interface HeroBannerProps {
  movies: IMovie[];
  isLoading?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movies, isLoading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isHoveredRef = useRef(false);

  // Preload adjacent next hero image for instant transitions
  useEffect(() => {
    if (movies && movies.length > 1) {
      const nextIdx = (currentIndex + 1) % movies.length;
      const nextMovie = movies[nextIdx];
      if (nextMovie?.backdropPath) {
        const img = new Image();
        img.src = getBackdropUrl(nextMovie.backdropPath, 'w1280');
      }
    }
  }, [currentIndex, movies]);

  // Autoplay carousel every 6.5s unless hovered
  useEffect(() => {
    if (!movies || movies.length <= 1) return;

    const timer = setInterval(() => {
      if (!isHoveredRef.current) {
        setCurrentIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
        setIsImageLoaded(false);
      }
    }, 6500);

    return () => clearInterval(timer);
  }, [movies?.length]);

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[420px] max-h-[580px] rounded-3xl overflow-hidden bg-cinema-900 border border-cinema-800 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-14 space-y-4 max-w-xl">
          <div className="flex gap-2">
            <div className="w-20 h-6 bg-cinema-800 rounded-full" />
            <div className="w-16 h-6 bg-cinema-800 rounded-full" />
          </div>
          <div className="w-3/4 h-10 bg-cinema-800 rounded-xl" />
          <div className="w-full h-12 bg-cinema-800/60 rounded-xl" />
          <div className="w-36 h-12 bg-crimson-900/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  // 2. Fallback when no movies are available
  if (!movies || movies.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[420px] max-h-[580px] rounded-3xl overflow-hidden border border-cinema-800 shadow-2xl bg-gradient-to-r from-cinema-950 via-cinema-900 to-cinema-950 flex flex-col justify-center p-8 sm:p-14">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-crimson-600/20 border border-crimson-600/40 text-crimson-400 text-xs font-bold rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            iMovies Experience
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Cinema at Its Absolute Peak
          </h1>
          <p className="text-sm sm:text-base text-cinema-300 max-w-lg leading-relaxed">
            Discover trending releases, locate nearby multiplexes, and book your ideal seats in real time.
          </p>
          <div className="pt-2">
            <Link
              to="/movies"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-2xl transition shadow-glow-crimson text-sm"
            >
              <Film className="w-4 h-4" />
              Explore All Movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentMovie = movies[currentIndex] || movies[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsImageLoaded(false);
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsImageLoaded(false);
    setCurrentIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
  };

  const backdropUrl = getBackdropUrl(currentMovie.backdropPath, 'w1280');

  return (
    <div
      className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[450px] max-h-[580px] rounded-3xl overflow-hidden border border-cinema-800 shadow-2xl group select-none bg-cinema-900"
      onMouseEnter={() => (isHoveredRef.current = true)}
      onMouseLeave={() => (isHoveredRef.current = false)}
    >
      {/* Landscape Backdrop Image with optimized w1280 resolution & smooth fade */}
      <img
        key={currentMovie._id || currentMovie.tmdbId}
        src={backdropUrl}
        alt={currentMovie.title}
        fetchPriority="high"
        loading="eager"
        onLoad={() => setIsImageLoaded(true)}
        onError={(e) => {
          handleImageError(e, 'backdrop');
          setIsImageLoaded(true);
        }}
        className={`absolute inset-0 w-full h-full object-cover object-center transform transition-all duration-700 ease-out ${
          isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-102'
        } group-hover:scale-105`}
      />

      {/* Cinematic Non-Destructive Overlays: Keeps artwork vivid while protecting text */}
      {/* 1. Bottom-up gradient for controls and text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/50 to-transparent pointer-events-none" />
      {/* 2. Left-to-right subtle vignette behind text */}
      <div className="absolute inset-0 bg-gradient-to-r from-cinema-950/95 via-cinema-950/40 to-transparent w-full sm:w-3/4 pointer-events-none" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-14 max-w-3xl z-10">
        {/* Rating and Genre Pills */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-xs font-bold backdrop-blur-md">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{(currentMovie.voteAverage || 7.5).toFixed(1)}</span>
            <span className="text-[10px] text-amber-300/70">/ 10</span>
          </div>

          {currentMovie.runtime && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-cinema-200 text-xs font-medium backdrop-blur-md">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentMovie.runtime} min</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-cinema-200 text-xs font-medium backdrop-blur-md">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {currentMovie.releaseDate
                ? new Date(currentMovie.releaseDate).getFullYear()
                : '2024'}
            </span>
          </div>

          {currentMovie.genres?.slice(0, 3).map((g) => (
            <span
              key={g}
              className="px-2.5 py-1 bg-cinema-800/80 border border-cinema-700/60 rounded-full text-cinema-300 text-xs font-medium"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3 drop-shadow-md">
          {currentMovie.title}
        </h1>

        {/* Overview Synopsis */}
        <p className="text-sm sm:text-base text-cinema-300 line-clamp-2 sm:line-clamp-3 mb-6 max-w-2xl leading-relaxed">
          {currentMovie.overview}
        </p>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <Link
            to={`/movies/${currentMovie._id || currentMovie.tmdbId}`}
            className="flex items-center gap-2.5 px-7 py-3.5 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-2xl transition shadow-glow-crimson group/btn"
          >
            <Ticket className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
            <span>Book Tickets</span>
          </Link>
        </div>
      </div>

      {/* Explicit Carousel Controls */}
      {movies.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-cinema-900/70 hover:bg-cinema-850 border border-cinema-700/50 text-white transition backdrop-blur-sm opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-cinema-900/70 hover:bg-cinema-850 border border-cinema-700/50 text-white transition backdrop-blur-sm opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-4 right-8 flex items-center gap-2 z-20">
            {movies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsImageLoaded(false);
                  setCurrentIndex(idx);
                }}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-8 bg-crimson-500'
                    : 'w-2 bg-cinema-600 hover:bg-cinema-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
