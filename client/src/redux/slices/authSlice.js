import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

const storedToken = localStorage.getItem('imovies_token');
const storedUser = localStorage.getItem('imovies_user')
  ? JSON.parse(localStorage.getItem('imovies_user'))
  : null;

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  line: 'auth',
  initialState: {
    user: storedUser,
    token: storedToken,
    isAuthenticated: !!storedToken,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('imovies_token');
      localStorage.removeItem('imovies_user');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('imovies_token', action.payload.token);
        localStorage.setItem('imovies_user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('imovies_token', action.payload.token);
        localStorage.setItem('imovies_user', JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch me
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('imovies_user', JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('imovies_token');
        localStorage.removeItem('imovies_user');
      })
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('imovies_user', JSON.stringify(action.payload));
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
