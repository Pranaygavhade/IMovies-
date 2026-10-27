import React from 'react';
import { MapPin, Navigation, X, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useLocation } from '../context/LocationContext.js';

export const LocationModal: React.FC = () => {
  const {
    selectedCity,
    locationSource,
    setSelectedCity,
    clearCity,
    availableCities,
    detectLocation,
    isDetecting,
    locationError,
    isLocationModalOpen,
    closeLocationModal,
  } = useLocation();

  if (!isLocationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-cinema-900 border border-cinema-750 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cinema-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-crimson-500/10 text-crimson-500 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Select Your City</h2>
              <p className="text-xs text-cinema-400">Discover cinemas and bookable showtimes near you</p>
            </div>
          </div>
          <button
            onClick={closeLocationModal}
            className="p-2 text-cinema-400 hover:text-white rounded-lg hover:bg-cinema-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Detect Location Button */}
          <button
            onClick={detectLocation}
            disabled={isDetecting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition shadow-glow-crimson-sm group"
          >
            <Navigation className={`w-5 h-5 ${isDetecting ? 'animate-spin' : 'group-hover:rotate-45'} transition-transform`} />
            {isDetecting ? 'Detecting your coordinates...' : 'Detect my location'}
          </button>

          {/* Location Error alert if detection/geocoding failed */}
          {locationError && (
            <div className="flex items-start gap-3 p-4 bg-crimson-950/70 border border-crimson-900/90 rounded-2xl text-crimson-200 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 text-crimson-400 shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Current Selection Status Banner */}
          {selectedCity ? (
            <div className="flex items-center justify-between p-3.5 bg-cinema-850 border border-cinema-750 rounded-2xl text-xs">
              <div className="flex items-center gap-2 text-cinema-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Current city:{' '}
                  <strong className="text-white font-bold">{selectedCity}</strong>
                  {locationSource === 'detected' && (
                    <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px]">
                      GPS Detected
                    </span>
                  )}
                  {locationSource === 'saved' && (
                    <span className="ml-2 px-2 py-0.5 bg-cinema-750 text-cinema-300 font-medium rounded text-[10px]">
                      Saved
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={clearCity}
                className="flex items-center gap-1 text-[11px] text-cinema-400 hover:text-crimson-400 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>
          ) : (
            <div className="p-3 bg-cinema-850/60 border border-cinema-800 rounded-2xl text-center text-xs text-cinema-400">
              No city selected yet. Select a city below to view local cinema schedules.
            </div>
          )}

          {/* Popular Cities Grid */}
          <div>
            <h3 className="text-xs font-semibold text-cinema-400 uppercase tracking-wider mb-3">
              Popular Cinema Hubs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {availableCities.map((city) => {
                const isSelected = selectedCity?.toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-4 py-3 rounded-2xl text-sm font-medium text-left transition border ${
                      isSelected
                        ? 'bg-crimson-500/15 border-crimson-500 text-white shadow-glow-crimson-sm font-bold'
                        : 'bg-cinema-850 hover:bg-cinema-800 border-cinema-750 text-cinema-200 hover:text-white'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-cinema-950 border-t border-cinema-800 text-center text-xs text-cinema-500">
          Cinema availability and showtimes are dynamically updated based on your selected city.
        </div>
      </div>
    </div>
  );
};
