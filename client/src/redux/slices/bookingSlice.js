import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchShowWithSeats = createAsyncThunk(
  'booking/fetchShowWithSeats',
  async (showId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/shows/${showId}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch show seats');
    }
  }
);

export const lockSelectedSeats = createAsyncThunk(
  'booking/lockSelectedSeats',
  async ({ showId, seatNumbers }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/shows/${showId}/lock-seats`, { seatNumbers });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to lock seats');
    }
  }
);

export const releaseSelectedSeats = createAsyncThunk(
  'booking/releaseSelectedSeats',
  async ({ showId, seatNumbers }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/shows/${showId}/release-seats`, { seatNumbers });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to release seats');
    }
  }
);

export const createBookingOrder = createAsyncThunk(
  'booking/createBookingOrder',
  async ({ showId, seatNumbers, paymentMethod, paymentDetails }, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings', {
        showId,
        seatNumbers,
        paymentMethod,
        paymentDetails,
      });
      return response.data.data.booking;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Booking failed');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/my');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`);
      return { bookingId, ...response.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    currentShow: null,
    seats: [],
    selectedSeats: [],
    totalAmount: 0,
    lockExpiresAt: null,
    activeBooking: null,
    myBookings: [],
    upcomingBookings: [],
    pastBookings: [],
    loading: false,
    lockingLoading: false,
    error: null,
  },
  reducers: {
    toggleSeatSelect: (state, action) => {
      const seat = action.payload;
      const index = state.selectedSeats.findIndex((s) => s._id === seat._id);

      if (index >= 0) {
        state.selectedSeats.splice(index, 1);
      } else {
        if (state.selectedSeats.length >= 8) {
          return;
        }
        state.selectedSeats.push(seat);
      }

      state.totalAmount = state.selectedSeats.reduce((sum, s) => sum + s.price, 0);
    },
    clearSelectedSeats: (state) => {
      state.selectedSeats = [];
      state.totalAmount = 0;
      state.lockExpiresAt = null;
    },
    clearActiveBooking: (state) => {
      state.activeBooking = null;
    },
    updateSeatStatusRealtime: (state, action) => {
      const { seats: affectedSeatNumbers, status, lockedBy, lockExpiresAt } = action.payload;
      if (!Array.isArray(affectedSeatNumbers)) return;

      state.seats = state.seats.map((seat) => {
        if (affectedSeatNumbers.includes(seat.seatNumber)) {
          return {
            ...seat,
            status,
            lockedBy: lockedBy || null,
            lockExpiresAt: lockExpiresAt || null,
          };
        }
        return seat;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch show with seats
      .addCase(fetchShowWithSeats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShowWithSeats.fulfilled, (state, action) => {
        state.loading = false;
        state.currentShow = action.payload.show;
        state.seats = action.payload.seats;
        state.selectedSeats = [];
        state.totalAmount = 0;
      })
      .addCase(fetchShowWithSeats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Lock seats
      .addCase(lockSelectedSeats.pending, (state) => {
        state.lockingLoading = true;
        state.error = null;
      })
      .addCase(lockSelectedSeats.fulfilled, (state, action) => {
        state.lockingLoading = false;
        state.lockExpiresAt = action.payload.lockExpiresAt;
      })
      .addCase(lockSelectedSeats.rejected, (state, action) => {
        state.lockingLoading = false;
        state.error = action.payload;
      })
      // Release seats
      .addCase(releaseSelectedSeats.fulfilled, (state) => {
        state.lockExpiresAt = null;
      })
      // Create booking
      .addCase(createBookingOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBookingOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.activeBooking = action.payload;
        state.selectedSeats = [];
        state.totalAmount = 0;
        state.lockExpiresAt = null;
      })
      .addCase(createBookingOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch my bookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.myBookings = action.payload.all;
        state.upcomingBookings = action.payload.upcoming;
        state.pastBookings = action.payload.past;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const { bookingId, refundStatus } = action.payload;
        state.myBookings = state.myBookings.map((b) =>
          b._id === bookingId ? { ...b, status: 'cancelled', refundStatus } : b
        );
        state.upcomingBookings = state.upcomingBookings.filter((b) => b._id !== bookingId);
      });
  },
});

export const {
  toggleSeatSelect,
  clearSelectedSeats,
  clearActiveBooking,
  updateSeatStatusRealtime,
} = bookingSlice.actions;

export default bookingSlice.reducer;
