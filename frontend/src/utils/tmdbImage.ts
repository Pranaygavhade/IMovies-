const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';

// Elegant SVG fallback for posters
const POSTER_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750" fill="%23111319"><rect width="500" height="750" fill="%23111319"/><rect x="20" y="20" width="460" height="710" rx="16" fill="%23181A22" stroke="%23272B3A" stroke-width="2"/><circle cx="250" cy="330" r="60" fill="%23272B3A"/><path d="M235 300 L275 330 L235 360 Z" fill="%23E50914"/><text x="250" y="440" font-family="sans-serif" font-size="22" font-weight="600" fill="%238A92B2" text-anchor="middle">iMovies</text><text x="250" y="475" font-family="sans-serif" font-size="15" fill="%235A6180" text-anchor="middle">Artwork Unavailable</text></svg>`;

// Elegant SVG fallback for backdrops
const BACKDROP_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="%230B0C10"><rect width="1280" height="720" fill="%230B0C10"/><circle cx="640" cy="320" r="70" fill="%231E212D"/><path d="M625 290 L665 320 L625 350 Z" fill="%23E50914"/><text x="640" y="430" font-family="sans-serif" font-size="28" font-weight="bold" fill="%23B8BFD8" text-anchor="middle">iMovies Experience</text></svg>`;

/**
 * Resolves a portrait poster path to a full TMDB CDN URL or placeholder.
 */
export function getPosterUrl(path: string | null | undefined, size: PosterSize = 'w500'): string {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return POSTER_PLACEHOLDER;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Resolves a landscape backdrop path to a full TMDB CDN URL or placeholder.
 */
export function getBackdropUrl(path: string | null | undefined, size: BackdropSize = 'w1280'): string {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return BACKDROP_PLACEHOLDER;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Handle image error by smoothly substituting fallback placeholder.
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  type: 'poster' | 'backdrop' = 'poster'
) {
  event.currentTarget.src = type === 'poster' ? POSTER_PLACEHOLDER : BACKDROP_PLACEHOLDER;
}
