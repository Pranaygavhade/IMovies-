import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

export type LocationSource = 'unselected' | 'saved' | 'detected';

interface LocationContextType {
  selectedCity: string | null;
  locationSource: LocationSource;
  setSelectedCity: (city: string) => void;
  clearCity: () => void;
  availableCities: string[];
  userCoords: { latitude: number; longitude: number } | null;
  detectLocation: () => Promise<void>;
  isDetecting: boolean;
  locationError: string | null;
  isLocationModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const POPULAR_CINEMA_CITIES = [
  'Indore',
  'Nagpur',
  'Mumbai',
  'Bengaluru',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Chandigarh',
];

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storedCity = localStorage.getItem('imovies_city');

  const [selectedCity, setSelectedCityState] = useState<string | null>(() => storedCity || null);
  const [locationSource, setLocationSource] = useState<LocationSource>(
    () => (storedCity ? 'saved' : 'unselected')
  );
  const [availableCities, setAvailableCities] = useState<string[]>(POPULAR_CINEMA_CITIES);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Fetch active cities from backend and merge with popular hubs
  useEffect(() => {
    async function fetchCities() {
      try {
        const res = await api.get('/cinemas/cities');
        if (res.data.success && Array.isArray(res.data.cities) && res.data.cities.length > 0) {
          const merged = Array.from(new Set([...res.data.cities, ...POPULAR_CINEMA_CITIES]));
          setAvailableCities(merged);
        }
      } catch (err) {
        console.warn('Could not fetch cities from backend, using default list:', err);
      }
    }
    fetchCities();
  }, []);

  const setSelectedCity = (city: string) => {
    const trimmed = city.trim();
    setSelectedCityState(trimmed);
    localStorage.setItem('imovies_city', trimmed);
    setLocationSource('saved');
    setIsLocationModalOpen(false);
    setLocationError(null);
  };

  const clearCity = () => {
    setSelectedCityState(null);
    localStorage.removeItem('imovies_city');
    setLocationSource('unselected');
    setLocationError(null);
  };

  const detectLocation = async (): Promise<void> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });

        try {
          // Query backend reverse geocoding
          const res = await api.get(`/cinemas/reverse-geocode?lat=${latitude}&lng=${longitude}`);

          if (res.data.success && res.data.city) {
            const detectedCity = res.data.city;
            setSelectedCityState(detectedCity);
            localStorage.setItem('imovies_city', detectedCity);
            setLocationSource('detected');
            setIsDetecting(false);
            setIsLocationModalOpen(false);
            return;
          }

          // If backend couldn't match a city directly, notify user without guessing
          setLocationError(
            `GPS coordinates retrieved (${latitude.toFixed(2)}, ${longitude.toFixed(2)}), but no local cinema hub was matched. Please choose your city from the list below.`
          );
        } catch (apiErr: any) {
          setLocationError(
            'Unable to resolve your GPS coordinates to a city. Please choose your city manually.'
          );
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              'Location permission was denied. Please select your city manually from the list below.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              'Location information is currently unavailable. Please select your city manually.'
            );
            break;
          case error.TIMEOUT:
            setLocationError(
              'Location detection timed out. Please select your city manually from the list below.'
            );
            break;
          default:
            setLocationError('An error occurred while detecting your location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  return (
    <LocationContext.Provider
      value={{
        selectedCity,
        locationSource,
        setSelectedCity,
        clearCity,
        availableCities,
        userCoords,
        detectLocation,
        isDetecting,
        locationError,
        isLocationModalOpen,
        openLocationModal: () => setIsLocationModalOpen(true),
        closeLocationModal: () => setIsLocationModalOpen(false),
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
