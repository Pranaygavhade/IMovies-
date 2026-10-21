import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (id, { rejectWithValue }) => {
    try {
      await api.put(`/notifications/${id}/read`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update notification');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.put('/notifications/read-all');
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update notifications');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const notif = state.notifications.find((n) => n._id === id);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
