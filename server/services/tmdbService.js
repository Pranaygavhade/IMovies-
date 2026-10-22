const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const { getTodayKolkata, dayjs } = require('../utils/dateUtils');
const logger = require('../config/logger');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_POSTER = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMG_BACKDROP = 'https://image.tmdb.org/t/p/w1280';

// Supported Indian & major languages
const LANGUAGE_MAP = {
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  ml: 'Malayalam',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  pa: 'Punjabi',
  en: 'English',
};

/**
 * Load curated fallback movies from server/seed/currentMovies.json
 */
const loadCuratedFallbackMovies = async () => {
  try {
    const filePath = path.join(__dirname, '../seed/currentMovies.json');
    if (!fs.existsSync(filePath)) {
      logger.warn('[TMDB Service] Fallback file currentMovies.json not found!');
      return 0;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    logger.info(`[TMDB Service] Loading ${data.length} curated fallback movies from currentMovies.json (Source: Curated Fallback)...`);

    let upsertedCount = 0;
    for (const item of data) {
      // Upsert by title or tmdbId
      const filter = item.tmdbId ? { tmdbId: item.tmdbId } : { title: item.title };

      await Movie.findOneAndUpdate(
        filter,
        {
          $setOnInsert: {
            title: item.title,
            description: item.description,
            genres: item.genres,
            language: item.language,
            runtime: item.runtime || 120,
            certification: item.certification || 'UA',
            releaseDate: new Date(item.releaseDate),
            poster: item.poster,
            backdrop: item.backdrop || '',
            trailerUrl: item.trailerUrl || '',
            cast: item.cast || [],
            director: item.director || '',
            status: item.status || 'now_showing',
            averageRating: item.averageRating || 0,
            ratingCount: item.ratingCount || 0,
            popularity: item.popularity || 80,
            tmdbId: item.tmdbId,
            isCustom: false,
          },
        },
        { upsert: true, new: true }
      );
      upsertedCount++;
    }

    logger.info(`[TMDB Service] Successfully synced ${upsertedCount} movies from Curated Fallback.`);
    return { count: upsertedCount, source: 'curated_fallback' };
  } catch (error) {
    logger.error(`[TMDB Service] Error loading curated fallback movies: ${error.message}`);
    return { count: 0, source: 'error', error: error.message };
  }
};

/**
 * Fetch and upsert live movies from TMDB API
 */
const syncFromTMDB = async (apiKey, region = 'IN') => {
  logger.info(`[TMDB Service] Contacting TMDB API with region=${region} (Source: Live TMDB)...`);

  const axiosInstance = axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
      api_key: apiKey,
      region,
    },
    timeout: 10000,
  });

  // 1. Fetch Now Playing, Upcoming, and Indian Discover movies
  const todayStr = getTodayKolkata();
  const threeMonthsAgo = dayjs(todayStr).subtract(90, 'day').format('YYYY-MM-DD');
  const oneMonthAhead = dayjs(todayStr).add(30, 'day').format('YYYY-MM-DD');

  const [nowPlayingRes, upcomingRes, discoverRes] = await Promise.all([
    axiosInstance.get('/movie/now_playing', { params: { page: 1 } }),
    axiosInstance.get('/movie/upcoming', { params: { page: 1 } }),
    axiosInstance.get('/discover/movie', {
      params: {
        'primary_release_date.gte': threeMonthsAgo,
        'primary_release_date.lte': oneMonthAhead,
        with_original_language: 'hi|te|ta|ml|kn|bn|mr|pa|en',
        sort_by: 'popularity.desc',
        page: 1,
      },
    }),
  ]);

  const rawList = [
    ...(nowPlayingRes.data.results || []),
    ...(upcomingRes.data.results || []),
    ...(discoverRes.data.results || []),
  ];

  // De-duplicate by TMDB ID
  const uniqueMoviesMap = new Map();
  for (const m of rawList) {
    if (m.id && !uniqueMoviesMap.has(m.id)) {
      uniqueMoviesMap.set(m.id, m);
    }
  }

  const tmdbMovies = Array.from(uniqueMoviesMap.values()).slice(0, 30);
  logger.info(`[TMDB Service] Found ${tmdbMovies.length} unique candidates from TMDB. Fetching details...`);

  let syncedCount = 0;

  for (const m of tmdbMovies) {
    try {
      const detailsRes = await axiosInstance.get(`/movie/${m.id}`, {
        params: {
          append_to_response: 'credits,videos,release_dates',
        },
      });

      const details = detailsRes.data;

      // Check if movie already exists in DB and is marked custom by admin
      const existing = await Movie.findOne({ tmdbId: details.id });
      if (existing && existing.isCustom) {
        continue; // Respect manual admin overrides
      }

      // Title & Overview
      const title = details.title || details.original_title || 'Untitled';
      const description = details.overview || 'Experience this spectacle on the big screen with surround sound.';
      const genres = (details.genres || []).map((g) => g.name).filter(Boolean);
      const runtime = details.runtime && details.runtime > 0 ? details.runtime : 130;

      // Indian certification lookup
      let certification = 'UA';
      if (details.release_dates && details.release_dates.results) {
        const inRelease = details.release_dates.results.find((r) => r.iso_3166_1 === 'IN');
        if (inRelease && inRelease.release_dates) {
          const certObj = inRelease.release_dates.find((rd) => rd.certification);
          if (certObj && ['U', 'UA', 'A'].includes(certObj.certification)) {
            certification = certObj.certification;
          }
        }
      }

      // Cast & Director
      const cast = (details.credits?.cast || []).slice(0, 8).map((c) => c.name);
      const directorObj = (details.credits?.crew || []).find((c) => c.job === 'Director');
      const director = directorObj ? directorObj.name : '';

      // Media
      const poster = details.poster_path
        ? `${TMDB_IMG_POSTER}${details.poster_path}`
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
      const backdrop = details.backdrop_path
        ? `${TMDB_IMG_BACKDROP}${details.backdrop_path}`
        : 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=1400&q=80';

      // YouTube trailer key
      let trailerUrl = '';
      if (details.videos?.results) {
        const trailer = details.videos.results.find(
          (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        if (trailer && trailer.key) {
          trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        }
      }

      // Language
      const langCode = details.original_language || 'hi';
      const language = LANGUAGE_MAP[langCode] || details.spoken_languages?.[0]?.english_name || 'Hindi';

      // Release date & status
      const releaseDate = details.release_date ? new Date(details.release_date) : new Date(todayStr);
      const isPastOrToday = dayjs(releaseDate).isBefore(dayjs(todayStr).add(1, 'day'));
      const status = isPastOrToday ? 'now_showing' : 'upcoming';

      const updateData = {
        title,
        description,
        genres: genres.length > 0 ? genres : ['Action', 'Drama'],
        language,
        runtime,
        certification,
        releaseDate,
        poster,
        backdrop,
        trailerUrl,
        cast,
        director,
        status,
        popularity: details.popularity || 50,
        tmdbId: details.id,
      };

      await Movie.findOneAndUpdate({ tmdbId: details.id }, { $set: updateData }, { upsert: true, new: true });
      syncedCount++;
    } catch (err) {
      logger.warn(`[TMDB Service] Failed to process movie ${m.id} (${m.title}): ${err.message}`);
    }
  }

  logger.info(`[TMDB Service] Successfully synced ${syncedCount} movies from TMDB API.`);
  return { count: syncedCount, source: 'tmdb' };
};

/**
 * Archive movies older than 6 weeks with no active shows
 */
const archiveOldMovies = async () => {
  try {
    const sixWeeksAgo = dayjs(getTodayKolkata()).subtract(42, 'day').toDate();

    // Find now_showing movies older than 6 weeks
    const oldCandidates = await Movie.find({
      status: 'now_showing',
      releaseDate: { $lt: sixWeeksAgo },
    });

    let archivedCount = 0;
    for (const movie of oldCandidates) {
      const activeShows = await Show.countDocuments({
        movie: movie._id,
        showDate: { $gte: getTodayKolkata() },
        status: 'active',
      });

      if (activeShows === 0) {
        movie.status = 'archived';
        await movie.save();
        archivedCount++;
      }
    }

    if (archivedCount > 0) {
      logger.info(`[TMDB Service] Archived ${archivedCount} older movies with no active shows.`);
    }
  } catch (err) {
    logger.warn(`[TMDB Service] Archive check error: ${err.message}`);
  }
};

/**
 * Main Sync Function: Attempts TMDB API first; on missing key or failure, falls back to curated JSON.
 */
const syncMovies = async () => {
  const apiKey = process.env.TMDB_API_KEY;
  const region = process.env.TMDB_REGION || 'IN';

  let result;
  if (apiKey && apiKey.trim() && apiKey !== 'your_tmdb_api_key_here') {
    try {
      result = await syncFromTMDB(apiKey, region);
    } catch (err) {
      logger.error(`[TMDB Service] TMDB API sync failed (${err.message}). Falling back to curated list.`);
      result = await loadCuratedFallbackMovies();
    }
  } else {
    logger.info('[TMDB Service] TMDB_API_KEY not provided. Loading curated fallback movies.');
    result = await loadCuratedFallbackMovies();
  }

  // Run archive check
  await archiveOldMovies();

  return result;
};

module.exports = {
  syncMovies,
  loadCuratedFallbackMovies,
};
