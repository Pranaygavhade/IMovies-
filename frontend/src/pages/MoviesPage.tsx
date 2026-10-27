import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Film } from 'lucide-react';
import api from '../services/api.js';
import { IMovie } from '../types/index.js';
import { MovieCard } from '../components/MovieCard.js';
import { FilterBar } from '../components/FilterBar.js';

export const MoviesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || 'now_showing';

  const [movies, setMovies] = useState<IMovie[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(statusParam);
  const [sortBy, setSortBy] = useState('popularity');
  const [isLoading, setIsLoading] = useState(true);

  // Sync with searchParams on mount or param change
  useEffect(() => {
    if (statusParam) setSelectedStatus(statusParam);
  }, [statusParam]);

  // Fetch filter options (genres & languages)
  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await api.get('/movies/filters');
        if (res.data.success) {
          setGenres(res.data.genres);
          setLanguages(res.data.languages);
        }
      } catch (err) {
        console.error('Failed to load movie filters:', err);
      }
    }
    loadFilters();
  }, []);

  // Fetch movies based on current filters with request cancellation
  useEffect(() => {
    const controller = new AbortController();

    async function fetchFilteredMovies() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
        if (selectedGenre) params.append('genre', selectedGenre);
        if (selectedLanguage) params.append('language', selectedLanguage);
        if (sortBy) params.append('sort', sortBy);
        if (searchParam) params.append('search', searchParam);

        const res = await api.get(`/movies?${params.toString()}`, { signal: controller.signal });
        if (res.data.success) {
          setMovies(res.data.movies);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.error('Error fetching movies:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchFilteredMovies();
    return () => controller.abort();
  }, [selectedStatus, selectedGenre, selectedLanguage, sortBy, searchParam]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setSearchParams((prev) => {
      prev.set('status', status);
      return prev;
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          {searchParam
            ? `Search Results for "${searchParam}"`
            : selectedStatus === 'upcoming'
            ? 'Upcoming Movies'
            : selectedStatus === 'all'
            ? 'All Movies'
            : 'Now Showing in Cinemas'}
        </h1>
        <p className="text-sm text-cinema-400 mt-1">
          Explore movies with TMDB artwork and book seats at active multiplexes.
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar
        genres={genres}
        languages={languages}
        selectedGenre={selectedGenre}
        selectedLanguage={selectedLanguage}
        selectedStatus={selectedStatus}
        sortBy={sortBy}
        onGenreChange={setSelectedGenre}
        onLanguageChange={setSelectedLanguage}
        onStatusChange={handleStatusChange}
        onSortChange={setSortBy}
      />

      {/* Movies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-full aspect-[2/3] bg-cinema-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie._id || movie.tmdbId} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-cinema-900 border border-cinema-800 rounded-2xl space-y-3">
          <Film className="w-12 h-12 text-cinema-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Movies Found</h3>
          <p className="text-sm text-cinema-400 max-w-md mx-auto">
            We couldn't find any movies matching your current filters. Try resetting your search or selecting another genre.
          </p>
          <button
            onClick={() => {
              setSelectedGenre('');
              setSelectedLanguage('');
              setSelectedStatus('all');
              setSearchParams({});
            }}
            className="px-5 py-2 bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-semibold rounded-xl transition"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
