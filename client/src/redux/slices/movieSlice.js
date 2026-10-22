import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchMovies = createAsyncThunk(
  'movies/fetchMovies',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/movies', { params });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch movies');
    }
  }
);

export const fetchMovieById = createAsyncThunk(
  'movies/fetchMovieById',
  async ({ id, city }, { getState, rejectWithValue }) => {
    try {
      const activeCity = city || getState().movies.selectedCity || 'Bhilai';
      const response = await api.get(`/movies/${id}`, { params: { city: activeCity } });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch movie');
    }
  }
);

export const fetchCities = createAsyncThunk(
  'movies/fetchCities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/cities');
      return response.data.data.cities;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch cities');
    }
  }
);

export const detectNearestCity = createAsyncThunk(
  'movies/detectNearestCity',
  async ({ lat, lng }, { rejectWithValue }) => {
    try {
      const response = await api.get('/cities/nearest', { params: { lat, lng } });
      return { ...response.data.data, userLat: lat, userLng: lng };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to find nearest city');
    }
  }
);

export const detectCityByIp = createAsyncThunk(
  'movies/detectCityByIp',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/cities/detect-ip');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to detect city by IP');
    }
  }
);

const movieSlice = createSlice({
  name: 'movies',
  initialState: {
    movies: [],
    nowShowing: [],
    upcoming: [],
    trending: [],
    currentMovie: null,
    availableDates: [],
    movieShows: [],
    cities: [
      { name: 'Bhilai', state: 'Chhattisgarh' },
      { name: 'Durg', state: 'Chhattisgarh' },
      { name: 'Raipur', state: 'Chhattisgarh' },
      { name: 'Nagpur', state: 'Maharashtra' },
      { name: 'Bilaspur', state: 'Chhattisgarh' },
      { name: 'Mumbai', state: 'Maharashtra' },
      { name: 'Delhi', state: 'Delhi' },
      { name: 'Bengaluru', state: 'Karnataka' },
      { name: 'Hyderabad', state: 'Telangana' },
      { name: 'Chennai', state: 'Tamil Nadu' },
      { name: 'Pune', state: 'Maharashtra' },
      { name: 'Kolkata', state: 'West Bengal' },
    ],
    selectedCity: localStorage.getItem('imovies_city') || 'Bhilai',
    userLocation: null, // { lat, lng }
    pagination: { total: 0, page: 1, limit: 12, pages: 1 },
    loading: false,
    citiesLoading: false,
    detectingLocation: false,
    error: null,
  },
  reducers: {
    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload;
      localStorage.setItem('imovies_city', action.payload);
    },
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
    },
    clearCurrentMovie: (state) => {
      state.currentMovie = null;
      state.availableDates = [];
      state.movieShows = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch movies
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload.movies;
        state.nowShowing = action.payload.movies.filter((m) => m.status === 'now_showing');
        state.upcoming = action.payload.movies.filter((m) => m.status === 'upcoming');
        state.trending = [...action.payload.movies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single movie
      .addCase(fetchMovieById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovieById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMovie = action.payload.movie;
        state.availableDates = action.payload.availableDates;
        state.movieShows = action.payload.shows;
      })
      .addCase(fetchMovieById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch cities
      .addCase(fetchCities.pending, (state) => {
        state.citiesLoading = true;
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.citiesLoading = false;
        if (action.payload && action.payload.length > 0) {
          state.cities = action.payload;
        }
      })
      .addCase(fetchCities.rejected, (state) => {
        state.citiesLoading = false;
      })
      // Detect nearest city
      .addCase(detectNearestCity.pending, (state) => {
        state.detectingLocation = true;
      })
      .addCase(detectNearestCity.fulfilled, (state, action) => {
        state.detectingLocation = false;
        const cityName = action.payload.city?.name || 'Bhilai';
        state.selectedCity = cityName;
        localStorage.setItem('imovies_city', cityName);
        if (action.payload.userLat && action.payload.userLng) {
          state.userLocation = {
            lat: action.payload.userLat,
            lng: action.payload.userLng,
          };
        }
      })
      .addCase(detectNearestCity.rejected, (state) => {
        state.detectingLocation = false;
      })
      // Detect city by IP
      .addCase(detectCityByIp.fulfilled, (state, action) => {
        const cityName = action.payload.city?.name || 'Bhilai';
        state.selectedCity = cityName;
        localStorage.setItem('imovies_city', cityName);
      });
  },
});

export const { setSelectedCity, setUserLocation, clearCurrentMovie } = movieSlice.actions;

export default movieSlice.reducer;
