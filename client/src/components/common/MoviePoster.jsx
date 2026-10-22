import React, { useState } from 'react';
import { Film } from 'lucide-react';

/**
 * High-performance, accessible MoviePoster component
 * - Enforces authentic 2:3 cinema portrait aspect ratio
 * - Prevents layout shifts (CLS)
 * - Graceful fallback placeholder on image error or missing URL
 * - Lazy loading by default
 */
const MoviePoster = ({
  src,
  title = 'Movie Poster',
  certificate,
  language,
  className = '',
  style = {},
  priority = false,
  aspectRatio = '2 / 3',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const containerStyle = {
    position: 'relative',
    aspectRatio: aspectRatio,
    overflow: 'hidden',
    backgroundColor: '#141424',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  if (!src || hasError) {
    return (
      <div
        className={`movie-poster-fallback p-3 text-center d-flex flex-column justify-content-between ${className}`}
        style={{
          ...containerStyle,
          background: 'linear-gradient(145deg, #18182c 0%, #0d0d18 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="d-flex justify-content-between w-100">
          {certificate && (
            <span
              className="badge bg-danger bg-opacity-75 text-white fw-bold px-2 py-0.5"
              style={{ fontSize: '0.65rem' }}
            >
              {certificate}
            </span>
          )}
          {language && (
            <span
              className="badge bg-dark border border-secondary text-light px-2 py-0.5"
              style={{ fontSize: '0.65rem' }}
            >
              {language}
            </span>
          )}
        </div>

        <div className="my-auto py-2">
          <div
            className="d-inline-flex p-3 rounded-circle mb-2"
            style={{ backgroundColor: 'rgba(229, 9, 20, 0.12)', color: '#e50914' }}
          >
            <Film size={28} />
          </div>
          <div
            className="text-white fw-bold small text-truncate-2 px-1"
            style={{
              lineHeight: 1.3,
              fontSize: '0.85rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
        </div>

        <div className="w-100 text-center">
          <span
            className="text-uppercase fw-bold text-secondary"
            style={{ fontSize: '0.6rem', letterSpacing: '1px' }}
          >
            IMOVIES CINEMA
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`movie-poster-wrap ${className}`} style={containerStyle}>
      {!isLoaded && (
        <div
          className="position-absolute inset-0 w-100 h-100 skeleton-box"
          style={{ zIndex: 1 }}
        />
      )}
      <img
        src={src}
        alt={title}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className="w-100 h-100 object-fit-cover transition-transform"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.25s ease-in-out, transform 0.35s ease',
        }}
      />
    </div>
  );
};

export default MoviePoster;
