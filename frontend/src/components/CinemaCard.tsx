import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Sparkles, ChevronRight } from 'lucide-react';
import { ICinema } from '../types/index.js';

interface CinemaCardProps {
  cinema: ICinema;
}

export const CinemaCard: React.FC<CinemaCardProps> = ({ cinema }) => {
  return (
    <div className="bg-cinema-900 border border-cinema-800 hover:border-cinema-700 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-cinema-card group">
      <div>
        {/* Cinema Name & Distance Pill */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-crimson-400 transition leading-snug">
            {cinema.name}
          </h3>
          {cinema.distance !== undefined && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-crimson-950/60 border border-crimson-900/60 rounded-full text-crimson-400 text-xs font-semibold shrink-0">
              <Navigation className="w-3 h-3 rotate-45" />
              <span>{cinema.distance} km</span>
            </div>
          )}
        </div>

        {/* Address & Locality */}
        <div className="flex items-start gap-2 text-cinema-400 text-xs mb-4">
          <MapPin className="w-3.5 h-3.5 text-cinema-500 shrink-0 mt-0.5" />
          <span className="line-clamp-2">
            {cinema.address}, {cinema.locality}, {cinema.city}
          </span>
        </div>

        {/* Amenities Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {cinema.amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-cinema-850 border border-cinema-750/70 rounded-full text-[11px] text-cinema-300"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-400/80" />
              {amenity}
            </span>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-cinema-800 flex items-center justify-between">
        <span className="text-xs text-cinema-400 font-medium">Multiple screens available</span>
        <Link
          to={`/cinemas/${cinema._id}`}
          className="flex items-center gap-1 px-4 py-2 bg-crimson-600/10 hover:bg-crimson-600 text-crimson-400 hover:text-white font-semibold text-xs rounded-xl transition border border-crimson-600/30"
        >
          <span>View Shows</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
