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
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/movies/${id}`);
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
      const response = await api.get('/theatres/cities');
      return response.data.data.cities;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch cities');
    }
  }
);

const movieSlice = createSlice({
  name: 'movies',
  initialState: {
    movies: [],
    nowShowing: [],
    upcoming: [],
    currentMovie: null,
    availableDates: [],
    movieShows: [],
    cities: ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Chennai'],
    selectedCity: localStorage.getItem('imovies_city') || 'Mumbai',
    pagination: { total: 0, page: 1, limit: 12, pages: 1 },
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload;
      localStorage.setItem('imovies_city', action.payload);
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
      .addCase(fetchCities.fulfilled, (state, action) => {
        if (action.payload && action.payload.length > 0) {
          state.cities = action.payload;
        }
      });
  },
});

export const { setSelectedCity, clearCurrentMovie } = movieSlice.actions;
export default movieSlice.reducer;
