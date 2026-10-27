import React, { useEffect, useState } from 'react';
import { Building2, Search, MapPin, Sparkles } from 'lucide-react';
import api from '../services/api.js';
import { ICinema } from '../types/index.js';
import { CinemaCard } from '../components/CinemaCard.js';
import { useLocation } from '../context/LocationContext.js';

export const CinemasPage: React.FC = () => {
  const { selectedCity, setSelectedCity, availableCities, userCoords } = useLocation();
  const [cinemas, setCinemas] = useState<ICinema[]>([]);
  const [search, setSearch] = useState('');
  const [activeCityTab, setActiveCityTab] = useState<string>(selectedCity || 'All');
  const [isLoading, setIsLoading] = useState(true);

  // Sync activeCityTab with selectedCity if it changes
  useEffect(() => {
    if (selectedCity) {
      setActiveCityTab(selectedCity);
    }
  }, [selectedCity]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCinemas() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();

        if (activeCityTab && activeCityTab !== 'All') {
          params.append('city', activeCityTab);
        } else if (userCoords) {
          params.append('lat', userCoords.latitude.toString());
          params.append('lng', userCoords.longitude.toString());
          params.append('radius', '100');
        }

        if (search.trim()) {
          params.append('search', search.trim());
        }

        const res = await api.get(`/cinemas?${params.toString()}`, { signal: controller.signal });
        if (res.data.success) {
          setCinemas(res.data.cinemas || []);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.error('Failed to load cinemas:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadCinemas();
    return () => controller.abort();
  }, [activeCityTab, userCoords, search]);

  const handleCityTabClick = (city: string) => {
    setActiveCityTab(city);
    if (city !== 'All') {
      setSelectedCity(city);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-crimson-500" />
            {activeCityTab === 'All' ? 'Multiplexes Across Cities' : `Cinemas in ${activeCityTab}`}
          </h1>
          <p className="text-sm text-cinema-400 mt-1">
            Browse premier multiplexes equipped with IMAX Laser, 4DX, and Dolby Atmos.
          </p>
        </div>

        {/* City Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleCityTabClick('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              activeCityTab === 'All'
                ? 'bg-crimson-600 border-crimson-500 text-white shadow-glow-crimson-sm'
                : 'bg-cinema-900 border-cinema-800 text-cinema-300 hover:text-white'
            }`}
          >
            All Cities
          </button>
          {['Indore', 'Nagpur', 'Mumbai', 'Delhi NCR', 'Bengaluru'].map((city) => (
            <button
              key={city}
              onClick={() => handleCityTabClick(city)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                activeCityTab.toLowerCase() === city.toLowerCase()
                  ? 'bg-crimson-600 border-crimson-500 text-white shadow-glow-crimson-sm'
                  : 'bg-cinema-900 border-cinema-800 text-cinema-300 hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cinema by name, mall, or locality..."
          className="w-full pl-10 pr-4 py-2.5 bg-cinema-900 border border-cinema-750 focus:border-crimson-500 rounded-xl text-sm text-white placeholder-cinema-500 outline-none transition"
        />
      </div>

      {/* Cinemas Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-cinema-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : cinemas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cinemas.map((cinema) => (
            <CinemaCard key={cinema._id} cinema={cinema} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-cinema-900 border border-cinema-800 rounded-3xl space-y-3">
          <MapPin className="w-12 h-12 text-cinema-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            No Cinemas Found in {activeCityTab}
          </h3>
          <p className="text-sm text-cinema-400 max-w-md mx-auto leading-relaxed">
            There are currently no cinema records configured in {activeCityTab}. Try viewing all cities or selecting another hub below.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {['All', 'Nagpur', 'Mumbai', 'Bengaluru', 'Delhi NCR'].map((city) => (
              <button
                key={city}
                onClick={() => handleCityTabClick(city)}
                className="px-4 py-2 bg-cinema-850 hover:bg-crimson-600 border border-cinema-750 text-cinema-200 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                {city === 'All' ? 'View All Cities' : city}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
