import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to IMovies Realtime Socket:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }
  return socket;
};

export const joinShowRoom = (showId) => {
  const s = getSocket();
  if (s) {
    s.emit('join-show', showId);
  }
};

export const leaveShowRoom = (showId) => {
  const s = getSocket();
  if (s) {
    s.emit('leave-show', showId);
  }
};
