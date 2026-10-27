import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  genres: string[];
  languages: string[];
  selectedGenre: string;
  selectedLanguage: string;
  selectedStatus: string;
  sortBy: string;
  onGenreChange: (genre: string) => void;
  onLanguageChange: (language: string) => void;
  onStatusChange: (status: string) => void;
  onSortChange: (sort: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  genres,
  languages,
  selectedGenre,
  selectedLanguage,
  selectedStatus,
  sortBy,
  onGenreChange,
  onLanguageChange,
  onStatusChange,
  onSortChange,
}) => {
  return (
    <div className="bg-cinema-900 border border-cinema-800 rounded-2xl p-4 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Pills (Now Showing vs Upcoming) */}
        <div className="flex items-center gap-1.5 p-1 bg-cinema-850 border border-cinema-750 rounded-xl">
          <button
            onClick={() => onStatusChange('now_showing')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedStatus === 'now_showing'
                ? 'bg-crimson-600 text-white shadow-glow-crimson-sm'
                : 'text-cinema-400 hover:text-white'
            }`}
          >
            Now Showing
          </button>
          <button
            onClick={() => onStatusChange('upcoming')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedStatus === 'upcoming'
                ? 'bg-crimson-600 text-white shadow-glow-crimson-sm'
                : 'text-cinema-400 hover:text-white'
            }`}
          >
            Coming Soon
          </button>
          <button
            onClick={() => onStatusChange('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedStatus === 'all'
                ? 'bg-crimson-600 text-white shadow-glow-crimson-sm'
                : 'text-cinema-400 hover:text-white'
            }`}
          >
            All
          </button>
        </div>

        {/* Dropdown Filters (Genre, Language, Sort) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Genre select */}
          <div className="relative">
            <select
              value={selectedGenre}
              onChange={(e) => onGenreChange(e.target.value)}
              className="px-3.5 py-2 bg-cinema-850 border border-cinema-750 rounded-xl text-xs font-medium text-cinema-200 outline-none hover:border-cinema-600 focus:border-crimson-500 transition cursor-pointer"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Language select */}
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="px-3.5 py-2 bg-cinema-850 border border-cinema-750 rounded-xl text-xs font-medium text-cinema-200 outline-none hover:border-cinema-600 focus:border-crimson-500 transition cursor-pointer"
            >
              <option value="">All Languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cinema-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3.5 py-2 bg-cinema-850 border border-cinema-750 rounded-xl text-xs font-medium text-cinema-200 outline-none hover:border-cinema-600 focus:border-crimson-500 transition cursor-pointer"
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Top Rated</option>
              <option value="releaseDate">Latest Release</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
