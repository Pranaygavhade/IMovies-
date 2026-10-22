const City = require('../models/City');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Standard Haversine distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// @desc    Get all active cities
// @route   GET /api/v1/cities
// @access  Public
exports.getCities = async (req, res, next) => {
  try {
    const cities = await City.find({ isActive: true }).sort({ name: 1 });
    const defaultCity = process.env.DEFAULT_CITY || 'Bhilai';
    return sendSuccess(res, { cities, defaultCity }, 'Active cinema cities retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearest supported city by coordinates
// @route   GET /api/v1/cities/nearest?lat=&lng=
// @access  Public
exports.getNearestCity = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return sendError(res, 'Coordinates lat and lng are required', 400);
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return sendError(res, 'Invalid coordinates provided', 400);
    }

    // Reverse geocode via OpenStreetMap Nominatim for human-readable locality
    let detectedAreaName = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=10&addressdetails=1`,
        {
          headers: { 'User-Agent': 'IMovies-Ticket-Platform/1.0' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const addr = geoData.address || {};
        detectedAreaName =
          addr.city ||
          addr.town ||
          addr.suburb ||
          addr.district ||
          addr.state_district ||
          addr.county ||
          addr.state ||
          geoData.name ||
          null;
      }
    } catch {
      // Gracefully continue with nearest coordinate calculation if external reverse geocoding is slow/unreachable
    }

    const cities = await City.find({ isActive: true });
    if (cities.length === 0) {
      return sendSuccess(res, {
        city: { name: 'Bhilai', state: 'Chhattisgarh' },
        distanceKm: 0,
        detectedArea: detectedAreaName || 'Bhilai',
        inRange: true,
      });
    }

    let nearestCity = null;
    let minDistance = Infinity;

    for (const c of cities) {
      const dist = calculateDistanceKm(userLat, userLng, c.lat, c.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestCity = c;
      }
    }

    const distanceKm = Math.round(minDistance * 10) / 10;
    const inRange = distanceKm <= 120; // Within 120 km of a supported cinema hub

    return sendSuccess(
      res,
      {
        city: nearestCity,
        distanceKm,
        detectedArea: detectedAreaName,
        inRange,
      },
      inRange
        ? `Matched to nearest cinema hub: ${nearestCity.name}`
        : `Nearest cinema hub is ${nearestCity.name} (${distanceKm} km away)`
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Detect city by IP address
// @route   GET /api/v1/cities/detect-ip
// @access  Public
exports.detectCityByIp = async (req, res, next) => {
  try {
    const defaultCity = process.env.DEFAULT_CITY || 'Bhilai';
    const city = await City.findOne({ name: defaultCity, isActive: true });

    return sendSuccess(
      res,
      {
        city: city || { name: 'Bhilai', state: 'Chhattisgarh', lat: 21.2195, lng: 81.3227 },
        detectedFrom: 'fallback_default',
        isDefaultFallback: true,
      },
      'Default cinema hub loaded'
    );
  } catch (error) {
    next(error);
  }
};
